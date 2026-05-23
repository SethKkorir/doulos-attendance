import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import {
    Users, BarChart3, Sun, Moon, Link as LinkIcon, ExternalLink,
    ShieldAlert, RotateCcw, ChevronDown, Check, X,
    FileText, ListChecks, Settings as SettingsIcon, CheckCircle, LayoutDashboard,
    Calendar, Clock, Trash2, ShieldAlert as Ghost, Lightbulb, MessageCircle,
    GraduationCap, Wallet, Pencil, Plus, Download, FileSpreadsheet, Star,
    Activity
} from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import AdminFinanceView from '../components/AdminFinanceView';
import EventsManager from '../components/EventsManager';

import MeetingsTab from '../components/dashboard/MeetingsTab';
import TrainingsTab from '../components/dashboard/TrainingsTab';
import MembersTab from '../components/dashboard/MembersTab';
import SystemSettingsTab from '../components/dashboard/SystemSettingsTab';
import SystemObservabilityTab from '../components/dashboard/SystemObservabilityTab';

const AdminDashboard = () => {
    const location = useLocation();
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    useEffect(() => {
        if (location.state?.isGuest) {
            localStorage.setItem('isGuest', 'true');
        }
    }, [location.state]);

    const [meetings, setMeetings] = useState([]);
    const [trainings, setTrainings] = useState([]);
    const [members, setMembers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [msg, setMsg] = useState(null);
    const [guestFeaturesEnabled, setGuestFeaturesEnabled] = useState(true);
    const [activeTab, setActiveTab] = useState('meetings'); 
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'admin');
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
    const [quickRegNo, setQuickRegNo] = useState('');
    const [quickCheckInLoading, setQuickCheckInLoading] = useState(false);
    const [currentSemester, setCurrentSemester] = useState('MAY-AUG 2026');

    useEffect(() => {
        if (['developer', 'superadmin', 'SuperAdmin'].includes(userRole)) {
            fetchAdmins();
        }
    }, [userRole]);

    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        if (isGuest) {
            setAdmins([
                { _id: '1', username: 'Guest Admin', role: 'admin', campus: 'Valley Road' },
                { _id: '2', username: 'Guest SuperUser', role: 'superadmin', campus: 'Athi River' }
            ]);
            setLoadingAdmins(false);
            return;
        }
        try {
            const { data } = await api.get('/auth/users');
            setAdmins(data);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
        } finally {
            setLoadingAdmins(false);
        }
    };

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isDarkMode]);

    // --- IDLE TIMER (AUTO LOCK) ---
    useEffect(() => {
        let timeout;
        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                localStorage.clear();
                window.location.href = '/admin';
            }, 5 * 60 * 1000); 
        };
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();
        return () => {
            clearTimeout(timeout);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, []);

    const fetchMeetings = async () => {
        if (isGuest) {
            setMeetings([
                { _id: '1', name: 'Weekly Fellowship', date: new Date().toISOString(), isActive: true, campus: 'Valley Road', attendees: 45 },
                { _id: '2', name: 'Leadership Summit', date: new Date(Date.now() - 86400000 * 7).toISOString(), isActive: false, campus: 'Valley Road', attendees: 120 },
                { _id: '3', name: 'Prayer Night', date: new Date(Date.now() - 86400000 * 14).toISOString(), isActive: false, campus: 'Athi River', attendees: 30 }
            ]);
            return;
        }
        try {
            const res = await api.get('/meetings');
            const sorted = res.data.sort((a, b) => {
                if (a.isActive === b.isActive) {
                    return new Date(b.date) - new Date(a.date);
                }
                return a.isActive ? -1 : 1;
            });
            setMeetings(sorted);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to sync meetings with server' });
        }
    };

    const fetchTrainings = async () => {
        if (isGuest) {
            setTrainings([
                { _id: '1', name: 'Leadership Foundations', date: new Date().toISOString(), isActive: true, campus: 'Valley Road', attendanceCount: 15 },
                { _id: '2', name: 'The Art of Mentorship', date: new Date(Date.now() - 86400000 * 7).toISOString(), isActive: false, campus: 'Athi River', attendanceCount: 38 }
            ]);
            return;
        }
        try {
            const res = await api.get('/trainings');
            setTrainings(res.data);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to sync trainings with server' });
        }
    };

    const fetchMembers = async () => {
        setLoadingMembers(true);
        if (isGuest) {
            setMembers([
                { _id: '1', name: 'Guest Member 1', studentRegNo: 'GM-001', memberType: 'Douloid', campus: 'Valley Road', totalPoints: 120, totalAttended: 15, lastSeen: new Date().toISOString() },
                { _id: '2', name: 'Guest Member 2', studentRegNo: 'GM-002', memberType: 'Recruit', campus: 'Athi River', totalPoints: 50, totalAttended: 5, lastSeen: new Date().toISOString() },
                { _id: '3', name: 'Guest Member 3', studentRegNo: 'GM-003', memberType: 'Visitor', campus: 'Valley Road', totalPoints: 10, totalAttended: 1, lastSeen: new Date().toISOString() },
            ]);
            setLoadingMembers(false);
            return;
        }
        try {
            const res = await api.get('/members');
            setMembers(res.data);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to fetch members registry' });
        } finally {
            setLoadingMembers(false);
        }
    };

    const fetchSemesterSetting = async () => {
        try {
            const res = await api.get('/settings/current_semester');
            if (res.data?.value) {
                setCurrentSemester(res.data.value);
            }
        } catch (err) {
            console.error("Failed to fetch current semester", err);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchTrainings();
        fetchMembers();
        fetchSemesterSetting();
    }, []);

    useEffect(() => {
        let timer;
        if (msg) {
            timer = setTimeout(() => setMsg(null), 4000);
        }
        return () => clearTimeout(timer);
    }, [msg]);

    const handleSaveSetting = async (key, value) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Settings updates disabled in Guest Mode.' });
        try {
            await api.patch(`/settings/${key}`, { value });
            setMsg({ type: 'success', text: 'Setting updated!' });
            if (key === 'current_semester') setCurrentSemester(value);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to save system configurations.' });
        }
    };

    const handleSaveAdmin = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Staff management disabled in Guest Mode.' });
        try {
            if (editingAdmin._id === 'NEW') {
                await api.post('/auth/register', editingAdmin);
                setMsg({ type: 'success', text: 'New Administrator registered!' });
            } else {
                await api.patch(`/auth/users/${editingAdmin._id}`, editingAdmin);
                setMsg({ type: 'success', text: 'Admin profile updated!' });
            }
            setEditingAdmin(null);
            fetchAdmins();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save admin account' });
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Staff deletion disabled in Guest Mode.' });
        if (!window.confirm('Are you sure you want to permanently delete this administrator profile?')) return;
        try {
            await api.delete(`/auth/users/${id}`);
            setMsg({ type: 'success', text: 'Admin removed successfully.' });
            fetchAdmins();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to delete administrator' });
        }
    };

    const downloadCSV = async (meetingId, meetingName) => {
        try {
            const res = await api.get(`/attendance/${meetingId}`);
            const data = res.data;
            if (data.length === 0) {
                setMsg({ type: 'error', text: 'No attendance recorded yet.' });
                return;
            }
            const allKeys = new Set();
            data.forEach(r => {
                const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                Object.keys(responses || {}).forEach(k => allKeys.add(k));
            });
            const headers = ['Timestamp', 'Category', ...Array.from(allKeys)];
            const csvContent = [
                headers.join(','),
                ...data.map(r => {
                    const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                    const timestamp = new Date(r.timestamp).toLocaleString();
                    const category = r.memberType || 'Visitor';
                    return [
                        `"${timestamp}"`,
                        `"${category}"`,
                        ...Array.from(allKeys).map(h => `"${(responses[h] || '-').toString().replace(/"/g, '""')}"`)
                    ].join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${meetingName}_Attendance.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'CSV Export Started' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to download CSV' });
        }
    };

    const downloadCumulativeCSV = (filteredMembers, semesterName) => {
        try {
            const headers = ['Name', 'Registration Number', 'Category', 'Campus', 'Total Attendance'];
            const csvContent = [
                headers.join(','),
                ...filteredMembers.map(m => [
                    `"${m.name || 'Unknown'}"`,
                    `"${m.studentRegNo}"`,
                    `"${m.memberType || 'Visitor'}"`,
                    `"${m.campus}"`,
                    m.totalAttended
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Cumulative_Report_${semesterName.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'Cumulative Export Started' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export cumulative CSV' });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/admin';
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            <BackgroundGallery />
            <ValentineRain />

            {/* Premium Header/Banner */}
            {msg && (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    background: msg.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(34, 197, 94, 0.95)',
                    color: 'white',
                    padding: '0.85rem 1.75rem',
                    borderRadius: '1rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontWeight: 700,
                    animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    border: '1px solid rgba(255,255,255,0.15)'
                }}>
                    {msg.type === 'error' ? '⚠️' : '✅'} {msg.text}
                </div>
            )}

            <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
                {/* Sidebar Navigation */}
                <aside className="sidebar" style={{ width: '290px', flexShrink: 0, padding: '1.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', paddingLeft: '0.5rem' }}>
                        <div style={{ animation: 'rotateLogo 60s linear infinite' }}>
                            <Logo size={38} showText={false} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.5px' }}>DOULOS</h1>
                            <span style={{ fontSize: '0.6rem', color: '#25AAE1', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>G9 Control Panel</span>
                        </div>
                    </div>

                    {/* Premium Welcome Card in Sidebar */}
                    <div className="sidebar-profile-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #25AAE1 0%, #175e82 100%)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: 'white', boxShadow: '0 0 15px rgba(37, 170, 225, 0.25)' }}>
                                {userRole.charAt(0).toUpperCase()}
                            </div>
                            <button className="btn-icon" onClick={() => setIsDarkMode(!isDarkMode)} title={isDarkMode ? "Toggle Light Theme" : "Toggle Dark Theme"} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: 'white' }}>
                                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                            </button>
                        </div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white', lineHeight: 1.35 }}>
                            Welcome back,<br />Leader!
                        </h2>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>REGISTRY CONTROL</div>
                        {[
                            { id: 'meetings', label: 'Meetings & Scans', icon: LayoutDashboard },
                            { id: 'trainings', label: 'Trainings & Radius', icon: GraduationCap },
                            { id: 'members', label: 'Members Registry', icon: Users },
                            { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                            { id: 'finance', label: 'Financial Control', icon: Wallet },
                            { id: 'events', label: 'Events Scheduler', icon: Calendar },
                            { id: 'feedback', label: 'Community Feedback', icon: MessageCircle }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`sidebar-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
                            >
                                <t.icon size={17} />
                                {t.label}
                            </button>
                        ))}

                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '1.25rem', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>SYSTEM CONFIG</div>
                        {[
                            { id: 'admins', label: 'Staff Admins', icon: ShieldAlert },
                            { id: 'system', label: 'System Settings', icon: SettingsIcon }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`sidebar-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
                            >
                                <t.icon size={17} />
                                {t.label}
                            </button>
                        ))}
                        {['superadmin', 'developer'].includes(userRole?.toLowerCase()) && (
                            <button
                                onClick={() => setActiveTab('observability')}
                                className={`sidebar-nav-btn ${activeTab === 'observability' ? 'active' : ''}`}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: activeTab === 'observability' ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
                            >
                                <Activity size={17} />
                                System Observability
                            </button>
                        )}
                    </nav>

                    {/* Glowing CTA Upgrade Card like mockup */}
                    <div className="sidebar-cta-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.75px', textTransform: 'uppercase', color: 'white' }}>ACTIVE SEMESTER</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'white', marginBottom: '0.2rem' }}>
                            {currentSemester}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontStyle: 'italic' }}>
                            Geofenced points tracking online.
                        </div>
                    </div>

                    {/* Bottom User Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.25rem' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#94a3b8' }}>
                                G9
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>Administrator</div>
                                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{userRole}</span>
                            </div>
                        </div>
                        <button className="btn btn-sign-out" style={{ padding: '0.6rem', borderRadius: '0.6rem', fontWeight: 800, fontSize: '0.75rem', width: '100%', cursor: 'pointer' }} onClick={handleLogout}>
                            SIGN OUT SYSTEM
                        </button>
                    </div>
                </aside>

                {/* Main panel */}
                <main className="main-content" style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
                    {/* Header Controls */}
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Doulos Management Suite</div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.75px', color: 'white' }}>
                                {activeTab === 'meetings' ? 'Meetings & Scans' : 
                                 activeTab === 'trainings' ? 'Trainings & Radius' : 
                                 activeTab === 'members' ? 'Fellowship Registry' : 
                                 activeTab === 'reports' ? 'Reports & Analytics' : 
                                 activeTab === 'finance' ? 'Financial Systems' : 
                                 activeTab === 'events' ? 'Events Scheduler' : 
                                 activeTab === 'feedback' ? 'Community Feedback' : 
                                 activeTab === 'admins' ? 'Staff Administrators' : 
                                 activeTab === 'system' ? 'System Configurations' : 
                                 activeTab === 'observability' ? 'System Observability' : 'Management Suite'}
                            </h1>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <a href="/" className="btn" style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                                <ExternalLink size={13} /> Public Portal
                            </a>
                        </div>
                    </header>

                    {/* Tab Dispatcher */}
                    {activeTab === 'meetings' ? (
                        <MeetingsTab
                            meetings={meetings}
                            userRole={userRole}
                            isGuest={isGuest}
                            fetchMeetings={fetchMeetings}
                            setMsg={setMsg}
                            currentSemester={currentSemester}
                            api={api}
                            members={members}
                            quickRegNo={quickRegNo}
                            setQuickRegNo={setQuickRegNo}
                            quickCheckInLoading={quickCheckInLoading}
                            setQuickCheckInLoading={setQuickCheckInLoading}
                            fetchMembers={fetchMembers}
                        />
                    ) : activeTab === 'trainings' ? (
                        <TrainingsTab
                            trainings={trainings}
                            userRole={userRole}
                            isGuest={isGuest}
                            fetchTrainings={fetchTrainings}
                            setMsg={setMsg}
                            currentSemester={currentSemester}
                            api={api}
                            members={members}
                            quickRegNo={quickRegNo}
                            setQuickRegNo={setQuickRegNo}
                            quickCheckInLoading={quickCheckInLoading}
                            setQuickCheckInLoading={setQuickCheckInLoading}
                            fetchMembers={fetchMembers}
                        />
                    ) : activeTab === 'members' ? (
                        <MembersTab
                            members={members}
                            loadingMembers={loadingMembers}
                            userRole={userRole}
                            isGuest={isGuest}
                            fetchMembers={fetchMembers}
                            setMsg={setMsg}
                            currentSemester={currentSemester}
                            api={api}
                        />
                    ) : activeTab === 'feedback' ? (
                        <FeedbackView isGuest={isGuest} />
                    ) : activeTab === 'events' ? (
                        <EventsManager api={api} setMsg={setMsg} isGuest={isGuest} />
                    ) : activeTab === 'finance' ? (
                        <AdminFinanceView isGuest={isGuest} />
                    ) : activeTab === 'admins' ? (
                        <AdminsView
                            admins={admins}
                            loading={loadingAdmins}
                            onEdit={setEditingAdmin}
                            onDelete={handleDeleteAdmin}
                            onRegister={() => setEditingAdmin({ _id: 'NEW', username: '', role: 'admin', campus: 'Athi River' })}
                            guestFeaturesEnabled={guestFeaturesEnabled}
                            currentSemester={currentSemester}
                            onUpdateSetting={handleSaveSetting}
                        />
                    ) : activeTab === 'system' ? (
                        <SystemSettingsTab
                            onUpdateSetting={handleSaveSetting}
                            isGuest={isGuest}
                            setMsg={setMsg}
                            api={api}
                        />
                    ) : activeTab === 'reports' ? (
                        <ReportsView
                            meetings={meetings}
                            members={members}
                            onViewAttendance={null}
                            onDownload={null}
                            onDownloadCSV={downloadCSV}
                            onDownloadCumulativeCSV={downloadCumulativeCSV}
                        />
                    ) : activeTab === 'observability' ? (
                        <SystemObservabilityTab
                            members={members}
                            api={api}
                            setMsg={setMsg}
                            currentSemester={currentSemester}
                            isGuest={isGuest}
                        />
                    ) : null}
                </main>
            </div>

            {/* Add/Edit Admin Modal */}
            {editingAdmin && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setEditingAdmin(null)}>
                    <div className="glass-panel" style={{ padding: '2.5rem 2rem', maxWidth: '400px', width: '100%', background: '#0f172a' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{editingAdmin._id === 'NEW' ? 'Register New Staff' : 'Edit Staff Account'}</h3>
                            <button onClick={() => setEditingAdmin(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group-premium">
                                <label>Username</label>
                                <input className="modern-input" value={editingAdmin.username || ''} onChange={e => setEditingAdmin({ ...editingAdmin, username: e.target.value })} required disabled={editingAdmin._id !== 'NEW'} />
                            </div>
                            {editingAdmin._id === 'NEW' && (
                                <div className="form-group-premium">
                                    <label>Password</label>
                                    <input className="modern-input" type="password" value={editingAdmin.password || ''} onChange={e => setEditingAdmin({ ...editingAdmin, password: e.target.value })} required />
                                </div>
                            )}
                            <div className="form-group-premium">
                                <label>Campus Jurisdiction</label>
                                <select className="modern-input" value={editingAdmin.campus || 'Athi River'} onChange={e => setEditingAdmin({ ...editingAdmin, campus: e.target.value })}>
                                    <option value="Athi River">Athi River</option>
                                    <option value="Valley Road">Valley Road</option>
                                    <option value="All">All Campuses (Global)</option>
                                </select>
                            </div>
                            <div className="form-group-premium">
                                <label>System Role</label>
                                <select className="modern-input" value={editingAdmin.role || 'admin'} onChange={e => setEditingAdmin({ ...editingAdmin, role: e.target.value })}>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">SuperAdmin</option>
                                    <option value="developer">Developer</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '45px', marginTop: '0.5rem', borderRadius: '0.5rem', fontWeight: 800 }}>
                                {editingAdmin._id === 'NEW' ? 'Register Account' : 'Save Profiles'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- BOTTOM HELPER VIEWS --- */

const AdminsView = ({ admins, loading, onEdit, onDelete, onRegister, currentSemester }) => {
    const userRole = localStorage.getItem('role')?.toLowerCase();
    const canManageAdmins = ['developer', 'superadmin'].includes(userRole);

    const roleColors = {
        developer: { bg: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', border: 'rgba(167, 139, 250, 0.2)' },
        superadmin: { bg: 'rgba(248, 113, 113, 0.12)', color: '#f87171', border: 'rgba(248, 113, 113, 0.2)' },
        admin: { bg: 'rgba(37, 170, 225, 0.12)', color: '#25AAE1', border: 'rgba(37, 170, 225, 0.2)' },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s' }}>
            
            {/* Header Card */}
            <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(37, 170, 225, 0.12)', borderRadius: '1rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                            <Users size={28} color="#25AAE1" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>STAFF REGISTRY</div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>System Administrators</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Manage access privileges, credentials, and roles for Doulos</p>
                        </div>
                    </div>
                    {canManageAdmins && (
                        <button className="btn btn-primary" onClick={onRegister} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #25AAE1 0%, #175e82 100%) !important',
                            color: 'white', border: '1px solid rgba(37, 170, 225, 0.3) !important', borderRadius: '0.6rem',
                            fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 25px rgba(37, 170, 225, 0.15) !important'
                        }}>
                            <Plus size={18} /> Register Admin
                        </button>
                    )}
                </div>
            </div>

            {canManageAdmins ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Active Staff — {admins.length} accounts</span>
                    </div>

                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Syncing staff registry...</div>
                    ) : admins.length === 0 ? (
                        <div className="glass-card-premium" style={{ padding: '4rem', textAlign: 'center', background: '#0d111b', border: '1px dashed rgba(255,255,255,0.06)' }}>
                            No administrators registered yet.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                            {admins.map(a => {
                                const rc = roleColors[a.role] || roleColors.admin;
                                return (
                                    <div key={a._id} className="glass-card-premium" style={{
                                        background: '#0d111b',
                                        borderLeft: `4px solid ${rc.color}`,
                                        padding: '1.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1.25rem',
                                        transition: 'all 0.2s'
                                    }}
                                        onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: rc.bg, border: `1px solid ${rc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 900, color: rc.color }}>
                                                    {a.username?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>{a.username}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: '2px' }}>{a.campus || 'All Campuses'}</div>
                                                </div>
                                            </div>
                                            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {a.role}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                                            <button className="btn" onClick={() => onEdit(a)} style={{
                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                                padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255,255,255,0.03)', color: 'white',
                                                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', cursor: 'pointer'
                                            }}>
                                                <Pencil size={13} /> Edit Profile
                                            </button>
                                            <button className="btn" onClick={() => onDelete(a._id)} style={{
                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                                padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.05)', color: '#f87171',
                                                border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '0.5rem', cursor: 'pointer'
                                            }}>
                                                <Trash2 size={13} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card-premium" style={{ padding: '4rem', textAlign: 'center', background: '#0d111b', border: '1px dashed rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <ShieldAlert size={40} style={{ color: '#f87171', opacity: 0.3 }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Access Restricted</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', lineHeight: 1.5 }}>Only Developers and SuperAdmins are authorized to manage administrative system accounts.</p>
                </div>
            )}
        </div>
    );
};

const ReportsView = ({ meetings, members, onDownloadCSV, onDownloadCumulativeCSV }) => {
    const [reportType, setReportType] = useState('summary'); 
    const [filterSemester, setFilterSemester] = useState('Current');
    const [filterCampus, setFilterCampus] = useState('All');

    const getSemester = (date) => {
        const d = new Date(date);
        const month = d.getMonth(); 
        const year = d.getFullYear();
        if (month <= 4) return `Jan Semester ${year}`;
        if (month <= 7) return `May Semester ${year}`;
        return `Sept Semester ${year}`;
    };

    const currentSemester = getSemester(new Date());
    const semesters = Array.from(new Set(meetings.map(m => getSemester(m.date))));
    if (!semesters.includes(currentSemester)) semesters.push(currentSemester);

    const filteredMeetings = meetings.filter(m => {
        const semesterMatch = filterSemester === 'All' ||
            (filterSemester === 'Current' ? getSemester(m.date) === currentSemester : getSemester(m.date) === filterSemester);
        const campusMatch = filterCampus === 'All' || m.campus === filterCampus;
        return semesterMatch && campusMatch;
    });

    const totalAttendance = filteredMeetings.reduce((acc, m) => acc + (m.attendees || 0), 0);
    const averageAttendance = filteredMeetings.length > 0 ? (totalAttendance / filteredMeetings.length).toFixed(1) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s ease-out' }}>
            
            {/* Header Card */}
            <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(37, 170, 225, 0.12)', borderRadius: '1rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                            <FileSpreadsheet size={28} color="#25AAE1" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>Reports & Analytics</h2>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Compile, view, and export cumulative attendance statistics</p>
                        </div>
                    </div>
                    
                    {/* Filters dropdowns */}
                    <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '0.75rem' }}>
                        <select
                            className="modern-input"
                            style={{ padding: '0.5rem 1rem', width: 'auto', border: 'none', background: 'rgba(255,255,255,0.03)', fontSize: '0.8rem', fontWeight: 700 }}
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                        >
                            <option value="Current">This Semester</option>
                            <option value="All">All Time</option>
                            {semesters.filter(s => s !== currentSemester).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            className="modern-input"
                            style={{ padding: '0.5rem 1rem', width: 'auto', border: 'none', background: 'rgba(255,255,255,0.03)', fontSize: '0.8rem', fontWeight: 700 }}
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                        >
                            <option value="All">All Campuses</option>
                            <option value="Athi River">Athi River</option>
                            <option value="Valley Road">Valley Road</option>
                        </select>
                    </div>
                </div>

                {/* Sub Tab Controls */}
                <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                    <button
                        onClick={() => setReportType('summary')}
                        style={{
                            padding: '0.5rem 1.25rem',
                            background: reportType === 'summary' ? 'rgba(37, 170, 225, 0.12)' : 'transparent',
                            color: reportType === 'summary' ? '#25AAE1' : 'rgba(255,255,255,0.4)',
                            border: reportType === 'summary' ? '1px solid rgba(37, 170, 225, 0.2)' : '1px solid transparent',
                            fontSize: '0.78rem', fontWeight: 800, borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                        }}
                    >
                        <FileText size={15} /> Sessions Summary
                    </button>
                    <button
                        onClick={() => setReportType('cumulative')}
                        style={{
                            padding: '0.5rem 1.25rem',
                            background: reportType === 'cumulative' ? 'rgba(37, 170, 225, 0.12)' : 'transparent',
                            color: reportType === 'cumulative' ? '#25AAE1' : 'rgba(255,255,255,0.4)',
                            border: reportType === 'cumulative' ? '1px solid rgba(37, 170, 225, 0.2)' : '1px solid transparent',
                            fontSize: '0.78rem', fontWeight: 800, borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                        }}
                    >
                        <Users size={15} /> Cumulative Rosters
                    </button>
                </div>
            </div>

            {reportType === 'summary' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    
                    {/* Stat Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                        <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #25AAE1', background: '#0d111b' }}>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>TOTAL ATTENDED</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginTop: '0.5rem' }}>{totalAttendance}</div>
                        </div>
                        <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #a78bfa', background: '#0d111b' }}>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>SESSIONS COUNT</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginTop: '0.5rem' }}>{filteredMeetings.length}</div>
                        </div>
                        <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #4ade80', background: '#0d111b' }}>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>AVERAGE PARTICIPATION</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4ade80', marginTop: '0.5rem' }}>{averageAttendance}</div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="glass-card-premium" style={{ padding: '1.5rem', background: '#0d111b' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                                        <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Session Title</th>
                                        <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Campus</th>
                                        <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Attendance</th>
                                        <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMeetings.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                                No reports available for the specified range.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMeetings.map(m => (
                                            <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>{new Date(m.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.88rem', fontWeight: 600 }}>{m.name}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{m.campus}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ color: '#25AAE1', fontWeight: 900, background: 'rgba(37,170,225,0.1)', border: '1px solid rgba(37,170,225,0.15)', padding: '0.25rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>{m.attendees || 0}</span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button onClick={() => onDownloadCSV(m._id, m.name)} className="btn" style={{ fontSize: '0.75rem', padding: '0.45rem 1rem', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>
                                                        Download CSV
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-card-premium" style={{ background: '#0d111b', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.15)', borderRadius: '50%', color: '#4ade80' }}>
                            <FileSpreadsheet size={40} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Cumulative Term Report</h3>
                            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginTop: '0.5rem' }}>
                                Compile all meeting attendance logs for the selected filters into a unified spreadsheet. Ideal for calculating student growth, term-end points, and honors.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{
                                background: 'linear-gradient(135deg, #4ade80 0%, #15803d 100%) !important',
                                color: 'white', fontWeight: 800, padding: '0.85rem 2rem', width: '100%', borderRadius: '0.6rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                border: '1px solid rgba(74, 222, 128, 0.3) !important',
                                boxShadow: '0 8px 25px rgba(74, 222, 128, 0.15) !important'
                            }}
                            onClick={() => {
                                onDownloadCumulativeCSV(members, filterSemester === 'Current' ? currentSemester : filterSemester);
                            }}
                        >
                            <Download size={16} /> Compile & Export Cumulative Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeedbackView = ({ isGuest }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchFeedbacks = async () => {
        setLoading(true);
        if (isGuest) {
            setFeedbacks([
                { _id: '1', name: 'Guest User', message: 'I love the new dashboard design!', category: 'general', status: 'new', createdAt: new Date().toISOString() },
                { _id: '2', name: 'Anonymous', message: 'Can you add a dark mode toggle?', category: 'feature_request', status: 'read', createdAt: new Date(Date.now() - 86400000).toISOString() }
            ]);
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/feedback');
            setFeedbacks(res.data);
        } catch (err) {
            console.error('Failed to fetch feedback', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, [isGuest]);

    const handleStatusUpdate = async (id, newStatus) => {
        if (isGuest) return alert('Action disabled in Guest Mode');
        const originalFeedbacks = [...feedbacks];
        setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, status: newStatus } : f));
        try {
            await api.patch(`/feedback/${id}`, { status: newStatus });
        } catch (err) {
            alert('Failed to update status');
            setFeedbacks(originalFeedbacks);
        }
    };

    const handleDelete = async (id) => {
        if (isGuest) return alert('Action disabled in Guest Mode');
        if (!window.confirm('Delete this feedback?')) return;
        try {
            await api.delete(`/feedback/${id}`);
            setFeedbacks(prev => prev.filter(f => f._id !== id));
        } catch (err) {
            alert('Failed to delete feedback');
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => filter === 'all' || f.status === filter);

    const statusMeta = {
        new: { color: '#facc15', bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.2)', label: 'NEW' },
        read: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', label: 'READ' },
        resolved: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', label: 'RESOLVED' }
    };

    if (loading) return (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#facc15', borderRadius: '50%' }} />
            <div>Syncing Feedback Cloud...</div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s' }}>
            
            {/* Header Card */}
            <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(250, 204, 21, 0.12)', borderRadius: '1rem', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
                            <Lightbulb size={28} color="#facc15" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#facc15', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>COMMUNITY VOICE</div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>User Feedback</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>{feedbacks.length} total submissions · {feedbacks.filter(f => f.status === 'new').length} unread</p>
                        </div>
                    </div>
                    
                    {/* Status capsule filters */}
                    <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '0.75rem', flexWrap: 'wrap' }}>
                        {['all', 'new', 'read', 'resolved'].map(s => {
                            const isActive = filter === s;
                            const sm = statusMeta[s] || { color: '#25AAE1', bg: 'rgba(37, 170, 225, 0.12)' };
                            return (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    style={{
                                        padding: '0.5rem 1.1rem', borderRadius: '0.5rem', cursor: 'pointer',
                                        background: isActive ? (s === 'all' ? 'rgba(37, 170, 225, 0.12)' : sm.bg) : 'transparent',
                                        color: isActive ? (s === 'all' ? '#25AAE1' : sm.color) : 'rgba(255,255,255,0.4)',
                                        border: isActive ? `1px solid ${s === 'all' ? 'rgba(37, 170, 225, 0.2)' : sm.border}` : '1px solid transparent',
                                        fontWeight: 800, fontSize: '0.78rem', textTransform: 'capitalize', transition: 'all 0.2s'
                                    }}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {filteredFeedbacks.length === 0 ? (
                <div className="glass-card-premium" style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0d111b', border: '1px dashed rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '50%', color: 'rgba(255,255,255,0.15)' }}>
                        <Lightbulb size={40} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>No Feedback Found</div>
                        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>There are no messages matching the selected status filters.</div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {filteredFeedbacks.map(f => {
                        const sm = statusMeta[f.status] || statusMeta.read;
                        return (
                            <div key={f._id} className="glass-card-premium" style={{
                                borderLeft: `4px solid ${sm.color}`,
                                background: '#0d111b',
                                padding: '1.5rem',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                                onMouseEnter={el => { el.currentTarget.style.boxShadow = `0 12px 25px ${sm.bg}`; }}
                                onMouseLeave={el => { el.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle, ${sm.bg} 0%, transparent 70%)`, opacity: 0.5, pointerEvents: 'none' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap', position: 'relative' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: sm.bg, border: `1px solid ${sm.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: sm.color }}>
                                                {(f.name || 'A').charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'white' }}>{f.name || 'Anonymous Member'}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.65rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {f.category?.replace('_', ' ')}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.65rem', borderRadius: '1rem', background: sm.bg, color: sm.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', border: `1px solid ${sm.border}` }}>
                                                {sm.label}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{f.message}</p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: '220px', justifyContent: 'flex-end' }}>
                                        <select
                                            value={f.status}
                                            onChange={(e) => handleStatusUpdate(f._id, e.target.value)}
                                            className="modern-input"
                                            style={{
                                                padding: '0.45rem 1rem', fontSize: '0.75rem', fontWeight: 800, width: '120px', border: '1px solid rgba(255,255,255,0.06)'
                                            }}
                                        >
                                            <option value="new">Mark New</option>
                                            <option value="read">Mark Read</option>
                                            <option value="resolved">Mark Resolved</option>
                                        </select>
                                        <button
                                            onClick={() => handleDelete(f._id)}
                                            className="btn"
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#f87171',
                                                cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', borderRadius: '0.5rem', transition: 'all 0.2s', fontWeight: 800
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
