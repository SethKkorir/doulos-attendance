
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [guestFeaturesEnabled, setGuestFeaturesEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isFocusedUser, setIsFocusedUser] = useState(false);
    const [isFocusedPass, setIsFocusedPass] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings/guest_features');
                setGuestFeaturesEnabled(res.data?.value !== 'false');
            } catch (err) {
                console.error(err);
            }
        };
        fetchSettings();
    }, []);

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

        if (localStorage.getItem('token')) {
            navigate('/admin/dashboard');
        }
    }, [navigate]);

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

            // G-Council Strict Direct Routing Logic
            const u = res.data.username;
            if (u === 'supersuperadmin') {
                navigate('/superadmin');
            } else if (u === 'g1_coordinator' || u === 'g2_vice') {
                localStorage.setItem('initialTab', 'g1_radar');
                navigate('/admin/dashboard');
            } else if (u === 'g3_secretary') {
                localStorage.setItem('initialTab', 'g3_secretariat');
                navigate('/admin/dashboard');
            } else if (u === 'g4_logistics') {
                localStorage.setItem('initialTab', 'g4_logistics');
                navigate('/admin/dashboard');
            } else if (isTrainer || u === 'g5_training') {
                localStorage.setItem('initialTab', 'dashboard');
                window.open('/g5/portal', '_blank');
                navigate('/g5/portal');
            } else if (u === 'g6_welfare') {
                localStorage.setItem('initialTab', 'g6_welfare');
                navigate('/admin/dashboard');
            } else if (u === 'g7_treasurer') {
                localStorage.setItem('initialTab', 'g7_treasury');
                navigate('/admin/dashboard');
            } else if (u === 'g8_assets') {
                localStorage.setItem('initialTab', 'g8_assets');
                navigate('/admin/dashboard');
            } else if (u === 'g9_media') {
                localStorage.setItem('initialTab', 'g9_media');
                navigate('/admin/dashboard');
            } else if (res.data.username === 'superadmin' || res.data.role === 'superadmin') {
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
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            position: 'relative',
            backgroundColor: '#F1F1F5',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            overflow: 'hidden'
        }}>
            {/* Ambient Purple Corner Wash top-left */}
            <div style={{
                position: 'fixed',
                top: '-140px',
                left: '-140px',
                width: '520px',
                height: '520px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #A79AE8 0%, rgba(167, 154, 232, 0.4) 45%, transparent 70%)',
                opacity: 0.65,
                filter: 'blur(70px)',
                pointerEvents: 'none',
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
                    boxShadow: '0 12px 32px rgba(220, 38, 38, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    color: '#991B1B',
                    animation: 'slideDown 0.35s ease forwards'
                }}>
                    <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#DC2626' }}>
                            Authentication Error
                        </span>
                        <span style={{ fontWeight: 500, fontSize: '0.84rem' }}>{error}</span>
                    </div>
                </div>
            )}

            {/* Floating Crisp White Login Card */}
            <div style={{
                width: '100%',
                maxWidth: '440px',
                padding: '2.75rem 2.25rem 2.25rem',
                borderRadius: '20px',
                border: '1px solid #EBEBF2',
                background: '#FFFFFF',
                boxShadow: '0 20px 48px rgba(75, 63, 140, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Visual Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, #4B3F8C 0%, #3D3277 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(75, 63, 140, 0.25)',
                        marginBottom: '1.25rem'
                    }}>
                        <Logo size={42} showText={false} />
                    </div>

                    <h1 style={{
                        margin: 0,
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: '#1E1B39',
                        letterSpacing: '-0.02em'
                    }}>
                        Doulos Admin Portal
                    </h1>

                    <p style={{
                        margin: '0.45rem 0 0',
                        fontSize: '0.84rem',
                        color: '#7E7A9B',
                        fontWeight: 500
                    }}>
                        Freedom Base Camp · Executive Console
                    </p>
                </div>

                {/* Form Elements */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Username Input Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: isFocusedUser ? '#4B3F8C' : '#666280'
                        }}>
                            Username
                        </label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: '#FFFFFF',
                            border: `1.5px solid ${isFocusedUser ? '#4B3F8C' : '#D1D1DB'}`,
                            borderRadius: '10px',
                            padding: '0 0.95rem',
                            height: '46px',
                            boxShadow: isFocusedUser ? '0 0 0 3px rgba(75, 63, 140, 0.12)' : 'none',
                            transition: 'all 0.15s ease'
                        }}>
                            <User size={18} color={isFocusedUser ? '#4B3F8C' : '#9E9EA7'} />
                            <input
                                type="text"
                                placeholder="Admin or G-Council username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setIsFocusedUser(true)}
                                onBlur={() => setIsFocusedUser(false)}
                                required
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    fontSize: '0.9rem',
                                    color: '#1E1B39',
                                    fontWeight: 500
                                }}
                            />
                        </div>
                    </div>

                    {/* Password Input Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: isFocusedPass ? '#4B3F8C' : '#666280'
                        }}>
                            Password
                        </label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: '#FFFFFF',
                            border: `1.5px solid ${isFocusedPass ? '#4B3F8C' : '#D1D1DB'}`,
                            borderRadius: '10px',
                            padding: '0 0.95rem',
                            height: '46px',
                            boxShadow: isFocusedPass ? '0 0 0 3px rgba(75, 63, 140, 0.12)' : 'none',
                            transition: 'all 0.15s ease'
                        }}>
                            <Lock size={18} color={isFocusedPass ? '#4B3F8C' : '#9E9EA7'} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsFocusedPass(true)}
                                onBlur={() => setIsFocusedPass(false)}
                                required
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    fontSize: '0.9rem',
                                    color: '#1E1B39',
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
                                    color: '#9E9EA7',
                                    padding: '0.2rem',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* G-Council (G1 - G9) & Staff Quick Access */}
                    <div style={{
                        background: '#F8F8FC',
                        border: '1px solid #EBEBF2',
                        borderRadius: '12px',
                        padding: '0.85rem 0.95rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginTop: '0.25rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#4B3F8C' }}>
                                G-COUNCIL QUICK ACCESS
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#7E7A9B', fontWeight: 600 }}>Pass: doulos2026</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                            {[
                                { user: 'g1_coordinator', pass: 'doulos2026', label: 'G1 Coordinator' },
                                { user: 'g3_secretary', pass: 'doulos2026', label: 'G3 Secretary' },
                                { user: 'g4_logistics', pass: 'doulos2026', label: 'G4 Logistics' },
                                { user: 'trainer_athi', pass: 'trainer123', label: 'G5 Training' },
                                { user: 'g6_welfare', pass: 'doulos2026', label: 'G6 Welfare' },
                                { user: 'g7_treasurer', pass: 'doulos2026', label: 'G7 Treasurer' },
                                { user: 'g8_assets', pass: 'doulos2026', label: 'G8 Equipment' },
                                { user: 'g9_media', pass: 'doulos2026', label: 'G9 Media/QR' },
                                { user: 'superadmin', pass: 'admin123', label: 'SuperAdmin' }
                            ].map(t => {
                                const isSelected = username === t.user;
                                return (
                                    <button
                                        key={t.user}
                                        type="button"
                                        onClick={() => {
                                            setUsername(t.user);
                                            setPassword(t.pass);
                                        }}
                                        style={{
                                            background: isSelected ? '#4B3F8C' : '#FFFFFF',
                                            border: `1px solid ${isSelected ? '#4B3F8C' : '#EBEBF2'}`,
                                            borderRadius: '6px',
                                            padding: '0.42rem 0.2rem',
                                            color: isSelected ? '#FFFFFF' : '#4A4560',
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Button in deep indigo-purple */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            height: '48px',
                            background: '#4B3F8C',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 8px 20px rgba(75, 63, 140, 0.25)',
                            transition: 'all 0.2s ease',
                            marginTop: '0.5rem'
                        }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3D3277'; }}
                        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#4B3F8C'; }}
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

                {/* Footer Guest Option */}
                {guestFeaturesEnabled && (
                    <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/guest')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#4B3F8C',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                padding: '0.4rem 0.75rem',
                                borderRadius: '8px',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F4F2FB'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span>Guest Access & Verification</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}

                {/* Subfooter */}
                <div style={{
                    marginTop: '1.25rem',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: '#9E9EA7',
                    fontWeight: 500
                }}>
                    Doulos Timeregistrering System
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
