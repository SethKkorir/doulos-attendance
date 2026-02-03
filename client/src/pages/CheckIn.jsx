import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';

const CheckIn = () => {
    const { meetingCode } = useParams();
    const [meeting, setMeeting] = useState(null);
    const [responses, setResponses] = useState({});
    const [memberType, setMemberType] = useState(''); // Douloid, Recruit, Visitor
    const [status, setStatus] = useState('loading'); // loading, idle, submitting, success, error
    const [msg, setMsg] = useState('');

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

                if (!res.data.isActive) {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!memberType) {
            setMsg('Please select your member category');
            return;
        }
        setStatus('submitting');
        try {
            await api.post('/attendance/submit', {
                meetingCode,
                memberType,
                responses
            });
            setStatus('success');
            setMsg('Attendance recorded successfully! You may close this page.');
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

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
                                Who are you? <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                {['Douloid', 'Recruit', 'Visitor'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setMemberType(type);
                                            if (msg) setMsg('');
                                        }}
                                        style={{
                                            padding: '0.75rem 0.25rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid',
                                            borderColor: memberType === type ? 'hsl(var(--color-primary))' : 'rgba(255,255,255,0.1)',
                                            background: memberType === type ? 'rgba(37, 170, 225, 0.1)' : 'rgba(255,255,255,0.02)',
                                            color: memberType === type ? 'hsl(var(--color-primary))' : 'var(--color-text-dim)',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
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

                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', position: 'relative' }} disabled={status === 'submitting'}>
                            {status === 'submitting' ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} style={{ marginRight: '0.5rem' }} />
                                    Verifying...
                                </>
                            ) : 'Sign In Now'}
                        </button>
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

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem' }}
                            onClick={() => window.close()}
                        >
                            Close Tab
                        </button>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '1rem' }}>
                            If the button doesn't work, swipe this page away to exit.
                        </p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <XCircle size={48} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>Sign-In Failed</h2>
                        <p style={{ marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>{msg}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn" onClick={() => setStatus('idle')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                Back to Form
                            </button>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                                If you already signed in, you don't need to do it again.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>
                Doulos Attendance System &bull; &copy; {new Date().getFullYear()}
            </p>
        </div>
    );
};

export default CheckIn;
