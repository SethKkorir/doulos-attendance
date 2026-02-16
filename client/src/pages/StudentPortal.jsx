import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { Calendar, CheckCircle, XCircle, BookOpen, Music, Bell, Star, Trophy, Search, LogOut, GraduationCap, Sparkles, MessageCircle, Send, CreditCard, Wallet, History, FileText } from 'lucide-react';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import Logo from '../components/Logo';
import DoulosBotIcon from '../components/DoulosBotIcon';
import FinanceView from '../components/FinanceView';

const StudentPortal = () => {
    const location = useLocation();
    const isGuest = location.state?.isGuest || false;

    const SESSION_DURATION = 20 * 60 * 1000; // 20 Minutes

    const [regNo, setRegNo] = useState(() => {
        const stored = localStorage.getItem('studentSession');
        if (stored) {
            try {
                const { regNo, expiry } = JSON.parse(stored);
                if (Date.now() <= expiry) return regNo;
                localStorage.removeItem('studentSession');
            } catch (e) {
                localStorage.removeItem('studentSession');
            }
        }

        // Migration fallback
        const legacy = localStorage.getItem('studentRegNo');
        if (legacy) {
            localStorage.removeItem('studentRegNo');
            return legacy;
        }
        return '';
    });

    const [isLoggedIn, setIsLoggedIn] = useState(!!regNo || isGuest);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [whatsappLink, setWhatsappLink] = useState('');
    const [guestFeaturesEnabled, setGuestFeaturesEnabled] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'finance', 'community'
    const [comingSoon, setComingSoon] = useState(null); // Title of feature
    const navigate = useNavigate();

    // Chat Widget State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { sender: 'bot', text: 'Welcome to Doulos AI Bot! How can I help you today?' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showChatPopup, setShowChatPopup] = useState(false);

    useEffect(() => {
        if (isLoggedIn && !isChatOpen) {
            // Show popup after a delay
            const timer = setTimeout(() => setShowChatPopup(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, isChatOpen]);

    useEffect(() => {
        if (showChatPopup) {
            // Auto hide after 8 seconds
            const timer = setTimeout(() => setShowChatPopup(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [showChatPopup]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [waRes, guestRes] = await Promise.all([
                    api.get('/settings/whatsapp_link'),
                    api.get('/settings/guest_features')
                ]);
                setWhatsappLink(waRes.data?.value || '');
                setGuestFeaturesEnabled(guestRes.data?.value !== 'false');
            } catch (err) {
                console.error('Failed to fetch settings');
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        let timer;
        if (error) {
            timer = setTimeout(() => setError(null), 5000);
        }
        return () => clearTimeout(timer);
    }, [error]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();

        if (isGuest) {
            // Load Mock Data
            setData({
                studentRegNo: 'GUEST-001',
                memberName: 'Guest Explorer',
                memberType: 'Visitor',
                campus: 'Valley Road',
                stats: { totalAttended: 12, totalMeetings: 16, percentage: 75 },
                history: [
                    { _id: '1', date: new Date().toISOString(), name: 'Sunday Service', attended: true, campus: 'Valley Road' },
                    { _id: '2', date: new Date(Date.now() - 86400000 * 7).toISOString(), name: 'Prayer Meeting', attended: false, campus: 'Valley Road' },
                    { _id: '3', date: new Date(Date.now() - 86400000 * 14).toISOString(), name: 'Bible Study', attended: true, campus: 'Valley Road' }
                ]
            });
            setIsLoggedIn(true);
            return;
        }

        if (!regNo) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/attendance/student/${regNo}`);

            setData(res.data);
            setIsLoggedIn(true);
            const sessionData = {
                regNo: regNo.toUpperCase(),
                expiry: Date.now() + SESSION_DURATION
            };
            localStorage.setItem('studentSession', JSON.stringify(sessionData));
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('studentSession');
        setIsLoggedIn(false);
        setData(null);
        setRegNo('');
    };

    const handleClearCongrats = async () => {
        try {
            await api.post(`/members/clear-congrats/${data.studentRegNo}`);
            setData({ ...data, needsGraduationCongrats: false });
        } catch (err) {
            console.error('Failed to clear congrats status');
            setData({ ...data, needsGraduationCongrats: false });
        }
    };

    const handleEnroll = async () => {
        setLoading(true);
        try {
            const res = await api.post('/members/enroll', {
                studentRegNo: data.studentRegNo,
                semester: data.currentSemester
            });
            setData(prev => ({
                ...prev,
                lastActiveSemester: data.currentSemester,
                alerts: prev.alerts.filter(a => a.type !== 'semester')
            }));
            alert(`Great! You are now active for ${data.currentSemester}.`);
        } catch (err) {
            alert("Enrollment failed. Please try again or see an admin.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogActivity = async (type) => {
        const code = prompt(`Please enter the ${type} verification code from the physical banner:`);
        if (!code) return;

        setLoading(true);
        try {
            await api.post('/activities/log', {
                studentRegNo: data.studentRegNo,
                type,
                notes: `Verification Code: ${code}`
            });
            // Refresh portal data to see new points/logs
            handleLogin();
            alert(`${type} recorded successfully! 🌿`);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to log activity. Check the code and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = { sender: 'user', text: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsTyping(true);

        // Determine greeting based on time
        const hour = new Date().getHours();
        let timeGreeting = 'Day';
        if (hour < 12) timeGreeting = 'Morning';
        else if (hour < 18) timeGreeting = 'Afternoon';
        else timeGreeting = 'Evening';

        const name = data.memberName ? data.memberName.split(' ')[0] : 'Member';

        setTimeout(() => {
            setIsTyping(false);
            setChatMessages(prev => [...prev, {
                sender: 'bot',
                text: `Good ${timeGreeting}, ${name}! 👋 I am the Doulos Bot. I'm currently being built to help you with all things Doulos. This feature is coming very soon!`
            }]);
        }, 1500);
    };

    useEffect(() => {
        if (isLoggedIn && !data) {
            handleLogin();
        }
    }, [isLoggedIn, isGuest]);

    if (!isLoggedIn) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2.5rem', padding: '1.5rem', position: 'relative' }}>
                <BackgroundGallery />
                <ValentineRain />

                <div className="glass-panel" style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    background: '#0f172a',
                    position: 'relative',
                    zIndex: 10,
                    border: '1px solid var(--glass-border)',
                    borderRadius: '1.5rem',
                    boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4)',
                }}>
                    <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <div className="rotating-logo">
                                <Logo size={80} showText={false} />
                            </div>
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '120px', height: '120px', borderRadius: '50%',
                                background: 'radial-gradient(circle, hsla(198, 76%, 51%, 0.1) 0%, transparent 70%)',
                                zIndex: -1,
                                animation: 'pulse 4s infinite'
                            }}></div>
                        </div>
                        <h1 style={{
                            marginTop: '1.5rem',
                            marginBottom: '0.5rem',
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                            color: 'white',
                            textShadow: '0 0 20px rgba(37, 170, 225, 0.3)'
                        }}>
                            DOULOS <span style={{ color: 'hsl(var(--color-primary))' }}>PORTAL</span>
                        </h1>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            justifyContent: 'center',
                            color: 'var(--color-text-dim)',
                            opacity: 0.6
                        }}>
                            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, currentColor)' }}></div>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Member Access</span>
                            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to left, transparent, currentColor)' }}></div>
                        </div>
                    </div>



                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label>Admission No</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    placeholder="21-1234"
                                    className="input-field input-field-premium"
                                    value={regNo}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.length > 2) {
                                            val = val.slice(0, 2) + '-' + val.slice(2, 6);
                                        }
                                        setRegNo(val);
                                    }}
                                    required
                                />
                                <Search size={18} style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-text-dim)',
                                    opacity: 0.5,
                                    pointerEvents: 'none'
                                }} />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                                width: '100%',
                                height: '50px',
                                fontSize: '0.9rem',
                                marginTop: '0.5rem',
                                letterSpacing: '2px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                borderRadius: '0.75rem',
                                boxShadow: '0 10px 20px -5px hsla(198, 76%, 51%, 0.3)'
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


                    {guestFeaturesEnabled && (
                        <button
                            onClick={() => navigate('/guest')}
                            style={{
                                background: 'none', border: 'none',
                                color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700,
                                textDecoration: 'none', opacity: 0.8, cursor: 'pointer',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.opacity = 1}
                            onMouseOut={(e) => e.target.style.opacity = 0.8}
                        >
                            Guest Access →
                        </button>
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
                    .rotating-logo {
                        animation: rotateInfinite 60s linear infinite;
                        filter: drop-shadow(0 0 30px hsla(198, 76%, 51%, 0.3));
                    }
                    @keyframes rotateInfinite {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.3; }
                        50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.5; }
                        100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.3; }
                    }
                    @keyframes firework-burst {
                        0% { transform: scale(0); opacity: 1; }
                        100% { transform: scale(1.2); opacity: 0; }
                    }
                    .firework {
                        position: absolute;
                        width: 5px;
                        height: 5px;
                        border-radius: 50%;
                        box-shadow: 0 0 20px 10px white, 0 0 40px 20px hsla(198, 76%, 51%, 0.5);
                        animation: firework-burst 2s infinite ease-out;
                        pointer-events: none;
                        z-index: 5;
                    }
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes slideDown {
                        from { transform: translateY(-30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                     .input-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        font-size: 0.6rem;
                        color: var(--color-text-dim);
                        font-weight: 800;
                        letter-spacing: 1.5px;
                        text-align: left;
                        text-transform: uppercase;
                        opacity: 0.8;
                    }
                    .input-field-premium {
                        height: 45px;
                        background: rgba(0,0,0,0.3) !important;
                        border: 1px solid var(--glass-border) !important;
                        border-radius: 0.75rem !important;
                        font-size: 0.9rem !important;
                        font-weight: 600 !important;
                        letter-spacing: 0.5px !important;
                        padding: 0 1rem !important;
                        width: 100%;
                    }
                    .input-field-premium:focus {
                        border-color: #25AAE1 !important;
                        box-shadow: 0 0 15px rgba(37, 170, 225, 0.15) !important;
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
            </div >
        );
    }

    if (!data) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1.5rem' }}>
                <BackgroundGallery />
                <div className="loading-spinner-small" style={{ width: '50px', height: '50px', borderTopColor: '#25AAE1' }}></div>
                <p style={{ color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '2px' }}>LOADING DOULOS PORTAL...</p>
            </div>
        );
    }

    if (isLoggedIn && data?.needsGraduationCongrats) {
        return (
            <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <BackgroundGallery />
                <ValentineRain />
                {/* Fireworks particles */}
                <div class="firework" style={{ top: '20%', left: '15%', animationDelay: '0s' }}></div>
                <div class="firework" style={{ top: '15%', left: '80%', animationDelay: '0.5s', boxShadow: '0 0 20px 10px white, 0 0 40px 20px #FFD700' }}></div>
                <div class="firework" style={{ top: '70%', left: '10%', animationDelay: '1.2s', boxShadow: '0 0 20px 10px white, 0 0 40px 20px #f87171' }}></div>
                <div class="firework" style={{ top: '80%', left: '85%', animationDelay: '1.8s', boxShadow: '0 0 20px 10px white, 0 0 40px 20px #4ade80' }}></div>
                <div class="firework" style={{ top: '50%', left: '50%', animationDelay: '0.8s' }}></div>

                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '2rem', maxWidth: '600px', width: '100%' }}>
                    <div className="glass-panel" style={{ padding: '3rem 2rem', border: '2px solid hsl(var(--color-primary))', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 0 50px rgba(37, 170, 225, 0.3)', animation: 'slideUp 0.8s' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <Sparkles size={40} color="#FFD700" style={{ animation: 'bounce 2s infinite' }} />
                            <GraduationCap size={48} color="hsl(var(--color-primary))" />
                            <Sparkles size={40} color="#FFD700" style={{ animation: 'bounce 2s infinite 1s' }} />
                        </div>

                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '-1px' }}>
                            OFFICIALLY A <span style={{ color: 'hsl(var(--color-primary))' }}>DOULOID!</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#4ade80', fontWeight: 700, marginBottom: '2rem' }}>
                            Congratulations on completing your recruitment!
                        </p>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                                Your journey of growth and impact continues. You now have full access to all Douloid features and resources within this portal.
                            </p>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleClearCongrats}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                fontSize: '1.1rem',
                                fontWeight: 900,
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 15px 30px -5px hsl(var(--color-primary) / 0.4)'
                            }}
                        >
                            PROCEED TO MY PORTAL 🚀
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--color-bg)', color: 'white', overflowX: 'hidden' }}>
            <BackgroundGallery />
            <ValentineRain />

            {/* Coming Soon Backdrop */}
            {comingSoon && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: '#000000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, animation: 'fadeIn 0.3s'
                }} onClick={() => setComingSoon(null)}>
                    <div className="glass-panel" style={{
                        padding: '3rem', textAlign: 'center', maxWidth: '400px',
                        border: '1px solid hsl(var(--color-primary))',
                        animation: 'congratsPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgba(37, 170, 225, 0.1)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                            color: '#25AAE1'
                        }}>
                            <Sparkles size={40} className="animate-pulse" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{comingSoon}</h2>
                        <p style={{ color: 'var(--color-text-dim)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            We are currently building this feature to make your Doulos experience even better. Stay tuned!
                        </p>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setComingSoon(null)}>
                            GOT IT 🚀
                        </button>
                    </div>
                </div>
            )}

            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Modern Header */}
                <header style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '1rem', marginBottom: '2rem', padding: '1.25rem',
                    background: '#1e293b', borderRadius: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '15px',
                            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #032540 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 20px rgba(37, 170, 225, 0.3)',
                            animation: 'rotateLogo 60s linear infinite'
                        }}>
                            <Logo size={30} showText={false} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, letterSpacing: '2px', color: 'hsl(var(--color-primary))' }}>DOULOS <span style={{ color: 'white' }}>PORTAL</span></h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                <span style={{
                                    padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(37, 170, 225, 0.2)',
                                    fontSize: '0.65rem', fontWeight: 800, color: '#25AAE1'
                                }}>{data.memberType?.toUpperCase()}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>ID: {data.studentRegNo}</span>
                            </div>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={handleLogout} style={{
                        background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.1)'
                    }}>
                        <LogOut size={20} />
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: '8fr 4fr', gap: '1.5rem' }} className="portal-grid">
                    {/* Main Content Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Welcome Banner */}
                        <div className="glass-panel" style={{
                            padding: '2.5rem', position: 'relative', overflow: 'hidden',
                            background: 'linear-gradient(135deg, hsl(206, 80%, 20%) 0%, hsl(206, 80%, 15%) 100%)',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B0B0B0', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                    <Sparkles size={14} color="#facc15" /> Welcome Back
                                </div>
                                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                                    Hi, <span style={{ color: 'hsl(var(--color-primary))' }}>{data.memberName?.split(' ')[0] || 'Member'}!</span>
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '400px' }}>
                                    Your consistency is your superpower. Your total Doulos points: <strong style={{ color: '#facc15' }}>{data.totalPoints || 0}</strong>
                                </p>
                            </div>

                            {/* Stats Circle - Redesigned */}
                            <div style={{
                                position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }} className="header-stats">
                                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--color-primary))" strokeWidth="10"
                                            strokeDasharray="314.15"
                                            strokeDashoffset={314.15 - (314.15 * data.stats.percentage / 100)}
                                            strokeLinecap="round"
                                            style={{ filter: 'drop-shadow(0 0 8px hsl(var(--color-primary) / 0.5))', transition: 'stroke-dashoffset 2s ease-out' }}
                                        />
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{data.stats.percentage}%</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'hsl(var(--color-primary))', marginTop: '0.5rem', letterSpacing: '1px' }}>RATIO</div>
                            </div>
                        </div>

                        {/* Action Center - Alerts */}
                        {data.alerts && data.alerts.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {data.alerts.map((alert, i) => (
                                    <div key={i} className="glass-panel" style={{
                                        padding: '1.25rem',
                                        background: alert.priority === 'high' ? 'rgba(37, 170, 225, 0.1)' : 'rgba(255,255,255,0.03)',
                                        border: alert.priority === 'high' ? '1px solid rgba(37, 170, 225, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        animation: 'slideRight 0.5s ease-out'
                                    }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '45px', height: '45px', borderRadius: '12px',
                                                background: alert.type === 'finance' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 170, 225, 0.1)',
                                                color: alert.type === 'finance' ? '#f87171' : '#25AAE1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {alert.type === 'finance' ? <Wallet size={20} /> : alert.type === 'watering' ? <Sparkles size={20} /> : <Calendar size={20} />}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{alert.title}</h4>
                                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>{alert.message}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                if (alert.action === 'ENROLL') handleEnroll();
                                                if (alert.action === 'SCAN_QR') handleLogActivity('Tree Watering');
                                                if (alert.action === 'PAY') setActiveTab('finance');
                                            }}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800 }}
                                        >
                                            {alert.action === 'SCAN_QR' ? 'I DID THIS' : alert.action}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Navigation Tabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', width: 'fit-content', overflowX: 'auto' }}>
                            {['overview', 'history', 'activities', 'finance'].map(tab => (
                                <button key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '0.6rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                                        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                                        background: activeTab === tab ? 'hsl(var(--color-primary))' : 'transparent',
                                        color: activeTab === tab ? 'white' : 'var(--color-text-dim)',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'overview' ? (
                            <>
                                {/* Quick Access Actions */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div className="glass-panel action-card" onClick={() => setComingSoon('Monthly Contribution')} style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                            <Star size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Monthly Contribution</h3>
                                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Support Doulos projects and events.</p>
                                    </div>
                                    <div className="glass-panel action-card" onClick={() => setComingSoon('20 Bob Challenge')} style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                            <Trophy size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>20 Bob Challenge</h3>
                                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Small change, big impact. Join today!</p>
                                    </div>
                                </div>

                                {/* Quick Check-in Section */}
                                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #25AAE1' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', borderRadius: '12px' }}>
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>ATTENDANCE CHECK-IN</h3>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Scan QR or enter manual code from leaderboard.</p>
                                        </div>
                                    </div>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        if (isGuest) {
                                            alert("Guest users cannot perform check-ins.");
                                            return;
                                        }
                                        const code = e.target.elements.code.value.trim();
                                        if (code) window.location.href = `/check-in/${code}`;
                                    }} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input name="code" placeholder="CODE" className="input-field" style={{ width: '100px', height: '40px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }} required />
                                        <button className="btn btn-primary" style={{ padding: '0 1.25rem', height: '40px', fontSize: '0.8rem', fontWeight: 800 }}>GO</button>
                                    </form>
                                </div>

                                {/* Stats Overview Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', fontWeight: 800, letterSpacing: '2px', marginBottom: '0.5rem' }}>STANDING</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#facc15' }}>{data.stats.totalAttended > 5 ? 'GOLD' : 'SILVER'}</div>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', fontWeight: 800, letterSpacing: '2px', marginBottom: '0.5rem' }}>TOTAL SESSIONS</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#25AAE1' }}>{data.stats.totalAttended} / {data.stats.totalMeetings}</div>
                                    </div>
                                </div>
                            </>
                        ) : activeTab === 'activities' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 900 }}>Doulos Hours: Activity Log</h3>
                                    <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                        History of your contributions to Freedom Base (Tree watering, setup, etc.)
                                    </p>

                                    {!data.activityLogs?.length ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem' }}>
                                            <History size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>No activities logged yet for this semester.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {data.activityLogs.map((log, i) => (
                                                <div key={i} style={{
                                                    padding: '1rem', background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{log.type}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ color: '#4ade80', fontWeight: 900, fontSize: '0.9rem' }}>+{log.pointsEarned} Pts</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'finance' ? (
                            <FinanceView regNo={data.studentRegNo} memberName={data.memberName} />
                        ) : (
                            /* History List - Refined */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {data.history.map((m, i) => (
                                    <div key={m._id} className="glass-panel" style={{
                                        padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderLeft: `4px solid ${m.attended ? '#4ade80' : '#f87171'}`,
                                        animation: `slideUp 0.4s ease-out ${i * 0.05}s both`
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ textAlign: 'center', minWidth: '50px' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{new Date(m.date).getDate()}</div>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                                                    {new Date(m.date).toLocaleString('default', { month: 'short' })}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{m.name}</h4>
                                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>{m.campus}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: m.attended ? '#4ade80' : '#f87171' }}>
                                            {m.attended ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>{m.attended ? 'VERIFIED' : 'ABSENT'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Secondary Info */}

                </div>
            </div>

            {/* Floating Chat Widget */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                {isChatOpen && (
                    <div className="glass-panel" style={{
                        width: '350px',
                        height: '500px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        background: 'rgba(15, 23, 42, 0.95)'
                    }}>
                        {/* Chat Header */}
                        <div style={{ padding: '1rem', background: 'rgba(37, 170, 225, 0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <DoulosBotIcon size={28} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.5px' }}>Doulos Bot</span>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer' }}><XCircle size={20} /></button>
                        </div>

                        {/* Chat Body */}
                        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {chatMessages.map((msg, i) => (
                                <div key={i} style={{
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '1rem',
                                    background: msg.sender === 'user' ? 'hsl(var(--color-primary))' : 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    borderBottomRightRadius: msg.sender === 'user' ? '2px' : '1rem',
                                    borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '1rem',
                                }}>
                                    {msg.text}
                                </div>
                            ))}
                            {isTyping && (
                                <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', fontSize: '0.8rem', display: 'flex', gap: '0.3rem' }}>
                                    <span style={{ animation: 'bounce 1s infinite 0s' }}>•</span>
                                    <span style={{ animation: 'bounce 1s infinite 0.2s' }}>•</span>
                                    <span style={{ animation: 'bounce 1s infinite 0.4s' }}>•</span>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendChat} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.5rem' }}>
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '0.5rem', padding: '0.75rem', color: 'white', fontSize: '0.9rem' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', borderRadius: '0.5rem' }} disabled={!chatInput.trim()}>
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                )}

                {/* Toggle Button */}
                {/* Toggle Button Container with Popup */}
                <div style={{ position: 'relative' }}>
                    {!isChatOpen && showChatPopup && (
                        <div style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: '0',
                            width: '200px',
                            padding: '1rem',
                            background: 'white',
                            color: 'black',
                            borderRadius: '1rem',
                            borderBottomRightRadius: '2px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1), float 3s ease-in-out infinite'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                👋 Hi {data.memberName?.split(' ')[0]}! I'm Doulos Bot. Need help?
                            </div>
                            <div style={{
                                position: 'absolute',
                                bottom: '-6px',
                                right: '20px',
                                width: '12px',
                                height: '12px',
                                background: 'white',
                                transform: 'rotate(45deg)'
                            }}></div>
                        </div>
                    )}

                    {!isChatOpen && (
                        <button onClick={() => { setIsChatOpen(true); setShowChatPopup(false); }} className="btn" style={{
                            width: '65px', height: '65px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(37, 170, 225, 0.4)',
                            animation: 'bounce 2s infinite',
                            background: 'white',
                            border: '4px solid rgba(37, 170, 225, 0.2)',
                            cursor: 'pointer'
                        }}>
                            <DoulosBotIcon size={40} />
                        </button>
                    )}
                </div>

                {/* Guest Feedback Button */}
                {isGuest && (
                    <button
                        onClick={async () => {
                            const message = window.prompt("💡 Share your thoughts on the Student Portal:");
                            if (message) {
                                try {
                                    await api.post('/feedback', { message, category: 'student_guest_feedback' });
                                    alert("Thanks for your feedback!");
                                } catch (e) {
                                    console.error(e);
                                    alert("Failed to send feedback. Please try again.");
                                }
                            }
                        }}
                        className="btn"
                        style={{
                            width: '65px', height: '65px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(250, 204, 21, 0.4)',
                            background: '#facc15', color: 'black',
                            border: 'none', cursor: 'pointer',
                            marginTop: '1rem', fontWeight: 'bold', fontSize: '1.5rem'
                        }}
                    >
                        💡
                    </button>
                )}

                <style>{`
                .container { width: 100%; max-width: 1200px; padding: 1.5rem; }
                .action-card:hover { 
                    transform: translateY(-5px); 
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(37, 170, 225, 0.3) !important;
                }
                @media (max-width: 992px) {
                    .portal-grid { grid-template-columns: 1fr !important; }
                    .header-stats { position: relative !important; right: auto !important; top: auto !important; transform: none !important; margin-top: 2rem; }
                }
                @keyframes rotateLogo {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes congratsPop {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
            </div>
        </div>
    );
};

export default StudentPortal;
