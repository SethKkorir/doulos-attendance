import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { Calendar, CheckCircle, XCircle, BookOpen, Music, Bell, Star, Trophy, Search, LogOut, GraduationCap, Sparkles, MessageCircle, Send, CreditCard, Wallet, History, FileText } from 'lucide-react';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import Logo from '../components/Logo';
import DoulosBotIcon from '../components/DoulosBotIcon';
import FinanceView from '../components/FinanceView';
import StudentEvents from '../components/StudentEvents';

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
    const [systemStatus, setSystemStatus] = useState({ recoveryMode: false });
    const [registrationRequired, setRegistrationRequired] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberCampus, setNewMemberCampus] = useState('Athi River');
    const [newMemberType, setNewMemberType] = useState('Douloid');
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
                const [waRes, guestRes, statusRes] = await Promise.all([
                    api.get('/settings/whatsapp_link'),
                    api.get('/settings/guest_features'),
                    api.get('/auth/system-status')
                ]);
                setWhatsappLink(waRes.data?.value || '');
                setGuestFeaturesEnabled(guestRes.data?.value !== 'false');
                setSystemStatus(statusRes.data || { recoveryMode: false });
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

            if (res.data.registrationRequired) {
                setRegistrationRequired(true);
                setLoading(false);
                return;
            }

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

    const handleSelfRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/members/self-register', {
                studentRegNo: regNo,
                name: newMemberName,
                campus: newMemberCampus,
                memberType: newMemberType
            });
            
            // After registration, log them in
            setRegistrationRequired(false);
            handleLogin();
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
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

                    {registrationRequired ? (
                        <div style={{ animation: 'fadeIn 0.5s ease' }}>
                            <div style={{ 
                                background: 'rgba(56, 189, 248, 0.1)', 
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                borderRadius: '1rem',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                textAlign: 'left'
                            }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Doulos Enrollment</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', opacity: 0.8 }}>No record found for `{regNo}`. Please register your details to continue.</div>
                            </div>

                            <form onSubmit={handleSelfRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                <div className="input-group">
                                    <label style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', fontWeight: 800, letterSpacing: '1.5px', textAlign: 'left', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        style={{ height: '45px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', fontSize: '0.9rem', color: 'white', width: '100%', padding: '0 1rem', boxSizing: 'border-box' }}
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', fontWeight: 800, letterSpacing: '1.5px', textAlign: 'left', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Campus</label>
                                        <select 
                                            style={{ height: '45px', background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', fontSize: '0.9rem', color: 'white', width: '100%', padding: '0 0.5rem', boxSizing: 'border-box' }}
                                            value={newMemberCampus}
                                            onChange={(e) => setNewMemberCampus(e.target.value)}
                                        >
                                            <option value="Athi River">Athi River</option>
                                            <option value="Valley Road">Valley Road</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', fontWeight: 800, letterSpacing: '1.5px', textAlign: 'left', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Category</label>
                                        <select 
                                            style={{ height: '45px', background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', fontSize: '0.9rem', color: 'white', width: '100%', padding: '0 0.5rem', boxSizing: 'border-box' }}
                                            value={newMemberType}
                                            onChange={(e) => setNewMemberType(e.target.value)}
                                        >
                                            <option value="Douloid">Douloid</option>
                                            <option value="Recruit">Recruit</option>
                                            <option value="Visitor">Visitor</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                    style={{ width: '100%', height: '50px', fontSize: '0.9rem', marginTop: '0.5rem', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase', borderRadius: '0.75rem', background: '#25AAE1', color: 'white', border: 'none', cursor: 'pointer' }}
                                >
                                    {loading ? 'ENROLLING...' : 'REGISTER & PROCEED'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegistrationRequired(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}
                                >
                                    ← BACK TO LOGIN
                                </button>
                            </form>
                        </div>
                    ) : (
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
                    )}

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
                        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: 900, marginBottom: '0.5rem' }}>
                            {comingSoon === 'Data Synchronization' ? 'History Syncing...' : comingSoon}
                        </h2>
                        <p style={{ color: 'var(--color-text-dim)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            {comingSoon === 'Data Synchronization' 
                                ? 'We are currently transferring your full attendance history from our main database. Everything will be visible here once the sync is complete!' 
                                : 'We are currently building this feature to make your Doulos experience even better. Stay tuned!'}
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 w-full box-sizing-border-box">
                {/* Modern Navigation Header */}
                <nav className="glass-panel" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '3rem',
                    padding: '1.25rem 2rem',
                    background: 'rgba(9, 29, 46, 0.6)',
                    borderColor: 'var(--glass-border-light)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-electric) 0%, #032540 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--neon-glow)',
                            animation: 'rotateLogo 60s linear infinite',
                            flexShrink: 0
                        }}>
                            <Logo size={25} showText={false} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '1.25rem',
                                fontWeight: 900,
                                letterSpacing: '-0.02em',
                                color: 'white',
                            }}>
                                DOULOS <span style={{ color: 'var(--primary-electric)' }}>PORTAL</span>
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginTop: '0.15rem',
                                flexWrap: 'wrap'
                            }}>
                                <span style={{
                                    padding: '0.1rem 0.6rem',
                                    borderRadius: '20px',
                                    border: `1px solid ${data.memberType === 'Douloid' ? 'rgba(245, 158, 11, 0.3)' : data.memberType === 'Recruit' ? 'rgba(29, 166, 217, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                                    color: data.memberType === 'Douloid' ? '#f59e0b' : data.memberType === 'Recruit' ? '#1da6d9' : '#94a3b8',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    fontSize: '0.65rem',
                                    fontWeight: 700
                                }}>{data.memberType?.toUpperCase()}</span>
                                <span style={{
                                    fontSize: '0.65rem',
                                    color: '#94a3b8',
                                    fontWeight: 600,
                                }}>ID: {data.studentRegNo}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn" style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                    >
                        <LogOut size={18} />
                    </button>
                </nav>

                {/* Main Dashboard Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full box-sizing-border-box">
                    
                    {/* Left Main Workspace (col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col gap-6 w-full">
                        {/* Welcome Heading Banner */}
                        <header className="mb-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight">
                                Welcome back, <span className="text-primary-electric" style={{ background: 'linear-gradient(135deg, #fff 0%, var(--primary-electric) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.memberName?.split(' ')[0] || 'Member'}</span>
                            </h1>
                            <p className="text-base sm:text-lg text-slate-400 font-medium opacity-80">Your academic command center.</p>
                        </header>

                        {/* Recovery Mode Warning Banner */}
                        {systemStatus.recoveryMode && (
                            <div className="glass-panel" style={{
                                padding: '1.25rem',
                                background: 'linear-gradient(90deg, rgba(30, 64, 175, 0.2) 0%, rgba(30, 58, 138, 0.2) 100%)',
                                borderColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}>
                                <div style={{ 
                                    background: 'rgba(59, 130, 246, 0.1)', 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Sparkles size={20} color="#fbbf24" className="animate-pulse" />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase' }}>History Sync in Progress</h4>
                                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, lineHeight: 1.4 }}>
                                        Recovery Mode is active. Your current check-ins are safe, and full records will be synced shortly.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Semester Attendance Health Card */}
                        <div className="glass-panel animate-slide-up" style={{
                            padding: '2.5rem',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '2rem',
                            background: 'rgba(9, 29, 46, 0.4)',
                            borderColor: 'var(--glass-border-light)',
                            borderRadius: '20px',
                            boxSizing: 'border-box',
                            width: '100%',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                <h3 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em', margin: 0 }}>Semester Attendance</h3>
                                <p className="text-slate-400 leading-relaxed mb-6" style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                                    {data.stats.percentage >= 75 
                                        ? "You are maintaining excellent academic standing for this semester. Keep up the high loyalty consistency!" 
                                        : "Your attendance is currently lower than recommended. Be sure to check in at all mandatory fellowship sessions."}
                                </p>
                                <div style={{ display: 'flex', gap: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-electric)', boxShadow: 'var(--neon-glow)' }}></div>
                                        <span className="text-white font-bold" style={{ fontSize: '0.9rem' }}>{data.stats.totalAttended} Present</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                                        <span className="text-slate-400 font-semibold" style={{ fontSize: '0.9rem' }}>{Math.max(0, data.stats.totalMeetings - data.stats.totalAttended)} Absent</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative flex items-center justify-center" style={{ width: '160px', height: '160px', flexShrink: 0, margin: '0 auto' }}>
                                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                    <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="10" />
                                    <circle cx="80" cy="80" r="65" fill="none" stroke="var(--primary-electric)" strokeWidth="10" 
                                        strokeDasharray="408.4" 
                                        strokeDashoffset={408.4 - (408.4 * data.stats.percentage / 100)} 
                                        strokeLinecap="round" 
                                        style={{ 
                                            filter: 'drop-shadow(0 0 8px rgba(29, 166, 217, 0.5))', 
                                            transition: 'stroke-dashoffset 2s ease-out' 
                                        }} 
                                    />
                                </svg>
                                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span className="text-4xl font-black text-white" style={{ letterSpacing: '-0.05em' }}>{data.stats.percentage}%</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary-electric">Health</span>
                                </div>
                            </div>
                        </div>

                        {/* Training Track Progress for Douloids */}
                        {data.memberType === 'Douloid' && (
                            <div className="glass-panel animate-slide-up" 
                                onClick={() => systemStatus.recoveryMode && setComingSoon('Data Synchronization')}
                                style={{
                                    padding: '1.5rem 2rem',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.01) 100%)',
                                    borderColor: 'rgba(245, 158, 11, 0.2)',
                                    borderRadius: '20px',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    cursor: systemStatus.recoveryMode ? 'pointer' : 'default'
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Trophy size={20} color="#f59e0b" />
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b' }}>Training Track</h4>
                                    </div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 1000, color: '#f59e0b' }}>
                                        {systemStatus.recoveryMode ? "0" : (data.stats.trainingAttended || 0)} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>SESSIONS</span>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: systemStatus.recoveryMode ? '0%' : `${Math.min((data.stats.trainingAttended || 0) * 10, 100)}%`,
                                        height: '100%',
                                        background: '#f59e0b',
                                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
                                        borderRadius: '10px',
                                        transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}></div>
                                </div>
                                <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                    {systemStatus.recoveryMode ? "History sync in progress..." : "Attend training sessions to achieve leadership accreditation."}
                                </p>
                            </div>
                        )}

                        {/* Action Widgets / Alerts Grid */}
                        {data.alerts && data.alerts.length > 0 && !systemStatus.recoveryMode && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
                                {data.alerts.map((alert, i) => {
                                    const isWatering = alert.type === 'watering' || alert.action === 'SCAN_QR';
                                    const isFinance = alert.type === 'finance' || alert.action === 'PAY';
                                    const accentColor = isWatering ? '#22c55e' : isFinance ? '#f59e0b' : '#ef4444';
                                    const bgGradient = isWatering 
                                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.01) 100%)' 
                                        : isFinance 
                                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.01) 100%)' 
                                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.01) 100%)';
                                    
                                    return (
                                        <div key={i} className="glass-panel animate-slide-up" style={{
                                            padding: '1.75rem',
                                            background: bgGradient,
                                            borderLeft: `4px solid ${accentColor}`,
                                            borderColor: 'var(--glass-border-light)',
                                            borderLeftColor: accentColor,
                                            animationDelay: `${100 + i * 100}ms`
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                                <h4 style={{ letterSpacing: '-0.01em', margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 800 }}>{alert.title}</h4>
                                                <span style={{ fontSize: '1.5rem' }}>{isWatering ? '🌿' : isFinance ? '💳' : '⚠️'}</span>
                                            </div>
                                            <p className="text-slate-400 mb-6 text-sm" style={{ minHeight: '40px', margin: '0.5rem 0 1.5rem', lineHeight: '1.4' }}>{alert.message}</p>
                                            <button 
                                                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                                                onClick={() => {
                                                    if (alert.action === 'ENROLL') handleEnroll();
                                                    if (alert.action === 'SCAN_QR') handleLogActivity('Tree Watering');
                                                    if (alert.action === 'PAY') setActiveTab('finance');
                                                }}
                                                style={{
                                                    background: isWatering ? 'rgba(34, 197, 94, 0.05)' : isFinance ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                                    border: `1px solid ${accentColor}40`,
                                                    color: accentColor,
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = isWatering ? 'rgba(34, 197, 94, 0.15)' : isFinance ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = isWatering ? 'rgba(34, 197, 94, 0.05)' : isFinance ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                {alert.action === 'SCAN_QR' ? 'Watering QR Scanner' : alert.action === 'PAY' ? 'Pay Contribution' : alert.action}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Navigation Tabs Selector */}
                        <div className="glass-panel" style={{
                            display: 'flex',
                            gap: '0.25rem',
                            padding: '0.35rem',
                            background: 'rgba(9, 29, 46, 0.4)',
                            borderRadius: '16px',
                            width: '100%',
                            overflowX: 'auto',
                            boxSizing: 'border-box'
                        }}>
                            {['overview', 'events', 'history', 'activities', 'finance'].map(tab => (
                                <button key={tab}
                                    onClick={() => {
                                        if (systemStatus.recoveryMode && tab !== 'overview') {
                                            setComingSoon('Data Synchronization');
                                            return;
                                        }
                                        setActiveTab(tab);
                                    }}
                                    className="text-xs font-bold uppercase tracking-wider transition-all"
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: activeTab === tab ? 'linear-gradient(135deg, var(--primary-electric) 0%, #0a4d68 100%)' : 'transparent',
                                        color: activeTab === tab ? 'white' : '#94a3b8',
                                        boxShadow: activeTab === tab ? '0 4px 15px rgba(29, 166, 217, 0.2)' : 'none',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                        opacity: (systemStatus.recoveryMode && tab !== 'overview') ? 0.4 : 1
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Active Tab Panels */}
                        {activeTab === 'overview' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                                {/* Quick Access Actions & Check-in Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
                                    
                                    {/* 20 Bob Challenge */}
                                    <div className="glass-panel animate-slide-up" onClick={() => setComingSoon('20 Bob Challenge')} style={{
                                        padding: '1.75rem',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(251, 191, 36, 0.15)',
                                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.01) 100%)',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '10px',
                                            background: 'rgba(251, 191, 36, 0.1)',
                                            color: '#fbbf24',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1rem',
                                            boxShadow: '0 0 15px rgba(251, 191, 36, 0.1)'
                                        }}>
                                            <Trophy size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fbbf24' }}>20 Bob Challenge</h3>
                                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>Small change, massive community impact. Join cohort challenge!</p>
                                    </div>

                                    {/* Quick Check-in Box */}
                                    <div className="glass-panel check-in-box animate-slide-up" style={{
                                        padding: '1.75rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        borderLeft: '4px solid var(--primary-electric)',
                                        background: 'rgba(9, 29, 46, 0.4)',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{
                                                padding: '0.5rem',
                                                background: 'rgba(29, 166, 217, 0.1)',
                                                color: 'var(--primary-electric)',
                                                borderRadius: '8px',
                                                flexShrink: 0
                                            }}>
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'white' }}>ATTENDANCE CHECK-IN</h3>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Scan physical banner QR or enter code</p>
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
                                                placeholder="ENTER CODE"
                                                className="input-field"
                                                style={{
                                                    flex: 1,
                                                    height: '42px',
                                                    textAlign: 'center',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    background: 'rgba(0, 15, 31, 0.6)',
                                                    border: '1px solid var(--glass-border-light)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    padding: '0 1rem'
                                                }}
                                                required
                                            />
                                            <button
                                                className="btn btn-primary"
                                                style={{
                                                    padding: '0 1.25rem',
                                                    height: '42px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                    borderRadius: '8px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                GO
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Stats Overview Cards Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '1.5rem',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <div className="glass-panel animate-slide-up" style={{
                                        padding: '1.75rem',
                                        background: 'rgba(9, 29, 46, 0.4)',
                                        border: '1px solid var(--glass-border-light)',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>STANDING TIER</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#facc15', textShadow: '0 0 10px rgba(250, 204, 21, 0.2)', margin: 0 }}>{data.stats.totalAttended > 5 ? 'GOLD' : 'SILVER'}</div>
                                    </div>
                                    <div className="glass-panel animate-slide-up" style={{
                                        padding: '1.75rem',
                                        background: 'rgba(9, 29, 46, 0.4)',
                                        border: '1px solid var(--glass-border-light)',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>TOTAL LOYALTY</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-electric)', textShadow: 'var(--neon-glow)', margin: 0 }}>{data.stats.totalAttended} / {data.stats.totalMeetings}</div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'activities' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                <div className="glass-panel" style={{
                                    padding: '2rem',
                                    border: '1px solid var(--glass-border-light)',
                                    background: 'rgba(9, 29, 46, 0.4)',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>Doulos Hours & Activities</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '2rem' }}>
                                        Timeline record of logged physical service hours and environment watering points.
                                    </p>

                                    {!data.activityLogs?.length ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '3rem 2rem',
                                            background: 'rgba(255,255,255,0.01)',
                                            borderRadius: '1rem',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            border: '1px dashed rgba(255,255,255,0.05)'
                                        }}>
                                            <History size={32} style={{ opacity: 0.2, marginBottom: '1rem', color: 'var(--primary-electric)' }} />
                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>No service hours logged yet for this semester.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                                            {data.activityLogs.map((log, i) => (
                                                <div key={i} className="glass-panel" style={{
                                                    padding: '1.25rem',
                                                    background: 'rgba(255, 255, 255, 0.01)',
                                                    border: '1px solid rgba(255,255,255,0.02)',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>{log.type}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ color: '#4ade80', fontWeight: 900, fontSize: '0.95rem' }}>+{log.pointsEarned} Pts</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'events' ? (
                            <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(9, 29, 46, 0.4)', border: '1px solid var(--glass-border-light)' }}>
                                <StudentEvents />
                            </div>
                        ) : activeTab === 'finance' ? (
                            <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(9, 29, 46, 0.4)', border: '1px solid var(--glass-border-light)' }}>
                                <FinanceView regNo={data.studentRegNo} memberName={data.memberName} />
                            </div>
                        ) : (
                            /* History List Tab */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                                {data.history.map((m, i) => (
                                    <div key={m._id} className="glass-panel" style={{
                                        padding: '1.25rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(9, 29, 46, 0.4)',
                                        borderLeft: `4px solid ${m.attended ? 'var(--primary-electric)' : '#ef4444'}`,
                                        borderColor: 'var(--glass-border-light)',
                                        borderLeftColor: m.attended ? 'var(--primary-electric)' : '#ef4444',
                                        animation: `slideUp 0.4s ease-out ${i * 0.05}s both`,
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                            <div style={{ textAlign: 'center', minWidth: '40px', flexShrink: 0 }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{new Date(m.date).getDate()}</div>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                                    {new Date(m.date).toLocaleString('default', { month: 'short' })}
                                                </div>
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                                                    {m.name}
                                                    {m.isTraining && (
                                                        <span style={{ fontSize: '0.5rem', padding: '0.15rem 0.4rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '4px', fontWeight: 900 }}>TRAINING</span>
                                                    )}
                                                </h4>
                                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.campus}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: m.attended ? 'var(--primary-electric)' : '#ef4444', flexShrink: 0 }}>
                                            {m.attended ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>{m.attended ? 'PRESENT' : 'ABSENT'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column Timeline (col-span-4) */}
                    <div className="lg:col-span-4 w-full">
                        <div className="glass-panel animate-slide-up" style={{ 
                            padding: '2rem', 
                            minHeight: '550px', 
                            background: 'rgba(9, 29, 46, 0.4)', 
                            borderColor: 'var(--glass-border-light)',
                            boxSizing: 'border-box',
                            width: '100%'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h3 className="text-xl font-bold text-white" style={{ margin: 0, letterSpacing: '-0.02em' }}>Fellowship Log</h3>
                                <span style={{ fontSize: '0.7rem', color: 'var(--primary-electric)', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Recent</span>
                            </div>
                            
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem'
                            }}>
                                {/* Timeline vertical line */}
                                <div style={{
                                    position: 'absolute',
                                    left: '11px',
                                    top: '8px',
                                    bottom: '8px',
                                    width: '2px',
                                    background: 'rgba(29, 166, 217, 0.1)'
                                }}></div>

                                {data.history && data.history.slice(0, 4).map((m, i) => (
                                    <div key={m._id} style={{ position: 'relative', paddingLeft: '2.25rem', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: '2px',
                                            top: '4px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: '#021525',
                                            border: `2px solid ${m.attended ? 'var(--primary-electric)' : '#ef4444'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 2,
                                            boxShadow: m.attended ? 'var(--neon-glow)' : 'none'
                                        }}>
                                            <div style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: m.attended ? 'var(--primary-electric)' : '#ef4444'
                                            }}></div>
                                        </div>
                                        
                                        <div className="glass-panel" style={{
                                            padding: '1rem',
                                            background: 'rgba(255, 255, 255, 0.01)',
                                            border: '1px solid rgba(255,255,255,0.02)',
                                            borderRadius: '12px',
                                            transition: 'all 0.2s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                                <h5 className="font-bold text-white text-sm" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{m.name}</h5>
                                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{m.isTraining ? 'TRAINING' : 'REGULAR'}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{new Date(m.date).toLocaleDateString()} • {m.campus}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', color: m.attended ? 'var(--primary-electric)' : '#ef4444' }}>{m.attended ? 'PRESENT' : 'ABSENT'}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary-electric)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setActiveTab('history')}>View All →</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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