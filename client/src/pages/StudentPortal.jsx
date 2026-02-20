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
    const [activeTab, setActiveTab] = useState('overview');
    const [comingSoon, setComingSoon] = useState(null);
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
            const timer = setTimeout(() => setShowChatPopup(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, isChatOpen]);

    useEffect(() => {
        if (showChatPopup) {
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
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '2.5rem',
                padding: '1rem',
                position: 'relative',
                width: '100%',
                overflowX: 'hidden',
                boxSizing: 'border-box'
            }}>
                <BackgroundGallery />
                <ValentineRain />

                <div className="glass-panel" style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    background: '#0f172a',
                    position: 'relative',
                    zIndex: 10,
                    border: '1px solid var(--glass-border)',
                    borderRadius: '1.5rem',
                    boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4)',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <div className="rotating-logo">
                                <Logo size={70} showText={false} />
                            </div>
                        </div>
                        <h1 style={{
                            marginTop: '1.5rem',
                            marginBottom: '0.5rem',
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                            color: 'white',
                        }}>
                            DOULOS <span style={{ color: 'hsl(var(--color-primary))' }}>PORTAL</span>
                        </h1>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
                        <div className="input-group" style={{ width: '100%' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.6rem', color: 'var(--color-text-dim)', fontWeight: 800, letterSpacing: '1.5px', textAlign: 'left', textTransform: 'uppercase' }}>
                                Admission No
                            </label>
                            <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                    placeholder="21-1234"
                                    style={{
                                        height: '45px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.75rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        padding: '0 2.5rem 0 1rem',
                                        width: '100%',
                                        color: 'white',
                                        boxSizing: 'border-box'
                                    }}
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
                                boxShadow: '0 10px 20px -5px hsla(198, 76%, 51%, 0.3)',
                                background: '#25AAE1',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
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
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <span>⚠️ {error}</span>
                        </div>
                    )}

                    {guestFeaturesEnabled && (
                        <button
                            onClick={() => navigate('/guest')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                opacity: 0.8,
                                cursor: 'pointer',
                                marginTop: '1rem',
                                transition: 'opacity 0.2s'
                            }}
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
                    textTransform: 'uppercase',
                    padding: '0 1rem'
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
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative',
                width: '100%',
                overflowX: 'hidden',
                boxSizing: 'border-box'
            }}>
                <BackgroundGallery />
                <div className="loading-spinner-small" style={{ width: '50px', height: '50px', borderTopColor: '#25AAE1' }}></div>
                <p style={{ color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '2px', textAlign: 'center', padding: '0 1rem' }}>LOADING DOULOS PORTAL...</p>
            </div>
        );
    }

    if (isLoggedIn && data?.needsGraduationCongrats) {
        return (
            <div style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                width: '100%',
                padding: '1rem',
                boxSizing: 'border-box'
            }}>
                <BackgroundGallery />
                <ValentineRain />

                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '600px', width: '100%' }}>
                    <div className="glass-panel" style={{
                        padding: '2rem 1.5rem',
                        border: '2px solid hsl(var(--color-primary))',
                        background: 'rgba(0,0,0,0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 0 50px rgba(37, 170, 225, 0.3)',
                        animation: 'slideUp 0.8s',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <Sparkles size={32} color="#FFD700" style={{ animation: 'bounce 2s infinite' }} />
                            <GraduationCap size={40} color="hsl(var(--color-primary))" />
                            <Sparkles size={32} color="#FFD700" style={{ animation: 'bounce 2s infinite 1s' }} />
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 8vw, 2.5rem)',
                            fontWeight: 900,
                            color: 'white',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '-1px'
                        }}>
                            OFFICIALLY A <span style={{ color: 'hsl(var(--color-primary))' }}>DOULOID!</span>
                        </h1>
                        <p style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', color: '#4ade80', fontWeight: 700, marginBottom: '2rem' }}>
                            Congratulations on completing your recruitment!
                        </p>

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            marginBottom: '2.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
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
                                boxShadow: '0 15px 30px -5px hsl(var(--color-primary) / 0.4)',
                                background: '#25AAE1',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            PROCEED TO MY PORTAL 🚀
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: 'var(--color-bg)',
            color: 'white',
            overflowX: 'hidden',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <BackgroundGallery />
            <ValentineRain />

            {comingSoon && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    animation: 'fadeIn 0.3s',
                    padding: '1rem',
                    boxSizing: 'border-box'
                }} onClick={() => setComingSoon(null)}>
                    <div className="glass-panel" style={{
                        padding: '2rem 1.5rem',
                        textAlign: 'center',
                        maxWidth: '400px',
                        width: '100%',
                        border: '1px solid hsl(var(--color-primary))',
                        animation: 'congratsPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        background: '#0f172a',
                        boxSizing: 'border-box'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            background: 'rgba(37, 170, 225, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: '#25AAE1'
                        }}>
                            <Sparkles size={35} className="animate-pulse" />
                        </div>
                        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: 900, marginBottom: '0.5rem' }}>{comingSoon}</h2>
                        <p style={{ color: 'var(--color-text-dim)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            We are currently building this feature to make your Doulos experience even better. Stay tuned!
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: '#25AAE1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                            onClick={() => setComingSoon(null)}
                        >
                            GOT IT 🚀
                        </button>
                    </div>
                </div>
            )}

            <div style={{
                position: 'relative',
                zIndex: 1,
                padding: '1rem',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Modern Header - Fixed for mobile */}
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem',
                    marginBottom: '2rem',
                    padding: '1rem',
                    background: '#1e293b',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #032540 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 20px rgba(37, 170, 225, 0.3)',
                            animation: 'rotateLogo 60s linear infinite',
                            flexShrink: 0
                        }}>
                            <Logo size={25} showText={false} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '0.8rem',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                color: 'hsl(var(--color-primary))',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                DOULOS <span style={{ color: 'white' }}>PORTAL</span>
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                marginTop: '0.2rem',
                                flexWrap: 'wrap'
                            }}>
                                <span style={{
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    background: 'rgba(37, 170, 225, 0.2)',
                                    fontSize: '0.6rem',
                                    fontWeight: 800,
                                    color: '#25AAE1',
                                    whiteSpace: 'nowrap'
                                }}>{data.memberType?.toUpperCase()}</span>
                                <span style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--color-text-dim)',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>ID: {data.studentRegNo}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}>
                        <LogOut size={18} />
                    </button>
                </header>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    width: '100%'
                }}>
                    {/* Main Content Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                        {/* Welcome Banner - Fixed for mobile */}
                        <div className="glass-panel welcome-banner" style={{
                            padding: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, hsl(206, 80%, 20%) 0%, hsl(206, 80%, 15%) 100%)',
                            border: '1px solid var(--glass-border)',
                            animation: 'slideDown 0.5s ease-out',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div className="welcome-content" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                position: 'relative',
                                zIndex: 2
                            }}>
                                <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', marginBottom: '0.75rem' }}>
                                        <Sparkles size={16} />
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>Welcome Back</span>
                                    </div>
                                    <h1 style={{
                                        fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                                        fontWeight: 900,
                                        margin: 0,
                                        letterSpacing: '-0.05em',
                                        lineHeight: 1.2
                                    }}>
                                        Hi, <span style={{ color: 'hsl(var(--color-primary))' }}>{data.memberName?.split(' ')[0] || 'Member'}!</span>
                                    </h1>
                                    <p style={{
                                        marginTop: '0.75rem',
                                        fontSize: '0.9rem',
                                        color: 'rgba(255,255,255,0.7)',
                                        lineHeight: 1.5
                                    }}>
                                        Your consistency is your superpower. Your total loyalty points: <span style={{ color: '#fbbf24', fontWeight: 800 }}>{data.totalPoints || 0}</span>
                                    </p>
                                </div>

                                <div className="header-stats" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '100%'
                                }}>
                                    <div className="ratio-circle-container" style={{ position: 'relative', width: '100px', height: '100px' }}>
                                        <svg width="100" height="100" viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--color-primary))" strokeWidth="10"
                                                strokeDasharray="314.15"
                                                strokeDashoffset={314.15 - (314.15 * data.stats.percentage / 100)}
                                                strokeLinecap="round"
                                                style={{ filter: 'drop-shadow(0 0 8px hsl(var(--color-primary) / 0.5))', transition: 'stroke-dashoffset 2s ease-out' }}
                                            />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{data.stats.percentage}%</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'hsl(var(--color-primary))', marginTop: '0.35rem', letterSpacing: '1px' }}>RATIO</div>
                                </div>
                            </div>
                        </div>

                        {/* Training Track Progress for Douloids */}
                        {data.memberType === 'Douloid' && (
                            <div className="glass-panel" style={{
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.02) 100%)',
                                border: '1px solid rgba(234, 179, 8, 0.2)',
                                borderRadius: '1.5rem',
                                width: '100%',
                                marginTop: '1rem',
                                boxSizing: 'border-box'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Trophy size={20} color="#eab308" />
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Training Track</h4>
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 1000, color: '#eab308' }}>
                                        {data.stats.trainingAttended || 0} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>SESSIONS</span>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.min((data.stats.trainingAttended || 0) * 10, 100)}%`, // Mock progress: 10 sessions = 100%
                                        height: '100%',
                                        background: '#eab308',
                                        boxShadow: '0 0 10px rgba(234, 179, 8, 0.4)',
                                        borderRadius: '10px',
                                        transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}></div>
                                </div>
                                <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                                    Keep attending training sessions to reach 100% completion.
                                </p>
                            </div>
                        )}

                        {/* Action Center - Alerts */}
                        {data.alerts && data.alerts.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                {data.alerts.map((alert, i) => (
                                    <div key={i} className="glass-panel alert-card" style={{
                                        padding: '1rem',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.5)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        animation: 'slideRight 0.5s ease-out',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                color: '#f87171',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {alert.type === 'finance' ? <Wallet size={18} /> : alert.type === 'watering' ? <Sparkles size={18} /> : <Calendar size={18} />}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</h4>
                                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.message}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                if (alert.action === 'ENROLL') handleEnroll();
                                                if (alert.action === 'SCAN_QR') handleLogActivity('Tree Watering');
                                                if (alert.action === 'PAY') setActiveTab('finance');
                                            }}
                                            style={{
                                                padding: '0.5rem',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                width: '100%'
                                            }}
                                        >
                                            {alert.action === 'SCAN_QR' ? 'I DID THIS' : alert.action}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Navigation Tabs - Fixed for mobile */}
                        <div style={{
                            display: 'flex',
                            gap: '0.35rem',
                            padding: '0.35rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '1rem',
                            width: '100%',
                            overflowX: 'auto',
                            boxSizing: 'border-box'
                        }}>
                            {['overview', 'history', 'activities', 'finance'].map(tab => (
                                <button key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.75rem',
                                        border: 'none',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: activeTab === tab ? 'hsl(var(--color-primary))' : 'transparent',
                                        color: activeTab === tab ? 'white' : 'var(--color-text-dim)',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.3s',
                                        flex: 1
                                    }}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'overview' ? (
                            <>
                                {/* Quick Access Actions - Fixed grid for mobile */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    gap: '0.75rem',
                                    width: '100%'
                                }}>
                                    <div className="glass-panel action-card" onClick={() => setComingSoon('20 Bob Challenge')} style={{
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        border: '1px solid rgba(251, 191, 36, 0.1)',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{
                                            width: '35px',
                                            height: '35px',
                                            borderRadius: '8px',
                                            background: 'rgba(251, 191, 36, 0.1)',
                                            color: '#fbbf24',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <Trophy size={16} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800 }}>20 Bob Challenge</h3>
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>Small change, big impact</p>
                                    </div>
                                </div>

                                {/* Quick Check-in Section - Fixed for mobile */}
                                <div className="glass-panel check-in-box" style={{
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    borderLeft: '4px solid #25AAE1',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{
                                            padding: '0.5rem',
                                            background: 'rgba(37, 170, 225, 0.1)',
                                            color: '#25AAE1',
                                            borderRadius: '8px',
                                            flexShrink: 0
                                        }}>
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>ATTENDANCE CHECK-IN</h3>
                                            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>Scan QR or enter code</p>
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
                                    }} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                        <input
                                            name="code"
                                            placeholder="CODE"
                                            className="input-field"
                                            style={{
                                                flex: 1,
                                                height: '40px',
                                                textAlign: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '0.5rem',
                                                color: 'white',
                                                padding: '0 0.5rem'
                                            }}
                                            required
                                        />
                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                padding: '0 1rem',
                                                height: '40px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                background: '#25AAE1',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            GO
                                        </button>
                                    </form>
                                </div>

                                {/* Stats Overview Cards - Fixed for mobile */}
                                <div className="stats-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.75rem',
                                    width: '100%'
                                }}>
                                    <div className="glass-panel" style={{
                                        padding: '1rem',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.25rem' }}>STANDING</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#facc15' }}>{data.stats.totalAttended > 5 ? 'GOLD' : 'SILVER'}</div>
                                    </div>
                                    <div className="glass-panel" style={{
                                        padding: '1rem',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.25rem' }}>TOTAL SESSIONS</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#25AAE1' }}>{data.stats.totalAttended} / {data.stats.totalMeetings}</div>
                                    </div>
                                </div>
                            </>
                        ) : activeTab === 'activities' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                <div className="glass-panel" style={{
                                    padding: '1.5rem',
                                    border: '1px solid rgba(37, 170, 225, 0.2)',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 900 }}>Doulos Hours: Activity Log</h3>
                                    <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                                        History of your contributions to Freedom Base
                                    </p>

                                    {!data.activityLogs?.length ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '1.5rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '1rem',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}>
                                            <History size={24} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>No activities logged yet for this semester.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                                            {data.activityLogs.map((log, i) => (
                                                <div key={i} style={{
                                                    padding: '0.75rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '0.75rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{log.type}</div>
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ color: '#4ade80', fontWeight: 900, fontSize: '0.8rem' }}>+{log.pointsEarned} Pts</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'finance' ? (
                            <FinanceView regNo={data.studentRegNo} memberName={data.memberName} />
                        ) : (
                            /* History List - Refined for mobile */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                                {data.history.map((m, i) => (
                                    <div key={m._id} className="glass-panel" style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderLeft: `4px solid ${m.attended ? '#4ade80' : '#f87171'}`,
                                        animation: `slideUp 0.4s ease-out ${i * 0.05}s both`,
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                            <div style={{ textAlign: 'center', minWidth: '40px', flexShrink: 0 }}>
                                                <div style={{ fontSize: '1rem', fontWeight: 900 }}>{new Date(m.date).getDate()}</div>
                                                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                                                    {new Date(m.date).toLocaleString('default', { month: 'short' })}
                                                </div>
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</h4>
                                                <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.campus}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: m.attended ? '#4ade80' : '#f87171', flexShrink: 0 }}>
                                            {m.attended ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                            <span style={{ fontSize: '0.6rem', fontWeight: 900 }}>{m.attended ? '✓' : '✗'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Chat Widget - Fixed for mobile */}
            <div className="chat-popup-container" style={{
                position: 'fixed',
                bottom: '1rem',
                right: '1rem',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.75rem',
                maxWidth: 'calc(100vw - 2rem)'
            }}>
                {isChatOpen && (
                    <div className="glass-panel chat-full-widget" style={{
                        width: 'min(350px, calc(100vw - 2rem))',
                        height: '450px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        background: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '1rem'
                    }}>
                        {/* Chat Header */}
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(37, 170, 225, 0.1)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <DoulosBotIcon size={24} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Doulos Bot</span>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-dim)',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}>
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div style={{
                            flex: 1,
                            padding: '0.75rem',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            {chatMessages.map((msg, i) => (
                                <div key={i} style={{
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '1rem',
                                    background: msg.sender === 'user' ? 'hsl(var(--color-primary))' : 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    borderBottomRightRadius: msg.sender === 'user' ? '2px' : '1rem',
                                    borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '1rem',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.text}
                                </div>
                            ))}
                            {isTyping && (
                                <div style={{
                                    alignSelf: 'flex-start',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--color-text-dim)',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    gap: '0.2rem'
                                }}>
                                    <span style={{ animation: 'bounce 1s infinite 0s' }}>•</span>
                                    <span style={{ animation: 'bounce 1s infinite 0.2s' }}>•</span>
                                    <span style={{ animation: 'bounce 1s infinite 0.4s' }}>•</span>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendChat} style={{
                            padding: '0.75rem',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            gap: '0.5rem'
                        }}>
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    color: 'white',
                                    fontSize: '0.8rem'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    background: '#25AAE1',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                disabled={!chatInput.trim()}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                )}

                {/* Toggle Button Container with Popup */}
                <div style={{ position: 'relative' }}>
                    {!isChatOpen && showChatPopup && (
                        <div className="chat-popup" style={{
                            position: 'absolute',
                            bottom: '70px',
                            right: '0',
                            width: '180px',
                            padding: '0.75rem',
                            background: 'white',
                            color: 'black',
                            borderRadius: '0.75rem',
                            borderBottomRightRadius: '2px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                            👋 Hi {data.memberName?.split(' ')[0]}! Need help?
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
                        <button onClick={() => { setIsChatOpen(true); setShowChatPopup(false); }} style={{
                            width: '55px',
                            height: '55px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(37, 170, 225, 0.4)',
                            animation: 'bounce 2s infinite',
                            background: 'white',
                            border: '3px solid rgba(37, 170, 225, 0.2)',
                            cursor: 'pointer'
                        }}>
                            <DoulosBotIcon size={32} />
                        </button>
                    )}
                </div>



                <style>{`
                    @keyframes slideDown {
                        from { transform: translateY(-20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-5px); }
                    }
                    @keyframes rotateLogo {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .action-card:hover { 
                        transform: translateY(-2px); 
                        background: rgba(255,255,255,0.05);
                    }
                    @media (max-width: 480px) {
                        .welcome-content {
                            flex-direction: column;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default StudentPortal;