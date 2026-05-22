import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import {
    Calendar, CheckCircle, XCircle, BookOpen, Music, Bell, Star, Trophy, Search,
    LogOut, GraduationCap, Sparkles, MessageCircle, Send, CreditCard, Wallet,
    History, FileText, LayoutDashboard, Activity, Clock, ChevronRight, Users
} from 'lucide-react';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import Logo from '../components/Logo';
import DoulosBotIcon from '../components/DoulosBotIcon';
import FinanceView from '../components/FinanceView';
import StudentEvents from '../components/StudentEvents';

/* ─── Helpers ─── */
const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
};

const TABS = [
    { id: 'overview',    label: 'Overview',    icon: LayoutDashboard },
    { id: 'history',     label: 'History',     icon: History },
    { id: 'activities',  label: 'Activities',  icon: Activity },
    { id: 'events',      label: 'Events',      icon: Calendar },
    { id: 'finance',     label: 'Finance',     icon: Wallet },
];

const memberTypeColor = (type) => {
    if (type === 'Douloid')  return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
    if (type === 'Recruit')  return { color: '#25AAE1', bg: 'rgba(37,170,225,0.15)', border: 'rgba(37,170,225,0.3)' };
    if (type === 'Visitor')  return { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)' };
    return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
};

/* ─── CSS ─── */
const CSS = `
    *, *::before, *::after { box-sizing: border-box; }
    :root {
        --sidebar-w: 260px;
        --right-w: 300px;
        --cyan: #25AAE1;
        --navy: #021525;
        --panel: rgba(9,29,46,0.7);
        --border: rgba(29,166,217,0.12);
        --border-light: rgba(255,255,255,0.06);
        --text-dim: rgba(255,255,255,0.45);
    }
    .sp-root { display: flex; min-height: 100vh; background: var(--navy); color: white; font-family: 'Inter', system-ui, sans-serif; }
    /* SIDEBAR */
    .sp-sidebar {
        width: var(--sidebar-w); min-width: var(--sidebar-w); height: 100vh; position: sticky; top: 0;
        background: #091d2e;
        border-right: 1px solid var(--border);
        display: flex; flex-direction: column; padding: 1.5rem 1rem;
        z-index: 50; overflow-y: auto;
    }
    .sp-sidebar-logo { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.5rem 2rem; }
    .sp-sidebar-logo-ring {
        width: 40px; height: 40px; border-radius: 50%;
        background: linear-gradient(135deg, #25AAE1 0%, #021525 100%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 20px rgba(37,170,225,0.3);
        animation: rotateLogo 60s linear infinite; flex-shrink: 0;
    }
    .sp-sidebar-logo-text { font-size: 0.95rem; font-weight: 900; letter-spacing: -0.02em; line-height: 1.1; }
    .sp-sidebar-logo-sub { font-size: 0.62rem; color: var(--text-dim); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
    .sp-nav-label { font-size: 0.58rem; font-weight: 900; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; padding: 0 0.5rem; margin-bottom: 0.5rem; }
    .sp-nav-link {
        display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.75rem;
        border-radius: 0.75rem; border: none; background: transparent; color: var(--text-dim);
        font-size: 0.88rem; font-weight: 700; cursor: pointer; width: 100%;
        transition: all 0.2s ease; margin-bottom: 0.15rem; text-align: left;
    }
    .sp-nav-link:hover { background: rgba(29,166,217,0.08); color: white; }
    .sp-nav-link.active { background: linear-gradient(135deg, rgba(37,170,225,0.2) 0%, rgba(37,170,217,0.05) 100%); color: var(--cyan); border: 1px solid rgba(37,170,225,0.2); }
    .sp-nav-link .sp-nav-icon { width: 34px; height: 34px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(255,255,255,0.04); transition: background 0.2s; }
    .sp-nav-link.active .sp-nav-icon { background: rgba(37,170,225,0.18); }
    .sp-sidebar-user {
        margin-top: auto; padding: 1rem; border-radius: 1rem;
        background: rgba(255,255,255,0.03); border: 1px solid var(--border-light);
    }
    /* MAIN */
    .sp-main { flex: 1; padding: 2rem 2rem 2rem; overflow-y: auto; min-width: 0; }
    /* RIGHT */
    .sp-right { width: var(--right-w); min-width: var(--right-w); padding: 2rem 1.5rem 2rem 0; display: flex; flex-direction: column; gap: 1.25rem; }
    /* CARD */
    .sp-card {
        background: var(--panel); backdrop-filter: blur(20px);
        border-radius: 1.25rem; border: 1px solid var(--border-light);
        padding: 1.5rem; transition: border-color 0.25s;
    }
    .sp-card:hover { border-color: rgba(29,166,217,0.2); }
    /* STAT PILL */
    .sp-stat-pill { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; padding: 1rem 1.5rem; border-radius: 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); flex: 1; }
    .sp-stat-num { font-size: 1.8rem; font-weight: 900; letter-spacing: -0.04em; }
    .sp-stat-label { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-dim); }
    /* MEETING CARD */
    .sp-meeting-card {
        background: rgba(9,29,46,0.6); border-radius: 1rem; padding: 1.25rem;
        border: 1px solid var(--border-light); transition: all 0.22s; cursor: default;
    }
    .sp-meeting-card:hover { border-color: rgba(29,166,217,0.25); transform: translateY(-2px); }
    /* TAB CONTENT */
    .sp-tab-content { animation: fadeUp 0.3s ease-out; }
    /* CHECKIN INPUT */
    .sp-checkin-input {
        flex: 1; height: 44px; background: rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.08); border-radius: 0.6rem;
        color: white; font-size: 0.85rem; font-weight: 900; text-transform: uppercase;
        letter-spacing: 1px; padding: 0 1rem; outline: none; transition: border-color 0.2s;
    }
    .sp-checkin-input:focus { border-color: var(--cyan); }
    .sp-checkin-btn {
        height: 44px; padding: 0 1.25rem; background: linear-gradient(135deg, #25AAE1 0%, #0a4d68 100%);
        border: 1px solid rgba(37,170,225,0.4); border-radius: 0.6rem;
        color: white; font-size: 0.82rem; font-weight: 800; cursor: pointer;
        letter-spacing: 0.5px; transition: all 0.2s; white-space: nowrap;
    }
    .sp-checkin-btn:hover { box-shadow: 0 0 20px rgba(37,170,225,0.35); transform: translateY(-1px); }
    /* PROFILE AVATAR */
    .sp-avatar {
        width: 72px; height: 72px; border-radius: 50%;
        background: linear-gradient(135deg, #25AAE1 0%, #091d2e 100%);
        border: 3px solid rgba(37,170,225,0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.75rem; font-weight: 900; color: white;
        box-shadow: 0 0 30px rgba(37,170,225,0.25); flex-shrink: 0;
    }
    /* TIMELINE */
    .sp-timeline { display: flex; flex-direction: column; gap: 1rem; position: relative; }
    .sp-timeline::before {
        content: ''; position: absolute; left: 9px; top: 8px; bottom: 8px;
        width: 2px; background: rgba(37,170,225,0.15);
    }
    .sp-timeline-item { display: flex; gap: 1rem; align-items: flex-start; position: relative; }
    .sp-timeline-dot {
        width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
        display: flex; align-items: center; justify-content: center;
        background: #021525; border: 2px solid; z-index: 2;
    }
    .sp-timeline-dot-inner { width: 6px; height: 6px; border-radius: 50%; }
    /* HISTORY ROWS */
    .sp-history-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 1rem 1.25rem; border-radius: 0.85rem;
        background: rgba(9,29,46,0.5); border: 1px solid var(--border-light);
        transition: all 0.2s;
    }
    .sp-history-row:hover { border-color: rgba(37,170,225,0.2); }
    /* ALERT CARD */
    .sp-alert-card { border-radius: 1rem; padding: 1.25rem 1.5rem; border: 1px solid; transition: all 0.2s; }
    /* PROGRESS BAR */
    .sp-progress { height: 5px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden; margin-top: 0.75rem; }
    .sp-progress-fill { height: 100%; border-radius: 10px; transition: width 1.5s cubic-bezier(0.16,1,0.3,1); }
    /* LOGIN */
    .sp-login-wrap { min-height: 100vh; display: flex; }
    .sp-login-left {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: linear-gradient(160deg, #091d2e 0%, #021525 100%);
        padding: 3rem; position: relative; overflow: hidden;
    }
    .sp-login-right {
        width: 420px; display: flex; align-items: center; justify-content: center;
        background: #0d1f2d; padding: 2.5rem;
    }
    .sp-login-card {
        width: 100%; max-width: 360px; transition: all 0.3s ease;
    }
    .sp-login-mobile-header {
        display: none;
    }
    /* MOBILE HEADER BAR */
    .sp-mobile-header {
        display: none;
    }
    /* RESPONSIVE CHECK-IN */
    .sp-checkin-form {
        display: flex; gap: 0.5rem; max-width: 500px; width: 100%;
    }
    /* MOBILE NAV */
    .sp-mobile-bottom-nav {
        display: none; position: fixed; bottom: 0; left: 0; right: 0;
        background: #091d2e; border-top: 1px solid var(--border);
        padding: 0.5rem 1rem 1rem; gap: 0.5rem; justify-content: space-around; z-index: 100;
    }
    .sp-mobile-tab-btn { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 0.55rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; padding: 0.4rem 0.6rem; border-radius: 0.5rem; transition: all 0.2s; }
    .sp-mobile-tab-btn.active { color: var(--cyan); }
    @keyframes rotateLogo { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @media (max-width: 1100px) {
        .sp-right { display: none; }
    }
    @media (max-width: 768px) {
        .sp-sidebar { display: none; }
        .sp-mobile-bottom-nav { display: flex; }
        .sp-main { padding: 1.25rem 1rem 5rem; }
        .sp-login-left { display: none; }
        .sp-login-right {
            width: 100%;
            background: transparent !important;
            padding: 1.5rem;
        }
        .sp-login-card {
            background: rgba(9, 29, 46, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1.25rem;
            padding: 2.25rem 1.75rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .sp-login-mobile-header {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .sp-mobile-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            background: rgba(9, 29, 46, 0.85);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            padding: 0.75rem 1rem;
            border-radius: 1rem;
            border: 1px solid var(--border-light);
            margin-bottom: 1.5rem;
            position: sticky;
            top: 0;
            z-index: 200;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }
    }
    @media (max-width: 480px) {
        .sp-stat-pill { padding: 0.75rem; }
        .sp-stat-num { font-size: 1.4rem; }
        .sp-checkin-form {
            flex-direction: column;
            gap: 0.5rem;
        }
        .sp-checkin-btn {
            width: 100%;
        }
    }
    .loading-spinner-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
    .rotating-logo { animation: rotateLogo 60s linear infinite; filter: drop-shadow(0 0 20px rgba(37,170,225,0.3)); }
`;

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const StudentPortal = () => {
    const location = useLocation();
    const isGuest = location.state?.isGuest || false;

    const SESSION_DURATION = 20 * 60 * 1000;

    const [regNo, setRegNo] = useState(() => {
        const stored = localStorage.getItem('studentSession');
        if (stored) {
            try {
                const { regNo, expiry } = JSON.parse(stored);
                if (Date.now() <= expiry) return regNo;
                localStorage.removeItem('studentSession');
            } catch (e) { localStorage.removeItem('studentSession'); }
        }
        const legacy = localStorage.getItem('studentRegNo');
        if (legacy) { localStorage.removeItem('studentRegNo'); return legacy; }
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
    const tabContentRef = useRef(null);

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
            } catch (err) { console.error('Failed to fetch settings'); }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        let timer;
        if (error) { timer = setTimeout(() => setError(null), 5000); }
        return () => clearTimeout(timer);
    }, [error]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (isGuest) {
            setData({
                studentRegNo: 'GUEST-001', memberName: 'Guest Explorer', memberType: 'Visitor',
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
        setLoading(true); setError(null);
        try {
            const res = await api.get(`/attendance/student/${regNo}`);
            if (res.data.registrationRequired) { setRegistrationRequired(true); setLoading(false); return; }
            setData(res.data);
            setIsLoggedIn(true);
            localStorage.setItem('studentSession', JSON.stringify({ regNo: regNo.toUpperCase(), expiry: Date.now() + SESSION_DURATION }));
        } catch (err) { setError(err.response?.data?.message || 'Something went wrong. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleSelfRegister = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        try {
            await api.post('/members/self-register', { studentRegNo: regNo, name: newMemberName, campus: newMemberCampus, memberType: newMemberType });
            setRegistrationRequired(false);
            handleLogin();
        } catch (err) { setError(err.response?.data?.message || 'Registration failed. Please try again.'); setLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('studentSession');
        setIsLoggedIn(false); setData(null); setRegNo('');
        navigate('/portal', { replace: true, state: {} });
    };

    const handleClearCongrats = async () => {
        try { await api.post(`/members/clear-congrats/${data.studentRegNo}`); } catch (err) { console.error('Failed to clear congrats status'); }
        setData({ ...data, needsGraduationCongrats: false });
    };

    const handleEnroll = async () => {
        setLoading(true);
        try {
            await api.post('/members/enroll', { studentRegNo: data.studentRegNo, semester: data.currentSemester });
            setData(prev => ({ ...prev, lastActiveSemester: data.currentSemester, alerts: prev.alerts.filter(a => a.type !== 'semester') }));
            alert(`Great! You are now active for ${data.currentSemester}.`);
        } catch (err) { alert('Enrollment failed. Please try again or see an admin.'); }
        finally { setLoading(false); }
    };

    const handleLogActivity = async (type) => {
        const code = prompt(`Please enter the ${type} verification code from the physical banner:`);
        if (!code) return;
        setLoading(true);
        try {
            await api.post('/activities/log', { studentRegNo: data.studentRegNo, type, notes: `Verification Code: ${code}` });
            handleLogin();
            alert(`${type} recorded successfully! 🌿`);
        } catch (err) { alert(err.response?.data?.message || 'Failed to log activity. Check the code and try again.'); }
        finally { setLoading(false); }
    };

    const handleSendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
        setChatInput('');
        setIsTyping(true);
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
        const name = data?.memberName ? data.memberName.split(' ')[0] : 'Member';
        setTimeout(() => {
            setIsTyping(false);
            setChatMessages(prev => [...prev, { sender: 'bot', text: `Good ${timeGreeting}, ${name}! 👋 I am the Doulos Bot. I'm currently being built to help you with all things Doulos. This feature is coming very soon!` }]);
        }, 1500);
    };

    useEffect(() => {
        if (isLoggedIn && !data) { handleLogin(); }
    }, [isLoggedIn, isGuest]);

    /* ── Login Screen ── */
    if (!isLoggedIn) {
        return (
            <div className="sp-login-wrap">
                <style>{CSS}</style>
                <BackgroundGallery />
                <ValentineRain />

                {/* Left branding panel */}
                <div className="sp-login-left">
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                        <div className="rotating-logo" style={{ display: 'inline-block', marginBottom: '2rem' }}>
                            <Logo size={90} showText={false} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
                            DOULOS <span style={{ color: '#25AAE1' }}>PORTAL</span>
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', maxWidth: '320px', lineHeight: 1.6 }}>
                            Your personal dashboard for attendance, activities, finance & more.
                        </p>
                        {/* Decorative stat pills */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {[['Attendance', 'Tracked'], ['Activities', 'Logged'], ['Finance', 'Managed']].map(([a, b]) => (
                                <div key={a} style={{ padding: '0.75rem 1.25rem', background: 'rgba(37,170,225,0.08)', border: '1px solid rgba(37,170,225,0.2)', borderRadius: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#25AAE1' }}>{a}</div>
                                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{b}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* bg glow blobs */}
                    <div style={{ position: 'absolute', top: '10%', left: '10%', width: '200px', height: '200px', background: 'rgba(37,170,225,0.06)', borderRadius: '50%', filter: 'blur(60px)' }} />
                    <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: '150px', height: '150px', background: 'rgba(37,170,225,0.04)', borderRadius: '50%', filter: 'blur(40px)' }} />
                </div>

                {/* Right login card */}
                <div className="sp-login-right">
                    <div className="sp-login-card">
                        {/* Mobile logo header (visible on mobile only) */}
                        <div className="sp-login-mobile-header">
                            <div className="rotating-logo" style={{ marginBottom: '1rem' }}>
                                <Logo size={64} showText={false} />
                            </div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', margin: 0 }}>
                                DOULOS <span style={{ color: '#25AAE1' }}>PORTAL</span>
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.4rem', maxWidth: '280px', lineHeight: 1.4 }}>
                                Track attendance, log activities, and manage finances.
                            </p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>MEMBER ACCESS</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                                {registrationRequired ? 'Register to Join' : 'Sign In'}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                                {registrationRequired ? 'Create your profile to access the portal' : 'Enter your admission number to continue'}
                            </p>
                        </div>

                        {registrationRequired ? (
                            <div style={{ animation: 'fadeUp 0.4s ease' }}>
                                <div style={{ background: 'rgba(37,170,225,0.08)', border: '1px solid rgba(37,170,225,0.2)', borderRadius: '0.75rem', padding: '0.85rem', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Doulos Enrollment</div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>No record found for <strong>{regNo}</strong>. Register your details to proceed.</div>
                                </div>
                                <form onSubmit={handleSelfRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[{ label: 'Full Name', el: <input type="text" placeholder="Enter your full name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} required style={{ width: '100%', height: '46px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.65rem', color: 'white', padding: '0 1rem', fontSize: '0.9rem', outline: 'none' }} /> }].map(f => (
                                        <div key={f.label}>
                                            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{f.label}</label>
                                            {f.el}
                                        </div>
                                    ))}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {[
                                            { label: 'Campus', val: newMemberCampus, set: setNewMemberCampus, opts: ['Athi River', 'Valley Road'] },
                                            { label: 'Category', val: newMemberType, set: setNewMemberType, opts: ['Douloid', 'Recruit', 'Visitor'] }
                                        ].map(f => (
                                            <div key={f.label}>
                                                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{f.label}</label>
                                                <select value={f.val} onChange={e => f.set(e.target.value)} style={{ width: '100%', height: '46px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.65rem', color: 'white', padding: '0 0.75rem', fontSize: '0.88rem', outline: 'none' }}>
                                                    {f.opts.map(o => <option key={o}>{o}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="submit" disabled={loading} style={{ width: '100%', height: '50px', background: 'linear-gradient(135deg, #25AAE1 0%, #0a4d68 100%)', color: 'white', border: '1px solid rgba(37,170,225,0.4)', borderRadius: '0.75rem', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 20px rgba(37,170,225,0.25)', marginTop: '0.5rem' }}>
                                        {loading ? <><span className="loading-spinner-small" style={{ marginRight: '0.5rem' }} />ENROLLING...</> : 'REGISTER & PROCEED'}
                                    </button>
                                    <button type="button" onClick={() => setRegistrationRequired(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>← Back to Sign In</button>
                                </form>
                            </div>
                        ) : (
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Admission Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            placeholder="21-1234"
                                            style={{ width: '100%', height: '50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', color: 'white', padding: '0 3rem 0 1rem', fontSize: '1rem', fontWeight: 700, outline: 'none', letterSpacing: '1px' }}
                                            value={regNo}
                                            onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 2) v = v.slice(0, 2) + '-' + v.slice(2, 6); setRegNo(v); }}
                                            required
                                        />
                                        <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} style={{ width: '100%', height: '52px', background: 'linear-gradient(135deg, #25AAE1 0%, #0a4d68 100%)', color: 'white', border: '1px solid rgba(37,170,225,0.4)', borderRadius: '0.75rem', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 25px rgba(37,170,225,0.25)' }}>
                                    {loading ? <><span className="loading-spinner-small" style={{ marginRight: '0.5rem' }} />VERIFYING...</> : 'LOG IN →'}
                                </button>
                            </form>
                        )}

                        {error && (
                            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: '0.65rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '0.82rem', fontWeight: 600 }}>
                                ⚠️ {error}
                            </div>
                        )}
                        {guestFeaturesEnabled && (
                            <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
                                <button onClick={() => navigate('/guest')} style={{ background: 'none', border: 'none', color: '#25AAE1', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: 0.8 }}>
                                    Continue as Guest →
                                </button>
                            </div>
                        )}
                        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Doulos Attendance System • Secure Portal
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Loading ── */
    if (!data) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', background: '#021525' }}>
                <style>{CSS}</style>
                <div className="loading-spinner-small" style={{ width: '48px', height: '48px', borderTopColor: '#25AAE1', borderWidth: '3px' }} />
                <p style={{ color: '#25AAE1', fontWeight: 700, letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Loading Doulos Portal...</p>
            </div>
        );
    }

    /* ── Graduation Congrats ── */
    if (isLoggedIn && data?.needsGraduationCongrats) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#021525', padding: '1.5rem' }}>
                <style>{CSS}</style>
                <BackgroundGallery /><ValentineRain />
                <div style={{ maxWidth: '560px', width: '100%', background: 'rgba(9,29,46,0.95)', backdropFilter: 'blur(20px)', border: '2px solid rgba(37,170,225,0.4)', borderRadius: '1.5rem', padding: '2.5rem', textAlign: 'center', boxShadow: '0 0 60px rgba(37,170,225,0.2)', animation: 'slideUp 0.8s' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Sparkles size={32} color="#FFD700" style={{ animation: 'bounce 2s infinite' }} />
                        <GraduationCap size={44} color="#25AAE1" />
                        <Sparkles size={32} color="#FFD700" style={{ animation: 'bounce 2s infinite 1s' }} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                        OFFICIALLY A <span style={{ color: '#25AAE1' }}>DOULOID!</span>
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: '#4ade80', fontWeight: 700, marginBottom: '1.5rem' }}>Congratulations on completing your recruitment!</p>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.25rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: '0.92rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Your journey of growth and impact continues. You now have full access to all Douloid features and resources within this portal.</p>
                    </div>
                    <button onClick={handleClearCongrats} style={{ width: '100%', padding: '1.1rem', background: 'linear-gradient(135deg, #25AAE1 0%, #0a4d68 100%)', color: 'white', border: '1px solid rgba(37,170,225,0.4)', borderRadius: '1rem', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(37,170,225,0.3)' }}>
                        PROCEED TO MY PORTAL 🚀
                    </button>
                </div>
            </div>
        );
    }

    /* ─── Main Dashboard ─── */
    const tc = memberTypeColor(data.memberType);
    const firstName = data.memberName?.split(' ')[0] || 'Member';
    const absent = Math.max(0, data.stats.totalMeetings - data.stats.totalAttended);
    const pct = data.stats.percentage || 0;

    /* Tab nav handler */
    const goTab = (id) => {
        if (systemStatus.recoveryMode && id !== 'overview') { setComingSoon('Data Synchronization'); return; }
        setActiveTab(id);
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#021525', color: 'white', position: 'relative' }}>
            <style>{CSS}</style>
            <BackgroundGallery />
            <ValentineRain />

            {/* Coming Soon Modal */}
            {comingSoon && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }} onClick={() => setComingSoon(null)}>
                    <div style={{ background: '#0d1f2d', border: '1px solid rgba(37,170,225,0.3)', borderRadius: '1.25rem', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center', animation: 'slideUp 0.4s' }} onClick={e => e.stopPropagation()}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37,170,225,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#25AAE1' }}><Sparkles size={30} /></div>
                        <h2 style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: '0.5rem' }}>{comingSoon === 'Data Synchronization' ? 'History Syncing...' : comingSoon}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{comingSoon === 'Data Synchronization' ? 'We are currently transferring your full attendance history from our main database. Everything will be visible here once the sync is complete!' : 'We are currently building this feature to make your Doulos experience even better. Stay tuned!'}</p>
                        <button onClick={() => setComingSoon(null)} style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #25AAE1 0%, #0a4d68 100%)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>GOT IT 🚀</button>
                    </div>
                </div>
            )}

            <div className="sp-root" style={{ position: 'relative', zIndex: 10 }}>

                {/* ══ LEFT SIDEBAR ══ */}
                <aside className="sp-sidebar">
                    <div className="sp-sidebar-logo">
                        <div className="sp-sidebar-logo-ring"><Logo size={22} showText={false} /></div>
                        <div>
                            <div className="sp-sidebar-logo-text">DOULOS</div>
                            <div className="sp-sidebar-logo-sub">Member Portal</div>
                        </div>
                    </div>

                    <div className="sp-nav-label" style={{ marginTop: '0.5rem' }}>Navigation</div>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        {TABS.map(t => (
                            <button key={t.id} className={`sp-nav-link ${activeTab === t.id ? 'active' : ''}`} onClick={() => goTab(t.id)}
                                style={{ opacity: systemStatus.recoveryMode && t.id !== 'overview' ? 0.4 : 1 }}>
                                <div className="sp-nav-icon"><t.icon size={17} /></div>
                                {t.label}
                                {activeTab === t.id && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                            </button>
                        ))}
                        <button className="sp-nav-link" onClick={handleLogout} style={{ color: '#f87171', marginTop: '1rem' }}>
                            <div className="sp-nav-icon" style={{ background: 'rgba(248,113,113,0.08)' }}><LogOut size={17} /></div>
                            Sign Out
                        </button>
                    </nav>

                    {/* Bottom user card */}
                    <div className="sp-sidebar-user" style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #25AAE1, #091d2e)', border: '2px solid rgba(37,170,225,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 }}>
                                {firstName.charAt(0)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.memberName}</div>
                                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{data.studentRegNo}</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} style={{ width: '100%', padding: '0.55rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '0.6rem', color: '#f87171', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                            <LogOut size={13} /> SIGN OUT
                        </button>
                    </div>
                </aside>

                {/* ══ MAIN CONTENT ══ */}
                <main className="sp-main">
                    {/* Mobile-only header bar with avatar and logout */}
                    <div className="sp-mobile-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #25AAE1, #091d2e)', border: '2px solid rgba(37,170,225,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>
                                {firstName.charAt(0)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.memberName}</div>
                                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{data.studentRegNo}</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '0.5rem', color: '#f87171', padding: '0.4rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.5px', flexShrink: 0 }}>
                            <LogOut size={12} /> SIGN OUT
                        </button>
                    </div>

                    {/* Greeting + check-in */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{getTimeGreeting()} ✦</div>
                        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', margin: '0 0 0.25rem' }}>
                            Hi, <span style={{ background: 'linear-gradient(135deg, #25AAE1 0%, #7dd3fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{firstName}!</span>
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                            {data.campus} · <span style={{ color: tc.color, fontWeight: 800 }}>{data.memberType}</span>
                        </p>

                        {/* Quick check-in bar */}
                        <form onSubmit={e => { e.preventDefault(); if (isGuest) { alert('Guest users cannot perform check-ins.'); return; } const code = e.target.elements.code.value.trim(); if (code) window.location.href = `/check-in/${code}`; }} className="sp-checkin-form">
                            <div style={{ position: 'relative', flex: 1, minWidth: 0, width: '100%' }}>
                                <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                <input name="code" placeholder="ENTER MEETING CODE..." className="sp-checkin-input" style={{ paddingLeft: '2.5rem' }} required />
                            </div>
                            <button type="submit" className="sp-checkin-btn">CHECK IN</button>
                        </form>
                    </div>

                    {/* Recovery mode banner */}
                    {systemStatus.recoveryMode && (
                        <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(90deg, rgba(30,64,175,0.15) 0%, rgba(30,58,138,0.15) 100%)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                            <Sparkles size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>History Sync in Progress</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>Recovery Mode is active. Your current check-ins are safe, and full records will be synced shortly.</div>
                            </div>
                        </div>
                    )}

                    {/* ── 3 STAT PILLS ── */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="sp-stat-pill">
                            <div className="sp-stat-num" style={{ color: '#25AAE1' }}>{data.stats.totalAttended}</div>
                            <div className="sp-stat-label">Attended</div>
                        </div>
                        <div className="sp-stat-pill">
                            <div className="sp-stat-num" style={{ color: '#f87171' }}>{absent}</div>
                            <div className="sp-stat-label">Missed</div>
                        </div>
                        <div className="sp-stat-pill">
                            <div className="sp-stat-num" style={{ color: pct >= 75 ? '#4ade80' : '#facc15' }}>{pct}%</div>
                            <div className="sp-stat-label">Health</div>
                        </div>
                    </div>

                    {/* ── ATTENDANCE HEALTH CARD ── */}
                    <div className="sp-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(37,170,225,0.07) 0%, rgba(2,21,37,0.85) 100%)', borderColor: 'rgba(37,170,225,0.18)' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Semester Attendance</div>
                            <h3 style={{ fontWeight: 900, fontSize: '1.15rem', color: 'white', margin: '0 0 0.5rem' }}>
                                {pct >= 75 ? 'Great Standing!' : 'Needs Improvement'}
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 1rem' }}>
                                {pct >= 75 ? 'You are maintaining excellent consistency. Keep showing up!' : 'Your attendance is below recommended. Aim for 75%+ to maintain standing.'}
                            </p>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#25AAE1', boxShadow: '0 0 6px rgba(37,170,225,0.5)' }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{data.stats.totalAttended} Present</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171' }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{absent} Absent</span>
                                </div>
                            </div>
                        </div>
                        {/* SVG Ring */}
                        <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0, margin: '0 auto' }}>
                            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="9" />
                                <circle cx="65" cy="65" r="52" fill="none" stroke={pct >= 75 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171'} strokeWidth="9"
                                    strokeDasharray="326.7"
                                    strokeDashoffset={326.7 - (326.7 * pct / 100)}
                                    strokeLinecap="round"
                                    style={{ filter: `drop-shadow(0 0 8px ${pct >= 75 ? 'rgba(74,222,128,0.5)' : 'rgba(37,170,225,0.5)'})`, transition: 'stroke-dashoffset 2s ease-out' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{pct}%</span>
                                <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#25AAE1' }}>health</span>
                            </div>
                        </div>
                    </div>

                    {/* ── TRAINING TRACK (Douloids) ── */}
                    {data.memberType === 'Douloid' && (
                        <div className="sp-card" onClick={() => systemStatus.recoveryMode && setComingSoon('Data Synchronization')} style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(2,21,37,0.85) 100%)', borderColor: 'rgba(245,158,11,0.18)', cursor: systemStatus.recoveryMode ? 'pointer' : 'default' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Trophy size={18} color="#f59e0b" />
                                    <span style={{ fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b' }}>Training Track</span>
                                </div>
                                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b' }}>
                                    {systemStatus.recoveryMode ? 0 : (data.stats.trainingAttended || 0)} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>sessions</span>
                                </span>
                            </div>
                            <div className="sp-progress">
                                <div className="sp-progress-fill" style={{ width: systemStatus.recoveryMode ? '0%' : `${Math.min((data.stats.trainingAttended || 0) * 10, 100)}%`, background: '#f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.4)' }} />
                            </div>
                            <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                {systemStatus.recoveryMode ? 'History sync in progress...' : 'Attend training sessions to achieve leadership accreditation.'}
                            </p>
                        </div>
                    )}

                    {/* ── ALERT ACTION CARDS ── */}
                    {data.alerts && data.alerts.length > 0 && !systemStatus.recoveryMode && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {data.alerts.map((alert, i) => {
                                const isWatering = alert.type === 'watering' || alert.action === 'SCAN_QR';
                                const isFinance = alert.type === 'finance' || alert.action === 'PAY';
                                const ac = isWatering ? '#22c55e' : isFinance ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={i} className="sp-alert-card" style={{ background: `linear-gradient(135deg, ${isWatering ? 'rgba(34,197,94,0.07)' : isFinance ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.07)'} 0%, rgba(2,21,37,0.85) 100%)`, borderColor: `${ac}30`, borderLeft: `3px solid ${ac}`, animation: `fadeUp 0.4s ease ${i * 80}ms both` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'white' }}>{alert.title}</h4>
                                            <span style={{ fontSize: '1.25rem' }}>{isWatering ? '🌿' : isFinance ? '💳' : '⚠️'}</span>
                                        </div>
                                        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{alert.message}</p>
                                        <button onClick={() => { if (alert.action === 'ENROLL') handleEnroll(); if (alert.action === 'SCAN_QR') handleLogActivity('Tree Watering'); if (alert.action === 'PAY') setActiveTab('finance'); }}
                                            style={{ width: '100%', padding: '0.6rem', background: `${ac}12`, border: `1px solid ${ac}40`, color: ac, borderRadius: '0.6rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = `${ac}22`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = `${ac}12`; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                            {alert.action === 'SCAN_QR' ? 'Log Tree Watering' : alert.action === 'PAY' ? 'Pay Contribution' : alert.action}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── TAB NAVIGATION PILLS ── */}
                    <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(9,29,46,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.85rem', padding: '0.3rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => goTab(t.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', flex: 1, justifyContent: 'center', letterSpacing: '0.3px', transition: 'all 0.2s', opacity: systemStatus.recoveryMode && t.id !== 'overview' ? 0.4 : 1, background: activeTab === t.id ? 'linear-gradient(135deg, rgba(37,170,225,0.22) 0%, rgba(37,170,225,0.06) 100%)' : 'transparent', color: activeTab === t.id ? '#25AAE1' : 'rgba(255,255,255,0.4)' }}>
                                <t.icon size={14} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ══ TAB CONTENT ══ */}
                    <div className="sp-tab-content" ref={tabContentRef}>

                        {/* OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Quick stat cards row */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                    <div className="sp-card" style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(2,21,37,0.8) 100%)', borderColor: 'rgba(250,204,21,0.18)' }}>
                                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Standing Tier</div>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#facc15', letterSpacing: '-0.03em' }}>{data.stats.totalAttended > 5 ? '🥇 GOLD' : '🥈 SILVER'}</div>
                                    </div>
                                    <div className="sp-card" style={{ background: 'linear-gradient(135deg, rgba(37,170,225,0.08) 0%, rgba(2,21,37,0.8) 100%)', borderColor: 'rgba(37,170,225,0.18)' }}>
                                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total Loyalty</div>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '-0.03em' }}>{data.stats.totalAttended}<span style={{ fontSize: '0.9rem', opacity: 0.5 }}> / {data.stats.totalMeetings}</span></div>
                                    </div>
                                </div>

                                {/* 20 Bob Challenge card */}
                                <div className="sp-card" onClick={() => setComingSoon('20 Bob Challenge')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(2,21,37,0.85) 100%)', borderColor: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '0.85rem', background: 'rgba(251,191,36,0.12)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Trophy size={22} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 900, fontSize: '1rem', color: '#fbbf24' }}>20 Bob Challenge</div>
                                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem' }}>Small change, massive community impact. Join cohort challenge!</div>
                                    </div>
                                    <ChevronRight size={18} color="rgba(255,255,255,0.25)" />
                                </div>

                                {/* Recent meetings mini-grid */}
                                {data.history && data.history.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase' }}>Recent Meetings</div>
                                            <button onClick={() => goTab('history')} style={{ background: 'none', border: 'none', color: '#25AAE1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>View All →</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                                            {data.history.slice(0, 4).map((m, i) => {
                                                const d = new Date(m.date);
                                                return (
                                                    <div key={m._id} className="sp-meeting-card">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                                                            <div style={{ background: m.attended ? 'rgba(37,170,225,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${m.attended ? 'rgba(37,170,225,0.25)' : 'rgba(248,113,113,0.25)'}`, borderRadius: '0.6rem', padding: '0.35rem 0.6rem', textAlign: 'center', minWidth: '42px' }}>
                                                                <div style={{ fontSize: '0.5rem', fontWeight: 900, color: m.attended ? '#25AAE1' : '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.toLocaleString('en', { month: 'short' })}</div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{d.getDate()}</div>
                                                            </div>
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 900, padding: '0.25rem 0.55rem', borderRadius: '2rem', background: m.attended ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: m.attended ? '#4ade80' : '#f87171', border: `1px solid ${m.attended ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                {m.attended ? 'PRESENT' : 'ABSENT'}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{m.campus}</div>
                                                        {m.isTraining && <div style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.15rem 0.5rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900 }}>TRAINING</div>}
                                                        <div className="sp-progress">
                                                            <div className="sp-progress-fill" style={{ width: m.attended ? '100%' : '0%', background: m.attended ? '#25AAE1' : '#f87171' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* HISTORY */}
                        {activeTab === 'history' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{data.history.length} records</div>
                                {data.history.map((m, i) => (
                                    <div key={m._id} className="sp-history-row" style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both`, borderLeft: `3px solid ${m.attended ? '#25AAE1' : '#f87171'}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                            <div style={{ textAlign: 'center', minWidth: '38px', flexShrink: 0 }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>{new Date(m.date).getDate()}</div>
                                                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{new Date(m.date).toLocaleString('default', { month: 'short' })}</div>
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {m.name}
                                                    {m.isTraining && <span style={{ fontSize: '0.5rem', padding: '0.15rem 0.4rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px', fontWeight: 900 }}>TRAINING</span>}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: '0.1rem' }}>{m.campus}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: m.attended ? '#25AAE1' : '#f87171', flexShrink: 0 }}>
                                            {m.attended ? <CheckCircle size={17} /> : <XCircle size={17} />}
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.5px' }}>{m.attended ? 'PRESENT' : 'ABSENT'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ACTIVITIES */}
                        {activeTab === 'activities' && (
                            <div className="sp-card" style={{ padding: '1.75rem' }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Service Log</div>
                                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 900 }}>Doulos Hours & Activities</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>Timeline record of logged physical service hours and environment watering points.</p>
                                {!data.activityLogs?.length ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.06)' }}>
                                        <Activity size={32} style={{ opacity: 0.2, marginBottom: '0.85rem', color: '#25AAE1' }} />
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>No service hours logged yet for this semester.</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                        {data.activityLogs.map((log, i) => (
                                            <div key={i} className="sp-history-row">
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{log.type}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                                </div>
                                                <div style={{ color: '#4ade80', fontWeight: 900, fontSize: '0.9rem' }}>+{log.pointsEarned} Pts</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* EVENTS */}
                        {activeTab === 'events' && (
                            <div className="sp-card" style={{ padding: '1.75rem' }}>
                                <StudentEvents />
                            </div>
                        )}

                        {/* FINANCE */}
                        {activeTab === 'finance' && (
                            <div className="sp-card" style={{ padding: '1.75rem' }}>
                                <FinanceView regNo={data.studentRegNo} memberName={data.memberName} />
                            </div>
                        )}
                    </div>
                </main>

                {/* ══ RIGHT SIDEBAR ══ */}
                <aside className="sp-right">

                    {/* Profile Card */}
                    <div className="sp-card" style={{ textAlign: 'center', background: 'linear-gradient(160deg, rgba(37,170,225,0.12) 0%, rgba(2,21,37,0.95) 100%)', borderColor: 'rgba(37,170,225,0.2)', paddingBottom: '1.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', paddingTop: '0.5rem' }}>
                            <div className="sp-avatar">{firstName.charAt(0)}</div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: '0.2rem' }}>{data.memberName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginBottom: '0.75rem' }}>{data.campus} · {data.studentRegNo}</div>
                        <span style={{ padding: '0.3rem 0.85rem', borderRadius: '2rem', fontSize: '0.68rem', fontWeight: 900, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {data.memberType}
                        </span>

                        {/* 3 stat counters */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                            {[
                                { val: data.stats.totalAttended, label: 'Attended', color: '#25AAE1' },
                                { val: absent, label: 'Missed', color: '#f87171' },
                                { val: `${pct}%`, label: 'Health', color: pct >= 75 ? '#4ade80' : '#facc15' }
                            ].map((s, i) => (
                                <div key={s.label} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                                    <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.1rem' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fellowship Log timeline */}
                    <div className="sp-card" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>Fellowship Log</div>
                            <button onClick={() => goTab('history')} style={{ background: 'none', border: 'none', color: '#25AAE1', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>View all</button>
                        </div>
                        <div className="sp-timeline">
                            {data.history && data.history.slice(0, 5).map((m, i) => (
                                <div key={m._id} className="sp-timeline-item">
                                    <div className="sp-timeline-dot" style={{ borderColor: m.attended ? '#25AAE1' : '#f87171', boxShadow: m.attended ? '0 0 8px rgba(37,170,225,0.3)' : 'none' }}>
                                        <div className="sp-timeline-dot-inner" style={{ background: m.attended ? '#25AAE1' : '#f87171' }} />
                                    </div>
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', padding: '0.75rem 0.9rem', border: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{m.name}</div>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: m.attended ? '#25AAE1' : '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{m.attended ? '✓' : '✕'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                                            {new Date(m.date).toLocaleDateString()} · {m.campus}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {whatsappLink && (
                            <a href={whatsappLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', padding: '0.65rem', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '0.65rem', color: '#4ade80', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'none', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.08)'}>
                                💬 Join G9 WhatsApp Group
                            </a>
                        )}
                    </div>
                </aside>
            </div>

            {/* ══ MOBILE BOTTOM NAV ══ */}
            <div className="sp-mobile-bottom-nav">
                {TABS.map(t => (
                    <button key={t.id} className={`sp-mobile-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => goTab(t.id)}>
                        <t.icon size={20} />
                        {t.label}
                    </button>
                ))}
                <button className="sp-mobile-tab-btn" onClick={handleLogout} style={{ color: '#f87171' }}>
                    <LogOut size={20} />
                    SIGN OUT
                </button>
            </div>

            {/* ══ CHAT WIDGET ══ */}
            {false && (
                <div style={{ position: 'fixed', bottom: '1.25rem', right: '1.25rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    {isChatOpen && (
                        <div style={{ width: 'min(340px, calc(100vw - 2rem))', height: '430px', display: 'flex', flexDirection: 'column', background: 'rgba(9,29,46,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(37,170,225,0.25)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
                            <div style={{ padding: '0.85rem 1rem', background: 'rgba(37,170,225,0.08)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}><DoulosBotIcon size={22} /></div>
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: '0.85rem' }}>Doulos Bot</div>
                                        <div style={{ fontSize: '0.6rem', color: '#4ade80', fontWeight: 700 }}>● Online</div>
                                    </div>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.25rem' }}><XCircle size={18} /></button>
                            </div>
                            <div style={{ flex: 1, padding: '0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                {chatMessages.map((msg, i) => (
                                    <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '0.5rem 0.85rem', borderRadius: '1rem', background: msg.sender === 'user' ? 'linear-gradient(135deg, #25AAE1, #0a4d68)' : 'rgba(255,255,255,0.06)', color: 'white', fontSize: '0.8rem', lineHeight: 1.5, borderBottomRightRadius: msg.sender === 'user' ? '2px' : '1rem', borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '1rem', wordBreak: 'break-word' }}>
                                        {msg.text}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div style={{ alignSelf: 'flex-start', padding: '0.5rem 0.85rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', display: 'flex', gap: '0.2rem' }}>
                                        <span style={{ animation: 'bounce 1s infinite 0s' }}>•</span>
                                        <span style={{ animation: 'bounce 1s infinite 0.2s' }}>•</span>
                                        <span style={{ animation: 'bounce 1s infinite 0.4s' }}>•</span>
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleSendChat} style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.5rem' }}>
                                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'white', fontSize: '0.82rem', outline: 'none' }} />
                                <button type="submit" disabled={!chatInput.trim()} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#25AAE1', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={16} /></button>
                            </form>
                        </div>
                    )}
                    <div style={{ position: 'relative' }}>
                        {!isChatOpen && showChatPopup && (
                            <div style={{ position: 'absolute', bottom: '68px', right: 0, width: '170px', padding: '0.75rem', background: 'white', color: '#0d1f2d', borderRadius: '0.75rem', borderBottomRightRadius: '2px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', fontSize: '0.78rem', fontWeight: 700, animation: 'slideUp 0.5s', zIndex: 10 }}>
                                👋 Hi {firstName}! Need help?
                                <div style={{ position: 'absolute', bottom: '-6px', right: '18px', width: '12px', height: '12px', background: 'white', transform: 'rotate(45deg)' }} />
                            </div>
                        )}
                        <button onClick={() => { setIsChatOpen(true); setShowChatPopup(false); }} style={{ width: '52px', height: '52px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '3px solid rgba(37,170,225,0.25)', cursor: 'pointer', boxShadow: '0 8px 25px rgba(37,170,225,0.35)', animation: 'bounce 2.5s infinite' }}>
                            <DoulosBotIcon size={30} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPortal;