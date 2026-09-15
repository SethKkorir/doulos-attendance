import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import G5MeetingModal from '../components/G5MeetingModal';
import CampScheduleStudio from '../components/dashboard/CampScheduleStudio';
import '../styles/g5Portal.css';
import {
    LayoutDashboard,
    CalendarCheck,
    Calendar,
    Compass,
    GraduationCap,
    Award,
    Users,
    CreditCard,
    ShieldAlert,
    Search,
    Bell,
    LogOut,
    Plus,
    CheckCircle2,
    Clock,
    MapPin,
    AlertTriangle,
    Star,
    Check,
    X,
    ExternalLink,
    Download,
    FileText,
    MessageCircle,
    ChevronRight,
    Sparkles,
    Shield,
    Tent,
    Sliders,
    ArrowUpRight,
    RefreshCw,
    Settings,
    Lightbulb,
    Radio,
    Navigation,
    Crosshair,
    Layers
} from 'lucide-react';

const G5TrainingPortal = () => {
    const navigate = useNavigate();

    // Active Navigation Tab (9 items strictly)
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [campusFilter, setCampusFilter] = useState('All');
    const [toast, setToast] = useState(null);

    // Profile info
    const username = localStorage.getItem('username') || 'g5_training';
    const userRole = localStorage.getItem('role') || 'trainer';
    const userCampus = localStorage.getItem('campus') || 'Athi River';

    // Data states
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [cadres, setCadres] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [trainings, setTrainings] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [absenteeMembers, setAbsenteeMembers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [gearAssets, setGearAssets] = useState([]);
    const [campProgram, setCampProgram] = useState(null);

    // Modals
    const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
    const [insightMeeting, setInsightMeeting] = useState(null);
    const [newMeetingForm, setNewMeetingForm] = useState({
        name: 'Weekly Doulos',
        campus: 'Athi River',
        date: new Date().toISOString().split('T')[0],
        startTime: '20:30',
        endTime: '23:00',
        questionType: 'text',
        questionOfDay: '',
        questionOptions: ['', ''],
        location: {
            name: 'Doulos Store',
            radius: 200,
            latitude: -1.44800,
            longitude: 37.01500
        }
    });
    const [meetingCreating, setMeetingCreating] = useState(false);
    const [gpsCapturing, setGpsCapturing] = useState(false);

    const VENUE_PRESETS = [
        {
            title: 'Doulos Store',
            sub: 'Athi River Campus',
            name: 'Doulos Store',
            campus: 'Athi River',
            lat: -1.44800,
            lng: 37.01500,
            radius: 200
        },
        {
            title: 'DAC 506',
            sub: 'Nairobi Campus (Valley Road)',
            name: 'DAC 506',
            campus: 'Valley Road',
            lat: -1.29210,
            lng: 36.80730,
            radius: 200
        }
    ];

    const applyVenuePreset = (preset) => {
        setNewMeetingForm(prev => ({
            ...prev,
            campus: preset.campus,
            location: {
                name: preset.name,
                radius: preset.radius,
                latitude: preset.lat,
                longitude: preset.lng
            }
        }));
        showToast(`Venue set to ${preset.name} (${preset.campus})`);
    };

    const [showReportIncidentModal, setShowReportIncidentModal] = useState(false);
    const [incidentForm, setIncidentForm] = useState({
        title: '',
        severity: 'Near-Miss',
        location: 'Freedom Base',
        campus: 'Athi River',
        description: '',
        correctiveActionPlan: ''
    });
    const [incidentSubmitting, setIncidentSubmitting] = useState(false);

    // Promotion Scoring State for selected candidate
    const [promotionScores, setPromotionScores] = useState({});

    const showToast = (msg, type = 'success') => {
        setToast({ text: msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/admin');
    };

    // Load portal data
    const fetchPortalData = async () => {
        setLoading(true);
        try {
            const [
                membersRes,
                cadresRes,
                meetingsRes,
                trainingsRes,
                incidentsRes,
                absenceRes,
                paymentsRes,
                assetsRes,
                campProgramRes
            ] = await Promise.allSettled([
                api.get('/members'),
                api.get('/trainings/cadres'),
                api.get('/meetings'),
                api.get('/trainings'),
                api.get('/council/incidents'),
                api.get('/council/absence-radar'),
                api.get('/payments/all'),
                api.get('/council/assets'),
                api.get('/trainings/camp-program?campus=Both')
            ]);

            if (membersRes.status === 'fulfilled') {
                setMembers(membersRes.value.data || []);
            }
            if (cadresRes.status === 'fulfilled') {
                setCadres(cadresRes.value.data?.members || []);
            }
            if (meetingsRes.status === 'fulfilled') {
                setMeetings(meetingsRes.value.data || []);
            }
            if (trainingsRes.status === 'fulfilled') {
                setTrainings(trainingsRes.value.data || []);
            }
            if (incidentsRes.status === 'fulfilled') {
                setIncidents(incidentsRes.value.data || []);
            }
            if (absenceRes.status === 'fulfilled') {
                setAbsenteeMembers(absenceRes.value.data?.members || []);
            }
            if (paymentsRes.status === 'fulfilled') {
                setPayments(paymentsRes.value.data || []);
            }
            if (assetsRes.status === 'fulfilled') {
                setGearAssets(assetsRes.value.data || []);
            }
            if (campProgramRes.status === 'fulfilled') {
                setCampProgram(campProgramRes.value.data || null);
            }
        } catch (err) {
            console.error('Failed to load portal data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortalData();
    }, []);

    const recruits = members.filter(m => m.memberType === 'Recruit' || m.status === 'Recruit');
    const eligibleRecruits = recruits.filter(r => (r.totalPoints || 0) >= 30 || r.consecutiveAbsences === 0);
    const readyToGraduate = recruits.length > 0 ? (eligibleRecruits.length > 0 ? eligibleRecruits : recruits.slice(0, 8)) : [];

    const totalAttended = meetings.reduce((sum, m) => sum + (m.attendanceCount || 0), 0);
    const totalExpected = meetings.length > 0 && members.length > 0 ? meetings.length * members.length : 0;
    const attendancePercentage = totalExpected > 0 ? Math.min(100, Math.round((totalAttended / totalExpected) * 100)) : 0;

    // GPS Geolocation Capture
    const handleCaptureGps = () => {
        if (!navigator.geolocation) {
            showToast('GPS geolocation is not supported by your browser', 'error');
            return;
        }
        setGpsCapturing(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsCapturing(false);
                setNewMeetingForm(prev => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        latitude: parseFloat(pos.coords.latitude.toFixed(6)),
                        longitude: parseFloat(pos.coords.longitude.toFixed(6))
                    }
                }));
                showToast(`GPS captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            },
            (err) => {
                setGpsCapturing(false);
                console.error('GPS error:', err);
                showToast('GPS permission denied or unavailable', 'error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Helper: calculate Monday-Sunday week range for date
    const getWeekRangeClient = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        const day = d.getDay(); // 0 = Sun, 1 = Mon...
        const diff = (day === 0 ? -6 : 1 - day);
        const start = new Date(d);
        start.setDate(d.getDate() + diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    // Check if a meeting already exists for this campus in the selected week
    const existingConflictMeeting = useMemo(() => {
        if (!newMeetingForm.date || !newMeetingForm.campus) return null;
        const range = getWeekRangeClient(newMeetingForm.date);
        if (!range) return null;
        return meetings.find(m => {
            if (m.campus !== newMeetingForm.campus) return false;
            const mDate = new Date(m.date);
            return mDate >= range.start && mDate <= range.end;
        });
    }, [newMeetingForm.date, newMeetingForm.campus, meetings]);

    // Meeting Creation handler (Full Session Details & Geofencing)
    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        if (existingConflictMeeting) {
            showToast(`Policy restriction: A meeting is already scheduled for ${newMeetingForm.campus} this week`, 'error');
            return;
        }
        setMeetingCreating(true);
        try {
            const payload = {
                name: newMeetingForm.name,
                date: newMeetingForm.date,
                campus: newMeetingForm.campus,
                startTime: newMeetingForm.startTime,
                endTime: newMeetingForm.endTime,
                semester: 'MAY-AUG 2026',
                questionType: newMeetingForm.questionType,
                questionOfDay: newMeetingForm.questionOfDay,
                questionOptions: (newMeetingForm.questionType === 'multiple_choice' || newMeetingForm.questionType === 'checkboxes')
                    ? newMeetingForm.questionOptions.filter(o => o && o.trim())
                    : [],
                location: {
                    name: newMeetingForm.location.name,
                    radius: Number(newMeetingForm.location.radius) || 200,
                    latitude: Number(newMeetingForm.location.latitude),
                    longitude: Number(newMeetingForm.location.longitude)
                }
            };
            const res = await api.post('/meetings', payload);
            showToast('Meeting session created successfully!');
            setShowNewMeetingModal(false);
            setMeetings(prev => [res.data || payload, ...prev]);
        } catch (err) {
            console.error('Meeting creation failed:', err);
            showToast(err.response?.data?.message || 'Could not schedule meeting', 'error');
        } finally {
            setMeetingCreating(false);
        }
    };

    // Single Recruit Graduation
    const handleGraduateSingle = async (recruit) => {
        try {
            await api.post(`/members/${recruit._id}/graduate`);
            showToast(`🎉 Hallelujah! ${recruit.name} has graduated to Douloid!`);
            setMembers(prev => prev.map(m => m._id === recruit._id ? { ...m, memberType: 'Douloid' } : m));
        } catch (err) {
            console.error('Graduation error:', err);
            showToast(err.response?.data?.message || 'Failed to graduate recruit', 'error');
        }
    };

    // Bulk Graduation
    const handleGraduateCohort = async () => {
        if (!readyToGraduate.length) return;
        if (!window.confirm(`Graduate all ${readyToGraduate.length} ready recruits to Douloids?`)) return;

        try {
            const ids = readyToGraduate.map(r => r._id);
            await api.post('/members/bulk-graduate', { memberIds: ids });
            showToast(`🎉 Spectacular milestone! ${readyToGraduate.length} recruits have officially graduated!`);
            setMembers(prev => prev.map(m => ids.includes(m._id) ? { ...m, memberType: 'Douloid' } : m));
        } catch (err) {
            console.error('Cohort graduation failed:', err);
            showToast('Failed to graduate cohort', 'error');
        }
    };

    // Confirm Rank Promotion
    const handleConfirmPromotion = async (cadre, nextRank) => {
        try {
            const scores = promotionScores[cadre._id] || { team: 4, ropes: 4, base: 4, rescue: 4, firstAid: 4 };
            await api.put(`/trainings/members/${cadre._id}/rank`, {
                douloidRank: nextRank,
                belayStatus: cadre.belayStatus || 'Secondary Belayer',
                soloStationAllowed: nextRank === 'Intermediate Douloid' || nextRank === 'Lead Douloid',
                notes: `Promoted through G5 5-Domain Evaluation. Avg Score: ${Object.values(scores).reduce((a,b)=>a+b,0)/5}`,
                promotedBy: username
            });
            showToast(`🌟 Promoted ${cadre.name} to ${nextRank}!`);
            setCadres(prev => prev.map(c => c._id === cadre._id ? { ...c, douloidRank: nextRank } : c));
        } catch (err) {
            console.error('Promotion error:', err);
            showToast(err.response?.data?.message || 'Failed to update rank', 'error');
        }
    };

    // Report Incident
    const handleReportIncident = async (e) => {
        e.preventDefault();
        setIncidentSubmitting(true);
        try {
            const res = await api.post('/council/incidents', {
                ...incidentForm,
                investigator: username
            });
            showToast('Safety incident logged with root-cause action plan');
            setShowReportIncidentModal(false);
            setIncidents(prev => [res.data.incident || incidentForm, ...prev]);
            setIncidentForm({
                title: '',
                severity: 'Near-Miss',
                location: 'Freedom Base',
                campus: 'Athi River',
                description: '',
                correctiveActionPlan: ''
            });
        } catch (err) {
            console.error('Incident report error:', err);
            showToast('Failed to submit incident report', 'error');
        } finally {
            setIncidentSubmitting(false);
        }
    };

    // Promotion helper
    const getNextRank = (currentRank) => {
        switch (currentRank) {
            case 'Shadow Douloid': return 'Basic Douloid';
            case 'Basic Douloid': return 'Intermediate Douloid';
            case 'Intermediate Douloid': return 'Lead Douloid';
            default: return 'Lead Douloid (Senior)';
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 'Lead Douloid': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
            case 'Intermediate Douloid': return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
            case 'Basic Douloid': return { bg: '#E0E7FF', text: '#4F46E5', border: '#C7D2FE' };
            case 'Shadow Douloid': return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
            default: return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
        }
    };

    // 9 Sidebar Items
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'meetings', label: 'Meetings', icon: Calendar },
        { id: 'trainings_camps', label: 'Trainings & Camps', icon: Compass },
        { id: 'graduations', label: 'Recruit Graduations', icon: GraduationCap, badge: readyToGraduate.length },
        { id: 'promotions', label: 'Rank Promotions', icon: Award, badge: cadres.filter(c => c.douloidRank === 'Shadow Douloid' || c.douloidRank === 'Basic Douloid').length },
        { id: 'cadres', label: 'Cadre Roster', icon: Users },
        { id: 'contributions', label: 'Contributions', icon: CreditCard },
        { id: 'safety', label: 'Safety & Incidents', icon: ShieldAlert, badge: incidents.length > 0 ? incidents.length : null }
    ];

    // Standard LOPs
    const lops = [
        { id: 'LOP-01', title: 'High Ropes Belay Safety & Rigging SOP', code: 'LOP-SOP-01', desc: 'Double-check carabiner squeeze, dynamic rope lifespan, ground anchor inspection.' },
        { id: 'LOP-02', title: 'Wilderness Evacuation & Extrication Tree', code: 'LOP-MED-02', desc: 'Lukenya ridge stretcher dispatch, spine stabilization, Daystar clinic hotline.' },
        { id: 'LOP-03', title: 'Severe Weather & Lightning Shutdown', code: 'LOP-ENV-03', desc: '30-second flash-to-bang rule, immediate course clearance & safe zone dispersal.' },
        { id: 'LOP-04', title: 'Solo Station & Peer Coaching Clearance', code: 'LOP-CAD-04', desc: 'Prerequisites for Intermediate cadres operating zip line and pamper pole alone.' }
    ];

    return (
        <div className="g5-portal-root">
            {/* FIXED SIDEBAR */}
            <aside className="g5-sidebar">
                <div className="g5-sidebar-brand">
                    <div className="g5-brand-icon-box">
                        <Compass size={24} />
                    </div>
                    <div>
                        <div className="g5-brand-title">Doulos G5</div>
                        <div className="g5-brand-subtitle">Training Portal</div>
                    </div>
                </div>

                <nav className="g5-nav-list">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`g5-nav-btn ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveTab(item.id)}
                            >
                                <Icon size={19} />
                                <span>{item.label}</span>
                                {item.badge ? (
                                    <span className="g5-nav-badge">{item.badge}</span>
                                ) : null}
                            </button>
                        );
                    })}
                </nav>

                <div className="g5-sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="g5-avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                {username}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                {userCampus}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Sign Out"
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '0.4rem'
                        }}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* MAIN PORTAL WRAPPER */}
            <div className="g5-main-wrapper">
                {/* TOPBAR */}
                <header className="g5-topbar">
                    <div className="g5-search-wrap">
                        <Search size={17} />
                        <input
                            type="text"
                            placeholder="Search cadets, recruits, skills..."
                            className="g5-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="g5-topbar-actions">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-soft)', padding: '0.35rem 0.85rem', borderRadius: '999px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-status-active)' }}></span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                Outdoor Ministry Mode
                            </span>
                        </div>

                        <div className="g5-profile-block">
                            <div className="g5-avatar">
                                🧗
                            </div>
                            <div className="g5-profile-info">
                                <span className="g5-profile-name">{username}</span>
                                <span className="g5-profile-role">Training Coordinator</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* TOAST NOTIFICATION */}
                {toast && (
                    <div style={{
                        position: 'fixed',
                        top: '86px',
                        right: '2rem',
                        zIndex: 9999,
                        background: toast.type === 'error' ? 'var(--color-status-inactive)' : 'var(--color-accent-warm)',
                        color: '#FFFFFF',
                        padding: '0.85rem 1.4rem',
                        borderRadius: 'var(--radius-button)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {toast.type === 'error' ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
                        <span>{toast.text}</span>
                    </div>
                )}

                {/* CONTENT VIEWPORT */}
                <main className="g5-content">

                    {/* ========================================================= */}
                    {/* TAB 1: DASHBOARD (LANDING PAGE) */}
                    {/* ========================================================= */}
                    {activeTab === 'dashboard' && (
                        <div>
                            {/* ACTIVE LIVE BANNER ON DASHBOARD IF ANY SESSION IS LIVE */}
                            {meetings.some(m => m.isActive) && (() => {
                                const activeM = meetings.find(m => m.isActive);
                                return (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #EAF7F0 0%, #E0F5E9 100%)',
                                        border: '1.5px solid var(--color-status-active)',
                                        borderRadius: 'var(--radius-card)',
                                        padding: '1rem 1.5rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                        boxShadow: '0 4px 18px rgba(76, 175, 125, 0.12)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                            <div className="g5-pulse-dot" style={{ width: '10px', height: '10px' }} />
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.98rem' }}>
                                                    Live Check-In Active: {activeM.name}
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                                                    {activeM.location?.name || (activeM.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')} • Join Code: <strong style={{ color: 'var(--color-primary)' }}>{activeM.code}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="g5-btn-warm"
                                                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                                                onClick={() => setInsightMeeting({ ...activeM, initialTab: 'manual_checkin' })}
                                            >
                                                <Radio size={14} /> Open Live Feed
                                            </button>
                                            <button
                                                className="g5-btn-secondary"
                                                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                                                onClick={() => setInsightMeeting({ ...activeM, initialTab: 'present' })}
                                            >
                                                <Users size={14} /> Who Attended ({activeM.attendanceCount ?? 0})
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 5 Glanceable Stat Cards in a Row */}
                            <div className="g5-stat-grid">
                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Overall Attendance</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: 'var(--color-status-active-soft)', color: 'var(--color-status-active)' }}>
                                            <CalendarCheck size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number">
                                        {attendancePercentage}%
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-status-active)', fontWeight: 600 }}>
                                        {totalAttended} total attendances recorded
                                    </span>
                                </div>

                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Ready to Graduate</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: 'var(--color-accent-warm-soft)', color: 'var(--color-accent-warm)' }}>
                                            <GraduationCap size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number" style={{ color: 'var(--color-accent-warm)' }}>
                                        {readyToGraduate.length}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        {recruits.length} active recruits pipeline
                                    </span>
                                </div>

                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Promotions Pending</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                                            <Award size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number">
                                        {cadres.filter(c => c.douloidRank === 'Shadow Douloid' || c.douloidRank === 'Basic Douloid').length}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                        Shadow & Basic cadres in DB
                                    </span>
                                </div>

                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Upcoming Trainings</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                                            <Compass size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number">
                                        {trainings.length}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: '#0284C7', fontWeight: 600 }}>
                                        Active drill modules in DB
                                    </span>
                                </div>

                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Absentee Flags</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: 'var(--color-status-inactive-soft)', color: 'var(--color-status-inactive)' }}>
                                            <AlertTriangle size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number" style={{ color: 'var(--color-status-inactive)' }}>
                                        {absenteeMembers.length}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        2+ consecutive misses
                                    </span>
                                </div>
                            </div>

                            {/* Warm Glanceable Overview Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
                                <div className="g5-card">
                                    <div className="g5-card-header">
                                        <div>
                                            <div className="g5-card-title">Next Scheduled Meeting / Session</div>
                                            <div className="g5-card-desc">{meetings[0]?.name || 'No meeting scheduled yet in database'}</div>
                                        </div>
                                        <span className={`g5-pill ${meetings[0]?.isActive ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                            <Check size={14} /> {meetings[0]?.isActive ? 'Live Now' : 'Scheduled'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', background: 'var(--color-page-bg)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>DATE & TIME</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                                                {meetings[0]?.date ? `${new Date(meetings[0].date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })} • ${meetings[0].startTime || 'TBD'}` : 'None'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>LOCATION</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                                                {meetings[0]?.location?.name || meetings[0]?.venue || meetings[0]?.campus || 'Not specified'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>CAMPUS</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-accent-warm)', marginTop: '0.2rem' }}>
                                                {meetings[0]?.campus || 'All Campuses'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                        <button className="g5-btn-warm" onClick={() => setActiveTab('graduations')}>
                                            <GraduationCap size={18} /> View Ready Recruits ({readyToGraduate.length})
                                        </button>
                                        <button className="g5-btn-secondary" onClick={() => setActiveTab('meetings')}>
                                            <Calendar size={18} /> View All Field Meetings ({meetings.length})
                                        </button>
                                    </div>
                                </div>

                                <div className="g5-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div className="g5-card-header" style={{ marginBottom: '1rem' }}>
                                            <div>
                                                <div className="g5-card-title">Belay Safety Readiness</div>
                                                <div className="g5-card-desc">Certified belayers in cadre roster</div>
                                            </div>
                                            <Shield size={22} style={{ color: 'var(--color-status-active)' }} />
                                        </div>
                                        <div style={{ background: 'var(--color-status-active-soft)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(76,175,125,0.2)' }}>
                                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-status-active)' }}>
                                                {cadres.filter(c => c.belayStatus === 'Primary Belayer Certified' || c.douloidRank === 'Lead Douloid' || c.douloidRank === 'Intermediate Douloid').length} Certified Belayers
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', marginTop: '0.3rem', fontWeight: 600 }}>
                                                {cadres.length > 0 
                                                    ? `Out of ${cadres.length} total active cadres in database registry.`
                                                    : 'Awaiting cadre roster enrollment.'}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="g5-btn-outline" style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('cadres')}>
                                        Inspect Cadre Roster & Clearances <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: ATTENDANCE (CLEAN GENEROUS-ROW TABLE) */}
                    {/* ========================================================= */}
                    {activeTab === 'attendance' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* QUICK SESSION ATTENDANCE INSPECTOR */}
                            <div className="g5-card" style={{ padding: '1.25rem 1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CalendarCheck size={18} style={{ color: 'var(--color-primary)' }} /> Inspect Specific Session Attendance & Live Feeds
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                            Click any session below to view full attendee roster, scan times, survey answers, or live ticker
                                        </div>
                                    </div>
                                    <button
                                        className="g5-btn-outline"
                                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                                        onClick={() => setActiveTab('meetings')}
                                    >
                                        All Sessions ({meetings.length}) <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                                    {meetings.slice(0, 4).map((m) => (
                                        <div
                                            key={m._id || m.code}
                                            onClick={() => setInsightMeeting({ ...m, initialTab: m.isActive ? 'manual_checkin' : 'present' })}
                                            style={{
                                                background: m.isActive ? 'var(--color-status-active-soft)' : 'var(--color-page-bg)',
                                                border: m.isActive ? '1.5px solid var(--color-status-active)' : '1px solid var(--color-border)',
                                                borderRadius: '12px',
                                                padding: '0.85rem 1rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                gap: '0.4rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                    {new Date(m.date).toLocaleDateString()}
                                                </span>
                                                <span className={`g5-pill ${m.isActive ? 'g5-pill-active' : 'g5-pill-inactive'}`} style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem' }}>
                                                    {m.isActive ? 'Live' : 'Done'}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {m.name}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                <span>{m.location?.name || (m.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}</span>
                                                <span style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    {m.attendanceCount ?? 0} attended →
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="g5-card">
                            <div className="g5-card-header">
                                <div>
                                    <div className="g5-card-title">Attendance Tracking</div>
                                    <div className="g5-card-desc">Live member drill attendance, semester rollups, and pastoral absentee radar</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <select
                                        className="g5-form-select"
                                        style={{ width: '160px', padding: '0.5rem 0.75rem' }}
                                        value={campusFilter}
                                        onChange={(e) => setCampusFilter(e.target.value)}
                                    >
                                        <option value="All">All Campuses</option>
                                        <option value="Athi River">Athi River</option>
                                        <option value="Valley Road">Valley Road</option>
                                    </select>
                                </div>
                            </div>

                            <div className="g5-table-wrap">
                                <table className="g5-table">
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Campus</th>
                                            <th>Role Type</th>
                                            <th>Attendance Rate</th>
                                            <th>Consecutive Absences</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members
                                            .filter(m => campusFilter === 'All' || m.campus === campusFilter)
                                            .filter(m => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .slice(0, 15)
                                            .map((member) => {
                                                const rate = member.totalPoints ? Math.min(100, Math.round((member.totalPoints / 80) * 100)) : 85;
                                                const isAbsentFlag = (member.consecutiveAbsences || 0) >= 2;
                                                return (
                                                    <tr key={member._id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                                <div className="g5-avatar" style={{ width: '38px', height: '38px' }}>
                                                                    {member.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{member.name}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{member.studentRegNo}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>{member.campus}</td>
                                                        <td>
                                                            <span className={`g5-pill ${member.memberType === 'Douloid' ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                                                {member.memberType || 'Recruit'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                                <div style={{ flex: 1, maxWidth: '100px', height: '7px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${rate}%`, height: '100%', background: rate >= 80 ? 'var(--color-status-active)' : 'var(--color-accent-warm)' }} />
                                                                </div>
                                                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{rate}%</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {isAbsentFlag ? (
                                                                <span className="g5-pill g5-pill-inactive">
                                                                    <AlertTriangle size={13} /> {member.consecutiveAbsences} missed
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Nominal</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`g5-pill ${member.isActive !== false ? 'g5-pill-active' : 'g5-pill-inactive'}`}>
                                                                {member.isActive !== false ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: MEETINGS (CARDS WITH WHO ATTENDED & LIVE FEED) */}
                    {/* ========================================================= */}
                    {activeTab === 'meetings' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Training Meetings & Field Drills</h2>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Weekly sessions, live attendance feeds, and who attended roster</p>
                                </div>
                                <button className="g5-btn-warm" onClick={() => setShowNewMeetingModal(true)}>
                                    <Plus size={18} /> + New Meeting
                                </button>
                            </div>

                            {/* ACTIVE LIVE BANNER IF ANY SESSION IS LIVE */}
                            {meetings.filter(m => m.isActive).length > 0 && (() => {
                                const activeM = meetings.filter(m => m.isActive)[0];
                                return (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #EAF7F0 0%, #E0F5E9 100%)',
                                        border: '1.5px solid var(--color-status-active)',
                                        borderRadius: 'var(--radius-card)',
                                        padding: '1.25rem 1.75rem',
                                        marginBottom: '1.75rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                        boxShadow: '0 4px 18px rgba(76, 175, 125, 0.15)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="g5-pulse-dot" style={{ width: '12px', height: '12px' }} />
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    Live Check-In Active: {activeM.name}
                                                </div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                    {activeM.location?.name || (activeM.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')} • Join Code: <strong style={{ color: 'var(--color-primary)', letterSpacing: '1px' }}>{activeM.code}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                            <button
                                                className="g5-btn-warm"
                                                onClick={() => setInsightMeeting({ ...activeM, initialTab: 'manual_checkin' })}
                                            >
                                                <Radio size={16} /> Open Live Attendance Feed
                                            </button>
                                            <button
                                                className="g5-btn-secondary"
                                                onClick={() => setInsightMeeting({ ...activeM, initialTab: 'present' })}
                                            >
                                                <Users size={16} /> Who Attended ({activeM.attendanceCount ?? 0})
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {meetings.map((meeting) => (
                                    <div
                                        key={meeting._id || meeting.code || meeting.date}
                                        className="g5-card"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                            border: meeting.isActive ? '1.5px solid var(--color-status-active)' : '1px solid var(--color-border)'
                                        }}
                                        onClick={() => setInsightMeeting({ ...meeting, initialTab: meeting.isActive ? 'manual_checkin' : 'present' })}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                                <span className="g5-pill g5-pill-purple">
                                                    <Calendar size={13} /> {new Date(meeting.date).toLocaleDateString()}
                                                </span>
                                                <span
                                                    className={`g5-pill ${meeting.isActive ? 'g5-pill-active' : 'g5-pill-inactive'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setInsightMeeting({ ...meeting, initialTab: meeting.isActive ? 'manual_checkin' : 'present' });
                                                    }}
                                                >
                                                    {meeting.isActive ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            <div className="g5-pulse-dot" style={{ width: '6px', height: '6px' }} />
                                                            Live • Active
                                                        </span>
                                                    ) : (
                                                        'Completed'
                                                    )}
                                                </span>
                                            </div>

                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                                {meeting.name || 'Weekly Training Drill'}
                                            </h3>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                                <Clock size={15} /> {meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                <MapPin size={15} /> {meeting.location?.name || meeting.venue || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                                                    CODE: {meeting.code || 'DOULOS'}
                                                </span>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-status-active)' }}>
                                                    ✓ 48hr compliant
                                                </span>
                                            </div>

                                            {meeting.isActive ? (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                                    <button
                                                        className="g5-btn-warm"
                                                        style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setInsightMeeting({ ...meeting, initialTab: 'manual_checkin' });
                                                        }}
                                                    >
                                                        <Radio size={15} /> Live Attendance Feed & Check-In
                                                    </button>
                                                    <button
                                                        className="g5-btn-secondary"
                                                        style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.82rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setInsightMeeting({ ...meeting, initialTab: 'present' });
                                                        }}
                                                    >
                                                        <Users size={14} /> Who Attended ({meeting.attendanceCount ?? 0})
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="g5-btn-secondary"
                                                    style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setInsightMeeting({ ...meeting, initialTab: 'present' });
                                                    }}
                                                >
                                                    <Users size={15} /> Who Attended ({meeting.attendanceCount ?? 0}) • View Roster
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 4: TRAININGS & CAMPS */}
                    {/* ========================================================= */}
                    {activeTab === 'trainings_camps' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            {/* 3-DAY CAMP SCHEDULE STUDIO (FRIDAY, SATURDAY, SUNDAY) */}
                            <CampScheduleStudio
                                api={api}
                                campus={campusFilter === 'All' ? userCampus : campusFilter}
                                cadres={cadres}
                                meetings={meetings}
                                showToast={showToast}
                            />

                            {/* CAMP READINESS & HARDWARE AUDIT CARDS */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                                        <Shield size={20} style={{ color: 'var(--color-accent-warm)' }} />
                                        <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>Equipment Readiness Check</h4>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                        {gearAssets.length > 0 
                                            ? `${gearAssets.length} hardware assets logged in inventory (${gearAssets.filter(a => a.status === 'Operational').length} Operational, ${gearAssets.filter(a => a.status === 'Needs Maintenance').length} In Maintenance).`
                                            : 'No gear assets registered yet in G8 asset database.'}
                                    </p>
                                    <span className={`g5-pill ${gearAssets.some(a => a.status === 'Needs Maintenance') ? 'g5-pill-recruit' : 'g5-pill-active'}`}>
                                        {gearAssets.length > 0 ? `${gearAssets.filter(a => a.status === 'Operational').length}/${gearAssets.length} Operational` : 'Database Standby'}
                                    </span>
                                </div>

                                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                                        <Award size={20} style={{ color: 'var(--color-status-active)' }} />
                                        <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>Belay Station Deployment</h4>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                        {campProgram?.dutyRoster?.length > 0
                                            ? `${campProgram.dutyRoster.length} duty stations configured in database (${campProgram.dutyRoster.filter(s => s.safetyCleared && s.primaryBelayer).length} staffed & safety-cleared).`
                                            : 'No camp duty stations configured yet in database.'}
                                    </p>
                                    <span className="g5-pill g5-pill-active">
                                        {campProgram?.dutyRoster?.length > 0 ? `${campProgram.dutyRoster.filter(s => s.safetyCleared && s.primaryBelayer).length} Stations Staffed` : 'Roster Standby'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 5: RECRUIT GRADUATIONS (EMOTIONAL HIGH POINT - WARM CARDS) */}
                    {/* ========================================================= */}
                    {activeTab === 'graduations' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Recruit Graduations</h2>
                                        <span className="g5-pill g5-pill-recruit">
                                            🎉 {readyToGraduate.length} Ready for Douloid Honor
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                        Recognizing spiritual growth, endurance through drills, and graduation into full Douloid service.
                                    </p>
                                </div>
                                <button className="g5-btn-warm" onClick={handleGraduateCohort}>
                                    <Sparkles size={18} /> Graduate Entire Cohort ({readyToGraduate.length})
                                </button>
                            </div>

                            {readyToGraduate.length === 0 ? (
                                <div className="g5-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                                    <div className="g5-avatar" style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', fontSize: '1.8rem' }}>
                                        🎓
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>All Recruits Honored & Graduated!</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0.5rem auto 0' }}>
                                        Current cohort members have already transitioned into active Douloid cadres. Great job training them!
                                    </p>
                                </div>
                            ) : (
                                <div className="g5-celebrate-grid">
                                    {readyToGraduate.map((recruit) => (
                                        <div key={recruit._id} className="g5-celebrate-card">
                                            <span className="g5-celebrate-badge">Ready for Graduation</span>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                                <div className="g5-avatar" style={{ width: '56px', height: '56px', fontSize: '1.3rem' }}>
                                                    {recruit.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                        {recruit.name}
                                                    </h3>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                                        {recruit.studentRegNo} • {recruit.campus}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ background: 'var(--color-page-bg)', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
                                                    <span>Training Progress</span>
                                                    <span style={{ color: 'var(--color-status-active)' }}>8/8 Drills · Camp Complete ✓</span>
                                                </div>
                                                <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #E8A33D, #4CAF7D)' }} />
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.45rem', fontWeight: 600 }}>
                                                    Equipped with foundation team building, knots, and camp etiquette.
                                                </div>
                                            </div>

                                            <button
                                                className="g5-btn-warm"
                                                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                                                onClick={() => handleGraduateSingle(recruit)}
                                            >
                                                <Sparkles size={18} /> Graduate to Douloid 🎉
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 6: RANK PROMOTIONS (5-DOMAIN SCORING WIDGET CARDS) */}
                    {/* ========================================================= */}
                    {activeTab === 'promotions' && (
                        <div>
                            <div style={{ marginBottom: '1.75rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Cadre Rank Promotions</h2>
                                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                                    5-Domain competency evaluations to elevate cadres into Intermediate and Lead leadership.
                                </p>
                            </div>

                            <div className="g5-celebrate-grid">
                                {cadres.slice(0, 6).map((cadre) => {
                                    const currentRank = cadre.douloidRank || 'Shadow Douloid';
                                    const nextRank = getNextRank(currentRank);
                                    const scores = promotionScores[cadre._id] || { team: 4, ropes: 4, base: 4, rescue: 4, firstAid: 4 };

                                    const updateScore = (domain, val) => {
                                        setPromotionScores(prev => ({
                                            ...prev,
                                            [cadre._id]: {
                                                ...(prev[cadre._id] || { team: 4, ropes: 4, base: 4, rescue: 4, firstAid: 4 }),
                                                [domain]: Number(val)
                                            }
                                        }));
                                    };

                                    return (
                                        <div key={cadre._id} className="g5-celebrate-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                    <div className="g5-avatar" style={{ width: '50px', height: '50px' }}>
                                                        {cadre.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                            {cadre.name}
                                                        </h3>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                                            {cadre.campus} • {cadre.studentRegNo}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem', background: 'var(--color-page-bg)', padding: '0.65rem 0.95rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>CURRENT:</span>
                                                <span className="g5-pill g5-pill-purple">{currentRank}</span>
                                                <ArrowUpRight size={16} style={{ color: 'var(--color-accent-warm)' }} />
                                                <span className="g5-pill g5-pill-recruit">{nextRank}</span>
                                            </div>

                                            {/* Compact 5-Domain Scoring Widget */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    5-Domain Competency Scoring
                                                </span>

                                                {[
                                                    { key: 'team', label: 'Team Building Debriefs' },
                                                    { key: 'ropes', label: 'High Ropes & Dynamic Belaying' },
                                                    { key: 'base', label: 'Freedom Base Hardware Audits' },
                                                    { key: 'rescue', label: 'Ridge Rescue & Fall Arrest' },
                                                    { key: 'firstAid', label: 'Wilderness Triage & First Aid' }
                                                ].map(domain => (
                                                    <div key={domain.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                                                            {domain.label}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="5"
                                                                value={scores[domain.key]}
                                                                onChange={(e) => updateScore(domain.key, e.target.value)}
                                                                style={{ width: '70px', accentColor: 'var(--color-accent-warm)' }}
                                                            />
                                                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-accent-warm)', width: '20px', textAlign: 'right' }}>
                                                                {scores[domain.key]}★
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                className="g5-btn-warm"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                                onClick={() => handleConfirmPromotion(cadre, nextRank)}
                                            >
                                                <Award size={18} /> Confirm Promotion to {nextRank}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 7: CADRE ROSTER (REFERENCE TABLE) */}
                    {/* ========================================================= */}
                    {activeTab === 'cadres' && (
                        <div className="g5-card">
                            <div className="g5-card-header">
                                <div>
                                    <div className="g5-card-title">Douloid Cadre Roster</div>
                                    <div className="g5-card-desc">Rank reference list and belay station clearance directory</div>
                                </div>
                            </div>

                            <div className="g5-table-wrap">
                                <table className="g5-table">
                                    <thead>
                                        <tr>
                                            <th>Cadre Member</th>
                                            <th>Campus</th>
                                            <th>Rank Badge</th>
                                            <th>Belay Clearance</th>
                                            <th>Solo Station Permitted</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cadres.map((cadre) => {
                                            const rank = cadre.douloidRank || 'Shadow Douloid';
                                            const color = getRankColor(rank);
                                            return (
                                                <tr key={cadre._id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                            <div className="g5-avatar" style={{ width: '38px', height: '38px' }}>
                                                                {cadre.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{cadre.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cadre.studentRegNo}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{cadre.campus}</td>
                                                    <td>
                                                        <span style={{
                                                            background: color.bg,
                                                            color: color.text,
                                                            border: `1px solid ${color.border}`,
                                                            padding: '0.3rem 0.75rem',
                                                            borderRadius: '999px',
                                                            fontWeight: 800,
                                                            fontSize: '0.78rem'
                                                        }}>
                                                            {rank}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`g5-pill ${cadre.belayStatus === 'Primary Belayer Certified' ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                                            <Shield size={13} /> {cadre.belayStatus || 'Not Permitted'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {cadre.soloStationAllowed ? (
                                                            <span style={{ color: 'var(--color-status-active)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                ✓ Authorized
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                                Tandem Only
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="g5-btn-secondary"
                                                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                                            onClick={() => setActiveTab('promotions')}
                                                        >
                                                            Evaluate Rank
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 8: CONTRIBUTIONS (GLANCE-AND-NUDGE MINIMAL LIST) */}
                    {/* ========================================================= */}
                    {activeTab === 'contributions' && (
                        <div className="g5-card">
                            <div className="g5-card-header">
                                <div>
                                    <div className="g5-card-title">Cadre & Recruit Contributions</div>
                                    <div className="g5-card-desc">Training dues liaison overview (read-only glance-and-nudge list)</div>
                                </div>
                            </div>

                            <div className="g5-table-wrap">
                                <table className="g5-table">
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Campus</th>
                                            <th>Semester Dues</th>
                                            <th>Status</th>
                                            <th>Nudge Liaison</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member) => {
                                            const memberPayments = payments.filter(p => String(p.studentRegNo).trim().toUpperCase() === String(member.studentRegNo).trim().toUpperCase());
                                            const approvedPayment = memberPayments.find(p => p.status === 'approved');
                                            const pendingPayment = memberPayments.find(p => p.status === 'pending');
                                            const isPaid = !!approvedPayment;
                                            const statusText = approvedPayment ? 'Paid' : (pendingPayment ? 'Pending Verification' : 'Unpaid');
                                            const amountDisplay = approvedPayment 
                                                ? `KES ${approvedPayment.amount.toLocaleString()}` 
                                                : (pendingPayment ? `KES ${pendingPayment.amount.toLocaleString()}` : 'KES 0');
                                            return (
                                                <tr key={member._id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                            <div className="g5-avatar" style={{ width: '38px', height: '38px' }}>
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{member.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{member.studentRegNo}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{member.campus}</td>
                                                    <td style={{ fontWeight: 700 }}>{amountDisplay}</td>
                                                    <td>
                                                        <span className={`g5-pill ${isPaid ? 'g5-pill-active' : (pendingPayment ? 'g5-pill-recruit' : 'g5-pill-inactive')}`}>
                                                            {statusText}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {!isPaid ? (
                                                            <a
                                                                href={`https://wa.me/?text=${encodeURIComponent(`Habari ${member.name.split(' ')[0]}! Kindly remember to submit your Doulos semester contribution via the student portal. Let's make camp a blessing! 🙏⛺`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="g5-btn-outline"
                                                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none' }}
                                                            >
                                                                <MessageCircle size={14} /> Send WhatsApp Nudge
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: 'var(--color-status-active)', fontWeight: 600, fontSize: '0.85rem' }}>
                                                                ✓ Cleared
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 9: SAFETY & INCIDENTS (LOP LIBRARY + INCIDENT LOG) */}
                    {/* ========================================================= */}
                    {activeTab === 'safety' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* LOP Documents Card Grid */}
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
                                    Standard Operating Procedures (LOP Library)
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                                    Standard safety protocols approved by G5 Training Directorate
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                    {lops.map((lop) => (
                                        <div key={lop.id} className="g5-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                    <span className="g5-pill g5-pill-purple">{lop.code}</span>
                                                    <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                                                </div>
                                                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                                    {lop.title}
                                                </h4>
                                                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                    {lop.desc}
                                                </p>
                                            </div>
                                            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                                                <button className="g5-btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => showToast(`Opened ${lop.code}`)}>
                                                    <ExternalLink size={15} /> View Protocol
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chronological Incident Log */}
                            <div className="g5-card">
                                <div className="g5-card-header">
                                    <div>
                                        <div className="g5-card-title">Incident & Near-Miss Log</div>
                                        <div className="g5-card-desc">Chronological tracking of field occurrences and corrective action plans</div>
                                    </div>
                                    <button className="g5-btn-warm" onClick={() => setShowReportIncidentModal(true)}>
                                        <Plus size={16} /> + Report Incident
                                    </button>
                                </div>

                                {incidents.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
                                        <Shield size={36} style={{ color: 'var(--color-status-active)', margin: '0 auto 0.75rem' }} />
                                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>Zero Active Incidents Filed</div>
                                        <div style={{ fontSize: '0.85rem' }}>All training courses operating safely within LOP specifications.</div>
                                    </div>
                                ) : (
                                    <div className="g5-table-wrap">
                                        <table className="g5-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Title</th>
                                                    <th>Severity</th>
                                                    <th>Location</th>
                                                    <th>Corrective Action</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {incidents.map((incident) => (
                                                    <tr key={incident._id}>
                                                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                            {new Date(incident.incidentDate || incident.createdAt || Date.now()).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ fontWeight: 700 }}>{incident.title}</td>
                                                        <td>
                                                            <span className={`g5-pill ${incident.severity === 'Near-Miss' ? 'g5-pill-recruit' : 'g5-pill-inactive'}`}>
                                                                {incident.severity}
                                                            </span>
                                                        </td>
                                                        <td>{incident.location || incident.campus}</td>
                                                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                            {incident.correctiveActionPlan || 'Root-cause audit complete.'}
                                                        </td>
                                                        <td>
                                                            <span className="g5-pill g5-pill-active">Logged</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* ========================================================= */}
            {/* BESPOKE 2-COLUMN MODAL: CREATE MEETING SESSION */}
            {/* ========================================================= */}
            {showNewMeetingModal && (
                <div className="g5-modal-backdrop" onClick={() => setShowNewMeetingModal(false)}>
                    <div className="g5-modal g5-modal-xl g5-modal-scrollable" onClick={(e) => e.stopPropagation()}>
                        <div className="g5-modal-header" style={{ padding: '1.25rem 1.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #6B5FA8 0%, #8E82CA 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFFFFF',
                                    boxShadow: '0 4px 12px rgba(107, 95, 168, 0.25)'
                                }}>
                                    <Compass size={22} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1.2 }}>
                                        Create Meeting Session
                                    </h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                        Schedule outdoor practicals, weekly fellowship, and geofenced attendance verification
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNewMeetingModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'var(--color-page-bg)',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMeeting}>
                            <div className="g5-modal-body" style={{ padding: '1.5rem 1.75rem' }}>
                                {/* WEEKLY CAMPUS LIMIT CONFLICT BANNER */}
                                {existingConflictMeeting && (
                                    <div style={{
                                        background: 'var(--color-accent-warm-soft)',
                                        border: '1.5px solid var(--color-accent-warm)',
                                        borderRadius: '14px',
                                        padding: '0.85rem 1.25rem',
                                        marginBottom: '1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.85rem',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-text-main)'
                                    }}>
                                        <AlertTriangle size={20} style={{ color: 'var(--color-accent-warm)', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                Policy Restriction: 1 Meeting Per Week Allowed for {newMeetingForm.campus}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                "<strong>{existingConflictMeeting.name}</strong>" is already scheduled for this week on {new Date(existingConflictMeeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ({existingConflictMeeting.startTime} - {existingConflictMeeting.endTime}).
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="g5-form-layout-2col">

                                    {/* COLUMN 1: SESSION DETAILS */}
                                    <div className="g5-form-card-panel">
                                        <div className="g5-form-section-title">
                                            <Settings size={15} /> 1. Session Details
                                        </div>

                                        <div className="g5-form-group" style={{ marginBottom: '0.85rem' }}>
                                            <label className="g5-form-label">Meeting Name</label>
                                            <input
                                                type="text"
                                                className="g5-form-input"
                                                placeholder="Weekly Doulos"
                                                required
                                                value={newMeetingForm.name}
                                                onChange={(e) => setNewMeetingForm({ ...newMeetingForm, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="g5-form-group" style={{ marginBottom: '0.85rem' }}>
                                            <label className="g5-form-label">Campus Location</label>
                                            <div className="g5-campus-toggle">
                                                <button
                                                    type="button"
                                                    className={`g5-campus-btn ${newMeetingForm.campus === 'Athi River' ? 'active' : ''}`}
                                                    onClick={() => applyVenuePreset(VENUE_PRESETS[0])}
                                                >
                                                    <Tent size={16} /> Athi River (Doulos Store)
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`g5-campus-btn ${newMeetingForm.campus === 'Valley Road' ? 'active' : ''}`}
                                                    onClick={() => applyVenuePreset(VENUE_PRESETS[1])}
                                                >
                                                    <Users size={16} /> Nairobi Campus (DAC 506)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="g5-form-grid-3" style={{ gap: '0.65rem', marginBottom: '0.85rem' }}>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">Date</label>
                                                <input
                                                    type="date"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.date}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, date: e.target.value })}
                                                />
                                            </div>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">Start Time</label>
                                                <input
                                                    type="time"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.startTime}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, startTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">End Time</label>
                                                <input
                                                    type="time"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.endTime}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, endTime: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* QUESTION / POLL STUDIO */}
                                        <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                                                <Lightbulb size={15} style={{ color: 'var(--color-primary)' }} />
                                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    Interactive Roll-Call Question
                                                </span>
                                            </div>

                                            <div className="g5-type-chip-grid" style={{ marginBottom: '0.75rem' }}>
                                                {[
                                                    { id: 'text', label: 'Open Text', icon: FileText },
                                                    { id: 'yes_no', label: 'Yes / No', icon: CheckCircle2 },
                                                    { id: 'multiple_choice', label: 'Single Choice', icon: Check },
                                                    { id: 'checkboxes', label: 'Checkboxes', icon: Layers },
                                                    { id: 'rating', label: '1-5 Stars', icon: Star }
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        className={`g5-type-chip ${newMeetingForm.questionType === t.id ? 'active' : ''}`}
                                                        onClick={() => setNewMeetingForm(prev => ({
                                                            ...prev,
                                                            questionType: t.id,
                                                            questionOptions: (t.id === 'multiple_choice' || t.id === 'checkboxes') ? ['', ''] : []
                                                        }))}
                                                    >
                                                        <t.icon size={13} />
                                                        <span>{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label" style={{ fontSize: '0.78rem' }}>Question Wording</label>
                                                <input
                                                    type="text"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                                                    placeholder="e.g. Rate your week / Choose an option"
                                                    value={newMeetingForm.questionOfDay}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, questionOfDay: e.target.value })}
                                                />
                                            </div>

                                            {(newMeetingForm.questionType === 'multiple_choice' || newMeetingForm.questionType === 'checkboxes') && (
                                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                                            Poll Choices
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="g5-btn-secondary"
                                                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                                                            onClick={() => setNewMeetingForm(prev => ({
                                                                ...prev,
                                                                questionOptions: [...prev.questionOptions, '']
                                                            }))}
                                                        >
                                                            + Add Choice
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        {newMeetingForm.questionOptions.map((opt, idx) => (
                                                            <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', minWidth: '16px' }}>{idx + 1}.</span>
                                                                <input
                                                                    type="text"
                                                                    className="g5-form-input"
                                                                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}
                                                                    placeholder={`Choice ${idx + 1}`}
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const updated = [...newMeetingForm.questionOptions];
                                                                        updated[idx] = e.target.value;
                                                                        setNewMeetingForm({ ...newMeetingForm, questionOptions: updated });
                                                                    }}
                                                                />
                                                                {newMeetingForm.questionOptions.length > 2 && (
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-outline"
                                                                        style={{ padding: '0.35rem 0.55rem', color: 'var(--color-status-inactive)' }}
                                                                        onClick={() => {
                                                                            const updated = newMeetingForm.questionOptions.filter((_, i) => i !== idx);
                                                                            setNewMeetingForm({ ...newMeetingForm, questionOptions: updated });
                                                                        }}
                                                                    >
                                                                        <X size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* COLUMN 2: LOCATION & GEOFENCING */}
                                    <div className="g5-form-card-panel">
                                        <div className="g5-form-section-title">
                                            <MapPin size={15} /> 2. Location & Geofencing
                                        </div>

                                        {/* OFFICIAL VENUE SELECTION */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    Official Campus Venue
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                                    {newMeetingForm.campus === 'Athi River' ? 'Athi River Base' : 'Nairobi Campus'}
                                                </span>
                                            </div>
                                            <div className="g5-venue-preset-grid">
                                                {VENUE_PRESETS.map((p) => {
                                                    const isSelected = newMeetingForm.location.name === p.name;
                                                    return (
                                                        <div
                                                            key={p.title}
                                                            className={`g5-venue-preset-card ${isSelected ? 'active' : ''}`}
                                                            onClick={() => applyVenuePreset(p)}
                                                        >
                                                            <div className="g5-venue-title">
                                                                <span>{p.title}</span>
                                                                {isSelected && <Check size={14} style={{ color: 'var(--color-accent-warm)' }} />}
                                                            </div>
                                                            <div className="g5-venue-sub">{p.sub}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* LOCATION NAME INPUT */}
                                        <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                            <label className="g5-form-label">Venue / Location Name</label>
                                            <input
                                                type="text"
                                                className="g5-form-input"
                                                placeholder="Doulos Store or DAC 506"
                                                required
                                                value={newMeetingForm.location.name}
                                                onChange={(e) => setNewMeetingForm({
                                                    ...newMeetingForm,
                                                    location: { ...newMeetingForm.location, name: e.target.value }
                                                })}
                                            />
                                        </div>

                                        {/* GPS SATELLITE RADAR BOX */}
                                        <div className="g5-gps-radar-box">
                                            <div className="g5-gps-radar-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Radio size={16} style={{ color: 'var(--color-primary)' }} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                        Satellite GPS Lock
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <div className="g5-pulse-dot" />
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-status-active)' }}>
                                                        High-Accuracy Geofence
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="g5-btn-warm"
                                                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                                                onClick={handleCaptureGps}
                                                disabled={gpsCapturing}
                                            >
                                                <Navigation size={16} />
                                                {gpsCapturing ? 'Locating Device Coordinates...' : 'Capture GPS'}
                                            </button>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>COORDINATES:</span>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                                                    {Number(newMeetingForm.location.latitude).toFixed(5)}, {Number(newMeetingForm.location.longitude).toFixed(5)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* GEOFENCE RADIUS & COORDINATES GRID */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.65rem' }}>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                                    <label className="g5-form-label" style={{ fontSize: '0.78rem' }}>Radius (m) *</label>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-accent-warm)' }}>
                                                        {newMeetingForm.location.radius}m
                                                    </span>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.location.radius}
                                                    onChange={(e) => setNewMeetingForm({
                                                        ...newMeetingForm,
                                                        location: { ...newMeetingForm.location, radius: parseInt(e.target.value) || 200 }
                                                    })}
                                                />
                                            </div>

                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label" style={{ fontSize: '0.78rem' }}>Latitude *</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.location.latitude}
                                                    onChange={(e) => setNewMeetingForm({
                                                        ...newMeetingForm,
                                                        location: { ...newMeetingForm.location, latitude: parseFloat(e.target.value) }
                                                    })}
                                                />
                                            </div>

                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label" style={{ fontSize: '0.78rem' }}>Longitude *</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.location.longitude}
                                                    onChange={(e) => setNewMeetingForm({
                                                        ...newMeetingForm,
                                                        location: { ...newMeetingForm.location, longitude: parseFloat(e.target.value) }
                                                    })}
                                                />
                                            </div>
                                        </div>

                                    </div>

                                </div>
                            </div>

                            <div className="g5-modal-footer" style={{ justifyContent: 'space-between', padding: '1rem 1.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-status-active)' }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                        {newMeetingForm.campus} • {newMeetingForm.location.radius}m perimeter verified
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" className="g5-btn-outline" onClick={() => setShowNewMeetingModal(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="g5-btn-warm"
                                        disabled={meetingCreating || !!existingConflictMeeting}
                                        style={{
                                            opacity: existingConflictMeeting ? 0.5 : 1,
                                            cursor: existingConflictMeeting ? 'not-allowed' : 'pointer'
                                        }}
                                        title={existingConflictMeeting ? `A meeting already exists for ${newMeetingForm.campus} this week` : ''}
                                    >
                                        <Sparkles size={16} />
                                        {meetingCreating ? 'Creating Session...' : existingConflictMeeting ? 'Weekly Limit Reached' : 'Create Meeting Session'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: REPORT INCIDENT */}
            {/* ========================================================= */}
            {showReportIncidentModal && (
                <div className="g5-modal-backdrop" onClick={() => setShowReportIncidentModal(false)}>
                    <div className="g5-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="g5-modal-header">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                Report Safety Occurrence
                            </h3>
                            <button
                                onClick={() => setShowReportIncidentModal(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleReportIncident}>
                            <div className="g5-modal-body">
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Occurrence Title</label>
                                    <input
                                        type="text"
                                        className="g5-form-input"
                                        placeholder="e.g., Carabiner gate stiff during zip line drill"
                                        required
                                        value={incidentForm.title}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Severity Level</label>
                                    <select
                                        className="g5-form-select"
                                        value={incidentForm.severity}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                                    >
                                        <option value="Near-Miss">Near-Miss (No Injury / Hazard Identified)</option>
                                        <option value="Minor First Aid">Minor First Aid (Scrape / Hydration)</option>
                                        <option value="Equipment Failure">Equipment Quarantine Required</option>
                                        <option value="Serious Incident">Serious Occurrence</option>
                                    </select>
                                </div>
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Location / Course</label>
                                    <input
                                        type="text"
                                        className="g5-form-input"
                                        value={incidentForm.location}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                                    />
                                </div>
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Description & Observations</label>
                                    <textarea
                                        className="g5-form-textarea"
                                        rows="3"
                                        placeholder="Detail the sequence of events and immediate actions taken..."
                                        required
                                        value={incidentForm.description}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Corrective Action Plan</label>
                                    <textarea
                                        className="g5-form-textarea"
                                        rows="2"
                                        placeholder="Steps taken to prevent recurrence (hardware retirement, brief retraining)..."
                                        value={incidentForm.correctiveActionPlan}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, correctiveActionPlan: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="g5-modal-footer">
                                <button type="button" className="g5-btn-outline" onClick={() => setShowReportIncidentModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="g5-btn-warm" disabled={incidentSubmitting}>
                                    {incidentSubmitting ? 'Logging...' : 'File Safety Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ========================================================= */}
            {/* G5 MEETING ATTENDANCE & LIVE FEED MODAL */}
            {/* ========================================================= */}
            {insightMeeting && (
                <G5MeetingModal
                    meeting={insightMeeting}
                    onClose={() => setInsightMeeting(null)}
                    api={api}
                    onRefresh={fetchPortalData}
                />
            )}

        </div>
    );
};

export default G5TrainingPortal;
