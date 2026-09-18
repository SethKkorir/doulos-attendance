import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
    X, Camera, Flashlight, RefreshCw, CheckCircle2, AlertTriangle, 
    Sparkles, ShieldCheck, MapPin, Loader2, ArrowRight, HelpCircle,
    Check, MessageSquare, Star, Radio, Send
} from 'lucide-react';
import api from '../api';

// Helper for persistent device ID (Triple-layer ID)
const getCookieId = () => {
    const match = document.cookie.match(/(?:^|; )doulos_device_id=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
};

const getIndexedDBId = () => {
    return new Promise((resolve) => {
        let resolved = false;
        const safeResolve = (val) => {
            if (!resolved) {
                resolved = true;
                resolve(val);
            }
        };
        const timeoutId = setTimeout(() => safeResolve(null), 800);
        try {
            const request = indexedDB.open('DoulosAttendanceDB', 1);
            request.onsuccess = (e) => {
                try {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('device')) {
                        clearTimeout(timeoutId);
                        safeResolve(null);
                        return;
                    }
                    const transaction = db.transaction('device', 'readonly');
                    const store = transaction.objectStore('device');
                    const getReq = store.get('device_id');
                    getReq.onsuccess = () => {
                        clearTimeout(timeoutId);
                        safeResolve(getReq.result ? getReq.result.value : null);
                    };
                    getReq.onerror = () => {
                        clearTimeout(timeoutId);
                        safeResolve(null);
                    };
                } catch {
                    clearTimeout(timeoutId);
                    safeResolve(null);
                }
            };
            request.onerror = () => {
                clearTimeout(timeoutId);
                safeResolve(null);
            };
        } catch {
            clearTimeout(timeoutId);
            safeResolve(null);
        }
    });
};

const getPersistentDeviceId = async () => {
    let localId = null;
    try {
        localId = localStorage.getItem('doulos_device_id');
    } catch {}
    let cookieId = getCookieId();
    if (localId || cookieId) return localId || cookieId;

    let idbId = await getIndexedDBId();
    if (idbId) return idbId;

    const newId = 'DL-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    try { localStorage.setItem('doulos_device_id', newId); } catch {}
    return newId;
};

// Safe scanner stopper helper to eliminate "Cannot stop, scanner is not running or paused"
const safeStopScanner = async (scanner) => {
    if (!scanner) return;
    try {
        let shouldStop = false;
        if (typeof scanner.isScanning === 'boolean' && scanner.isScanning) {
            shouldStop = true;
        } else if (typeof scanner.getState === 'function') {
            const state = scanner.getState();
            if (state === 2 || state === 3) {
                shouldStop = true;
            }
        }
        if (shouldStop) {
            await scanner.stop().catch(() => {});
        }
    } catch (e) {
        // Silently absorb
    }
    try {
        scanner.clear();
    } catch (e) {
        // Silently absorb
    }
};

