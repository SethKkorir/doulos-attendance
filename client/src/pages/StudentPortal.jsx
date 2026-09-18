import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
    Calendar, CheckCircle, CheckCircle2, XCircle, BookOpen, Music, Bell, Star, Trophy, Search,
    LogOut, GraduationCap, Sparkles, MessageCircle, Send, CreditCard, Wallet,
    History, FileText, LayoutDashboard, Activity, Clock, ChevronRight, Users,
    AlertCircle, ArrowRight, User, Award, Flame, Compass, HeartHandshake, ShieldCheck,
    Shield, Layers, Info, Check, ArrowUpRight, RotateCcw, Trash2, Bot, QrCode, ScanLine, Camera,
    Loader2
} from 'lucide-react';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import Logo from '../components/Logo';
import DoulosBotIcon from '../components/DoulosBotIcon';
import FinanceView from '../components/FinanceView';
import StudentEvents from '../components/StudentEvents';
import PortalQRScanner from '../components/PortalQRScanner';

/* ─── Helpers ─── */
const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
};

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'history',  label: 'Attendance History', icon: History },
    { id: 'events',   label: 'Events & Camp', icon: Calendar },
    { id: 'bot',      label: 'Doulos AI', icon: Sparkles },
];

/* ─── G5 Sequential Rank Progression Ladder ─── */
const getDouloidRankDetails = (memberType, douloidRank, belayStatus, soloStationAllowed) => {
    if (memberType === 'Recruit') {
        return {
            rankName: 'Recruit',
            level: 'Candidate',
            color: '#1D4ED8',
            bg: '#EFF6FF',
            border: '#BFDBFE',
            badgeBg: '#DBEAFE',
            description: 'Recruitment candidate completing foundational Doulos curriculum towards official Douloid investiture.',
            nextLadder: 'Next: Complete recruitment to graduate to Shadow Douloid.'
        };
    }
    if (memberType === 'Visitor') {
        return {
            rankName: 'Visitor',
            level: 'Guest',
            color: '#E11D48',
            bg: '#FFE4E6',
            border: '#FECDD3',
            badgeBg: '#FFF1F2',
            description: 'Honored visitor exploring fellowship with the Doulos community.',
            nextLadder: 'Next: Join as a recruit candidate during the next semester intake.'
        };
    }

    const r = (douloidRank || 'None').trim();

    if (r === 'Lead Douloid' || r.includes('Lead')) {
        return {
            rankName: 'Lead Douloid',
            level: 'Level 4 · Senior Facilitator',
            color: '#B45309',
            bg: '#FEF3C7',
            border: '#FDE68A',
            badgeBg: '#FFFBEB',
            description: 'Senior facilitator cleared to direct activity stations, supervise facilitators, and lead high-ropes operations.',
            nextLadder: 'Highest Douloid Facilitator rank attained.'
        };
    }
    if (r === 'Intermediate Douloid' || r.includes('Intermediate')) {
        return {
            rankName: 'Intermediate Douloid',
            level: 'Level 3 · Certified Facilitator',
            color: '#0369A1',
            bg: '#E0F2FE',
            border: '#BAE6FD',
            badgeBg: '#F0F9FF',
            description: 'Certified facilitator authorized to independently manage and supervise physical challenge course stations.',
            nextLadder: 'Next: Lead Douloid (after advanced leadership clearances).'
        };
    }
    if (r === 'Basic Douloid' || r.includes('Basic')) {
        return {
            rankName: 'Basic Douloid',
            level: 'Level 2 · Station Facilitator',
            color: '#4338CA',
            bg: '#EEF2FF',
            border: '#C7D2FE',
            badgeBg: '#F5F3FF',
            description: 'Competency certified facilitator approved to operate standard activity stations and co-lead groups.',
            nextLadder: 'Next: Intermediate Douloid (after station evaluations).'
        };
    }
    if (r === 'Shadow Douloid' || r.includes('Shadow')) {
        return {
            rankName: 'Shadow Douloid',
            level: 'Level 1 · Apprentice Facilitator',
            color: '#7E22CE',
            bg: '#FAF5FF',
            border: '#E9D5FF',
            badgeBg: '#FAF5FF',
            description: 'Apprentice facilitator shadowing senior Douloids to gain practical hands-on field experience.',
            nextLadder: 'Next: Basic Douloid (after initial facilitator assessment).'
        };
    }

    // Default Douloid
    return {
        rankName: 'Douloid',
        level: 'Facilitator in Training',
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FDE68A',
        badgeBg: '#FFFBEB',
        description: 'Commissioned Douloid member preparing for G5 facilitator ranking assessments.',
        nextLadder: 'Next: Shadow Douloid (via G5 ranking assessment).'
    };
};

