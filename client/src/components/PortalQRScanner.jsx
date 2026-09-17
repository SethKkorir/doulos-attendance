import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
    X, Camera, Flashlight, RefreshCw, CheckCircle2, AlertTriangle, 
    Sparkles, ShieldCheck, MapPin, Loader2, ArrowRight
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

const PortalQRScanner = ({ isOpen, onClose, studentRegNo, memberName, onCheckInSuccess }) => {
    const scannerId = "doulos-portal-qr-viewfinder";
    const [scannerStatus, setScannerStatus] = useState('initializing'); // initializing, scanning, processing, success, error
    const [statusMessage, setStatusMessage] = useState('Starting camera...');
    const [errorMessage, setErrorMessage] = useState('');
    const [torchOn, setTorchOn] = useState(false);
    const [torchSupported, setTorchSupported] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
    const [checkInResult, setCheckInResult] = useState(null);

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

    // Main scanning orchestrator
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

        // Stop camera while processing verification
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
            } catch {}
        }

        setScannerStatus('processing');
        setStatusMessage('Venue QR code recognized! Verifying attendance credentials...');

        try {
            // 1. Step 1: Issue Single-Use Token (Stage 0)
            setStatusMessage('Issuing secure single-use token...');
            let token = '';
            try {
                const tokenRes = await api.post('/tokens/issue', { meetingCode: code });
                token = tokenRes.data?.token || '';
            } catch (tErr) {
                console.warn('Token issue error, falling back to direct verification:', tErr);
            }

            // 2. Step 2: Acquire Device Signature (Stage 4 & 5)
            setStatusMessage('Checking device lock signature...');
            const deviceId = await getPersistentDeviceId();

            // 3. Step 3: Acquire Geolocation (Stage 3)
            setStatusMessage('Acquiring high-precision venue GPS fix...');
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
                    studentName: memberName
                }
            };

            const res = await api.post('/attendance/submit', submitPayload);

            // 5. Success Flow
            setScannerStatus('success');
            setCheckInResult({
                meetingName: res.data.meetingName || code.toUpperCase(),
                memberName: res.data.memberName || memberName,
                memberType: res.data.memberType || 'Member',
                pointsAwarded: 10
            });

            // Trigger parent state refresh
            if (onCheckInSuccess) {
                onCheckInSuccess(res.data);
            }

        } catch (err) {
            console.error("Portal QR Check-In Error:", err);
            const errMsg = err.response?.data?.message || 'Check-in failed. Please verify you are at the venue and try again.';
            setScannerStatus('error');
            setErrorMessage(errMsg);
        }
    };

    // Camera Lifecycle with Instant Hardware Acceleration
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        isProcessingRef.current = false;
        setScannerStatus('initializing');
        setErrorMessage('');
        setCheckInResult(null);

        const startCamera = async () => {
            try {
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
                html5QrCodeRef.current.stop().catch(() => {}).then(() => {
                    try { html5QrCodeRef.current.clear(); } catch {}
                });
            }
        };
    }, [isOpen, facingMode]);

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
        setScannerStatus('initializing');
        setErrorMessage('');
        setCheckInResult(null);
        setFacingMode('environment');
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem',
            overflowY: 'auto',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '460px',
                margin: 'auto',
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '30px',
                overflow: 'hidden',
                boxShadow: '0 25px 70px rgba(0,0,0,0.8), 0 0 50px rgba(29, 78, 216, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'popModalScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* ─── Top Bar ─── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.35rem',
                    background: 'rgba(30, 41, 59, 0.75)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.35)' }}>
                            <Camera size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>Venue Scanner</div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>{studentRegNo} · {memberName}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {torchSupported && scannerStatus === 'scanning' && (
                            <button
                                type="button"
                                onClick={toggleTorch}
                                title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: torchOn ? '#FBBF24' : 'rgba(255,255,255,0.12)',
                                    color: torchOn ? '#000000' : '#FFFFFF',
                                    border: 'none',
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
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#FFFFFF',
                                    border: 'none',
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
                                background: 'rgba(255,255,255,0.12)',
                                color: '#FFFFFF',
                                border: 'none',
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

                {/* ─── Main Viewport Area ─── */}
                <div style={{ position: 'relative', width: '100%', minHeight: '420px', height: 'min(58vh, 460px)', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {/* Html5Qrcode video target */}
                    <div id={scannerId} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

                    {/* iOS Viewfinder Large Reticle Overlay */}
                    {scannerStatus === 'scanning' && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Generous Large Reticle Frame */}
                            <div style={{
                                position: 'relative',
                                width: 'min(80vw, 290px)',
                                height: 'min(80vw, 290px)',
                                borderRadius: '26px',
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)'
                            }}>
                                {/* Corner Accents (iOS Camera Style - Larger & Bolder) */}
                                <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '38px', height: '38px', borderTop: '4.5px solid #38BDF8', borderLeft: '4.5px solid #38BDF8', borderTopLeftRadius: '20px' }} />
                                <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '38px', height: '38px', borderTop: '4.5px solid #38BDF8', borderRight: '4.5px solid #38BDF8', borderTopRightRadius: '20px' }} />
                                <div style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '38px', height: '38px', borderBottom: '4.5px solid #38BDF8', borderLeft: '4.5px solid #38BDF8', borderBottomLeftRadius: '20px' }} />
                                <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '38px', height: '38px', borderBottom: '4.5px solid #38BDF8', borderRight: '4.5px solid #38BDF8', borderBottomRightRadius: '20px' }} />

                                {/* Sweeping Laser Scan Line with Glow */}
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

                            <p style={{ marginTop: '1.25rem', fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.3px', textShadow: '0 2px 10px rgba(0,0,0,0.9)', background: 'rgba(0,0,0,0.5)', padding: '0.4rem 1rem', borderRadius: '999px', backdropFilter: 'blur(6px)' }}>
                                Point camera at the venue QR poster
                            </p>
                        </div>
                    )}

                    {/* Initializing State */}
                    {scannerStatus === 'initializing' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', background: '#0F172A', color: '#94A3B8' }}>
                            <Loader2 className="animate-spin" size={40} color="#38BDF8" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>Activating Camera...</span>
                        </div>
                    )}

                    {/* Processing State */}
                    {scannerStatus === 'processing' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.15rem', background: 'rgba(15, 23, 42, 0.96)', padding: '2rem', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(29, 78, 216, 0.2)', border: '2.5px solid #38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)' }}>
                                <ShieldCheck size={36} color="#38BDF8" />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>Verifying Attendance</h4>
                                <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0, lineHeight: 1.5, maxWidth: '280px' }}>{statusMessage}</p>
                            </div>
                            <div className="loading-spinner" style={{ width: '24px', height: '24px', borderWidth: '2.5px', borderTopColor: '#38BDF8' }} />
                        </div>
                    )}

                    {/* Success State */}
                    {scannerStatus === 'success' && checkInResult && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', padding: '2rem', textAlign: 'center', animation: 'popScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: '#ECFDF5', border: '3px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '1.1rem', boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)' }}>
                                <CheckCircle2 size={46} />
                            </div>
                            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#10B981', letterSpacing: '1.5px', textTransform: 'uppercase' }}>OFFICIALLY RECORDED</span>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0.4rem 0 0.25rem' }}>Check-In Complete!</h3>
                            <p style={{ fontSize: '0.9rem', color: '#CBD5E1', marginBottom: '1.35rem' }}>{checkInResult.memberName} ({studentRegNo})</p>

                            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '0.95rem 1.35rem', width: '100%', marginBottom: '1.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#FBBF24', fontWeight: 800, fontSize: '0.92rem' }}>
                                    <Sparkles size={19} />
                                    <span>Fellowship Points</span>
                                </div>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981' }}>+10 PTS</span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
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
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', padding: '2rem', textAlign: 'center', animation: 'fadeUp 0.25s ease' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#FEF2F2', border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginBottom: '1rem' }}>
                                <AlertTriangle size={36} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.5rem' }}>Verification Blocked</h3>
                            <p style={{ fontSize: '0.86rem', color: '#FCA5A5', lineHeight: 1.5, marginBottom: '1.5rem', maxHeight: '140px', overflowY: 'auto' }}>
                                {errorMessage}
                            </p>

                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
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
                    background: 'rgba(30, 41, 59, 0.5)',
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
                #doulos-portal-qr-viewfinder video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    object-position: center !important;
                }
            `}</style>
        </div>
    );
};

export default PortalQRScanner;
