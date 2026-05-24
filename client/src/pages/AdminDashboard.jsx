import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import {
    Users, BarChart3, Sun, Moon, Link as LinkIcon, ExternalLink,
    ShieldAlert, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, Check, X,
    FileText, ListChecks, Settings as SettingsIcon, CheckCircle, LayoutDashboard,
    Calendar, Clock, Trash2, ShieldAlert as Ghost, Lightbulb, MessageCircle,
    GraduationCap, Wallet, Pencil, Plus, Download, FileSpreadsheet, Star,
    Activity, LogOut
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
import ActivitiesTab from '../components/dashboard/ActivitiesTab';
import ReportsTab from '../components/dashboard/ReportsTab';

const AdminDashboard = () => {
    const location = useLocation();
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    const mainContentRef = useRef(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeTab]);

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
                <aside className="sidebar" style={{ 
                    width: sidebarCollapsed ? '78px' : '290px', 
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    flexShrink: 0, 
                    padding: sidebarCollapsed ? '1.75rem 0.5rem' : '1.75rem 1.25rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.5rem',
                    overflowX: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', gap: '0.85rem', paddingLeft: sidebarCollapsed ? '0' : '0.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ animation: 'rotateLogo 60s linear infinite', flexShrink: 0 }}>
                                <Logo size={38} showText={false} />
                            </div>
                            {!sidebarCollapsed && (
                                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                    <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.5px' }}>DOULOS</h1>
                                    <span style={{ fontSize: '0.6rem', color: '#25AAE1', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>G9 Control Panel</span>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '50%', 
                                width: '28px', 
                                height: '28px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer', 
                                color: 'white',
                                transition: 'all 0.2s',
                                padding: 0
                            }}
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>
                    </div>

                    {/* Premium Welcome Card in Sidebar */}
                    <div className="sidebar-profile-card" style={{ padding: sidebarCollapsed ? '0.75rem 0.25rem' : '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: sidebarCollapsed ? 'center' : 'stretch', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: sidebarCollapsed ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #25AAE1 0%, #175e82 100%)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: 'white', boxShadow: '0 0 15px rgba(37, 170, 225, 0.25)' }}>
                                {userRole.charAt(0).toUpperCase()}
                            </div>
                            <button className="btn-icon" onClick={() => setIsDarkMode(!isDarkMode)} title={isDarkMode ? "Toggle Light Theme" : "Toggle Dark Theme"} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: 'white' }}>
                                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                            </button>
                        </div>
                        {!sidebarCollapsed && (
                            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white', lineHeight: 1.35 }}>
                                    Welcome back,<br />Leader!
                                </h2>
                            </div>
                        )}
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                        {!sidebarCollapsed && <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>REGISTRY CONTROL</div>}
                        {[
                            { id: 'meetings', label: 'Meetings & Scans', icon: LayoutDashboard },
                            { id: 'trainings', label: 'Trainings & Radius', icon: GraduationCap },
                            { id: 'members', label: 'Members Registry', icon: Users },
                            { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                            { id: 'finance', label: 'Financial Control', icon: Wallet },
                            { id: 'events', label: 'Events Scheduler', icon: Calendar },
                            { id: 'activities', label: 'Activities & Groups', icon: Activity },
                            { id: 'feedback', label: 'Community Feedback', icon: MessageCircle }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`sidebar-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: sidebarCollapsed ? '0' : '0.85rem', padding: sidebarCollapsed ? '0.75rem' : '0.7rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
                                title={sidebarCollapsed ? t.label : ''}
                            >
                                <t.icon size={17} style={{ flexShrink: 0 }} />
                                {!sidebarCollapsed && <span>{t.label}</span>}
                            </button>
                        ))}

                        {!sidebarCollapsed && <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '1.25rem', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>SYSTEM CONFIG</div>}
                        {[
                            { id: 'admins', label: 'Staff Admins', icon: ShieldAlert },
                            { id: 'system', label: 'System Settings', icon: SettingsIcon }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`sidebar-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: sidebarCollapsed ? '0' : '0.85rem', padding: sidebarCollapsed ? '0.75rem' : '0.7rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
                                title={sidebarCollapsed ? t.label : ''}
                            >
                                <t.icon size={17} style={{ flexShrink: 0 }} />
                                {!sidebarCollapsed && <span>{t.label}</span>}
                            </button>
                        ))}
                        {['superadmin', 'developer'].includes(userRole?.toLowerCase()) && (
                            <button
                                onClick={() => setActiveTab('observability')}
                                className={`sidebar-nav-btn ${activeTab === 'observability' ? 'active' : ''}`}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: sidebarCollapsed ? '0' : '0.85rem', padding: sidebarCollapsed ? '0.75rem' : '0.7rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: activeTab === 'observability' ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
                                title={sidebarCollapsed ? "System Observability" : ""}
                            >
                                <Activity size={17} style={{ flexShrink: 0 }} />
                                {!sidebarCollapsed && <span>System Observability</span>}
                            </button>
                        )}
                    </nav>

                    {/* Glowing CTA Upgrade Card like mockup */}
                    <div className="sidebar-cta-card" style={{ padding: sidebarCollapsed ? '0.75rem 0.25rem' : '1rem 0.85rem', display: 'flex', flexDirection: 'column', alignItems: sidebarCollapsed ? 'center' : 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: sidebarCollapsed ? '0' : '0.5rem' }} title={`Active Semester: ${currentSemester}`}>
                            <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24', animation: 'pulse 2s infinite', flexShrink: 0 }} />
                            {!sidebarCollapsed && <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.75px', textTransform: 'uppercase', color: 'white' }}>ACTIVE SEMESTER</span>}
                        </div>
                        {!sidebarCollapsed && (
                            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'white', marginBottom: '0.2rem' }}>
                                    {currentSemester}
                                </div>
                                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontStyle: 'italic' }}>
                                    Geofenced points tracking online.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom User Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', alignItems: sidebarCollapsed ? 'center' : 'stretch' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: sidebarCollapsed ? '0' : '0.25rem' }} title={`Administrator (${userRole})`}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#94a3b8', flexShrink: 0 }}>
                                G9
                            </div>
                            {!sidebarCollapsed && (
                                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>Administrator</div>
                                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{userRole}</span>
                                </div>
                            )}
                        </div>
                        <button className="btn btn-sign-out" style={{ padding: sidebarCollapsed ? '0.5rem 0' : '0.6rem', borderRadius: '0.6rem', fontWeight: 800, fontSize: '0.75rem', width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={handleLogout} title="Sign Out System">
                            {sidebarCollapsed ? '✕' : 'SIGN OUT SYSTEM'}
                        </button>
                    </div>
                </aside>

                {/* Main panel */}
                <main className="main-content" ref={mainContentRef} style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
                    
                    {/* Mobile-only header bar styled like student portal */}
                    <div className="admin-mobile-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #25AAE1, #021525)', border: '2px solid rgba(37,170,225,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', color: 'white', flexShrink: 0 }}>
                                {userRole.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {activeTab === 'meetings' ? 'Meetings & Scans' : 
                                     activeTab === 'trainings' ? 'Trainings & Radius' : 
                                     activeTab === 'members' ? 'Members Registry' : 
                                     activeTab === 'reports' ? 'Reports & Analytics' : 
                                     activeTab === 'finance' ? 'Financial Systems' : 
                                     activeTab === 'events' ? 'Events Scheduler' : 
                                     activeTab === 'activities' ? 'Activities & Groups' : 
                                     activeTab === 'feedback' ? 'Community Feedback' : 
                                     activeTab === 'admins' ? 'Staff Administrators' : 
                                     activeTab === 'system' ? 'System Configurations' : 
                                     activeTab === 'observability' ? 'System Observability' : 'Admin Panel'}
                                </div>
                                <div style={{ fontSize: '0.62rem', color: '#25AAE1', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{userRole} Mode</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '0.5rem', color: '#f87171', padding: '0.4rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.5px', flexShrink: 0 }}>
                            <LogOut size={12} /> SIGN OUT
                        </button>
                    </div>

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
                                 activeTab === 'activities' ? 'Activities & Groups' : 
                                 activeTab === 'feedback' ? 'Community Feedback' : 
                                 activeTab === 'admins' ? 'Staff Administrators' : 
                                 activeTab === 'system' ? 'System Configurations' : 
                                 activeTab === 'observability' ? 'System Observability' : 'Management Suite'}
                            </h1>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            {/* Public Portal Button Removed */}
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
                    ) : activeTab === 'activities' ? (
                        <ActivitiesTab
                            members={members}
                            fetchMembers={fetchMembers}
                            isGuest={isGuest}
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
                            userRole={userRole}
                        />
                    ) : activeTab === 'reports' ? (
                        <ReportsTab
                            meetings={meetings}
                            members={members}
                            onDownloadCSV={downloadCSV}
                            onDownloadCumulativeCSV={downloadCumulativeCSV}
                            isGuest={isGuest}
                            api={api}
                            setMsg={setMsg}
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

            {/* Premium Mobile Bottom Styles */}
            <style>{`
                @media (max-width: 768px) {
                    .sidebar {
                        display: none !important;
                    }
                    .dashboard-layout {
                        flex-direction: column !important;
                        min-height: 100vh !important;
                    }
                    .main-content {
                        padding: 1.25rem 1rem 6.5rem !important;
                        min-width: 0 !important;
                        overflow-y: auto !important;
                    }
                    header {
                        display: none !important; /* Hide desktop header on mobile */
                    }
                    .admin-mobile-header {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        background: rgba(9, 29, 46, 0.85) !important;
                        backdrop-filter: blur(15px) !important;
                        -webkit-backdrop-filter: blur(15px) !important;
                        padding: 0.75rem 1rem !important;
                        border-radius: 1rem !important;
                        border: 1px solid rgba(37, 170, 225, 0.15) !important;
                        margin-bottom: 1.5rem !important;
                        position: sticky !important;
                        top: 0 !important;
                        z-index: 200 !important;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35) !important;
                    }
                    .admin-mobile-bottom-nav {
                        display: flex !important;
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        background: #090c14 !important;
                        border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
                        padding: 0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom)) !important;
                        justify-content: space-around !important;
                        align-items: center !important;
                        z-index: 1000 !important;
                        box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5) !important;
                        backdrop-filter: blur(20px) !important;
                        -webkit-backdrop-filter: blur(20px) !important;
                    }
                    .admin-mobile-tab-btn {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 0.25rem !important;
                        background: none !important;
                        border: none !important;
                        color: rgba(255, 255, 255, 0.4) !important;
                        cursor: pointer !important;
                        font-size: 0.65rem !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.5px !important;
                        text-transform: uppercase !important;
                        padding: 0.4rem 0.6rem !important;
                        border-radius: 0.5rem !important;
                        transition: all 0.2s !important;
                        flex: 1 !important;
                        font-family: 'Outfit', sans-serif !important;
                    }
                    .admin-mobile-tab-btn.active {
                        color: #25AAE1 !important;
                    }
                    .admin-mobile-tab-btn:active {
                        transform: scale(0.95) !important;
                    }
                }
                @media (min-width: 769px) {
                    .admin-mobile-bottom-nav {
                        display: none !important;
                    }
                    .admin-mobile-header {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Bottom Mobile Navbar */}
            <div className="admin-mobile-bottom-nav">
                <button 
                    className={`admin-mobile-tab-btn ${activeTab === 'meetings' ? 'active' : ''}`} 
                    onClick={() => {
                        setActiveTab('meetings');
                        setShowMoreMenu(false);
                    }}
                >
                    <LayoutDashboard size={20} />
                    <span>Meetings</span>
                </button>
                <button 
                    className={`admin-mobile-tab-btn ${activeTab === 'members' ? 'active' : ''}`} 
                    onClick={() => {
                        setActiveTab('members');
                        setShowMoreMenu(false);
                    }}
                >
                    <Users size={20} />
                    <span>Members</span>
                </button>
                <button 
                    className={`admin-mobile-tab-btn ${activeTab === 'reports' ? 'active' : ''}`} 
                    onClick={() => {
                        setActiveTab('reports');
                        setShowMoreMenu(false);
                    }}
                >
                    <BarChart3 size={20} />
                    <span>Reports</span>
                </button>
                <button 
                    className={`admin-mobile-tab-btn ${['meetings', 'members', 'reports'].includes(activeTab) ? '' : 'active'}`} 
                    onClick={() => setShowMoreMenu(true)}
                >
                    <SettingsIcon size={20} />
                    <span>More</span>
                </button>
            </div>

            {/* "More" Bottom Sheet Overlay Drawer */}
            {showMoreMenu && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(5, 7, 12, 0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        animation: 'fadeIn 0.25s ease-out'
                    }}
                    onClick={() => setShowMoreMenu(false)}
                >
                    <div 
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            background: '#0d111b',
                            borderTopLeftRadius: '2rem',
                            borderTopRightRadius: '2rem',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderBottom: 'none',
                            padding: '2rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom))',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            boxShadow: '0 -15px 40px rgba(0,0,0,0.6)',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '1.5px', textTransform: 'uppercase' }}>G9 Control Panel</span>
                                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>More Management Tools</h3>
                            </div>
                            <button 
                                onClick={() => setShowMoreMenu(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    padding: '0.5rem',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', margin: '0.25rem 0' }}>
                            {[
                                { id: 'trainings', label: 'Trainings', icon: GraduationCap },
                                { id: 'finance', label: 'Finance', icon: Wallet },
                                { id: 'events', label: 'Events', icon: Calendar },
                                { id: 'activities', label: 'Activities', icon: Activity },
                                { id: 'feedback', label: 'Feedback', icon: MessageCircle },
                                { id: 'admins', label: 'Admins', icon: ShieldAlert },
                                { id: 'system', label: 'Settings', icon: SettingsIcon },
                                ...( ['superadmin', 'developer'].includes(userRole?.toLowerCase()) ? [{ id: 'observability', label: 'Observe', icon: Activity }] : [] )
                            ].map(item => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setShowMoreMenu(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.8rem 0.5rem',
                                            borderRadius: '1rem',
                                            background: isActive ? 'rgba(37,170,225,0.12)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${isActive ? 'rgba(37,170,225,0.3)' : 'rgba(255,255,255,0.04)'}`,
                                            color: isActive ? '#25AAE1' : '#94a3b8',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontFamily: "'Outfit', sans-serif"
                                        }}
                                    >
                                        <item.icon size={20} style={{ color: isActive ? '#25AAE1' : '#64748b' }} />
                                        <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button 
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '0.85rem',
                                color: '#f87171',
                                fontSize: '0.82rem',
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                letterSpacing: '1px'
                            }}
                        >
                            <LogOut size={15} /> SIGN OUT SYSTEM
                        </button>
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
