
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocusedUser, setIsFocusedUser] = useState(false);
    const [isFocusedPass, setIsFocusedPass] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (error) {
            timer = setTimeout(() => setError(''), 5000);
        }
        return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('expired')) {
            setError('Your session has expired. Please login again.');
        }

        // Force a fresh login on every reload so the portal does not silently restore a session.
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('campus');
        localStorage.removeItem('isGuest');
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { username, password });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('username', res.data.username);
            localStorage.setItem('campus', res.data.campus || 'Athi River');

            const isTrainer = res.data.role === 'trainer' ||
                (res.data.username && (res.data.username.startsWith('trainer') || res.data.username === 'g5_director'));

            // Direct Routing Logic
            const u = res.data.username ? res.data.username.toLowerCase() : '';
            const role = res.data.role || '';

            if (u === 'supersuperadmin') {
                navigate('/superadmin');
            } else if (u === 'g2' || u === 'g2_vice' || role === 'g2_vice') {
                localStorage.setItem('initialTab', 'dashboard');
                navigate('/g2/portal');
            } else if (u === 'g5' || role === 'trainer' || role === 'g5_training' || u === 'trainer_athi' || u === 'g5_director') {
                localStorage.setItem('initialTab', 'dashboard');
                navigate('/g5/portal');
            } else if (u === 'superadmin' || role === 'superadmin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <style>{`
            input::placeholder { color: rgba(200, 220, 255, 0.7) !important; }
            input { caret-color: #fff; }
        `}</style>
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            position: 'relative',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            overflow: 'hidden'
        }}>
            {/* Photo Background */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: 'url(/login-bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center 20%',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'high-quality',
                WebkitTransform: 'translateZ(0)',
                transform: 'translateZ(0)',
                willChange: 'transform',
                zIndex: 0
            }} />
            {/* Clean solid overlay — no gradient noise */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10, 8, 28, 0.22)',
                zIndex: 1
            }} />

            {/* Error Toast Notification */}
            {error && (
                <div style={{
                    position: 'fixed',
                    top: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2000,
                    minWidth: '320px',
                    maxWidth: '90%',
                    padding: '0.9rem 1.25rem',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #FCA5A5',
                    boxShadow: '0 12px 30px rgba(220, 38, 38, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#B91C1C',
                    animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{error}</span>
                </div>
            )}

            {/* Main Login Card — Glassmorphism */}
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'rgba(255, 255, 255, 0.13)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderRadius: '28px',
                padding: '2.5rem 2.25rem',
                boxShadow: '0 24px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Header / Brand */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.25rem'
                    }}>
                        <Logo size={88} showText={false} />
                    </div>

                    <h1 style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        margin: '0 0 0.4rem 0',
                        letterSpacing: '-0.5px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                        Welcome Back
                    </h1>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.72)',
                        margin: 0,
                        fontWeight: 500
                    }}>
                        Sign in to access your administrative workspace
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    {/* Username Input */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.85)',
                            marginBottom: '0.45rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Username
                        </label>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            background: isFocusedUser ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.15)',
                            border: `1.5px solid ${isFocusedUser ? 'rgba(147,197,253,0.8)' : 'rgba(147,197,253,0.35)'}`,
                            borderRadius: '12px',
                            padding: '0 1rem',
                            height: '48px',
                            transition: 'all 0.2s ease',
                            boxShadow: isFocusedUser ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none'
                        }}>
                            <User size={18} style={{ color: isFocusedUser ? '#fff' : 'rgba(255,255,255,0.55)', marginRight: '0.75rem', flexShrink: 0 }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setIsFocusedUser(true)}
                                onBlur={() => setIsFocusedUser(false)}
                                placeholder="Enter username (e.g. G5, G2)"
                                required
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '0.9rem',
                                    color: '#FFFFFF',
                                    fontWeight: 500
                                }}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                            <label style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: 'rgba(255,255,255,0.85)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Password
                            </label>
                        </div>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            background: isFocusedPass ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.15)',
                            border: `1.5px solid ${isFocusedPass ? 'rgba(147,197,253,0.8)' : 'rgba(147,197,253,0.35)'}`,
                            borderRadius: '12px',
                            padding: '0 1rem',
                            height: '48px',
                            transition: 'all 0.2s ease',
                            boxShadow: isFocusedPass ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none'
                        }}>
                            <Lock size={18} style={{ color: isFocusedPass ? '#fff' : 'rgba(255,255,255,0.55)', marginRight: '0.75rem', flexShrink: 0 }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsFocusedPass(true)}
                                onBlur={() => setIsFocusedPass(false)}
                                placeholder="Enter password"
                                required
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '0.9rem',
                                    color: '#FFFFFF',
                                    fontWeight: 500
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.6)',
                                    padding: '0.2rem',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            height: '48px',
                            background: 'rgba(255,255,255,0.95)',
                            color: '#2D2060',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                            transition: 'all 0.2s ease',
                            marginTop: '0.5rem'
                        }}
                        onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                        onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spinner-animate" />
                                <span>Verifying credentials...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In to Portal</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Direct Douloid or Recruit Portal Access */}
                <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                    <Link
                        to="/portal"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            color: 'rgba(255,255,255,0.9)',
                            textDecoration: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            padding: '0.5rem 1rem',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.22)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span>Douloid or Recruit Portal</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Subfooter */}
                <div style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.45)',
                    fontWeight: 500
                }}>
                    Doulos Timeregistrering System
                </div>
            </div>
        </div>
        </>
    );
};

export default AdminLogin;