const PortalQRScanner = ({ isOpen, onClose, studentRegNo, memberName, onCheckInSuccess }) => {
    const scannerId = "doulos-portal-qr-viewfinder";
    // Status states: 'initializing' | 'scanning' | 'processing' | 'question' | 'submitting' | 'success' | 'error'
    const [scannerStatus, setScannerStatus] = useState('initializing');
    const [statusMessage, setStatusMessage] = useState('Starting camera...');
    const [errorMessage, setErrorMessage] = useState('');
    const [torchOn, setTorchOn] = useState(false);
    const [torchSupported, setTorchSupported] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
    const [retryCount, setRetryCount] = useState(0);
    const [checkInResult, setCheckInResult] = useState(null);

    // Question Flow & Pre-validation State
    const [pendingMeetingCode, setPendingMeetingCode] = useState('');
    const [pendingMeetingData, setPendingMeetingData] = useState(null);
    const [pendingUserLocation, setPendingUserLocation] = useState(null);
    const [pendingDeviceId, setPendingDeviceId] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [questionValidationError, setQuestionValidationError] = useState('');

    const html5QrCodeRef = useRef(null);
    const isProcessingRef = useRef(false);

    // Parse meeting code from scanned QR string (supports URLs, query params, JSON, or raw codes)
    const extractMeetingCode = (decodedText) => {
        if (!decodedText) return '';
        const trimmed = decodedText.trim();

        // 1. JSON payload e.g. {"meetingCode": "athi-river"}
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed.meetingCode || parsed.code) {
                    return String(parsed.meetingCode || parsed.code).trim().toLowerCase();
                }
            } catch {}
        }

        // 2. Master Semester QR Token e.g. DOULOS-MASTER-SEP-DEC-2026-XXXX
        if (trimmed.toUpperCase().startsWith('DOULOS-MASTER-')) {
            return 'semester';
        }

        // 3. Standard Doulos Check-in URL e.g. /check-in/athi-river, /check-in/semester, or domain.com/check-in/2026-sep-ar-01
        const urlMatch = trimmed.match(/(?:check-in|meetings|attendance)\/([a-zA-Z0-9_-]+)/i);
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1].toLowerCase();
        }

        // 4. Portal URL fallback
        if (trimmed.toLowerCase().includes('/portal')) {
            return 'semester';
        }

        // 5. Any HTTP URL where code is the pathname ending or ?code= parameter
        try {
            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                const urlObj = new URL(trimmed);
                const codeParam = urlObj.searchParams.get('code') || urlObj.searchParams.get('meetingCode');
                if (codeParam) return codeParam.trim().toLowerCase();

                const segments = urlObj.pathname.split('/').filter(Boolean);
                if (segments.length > 0) {
                    const last = segments[segments.length - 1];
                    if (last && last.length >= 2) return last.toLowerCase();
                }
            }
        } catch {}

        // 6. Raw alphanumeric meeting code (e.g. "athi-river", "valley-road", "semester", "ar-2026", "kampala-01")
        return trimmed.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    };

    // Submits the check-in with the answered question to backend
    const handleSubmitAttendance = async (finalAnswer, cachedLocation = null, cachedDeviceId = null) => {
        setScannerStatus('submitting');
        setStatusMessage('Preparing security credentials...');

        try {
            const code = pendingMeetingCode;

            // 1. Step 1: Issue Single-Use Token (Stage 0)
            setStatusMessage('Issuing secure single-use token...');
            let token = '';
            try {
                const tokenRes = await api.post('/tokens/issue', { meetingCode: code });
                token = tokenRes.data?.token || '';
            } catch (tErr) {
                console.warn('Token issue error, falling back to direct verification:', tErr);
            }

            // 2. Step 2: Acquire Device Signature
            setStatusMessage('Checking device lock signature...');
            const deviceId = cachedDeviceId || pendingDeviceId || await getPersistentDeviceId();

            // 3. Step 3: Location
            const userLocation = cachedLocation || pendingUserLocation || { lat: null, long: null, accuracy: null };

            // 4. Step 4: Submit Attendance to Pipeline (Stages 1 - 7)
            setStatusMessage('Recording official attendance & awarding points...');
            const submitPayload = {
                meetingCode: code,
                token,
                deviceId,
                userLat: userLocation.lat,
                userLong: userLocation.long,
                accuracy: userLocation.accuracy,
                responses: {
                    studentRegNo: studentRegNo.trim().toUpperCase(),
                    studentName: memberName,
                    dailyQuestionAnswer: (finalAnswer || '').trim()
                }
            };

            const res = await api.post('/attendance/submit', submitPayload);

            // 5. Success Flow
            setScannerStatus('success');
            const resultData = {
                meetingName: res.data.meetingName || pendingMeetingData?.name || code.toUpperCase(),
                memberName: res.data.memberName || memberName,
                studentRegNo: studentRegNo.trim().toUpperCase(),
                memberType: res.data.memberType || 'Member',
                pointsAwarded: 10
            };
            setCheckInResult(resultData);

            // Trigger parent state refresh
            if (onCheckInSuccess) {
                onCheckInSuccess({ ...res.data, studentRegNo: studentRegNo.trim().toUpperCase() });
            }

        } catch (err) {
            console.error("Portal QR Check-In Error:", err);
            const errMsg = err.response?.data?.message || 'Check-in failed. Please verify you are at the venue and try again.';
            setScannerStatus('error');
            setErrorMessage(errMsg);
        }
    };

    // Main scanning orchestrator: Strict Pre-Validation Before Showing Any Question
    const handleScannedCode = async (decodedText) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        const code = extractMeetingCode(decodedText);
        if (!code) {
            isProcessingRef.current = false;
            return;
        }

        // Instant haptic feedback (iOS/Android)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate([40, 30, 40]); } catch {}
        }

        // Safely stop camera while processing verification
        if (html5QrCodeRef.current) {
            await safeStopScanner(html5QrCodeRef.current);
        }

        setScannerStatus('processing');
        setStatusMessage('Acquiring location & pre-validating attendance rules...');

        try {
            // 1. Acquire GPS Fix
            let userLocation = { lat: null, long: null, accuracy: null };
            if (navigator.geolocation) {
                try {
                    const getPosition = (opts) => new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, opts));
                    let pos;
                    try {
                        pos = await getPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
                    } catch {
                        pos = await getPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
                    }
                    userLocation.lat = pos.coords.latitude;
                    userLocation.long = pos.coords.longitude;
                    userLocation.accuracy = pos.coords.accuracy || 0;
                } catch (geoErr) {
                    console.warn("GPS acquire error in portal scanner:", geoErr);
                }
            }

            // 2. Acquire Device Signature
            const deviceId = await getPersistentDeviceId();

            setPendingMeetingCode(code);
            setPendingUserLocation(userLocation);
            setPendingDeviceId(deviceId);

            // 3. Strict Pre-Validation (Checks timing, location, device lock, duplicates, registry status)
            const preValRes = await api.post('/attendance/pre-validate', {
                meetingCode: code,
                deviceId,
                studentRegNo: studentRegNo.trim().toUpperCase(),
                userLat: userLocation.lat,
                userLong: userLocation.long,
                accuracy: userLocation.accuracy
            });

            const { meeting, hasQuestion } = preValRes.data;
            setPendingMeetingData(meeting);

            // If meeting has an interactive Question of the Day, prompt student now that all rules passed
            if (hasQuestion && meeting.questionOfDay && meeting.questionOfDay.trim() !== '') {
                setUserAnswer('');
                setQuestionValidationError('');
                setScannerStatus('question');
            } else {
                // If no question, directly proceed to final check-in
                await handleSubmitAttendance('', userLocation, deviceId);
            }
        } catch (err) {
            console.error("Attendance Pre-Validation Blocked:", err);
            const errMsg = err.response?.data?.message || 'Verification blocked. Please verify session rules and venue location.';
            setScannerStatus('error');
            setErrorMessage(errMsg);
        }
    };

    // Handler when user confirms their answer to the Question of the Day
    const handleConfirmAnswer = (e) => {
        if (e) e.preventDefault();
        if (!userAnswer || (typeof userAnswer === 'string' && userAnswer.trim() === '')) {
            setQuestionValidationError('Please provide an answer before submitting.');
            return;
        }
        setQuestionValidationError('');
        handleSubmitAttendance(userAnswer, pendingUserLocation, pendingDeviceId);
    };

    // Camera Lifecycle with Instant Hardware Acceleration
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        isProcessingRef.current = false;
        setScannerStatus('initializing');
        setErrorMessage('');
        setCheckInResult(null);
        setPendingMeetingCode('');
        setPendingMeetingData(null);
        setPendingUserLocation(null);
        setPendingDeviceId(null);
        setUserAnswer('');
        setQuestionValidationError('');

        const startCamera = async () => {
            try {
                if (html5QrCodeRef.current) {
                    await safeStopScanner(html5QrCodeRef.current);
                    html5QrCodeRef.current = null;
                }

                const container = document.getElementById(scannerId);
                if (!container || !isMounted) return;

                // Initialize with hardware-accelerated BarcodeDetector if browser supports it
                const qrScanner = new Html5Qrcode(scannerId, { 
                    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
                    verbose: false 
                });
                html5QrCodeRef.current = qrScanner;

                // 30 FPS + Large dynamic scanbox for instantaneous capture
                const config = {
                    fps: 30,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const boxSize = Math.max(Math.floor(minEdge * 0.88), 280);
                        return { width: boxSize, height: boxSize };
                    },
                    aspectRatio: 1.0,
                    disableFlip: false,
                    videoConstraints: {
                        facingMode: facingMode,
                        width: { ideal: 1920, min: 640 },
                        height: { ideal: 1080, min: 480 }
                    }
                };

                await qrScanner.start(
                    { facingMode: facingMode },
                    config,
                    (decodedText) => {
                        if (isMounted) {
                            handleScannedCode(decodedText);
                        }
                    },
                    () => {
                        // ignore unread frame
                    }
                );

                if (isMounted) {
                    setScannerStatus('scanning');
                    // Check torch capability
                    try {
                        const track = qrScanner.getRunningTrackCameraCapabilities();
                        if (track && track.torchFeature().isSupported()) {
                            setTorchSupported(true);
                        }
                    } catch {}
                }
            } catch (err) {
                console.error("Camera access failed:", err);
                if (isMounted) {
                    setScannerStatus('error');
                    setErrorMessage('Camera access was denied or is unavailable on this browser. Please enable camera permission in your browser settings.');
                }
            }
        };

        const timer = setTimeout(() => {
            startCamera();
        }, 120);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (html5QrCodeRef.current) {
                safeStopScanner(html5QrCodeRef.current);
            }
        };
    }, [isOpen, facingMode, retryCount]);

    const toggleTorch = async () => {
        if (!html5QrCodeRef.current || !torchSupported) return;
        try {
            await html5QrCodeRef.current.applyVideoConstraints({
                advanced: [{ torch: !torchOn }]
            });
            setTorchOn(!torchOn);
        } catch (e) {
            console.warn("Failed to toggle torch:", e);
        }
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleRetry = () => {
        isProcessingRef.current = false;
        setRetryCount(c => c + 1);
        setFacingMode('environment');
    };

    if (!isOpen) return null;

    // Render interactive question form based on questionType
    const renderQuestionInput = () => {
        const type = pendingMeetingData?.questionType || 'text';
        const options = pendingMeetingData?.questionOptions || [];

        switch (type) {
            case 'yes_no':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.75rem' }}>
                        {['Yes', 'No'].map(opt => {
                            const isSelected = userAnswer === opt;
                            const isYes = opt === 'Yes';
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        setUserAnswer(opt);
                                        if (questionValidationError) setQuestionValidationError('');
                                    }}
                                    style={{
                                        padding: '1.15rem 1rem',
                                        borderRadius: '18px',
                                        fontSize: '1.05rem',
                                        fontWeight: 800,
                                        background: isSelected 
                                            ? (isYes 
                                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)' 
                                                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.35) 100%)')
                                            : 'rgba(30, 41, 59, 0.7)',
                                        color: isSelected ? (isYes ? '#34D399' : '#F87171') : '#CBD5E1',
                                        border: isSelected 
                                            ? (isYes ? '2px solid #10B981' : '2px solid #EF4444') 
                                            : '1.5px solid rgba(255, 255, 255, 0.12)',
                                        boxShadow: isSelected 
                                            ? (isYes ? '0 0 20px rgba(16, 185, 129, 0.3)' : '0 0 20px rgba(239, 68, 68, 0.3)') 
                                            : 'none',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.6rem'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>{isYes ? '👍' : '👎'}</span>
                                    <span>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                );

            case 'multiple_choice':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                        {options.map((opt, idx) => {
                            const isSelected = userAnswer === opt;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setUserAnswer(opt);
                                        if (questionValidationError) setQuestionValidationError('');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.95rem 1.15rem',
                                        borderRadius: '16px',
                                        textAlign: 'left',
                                        fontSize: '0.92rem',
                                        fontWeight: 700,
                                        background: isSelected 
                                            ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)' 
                                            : 'rgba(30, 41, 59, 0.65)',
                                        color: '#FFFFFF',
                                        border: isSelected ? '2px solid #38BDF8' : '1.5px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isSelected ? '0 4px 18px rgba(56, 189, 248, 0.25)' : 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.9rem'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: isSelected ? '#38BDF8' : 'rgba(255, 255, 255, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isSelected ? '#38BDF8' : 'transparent',
                                        flexShrink: 0,
                                        transition: 'all 0.2s'
                                    }}>
                                        {isSelected && (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0B1120' }} />
                                        )}
                                    </div>
                                    <span style={{ flex: 1, lineHeight: 1.4 }}>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                );

            case 'checkboxes':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                        {options.map((opt, idx) => {
                            const currentSelections = userAnswer ? userAnswer.split(', ').filter(Boolean) : [];
                            const isSelected = currentSelections.includes(opt);
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        let next;
                                        if (isSelected) {
                                            next = currentSelections.filter(s => s !== opt);
                                        } else {
                                            next = [...currentSelections, opt];
                                        }
                                        setUserAnswer(next.join(', '));
                                        if (questionValidationError) setQuestionValidationError('');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.95rem 1.15rem',
                                        borderRadius: '16px',
                                        textAlign: 'left',
                                        fontSize: '0.92rem',
                                        fontWeight: 700,
                                        background: isSelected 
                                            ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)' 
                                            : 'rgba(30, 41, 59, 0.65)',
                                        color: '#FFFFFF',
                                        border: isSelected ? '2px solid #38BDF8' : '1.5px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isSelected ? '0 4px 18px rgba(56, 189, 248, 0.25)' : 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.9rem'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '6px',
                                        border: '2px solid',
                                        borderColor: isSelected ? '#38BDF8' : 'rgba(255, 255, 255, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isSelected ? '#38BDF8' : 'transparent',
                                        flexShrink: 0,
                                        transition: 'all 0.2s'
                                    }}>
                                        {isSelected && <Check size={14} color="#0B1120" strokeWidth={3} />}
                                    </div>
                                    <span style={{ flex: 1, lineHeight: 1.4 }}>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                );

            case 'rating':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', margin: '1rem 0 0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem' }}>
                            {[1, 2, 3, 4, 5].map(star => {
                                const ratingVal = parseInt(userAnswer, 10) || 0;
                                const isActive = star <= ratingVal;
                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => {
                                            setUserAnswer(String(star));
                                            if (questionValidationError) setQuestionValidationError('');
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            fontSize: '2.5rem',
                                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            transform: isActive ? 'scale(1.2)' : 'scale(1.0)',
                                            color: isActive ? '#FBBF24' : 'rgba(255,255,255,0.2)',
                                            textShadow: isActive ? '0 0 20px rgba(251, 191, 36, 0.8)' : 'none',
                                            padding: '0.2rem'
                                        }}
                                    >
                                        ★
                                    </button>
                                );
                            })}
                        </div>
                        <span style={{ fontSize: '0.86rem', color: '#94A3B8', fontWeight: 700 }}>
                            {userAnswer ? `${userAnswer} out of 5 Stars` : 'Tap a star to rate'}
                        </span>
                    </div>
                );

            case 'text':
            default:
                return (
                    <div style={{ marginTop: '0.75rem' }}>
                        <textarea
                            className="portal-question-textarea"
                            placeholder="Type your answer here..."
                            rows={3}
                            value={userAnswer}
                            onChange={(e) => {
                                setUserAnswer(e.target.value);
                                if (questionValidationError) setQuestionValidationError('');
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem 1.15rem',
                                background: '#020617',
                                border: '1.5px solid #38BDF8',
                                borderRadius: '16px',
                                color: '#FFFFFF',
                                fontSize: '0.94rem',
                                fontWeight: 600,
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                lineHeight: 1.5,
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                );
        }
    };

    return (
        <div 
            className="portal-scanner-overlay"
            data-scanner-modal="true"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(11, 17, 32, 0.94)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '1.25rem',
                overflowY: 'auto',
                animation: 'fadeIn 0.2s ease'
            }}
        >
            <div 
                className="portal-scanner-modal"
                data-scanner-modal="true"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '450px',
                    margin: 'auto',
                    background: '#0B1120',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '28px',
                    overflow: 'hidden',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 60px rgba(29, 78, 216, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'popModalScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* ─── Top Bar ─── */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.1rem 1.35rem',
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    boxSizing: 'border-box',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                        <div style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '12px', 
                            background: scannerStatus === 'question' 
                                ? 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)' 
                                : 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#FFFFFF', 
                            flexShrink: 0,
                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' 
                        }}>
                            {scannerStatus === 'question' ? <Sparkles size={19} /> : <Camera size={19} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {scannerStatus === 'question' ? 'Meeting Check-In' : 'Venue Scanner'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {studentRegNo} · {memberName}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
                        {torchSupported && scannerStatus === 'scanning' && (
                            <button
                                type="button"
                                onClick={toggleTorch}
                                title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: torchOn ? '#FBBF24' : 'rgba(255,255,255,0.1)',
                                    color: torchOn ? '#000000' : '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    boxShadow: torchOn ? '0 0 16px rgba(251, 191, 36, 0.5)' : 'none'
                                }}
                            >
                                <Flashlight size={18} />
                            </button>
                        )}
                        {scannerStatus === 'scanning' && (
                            <button
                                type="button"
                                onClick={toggleFacingMode}
                                title="Switch Camera"
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <RefreshCw size={17} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            title="Close Scanner"
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#CBD5E1',
                                border: '1px solid rgba(255,255,255,0.12)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <X size={19} />
                        </button>
                    </div>
                </div>

                {/* ─── Viewfinder Container (Active during camera scanning only) ─── */}
                <div 
                    className={scannerStatus === 'question' ? 'scanner-hidden' : ''}
                    style={{ 
                        position: 'relative',
                        width: '100%', 
                        height: (scannerStatus === 'scanning' || scannerStatus === 'initializing') ? 'min(56vh, 440px)' : '0px', 
                        display: (scannerStatus === 'scanning' || scannerStatus === 'initializing') ? 'flex' : 'none', 
                        background: '#020617',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }} 
                >
                    {/* Dedicated HTML5-QRCode container - MUST NOT HAVE ANY REACT CHILDREN */}
                    <div 
                        id={scannerId} 
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }} 
                    />

                    {/* iOS Viewfinder Reticle (Rendered as sibling overlay so React doesn't mutate scanner container) */}
                    {scannerStatus === 'scanning' && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 5
                        }}>
                            <div style={{
                                position: 'relative',
                                width: 'min(78vw, 280px)',
                                height: 'min(78vw, 280px)',
                                borderRadius: '26px',
                                border: '2px solid rgba(255, 255, 255, 0.25)',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)'
                            }}>
                                <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '38px', height: '38px', borderTop: '4.5px solid #38BDF8', borderLeft: '4.5px solid #38BDF8', borderTopLeftRadius: '20px' }} />
                                <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '38px', height: '38px', borderTop: '4.5px solid #38BDF8', borderRight: '4.5px solid #38BDF8', borderTopRightRadius: '20px' }} />
                                <div style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '38px', height: '38px', borderBottom: '4.5px solid #38BDF8', borderLeft: '4.5px solid #38BDF8', borderBottomLeftRadius: '20px' }} />
                                <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '38px', height: '38px', borderBottom: '4.5px solid #38BDF8', borderRight: '4.5px solid #38BDF8', borderBottomRightRadius: '20px' }} />

                                <div style={{
                                    position: 'absolute',
                                    left: '10px',
                                    right: '10px',
                                    height: '2.5px',
                                    background: 'linear-gradient(90deg, transparent, #38BDF8, #60A5FA, transparent)',
                                    boxShadow: '0 0 16px #38BDF8, 0 0 30px rgba(56, 189, 248, 0.4)',
                                    animation: 'scanSweep 2.2s ease-in-out infinite'
                                }} />
                            </div>

                            <p style={{ marginTop: '1.25rem', fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.3px', textShadow: '0 2px 10px rgba(0,0,0,0.9)', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 1.1rem', borderRadius: '999px', backdropFilter: 'blur(6px)' }}>
                                Point camera at the venue QR poster
                            </p>
                        </div>
                    )}
                </div>

                {/* ─── State Panels ─── */}
                <div style={{ width: '100%', background: '#0B1120', display: 'flex', flexDirection: 'column' }}>
                    {/* Initializing State */}
                    {scannerStatus === 'initializing' && (
                        <div style={{ width: '100%', height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', background: '#0B1120', color: '#94A3B8' }}>
                            <Loader2 className="animate-spin" size={40} color="#38BDF8" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>Activating Camera...</span>
                        </div>
                    )}

                    {/* Processing / Submitting State */}
                    {(scannerStatus === 'processing' || scannerStatus === 'submitting') && (
                        <div style={{ width: '100%', padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.15rem', background: '#0B1120', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(29, 78, 216, 0.2)', border: '2.5px solid #38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(56, 189, 248, 0.35)' }}>
                                <ShieldCheck size={40} color="#38BDF8" />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
                                    {scannerStatus === 'submitting' ? 'Recording Attendance' : 'Verifying Requirements'}
                                </h4>
                                <p style={{ fontSize: '0.86rem', color: '#94A3B8', margin: 0, lineHeight: 1.5, maxWidth: '290px' }}>{statusMessage}</p>
                            </div>
                            <div className="loading-spinner" style={{ width: '26px', height: '26px', borderWidth: '3px', borderTopColor: '#38BDF8' }} />
                        </div>
                    )}

                    {/* ══ INTERACTIVE QUESTION OF THE DAY STEP (FULL WIDTH) ══ */}
                    {scannerStatus === 'question' && (
                        <div style={{ 
                            width: '100%', 
                            padding: '1.5rem 1.4rem 1.6rem', 
                            background: '#0B1120', 
                            display: 'flex', 
                            flexDirection: 'column',
                            boxSizing: 'border-box',
                            animation: 'popScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}>
                            {/* Question Card Box */}
                            <div style={{
                                width: '100%',
                                padding: '1.25rem 1.35rem',
                                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%)',
                                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                                borderRadius: '20px',
                                marginBottom: '1.15rem',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                                boxSizing: 'border-box'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24' }}>
                                        <Sparkles size={14} />
                                    </div>
                                    <span style={{ fontSize: '0.76rem', fontWeight: 900, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Question of the Day
                                    </span>
                                </div>

                                <div style={{
                                    borderLeft: '3.5px solid #38BDF8',
                                    paddingLeft: '0.9rem',
                                    marginTop: '0.4rem'
                                }}>
                                    <p style={{
                                        fontSize: '1.12rem',
                                        fontWeight: 800,
                                        color: '#FFFFFF',
                                        margin: 0,
                                        lineHeight: 1.5,
                                        letterSpacing: '-0.01em'
                                    }}>
                                        {pendingMeetingData?.questionOfDay}
                                    </p>
                                </div>
                            </div>

                            {/* Input Form Section */}
                            <div style={{ width: '100%', marginBottom: '1.25rem', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                        Your Answer <span style={{ color: '#EF4444' }}>*</span>
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                        Required for check-in
                                    </span>
                                </div>
                                {renderQuestionInput()}
                            </div>

                            {/* Validation Alert */}
                            {questionValidationError && (
                                <div style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.55rem',
                                    padding: '0.75rem 0.95rem',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    borderRadius: '14px',
                                    color: '#FCA5A5',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    marginBottom: '1rem',
                                    boxSizing: 'border-box',
                                    animation: 'fadeIn 0.2s ease'
                                }}>
                                    <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                                    <span>{questionValidationError}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem', boxSizing: 'border-box' }}>
                                <button
                                    type="button"
                                    onClick={handleConfirmAnswer}
                                    style={{
                                        width: '100%',
                                        padding: '1.05rem',
                                        background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #0284C7 100%)',
                                        border: 'none',
                                        borderRadius: '18px',
                                        color: '#FFFFFF',
                                        fontWeight: 900,
                                        fontSize: '1.02rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.6rem',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}
                                >
                                    <span>Submit & Complete Check-In</span>
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94A3B8',
                                        fontSize: '0.84rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        padding: '0.35rem',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        opacity: 0.85
                                    }}
                                >
                                    <RefreshCw size={13} />
                                    <span>Scan a different QR code</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success State */}
                    {scannerStatus === 'success' && checkInResult && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0B1120', padding: '2.5rem 1.8rem', textAlign: 'center', boxSizing: 'border-box', animation: 'popScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: '#ECFDF5', border: '3px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '1.1rem', boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)' }}>
                                <CheckCircle2 size={46} />
                            </div>
                            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#10B981', letterSpacing: '1.5px', textTransform: 'uppercase' }}>OFFICIALLY RECORDED</span>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0.4rem 0 0.25rem' }}>Check-In Complete!</h3>
                            <p style={{ fontSize: '0.9rem', color: '#CBD5E1', marginBottom: '1.65rem' }}>{checkInResult.memberName} ({studentRegNo})</p>

                            <button
                                type="button"
                                onClick={() => {
                                    if (onCheckInSuccess && checkInResult) {
                                        onCheckInSuccess(checkInResult);
                                    }
                                    onClose();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '1.05rem',
                                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                                    border: 'none',
                                    borderRadius: '16px',
                                    color: '#FFFFFF',
                                    fontWeight: 900,
                                    fontSize: '0.98rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 25px rgba(29, 78, 216, 0.35)'
                                }}
                            >
                                Back to My Dashboard 🚀
                            </button>
                        </div>
                    )}

                    {/* Error State */}
                    {scannerStatus === 'error' && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0B1120', padding: '2.5rem 1.8rem', textAlign: 'center', boxSizing: 'border-box', animation: 'fadeUp 0.25s ease' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#FEF2F2', border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginBottom: '1rem' }}>
                                <AlertTriangle size={36} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.5rem' }}>Verification Blocked</h3>
                            <p style={{ fontSize: '0.88rem', color: '#FCA5A5', lineHeight: 1.5, marginBottom: '1.5rem', maxHeight: '140px', overflowY: 'auto' }}>
                                {errorMessage}
                            </p>

                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '0.9rem',
                                        background: '#334155',
                                        border: 'none',
                                        borderRadius: '14px',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    style={{
                                        flex: 1,
                                        padding: '0.9rem',
                                        background: '#1D4ED8',
                                        border: 'none',
                                        borderRadius: '14px',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Scan Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Bottom Security Note ─── */}
                <div style={{
                    padding: '0.95rem 1.35rem',
                    background: 'rgba(15, 23, 42, 0.75)',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    color: '#94A3B8',
                    fontSize: '0.74rem',
                    fontWeight: 700
                }}>
                    <ShieldCheck size={15} color="#38BDF8" />
                    <span>Doulos Pipeline Protocol · 1 Phone : 1 Member Verification</span>
                </div>
            </div>

            <style>{`
                @keyframes scanSweep {
                    0% { top: 12px; opacity: 0.2; }
                    50% { top: calc(100% - 18px); opacity: 1; }
                    100% { top: 12px; opacity: 0.2; }
                }
                @keyframes popModalScale {
                    from { transform: scale(0.92); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                #doulos-portal-qr-viewfinder {
                    width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                #doulos-portal-qr-viewfinder.scanner-hidden {
                    display: none !important;
                    width: 0px !important;
                    height: 0px !important;
                    min-height: 0px !important;
                    position: absolute !important;
                    overflow: hidden !important;
                }
                #doulos-portal-qr-viewfinder video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    object-position: center !important;
                }
                .portal-scanner-modal,
                .portal-scanner-modal * {
                    box-sizing: border-box !important;
                }
                .portal-scanner-modal textarea.portal-question-textarea {
                    background-color: #020617 !important;
                    color: #FFFFFF !important;
                    border: 1.5px solid #38BDF8 !important;
                    box-sizing: border-box !important;
                }
                .portal-scanner-modal textarea.portal-question-textarea:focus {
                    border-color: #60A5FA !important;
                    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.3) !important;
                }
                .portal-scanner-modal textarea.portal-question-textarea::placeholder {
                    color: #64748B !important;
                }
            `}</style>
        </div>
    );
};

export default PortalQRScanner;
