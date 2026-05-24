import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Loader2, BookOpen, ChevronDown, ChevronUp, Trophy, Star, Clock, Lock } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';

const CheckIn = () => {
    const params = useParams();
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
    const [isNewMember, setIsNewMember] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        name: '',
        campus: 'Athi River',
        memberType: 'Douloid'
    });
    const [systemStatus, setSystemStatus] = useState({ recoveryMode: false });
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [currentSemester, setCurrentSemester] = useState('');
    const [lastActiveSemester, setLastActiveSemester] = useState('');
    const [semesterTheme, setSemesterTheme] = useState('');
    const [semesterVerse, setSemesterVerse] = useState('');

    useEffect(() => {
        let timer;
        if (msg) {
            timer = setTimeout(() => setMsg(''), 6000);
        }
        return () => clearTimeout(timer);
    }, [msg]);

    const getPersistentDeviceId = () => {
        let deviceId = localStorage.getItem('doulos_device_id');
        if (!deviceId) {
            deviceId = 'DL-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('doulos_device_id', deviceId);
        }
        return deviceId;
    };

    useEffect(() => {
        if (!meetingCode) return;

        const fetchMeeting = async () => {
            try {
                const deviceId = getPersistentDeviceId();
                const [meetingRes, statusRes] = await Promise.all([
                    api.get(`/meetings/code/${meetingCode}?deviceId=${deviceId}`),
                    api.get('/auth/system-status')
                ]);
                
                const meetingData = meetingRes.data;
                setMeeting(meetingData);
                setSystemStatus(statusRes.data || { recoveryMode: false });

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
                const bypassLocks = isSuperUser || isTestMode;

                // --- DUPLICATE CHECK-IN DETECTION ---
                // Check both LocalStorage AND Server-Side Record
                const localStatus = localStorage.getItem(`doulos_attendance_status_${meetingCode}`);
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
                    const lockData = localStorage.getItem(`doulos_attendance_lock_${meetingCode}`);
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
        if (!regNo || regNo.length < 5) {
            setMemberInfo(null);
            return;
        }
        setIsLookingUp(true);
        try {
            const res = await api.get(`/attendance/student/${regNo}`);
            if (res.data && res.data.stats.percentage !== undefined) {
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
            if (err.response?.status === 404 && systemStatus.recoveryMode) {
                setIsNewMember(true);
            } else {
                setMemberInfo(null);
            }
        } finally {
            setIsLookingUp(false);
        }
    };



    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

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

    const submitAttendanceRecord = async () => {
        let userLocation = { lat: null, long: null };

        // Check if meeting requires location
        if (meeting?.location?.latitude) {
            setIsLocating(true);
            try {
                // Check if browser supports geolocation and is in a secure context
                if (!navigator.geolocation) {
                    throw new Error("Geolocation not supported by this browser.");
                }

                const getPosition = (options) => new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, options);
                });

                let position;
                try {
                    // Try High Accuracy first
                    position = await getPosition({
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    });
                } catch (err) {
                    console.warn("High accuracy GPS failed, trying standard accuracy...", err);
                    // Fallback to standard accuracy
                    position = await getPosition({
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 60000 // Allow 1-minute old cached location
                    });
                }

                userLocation.lat = position.coords.latitude;
                userLocation.long = position.coords.longitude;
            } catch (error) {
                console.error("GPS Failure:", error);

                // CRITICAL: If Admin has enabled Manual Override for this meeting, 
                // we allow submission even if GPS fails (useful for remote areas/insecure contexts)
                const isRelaxed = meeting?.allowManualOverride || meeting?.category === 'Training';
                if (!isRelaxed) {
                    setIsLocating(false);
                    setStatus('error');
                    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
                        setMsg("SECURITY BLOCK: Browsers disable GPS on non-HTTPS connections. Please use the Vercel link or Admin check-in.");
                    } else if (error.code === 1) {
                        setMsg("Location access denied. You must grant permission to check in.");
                    } else if (error.code === 2 || error.code === 3) {
                        setMsg("GPS signal too weak. Try moving outdoors or wait a moment.");
                    } else {
                        setMsg(`Location error: ${error.message || 'Verification failed'}`);
                    }
                    return;
                }
                console.warn("GPS failed but Manual Override/Training is active. Proceeding...");
            }
            setIsLocating(false);
        }

        setStatus('submitting');
        try {
            const deviceId = getPersistentDeviceId();
            const res = await api.post('/attendance/submit', {
                meetingCode: meetingCode.toLowerCase(),
                deviceId,
                userLat: userLocation.lat,
                userLong: userLocation.long,
                responses: {
                    ...responses,
                    studentRegNo: responses.studentRegNo // Ensure it's passed
                },
                isNewMember,
                registrationData: isNewMember ? registrationData : null
            });
            setStatus('success');
            setMsg(`Attendance recorded successfully for ${res.data.memberName || 'you'}!`);
            localStorage.setItem(`doulos_attendance_status_${meetingCode}`, 'success');
            // Show training celebration banner for training sessions
            if (meeting?.isTraining || meeting?.category === 'Training') {
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
                    localStorage.setItem(`doulos_attendance_lock_${meetingCode}`, JSON.stringify({
                        reason: errorMsg,
                        timestamp: Date.now()
                    }));
                    setTimeout(() => window.location.href = '/portal', 4000);
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
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: '1.5rem', position: 'relative' }}>
            <BackgroundGallery />
            <ValentineRain />

            {/* Error Popover */}
            {(msg && (status === 'error' || status === 'locked')) || hasAlreadyCheckedIn ? (
                <div style={{
                    position: 'fixed',
                    top: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2000,
                    width: '90%',
                    maxWidth: '400px',
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    background: hasAlreadyCheckedIn ? '#d97706' : '#dc2626',
                    color: 'white',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontWeight: 700,
                    animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    {hasAlreadyCheckedIn ? <Clock size={24} /> : <XCircle size={24} />}
                    <div style={{ flex: 1 }}>
                        {hasAlreadyCheckedIn ? "Double check-in detected! You've already marked attendance." : msg}
                    </div>
                    <button
                        onClick={() => { setMsg(''); setHasAlreadyCheckedIn(false); }}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}
                    >
                        ✕
                    </button>
                </div>
            ) : null}

            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeIn 0.8s ease-out' }}>
                <div style={{ animation: 'rotateLogo 30s linear infinite', display: 'inline-block', marginBottom: '1.5rem' }}>
                    <Logo size={80} showText={false} />
                </div>
                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    margin: 0,
                    textShadow: '0 0 30px rgba(255, 255, 255, 0.2)'
                }}>
                    DOULOS <span style={{ color: 'hsl(var(--color-primary))' }}>CHECK-IN</span>
                </h1>
                {meeting && (
                    <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--color-text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{ width: '15px', height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                        {meeting.name} &bull; {meeting.campus}
                        <div style={{ width: '15px', height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                    </div>
                )}
                {meeting?.allowManualOverride && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.8rem',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.2)',
                        borderRadius: '0.75rem',
                        color: '#eab308',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>📡 REMOTE MODE: Admin check-in preferred today.</span>
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem 2rem',
                background: '#0f172a',
                border: '1px solid var(--glass-border)',
                borderRadius: '1.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {hasAlreadyCheckedIn ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(255, 215, 0, 0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <span style={{ fontSize: '3rem' }}>😎</span>
                        </div>
                        <h2 style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase' }}>
                            Easy There, Douloid!
                        </h2>
                        <div style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', fontStyle: 'italic' }}>
                            {meeting?.campus?.toLowerCase().includes('athi') ? (
                                <>
                                    "A banter wauh i see what you are trying to do, go to sleep..." 🛌💤
                                    <br /><span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginTop: '1rem' }}>(Seriously, you're already checked in!)</span>
                                </>
                            ) : (
                                <>
                                    "Nairobi traffic is enough stress, don't stress our database too!" 🚗💨
                                    <br /><span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginTop: '1rem' }}>(You're good! See you next week!)</span>
                                </>
                            )}
                        </div>

                        <button
                            className="btn"
                            onClick={() => window.location.href = '/portal'}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                fontWeight: 800,
                                borderRadius: '0.75rem',
                                color: 'white'
                            }}
                        >
                            CHECK MY PORTAL
                        </button>
                    </div>

                ) : (status === 'idle' || status === 'submitting') ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Permanent Welcome Banner for New Members */}
                        {isNewMember && (
                            <div style={{
                                background: 'rgba(37, 170, 225, 0.1)',
                                border: '1px solid rgba(37, 170, 225, 0.3)',
                                padding: '1rem 1.25rem',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem',
                                animation: 'slideDown 0.5s ease-out'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>👋</span>
                                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4, color: '#fff', fontWeight: 600 }}>
                                    Welcome! We couldn't find your record in our new system yet. <strong>Please tell us a bit about yourself</strong> to check in.
                                </p>
                            </div>
                        )}

                        {msg && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '1rem',
                                background: status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: status === 'error' ? '#f87171' : '#4ade80',
                                border: `1px solid ${status === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                animation: 'fadeIn 0.3s ease-out'
                            }}>
                                {status === 'error' ? '⚠️' : '✅'} {msg}
                            </div>
                        )}

                        {memberInfo && (
                            <div style={{
                                padding: '1.25rem',
                                background: 'linear-gradient(135deg, rgba(37, 170, 225, 0.1) 0%, transparent 100%)',
                                borderRadius: '1rem',
                                border: '1px solid rgba(37, 170, 225, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                animation: 'slideRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    borderRadius: '50%',
                                    background: '#25AAE1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '1px', textTransform: 'uppercase' }}>Verified Member</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{memberInfo.name}</div>
                                </div>
                            </div>
                        )}

                        {isNewMember ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Wizard Step Indicator */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        <span>Registration Progress</span>
                                        <span style={{ color: 'hsl(var(--color-primary))' }}>Step {regStep} of 2</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: regStep === 1 ? '50%' : '100%', height: '100%', background: 'linear-gradient(90deg, hsl(var(--color-primary)) 0%, #38bdf8 100%)', borderRadius: '2px', transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}></div>
                                    </div>
                                </div>

                                {regStep === 1 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.4s ease-out' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#25AAE1' }}>
                                                ADMISSION NUMBER
                                            </label>
                                            <input
                                                className="input-field"
                                                style={{
                                                    height: '45px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    paddingLeft: '1.25rem',
                                                    background: 'rgba(37, 170, 225, 0.05)',
                                                    borderColor: 'rgba(37, 170, 225, 0.3)',
                                                    color: '#25AAE1',
                                                    borderRadius: '0.75rem',
                                                    cursor: 'not-allowed',
                                                    width: '100%'
                                                }}
                                                value={responses.studentRegNo || ''}
                                                readOnly
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '0.25rem', display: 'block' }}>Verified from your check-in code.</span>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
                                                FULL NAME <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                className="input-field"
                                                placeholder="Enter your official name"
                                                style={{
                                                    height: '45px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    paddingLeft: '1.25rem',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderColor: 'var(--glass-border)',
                                                    color: 'white',
                                                    borderRadius: '0.75rem',
                                                    width: '100%',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                value={registrationData.name || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setRegistrationData(prev => ({ ...prev, name: val }));
                                                    setResponses(prev => ({ ...prev, studentName: val }));
                                                    if (msg) setMsg('');
                                                }}
                                                required
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '0.25rem', display: 'block' }}>First name and Last name, matching school registry.</span>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => {
                                                if (registrationData.name.trim().length >= 3) {
                                                    setRegStep(2);
                                                    if (msg) setMsg('');
                                                } else {
                                                    setMsg("Please enter your official name (min 3 chars).");
                                                    setStatus('error');
                                                }
                                            }}
                                            style={{
                                                height: '48px',
                                                fontSize: '0.9rem',
                                                fontWeight: 900,
                                                borderRadius: '0.75rem',
                                                letterSpacing: '1px',
                                                textTransform: 'uppercase',
                                                marginTop: '0.5rem',
                                                boxShadow: '0 10px 20px -8px hsl(var(--color-primary) / 0.4)'
                                            }}
                                        >
                                            CONTINUE
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsNewMember(false);
                                                setRegistrationData({ name: '', campus: 'Athi River', memberType: 'Douloid' });
                                                setResponses(prev => ({ ...prev, studentRegNo: '' }));
                                                setMsg('');
                                                setStatus('idle');
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--color-text-dim)',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                letterSpacing: '1px',
                                                textTransform: 'uppercase',
                                                textAlign: 'center',
                                                marginTop: '0.25rem',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            START OVER / CORRECT ADMISSION NO
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.4s ease-out' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
                                                CAMPUS <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                className="input-field"
                                                style={{
                                                    height: '45px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    paddingLeft: '1.25rem',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderColor: 'var(--glass-border)',
                                                    borderRadius: '0.75rem',
                                                    color: 'white',
                                                    width: '100%',
                                                    appearance: 'none',
                                                    cursor: 'pointer'
                                                }}
                                                value={registrationData.campus || 'Athi River'}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setRegistrationData(prev => ({ ...prev, campus: val }));
                                                }}
                                                required
                                            >
                                                <option value="Athi River">Athi River</option>
                                                <option value="Valley Road">Valley Road</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
                                                CATEGORY <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                className="input-field"
                                                style={{
                                                    height: '45px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    paddingLeft: '1.25rem',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderColor: 'var(--glass-border)',
                                                    borderRadius: '0.75rem',
                                                    color: 'white',
                                                    width: '100%',
                                                    appearance: 'none',
                                                    cursor: 'pointer'
                                                }}
                                                value={registrationData.memberType || 'Douloid'}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setRegistrationData(prev => ({ ...prev, memberType: val }));
                                                }}
                                                required
                                            >
                                                <option value="Douloid">Douloid</option>
                                                <option value="Recruit">Recruit</option>
                                                <option value="Visitor">Visitor</option>
                                            </select>
                                        </div>

                                        {meeting?.questionOfDay && (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: 'hsl(var(--color-primary))' }}>
                                                    Question of the Day <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem', fontWeight: 600 }}>
                                                    "{meeting.questionOfDay}"
                                                </p>
                                                <textarea
                                                    className="input-field"
                                                    placeholder="Type your answer here..."
                                                    style={{
                                                        width: '100%',
                                                        minHeight: '70px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 700,
                                                        padding: '0.75rem 1rem',
                                                        background: 'rgba(0,0,0,0.2)',
                                                        borderColor: 'var(--glass-border)',
                                                        borderRadius: '0.75rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    value={responses.dailyQuestionAnswer || ''}
                                                    onChange={e => setResponses(prev => ({ ...prev, dailyQuestionAnswer: e.target.value }))}
                                                    required
                                                    disabled={status === 'submitting'}
                                                />
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                            <button
                                                type="button"
                                                className="btn"
                                                onClick={() => setRegStep(1)}
                                                style={{
                                                    flex: 1,
                                                    height: '48px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 900,
                                                    borderRadius: '0.75rem',
                                                    letterSpacing: '1px',
                                                    textTransform: 'uppercase',
                                                    background: 'rgba(255,255,255,0.08)',
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                    color: 'white'
                                                }}
                                            >
                                                BACK
                                            </button>

                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={status === 'submitting' || isLocating}
                                                style={{
                                                    flex: 1.5,
                                                    height: '48px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 900,
                                                    borderRadius: '0.75rem',
                                                    letterSpacing: '1px',
                                                    textTransform: 'uppercase',
                                                    boxShadow: '0 10px 20px -8px hsl(var(--color-primary) / 0.4)'
                                                }}
                                            >
                                                {status === 'submitting' || isLocating ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <div className="loading-spinner-small" style={{ width: '14px', height: '14px' }}></div>
                                                        <span>{isLocating ? 'GPS...' : 'SAVING...'}</span>
                                                    </div>
                                                ) : 'REGISTER & IN'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Standard Admission Number Input */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.75rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 900,
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        color: memberInfo ? '#25AAE1' : 'var(--color-text-dim)'
                                    }}>
                                        Admission Number <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="input-field"
                                            placeholder="ADMISSION NO (22-0000)"
                                            style={{
                                                height: '45px',
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                paddingLeft: '1.25rem',
                                                background: memberInfo ? 'rgba(37, 170, 225, 0.05)' : 'rgba(0,0,0,0.2)',
                                                borderColor: memberInfo ? 'rgba(37, 170, 225, 0.3)' : 'var(--glass-border)',
                                                color: memberInfo ? '#25AAE1' : 'white',
                                                cursor: memberInfo ? 'not-allowed' : 'text',
                                                borderRadius: '0.75rem',
                                                transition: 'all 0.3s ease',
                                                width: '100%'
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

                                                if (digits.length === 6) {
                                                    lookupMember(formatted);
                                                } else {
                                                    setMemberInfo(null);
                                                }

                                                setResponses({ ...responses, studentRegNo: val });
                                                if (msg) setMsg('');
                                            }}
                                            maxLength={7}
                                            required
                                            disabled={status === 'submitting'}
                                        />
                                        {isLookingUp && (
                                            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                                                <div className="loading-spinner-small" style={{ width: '18px', height: '18px', borderTopColor: '#25AAE1' }}></div>
                                            </div>
                                        )}
                                        {memberInfo && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMemberInfo(null);
                                                    setResponses(prev => ({ ...prev, studentRegNo: '' }));
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    right: '1rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--color-text-dim)',
                                                    cursor: 'pointer',
                                                    fontWeight: 800,
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                CHANGE
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {meeting?.questionOfDay && memberInfo && (
                                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 900,
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            color: 'hsl(var(--color-primary))'
                                        }}>
                                            Question of the Day <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: '0.75rem', fontWeight: 600 }}>
                                            "{meeting.questionOfDay}"
                                        </p>
                                        <textarea
                                            className="input-field"
                                            placeholder="Type your answer here..."
                                            style={{
                                                width: '100%',
                                                minHeight: '80px',
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                padding: '1rem',
                                                background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '0.75rem',
                                                transition: 'all 0.3s ease'
                                            }}
                                            value={responses.dailyQuestionAnswer || ''}
                                            onChange={e => setResponses({ ...responses, dailyQuestionAnswer: e.target.value })}
                                            required
                                            disabled={status === 'submitting'}
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={status === 'submitting' || isLocating || (!memberInfo && !meeting?.allowManualOverride)}
                                    style={{
                                        height: '50px',
                                        marginTop: '0.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 900,
                                        borderRadius: '0.75rem',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        boxShadow: '0 15px 30px -10px hsl(var(--color-primary) / 0.4)'
                                    }}
                                >
                                    {status === 'submitting' || isLocating ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                                            <div className="loading-spinner-small"></div>
                                            {isLocating ? 'VERIFYING LOCATION...' : 'SUBMITTING...'}
                                        </div>
                                    ) : 'COMPLETE CHECK-IN'}
                                </button>
                            </div>
                        )}

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

                                        <button
                                            onClick={() => window.location.href = '/portal'}
                                            style={{
                                                marginTop: '1.5rem',
                                                background: 'transparent',
                                                border: '1px solid rgba(37, 170, 225, 0.3)',
                                                color: '#25AAE1',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                width: '100%'
                                            }}
                                        >
                                            VIEW ATTENDANCE HISTORY
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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
                        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                            Your attendance for <strong>{meeting?.name}</strong> has been successfully recorded.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', height: '60px', borderRadius: '1rem', fontSize: '1rem', fontWeight: 900 }}
                                onClick={() => window.location.href = '/portal'}
                            >
                                GO TO DOULOS PORTAL
                            </button>
                            <button
                                className="btn"
                                style={{
                                    width: '100%',
                                    height: '50px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    color: 'var(--color-text-dim)'
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
                            className="btn btn-primary"
                            onClick={() => window.location.href = 'https://doulos.co.ke'}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontWeight: 800,
                                borderRadius: '0.75rem',
                                background: '#facc15',
                                color: 'black'
                            }}
                        >
                            VISIT WEBSITE
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
                            className="btn btn-primary"
                            onClick={() => window.location.href = '/portal'}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontWeight: 800,
                                borderRadius: '0.75rem'
                            }}
                        >
                            GO TO PORTAL
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

            {
                showCongrats && (
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
                )
            }

            {/* Semester Rollover Welcome Modal */}
            {showWelcomeModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 3000,
                    background: 'rgba(2, 21, 37, 0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '450px',
                        width: '100%',
                        background: 'linear-gradient(135deg, rgba(9, 29, 46, 0.95) 0%, rgba(2, 21, 37, 0.98) 100%)',
                        border: '2px solid rgba(37, 170, 225, 0.35)',
                        borderRadius: '1.5rem',
                        padding: '2.5rem 2rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                        textAlign: 'center',
                        animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(37, 170, 225, 0.2) 0%, rgba(37, 170, 225, 0.05) 100%)',
                            border: '1px solid rgba(37, 170, 225, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: '#25AAE1',
                            boxShadow: '0 0 30px rgba(37, 170, 225, 0.15)',
                            animation: 'bounce 2.5s infinite'
                        }}>
                            <BookOpen size={36} />
                        </div>

                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            color: 'white',
                            letterSpacing: '-0.02em',
                            margin: '0 0 0.5rem'
                        }}>
                            Welcome to the New Semester!
                        </h2>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            color: '#25AAE1',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            marginBottom: '1.5rem'
                        }}>
                            {currentSemester}
                        </div>

                        {semesterTheme && (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '1rem',
                                padding: '1.25rem',
                                marginBottom: '1.75rem'
                            }}>
                                <div style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 900,
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    letterSpacing: '1.5px',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.5rem'
                                }}>
                                    Our Theme For This Term
                                </div>
                                <h3 style={{
                                    fontSize: '1.3rem',
                                    fontWeight: 900,
                                    color: '#4ade80',
                                    margin: '0 0 0.4rem',
                                    letterSpacing: '-0.01em'
                                }}>
                                    "{semesterTheme}"
                                </h3>
                                {semesterVerse && (
                                    <p style={{
                                        fontSize: '0.82rem',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontStyle: 'italic',
                                        lineHeight: 1.4,
                                        margin: 0
                                    }}>
                                        — {semesterVerse}
                                    </p>
                                )}
                            </div>
                        )}

                        <p style={{
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            color: 'rgba(255, 255, 255, 0.75)',
                            marginBottom: '2rem'
                        }}>
                            Are you active in Doulos this semester?
                            <br />
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                                (If yes, we will track your points and semester requirements. Everyone is welcome to attend!)
                            </span>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => handleWelcomeChoice(true)}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.88rem',
                                    fontWeight: 900,
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    background: 'linear-gradient(135deg, #25AAE1 0%, #0a4d68 100%)',
                                    boxShadow: '0 8px 20px rgba(37, 170, 225, 0.25)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Yes, I am active! 👍
                            </button>
                            <button
                                type="button"
                                onClick={() => handleWelcomeChoice(false)}
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.75)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                            >
                                No, just attending today 😊
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>
                Doulos Attendance System &bull; &copy; {new Date().getFullYear()}
            </p>
        </div >
    );
};

export default CheckIn;
