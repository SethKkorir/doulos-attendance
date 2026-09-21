import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
    Calendar, CheckCircle, CheckCircle2, XCircle, BookOpen, Music, Bell, Star, Trophy, Search,
    LogOut, GraduationCap, Sparkles, CreditCard, Wallet,
    History, FileText, LayoutDashboard, Activity, Clock, ChevronRight, Users,
    AlertCircle, ArrowRight, User, Award, Flame, Compass, HeartHandshake, ShieldCheck,
    Shield, Layers, Info, Check, ArrowUpRight, Trash2, QrCode, ScanLine, Camera,
    Loader2, Lock, Eye, EyeOff, LogIn
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
        font-family: 'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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

    const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

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
    const [selectedRole, setSelectedRole] = useState('douloid'); // 'g9' | 'douloid' | 'recruit'
    const [selectedSemester, setSelectedSemester] = useState('');
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [isFocusedUser, setIsFocusedUser] = useState(false);
    const [isFocusedPass, setIsFocusedPass] = useState(false);
    const [registrationRequired, setRegistrationRequired] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberCampus, setNewMemberCampus] = useState('Athi River');
    const [newMemberType, setNewMemberType] = useState('Douloid');
    const [isFocusedReg, setIsFocusedReg] = useState(false);
    const [showRolloverWelcome, setShowRolloverWelcome] = useState(false);
    const [rolloverActiveToggle, setRolloverActiveToggle] = useState(true); // Defaults to Yes (pre-selected)
    const [toast, setToast] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [showRankDetailsModal, setShowRankDetailsModal] = useState(false);
    const [showAiComingSoon, setShowAiComingSoon] = useState(false);
    const [forgotNotice, setForgotNotice] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (forgotNotice) {
            timer = setTimeout(() => setForgotNotice(''), 6000);
        }
        return () => clearTimeout(timer);
    }, [forgotNotice]);

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
            const needsConfirmation = data.needsSemesterConfirmation !== undefined 
                ? data.needsSemesterConfirmation 
                : (data.lastConfirmedSemester !== data.currentSemester);
            setShowRolloverWelcome(needsConfirmation);
        }
    }, [data]);

    const handleLogin = async (e, customRegNo = null, semesterOverride = null) => {
        if (e && e.preventDefault) e.preventDefault();
        setError(null);

        if (selectedRole === 'g9' && !isLoggedIn) {
            setLoading(true);
            try {
                const res = await api.post('/auth/login', { username: adminUsername, password: adminPassword });
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role);
                localStorage.setItem('username', res.data.username);
                localStorage.setItem('campus', res.data.campus || 'Athi River');

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
                } else {
                    navigate('/admin/dashboard');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'G9 Login failed');
            } finally {
                setLoading(false);
            }
            return;
        }

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
            const semToFetch = semesterOverride !== null ? semesterOverride : (selectedSemester || '');
            const queryParam = semToFetch ? `?semester=${encodeURIComponent(semToFetch)}` : '';
            const res = await api.get(`/attendance/student/${targetRegNo}${queryParam}`);
            if (res.data.registrationRequired) { setRegistrationRequired(true); setLoading(false); return; }

            const memberType = (res.data.memberType || 'Douloid').trim();
            const douloidRank = (res.data.douloidRank || '').trim();
            const isDouloid = memberType.toLowerCase() === 'douloid' || (douloidRank && douloidRank !== 'None' && !douloidRank.toLowerCase().includes('candidate'));
            const isRecruit = memberType.toLowerCase() === 'recruit';

            // User requirement: deny access when recruit is clicked by a douloid
            if (selectedRole === 'recruit' && isDouloid) {
                setError("Access Denied: You are a Douloid, not a recruit! 😂 Please select Douloid to sign in.");
                setLoading(false);
                return;
            }

            if (selectedRole === 'douloid' && isRecruit) {
                setError("Access Denied: You are registered as a Recruit, not a Douloid! Please select Recruit to sign in.");
                setLoading(false);
                return;
            }

            setData(res.data);
            setRegNo(targetRegNo);
            if (res.data.selectedSemester) {
                setSelectedSemester(res.data.selectedSemester);
            }
            setIsLoggedIn(true);
            localStorage.setItem('studentSession', JSON.stringify({ regNo: targetRegNo, expiry: Date.now() + SESSION_DURATION }));
        } catch (err) { setError(err.response?.data?.message || 'Something went wrong. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleSemesterChange = (newSem) => {
        setSelectedSemester(newSem);
        handleLogin(null, regNo || data?.studentRegNo, newSem);
    };

    const handleSelfRegister = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        try {
            await api.post('/members/self-register', {
                studentRegNo: regNo,
                name: newMemberName,
                campus: newMemberCampus,
                memberType: newMemberType
            });
            setRegistrationRequired(false);
            handleLogin();
        } catch (err) { setError(err.response?.data?.message || 'Registration failed. Please try again.'); setLoading(false); }
    };

    const handleLogout = () => {
        api.post('/auth/logout').catch(() => {});
        localStorage.removeItem('studentSession');
        setIsLoggedIn(false); setData(null); setRegNo('');
        navigate('/portal', { replace: true, state: {} });
    };

    const handleConfirmSemester = async () => {
        setLoading(true);
        try {
            const memberId = data._id || data.studentRegNo || regNo;
            await api.post(`/members/${encodeURIComponent(memberId)}/confirm-semester`, {
                isActiveThisSemester: rolloverActiveToggle
            });
            setData(prev => ({
                ...prev,
                isActiveThisSemester: rolloverActiveToggle,
                lastConfirmedSemester: data.currentSemester,
                needsSemesterConfirmation: false,
                lastActiveSemester: rolloverActiveToggle ? data.currentSemester : prev.lastActiveSemester,
                status: 'Active'
            }));
            setShowRolloverWelcome(false);
            showToast(
                rolloverActiveToggle
                    ? `Confirmed active for ${data.currentSemester}! Welcome back. 🌿`
                    : `Recorded: Not active for ${data.currentSemester}. Roster status retained. 🛡️`,
                'success'
            );
        } catch (err) { 
            console.error('Confirmation error:', err);
            showToast('Confirmation failed. Please try again.', 'error');
        } finally { 
            setLoading(false); 
        }
    };
    const handleEnroll = handleConfirmSemester;

    const handleClearCongrats = async () => {
        try { await api.post(`/members/clear-congrats/${data.studentRegNo}`); } catch (err) { console.error('Failed to clear congrats status'); }
        setData({ ...data, needsGraduationCongrats: false });
    };

    useEffect(() => {
        if (isLoggedIn && !data) {
            handleLogin();
        }
    }, [isLoggedIn, isGuest]);

    useEffect(() => {
        if (!isLoggedIn || isGuest || !(regNo || data?.studentRegNo)) return;

        const refreshLivePortal = () => {
            const activeRegNo = regNo || data?.studentRegNo;
            const semToFetch = selectedSemester || data?.selectedSemester || '';
            if (activeRegNo) {
                handleLogin(null, activeRegNo, semToFetch);
            }
        };

        refreshLivePortal();
        const interval = setInterval(refreshLivePortal, 15000);
        return () => clearInterval(interval);
    }, [isLoggedIn, isGuest, regNo, selectedSemester, data?.studentRegNo, data?.selectedSemester]);

    /* ═══════════════════════════════════════════════════════════
       1. LOGIN VIEW (Matched to Admin/G9 Aesthetic)
    ═══════════════════════════════════════════════════════════ */
    if (!isLoggedIn) {
        return (
            <div className="login-mobile-container" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem 1rem',
                position: 'relative',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                overflow: 'hidden'
            }}>
                <style>{CSS}</style>

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
                            {registrationRequired ? 'Douloid / Recruit Enrollment' : 'Doulos System'}
                        </h1>
                        <p style={{
                            fontSize: '0.82rem',
                            color: '#94A3B8',
                            margin: 0,
                            fontWeight: 500
                        }}>
                            {registrationRequired ? 'Complete your enrollment to activate your portal' : 'Attendance & Fellowship Management System'}
                        </p>
                    </div>

                    {/* ══ LOGIN AS ROLE SELECTOR (Inspo: G9, Douloid, Recruit) ══ */}
                    {!registrationRequired && (
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
                                                setError(null);
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
                    )}

                    {registrationRequired ? (
                        <form onSubmit={handleSelfRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    color: '#CBD5E1',
                                    marginBottom: '0.4rem'
                                }}>
                                    Full Name
                                </label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(15, 23, 42, 0.65)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '10px',
                                    padding: '0 0.85rem',
                                    height: '46px'
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
                                            fontSize: '0.88rem',
                                            color: '#FFFFFF',
                                            fontWeight: 500
                                        }}
                                    />
                                </div>
                            </div>

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
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(15, 23, 42, 0.65)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '10px',
                                    padding: '0 0.85rem',
                                    height: '46px'
                                }}>
                                    <input
                                        type="text"
                                        value={regNo}
                                        readOnly
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: '0.88rem',
                                            color: '#E2E8F0',
                                            fontWeight: 700
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        color: '#CBD5E1',
                                        marginBottom: '0.4rem'
                                    }}>
                                        Campus
                                    </label>
                                    <select
                                        value={newMemberCampus}
                                        onChange={e => setNewMemberCampus(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '46px',
                                            background: 'rgba(15, 23, 42, 0.85)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '10px',
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
                                        fontWeight: 600,
                                        color: '#CBD5E1',
                                        marginBottom: '0.4rem'
                                    }}>
                                        Category
                                    </label>
                                    <select
                                        value={newMemberType}
                                        onChange={e => setNewMemberType(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '46px',
                                            background: 'rgba(15, 23, 42, 0.85)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '10px',
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
                                        <span>Register & Check In</span>
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
                                    color: '#94A3B8',
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
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                            {selectedRole === 'g9' ? (
                                <>
                                    {/* Username Input for G9 */}
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
                                                value={adminUsername}
                                                onChange={(e) => setAdminUsername(e.target.value)}
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

                                    {/* Password Input for G9 */}
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
                                                type={showAdminPassword ? 'text' : 'password'}
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
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
                                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                                tabIndex={-1}
                                                aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
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
                                                {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                    )}

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
                    <div className="sp-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Logo size={40} showText={false} />
                        <div>
                            <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>DOULOS</div>
                            <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#1D4ED8', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: '1px' }}>Member Portal</div>
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

                    {/* Douloid Rank Status Card (Synced directly with G5 - Mobile Optimized) */}
                    <div 
                        style={{ 
                            background: rank.badgeBg, 
                            border: `1px solid ${rank.border}`, 
                            borderRadius: '12px', 
                            padding: '0.7rem 0.95rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            gap: '0.75rem',
                            cursor: 'pointer', 
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
                        }} 
                        onClick={() => setShowRankDetailsModal(true)}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.98)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
                            <div style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '10px', 
                                background: rank.bg, 
                                border: `1px solid ${rank.border}`,
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: rank.color, 
                                flexShrink: 0,
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                            }}>
                                <Award size={20} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: 900, color: rank.color, letterSpacing: '0.8px', textTransform: 'uppercase', lineHeight: 1.1 }}>
                                    DOULOID RANK
                                </div>
                                <div style={{ fontSize: '0.94rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.2, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {rank.rankName}
                                </div>
                            </div>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            color: rank.color, 
                            fontSize: '0.72rem', 
                            fontWeight: 800,
                            background: '#FFFFFF',
                            padding: '0.32rem 0.65rem',
                            borderRadius: '999px',
                            border: `1px solid ${rank.border}`,
                            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                            flexShrink: 0
                        }}>
                            <span>Rank Info</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </div>


                {/* ══ 3. TAB CONTENT ══ */}
                <div style={{ animation: 'fadeUp 0.25s ease' }}>

                    {/* ──── OVERVIEW TAB ──── */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Semester Fellowship Standing Card (Modernized & Polished) */}
                            <div className="sp-card" style={{ padding: '1.65rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1D4ED8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                            SEMESTER FELLOWSHIP STANDING
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Term:</span>
                                            {data?.availableSemesters && data.availableSemesters.length > 1 ? (
                                                <select
                                                    value={selectedSemester || data?.selectedSemester || currentSem}
                                                    onChange={e => handleSemesterChange(e.target.value)}
                                                    style={{
                                                        fontSize: '0.78rem',
                                                        fontWeight: 800,
                                                        color: '#1E293B',
                                                        background: '#F8FAFC',
                                                        border: '1px solid #CBD5E1',
                                                        borderRadius: '8px',
                                                        padding: '0.2rem 0.6rem',
                                                        cursor: 'pointer',
                                                        outline: 'none'
                                                    }}
                                                >
                                                    {data.availableSemesters.map(semOption => (
                                                        <option key={semOption} value={semOption}>{semOption}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 800 }}>{selectedSemester || currentSem}</span>
                                            )}
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
                                            {totalMeetings === 0 ? 'Attend weekly fellowships to build your consistency score.' : pct >= 75 ? 'Excellent standing! Keep up the fellowship. 🌟' : 'Aim for 75%+ weekly attendance.'}
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
                </div>

                {/* ══ FLOATING BOTTOM DOCK ══ */}
                <nav className="sp-bottom-dock">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`sp-dock-btn ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => {
                                if (t.id === 'bot') {
                                    setShowAiComingSoon(true);
                                } else {
                                    setActiveTab(t.id);
                                }
                            }}
                        >
                            <t.icon size={19} />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </nav>

                {/* ══ SEMESTER ROLLOVER CONFIRMATION MODAL (SECTION 2) ══ */}
                {showRolloverWelcome && data && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.25rem' }}>
                        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '24px', padding: '2.25rem 1.75rem', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)', animation: 'popScale 0.35s' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, #1D4ED8 0%, #172554 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 20px rgba(29, 78, 216, 0.25)' }}>
                                <Logo size={34} showText={false} />
                            </div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#1D4ED8', letterSpacing: '2px', textTransform: 'uppercase' }}>SEMESTER CONFIRMATION</span>
                            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F172A', margin: '0.35rem 0 0.5rem' }}>{currentSem}</h2>
                            
                            {data.semesterTheme && (
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.25rem' }}>
                                    "{data.semesterTheme}"
                                </div>
                            )}
                            {data.semesterVerse && (
                                <div style={{ fontSize: '0.74rem', fontStyle: 'italic', color: '#64748B', marginBottom: '1.25rem' }}>
                                    {data.semesterVerse}
                                </div>
                            )}

                            <div style={{ margin: '1rem 0 0.5rem', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                                    Are you active this semester?
                                </label>
                                
                                {/* Simple Yes / No Toggle (Defaults to Yes pre-selected) */}
                                <div style={{
                                    display: 'flex',
                                    background: '#F1F5F9',
                                    borderRadius: '14px',
                                    padding: '4px',
                                    gap: '4px',
                                    border: '1px solid #E2E8F0'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setRolloverActiveToggle(true)}
                                        style={{
                                            flex: 1,
                                            padding: '0.7rem 0.5rem',
                                            borderRadius: '10px',
                                            border: 'none',
                                            fontWeight: 800,
                                            fontSize: '0.88rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                            background: rolloverActiveToggle ? '#10B981' : 'transparent',
                                            color: rolloverActiveToggle ? '#FFFFFF' : '#475569',
                                            boxShadow: rolloverActiveToggle ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                                        }}
                                    >
                                        Yes, I am Active 🚀
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRolloverActiveToggle(false)}
                                        style={{
                                            flex: 1,
                                            padding: '0.7rem 0.5rem',
                                            borderRadius: '10px',
                                            border: 'none',
                                            fontWeight: 800,
                                            fontSize: '0.88rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                            background: !rolloverActiveToggle ? '#475569' : 'transparent',
                                            color: !rolloverActiveToggle ? '#FFFFFF' : '#475569',
                                            boxShadow: !rolloverActiveToggle ? '0 2px 8px rgba(71, 85, 105, 0.3)' : 'none'
                                        }}
                                    >
                                        No, Away (Leave/Attach)
                                    </button>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '0.65rem 0 1.5rem', lineHeight: 1.5, textAlign: 'left' }}>
                                {rolloverActiveToggle 
                                    ? '✨ You will be counted in active fellowships, drills, and rank evaluations.' 
                                    : '🛡️ Your Douloid standing remains completely intact; you are exempted from missed-meeting flags while away.'}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                <button
                                    disabled={loading}
                                    onClick={handleConfirmSemester}
                                    style={{
                                        width: '100%',
                                        padding: '0.95rem',
                                        background: rolloverActiveToggle ? 'var(--color-primary)' : '#334155',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '14px',
                                        fontWeight: 800,
                                        fontSize: '0.92rem',
                                        cursor: 'pointer',
                                        boxShadow: rolloverActiveToggle ? '0 4px 14px rgba(29, 78, 216, 0.3)' : 'none'
                                    }}
                                >
                                    {loading ? 'Confirming...' : (rolloverActiveToggle ? 'CONFIRM: YES, I AM ACTIVE! 🚀' : 'CONFIRM STATUS AS AWAY')}
                                </button>
                                <button
                                    onClick={() => setShowRolloverWelcome(false)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'transparent',
                                        color: '#94A3B8',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Remind me later
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

                {/* ══ DOULOS AI COMING SOON POPUP MODAL ══ */}
                {showAiComingSoon && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.65)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000,
                            padding: '1.25rem'
                        }}
                        onClick={() => setShowAiComingSoon(false)}
                    >
                        <div
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '24px',
                                padding: '2rem 1.75rem',
                                maxWidth: '340px',
                                width: '100%',
                                textAlign: 'center',
                                boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
                                animation: 'popScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.25rem',
                                    color: '#FFFFFF',
                                    boxShadow: '0 8px 20px rgba(29, 78, 216, 0.25)'
                                }}
                            >
                                <Sparkles size={28} />
                            </div>
                            <span
                                style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 900,
                                    color: '#1D4ED8',
                                    letterSpacing: '1.5px',
                                    textTransform: 'uppercase',
                                    display: 'block',
                                    marginBottom: '0.35rem'
                                }}
                            >
                                DOULOS AI
                            </span>
                            <h3
                                style={{
                                    fontSize: '1.45rem',
                                    fontWeight: 900,
                                    color: '#0F172A',
                                    margin: '0 0 1.5rem'
                                }}
                            >
                                Coming Soon
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAiComingSoon(false)}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    background: 'var(--color-primary, #1D4ED8)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '0.92rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(29, 78, 216, 0.25)'
                                }}
                            >
                                Okay
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPortal;