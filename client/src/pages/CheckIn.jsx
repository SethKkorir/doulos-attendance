import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { 
    CheckCircle, XCircle, Loader2, BookOpen, ChevronDown, ChevronUp, 
    Trophy, Star, Clock, Lock, Sparkles, MapPin, ArrowRight, ShieldCheck, Check 
} from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';

const getIndexedDBId = () => {
    return new Promise((resolve) => {
        let resolved = false;
        const safeResolve = (val) => {
            if (!resolved) {
                resolved = true;
                resolve(val);
            }
        };
        const timeoutId = setTimeout(() => safeResolve(null), 1000);

        try {
            const request = indexedDB.open('DoulosAttendanceDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('device')) {
                    db.createObjectStore('device', { keyPath: 'key' });
                }
            };
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
                } catch (innerErr) {
                    clearTimeout(timeoutId);
                    safeResolve(null);
                }
            };
            request.onerror = () => {
                clearTimeout(timeoutId);
                safeResolve(null);
            };
        } catch (err) {
            clearTimeout(timeoutId);
            safeResolve(null);
        }
    });
};

const setIndexedDBId = (id) => {
    return new Promise((resolve) => {
        let resolved = false;
        const safeResolve = (val) => {
            if (!resolved) {
                resolved = true;
                resolve(val);
            }
        };
        const timeoutId = setTimeout(() => safeResolve(false), 1000);

        try {
            const request = indexedDB.open('DoulosAttendanceDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('device')) {
                    db.createObjectStore('device', { keyPath: 'key' });
                }
            };
            request.onsuccess = (e) => {
                try {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('device')) {
                        clearTimeout(timeoutId);
                        safeResolve(false);
                        return;
                    }
                    const transaction = db.transaction('device', 'readwrite');
                    const store = transaction.objectStore('device');
                    store.put({ key: 'device_id', value: id });
                    transaction.oncomplete = () => {
                        clearTimeout(timeoutId);
                        safeResolve(true);
                    };
                    transaction.onerror = () => {
                        clearTimeout(timeoutId);
                        safeResolve(false);
                    };
                } catch (innerErr) {
                    clearTimeout(timeoutId);
                    safeResolve(false);
                }
            };
            request.onerror = () => {
                clearTimeout(timeoutId);
                safeResolve(false);
            };
        } catch (err) {
            clearTimeout(timeoutId);
            safeResolve(false);
        }
    });
};

const getCookieId = () => {
    const match = document.cookie.match(/(?:^|; )doulos_device_id=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
};

const setCookieId = (id) => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 10);
    document.cookie = `doulos_device_id=${encodeURIComponent(id)}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
};

const CheckIn = () => {
    const params = useParams();
    const navigate = useNavigate();
    const meetingCode = (params.meetingCode?.replace(/\/$/, '') || '').toLowerCase();
    const isTestMode = new URLSearchParams(window.location.search).get('test') === '1';
    const [meeting, setMeeting] = useState(null);
    const [responses, setResponses] = useState({});
    const [memberType, setMemberType] = useState(''); // Douloid, Recruit, Visitor
    const [status, setStatus] = useState('loading'); // loading, idle, submitting, success, error
    const [showRecap, setShowRecap] = useState(false);
    const [memberInfo, setMemberInfo] = useState(null); // { name, type } from registry
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [showCongrats, setShowCongrats] = useState(false);
    const [showTrainingBanner, setShowTrainingBanner] = useState(false);
    const [msg, setMsg] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [hasAlreadyCheckedIn, setHasAlreadyCheckedIn] = useState(false);
    const [systemStatus, setSystemStatus] = useState({ recoveryMode: false });
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [currentSemester, setCurrentSemester] = useState('');
    const [lastActiveSemester, setLastActiveSemester] = useState('');
    const [semesterTheme, setSemesterTheme] = useState('');
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get('t') || searchParams.get('token') || '';
    const [token, setToken] = useState(urlToken);
    const [fallbackActive, setFallbackActive] = useState(false);
    const [isStampingFallback, setIsStampingFallback] = useState(false);
    const [locationErrorType, setLocationErrorType] = useState(null); // 'denied' | 'weak_signal' | null
    const [preciseLocationWarning, setPreciseLocationWarning] = useState(false);

    useEffect(() => {
        let timer;
        if (msg) {
            timer = setTimeout(() => setMsg(''), 7000);
        }
        return () => clearTimeout(timer);
    }, [msg]);

    const getPersistentDeviceId = async () => {
        let localId = null;
        try {
            localId = localStorage.getItem('doulos_device_id');
        } catch (e) {
            console.warn("localStorage access denied:", e);
        }
        
        let cookieId = getCookieId();
        
        if (localId || cookieId) {
            const resolvedId = localId || cookieId;
            // Heal IndexedDB in the background safely without awaiting it
            getIndexedDBId().then(async (idbId) => {
                if (idbId !== resolvedId) {
                    await setIndexedDBId(resolvedId);
                }
            }).catch(() => {});
            
            // Sync cookie/localStorage in background
            try {
                if (localId && !cookieId) setCookieId(localId);
                if (cookieId && !localId) localStorage.setItem('doulos_device_id', cookieId);
            } catch (e) {}
            
            return resolvedId;
        }

        // Only if both are missing do we await IndexedDB
        let idbId = await getIndexedDBId();
        let resolvedId = idbId;

        if (!resolvedId) {
            resolvedId = 'DL-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }

        // Heal/sync all storages
        try {
            localStorage.setItem('doulos_device_id', resolvedId);
        } catch (e) {}
        setCookieId(resolvedId);
        await setIndexedDBId(resolvedId);

        return resolvedId;
    };

    useEffect(() => {
        if (!meetingCode) return;

        const fetchMeeting = async () => {
            try {
                const deviceId = await getPersistentDeviceId();
                const [meetingRes, statusRes] = await Promise.all([
                    api.get(`/meetings/code/${meetingCode}?deviceId=${deviceId}`),
                    api.get('/system/system-status')
                ]);
                
                const meetingData = meetingRes.data;
                setMeeting(meetingData);
                setSystemStatus(statusRes.data || { recoveryMode: false });

                // If no token in URL, issue a fresh single-use check-in token
                if (!token) {
                    try {
                        const tokenRes = await api.post('/tokens/issue', { meetingCode });
                        if (tokenRes.data?.token) {
                            setToken(tokenRes.data.token);
                        }
                    } catch (tErr) {
                        console.warn("Token issuance note:", tErr);
                    }
                }

                // Initialize responses with empty strings for each required field
                const initialResponses = {};
                meetingData.requiredFields.forEach(f => {
                    initialResponses[f.key] = '';
                });
                // Security: Ensure studentRegNo is always in state
                if (initialResponses.studentRegNo === undefined) initialResponses.studentRegNo = '';
                setResponses(initialResponses);

                const userRole = localStorage.getItem('role');
                const isSuperUser = ['developer', 'superadmin'].includes(userRole);
                const bypassLocks = isSuperUser || isTestMode || meetingData.isTestMeeting;

                // --- DUPLICATE CHECK-IN DETECTION ---
                // For trainings, use a per-day key so Day 1 lock doesn't block Day 2/3
                const isTrainingSession = meetingData.isTraining || meetingData.category === 'Training';
                const activeDay = meetingData.activeDay || 1;
                const localStatusKey = isTrainingSession
                    ? `doulos_attendance_status_${meetingCode}_day${activeDay}`
                    : `doulos_attendance_status_${meetingCode}`;
                const localLockKey = isTrainingSession
                    ? `doulos_attendance_lock_${meetingCode}_day${activeDay}`
                    : `doulos_attendance_lock_${meetingCode}`;
                const localStatus = localStorage.getItem(localStatusKey);
                const serverHasAttended = meetingData.hasAttended;

                if ((localStatus === 'success' || serverHasAttended) && !bypassLocks) {
                    setHasAlreadyCheckedIn(true);
                    return; // Stop loading form
                }

                if ((localStatus === 'success' || serverHasAttended) && bypassLocks) {
                    setMsg("🔧 Test Mode: Already checked in — bypassing lock for testing.");
                }

                // --- STRICT LOCK CHECK (Security Layer) ---
                // Superusers and test mode bypass the localStorage lock entirely
                if (!bypassLocks) {
                    const lockData = localStorage.getItem(localLockKey);
                    if (lockData) {
                        const { reason } = JSON.parse(lockData);
                        setStatus('locked');
                        setMsg(reason || 'Access Denied');
                        return;
                    }
                }

                if (statusRes.data.manualMaintenance) {
                    setStatus('maintenance');
                    setMsg('The attendance system is undergoing scheduled maintenance. Please try again later.');
                    return;
                }

                if (!meetingData.isActive && !meetingData.isTestMeeting && !isSuperUser) {
                    setStatus('error');
                    setMsg('This meeting is currently closed for attendance.');
                } else {
                    setStatus('idle');
                }
            } catch (err) {
                console.error("Fetch Meeting Error:", err);
                // If it's a 404, it's definitely invalid. 
                // If it's a 500 or network error, it might be temporary.
                if (err.response?.status === 404) {
                    setMsg('Invalid meeting link. Please check with an admin.');
                } else if (err.response?.status === 403) {
                    setMsg(err.response.data.message || 'Access Denied');
                } else {
                    setMsg('Connection error. Please try again.');
                }
                setStatus('error');
            }
        };
        fetchMeeting();
    }, [meetingCode]);



    const lookupMember = async (regNo) => {
        const cleanDigits = (regNo || '').replace(/\D/g, '');
        if (!regNo || cleanDigits.length < 6) {
            setMemberInfo(null);
            return;
        }
        setIsLookingUp(true);
        try {
            const res = await api.get(`/attendance/student/${encodeURIComponent(regNo)}`);
            if (res.data && res.data.stats && res.data.stats.percentage !== undefined) {
                const name = res.data.memberName || 'Member';
                setMemberInfo({ name, type: res.data.memberType });

                // Store semester info for welcome check
                setCurrentSemester(res.data.currentSemester || '');
                setLastActiveSemester(res.data.lastActiveSemester || '');
                setSemesterTheme(res.data.semesterTheme || '');
                setSemesterVerse(res.data.semesterVerse || '');

                // Pre-fill all name-related fields in responses using functional update to avoid staled state
                setResponses(prev => {
                    const updated = { ...prev };
                    meeting?.requiredFields.forEach(f => {
                        const k = f.key.toLowerCase();
                        if (k.includes('name') && k !== 'studentregno') {
                            updated[f.key] = name;
                        }
                    });
                    return updated;
                });
            } else {
                setMemberInfo(null);
            }
        } catch (err) {
            setMemberInfo(null);
        } finally {
            setIsLookingUp(false);
        }
    };

    const renderQuestionInput = () => {
        const type = meeting?.questionType || 'text';
        const options = meeting?.questionOptions || [];
        
        switch (type) {
            case 'yes_no':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.65rem' }}>
                        {['Yes', 'No'].map(opt => {
                            const isSelected = responses.dailyQuestionAnswer === opt;
                            const isYes = opt === 'Yes';
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    disabled={status === 'submitting'}
                                    onClick={() => setResponses(prev => ({ ...prev, dailyQuestionAnswer: opt }))}
                                    style={{
                                        padding: '0.95rem 1rem',
                                        borderRadius: '16px',
                                        fontSize: '0.98rem',
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
                                            ? (isYes ? '0 0 16px rgba(16, 185, 129, 0.3)' : '0 0 16px rgba(239, 68, 68, 0.3)') 
                                            : 'none',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span>{isYes ? '👍' : '👎'}</span>
                                    <span>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            case 'multiple_choice':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.65rem' }}>
                        {options.map(opt => {
                            const isSelected = responses.dailyQuestionAnswer === opt;
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    disabled={status === 'submitting'}
                                    onClick={() => setResponses(prev => ({ ...prev, dailyQuestionAnswer: opt }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem 1.1rem',
                                        borderRadius: '14px',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        background: isSelected 
                                            ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.35) 0%, rgba(37, 99, 235, 0.25) 100%)' 
                                            : 'rgba(30, 41, 59, 0.6)',
                                        color: '#FFFFFF',
                                        border: isSelected ? '2px solid #38BDF8' : '1.5px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isSelected ? '0 4px 16px rgba(56, 189, 248, 0.2)' : 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem'
                                    }}
                                >
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
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
                                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0B1120' }} />
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.65rem' }}>
                        {options.map(opt => {
                            const currentSelections = responses.dailyQuestionAnswer ? responses.dailyQuestionAnswer.split(', ').filter(Boolean) : [];
                            const isSelected = currentSelections.includes(opt);
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    disabled={status === 'submitting'}
                                    onClick={() => {
                                        let nextSelections;
                                        if (isSelected) {
                                            nextSelections = currentSelections.filter(s => s !== opt);
                                        } else {
                                            nextSelections = [...currentSelections, opt];
                                        }
                                        setResponses(prev => ({ ...prev, dailyQuestionAnswer: nextSelections.join(', ') }));
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem 1.1rem',
                                        borderRadius: '14px',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        background: isSelected 
                                            ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.35) 0%, rgba(37, 99, 235, 0.25) 100%)' 
                                            : 'rgba(30, 41, 59, 0.6)',
                                        color: '#FFFFFF',
                                        border: isSelected ? '2px solid #38BDF8' : '1.5px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isSelected ? '0 4px 16px rgba(56, 189, 248, 0.2)' : 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem'
                                    }}
                                >
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '5px',
                                        border: '2px solid',
                                        borderColor: isSelected ? '#38BDF8' : 'rgba(255, 255, 255, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isSelected ? '#38BDF8' : 'transparent',
                                        flexShrink: 0,
                                        transition: 'all 0.2s'
                                    }}>
                                        {isSelected && <Check size={12} color="#0B1120" strokeWidth={3} />}
                                    </div>
                                    <span style={{ flex: 1, lineHeight: 1.4 }}>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            case 'rating':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', margin: '0.85rem 0 0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
                            {[1, 2, 3, 4, 5].map(star => {
                                const ratingVal = parseInt(responses.dailyQuestionAnswer, 10) || 0;
                                const isActive = star <= ratingVal;
                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        disabled={status === 'submitting'}
                                        onClick={() => setResponses(prev => ({ ...prev, dailyQuestionAnswer: String(star) }))}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            fontSize: '2.2rem',
                                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            transform: isActive ? 'scale(1.18)' : 'scale(1.0)',
                                            color: isActive ? '#FBBF24' : 'rgba(255,255,255,0.2)',
                                            textShadow: isActive ? '0 0 16px rgba(251, 191, 36, 0.8)' : 'none',
                                            padding: '0.15rem'
                                        }}
                                    >
                                        ★
                                    </button>
                                );
                            })}
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700 }}>
                            {responses.dailyQuestionAnswer ? `${responses.dailyQuestionAnswer} out of 5 Stars` : 'Tap a star to rate'}
                        </span>
                    </div>
                );
            case 'text':
            default:
                return (
                    <textarea
                        className="input-field"
                        placeholder="Type your response here..."
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '0.9rem 1rem',
                            background: '#020617',
                            border: '1.5px solid #38BDF8',
                            borderRadius: '14px',
                            color: '#FFFFFF',
                            fontSize: '0.92rem',
                            fontWeight: 600,
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'inherit',
                            lineHeight: 1.5,
                            boxSizing: 'border-box'
                        }}
                        value={responses.dailyQuestionAnswer || ''}
                        onChange={e => setResponses(prev => ({ ...prev, dailyQuestionAnswer: e.target.value }))}
                        required
                        disabled={status === 'submitting'}
                    />
                );
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const currentRegNo = responses.studentRegNo?.trim();
        if (!currentRegNo || currentRegNo.length < 5) {
            setStatus('error');
            setMsg("Please enter your valid Admission Number.");
            return;
        }

        // Validate Question of the Day response if present
        if (meeting?.questionOfDay && !responses.dailyQuestionAnswer?.trim()) {
            setStatus('error');
            setMsg("Please answer the Question of the Day before submitting.");
            return;
        }

        // 1. Intercept for Semester Rollover Welcome Modal
        if (memberInfo && lastActiveSemester !== currentSemester && currentSemester && !showWelcomeModal) {
            setShowWelcomeModal(true);
            return;
        }

        await submitAttendanceRecord();
    };

    const handleWelcomeChoice = async (isActive) => {
        setShowWelcomeModal(false);
        setStatus('submitting');
        try {
            // 1. Silent Enrollment
            await api.post('/members/enroll', {
                studentRegNo: responses.studentRegNo || memberInfo?.studentRegNo,
                semester: currentSemester,
                isActiveThisSemester: isActive
            });

            // Update local state so we don't trigger the modal again
            setLastActiveSemester(currentSemester);

            // 2. Submit Attendance silently
            await submitAttendanceRecord();
        } catch (err) {
            console.error("Welcome flow enrollment failed:", err);
            // Fallback: try to submit attendance anyway so the student isn't blocked
            await submitAttendanceRecord();
        }
    };

    const handleContinueWithoutLocation = async () => {
        setIsStampingFallback(true);
        try {
            let activeToken = token;
            if (!activeToken) {
                const tokenRes = await api.post('/tokens/issue', { meetingCode });
                activeToken = tokenRes.data?.token;
                setToken(activeToken);
            }

            const deviceId = await getPersistentDeviceId();
            await api.post('/tokens/stamp-fallback', {
                token: activeToken,
                deviceId
            });

            setFallbackActive(true);
            setLocationErrorType(null);
            setStatus('idle');
            setMsg("🛡️ Device verification active (2 min window). Please click Submit to complete check-in.");
        } catch (err) {
            setStatus('error');
            setMsg(err.response?.data?.message || "Fallback verification failed. Please scan the QR again.");
        } finally {
            setIsStampingFallback(false);
        }
    };

    const submitAttendanceRecord = async () => {
        let userLocation = { lat: null, long: null, accuracy: null };

        // Check if meeting requires location and fallback is not already active
        if (meeting?.location?.latitude && !fallbackActive) {
            setIsLocating(true);
            try {
                if (!navigator.geolocation) {
                    throw new Error("Geolocation not supported by this browser.");
                }

                const getPosition = (options) => new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, options);
                });

                let position;
                try {
                    // Try High Accuracy first (12s timeout)
                    position = await getPosition({
                        enableHighAccuracy: true,
                        timeout: 12000,
                        maximumAge: 0
                    });
                } catch (err) {
                    console.warn("High accuracy GPS failed, trying standard accuracy...", err);
                    position = await getPosition({
                        enableHighAccuracy: false,
                        timeout: 12000,
                        maximumAge: 60000
                    });
                }

                const acc = position.coords.accuracy || 0;
                userLocation.lat = position.coords.latitude;
                userLocation.long = position.coords.longitude;
                userLocation.accuracy = acc;

                // Detect if iOS Safari Precise Location is off (typically accuracy > 800m)
                if (acc > 800) {
                    setPreciseLocationWarning(true);
                } else {
                    setPreciseLocationWarning(false);
                }

            } catch (error) {
                console.error("GPS Failure:", error);
                setIsLocating(false);

                const isRelaxed = meeting?.allowManualOverride || meeting?.category === 'Training';
                if (!isRelaxed) {
                    if (error.code === 1) { // PERMISSION_DENIED
                        setLocationErrorType('denied');
                        setStatus('error');
                        setMsg("Location access denied. Click 'Continue without location' below to verify with your device.");
                    } else if (error.code === 2 || error.code === 3) {
                        setLocationErrorType('weak_signal');
                        setStatus('error');
                        setMsg("GPS signal weak. Move outdoors or click 'Continue without location' below.");
                    } else {
                        setLocationErrorType('denied');
                        setStatus('error');
                        setMsg(`Location error: ${error.message || 'Verification failed'}. Click 'Continue without location' below.`);
                    }
                    return;
                }
                console.warn("GPS failed but Manual Override/Training is active. Proceeding...");
            }
            setIsLocating(false);
        }

        setStatus('submitting');
        try {
            let activeToken = token;
            if (!activeToken) {
                try {
                    const tokenRes = await api.post('/tokens/issue', { meetingCode });
                    if (tokenRes.data?.token) {
                        activeToken = tokenRes.data.token;
                        setToken(activeToken);
                    }
                } catch (tErr) {
                    console.warn("Auto-token acquisition note:", tErr);
                }
            }

            const deviceId = await getPersistentDeviceId();
            const res = await api.post('/attendance/submit', {
                meetingCode: meetingCode.toLowerCase(),
                deviceId,
                token: activeToken,
                userLat: userLocation.lat,
                userLong: userLocation.long,
                accuracy: userLocation.accuracy,
                responses: {
                    ...responses,
                    studentRegNo: responses.studentRegNo // Ensure it's passed
                }
            });
            setStatus('success');
            setMsg(`Attendance recorded successfully for ${res.data.memberName || 'you'}!`);
            // Use per-day key for trainings to avoid blocking future days
            const isTrainingNow = meeting?.isTraining || meeting?.category === 'Training';
            const dayNow = meeting?.activeDay || 1;
            const successKey = isTrainingNow
                ? `doulos_attendance_status_${meetingCode}_day${dayNow}`
                : `doulos_attendance_status_${meetingCode}`;
            localStorage.setItem(successKey, 'success');
            // Show training celebration banner for training sessions
            if (isTrainingNow) {
                setShowTrainingBanner(true);
                setTimeout(() => setShowTrainingBanner(false), 5000);
            }
            if (res.data.showGraduationCongrats) {
                setShowCongrats(true);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Submission failed. Please try again.';
            const status = err.response?.status;

            // Lock out on specific violations (403 Forbidden / 409 Conflict)
            // e.g. Device Mismatch, One Scan Per Week, Time Violation
            if (status === 403 || status === 409) {
                // Don't write the lock in test/superuser mode so retesting works
                if (!isTestMode && !['developer', 'superadmin'].includes(localStorage.getItem('role'))) {
                    // Use per-day lock key for trainings
                    const isTrainingErr = meeting?.isTraining || meeting?.category === 'Training';
                    const dayErr = meeting?.activeDay || 1;
                    const lockKey = isTrainingErr
                        ? `doulos_attendance_lock_${meetingCode}_day${dayErr}`
                        : `doulos_attendance_lock_${meetingCode}`;
                    localStorage.setItem(lockKey, JSON.stringify({
                        reason: errorMsg,
                        timestamp: Date.now()
                    }));
                }
                setStatus('locked');
                setMsg(errorMsg);
            } else {
                setStatus('error');
                setMsg(errorMsg);
            }
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
                <BackgroundGallery />
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div 
            className="doulos-direct-checkin-wrapper"
            style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '1.5rem 1rem', 
                position: 'relative',
                background: '#0B1120',
                color: '#FFFFFF',
                boxSizing: 'border-box'
            }}
        >
            <BackgroundGallery />
            {/* Dark glass backdrop overlay ensuring high contrast over background photos */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'radial-gradient(circle at 50% 10%, rgba(29, 78, 216, 0.25) 0%, rgba(11, 17, 32, 0.88) 55%, rgba(2, 6, 23, 0.97) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />
            <ValentineRain />

            {/* Error Popover */}
            {(msg && (status === 'error' || status === 'locked')) || hasAlreadyCheckedIn ? (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2000,
                    width: '90%',
                    maxWidth: '420px',
                    padding: '1.1rem 1.25rem',
                    borderRadius: '16px',
                    background: hasAlreadyCheckedIn ? 'rgba(217, 119, 6, 0.95)' : 'rgba(220, 38, 38, 0.95)',
                    backdropFilter: 'blur(16px)',
                    color: '#FFFFFF',
                    boxShadow: '0 20px 35px rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    fontWeight: 700,
                    animation: 'slideDown 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxSizing: 'border-box'
                }}>
                    {hasAlreadyCheckedIn ? <Clock size={22} style={{ flexShrink: 0 }} /> : <XCircle size={22} style={{ flexShrink: 0 }} />}
                    <div style={{ flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal', fontSize: '0.88rem', lineHeight: '1.4' }}>
                        {hasAlreadyCheckedIn ? "Double check-in detected! You've already marked attendance." : msg}
                    </div>
                    <button
                        type="button"
                        onClick={() => { setMsg(''); setHasAlreadyCheckedIn(false); }}
                        style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0.25rem' }}
                    >
                        ✕
                    </button>
                </div>
            ) : null}

            {/* Top Brand Header */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '1.5rem', animation: 'fadeIn 0.6s ease-out' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                    <Logo size={68} showText={false} />
                </div>
                <h1 style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    margin: '0 0 0.45rem 0',
                    color: '#FFFFFF'
                }}>
                    DOULOS <span style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CHECK-IN</span>
                </h1>
                {meeting && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.35rem 0.95rem',
                        background: 'rgba(30, 41, 59, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: '#94A3B8',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        <MapPin size={13} color="#38BDF8" />
                        <span style={{ color: '#FFFFFF' }}>{meeting.name}</span>
                        <span>·</span>
                        <span>{meeting.campus}</span>
                    </div>
                )}
                {meeting?.location?.latitude && (
                    <div style={{
                        marginTop: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.3rem 0.85rem',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: '#38BDF8'
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
                            <span>Geofenced Venue Verification Active</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Check-In Card Container */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '430px',
                padding: '2rem 1.65rem',
                background: '#0B1120',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(29, 78, 216, 0.2)',
                boxSizing: 'border-box',
                animation: 'popScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {hasAlreadyCheckedIn ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(255, 215, 0, 0.12)', width: '90px', height: '90px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid rgba(251, 191, 36, 0.3)' }}>
                            <span style={{ fontSize: '2.8rem' }}>😎</span>
                        </div>
                        <h2 style={{ color: '#FBBF24', fontSize: '1.45rem', fontWeight: 900, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                            Already Checked In!
                        </h2>
                        <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', marginBottom: '2rem', fontStyle: 'italic' }}>
                            {meeting?.campus?.toLowerCase().includes('athi') ? (
                                <>
                                    "A banter wauh i see what you are trying to do, go to sleep..." 🛌💤
                                    <br /><span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginTop: '0.75rem' }}>(Seriously, your attendance is already marked!)</span>
                                </>
                            ) : (
                                <>
                                    "Nairobi traffic is enough stress, don't stress our database too!" 🚗💨
                                    <br /><span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginTop: '0.75rem' }}>(You're all set! See you next week!)</span>
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setStatus('idle');
                                setHasAlreadyCheckedIn(false);
                                setMemberInfo(null);
                                setResponses({ studentRegNo: '', dailyQuestionAnswer: '' });
                                setMsg('');
                            }}
                            style={{
                                width: '100%',
                                padding: '1.05rem',
                                background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                                border: 'none',
                                fontWeight: 900,
                                borderRadius: '16px',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)'
                            }}
                        >
                            Check In Another Person
                        </button>
                    </div>

                ) : (status === 'idle' || status === 'submitting') ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                        {msg && (
                            <div style={{
                                padding: '0.95rem 1.1rem',
                                borderRadius: '14px',
                                background: status === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: status === 'error' ? '#FCA5A5' : '#86EFAC',
                                border: `1px solid ${status === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                animation: 'fadeIn 0.25s ease-out'
                            }}>
                                {status === 'error' ? '⚠️' : '✅'} {msg}
                            </div>
                        )}

                        {/* Location Access Denied / Weak Signal Fallback Banner */}
                        {locationErrorType && (
                            <div style={{
                                padding: '1.15rem 1.25rem',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                                borderRadius: '16px',
                                textAlign: 'center',
                                animation: 'fadeIn 0.25s ease-out'
                            }}>
                                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FBBF24', marginBottom: '0.35rem' }}>
                                    📍 GPS Verification Fallback
                                </div>
                                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: '0 0 0.85rem 0' }}>
                                    Continue with device-bound check-in. Your single-use session will be validated directly on this device.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleContinueWithoutLocation}
                                    disabled={isStampingFallback}
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem',
                                        background: '#F59E0B',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#0F172A',
                                        fontWeight: 900,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                                    }}
                                >
                                    {isStampingFallback ? 'Securing Device Signature...' : 'Continue Without Location 🛡️'}
                                </button>
                            </div>
                        )}

                        {/* Precise Location Recommendation Notice (iOS Safari) */}
                        {preciseLocationWarning && (
                            <div style={{
                                padding: '0.85rem 1rem',
                                background: 'rgba(59, 130, 246, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '14px',
                                fontSize: '0.78rem',
                                color: '#93C5FD',
                                lineHeight: 1.5
                            }}>
                                ℹ️ <strong>Improve GPS Accuracy:</strong> On iPhone/iPad, go to <em>Settings → Privacy & Security → Location Services → Safari</em> and turn <strong>Precise Location: ON</strong>.
                            </div>
                        )}

                        {/* Member Verified Badge Card */}
                        {memberInfo && (
                            <div style={{
                                padding: '0.85rem 1.1rem',
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1.5px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                animation: 'fadeIn 0.3s ease'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1120' }}>
                                        <Check size={18} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#FFFFFF' }}>{memberInfo.name}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#34D399', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Verified Member</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMemberInfo(null);
                                        setResponses(prev => ({ ...prev, studentRegNo: '' }));
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        fontSize: '0.74rem',
                                        padding: '0.3rem'
                                    }}
                                >
                                    Change
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Admission Number Input */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.76rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.8px',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8'
                                }}>
                                    Admission Number <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input-field"
                                        placeholder="22-0990"
                                        style={{
                                            height: '48px',
                                            fontSize: '1.05rem',
                                            fontWeight: 800,
                                            padding: '0 1.15rem',
                                            background: '#020617',
                                            border: memberInfo ? '1.5px solid #10B981' : '1.5px solid rgba(56, 189, 248, 0.35)',
                                            color: '#FFFFFF',
                                            borderRadius: '14px',
                                            transition: 'all 0.2s ease',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            outline: 'none'
                                        }}
                                        value={responses.studentRegNo || ''}
                                        readOnly={!!memberInfo}
                                        onChange={e => {
                                            if (memberInfo) return;
                                            let val = e.target.value;
                                            let digits = val.replace(/\D/g, '');
                                            let formatted = digits;
                                            if (digits.length > 2) {
                                                formatted = digits.slice(0, 2) + '-' + digits.slice(2, 6);
                                            }
                                            val = formatted;

                                            if (digits.length >= 6) {
                                                lookupMember(formatted);
                                            } else {
                                                setMemberInfo(null);
                                            }

                                            setResponses(prev => ({ ...prev, studentRegNo: val }));
                                            if (msg) setMsg('');
                                        }}
                                        maxLength={7}
                                        required
                                        disabled={status === 'submitting'}
                                    />
                                    {isLookingUp && (
                                        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                                            <Loader2 className="animate-spin" size={18} color="#38BDF8" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ══ INTERACTIVE QUESTION OF THE DAY CARD (ALWAYS VISIBLE WHEN CONFIGURED) ══ */}
                            {meeting?.questionOfDay && (
                                <div style={{
                                    width: '100%',
                                    padding: '1.15rem 1.25rem',
                                    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%)',
                                    border: '1.5px solid rgba(56, 189, 248, 0.35)',
                                    borderRadius: '18px',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24' }}>
                                            <Sparkles size={13} />
                                        </div>
                                        <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Question of the Day
                                        </span>
                                    </div>

                                    <div style={{
                                        borderLeft: '3.5px solid #38BDF8',
                                        paddingLeft: '0.85rem',
                                        marginBottom: '0.9rem'
                                    }}>
                                        <p style={{
                                            fontSize: '1.02rem',
                                            fontWeight: 800,
                                            color: '#FFFFFF',
                                            margin: 0,
                                            lineHeight: 1.45
                                        }}>
                                            {meeting.questionOfDay}
                                        </p>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.4rem' }}>
                                            Your Answer <span style={{ color: '#EF4444' }}>*</span>
                                        </div>
                                        {renderQuestionInput()}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={status === 'submitting' || isLocating || !responses.studentRegNo?.trim()}
                                style={{
                                    width: '100%',
                                    height: '52px',
                                    marginTop: '0.5rem',
                                    background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #0284C7 100%)',
                                    border: 'none',
                                    borderRadius: '16px',
                                    color: '#FFFFFF',
                                    fontSize: '0.96rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.5px',
                                    cursor: (!responses.studentRegNo?.trim() || status === 'submitting' || isLocating) ? 'not-allowed' : 'pointer',
                                    opacity: (!responses.studentRegNo?.trim() || status === 'submitting' || isLocating) ? 0.6 : 1,
                                    boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.6rem',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                {status === 'submitting' || isLocating ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>{isLocating ? 'Verifying Location...' : 'Submitting Attendance...'}</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Complete Check-In</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>

                        {meeting?.previousRecap && (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowRecap(!showRecap)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(167, 139, 250, 0.08)',
                                        border: '1px solid rgba(167, 139, 250, 0.15)',
                                        borderRadius: '1rem',
                                        padding: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        color: '#a78bfa',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <BookOpen size={18} />
                                        <span>MEETING RECAP: LAST WEEK</span>
                                    </div>
                                    {showRecap ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>

                                {showRecap && (
                                    <div className="glass-panel" style={{
                                        marginTop: '1rem',
                                        padding: '1.5rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.6',
                                        border: '1px solid rgba(167, 139, 250, 0.1)',
                                        animation: 'slideDown 0.4s ease-out'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--color-text-dim)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>Meeting Details: {meeting.previousRecap.name}</div>

                                        {meeting.previousRecap.devotion && (
                                            <div style={{ marginBottom: '1.25rem' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '1px' }}>Core Devotion</div>
                                                <div style={{ color: 'rgba(255,255,255,0.8)' }}>{meeting.previousRecap.devotion}</div>
                                            </div>
                                        )}

                                        {meeting.previousRecap.announcements && (
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#facc15', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '1px' }}>Announcements</div>
                                                <div style={{ color: 'rgba(255,255,255,0.8)' }}>{meeting.previousRecap.announcements}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/portal')}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#38BDF8',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}
                            >
                                <span>View My Member Portal & History</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </form>
                ) : status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0', animation: 'fadeIn 1s ease-out' }}>

                        {/* Training celebration banner */}
                        {showTrainingBanner && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3000,
                                overflow: 'hidden', pointerEvents: 'none'
                            }}>
                                {/* Confetti particles */}
                                {['🎉', '🔥', '✨', '🙌', '🎊', '💪', '⚡', '🎯'].map((emoji, i) => (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        top: `${10 + Math.random() * 30}%`,
                                        left: `${5 + i * 12}%`,
                                        fontSize: '1.8rem',
                                        animation: `confettiFall${i % 3} ${1.5 + Math.random()}s ease-out forwards`,
                                        animationDelay: `${i * 0.15}s`
                                    }}>{emoji}</div>
                                ))}
                                {/* Moving banner */}
                                <div style={{
                                    background: 'linear-gradient(90deg, #34d399, #059669, #10b981, #34d399)',
                                    backgroundSize: '300% 100%',
                                    animation: 'bannerSlideIn 0.5s ease-out, gradientShift 2s linear infinite',
                                    padding: '0.6rem 0',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        display: 'inline-block',
                                        animation: 'marqueeScroll 6s linear infinite',
                                        fontWeight: 900,
                                        fontSize: '1rem',
                                        color: 'white',
                                        letterSpacing: '3px',
                                        textTransform: 'uppercase',
                                        textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                    }}>
                                        &nbsp;&nbsp;&nbsp;🔥 WELCOME TO TRAINING! &nbsp;•&nbsp; GOD IS FAITHFUL &nbsp;•&nbsp; 🙌 WELCOME TO TRAINING! &nbsp;•&nbsp; GOD IS FAITHFUL &nbsp;•&nbsp;
                                    </div>
                                </div>
                                <style>{`
                                    @keyframes bannerSlideIn {
                                        from { transform: translateY(-100%); opacity: 0; }
                                        to { transform: translateY(0); opacity: 1; }
                                    }
                                    @keyframes marqueeScroll {
                                        from { transform: translateX(0%); }
                                        to { transform: translateX(-50%); }
                                    }
                                    @keyframes gradientShift {
                                        0% { background-position: 0% 50%; }
                                        100% { background-position: 300% 50%; }
                                    }
                                    @keyframes confettiFall0 {
                                        0% { transform: translateY(-20px) scale(0); opacity: 1; }
                                        100% { transform: translateY(120px) scale(1.2) rotate(20deg); opacity: 0; }
                                    }
                                    @keyframes confettiFall1 {
                                        0% { transform: translateY(-20px) scale(0); opacity: 1; }
                                        100% { transform: translateY(100px) scale(1) rotate(-15deg); opacity: 0; }
                                    }
                                    @keyframes confettiFall2 {
                                        0% { transform: translateY(-20px) scale(0); opacity: 1; }
                                        100% { transform: translateY(140px) scale(1.4) rotate(30deg); opacity: 0; }
                                    }
                                `}</style>
                            </div>
                        )}
                        <div style={{
                            background: 'radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, transparent 70%)',
                            width: '120px', height: '120px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 2rem',
                            animation: 'pulse 2s infinite'
                        }}>
                            <CheckCircle size={64} color="#4ade80" />
                        </div>
                        <h2 style={{ color: '#4ade80', marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.05em' }}>CHECK-IN SUCCESSFUL</h2>
                        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                            Your attendance for <strong>{meeting?.name}</strong> has been successfully recorded.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <button
                                type="button"
                                style={{
                                    width: '100%',
                                    height: '52px',
                                    borderRadius: '1rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 900,
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                                onClick={() => navigate(`/portal?reg=${encodeURIComponent(responses.studentRegNo || '')}`)}
                            >
                                <span>Go to My Douloid / Recruit Portal</span>
                                <ArrowRight size={18} />
                            </button>
                            <button
                                type="button"
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    borderRadius: '1rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setStatus('idle');
                                    setMemberInfo(null);
                                    setResponses({ studentRegNo: '', dailyQuestionAnswer: '' });
                                    setMsg('');
                                }}
                            >
                                Check In Another Person
                            </button>
                            <button
                                className="btn"
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    color: 'var(--color-text-dim)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => window.close()}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                ) : status === 'maintenance' ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(250, 204, 21, 0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Clock size={60} color="#facc15" />
                        </div>
                        <h2 style={{ color: '#facc15', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>SYSTEM MAINTENANCE</h2>
                        <p style={{ marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>
                            {msg}
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setStatus('idle');
                                setMsg('');
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontWeight: 800,
                                borderRadius: '0.75rem'
                            }}
                        >
                            TRY AGAIN
                        </button>
                    </div>
                ) : status === 'locked' ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Lock size={60} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>ACCESS DENIED</h2>
                        <p style={{ marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>
                            {msg}
                        </p>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setStatus('idle');
                                setMsg('');
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontWeight: 800,
                                borderRadius: '0.75rem'
                            }}
                        >
                            TRY AGAIN
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <XCircle size={60} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>CHECK-IN FAILED</h2>
                        <p style={{ marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>{msg}</p>

                        <button
                            className="btn"
                            onClick={() => setStatus('idle')}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                fontWeight: 800,
                                borderRadius: '0.75rem'
                            }}
                        >
                            RETRY
                        </button>
                    </div>
                )}
            </div>

            {showCongrats && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: '#000000', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '2rem', textAlign: 'center',
                    overflow: 'hidden'
                }}>
                    <div className="fireworks-container" style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', top: 0, left: 0 }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={`firework fw-${i}`} style={{
                                position: 'absolute',
                                left: `${10 + Math.random() * 80}%`,
                                top: `${10 + Math.random() * 80}%`,
                            }} />
                        ))}
                    </div>

                    <div style={{
                        position: 'relative', zIndex: 2,
                        animation: 'congratsPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                            width: '120px', height: '120px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 50px rgba(255, 215, 0, 0.4)', margin: '0 auto 2rem'
                        }}>
                            <Trophy size={60} color="white" />
                        </div>
                        <h1 style={{ fontSize: '3rem', color: '#FFD700', marginBottom: '1rem', textShadow: '0 0 30px rgba(255, 215, 0, 0.5)', fontWeight: 900 }}>
                            CONGRATULATIONS!
                        </h1>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
                            You have officially graduated to a DOULOID!
                        </h2>
                        <p style={{ maxWidth: '450px', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: '3rem' }}>
                            A new chapter begins. Welcome to the elite family of Doulos!
                        </p>
                        <button
                            className="btn"
                            style={{ padding: '1.25rem 4rem', background: '#FFD700', color: '#000', fontWeight: 'bold', borderRadius: '3rem', fontSize: '1.2rem', cursor: 'pointer', border: 'none' }}
                            onClick={() => setShowCongrats(false)}
                        >
                            THANK YOU! 🚀
                        </button>
                    </div>

                    <style>{`
                    @keyframes congratsPop {
                        0% { transform: scale(0); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .firework {
                        width: 5px; height: 5px; border-radius: 50%;
                        box-shadow: 0 0 #fff;
                        animation: explode 2s infinite;
                    }
                    .fw-0 { animation-delay: 0s; color: gold; }
                    .fw-1 { animation-delay: 0.5s; color: #fff; }
                    .fw-2 { animation-delay: 1s; color: #FFD700; }
                    .fw-3 { animation-delay: 1.5s; color: #FFA500; }
                    @keyframes explode {
                        0% { transform: scale(1); opacity: 1; }
                        100% { 
                            transform: scale(35); opacity: 0;
                            box-shadow: -50px -50px 0 1px, 50px -50px 0 1px, 50px 50px 0 1px, -50px 50px 0 1px, 0 -70px 0 1px, -70px 0 0 1px, 70px 0 0 1px, 0 70px 0 1px;
                        }
                    }
                    @keyframes pulse-border {
                        0% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
                        50% { border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
                        100% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
                    }
                `}</style>
                </div>
            )}

            <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>
                Doulos Attendance System &bull; &copy; {new Date().getFullYear()}
            </p>
        </div>
    );
};

export default CheckIn;
