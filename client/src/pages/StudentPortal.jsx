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
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2.5rem', padding: '1.5rem', position: 'relative' }}>
                <BackgroundGallery />
                <ValentineRain />

                <div style={{ position: 'relative', textAlign: 'center', zIndex: 1, animation: 'fadeIn 1s ease-out' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '220px', height: '220px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(37, 170, 225, 0.15) 0%, transparent 70%)',
                            animation: 'pulse 3s infinite'
                        }}></div>
                        <div style={{
                            animation: 'rotateLogo 30s linear infinite',
                            display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}>
                            <Logo size={120} showText={false} />
                        </div>
                    </div>
                    <h1 style={{
                        marginTop: '2rem',
                        fontSize: '3rem',
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                        color: 'white',
                        textShadow: '0 0 40px rgba(255, 255, 255, 0.3)'
                    }}>
                        STUDENT <span style={{ color: 'hsl(var(--color-primary))' }}>PORTAL</span>
                    </h1>
                </div>

                <div className="glass-panel" style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: '3rem',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    backdropFilter: 'blur(20px)'
                }}>
                    <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        letterSpacing: '3px',
                        color: 'var(--color-text-dim)',
                        textTransform: 'uppercase',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{ height: '1px', width: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
                        Student Login
                        <div style={{ height: '1px', width: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{
                                position: 'absolute',
                                left: '1.25rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-dim)',
                                opacity: 0.5
                            }} />
                            <input
                                placeholder="ADMISSION NO (e.g. 21-1234)"
                                className="input-field"
                                value={regNo}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 2) {
                                        val = val.slice(0, 2) + '-' + val.slice(2, 6);
                                    }
                                    setRegNo(val);
                                }}
                                required
                                style={{
                                    paddingLeft: '3.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    letterSpacing: '2px',
                                    height: '60px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '1rem'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                                height: '60px',
                                fontSize: '1rem',
                                fontWeight: 900,
                                borderRadius: '1rem',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                boxShadow: '0 10px 20px -5px hsl(var(--color-primary) / 0.3)'
                            }}
                        >
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                    <div className="loading-spinner-small"></div>
                                    VERIFYING...
                                </div>
                            ) : 'LOG IN'}
                        </button>
                    </form>

                    {error && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both'
                        }}>
                            <span>⚠️ {error}</span>
                        </div>
                    )}
                </div>

                <div style={{
                    textAlign: 'center',
                    opacity: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    color: 'var(--color-text-dim)',
                    textTransform: 'uppercase'
                }}>
                    Doulos Attendance System &bull; Enrollment Phase
                </div>

                <style>{`
                    @keyframes rotateLogo {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.15; }
                        50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.25; }
                        100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.15; }
                    }
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                    .loading-spinner-small {
                        width: 16px; height: 16px;
                        border: 2px solid rgba(255,255,255,0.3);
                        border-top: 2px solid white;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1.5rem' }}>
                <BackgroundGallery />
                <div className="loading-spinner-small" style={{ width: '50px', height: '50px', borderTopColor: '#25AAE1' }}></div>
                <p style={{ color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '2px' }}>LOADING PORTAL...</p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden', paddingBottom: '5rem' }}>
            <BackgroundGallery />
            <ValentineRain />

            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '1.5rem' }}>
                {/* Modern Header */}
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '3rem',
                    padding: '1rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '1.25rem',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ animation: 'rotateLogo 60s linear infinite' }}>
                            <Logo size={45} showText={false} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '2px', color: 'hsl(var(--color-primary))' }}>STUDENT PORTAL</h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-dim)', opacity: 0.8 }}>ID: {data.studentRegNo}</p>
                        </div>
                    </div>
                    <button className="btn" onClick={handleLogout} style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <LogOut size={14} style={{ marginRight: '0.5rem' }} /> LOGOUT
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                    {/* Progress Card */}
                    <div className="glass-panel" style={{
                        padding: '2.5rem',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-20%', right: '-10%',
                            width: '200px', height: '200px',
                            background: 'radial-gradient(circle, hsl(var(--color-primary) / 0.1) 0%, transparent 70%)',
                            zIndex: 0
                        }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg style={{ transform: 'rotate(-90deg)', width: '160px', height: '160px' }}>
                                        <circle
                                            cx="80" cy="80" r="70"
                                            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"
                                        />
                                        <circle
                                            cx="80" cy="80" r="70"
                                            fill="none" stroke="hsl(var(--color-primary))" strokeWidth="12"
                                            strokeDasharray="439.8"
                                            strokeDashoffset={439.8 - (439.8 * data.stats.percentage / 100)}
                                            strokeLinecap="round"
                                            style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                        />
                                    </svg>
                                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px' }}>
                                            {data.stats.percentage}<span style={{ fontSize: '1rem', verticalAlign: 'top', marginLeft: '2px' }}>%</span>
                                        </div>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5, letterSpacing: '1px' }}>ATTENDANCE</div>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 900 }}>
                                {data.stats.percentage > 80 ? 'ELITE DOULOID' : data.stats.percentage > 50 ? 'ACTIVE MEMBER' : 'RECRUIT'}
                            </h3>
                            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
                                Total attendance: <strong>{data.stats.totalAttended}</strong> / {data.stats.totalMeetings} sessions.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem' }}>
                                <div style={{
                                    background: 'var(--glass-bg)',
                                    padding: '1rem 1.5rem',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 215, 0, 0.2)',
                                    flex: 1,
                                    maxWidth: '140px'
                                }}>
                                    <Trophy size={20} color="#FFD700" style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-text-dim)', letterSpacing: '1px' }}>STANDING</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFD700' }}>{data.stats.totalAttended > 5 ? 'GOLD' : 'SILVER'}</div>
                                </div>
                                <div style={{
                                    background: 'var(--glass-bg)',
                                    padding: '1rem 1.5rem',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(37, 170, 225, 0.2)',
                                    flex: 1,
                                    maxWidth: '140px'
                                }}>
                                    <Star size={20} color="#25AAE1" style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-text-dim)', letterSpacing: '1px' }}>STREAK</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#25AAE1' }}>ACTIVE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Record Timeline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ height: '2px', flex: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1))' }}></div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
                        <Calendar size={18} /> Attendance History
                    </h3>
                    <div style={{ height: '2px', flex: 1, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.1))' }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {data.history.map((m, i) => (
                        <div key={m._id} className="glass-panel" style={{
                            padding: '0',
                            overflow: 'hidden',
                            border: '1px solid var(--glass-border)',
                            background: m.attended ? 'rgba(37, 170, 225, 0.02)' : 'rgba(239, 68, 68, 0.02)',
                            animation: `slideUp 0.5s ease-out ${i * 0.1}s both`
                        }}>
                            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{
                                        width: '4px', height: '40px',
                                        background: m.attended ? '#4ade80' : '#f87171',
                                        borderRadius: '2px',
                                        boxShadow: m.attended ? '0 0 10px #4ade80' : 'none'
                                    }}></div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{m.name}</h4>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &bull; {m.campus}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {m.attended ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px' }}>VERIFIED</span>
                                            <CheckCircle size={20} />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', opacity: 0.8 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px' }}>ABSENT</span>
                                            <XCircle size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recap Section */}
                            {(m.devotion || m.iceBreaker || m.announcements) ? (
                                <div style={{
                                    padding: '1.5rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '1.5rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {m.devotion && (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#a78bfa' }}>
                                                <BookOpen size={14} />
                                                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Devotion</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>{m.devotion}</p>
                                        </div>
                                    )}
                                    {m.iceBreaker && (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#25AAE1' }}>
                                                <Music size={14} />
                                                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Ice Breaker</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>{m.iceBreaker}</p>
                                        </div>
                                    )}
                                    {m.announcements && (
                                        <div style={{
                                            background: 'rgba(250, 204, 21, 0.05)',
                                            padding: '1.25rem',
                                            borderRadius: '1rem',
                                            border: '1px solid rgba(250, 204, 21, 0.1)',
                                            gridColumn: '1 / -1'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#facc15' }}>
                                                <Bell size={14} />
                                                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Announcements</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: '#fde68a' }}>{m.announcements}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', opacity: 0.4 }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, fontStyle: 'italic', letterSpacing: '1px' }}>NO DETAILS PROVIDED</p>
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
