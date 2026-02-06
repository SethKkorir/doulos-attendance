import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Loader2, BookOpen, ChevronDown, ChevronUp, Trophy, Star, Clock } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';

const CheckIn = () => {
    const { meetingCode } = useParams();
    const [meeting, setMeeting] = useState(null);
    const [responses, setResponses] = useState({});
    const [memberType, setMemberType] = useState(''); // Douloid, Recruit, Visitor
    const [status, setStatus] = useState('loading'); // loading, idle, submitting, success, error
    const [showRecap, setShowRecap] = useState(false);
    const [memberInfo, setMemberInfo] = useState(null); // { name, type } from registry
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [showCongrats, setShowCongrats] = useState(false);
    const [msg, setMsg] = useState('');
    const [timeLeft, setTimeLeft] = useState(25); // 25 seconds for the "Race"
    const [serverStartTime, setServerStartTime] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

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
        const fetchMeeting = async () => {
            try {
                const res = await api.get(`/meetings/code/${meetingCode}`);
                setMeeting(res.data);
                setServerStartTime(res.data.serverStartTime);

                // Initialize timer
                const sessionDuration = 25;
                setTimeLeft(sessionDuration);

                // Initialize responses with empty strings for each required field
                const initialResponses = {};
                res.data.requiredFields.forEach(f => {
                    initialResponses[f.key] = '';
                });
                if (res.data.questionOfDay) {
                    initialResponses['dailyQuestionAnswer'] = '';
                }
                setResponses(initialResponses);

                const userRole = localStorage.getItem('role');
                const isSuperUser = ['developer', 'superadmin'].includes(userRole);

                if (!res.data.isActive && !res.data.isTestMeeting && !isSuperUser) {
                    setStatus('error');
                    setMsg('This meeting is currently closed for attendance.');
                } else {
                    setStatus('idle');
                }
            } catch (err) {
                setStatus('error');
                setMsg(err.response?.data?.message || 'Invalid or expired meeting link');
            }
        };
        fetchMeeting();
    }, [meetingCode]);

    useEffect(() => {
        if (status !== 'idle' || !meeting) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, meeting]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            const deviceId = getPersistentDeviceId();
            const res = await api.post('/attendance/submit', {
                meetingCode,
                deviceId,
                serverStartTime,
                responses: {
                    ...responses,
                    studentRegNo: responses.studentRegNo // Ensure it's passed
                }
            });
            setStatus('success');
            setMsg(`Attendance recorded successfully for ${res.data.memberName || 'you'}!`);
            if (res.data.showGraduationCongrats) {
                setShowCongrats(true);
            }
        } catch (err) {
            setStatus('error');
            setMsg(err.response?.data?.message || 'Submission failed. Please try again.');
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

            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeIn 0.8s ease-out' }}>
                <div style={{ animation: 'rotateLogo 30s linear infinite', display: 'inline-block', marginBottom: '1.5rem' }}>
                    <Logo size={90} showText={false} />
                </div>
                <h1 style={{
                    fontSize: '2.5rem',
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
            </div>

            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '500px',
                padding: '3rem',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(20px)'
            }}>
                {isExpired ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Clock size={40} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>SESSION EXPIRED</h2>
                        <p style={{ marginBottom: '2rem', fontSize: '0.95rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>
                            For security, you must submit your check-in within 20 seconds of scanning the physical banner.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                            style={{ width: '100%', height: '55px', borderRadius: '0.75rem' }}
                        >
                            RE-SCAN BANNER
                        </button>
                    </div>
                ) : (status === 'idle' || status === 'submitting') ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Countdown Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: timeLeft < 10 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 170, 225, 0.1)',
                            borderRadius: '0.75rem',
                            border: `1px solid ${timeLeft < 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 170, 225, 0.2)'}`,
                            marginBottom: '1rem',
                            animation: timeLeft < 10 ? 'pulse-border 1s infinite' : 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft < 10 ? '#f87171' : '#25AAE1' }}>
                                <Clock size={16} />
                                <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px' }}>SECURITY TIMER</span>
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: timeLeft < 10 ? '#f87171' : '#25AAE1' }}>
                                {timeLeft}s
                            </div>
                        </div>
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

                        {[...(meeting?.requiredFields || [])]
                            .sort((a, b) => {
                                if (a.key === 'studentRegNo') return -1;
                                if (b.key === 'studentRegNo') return 1;
                                return 0;
                            })
                            .map((field) => {
                                const isNameField = field.key.toLowerCase().includes('name') && field.key !== 'studentRegNo';
                                const isLocked = memberInfo && isNameField;

                                return (
                                    <div key={field.key} style={{ animation: 'fadeIn 0.5s ease-out' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 900,
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            color: isLocked ? '#25AAE1' : 'var(--color-text-dim)'
                                        }}>
                                            {field.label} {field.required && !isLocked && <span style={{ color: '#ef4444' }}>*</span>}
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="input-field"
                                                placeholder={field.key === 'studentRegNo' ? 'ADMISSION NO (22-0000)' : field.label}
                                                style={{
                                                    height: '55px',
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    paddingLeft: '1.25rem',
                                                    background: isLocked ? 'rgba(37, 170, 225, 0.05)' : 'rgba(0,0,0,0.2)',
                                                    borderColor: isLocked ? 'rgba(37, 170, 225, 0.3)' : 'var(--glass-border)',
                                                    color: isLocked ? '#25AAE1' : 'white',
                                                    cursor: isLocked ? 'not-allowed' : 'text',
                                                    borderRadius: '0.75rem',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                value={isLocked ? memberInfo.name : (responses[field.key] || '')}
                                                readOnly={isLocked}
                                                onChange={e => {
                                                    if (isLocked) return;
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    let formatted = val;
                                                    if (val.length > 2) {
                                                        formatted = val.slice(0, 2) + '-' + val.slice(2, 6);
                                                    }

                                                    if (val.length === 6) {
                                                        lookupMember(formatted);
                                                    } else {
                                                        setMemberInfo(null);
                                                    }

                                                    setResponses({ ...responses, [field.key]: formatted });
                                                    if (msg) setMsg('');
                                                }}
                                                maxLength={field.key === 'studentRegNo' ? 7 : undefined}
                                                required={field.required}
                                                disabled={status === 'submitting'}
                                            />
                                            {field.key === 'studentRegNo' && isLookingUp && (
                                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                                                    <div className="loading-spinner-small" style={{ width: '18px', height: '18px', borderTopColor: '#25AAE1' }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                        {meeting?.questionOfDay && (
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '1rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 900,
                                    letterSpacing: '1px',
                                    color: '#dd5d6c',
                                    textTransform: 'uppercase'
                                }}>
                                    <Star size={18} /> {meeting.questionOfDay}
                                </label>
                                <textarea
                                    className="input-field"
                                    placeholder="Type your response here..."
                                    style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        minHeight: '120px',
                                        borderRadius: '1rem',
                                        fontSize: '1rem',
                                        padding: '1.25rem',
                                        lineHeight: '1.6'
                                    }}
                                    value={responses['dailyQuestionAnswer'] || ''}
                                    onChange={e => setResponses({ ...responses, dailyQuestionAnswer: e.target.value })}
                                    required
                                    disabled={status === 'submitting'}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={status === 'submitting'}
                            style={{
                                height: '65px',
                                marginTop: '1.5rem',
                                fontSize: '1.1rem',
                                fontWeight: 900,
                                borderRadius: '1rem',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                boxShadow: '0 15px 30px -10px hsl(var(--color-primary) / 0.4)'
                            }}
                        >
                            {status === 'submitting' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                                    <div className="loading-spinner-small"></div>
                                    SUBMITTING...
                                </div>
                            ) : 'COMPLETE CHECK-IN'}
                        </button>

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
                        <div style={{
                            background: 'radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, transparent 70%)',
                            width: '120px', height: '120px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 2rem',
                            animation: 'pulse 2s infinite'
                        }}>
                            <CheckCircle size={64} color="#4ade80" />
                        </div>
                        <h2 style={{ color: '#4ade80', marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.05em' }}>CHECK-IN SUCCESSFUL</h2>
                        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                            Your attendance for <strong>{meeting?.name}</strong> has been successfully recorded.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', height: '60px', borderRadius: '1rem', fontSize: '1rem', fontWeight: 900 }}
                                onClick={() => window.location.href = '/portal'}
                            >
                                GO TO STUDENT PORTAL
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
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <XCircle size={60} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>CHECK-IN FAILED</h2>
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
                    background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '2rem', textAlign: 'center', backdropFilter: 'blur(15px)',
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
        </div >
    );
};

export default CheckIn;