/* ─── G5 Inspired White & Blue Theme CSS ─── */
const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
        --color-primary: #1D4ED8;
        --color-primary-hover: #1E40AF;
        --color-primary-soft: #EFF6FF;
        --color-primary-subtle: #DBEAFE;
        --color-surface: #FFFFFF;
        --color-page-bg: #F8FAFC;
        --color-text-main: #0F172A;
        --color-text-muted: #64748B;
        --color-border: #E2E8F0;
        --color-border-subtle: #EDF2F7;
        --color-success: #059669;
        --color-success-soft: #ECFDF5;
        --color-danger: #DC2626;
        --color-danger-soft: #FEE2E2;
        --radius-card: 20px;
        --radius-pill: 999px;
        --shadow-card: 0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02);
        --shadow-hover: 0 10px 30px rgba(29, 78, 216, 0.08);
    }

    body {
        background-color: var(--color-page-bg);
        color: var(--color-text-main);
        font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
    }

    .sp-viewport {
        min-height: 100vh;
        width: 100%;
        display: flex;
        justify-content: center;
        background-color: var(--color-page-bg);
    }

    .sp-shell {
        width: 100%;
        max-width: 580px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        padding: 1.25rem 1.15rem 7rem;
        position: relative;
    }

    @media (min-width: 900px) {
        .sp-shell {
            max-width: 680px;
            padding: 2rem 1.5rem 7.5rem;
        }
    }

    /* ─── Top App Bar ─── */
    .sp-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    .sp-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .sp-brand-logo {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--color-primary) 0%, #172554 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(29, 78, 216, 0.25);
        flex-shrink: 0;
    }

    .sp-logout-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.45rem 0.85rem;
        border-radius: var(--radius-pill);
        background: var(--color-danger-soft);
        border: 1px solid #FECDD3;
        color: var(--color-danger);
        font-size: 0.76rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
    }
    .sp-logout-btn:hover {
        background: #FDE8E8;
        transform: translateY(-1px);
    }

    .sp-scan-compact-action {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        padding: 0.75rem 1.05rem;
        min-width: 82px;
        background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%);
        border: 1px solid rgba(255, 255, 255, 0.35);
        outline: 2px solid #BFDBFE;
        border-radius: 16px;
        color: #FFFFFF;
        font-size: 0.76rem;
        font-weight: 900;
        letter-spacing: 0.5px;
        cursor: pointer;
        box-shadow: 0 6px 22px rgba(29, 78, 216, 0.35);
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        flex-shrink: 0;
    }
    .sp-scan-compact-action:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 10px 28px rgba(29, 78, 216, 0.48);
        outline-color: #93C5FD;
    }
    .sp-scan-compact-action:active {
        transform: translateY(0) scale(0.98);
    }

    /* ─── White & Blue Profile Card ─── */
    .sp-profile-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-card);
        padding: 1.15rem 1.25rem;
        box-shadow: var(--shadow-card);
        position: relative;
        overflow: hidden;
        margin-bottom: 1.15rem;
        transition: all 0.25s ease;
    }
    .sp-profile-card:hover {
        box-shadow: var(--shadow-hover);
        border-color: var(--color-primary-subtle);
    }
    .sp-profile-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: linear-gradient(90deg, var(--color-primary) 0%, #3B82F6 100%);
    }

    .sp-avatar-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--color-primary-soft);
        border: 2px solid var(--color-primary-subtle);
        color: var(--color-primary);
        font-weight: 900;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    /* ─── White Surface Cards ─── */
    .sp-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-card);
        padding: 1.5rem;
        box-shadow: var(--shadow-card);
        margin-bottom: 1.15rem;
        transition: all 0.2s ease;
    }
    .sp-card:hover {
        border-color: var(--color-primary-subtle);
    }

    /* ─── Segmented Tabs ─── */
    .sp-tabs {
        display: flex;
        background: #F1F5F9;
        border: 1px solid #E2E8F0;
        padding: 0.35rem;
        border-radius: 14px;
        gap: 0.35rem;
        margin-bottom: 1.35rem;
    }
    .sp-tab-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.7rem 0.5rem;
        border-radius: 10px;
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        font-size: 0.82rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
    }
    .sp-tab-btn.active {
        background: var(--color-surface);
        color: var(--color-primary);
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        border: 1px solid #E2E8F0;
    }

    /* ─── Metric Pills ─── */
    .sp-metric-pill {
        background: #F8FAFC;
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 1rem 0.85rem;
        text-align: center;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        transition: all 0.2s ease;
    }
    .sp-metric-pill:hover {
        border-color: var(--color-primary-subtle);
        background: #FFFFFF;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }

    /* ─── Attendance List Items ─── */
    .sp-list-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.15rem;
        background: #FFFFFF;
        border: 1px solid var(--color-border);
        border-radius: 14px;
        margin-bottom: 0.65rem;
        transition: all 0.2s ease;
    }
    .sp-list-item:hover {
        border-color: var(--color-primary-subtle);
        transform: translateX(2px);
    }

    /* ─── Floating Bottom Dock ─── */
    .sp-bottom-dock {
        position: fixed;
        bottom: 1.25rem;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 2.5rem);
        max-width: 520px;
        background: #FFFFFF;
        border: 1px solid #CBD5E1;
        border-radius: var(--radius-pill);
        padding: 0.5rem 0.85rem;
        display: flex;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.04);
        z-index: 100;
    }
    .sp-dock-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        padding: 0.45rem 1.15rem;
        background: none;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.3px;
        border-radius: var(--radius-pill);
        transition: all 0.2s;
    }
    .sp-dock-btn.active {
        color: var(--color-primary);
        background: var(--color-primary-soft);
    }

    /* ─── Toast ─── */
    .sp-toast {
        position: fixed;
        top: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.75rem 1.4rem;
        border-radius: var(--radius-pill);
        font-size: 0.84rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        z-index: 9999;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
        animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        white-space: nowrap;
        max-width: calc(100vw - 2rem);
    }
    .sp-toast.success { background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; }
    .sp-toast.error   { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }
    .sp-toast.info    { background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; }

    @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -15px); } to { opacity: 1; transform: translate(-50%, 0); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes popScale { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
    .loading-spinner { width: 18px; height: 18px; border: 2px solid rgba(29, 78, 216, 0.2); border-top: 2px solid var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ═══════════════════════════════════════════════════════════
   MAIN STUDENT PORTAL COMPONENT
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
    const [activeTab, setActiveTab] = useState('overview');
    const [registrationRequired, setRegistrationRequired] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberCampus, setNewMemberCampus] = useState('Athi River');
    const [newMemberType, setNewMemberType] = useState('Douloid');
    const [isFocusedReg, setIsFocusedReg] = useState(false);
    const [showRolloverWelcome, setShowRolloverWelcome] = useState(false);
    const [toast, setToast] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [showRankDetailsModal, setShowRankDetailsModal] = useState(false);
    const [botMessages, setBotMessages] = useState([
        { sender: 'bot', text: 'Hi! I am your upcoming Doulos AI Assistant. You will soon be able to ask me anything about your attendance standing, Douloid rank qualifications, campus schedules, and upcoming camps.' }
    ]);
    const [botInput, setBotInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const chatScrollRef = useRef(null);

    const navigate = useNavigate();

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleCheckInSuccess = async (result) => {
        const activeRegNo = result?.studentRegNo || data?.studentRegNo || regNo;
        if (activeRegNo) {
            await handleLogin(null, activeRegNo);
        }
        showToast(result?.message || '🎉 Check-in verified! +10 Attendance Points recorded.', 'success');
    };

    useEffect(() => {
        if (data) {
            setShowRolloverWelcome(data.lastActiveSemester !== data.currentSemester);
        }
    }, [data]);

    const handleLogin = async (e, customRegNo = null) => {
        if (e && e.preventDefault) e.preventDefault();
        if (isGuest) {
            setData({
                studentRegNo: 'GUEST-001', memberName: 'Guest Explorer', memberType: 'Visitor',
                douloidRank: 'None', belayStatus: 'Not Permitted', soloStationAllowed: false,
                campus: 'Valley Road', currentSemester: 'SEP-DEC 2026',
                stats: { totalAttended: 0, totalMeetings: 0, percentage: 0 },
                history: [],
                semesterTheme: 'Rooted & Built Up In Him',
                semesterVerse: 'Colossians 2:6-7',
                groupName: 'Alpha Vanguard'
            });
            setIsLoggedIn(true);
            return;
        }
        const targetRegNo = (customRegNo || regNo || data?.studentRegNo || '').trim().toUpperCase();
        if (!targetRegNo) return;
        setLoading(true); setError(null);
        try {
            const res = await api.get(`/attendance/student/${targetRegNo}`);
            if (res.data.registrationRequired) { setRegistrationRequired(true); setLoading(false); return; }
            setData(res.data);
            setRegNo(targetRegNo);
            setIsLoggedIn(true);
            localStorage.setItem('studentSession', JSON.stringify({ regNo: targetRegNo, expiry: Date.now() + SESSION_DURATION }));
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

    const handleEnroll = async () => {
        setLoading(true);
        try {
            await api.post('/members/enroll', { studentRegNo: data.studentRegNo, semester: data.currentSemester, isActiveThisSemester: true });
            setData(prev => ({ ...prev, lastActiveSemester: data.currentSemester, status: 'Active' }));
            setShowRolloverWelcome(false);
            showToast(`Enrolled for ${data.currentSemester}! Welcome. 🌿`, 'success');
        } catch (err) { 
            showToast('Enrollment failed. Please try again.', 'error');
        } finally { 
            setLoading(false); 
        }
    };

    const handleClearCongrats = async () => {
        try { await api.post(`/members/clear-congrats/${data.studentRegNo}`); } catch (err) { console.error('Failed to clear congrats status'); }
        setData({ ...data, needsGraduationCongrats: false });
    };

    const handleClearConversation = () => {
        setBotMessages([
            { sender: 'bot', text: 'Conversation cleared! 🧹 Ask me anything about your attendance standing, Douloid rank qualifications, campus schedules, and upcoming camps.' }
        ]);
        showToast('Conversation cleared', 'info');
    };

    const handleSendBotMessage = (e, presetText = null) => {
        if (e) e.preventDefault();
        const query = (presetText || botInput).trim();
        if (!query) return;

        setBotMessages(prev => [...prev, { sender: 'user', text: query }]);
        if (!presetText) setBotInput('');
        setIsBotTyping(true);

        setTimeout(() => {
            setIsBotTyping(false);
            setBotMessages(prev => [...prev, {
                sender: 'bot',
                text: "✨ Doulos AI Assistant is currently in active development and coming soon! Full query resolution for attendance standing, facilitator rank criteria, and camp schedules will be available shortly."
            }]);
        }, 650);
    };

    useEffect(() => {
        if (activeTab === 'bot' && chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [botMessages, isBotTyping, activeTab]);

    useEffect(() => {
        if (isLoggedIn && !data) { handleLogin(); }
    }, [isLoggedIn, isGuest]);

    /* ═══════════════════════════════════════════════════════════
       1. LOGIN VIEW (Matched to Admin/G9 Aesthetic)
    ═══════════════════════════════════════════════════════════ */
    if (!isLoggedIn) {
        return (
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
                <style>{CSS}</style>

                <style>{`
                    input::placeholder { color: rgba(200, 220, 255, 0.7) !important; }
                    input { caret-color: #fff; }
                `}</style>

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
                            {registrationRequired ? 'Douloid / Recruit Enrollment' : 'Douloid or Recruit Portal'}
                        </h1>
                        <p style={{
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.72)',
                            margin: 0,
                            fontWeight: 500
                        }}>
                            {registrationRequired ? 'Complete your enrollment to activate your portal' : 'Enter your admission number to access your portal'}
                        </p>
                    </div>

                    {registrationRequired ? (
                        <form onSubmit={handleSelfRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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
                                    Full Name
                                </label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.10)',
                                    border: '1.5px solid rgba(255,255,255,0.25)',
                                    borderRadius: '12px',
                                    padding: '0 1rem',
                                    height: '48px'
                                }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        value={newMemberName}
                                        onChange={e => setNewMemberName(e.target.value)}
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
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
                                        Campus
                                    </label>
                                    <select
                                        value={newMemberCampus}
                                        onChange={e => setNewMemberCampus(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '48px',
                                            background: 'rgba(255,255,255,0.10)',
                                            border: '1.5px solid rgba(255,255,255,0.25)',
                                            borderRadius: '12px',
                                            color: '#FFFFFF',
                                            padding: '0 0.75rem',
                                            fontSize: '0.88rem',
                                            fontWeight: 600,
                                            outline: 'none'
                                        }}
                                    >
                                        {['Athi River', 'Valley Road'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
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
                                        Category
                                    </label>
                                    <select
                                        value={newMemberType}
                                        onChange={e => setNewMemberType(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '48px',
                                            background: 'rgba(255,255,255,0.10)',
                                            border: '1.5px solid rgba(255,255,255,0.25)',
                                            borderRadius: '12px',
                                            color: '#FFFFFF',
                                            padding: '0 0.75rem',
                                            fontSize: '0.88rem',
                                            fontWeight: 600,
                                            outline: 'none'
                                        }}
                                    >
                                        {['Douloid', 'Recruit', 'Visitor'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>

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
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="spinner-animate" />
                                        <span>Enrolling...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Complete Registration</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setRegistrationRequired(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.65)',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    marginTop: '0.25rem'
                                }}
                            >
                                ← Back to Sign In
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                            {/* Admission Number Input */}
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
                                    Admission Number
                                </label>
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: isFocusedReg ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.15)',
                                    border: `1.5px solid ${isFocusedReg ? 'rgba(147,197,253,0.8)' : 'rgba(147,197,253,0.35)'}`,
                                    borderRadius: '12px',
                                    padding: '0 1rem',
                                    height: '48px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isFocusedReg ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none'
                                }}>
                                    <User size={18} style={{ color: isFocusedReg ? '#fff' : 'rgba(255,255,255,0.55)', marginRight: '0.75rem', flexShrink: 0 }} />
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
                                            fontSize: '0.95rem',
                                            fontWeight: 700,
                                            letterSpacing: '1px',
                                            color: '#FFFFFF'
                                        }}
                                    />
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
                                        <span>Accessing Portal...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Access My Portal</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}



                    {/* Subfooter */}
                    <div style={{
                        marginTop: '1.5rem',
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
    }

    /* ═══════════════════════════════════════════════════════════
       2. LOADING SCREEN
    ═══════════════════════════════════════════════════════════ */
    if (!data) {
        return (
            <div className="sp-viewport" style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <style>{CSS}</style>
                <div className="loading-spinner" style={{ width: '44px', height: '44px', borderWidth: '3px' }} />
                <p style={{ color: '#1D4ED8', fontWeight: 800, letterSpacing: '1px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Loading Portal Data...</p>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════════
       3. GRADUATION CELEBRATION MODAL
    ═══════════════════════════════════════════════════════════ */
    if (isLoggedIn && data?.needsGraduationCongrats) {
        return (
            <div className="sp-viewport" style={{ alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
                <style>{CSS}</style>
                <div style={{
                    maxWidth: '480px', width: '100%',
                    background: '#FFFFFF',
                    border: '2px solid #BFDBFE',
                    borderRadius: '24px', padding: '2.5rem 2rem',
                    textAlign: 'center',
                    boxShadow: '0 25px 60px rgba(29, 78, 216, 0.12)',
                    animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <Sparkles size={32} color="#1D4ED8" />
                        <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: '#EFF6FF', border: '2px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                            <Award size={42} />
                        </div>
                        <Sparkles size={32} color="#1D4ED8" />
                    </div>

                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1D4ED8', letterSpacing: '2.5px', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                        GRADUATION COMPLETED
                    </span>

                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
                        Officially a Douloid!
                    </h1>

                    <p style={{ fontSize: '1rem', color: '#059669', fontWeight: 800, marginBottom: '1.5rem' }}>
                        Congratulations on graduating recruitment.
                    </p>

                    <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #E2E8F0' }}>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                            You now hold full Douloid status in the G5 directory with facilitator ranking and cohort placement.
                        </p>
                    </div>

                    <button onClick={handleClearCongrats} style={{ width: '100%', padding: '1.1rem', background: '#1D4ED8', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.98rem', letterSpacing: '0.5px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(29, 78, 216, 0.25)' }}>
                        ENTER MY PORTAL 🚀
                    </button>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════════
       4. MAIN DASHBOARD RENDER (G5 WHITE/BLUE PALETTE)
    ═══════════════════════════════════════════════════════════ */
    const rank = getDouloidRankDetails(data?.memberType, data?.douloidRank, data?.belayStatus, data?.soloStationAllowed);
    const firstName = data?.memberName?.split(' ')[0] || 'Member';
    const totalMeetings = data?.stats?.totalMeetings || 0;
    const totalAttended = data?.stats?.totalAttended || 0;
    const absent = Math.max(0, totalMeetings - totalAttended);
    const pct = data?.stats?.percentage || 0;
    const campusName = data?.campus || 'Athi River';
    const currentSem = data?.currentSemester || 'SEP-DEC 2026';

    return (
        <div className="sp-viewport">
            <style>{CSS}</style>

            {/* Toast */}
            {toast && (
                <div className={`sp-toast ${toast.type}`}>
                    <span>{toast.type === 'success' ? '🌿' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Rank Details Explanatory Modal */}
            {showRankDetailsModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.25rem' }} onClick={() => setShowRankDetailsModal(false)}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '24px', padding: '2.25rem 2rem', maxWidth: '440px', width: '100%', boxShadow: '0 25px 60px rgba(15, 23, 42, 0.2)', animation: 'popScale 0.3s' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: rank.bg, border: `1px solid ${rank.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rank.color }}>
                                <Award size={28} />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: rank.color, letterSpacing: '1px', textTransform: 'uppercase' }}>G5 DOULOID RANK</span>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>{rank.rankName}</h3>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{rank.level}</div>
                            </div>
                        </div>

                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.15rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Role Description</div>
                            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>{rank.description}</p>
                        </div>

                        {/* G5 Certifications Info */}
                        {data?.memberType === 'Douloid' && (
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.15rem', marginBottom: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>G5 Safety Certifications</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>Belay Status:</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: data?.belayStatus?.includes('Certified') ? '#059669' : '#475569', background: data?.belayStatus?.includes('Certified') ? '#ECFDF5' : '#F1F5F9', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                                        {data?.belayStatus || 'Not Permitted'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>Solo Station:</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: data?.soloStationAllowed ? '#059669' : '#64748B', background: data?.soloStationAllowed ? '#ECFDF5' : '#F1F5F9', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                                        {data?.soloStationAllowed ? 'Approved' : 'Supervised Only'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div style={{ background: rank.bg, border: `1px solid ${rank.border}`, borderRadius: '16px', padding: '1.15rem', marginBottom: '1.75rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: rank.color, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Ladder Progression</div>
                            <p style={{ fontSize: '0.85rem', color: '#0F172A', lineHeight: 1.5, fontWeight: 700, margin: 0 }}>{rank.nextLadder}</p>
                        </div>

                        <button onClick={() => setShowRankDetailsModal(false)} style={{ width: '100%', padding: '0.9rem', background: 'var(--color-primary)', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
                            Close Details
                        </button>
                    </div>
                </div>
            )}

            <div className="sp-shell">

                {/* ══ TOP BAR ══ */}
                <header className="sp-top-bar">
                    <div className="sp-brand">
                        <div className="sp-brand-logo">
                            <Logo size={24} showText={false} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>DOULOS</div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1D4ED8', letterSpacing: '1px', textTransform: 'uppercase' }}>Member Portal</div>
                        </div>
                    </div>

                    <button className="sp-logout-btn" onClick={handleLogout}>
                        <LogOut size={13} />
                        <span>Sign Out</span>
                    </button>
                </header>

                {/* ══ 1. PROFILE HEADER CARD ══ */}
                <div className="sp-profile-card">
                    {/* Top Header Row: Avatar, Member Info & Compact QR Camera Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                            <div className="sp-avatar-circle">
                                {firstName.charAt(0)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.8px', textTransform: 'uppercase', lineHeight: 1.1 }}>
                                    {getTimeGreeting()}
                                </div>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: '0.1rem 0 0.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {data?.memberName}
                                </h2>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {data?.studentRegNo} · {campusName}
                                </div>
                            </div>
                        </div>

                        {/* Prominent High-Visibility QR Camera Scan Button */}
                        <button
                            type="button"
                            className="sp-scan-compact-action"
                            onClick={() => setShowScanner(true)}
                            title="Scan Venue QR Code"
                        >
                            <QrCode size={23} />
                            <span style={{ lineHeight: 1 }}>SCAN QR</span>
                        </button>
                    </div>

                    {/* Douloid Rank Status Card (Synced directly with G5) */}
                    <div 
                        style={{ 
                            background: rank.badgeBg, 
                            border: `1px solid ${rank.border}`, 
                            borderRadius: '14px', 
                            padding: '0.85rem 1.15rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s' 
                        }} 
                        onClick={() => setShowRankDetailsModal(true)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: rank.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rank.color, flexShrink: 0 }}>
                                <Award size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.62rem', fontWeight: 900, color: rank.color, letterSpacing: '1px', textTransform: 'uppercase' }}>DOULOID RANK</div>
                                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0F172A' }}>{rank.rankName}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: rank.color, fontSize: '0.76rem', fontWeight: 800 }}>
                            <span>Rank Info</span>
                            <ChevronRight size={16} />
                        </div>
                    </div>
                </div>

                {/* ══ 2. SEGMENTED TABS (Overview, Attendance History, Events) ══ */}
                <div className="sp-tabs">
                    {TABS.map(t => (
                        <button key={t.id} className={`sp-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                            <t.icon size={16} />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* ══ 3. TAB CONTENT ══ */}
                <div style={{ animation: 'fadeUp 0.25s ease' }}>

                    {/* ──── OVERVIEW TAB ──── */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Semester Fellowship Standing Card (Modernized & Polished) */}
                            <div className="sp-card" style={{ padding: '1.65rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1D4ED8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                            SEMESTER FELLOWSHIP STANDING
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, marginTop: '2px' }}>
                                            Active Term: {currentSem}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '0.35rem 0.85rem', borderRadius: '999px', background: totalMeetings === 0 ? '#EFF6FF' : pct >= 75 ? '#ECFDF5' : '#FEF3C7', color: totalMeetings === 0 ? '#1D4ED8' : pct >= 75 ? '#065F46' : '#92400E', border: `1px solid ${totalMeetings === 0 ? '#BFDBFE' : pct >= 75 ? '#A7F3D0' : '#FDE68A'}` }}>
                                        {totalMeetings === 0 ? 'NEW SEMESTER' : pct >= 75 ? '75%+ STANDING' : 'NEEDS IMPROVEMENT'}
                                    </span>
                                </div>

                                {/* Dynamic Score / Consistency Banner */}
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                            {totalMeetings === 0 ? '0%' : `${pct}%`}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, marginTop: '0.35rem' }}>
                                            {totalMeetings === 0 ? 'Fresh Semester Standing' : 'Semester Attendance Rate'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', maxWidth: '240px' }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
                                            {totalMeetings === 0 ? 'Semester Just Begun' : `${totalAttended} of ${totalMeetings} Sessions`}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                                            {totalMeetings === 0 ? 'Attend weekly fellowships to build your consistency score.' : 'Aim for 75%+ weekly attendance.'}
                                        </div>
                                    </div>
                                </div>

                                {/* Clean 3-Metric Stat Pills */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                                    <div className="sp-metric-pill">
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{totalAttended}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Attended</div>
                                    </div>
                                    <div className="sp-metric-pill">
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <XCircle size={16} />
                                        </div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>{absent}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Missed</div>
                                    </div>
                                    <div className="sp-metric-pill">
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={16} />
                                        </div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{totalMeetings}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Sessions Held</div>
                                    </div>
                                </div>
                            </div>

                            {/* Spiritual Theme Card */}
                            {data?.semesterTheme && (
                                <div className="sp-card" style={{ background: '#F8FAFC' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Compass size={18} color="#1D4ED8" />
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1D4ED8', letterSpacing: '1px', textTransform: 'uppercase' }}>SEMESTER THEME</span>
                                    </div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', fontStyle: 'italic', marginBottom: '0.4rem' }}>
                                        "{data.semesterTheme}"
                                    </div>
                                    {data.semesterVerse && (
                                        <div style={{ fontSize: '0.84rem', color: '#64748B', fontStyle: 'italic', borderLeft: '2px solid #1D4ED8', paddingLeft: '0.75rem' }}>
                                            {data.semesterVerse}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Recent Meetings Feed */}
                            <div style={{ marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' }}>Recent Sessions ({currentSem})</div>
                                    <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>View All →</button>
                                </div>

                                {(!data?.history || data.history.length === 0) ? (
                                    <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>
                                        No meetings have been held yet for <strong>{currentSem}</strong>.
                                    </div>
                                ) : (
                                    data.history.slice(0, 3).map((m, i) => (
                                        <div key={m._id ? `${m._id}-${i}` : `hist-recent-${i}`} className="sp-list-item">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: m.attended ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.attended ? '#059669' : '#DC2626' }}>
                                                    {m.attended ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>{m.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{new Date(m.date).toLocaleDateString()} · {m.campus}</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: m.attended ? '#059669' : '#DC2626' }}>
                                                {m.attended ? 'PRESENT' : 'ABSENT'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ──── HISTORY TAB ──── */}
                    {activeTab === 'history' && (
                        <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                                {data?.history?.length || 0} Semester Records ({currentSem})
                            </div>

                            {(!data?.history || data.history.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#FFFFFF', borderRadius: '20px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.9rem' }}>
                                    No attendance records found for <strong>{currentSem}</strong>.
                                </div>
                            ) : (
                                data.history.map((m, i) => (
                                    <div key={m._id ? `${m._id}-${i}` : `hist-full-${i}`} className="sp-list-item">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: m.attended ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.attended ? '#059669' : '#DC2626', flexShrink: 0 }}>
                                                {m.attended ? <CheckCircle size={22} /> : <XCircle size={22} />}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {m.name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>{new Date(m.date).toLocaleDateString()} · {m.campus}</div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 900, color: m.attended ? '#059669' : '#DC2626', flexShrink: 0 }}>
                                            {m.attended ? 'PRESENT' : 'ABSENT'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ──── EVENTS TAB ──── */}
                    {activeTab === 'events' && (
                        <div className="sp-card" style={{ padding: '1.25rem' }}>
                            <StudentEvents />
                        </div>
                    )}

                    {/* ──── DOULOS AI TAB (COMING SOON) ──── */}
                    {activeTab === 'bot' && (
                        <div className="sp-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
                            {/* Header with Clear Chat & Coming Soon Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)' }}>
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                                            Doulos AI Assistant
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Ask questions about attendance, ranks & camps</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleClearConversation}
                                        title="Clear conversation"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            background: '#F8FAFC',
                                            border: '1px solid #CBD5E1',
                                            borderRadius: '999px',
                                            padding: '0.35rem 0.65rem',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            color: '#475569',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}
                                    >
                                        <RotateCcw size={13} />
                                        <span>Clear Chat</span>
                                    </button>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '0.3rem 0.65rem', borderRadius: '999px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                        COMING SOON
                                    </span>
                                </div>
                            </div>

                            {/* Chat Messages Feed */}
                            <div
                                ref={chatScrollRef}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '320px', paddingRight: '0.25rem', marginBottom: '1rem' }}
                            >
                                {botMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                            animation: 'fadeUp 0.25s ease'
                                        }}
                                    >
                                        <div
                                            style={{
                                                maxWidth: '85%',
                                                padding: '0.75rem 1rem',
                                                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                background: msg.sender === 'user' ? '#1D4ED8' : '#F1F5F9',
                                                color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                                                fontSize: '0.84rem',
                                                fontWeight: 500,
                                                lineHeight: 1.5,
                                                border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                                                boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(29, 78, 216, 0.2)' : 'none'
                                            }}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isBotTyping && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                        <div style={{ padding: '0.6rem 0.9rem', borderRadius: '16px 16px 16px 4px', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <div className="loading-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                                            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Doulos AI is thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Suggested Quick Inquiries Down Near Bottom */}
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.4rem' }}>
                                    Suggested Inquiries
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {[
                                        "What is my current rank?",
                                        "How many meetings to reach 75%?",
                                        "When is the next camp?",
                                        "What are the Douloid requirements?"
                                    ].map((q, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSendBotMessage(null, q)}
                                            style={{
                                                background: '#F8FAFC',
                                                border: '1px solid #CBD5E1',
                                                borderRadius: '999px',
                                                padding: '0.35rem 0.75rem',
                                                fontSize: '0.74rem',
                                                fontWeight: 600,
                                                color: '#334155',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1D4ED8'; e.currentTarget.style.color = '#1D4ED8'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#334155'; }}
                                        >
                                            <span>{q}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={(e) => handleSendBotMessage(e)} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                <input
                                    type="text"
                                    value={botInput}
                                    onChange={(e) => setBotInput(e.target.value)}
                                    placeholder="Ask Doulos AI a question..."
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem 1rem',
                                        background: '#F8FAFC',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        color: '#0F172A',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1D4ED8'}
                                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                                />
                                <button
                                    type="submit"
                                    disabled={!botInput.trim()}
                                    style={{
                                        background: botInput.trim() ? '#1D4ED8' : '#94A3B8',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '0 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: botInput.trim() ? 'pointer' : 'default',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ══ FLOATING BOTTOM DOCK ══ */}
                <nav className="sp-bottom-dock">
                    {TABS.map(t => (
                        <button key={t.id} className={`sp-dock-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                            <t.icon size={19} />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </nav>

                {/* ══ SEMESTER ROLLOVER ENROLLMENT MODAL ══ */}
                {showRolloverWelcome && data && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.25rem' }}>
                        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '24px', padding: '2.5rem 2rem', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)', animation: 'popScale 0.35s' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #1D4ED8 0%, #172554 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 20px rgba(29, 78, 216, 0.25)' }}>
                                <Logo size={36} showText={false} />
                            </div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#1D4ED8', letterSpacing: '2px', textTransform: 'uppercase' }}>NEW SEMESTER ROLLOVER</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', margin: '0.35rem 0 0.75rem' }}>{currentSem}</h2>
                            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.75rem', lineHeight: 1.6 }}>Are you planning to be active in the Doulos class for the {currentSem} semester?</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button disabled={loading} onClick={handleEnroll} style={{ width: '100%', padding: '1rem', background: 'var(--color-primary)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(29, 78, 216, 0.3)' }}>
                                    {loading ? 'Enrolling...' : 'YES, I AM ACTIVE! 🌿'}
                                </button>
                                <button onClick={() => setShowRolloverWelcome(false)} style={{ width: '100%', padding: '0.85rem', background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: '14px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    Just attending today (Visitor)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ IN-PORTAL IOS QR SCANNER MODAL ══ */}
                <PortalQRScanner
                    isOpen={showScanner}
                    onClose={() => setShowScanner(false)}
                    studentRegNo={data?.studentRegNo || regNo}
                    memberName={data?.memberName}
                    onCheckInSuccess={handleCheckInSuccess}
                />
            </div>
        </div>
    );
};

export default StudentPortal;