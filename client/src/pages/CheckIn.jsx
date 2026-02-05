import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Loader2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';

const CheckIn = () => {
    const { meetingCode } = useParams();
    const [meeting, setMeeting] = useState(null);
    const [responses, setResponses] = useState({});
    const [memberType, setMemberType] = useState(''); // Douloid, Recruit, Visitor
    const [status, setStatus] = useState('loading'); // loading, idle, submitting, success, error
    const [msg, setMsg] = useState('');
    const [showRecap, setShowRecap] = useState(false);
    const [secretCode, setSecretCode] = useState('');
    const [memberInfo, setMemberInfo] = useState(null); // { name, type } from registry
    const [isLookingUp, setIsLookingUp] = useState(false);

    const getFingerprint = () => {
        const n = window.navigator;
        const s = window.screen;
        return [
            n.userAgent,
            n.language,
            s.colorDepth,
            s.width + 'x' + s.height,
            new Date().getTimezoneOffset(),
            !!window.sessionStorage,
            !!window.localStorage
        ].join('|');
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
        if (!regNo || regNo.length < 5) return;
        setIsLookingUp(true);
        try {
            // We'll use the existing portal data or a specific lookup endpoint if we had one
            // For now, let's use the registry logic via a new search endpoint if possible
            // Or just allow the backend to handle it on submit.
            // But for better UX, let's see if we can find them.
            const res = await api.get(`/attendance/student/${regNo}`);
            if (res.data && res.data.stats.totalMeetings > 0) {
                // Member exists in history at least
                setMemberInfo({ name: res.data.memberName || 'Member', type: res.data.memberType });
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
            const fingerprint = getFingerprint();
            const res = await api.post('/attendance/submit', {
                meetingCode,
                secretCode,
                deviceId: fingerprint,
                responses: {
                    ...responses,
                    studentRegNo: responses.studentRegNo // Ensure it's passed
                }
            });
            setStatus('success');
            setMsg(`Attendance recorded successfully for ${res.data.memberName || 'you'}!`);
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
                        {msg && status === 'idle' && (
                            <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '0.5rem', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                                {msg}
                            </div>
                        )}

                        {memberInfo && (
                            <div style={{ padding: '0.8rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', borderRadius: '0.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                                Welcome back, <strong>{memberInfo.name}</strong> ({memberInfo.type})
                            </div>
                        )}
                        {meeting?.requiredFields.map((field) => (
                            <div key={field.key}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
                                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>
                                <input
                                    className="input-field"
                                    placeholder={field.key === 'studentRegNo' ? 'e.g. 22-0990' : field.label}
                                    value={responses[field.key] || ''}
                                    onChange={e => {
                                        let val = e.target.value;
                                        if (field.key === 'studentRegNo') {
                                            val = val.replace(/\D/g, '');
                                            if (val.length > 2) {
                                                val = val.slice(0, 2) + '-' + val.slice(2, 6);
                                            }
                                            if (val.length === 7) lookupMember(val);
                                        }
                                        setResponses({ ...responses, [field.key]: val });
                                        if (msg) setMsg(''); // Clear error on change
                                    }}
                                    pattern={field.key === 'studentRegNo' ? "[0-9]{2}-[0-9]{4}" : undefined}
                                    title={field.key === 'studentRegNo' ? "Format must be 00-0000" : undefined}
                                    required={field.required}
                                    disabled={status === 'submitting'}
                                />
                            </div>
                        ))}

                        {meeting?.questionOfDay && (
                            <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(221, 93, 108, 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(221, 93, 108, 0.1)' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#dd5d6c' }}>
                                    Daily Reflection: {meeting.questionOfDay}
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
                        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-primary-light)', fontWeight: 'bold' }}>
                                Secret Room Code
                            </label>
                            <input
                                className="input-field"
                                placeholder="Code announced in meeting"
                                value={secretCode}
                                onChange={e => setSecretCode(e.target.value.toUpperCase())}
                                required
                                disabled={status === 'submitting'}
                                style={{ textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center', fontWeight: 900, fontSize: '1.25rem' }}
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '0.5rem', textAlign: 'center' }}>
                                This confirms you are physically present in the hall.
                            </p>
                        </div>

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
                                If you already checked in, you don't need to do it again.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>
                Doulos Attendance System &bull; &copy; {new Date().getFullYear()}
            </p>
        </div >
    );
};

export default CheckIn;
