import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, CheckCircle, XCircle, BookOpen, Music, Bell, Star, Trophy, Search, LogOut } from 'lucide-react';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import Logo from '../components/Logo';

const StudentPortal = () => {
    const [regNo, setRegNo] = useState(localStorage.getItem('studentRegNo') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('studentRegNo'));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let timer;
        if (error) {
            timer = setTimeout(() => setError(null), 5000);
        }
        return () => clearTimeout(timer);
    }, [error]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (!regNo) return;

        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/attendance/student/${regNo}`);
            if (res.data.history.length === 0 && res.data.stats.totalAttended === 0) {
                setError("We couldn't find any attendance records for this Admission Number. Have you checked in before?");
                setLoading(false);
                return;
            }
            setData(res.data);
            setIsLoggedIn(true);
            localStorage.setItem('studentRegNo', regNo.toUpperCase());
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('studentRegNo');
        setIsLoggedIn(false);
        setData(null);
        setRegNo('');
    };

    useEffect(() => {
        if (isLoggedIn && !data) {
            handleLogin();
        }
    }, [isLoggedIn]);

    if (!isLoggedIn) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
                <BackgroundGallery />
                <ValentineRain />
                <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
                    <Logo size={60} />
                    <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Student Portal</h2>
                    <p style={{ color: 'var(--color-text-dim)', marginBottom: '2rem' }}>Enter your Admission Number to see your progress and meeting recaps.</p>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            placeholder="Admission No (e.g. 21-1234)"
                            className="input-field"
                            value={regNo}
                            onChange={(e) => setRegNo(e.target.value)}
                            required
                            style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '1px' }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '1rem' }}>
                            {loading ? 'Verifying...' : 'Access My Dashboard'}
                        </button>
                    </form>

                    {error && (
                        <div style={{
                            position: 'fixed',
                            top: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 2000,
                            minWidth: '300px',
                            padding: '1rem 1.5rem',
                            borderRadius: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.95)',
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
                            ⚠️ {error}
                            <style>{`
                                @keyframes slideDown {
                                    0% { opacity: 0; transform: translate(-50%, -20px); }
                                    100% { opacity: 1; transform: translate(-50%, 0); }
                                }
                            `}</style>
                        </div>
                    )}
                </div>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>Only for students who have attended at least one meeting.</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            <BackgroundGallery />
            <ValentineRain />

            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '4rem' }}>
                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Logo size={40} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Doulos Portal</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Welcome back, {data.studentRegNo}</p>
                        </div>
                    </div>
                    <button className="btn" onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', padding: '0.5rem 1rem' }}>
                        <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Exit
                    </button>
                </header>

                {/* Progress Card */}
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
                                <circle
                                    cx="60" cy="60" r="54"
                                    fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"
                                />
                                <circle
                                    cx="60" cy="60" r="54"
                                    fill="none" stroke="hsl(var(--color-primary))" strokeWidth="8"
                                    strokeDasharray="339.292"
                                    strokeDashoffset={339.292 - (339.292 * data.stats.percentage / 100)}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', fontSize: '1.75rem', fontWeight: 800 }}>
                                {data.stats.percentage}%
                            </div>
                        </div>
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem 0' }}>Consistency Level: {data.stats.percentage > 80 ? 'Elite Douloid' : data.stats.percentage > 50 ? 'Regular Member' : 'Getting Started'}</h3>
                    <p style={{ color: 'var(--color-text-dim)', margin: 0 }}>You've attended <strong>{data.stats.totalAttended}</strong> out of <strong>{data.stats.totalMeetings}</strong> meetings this semester.</p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                        <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 215, 0, 0.2)', color: '#FFD700' }}>
                            <Trophy size={18} style={{ marginBottom: '0.25rem' }} />
                            <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>RANK</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{data.stats.totalAttended > 5 ? 'Gold' : 'Silver'}</div>
                        </div>
                        <div style={{ background: 'rgba(37, 170, 225, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(37, 170, 225, 0.2)', color: '#25AAE1' }}>
                            <Star size={18} style={{ marginBottom: '0.25rem' }} />
                            <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>STREAK</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>2 Weeks</div>
                        </div>
                    </div>
                </div>

                {/* Meeting History Timeline */}
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} /> Meeting History & Recaps
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {data.history.map((m, i) => (
                        <div key={m._id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: m.attended ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid var(--glass-border)' }}>
                            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: m.attended ? 'rgba(74, 222, 128, 0.03)' : 'transparent' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{m.name}</h4>
                                        {m.attended ? (
                                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', borderRadius: '4px', fontWeight: 700 }}>PRESENT</span>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '4px', fontWeight: 700 }}>MISSED</span>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                        {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • {m.campus}
                                    </p>
                                </div>
                                {m.attended && (
                                    <CheckCircle size={24} color="#4ade80" />
                                )}
                            </div>

                            {/* Recap Content */}
                            {(m.devotion || m.iceBreaker || m.announcements) ? (
                                <div style={{ padding: '1.5rem', paddingTop: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    {m.devotion && (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#a78bfa' }}>
                                                <BookOpen size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Devotion</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{m.devotion}</p>
                                        </div>
                                    )}
                                    {m.iceBreaker && (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#25AAE1' }}>
                                                <Music size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Ice Breaker</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{m.iceBreaker}</p>
                                        </div>
                                    )}
                                    {m.announcements && (
                                        <div style={{ background: 'rgba(37, 170, 225, 0.05)', padding: '1rem', borderRadius: '0.75rem', gridColumn: '1 / -1' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#facc15' }}>
                                                <Bell size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Announcements</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{m.announcements}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ padding: '1.5rem', paddingTop: '0', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-dim)', fontStyle: 'italic' }}>Recap hasn't been posted yet for this meeting.</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentPortal;
