import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, Sun, Moon, User, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
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

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isDarkMode]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { username, password });
            
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('username', res.data.username);
            
            // Strict Routing Logic
            if (res.data.username === 'supersuperadmin') {
                console.log('Redirecting to Premium Super Admin Dashboard...');
                navigate('/superadmin');
            } else if (res.data.username === 'superadmin' || res.data.role === 'superadmin') {
                console.log('Redirecting to Super Admin View...');
                navigate('/admin/dashboard');
            } else {
                console.log('Redirecting to Admin Dashboard...');
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center login-page-container" style={{
            minHeight: '100vh',
            flexDirection: 'column',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'var(--font-main)'
        }}>
            {/* Background Image Carousel */}
            <BackgroundGallery />

            {/* Glowing Ambient Blobs - Adding rich layered animation for visual wow factor */}
            <div className="ambient-blob blob-1"></div>
            <div className="ambient-blob blob-2"></div>

            {/* Premium Theme Switcher */}
            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="theme-toggle-btn"
                aria-label="Toggle Theme"
                style={{
                    position: 'absolute',
                    top: '2rem',
                    right: '2rem',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 100,
                    borderRadius: '14px',
                    border: '1px solid var(--theme-toggle-border)',
                    background: 'var(--theme-toggle-bg)',
                    backdropFilter: 'blur(8px)',
                    color: isDarkMode ? '#facc15' : 'var(--primary-electric)',
                    boxShadow: 'var(--theme-toggle-shadow)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {isDarkMode ? <Sun size={20} className="theme-icon" /> : <Moon size={20} className="theme-icon" />}
            </button>

            {/* Floating Redesigned Toast Notification for Login Failures */}
            {error && (
                <div className="premium-toast-alert" style={{
                    position: 'fixed',
                    top: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2000,
                    minWidth: '320px',
                    maxWidth: '90%',
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    background: 'var(--toast-bg)',
                    border: '1px solid var(--toast-border)',
                    boxShadow: 'var(--toast-shadow)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    color: 'var(--toast-color)',
                    animation: 'error-slide-down 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                }}>
                    <AlertCircle size={20} style={{ color: 'var(--toast-icon-color)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--toast-title-color)' }}>Authentication Alert</span>
                        <span style={{ fontWeight: 500, fontSize: '0.85rem', opacity: 0.9 }}>{error}</span>
                    </div>
                </div>
            )}

            {/* Login Card Container */}
            <div className="login-card-panel" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '3rem 2.25rem 2.5rem',
                borderRadius: '2rem',
                border: '1px solid var(--login-card-border)',
                background: 'var(--login-card-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: 'var(--login-card-shadow)',
                position: 'relative',
                zIndex: 10,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {/* Visual Header */}
                <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Logo Orbital Glow Ring 1 */}
                        <div className="orbital-ring ring-outer"></div>
                        {/* Logo Orbital Glow Ring 2 */}
                        <div className="orbital-ring ring-inner"></div>
                        
                        <div className="brand-logo-wrapper">
                            <Logo size={76} showText={false} />
                        </div>
                    </div>

                    <h1 className="login-card-title" style={{
                        marginTop: '1.75rem',
                        marginBottom: '0.5rem',
                        fontSize: '1.75rem',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        background: 'var(--title-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase'
                    }}>
                        Admin Access
                    </h1>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '80%',
                        justifyContent: 'center',
                        opacity: 0.65
                    }}>
                        <div style={{ height: '1px', flex: 1, background: 'var(--divider-gradient-left)' }}></div>
                        <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            letterSpacing: '2.5px',
                            textTransform: 'uppercase',
                            color: 'var(--color-primary-text)'
                        }}>Secure Portal</span>
                        <div style={{ height: '1px', flex: 1, background: 'var(--divider-gradient-right)' }}></div>
                    </div>
                </div>

                {/* Form Elements */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Username Input Field */}
                    <div className="form-input-group">
                        <label className={`form-input-label ${isFocusedUser || username ? 'label-focused' : ''}`}>
                            Username
                            <span className="required-dot"></span>
                        </label>
                        <div className={`input-icon-container ${isFocusedUser ? 'focused' : ''}`}>
                            <User size={18} className="input-icon-left" />
                            <input
                                type="text"
                                className="form-input-field"
                                placeholder="Developer Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setIsFocusedUser(true)}
                                onBlur={() => setIsFocusedUser(false)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input Field */}
                    <div className="form-input-group">
                        <label className={`form-input-label ${isFocusedPass || password ? 'label-focused' : ''}`}>
                            Password
                            <span className="required-dot"></span>
                        </label>
                        <div className={`input-icon-container ${isFocusedPass ? 'focused' : ''}`}>
                            <Lock size={18} className="input-icon-left" />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsFocusedPass(true)}
                                onBlur={() => setIsFocusedPass(false)}
                                required
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle-btn"
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`submit-btn-premium ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        <div className="submit-btn-content">
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spinner-animate" />
                                    <span>Verifying Access...</span>
                                </>
                            ) : (
                                <>
                                    <span>Log In Portal</span>
                                    <ArrowRight size={18} className="arrow-hover-animate" />
                                </>
                            )}
                        </div>
                    </button>
                </form>

                {/* Footer Guest Option */}
                {guestFeaturesEnabled && (
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/guest')}
                            className="guest-portal-btn"
                        >
                            <span>Guest Access & Verification</span>
                            <ArrowRight size={14} className="guest-arrow" />
                        </button>
                    </div>
                )}

                {/* Subfooter */}
                <div className="subfooter-branding">
                    Doulos Attendance Dashboard System
                </div>
            </div>

            {/* Embedded Redesigned CSS Styles */}
            <style>{`
                /* CSS Dynamic Theme Variables */
                .login-page-container {
                    --theme-toggle-bg: rgba(9, 29, 46, 0.4);
                    --theme-toggle-border: rgba(29, 166, 217, 0.15);
                    --theme-toggle-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3);
                    
                    --login-card-bg: rgba(2, 21, 37, 0.7);
                    --login-card-border: rgba(29, 166, 217, 0.2);
                    --login-card-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px -10px rgba(29, 166, 217, 0.12);
                    --title-gradient: linear-gradient(135deg, #ffffff 0%, #1da6d9 100%);
                    
                    --color-primary-text: #1da6d9;
                    --divider-gradient-left: linear-gradient(to right, transparent, rgba(29, 166, 217, 0.4));
                    --divider-gradient-right: linear-gradient(to left, transparent, rgba(29, 166, 217, 0.4));
                    
                    --input-bg: rgba(0, 0, 0, 0.35);
                    --input-border: rgba(29, 166, 217, 0.15);
                    --input-border-focus: #1da6d9;
                    --input-text: #ffffff;
                    --input-placeholder: rgba(255, 255, 255, 0.25);
                    --input-icon-color: rgba(255, 255, 255, 0.4);
                    --input-icon-focus: #1da6d9;
                    
                    --label-color: rgba(255, 255, 255, 0.5);
                    --label-color-focused: #1da6d9;
                    
                    --btn-gradient: linear-gradient(135deg, #1da6d9 0%, #0d729c 100%);
                    --btn-shadow: 0 10px 25px -5px rgba(29, 166, 217, 0.4);
                    --btn-shadow-hover: 0 15px 35px -5px rgba(29, 166, 217, 0.6);
                    
                    --guest-color: rgba(29, 166, 217, 0.8);
                    --guest-color-hover: #ffffff;
                    --guest-bg-hover: rgba(29, 166, 217, 0.1);
                    
                    --toast-bg: rgba(28, 9, 15, 0.8);
                    --toast-border: rgba(239, 68, 68, 0.3);
                    --toast-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.1);
                    --toast-color: #fca5a5;
                    --toast-title-color: #ef4444;
                    --toast-icon-color: #ef4444;
                }

                .light-mode .login-page-container {
                    --theme-toggle-bg: rgba(255, 255, 255, 0.8);
                    --theme-toggle-border: rgba(0, 0, 0, 0.08);
                    --theme-toggle-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
                    
                    --login-card-bg: rgba(255, 255, 255, 0.8);
                    --login-card-border: rgba(0, 0, 0, 0.08);
                    --login-card-shadow: 0 30px 60px -15px rgba(2, 21, 37, 0.15), 0 0 30px rgba(0, 0, 0, 0.02);
                    --title-gradient: linear-gradient(135deg, #021525 0%, #1da6d9 100%);
                    
                    --color-primary-text: #021525;
                    --divider-gradient-left: linear-gradient(to right, transparent, rgba(2, 21, 37, 0.2));
                    --divider-gradient-right: linear-gradient(to left, transparent, rgba(2, 21, 37, 0.2));
                    
                    --input-bg: rgba(248, 250, 252, 0.8);
                    --input-border: rgba(0, 0, 0, 0.1);
                    --input-border-focus: #1da6d9;
                    --input-text: #021525;
                    --input-placeholder: rgba(2, 21, 37, 0.35);
                    --input-icon-color: rgba(2, 21, 37, 0.4);
                    --input-icon-focus: #1da6d9;
                    
                    --label-color: rgba(2, 21, 37, 0.6);
                    --label-color-focused: #1da6d9;
                    
                    --btn-gradient: linear-gradient(135deg, #1da6d9 0%, #021525 100%);
                    --btn-shadow: 0 10px 25px -5px rgba(29, 166, 217, 0.25);
                    --btn-shadow-hover: 0 15px 35px -5px rgba(29, 166, 217, 0.4);
                    
                    --guest-color: #021525;
                    --guest-color-hover: #1da6d9;
                    --guest-bg-hover: rgba(29, 166, 217, 0.08);
                    
                    --toast-bg: rgba(254, 242, 242, 0.95);
                    --toast-border: rgba(239, 68, 68, 0.2);
                    --toast-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
                    --toast-color: #991b1b;
                    --toast-title-color: #dc2626;
                    --toast-icon-color: #dc2626;
                }

                /* Glowing Blobs Behind the Glass Card */
                .ambient-blob {
                    position: absolute;
                    width: 320px;
                    height: 320px;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.12;
                    z-index: 1;
                    pointer-events: none;
                    transition: opacity 1s ease;
                }
                .light-mode .ambient-blob {
                    opacity: 0.04;
                }
                .blob-1 {
                    background: radial-gradient(circle, #1da6d9 0%, transparent 70%);
                    top: 25%;
                    left: 30%;
                    animation: float-blob-1 12s ease-in-out infinite;
                }
                .blob-2 {
                    background: radial-gradient(circle, #a855f7 0%, transparent 70%);
                    bottom: 25%;
                    right: 30%;
                    animation: float-blob-2 15s ease-in-out infinite;
                }

                /* Theme Toggle Button Hover */
                .theme-toggle-btn:hover {
                    border-color: #1da6d9 !important;
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 12px 28px -4px rgba(29, 166, 217, 0.2) !important;
                }
                .theme-toggle-btn:active {
                    transform: scale(0.95);
                }
                .theme-icon {
                    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .theme-toggle-btn:hover .theme-icon {
                    transform: rotate(15deg) scale(1.1);
                }

                /* Double Orbital Glow Rings around Logo */
                .brand-logo-wrapper {
                    position: relative;
                    z-index: 5;
                    filter: drop-shadow(0 0 25px rgba(29, 166, 217, 0.45));
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .brand-logo-wrapper:hover {
                    transform: scale(1.04);
                }
                .orbital-ring {
                    position: absolute;
                    border-radius: 50%;
                    border: 1px dashed rgba(29, 166, 217, 0.25);
                    pointer-events: none;
                }
                .ring-outer {
                    width: 114px;
                    height: 114px;
                    animation: spin-clockwise 25s linear infinite;
                    border: 1px dashed rgba(29, 166, 217, 0.3);
                }
                .ring-inner {
                    width: 96px;
                    height: 96px;
                    animation: spin-counter 15s linear infinite;
                    border: 1px dotted rgba(29, 166, 217, 0.4);
                }

                /* Inputs Styling */
                .form-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    width: 100%;
                    position: relative;
                }
                .form-input-label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: var(--label-color);
                    text-align: left;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding-left: 2px;
                }
                .label-focused {
                    color: var(--label-color-focused);
                }
                .required-dot {
                    width: 4px;
                    height: 4px;
                    background-color: #ef4444;
                    border-radius: 50%;
                    display: inline-block;
                }
                .input-icon-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 100%;
                    border-radius: 12px;
                    background: var(--input-bg);
                    border: 1px solid var(--input-border);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .input-icon-container.focused {
                    border-color: var(--input-border-focus);
                    box-shadow: 0 0 0 4px rgba(29, 166, 217, 0.15);
                    background: rgba(0, 0, 0, 0.45);
                }
                .light-mode .input-icon-container.focused {
                    background: #ffffff;
                    box-shadow: 0 0 0 4px rgba(29, 166, 217, 0.12);
                }
                .input-icon-left {
                    position: absolute;
                    left: 1rem;
                    color: var(--input-icon-color);
                    pointer-events: none;
                    transition: color 0.3s ease, transform 0.3s ease;
                }
                .input-icon-container.focused .input-icon-left {
                    color: var(--input-icon-focus);
                    transform: scale(1.05);
                }
                .form-input-field {
                    width: 100%;
                    height: 48px;
                    padding: 0 1rem 0 2.75rem;
                    background: transparent !important;
                    border: none !important;
                    border-radius: 12px;
                    color: var(--input-text) !important;
                    font-size: 0.92rem;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    outline: none !important;
                    transition: all 0.3s ease;
                }
                .form-input-field::placeholder {
                    color: var(--input-placeholder);
                    font-weight: 500;
                    opacity: 1;
                }
                
                /* Password Toggle Option Styling */
                .password-toggle-btn {
                    position: absolute;
                    right: 0.75rem;
                    height: 32px;
                    width: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    color: var(--input-icon-color);
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .password-toggle-btn:hover {
                    color: var(--input-border-focus);
                    background: rgba(255, 255, 255, 0.05);
                }
                .light-mode .password-toggle-btn:hover {
                    background: rgba(0, 0, 0, 0.04);
                }
                .password-toggle-btn:active {
                    transform: scale(0.9);
                }

                /* Premium Action Button Styling */
                .submit-btn-premium {
                    position: relative;
                    width: 100%;
                    height: 52px;
                    margin-top: 0.75rem;
                    border-radius: 12px;
                    background: var(--btn-gradient);
                    border: none;
                    cursor: pointer;
                    overflow: hidden;
                    box-shadow: var(--btn-shadow);
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                .submit-btn-premium::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
                    transform: translateX(-100%);
                    transition: transform 0.6s ease;
                    pointer-events: none;
                }
                .submit-btn-premium:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: var(--btn-shadow-hover);
                }
                .submit-btn-premium:hover::before {
                    transform: translateX(100%);
                }
                .submit-btn-premium:active:not(:disabled) {
                    transform: translateY(0);
                }
                .submit-btn-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    color: #ffffff;
                    font-size: 0.92rem;
                    font-weight: 800;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    transition: all 0.2s ease;
                }
                .arrow-hover-animate {
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .submit-btn-premium:hover .arrow-hover-animate {
                    transform: translateX(4px) scale(1.1);
                }
                
                /* Loading State Styles */
                .submit-btn-premium.loading {
                    cursor: not-allowed;
                    opacity: 0.9;
                    background: var(--btn-gradient);
                }
                .spinner-animate {
                    animation: spin 1s linear infinite;
                }

                /* Guest Portal Button Redesign */
                .guest-portal-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--guest-color);
                    padding: 0.6rem 1.2rem;
                    border-radius: 30px;
                    font-size: 0.82rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .guest-portal-btn:hover {
                    color: var(--guest-color-hover);
                    background: var(--guest-bg-hover);
                    border-color: rgba(29, 166, 217, 0.15);
                }
                .guest-arrow {
                    transition: transform 0.3s ease;
                }
                .guest-portal-btn:hover .guest-arrow {
                    transform: translateX(3px);
                }

                /* Subfooter Info */
                .subfooter-branding {
                    margin-top: 2rem;
                    font-size: 0.65rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    opacity: 0.3;
                    color: var(--color-primary-text);
                    text-align: center;
                    pointer-events: none;
                }

                /* Keyframe Animations */
                @keyframes float-blob-1 {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(40px, -60px) scale(1.15); }
                    66% { transform: translate(-30px, 30px) scale(0.9); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                @keyframes float-blob-2 {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-50px, 50px) scale(0.9); }
                    66% { transform: translate(30px, -40px) scale(1.15); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                @keyframes spin-clockwise {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-counter {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                @keyframes error-slide-down {
                    0% { transform: translate(-50%, -30px); opacity: 0; }
                    100% { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AdminLogin;
