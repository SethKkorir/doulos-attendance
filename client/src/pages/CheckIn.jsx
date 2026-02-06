import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Loader2, BookOpen, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
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
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: '1rem', background: 'transparent' }}>
            <BackgroundGallery />
            <ValentineRain />
            <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Logo size={80} showText={false} />
                    <h1 style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.25rem' }}>Doulos Check-In</h1>
                    {meeting && <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>{meeting.name} @ {meeting.campus}</p>}
                </div>

                {status === 'idle' || status === 'submitting' ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {msg && (
                            <div style={{
                                position: 'fixed',
                                top: '2rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 2000,
                                minWidth: '300px',
                                padding: '1rem 1.5rem',
                                borderRadius: '0.75rem',
                                background: status === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                                color: 'white',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                fontWeight: 600,
                                animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                {status === 'error' ? '⚠️' : '✅'} {msg}
                                <style>{`
                            @keyframes slideDown {
                                0% { opacity: 0; transform: translate(-50%, -20px); }
                                100% { opacity: 1; transform: translate(-50%, 0); }
                            }
                        `}</style>
                            </div>
                        )}

                        {memberInfo && (
                            <div style={{ padding: '0.8rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', borderRadius: '0.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                                Welcome back, <strong>{memberInfo.name}</strong> ({memberInfo.type})
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
                                    <div key={field.key}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: isLocked ? '#25AAE1' : 'var(--color-text-dim)', fontWeight: isLocked ? 600 : 400 }}>
                                            {field.label} {field.required && !isLocked && <span style={{ color: '#ef4444' }}>*</span>}
                                            {isLocked && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>(Verified Member)</span>}
                                        </label>
                                        <input
                                            className="input-field"
                                            placeholder={field.key === 'studentRegNo' ? 'e.g. 22-0000' : field.label}
                                            style={isLocked ? {
                                                background: 'rgba(37, 170, 225, 0.05)',
                                                borderColor: 'rgba(37, 170, 225, 0.3)',
                                                color: 'rgba(255, 255, 255, 0.9)',
                                                cursor: 'not-allowed',
                                                pointerEvents: 'none',
                                                userSelect: 'none'
                                            } : {}}
                                            value={isLocked ? memberInfo.name : (responses[field.key] || '')}
                                            readOnly={isLocked}
                                            tabIndex={isLocked ? -1 : 0}
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
                                            pattern={field.key === 'studentRegNo' ? "[0-9]{2}-[0-9]{4}" : undefined}
                                            title={field.key === 'studentRegNo' ? "Format must be 00-0000" : undefined}
                                            required={field.required}
                                            disabled={status === 'submitting'}
                                        />
                                    </div>
                                );
                            })}

                        {meeting?.questionOfDay && (
                            <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(221, 93, 108, 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(221, 93, 108, 0.1)' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#dd5d6c' }}>
                                    {meeting.questionOfDay}
                                </label>
                                <textarea
                                    className="input-field"
                                    placeholder="Your answer..."
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', minHeight: '80px', resize: 'vertical' }}
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
                            style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                        >
                            {status === 'submitting' ? 'Verifying...' : 'Check In Now'}
                        </button>

                        {meeting?.previousRecap && (
                            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowRecap(!showRecap)}
                                    style={{
                                        width: '100%', background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.1)',
                                        borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', color: '#a78bfa', cursor: 'pointer', fontSize: '0.85rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={16} />
                                        <span>Missed last week? Read the recap</span>
                                    </div>
                                    {showRecap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {showRecap && (
                                    <div className="glass-panel" style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                        <div style={{ fontWeight: 700, marginBottom: '0.5rem', opacity: 0.8 }}>{meeting.previousRecap.name} Recap</div>

                                        {meeting.previousRecap.devotion && (
                                            <div style={{ marginBottom: '0.75rem' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Devotion</div>
                                                <div style={{ color: 'var(--color-text-dim)' }}>{meeting.previousRecap.devotion}</div>
                                            </div>
                                        )}

                                        {meeting.previousRecap.announcements && (
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Announcements</div>
                                                <div style={{ color: 'var(--color-text-dim)' }}>{meeting.previousRecap.announcements}</div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => window.location.href = '/portal'}
                                            style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#25AAE1', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                                        >
                                            View full history in Student Portal
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                ) : status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(74, 222, 128, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <CheckCircle size={48} color="#4ade80" />
                        </div>
                        <h2 style={{ color: '#4ade80', marginBottom: '0.8rem', fontSize: '1.75rem' }}>Check-In Complete!</h2>
                        <p style={{ lineHeight: 1.6, color: 'var(--color-text-dim)', marginBottom: '2rem' }}>
                            Your attendance for <strong>{meeting?.name}</strong> has been officially recorded.
                            You can now close this tab.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1rem' }}
                                onClick={() => window.location.href = '/portal'}
                            >
                                View My Dashboard & Recap
                            </button>
                            <button
                                className="btn"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                onClick={() => window.close()}
                            >
                                Close
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '1rem' }}>
                            If the button doesn't work, swipe this page away to exit.
                        </p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <XCircle size={48} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>Check-In Failed</h2>
                        <p style={{ marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>{msg}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn" onClick={() => setStatus('idle')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                Back to Form
                            </button>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                            </p>
                        </div>
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
