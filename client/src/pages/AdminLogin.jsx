
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, ShieldCheck, Award, Compass, LogIn, Info, Sparkles, CheckCircle2, MapPin, X } from 'lucide-react';
import Logo from '../components/Logo';

const AdminLogin = () => {
    const [selectedRole, setSelectedRole] = useState('g9'); // 'g9' | 'douloid' | 'recruit'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [regNo, setRegNo] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [forgotNotice, setForgotNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocusedUser, setIsFocusedUser] = useState(false);
    const [isFocusedPass, setIsFocusedPass] = useState(false);
    const [isFocusedReg, setIsFocusedReg] = useState(false);

    // Recruit Self-Registration Pop-up State
    const [showSelfRegistration, setShowSelfRegistration] = useState(false);
    const [selfRegAdm, setSelfRegAdm] = useState('');
    const [selfRegName, setSelfRegName] = useState('');
    const [selfRegCampus, setSelfRegCampus] = useState('Athi River');
    const [selfRegLoading, setSelfRegLoading] = useState(false);
    const [selfRegError, setSelfRegError] = useState('');

    // Celebratory Welcome Modal State
    const [showCelebratoryWelcome, setShowCelebratoryWelcome] = useState(false);
    const [registeredRecruit, setRegisteredRecruit] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (error) {
            timer = setTimeout(() => setError(''), 6000);
        }
        return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('expired')) {
            setError('Your session has expired. Please login again.');
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            localStorage.removeItem('campus');
            localStorage.removeItem('isGuest');
            api.post('/auth/logout').catch(() => {});
            return;
        }

        if (params.get('logout')) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            localStorage.removeItem('campus');
            localStorage.removeItem('isGuest');
            api.post('/auth/logout').catch(() => {});
            return;
        }

        // No automatic session restoration on reload. Users must log in again.
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('campus');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('initialTab');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (selectedRole === 'g9') {
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
                } else if (u === 'g3' || u === 'g4' || role === 'g3' || role === 'g4' || role === 'g3_secretary' || role === 'g4_logistics' || u.startsWith('g3') || u.startsWith('g4')) {
                    localStorage.setItem('initialTab', 'dashboard');
                    navigate('/g3/portal');
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
        } else {
            // Douloid or Recruit login via Admission Number (no password)
            const targetRegNo = (regNo || '').trim().toUpperCase();
            if (!targetRegNo) {
                setError('Please enter your Admission Number');
                setLoading(false);
                return;
            }

            try {
                const res = await api.get(`/attendance/student/${targetRegNo}`);
                if (res.data.registrationRequired) {
                    // New Recruit / Unregistered Member detected!
                    // Automatically pop the Recruit Registration form with locked Admission Number
                    setSelfRegAdm(targetRegNo);
                    setSelfRegName('');
                    setSelfRegCampus('Athi River');
                    setSelfRegError('');
                    setShowSelfRegistration(true);
                    setLoading(false);
                    return;
                }

                const memberType = (res.data.memberType || 'Douloid').trim();
                const douloidRank = (res.data.douloidRank || '').trim();
                const isDouloid = memberType.toLowerCase() === 'douloid' || (douloidRank && douloidRank !== 'None' && !douloidRank.toLowerCase().includes('candidate'));
                const isRecruit = memberType.toLowerCase() === 'recruit';

                // Requirement: when you click Recruit and you are douloid, deny access
                if (selectedRole === 'recruit' && isDouloid) {
                    setError("Access Denied: You are a Douloid, not a recruit! 😂 Please select Douloid to sign in.");
                    setLoading(false);
                    return;
                }

                // If someone chooses Douloid but is registered as Recruit
                if (selectedRole === 'douloid' && isRecruit) {
                    setError("Access Denied: You are registered as a Recruit, not a Douloid! Please select Recruit to sign in.");
                    setLoading(false);
                    return;
                }

                // Successful student/recruit session setup (7 days)
                const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
                localStorage.setItem('studentSession', JSON.stringify({ regNo: targetRegNo, expiry: Date.now() + SESSION_DURATION }));
                navigate('/portal', { state: { memberData: res.data } });
            } catch (err) {
                if (err.response?.data?.registrationRequired) {
                    setSelfRegAdm(targetRegNo);
                    setSelfRegName('');
                    setSelfRegCampus('Athi River');
                    setSelfRegError('');
                    setShowSelfRegistration(true);
                    setLoading(false);
                    return;
                }
                setError(err.response?.data?.message || 'Sign in failed. Please check your admission number.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSelfRegister = async (e) => {
        if (e) e.preventDefault();
        setSelfRegError('');
        if (!selfRegName.trim()) {
            setSelfRegError('Please enter your full name');
            return;
        }
        setSelfRegLoading(true);

        try {
            const normalizedCampus = selfRegCampus === 'Nairobi' ? 'Valley Road' : selfRegCampus;
            const res = await api.post('/members/self-register', {
                studentRegNo: selfRegAdm.trim().toUpperCase(),
                name: selfRegName.trim(),
                campus: normalizedCampus,
                memberType: 'Recruit'
            });

            const newMember = res.data?.member || {
                studentRegNo: selfRegAdm.trim().toUpperCase(),
                name: selfRegName.trim(),
                campus: normalizedCampus,
                memberType: 'Recruit',
                douloidRank: 'None'
            };

            setRegisteredRecruit(newMember);
            setShowSelfRegistration(false);
            setShowCelebratoryWelcome(true);
        } catch (err) {
            setSelfRegError(err.response?.data?.message || 'Failed to complete registration. Please try again or contact G9.');
        } finally {
            setSelfRegLoading(false);
        }
    };

    const handleEnterPortalAfterWelcome = () => {
        const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
        const targetReg = registeredRecruit?.studentRegNo || selfRegAdm;
        localStorage.setItem('studentSession', JSON.stringify({ regNo: targetReg, expiry: Date.now() + SESSION_DURATION }));
        setShowCelebratoryWelcome(false);
        navigate('/portal', { state: { memberData: registeredRecruit } });
    };

    useEffect(() => {
        let timer;
        if (forgotNotice) {
            timer = setTimeout(() => setForgotNotice(''), 6000);
        }
        return () => clearTimeout(timer);
    }, [forgotNotice]);

    return (
        <>
        <style>{`
            input::placeholder { color: #64748B !important; }
            input { caret-color: #38BDF8; }
            @keyframes slideDown {
                from { opacity: 0; transform: translate(-50%, -12px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
            @media (max-width: 640px) {
                .login-mobile-container {
                    padding: 1rem 0.85rem !important;
                }
                .login-mobile-card {
                    padding: 1.5rem 1.15rem !important;
                    border-radius: 20px !important;
                }
                .login-brand-logo {
                    width: 48px !important;
                    height: 48px !important;
                }
                .login-brand-title {
                    font-size: 1.35rem !important;
                }
                .login-role-container {
                    display: flex !important;
                    flex-direction: row !important;
                    width: 100% !important;
                    gap: 0.45rem !important;
                }
                .login-role-btn {
                    flex: 1 1 0 !important;
                    min-width: 0 !important;
                    height: 42px !important;
                    padding: 0 0.35rem !important;
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 0.35rem !important;
                    white-space: nowrap !important;
                }
            }
        `}</style>
        <div className="login-mobile-container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 1rem',
            position: 'relative',
            fontFamily: "Georgia, 'Times New Roman', serif",
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
            {/* Clean dark solid overlay for high contrast & elegance */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10, 15, 29, 0.45)',
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

            {/* Forgot Password / Info Toast */}
            {forgotNotice && (
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
                    background: '#0F172A',
                    border: '1px solid #38BDF8',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#E0F2FE',
                    animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <Info size={20} style={{ color: '#38BDF8', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, lineHeight: 1.4 }}>{forgotNotice}</span>
                </div>
            )}

            {/* Main Login Card — Sleek Glassmorphism */}
            <div className="login-mobile-card" style={{
                width: '100%',
                maxWidth: '410px',
                background: 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderRadius: '24px',
                padding: '2.25rem 1.75rem',
                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                position: 'relative',
                zIndex: 10
            }}>
                {showCelebratoryWelcome ? (
                    /* ══ CELEBRATORY WELCOME SCREEN ══ */
                    <div style={{ textAlign: 'center', animation: 'fadeIn 0.25s ease' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                            border: '1.5px solid rgba(56, 189, 248, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.15rem auto',
                            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.2)'
                        }}>
                            <Sparkles size={28} style={{ color: '#38BDF8' }} />
                        </div>

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34D399',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            marginBottom: '0.75rem',
                            textTransform: 'uppercase'
                        }}>
                            <span>Registration Complete</span>
                        </div>

                        <h2 style={{
                            fontSize: '1.45rem',
                            fontWeight: 800,
                            color: '#FFFFFF',
                            margin: '0 0 0.35rem 0',
                            letterSpacing: '-0.4px'
                        }}>
                            Welcome to Doulos!
                        </h2>

                        <p style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            color: '#38BDF8',
                            marginBottom: '0.5rem'
                        }}>
                            {registeredRecruit?.name || selfRegName}
                        </p>

                        <p style={{
                            fontSize: '0.82rem',
                            color: '#94A3B8',
                            lineHeight: 1.5,
                            marginBottom: '1.5rem'
                        }}>
                            You are officially enrolled as a <strong style={{ color: '#E2E8F0' }}>Doulos Recruit</strong>. Your portal is ready with today's fellowship message and reflections.
                        </p>

                        <button
                            type="button"
                            onClick={handleEnterPortalAfterWelcome}
                            style={{
                                width: '100%',
                                height: '46px',
                                background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.94rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(14, 165, 233, 0.35)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>Open My Recruit Portal</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                ) : showSelfRegistration ? (
                    /* ══ RECRUIT SELF-REGISTRATION SCREEN ══ */
                    <div style={{ animation: 'fadeIn 0.25s ease' }}>
                        {/* Header / Brand */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '1.4rem',
                            textAlign: 'center'
                        }}>
                            <div className="login-brand-logo" style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '16px',
                                background: 'rgba(30, 41, 59, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.75rem',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                                overflow: 'hidden'
                            }}>
                                <Logo size={38} showText={false} />
                            </div>

                            <h1 className="login-brand-title" style={{
                                fontSize: '1.35rem',
                                fontWeight: 800,
                                color: '#FFFFFF',
                                margin: '0 0 0.3rem 0',
                                letterSpacing: '-0.4px'
                            }}>
                                New Recruit Setup
                            </h1>
                            <p style={{
                                fontSize: '0.8rem',
                                color: '#94A3B8',
                                margin: 0,
                                fontWeight: 500
                            }}>
                                Enter your details to create your portal account
                            </p>
                        </div>

                        {selfRegError && (
                            <div style={{
                                padding: '0.7rem 0.9rem',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#FCA5A5',
                                fontSize: '0.8rem',
                                marginBottom: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                <span>{selfRegError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSelfRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Admission Number (Locked) */}
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.4rem'
                                }}>
                                    <label style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        color: '#94A3B8',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em'
                                    }}>
                                        Admission Number
                                    </label>
                                    <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 600 }}>
                                        Verified
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1.5px solid rgba(255, 255, 255, 0.10)',
                                    borderRadius: '10px',
                                    padding: '0 0.85rem',
                                    height: '44px',
                                    color: '#E2E8F0',
                                    fontWeight: 700,
                                    fontSize: '0.92rem',
                                    letterSpacing: '0.5px'
                                }}>
                                    <Lock size={16} style={{ color: '#38BDF8', marginRight: '0.65rem' }} />
                                    <span>{selfRegAdm}</span>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#94A3B8',
                                    marginBottom: '0.4rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em'
                                }}>
                                    Full Name <span style={{ color: '#F43F5E' }}>*</span>
                                </label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(15, 23, 42, 0.65)',
                                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '10px',
                                    padding: '0 0.85rem',
                                    height: '46px',
                                    transition: 'border-color 0.2s ease'
                                }}>
                                    <User size={16} style={{ color: '#64748B', marginRight: '0.65rem', flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        placeholder="e.g. Samuel Kibet"
                                        value={selfRegName}
                                        onChange={e => setSelfRegName(e.target.value)}
                                        autoFocus
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            color: '#FFFFFF',
                                            fontSize: '0.92rem',
                                            fontWeight: 600
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Campus Selection */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#94A3B8',
                                    marginBottom: '0.45rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em'
                                }}>
                                    Campus
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setSelfRegCampus('Athi River')}
                                        style={{
                                            height: '42px',
                                            borderRadius: '10px',
                                            border: selfRegCampus === 'Athi River' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.10)',
                                            background: selfRegCampus === 'Athi River' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.45)',
                                            color: selfRegCampus === 'Athi River' ? '#38BDF8' : '#94A3B8',
                                            fontWeight: 700,
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        Athi River
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelfRegCampus('Nairobi')}
                                        style={{
                                            height: '42px',
                                            borderRadius: '10px',
                                            border: selfRegCampus === 'Nairobi' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.10)',
                                            background: selfRegCampus === 'Nairobi' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.45)',
                                            color: selfRegCampus === 'Nairobi' ? '#38BDF8' : '#94A3B8',
                                            fontWeight: 700,
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        Nairobi
                                    </button>
                                </div>
                            </div>

                            {/* Subtle Role Indicator */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '10px',
                                background: 'rgba(56, 189, 248, 0.06)',
                                border: '1px solid rgba(56, 189, 248, 0.15)'
                            }}>
                                <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Enrolling Role</span>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8' }}>Doulos Recruit</span>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={selfRegLoading}
                                style={{
                                    height: '46px',
                                    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '0.94rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    cursor: selfRegLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 16px rgba(14, 165, 233, 0.35)',
                                    marginTop: '0.25rem'
                                }}
                            >
                                {selfRegLoading ? (
                                    <>
                                        <Loader2 size={18} className="spinner-animate" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Complete Registration</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>

                            {/* Back to sign in */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSelfRegistration(false);
                                    setSelfRegError('');
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748B',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    padding: '0.25rem',
                                    marginTop: '0.2rem'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                            >
                                ← Back to Sign In
                            </button>
                        </form>
                    </div>
                ) : (
                    /* ══ STANDARD SIGN IN FORM ══ */
                    <>
                        {/* Header / Brand */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '1.6rem',
                            textAlign: 'center'
                        }}>
                            <div className="login-brand-logo" style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'rgba(30, 41, 59, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.85rem',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                                overflow: 'hidden'
                            }}>
                                <Logo size={42} showText={false} />
                            </div>

                            <h1 className="login-brand-title" style={{
                                fontSize: '1.45rem',
                                fontWeight: 800,
                                color: '#FFFFFF',
                                margin: '0 0 0.35rem 0',
                                letterSpacing: '-0.5px'
                            }}>
                                Doulos System
                            </h1>
                            <p style={{
                                fontSize: '0.82rem',
                                color: '#94A3B8',
                                margin: 0,
                                fontWeight: 500
                            }}>
                                Attendance & Fellowship Management System
                            </p>
                        </div>

                {/* ══ LOGIN AS ROLE SELECTOR (Horizontal Row: G9, Douloid, Recruit) ══ */}
                <div style={{ marginBottom: '1.35rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#94A3B8',
                        marginBottom: '0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        textAlign: 'left'
                    }}>
                        LOGIN AS
                    </label>
                    <div className="login-role-container" style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        gap: '0.5rem'
                    }}>
                        {[
                            { id: 'g9', label: 'G9', icon: ShieldCheck },
                            { id: 'douloid', label: 'Douloid', icon: Award },
                            { id: 'recruit', label: 'Recruit', icon: Compass }
                        ].map((item) => {
                            const isSelected = selectedRole === item.id;
                            const IconComponent = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="login-role-btn"
                                    onClick={() => {
                                        setSelectedRole(item.id);
                                        setError('');
                                    }}
                                    style={{
                                        flex: '1 1 0',
                                        minWidth: 0,
                                        height: '42px',
                                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.45)',
                                        border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.10)',
                                        borderRadius: '12px',
                                        padding: '0 0.45rem',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)' : 'none',
                                        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                >
                                    <IconComponent
                                        size={17}
                                        style={{
                                            color: isSelected ? '#38BDF8' : '#94A3B8',
                                            flexShrink: 0,
                                            transition: 'color 0.2s ease'
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '0.8rem',
                                        fontWeight: isSelected ? 700 : 600,
                                        color: isSelected ? '#38BDF8' : '#CBD5E1',
                                        lineHeight: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {selectedRole === 'g9' ? (
                        <>
                            {/* Username Input */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    color: '#CBD5E1',
                                    marginBottom: '0.4rem'
                                }}>
                                    Username
                                </label>
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(15, 23, 42, 0.65)',
                                    border: `1.5px solid ${isFocusedUser ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'}`,
                                    borderRadius: '10px',
                                    padding: '0 0.85rem',
                                    height: '46px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isFocusedUser ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : 'none'
                                }}>
                                    <User size={18} style={{ color: isFocusedUser ? '#38BDF8' : '#64748B', marginRight: '0.7rem', flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onFocus={() => setIsFocusedUser(true)}
                                        onBlur={() => setIsFocusedUser(false)}
                                        placeholder="Enter your username"
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: '0.88rem',
                                            color: '#F8FAFC',
                                            fontWeight: 500
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    color: '#CBD5E1',
                                    marginBottom: '0.4rem'
                                }}>
                                    Password
                                </label>
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(15, 23, 42, 0.65)',
                                    border: `1.5px solid ${isFocusedPass ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'}`,
                                    borderRadius: '10px',
                                    padding: '0 0.85rem',
                                    height: '46px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isFocusedPass ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : 'none'
                                }}>
                                    <Lock size={18} style={{ color: isFocusedPass ? '#38BDF8' : '#64748B', marginRight: '0.7rem', flexShrink: 0 }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setIsFocusedPass(true)}
                                        onBlur={() => setIsFocusedPass(false)}
                                        placeholder="Enter your password"
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: '0.88rem',
                                            color: '#F8FAFC',
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
                                            color: '#64748B',
                                            padding: '0.25rem',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setForgotNotice('For G9 password reset, please contact the G9 Secretary or Tech Lead.')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#38BDF8',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Admission Number Input for Douloid and Recruit */
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#CBD5E1',
                                marginBottom: '0.4rem'
                            }}>
                                Admission Number
                            </label>
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                background: 'rgba(15, 23, 42, 0.65)',
                                border: `1.5px solid ${isFocusedReg ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'}`,
                                borderRadius: '10px',
                                padding: '0 0.85rem',
                                height: '46px',
                                transition: 'all 0.2s ease',
                                boxShadow: isFocusedReg ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : 'none'
                            }}>
                                <User size={18} style={{ color: isFocusedReg ? '#38BDF8' : '#64748B', marginRight: '0.7rem', flexShrink: 0 }} />
                                <input
                                    type="text"
                                    placeholder="e.g. 24-1033"
                                    value={regNo}
                                    onChange={e => {
                                        let v = e.target.value.replace(/\D/g, '');
                                        if (v.length > 2) v = v.slice(0, 2) + '-' + v.slice(2, 6);
                                        setRegNo(v);
                                    }}
                                    onFocus={() => setIsFocusedReg(true)}
                                    onBlur={() => setIsFocusedReg(false)}
                                    required
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.92rem',
                                        fontWeight: 700,
                                        letterSpacing: '1px',
                                        color: '#FFFFFF'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            height: '46px',
                            background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.94rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 16px rgba(14, 165, 233, 0.35)',
                            transition: 'all 0.2s ease',
                            marginTop: '0.35rem'
                        }}
                        onMouseEnter={e => { if (!loading) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                        onMouseLeave={e => { if (!loading) { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spinner-animate" />
                                <span>Verifying credentials...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Subtext info */}
                <p style={{
                    fontSize: '0.74rem',
                    color: '#64748B',
                    margin: '1.25rem 0 0 0',
                    textAlign: 'center',
                    fontWeight: 500
                }}>
                    Select your role above, and enter your credentials.
                </p>
                </>
                )}

                {/* Subfooter */}
                <div style={{
                    marginTop: '1.25rem',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.42)',
                    fontWeight: 500
                }}>
                    Doulos Attendance & Fellowship System
                </div>
            </div>
        </div>
        </>
    );
};

export default AdminLogin;
