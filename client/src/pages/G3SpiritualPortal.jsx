import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import G5ComingSoonWorkspace, { ComingSoonModal } from '../components/g5/G5ComingSoonWorkspace';
import '../styles/spiritualPortal.css';
import {
    BookOpen,
    LayoutDashboard,
    Feather,
    Calendar,
    Clock,
    Plus,
    CheckCircle2,
    Sparkles,
    Send,
    Edit3,
    Trash2,
    Eye,
    Smartphone,
    Monitor,
    LogOut,
    Check,
    X,
    Search,
    ChevronRight,
    Compass,
    Share2,
    Bookmark,
    RefreshCw,
    Menu,
    Wifi,
    Battery,
    Signal,
    Moon,
    Sun,
    ArrowLeft,
    FileText,
    Lock,
    Unlock,
    Printer,
    Award,
    HeartHandshake,
    Shield,
    Users,
    User,
    CheckSquare
} from 'lucide-react';

const G3SpiritualPortal = () => {
    const navigate = useNavigate();

    // Active Navigation
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'fellowship' | 'create'
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [fellowshipSubTab, setFellowshipSubTab] = useState('all'); // 'all' | 'published' | 'scheduled' | 'draft' | 'archived'
    const [simulatorTheme, setSimulatorTheme] = useState('light'); // 'light' | 'dark'
    const [comingSoonModal, setComingSoonModal] = useState(null);

    // Data States
    const [dashboardData, setDashboardData] = useState(null);
    const [fellowships, setFellowships] = useState([]);
    const [minutes, setMinutes] = useState([]);
    const [members, setMembers] = useState([]);
    const [supportRequests, setSupportRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Minutes Vault State
    const [showNewMinutesModal, setShowNewMinutesModal] = useState(false);
    const [minutesForm, setMinutesForm] = useState({
        meetingDate: new Date().toISOString().split('T')[0],
        meetingType: 'Executive G-Council',
        location: 'Freedom Base Council Chamber',
        agendaText: '',
        attendeesText: '',
        resolutions: [
            { topic: '', decision: '', assignedOfficer: '', deadline: '' }
        ]
    });

    // Transcript State
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [transcriptData, setTranscriptData] = useState(null);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');

    // Pastoral Care State
    const [careFilter, setCareFilter] = useState('all'); // 'all' | 'open' | 'in_progress' | 'resolved'
    const [selectedCareRequest, setSelectedCareRequest] = useState(null);
    const [careNoteText, setCareNoteText] = useState('');
    const [savingCareNote, setSavingCareNote] = useState(false);

    // Profile & Context
    const username = localStorage.getItem('username') || 'seth';
    const userRole = localStorage.getItem('role') || 'g3';
    const displayRole = userRole.toUpperCase().includes('G4') ? 'G4 Spiritual Coordinator' : 'G3 Spiritual Coordinator';
    const rolePrefix = userRole.toUpperCase().includes('G4') ? 'G4' : 'G3';

    // Builder State
    const [builderForm, setBuilderForm] = useState({
        _id: null,
        title: '',
        date: new Date().toISOString().split('T')[0],
        theme: '',
        scriptureReference: '',
        scriptureText: '',
        devotional: '',
        reflectionQuestion: '',
        prayer: '',
        communityPrompt: '',
        coverImage: '',
        campus: 'All',
        status: 'DRAFT',
        scheduledAt: ''
    });

    const [previewMode, setPreviewMode] = useState('mobile'); // 'mobile' | 'desktop'
    const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // Load Comprehensive G3 Portal Data
    const loadPortalData = async () => {
        try {
            setLoading(true);
            const [statsRes, listRes, minutesRes, membersRes, supportRes] = await Promise.all([
                api.get('/fellowships/stats/dashboard').catch(() => ({ data: null })),
                api.get('/fellowships').catch(() => ({ data: [] })),
                api.get('/council/minutes').catch(() => ({ data: [] })),
                api.get('/members').catch(() => ({ data: [] })),
                api.get('/support-requests').catch(() => ({ data: [] }))
            ]);
            setDashboardData(statsRes.data);
            setFellowships(listRes.data || []);
            setMinutes(minutesRes.data || []);
            setMembers(Array.isArray(membersRes.data) ? membersRes.data : membersRes.data?.members || []);
            setSupportRequests(Array.isArray(supportRes.data) ? supportRes.data : supportRes.data?.requests || []);
        } catch (err) {
            console.error('Failed to load spiritual portal data:', err);
            showToast('error', 'Could not sync all portal records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPortalData();
    }, []);

    // Minutes Actions
    const handleLockMinutes = async (id) => {
        if (!window.confirm('Seal these meeting minutes in the Vault? Once locked, resolutions are tamper-proof.')) return;
        try {
            const res = await api.post(`/council/minutes/${id}/lock`);
            showToast('success', res.data.message || 'Minutes sealed in Vault');
            loadPortalData();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to lock minutes');
        }
    };

    const handleAddResolutionRow = () => {
        setMinutesForm(prev => ({
            ...prev,
            resolutions: [...prev.resolutions, { topic: '', decision: '', assignedOfficer: '', deadline: '' }]
        }));
    };

    const handleSaveMinutes = async (e) => {
        e.preventDefault();
        const agenda = minutesForm.agendaText.split('\n').map(a => a.trim()).filter(Boolean);
        const attendees = minutesForm.attendeesText.split('\n').map(name => ({ name: name.trim(), present: true })).filter(a => a.name);

        try {
            const res = await api.post('/council/minutes', {
                ...minutesForm,
                agenda,
                attendees,
                resolutions: minutesForm.resolutions.filter(r => r.topic.trim())
            });
            showToast('success', res.data.message || 'Minutes successfully recorded in Vault');
            setShowNewMinutesModal(false);
            setMinutesForm({
                meetingDate: new Date().toISOString().split('T')[0],
                meetingType: 'Executive G-Council',
                location: 'Freedom Base Council Chamber',
                agendaText: '',
                attendeesText: '',
                resolutions: [{ topic: '', decision: '', assignedOfficer: '', deadline: '' }]
            });
            loadPortalData();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to save minutes');
        }
    };

    // Transcript Actions
    const handleGenerateTranscript = async (memberId) => {
        if (!memberId) return;
        setTranscriptLoading(true);
        try {
            const res = await api.get(`/council/transcripts/${memberId}`);
            setTranscriptData(res.data);
            setSelectedMemberId(memberId);
            showToast('success', 'Official Service Transcript generated');
        } catch (err) {
            showToast('error', 'Failed to generate service transcript');
        } finally {
            setTranscriptLoading(false);
        }
    };

    const handlePrintCertificate = () => {
        if (!transcriptData) return;
        const printWindow = window.open('', '_blank');
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Official Service Certificate - ${transcriptData.officerName}</title>
                <style>
                    body { font-family: "Times New Roman", serif; margin: 40px; text-align: center; color: #021525; background: #fff; }
                    .border { border: 12px double #021525; padding: 40px; }
                    h1 { font-size: 26pt; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
                    h2 { font-size: 13pt; color: #4F46E5; font-weight: normal; margin-top: 0; text-transform: uppercase; letter-spacing: 3px; }
                    p { font-size: 13pt; line-height: 1.6; margin: 20px 0; }
                    .name { font-size: 24pt; font-weight: bold; text-decoration: underline; margin: 15px 0; }
                    .rank-badge { font-size: 16pt; color: #b45309; font-weight: bold; margin-bottom: 20px; }
                    .details { margin: 25px auto; width: 85%; border-collapse: collapse; text-align: left; }
                    .details td { padding: 9px 14px; border-bottom: 1px solid #cbd5e1; font-size: 11pt; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px; }
                    .sign-line { border-top: 1px solid #000; width: 220px; padding-top: 6px; font-size: 10pt; text-align: center; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="border">
                    <h2>Daystar University Doulos Ministry</h2>
                    <h1>Certificate of Outdoor Service & Ministry</h1>
                    <p>This is to certify that</p>
                    <div class="name">${transcriptData.officerName}</div>
                    <p>Student Admission Number: <strong>${transcriptData.admissionNumber}</strong> (${transcriptData.campus || 'Athi River'} Campus)<br />
                    has completed service with spiritual fidelity and physical competence, attaining the certified rank of:</p>
                    <div class="rank-badge">${(transcriptData.douloidRank || 'Douloid').toUpperCase()}</div>
                    
                    <table class="details">
                        <tr><td>Belay Master Qualification:</td><td><strong>${transcriptData.belayStatus || 'Standard'}</strong></td></tr>
                        <tr><td>Solo Outdoor Station Clearance:</td><td><strong>${transcriptData.soloStationAllowed ? 'Authorized' : 'Supervised Only'}</strong></td></tr>
                        <tr><td>Total Stewardship Points:</td><td><strong>${transcriptData.totalPoints || 0} Points</strong></td></tr>
                        <tr><td>Fellowship Meetings Attended:</td><td><strong>${transcriptData.fellowshipMeetingsCount || 0} Sessions</strong></td></tr>
                        <tr><td>Practical Outdoor Camps:</td><td><strong>${transcriptData.trainingsCount || 0} Camps</strong></td></tr>
                        <tr><td>Certification Code:</td><td><strong>US-G3-${transcriptData.admissionNumber}</strong></td></tr>
                    </table>

                    <div class="signatures">
                        <div class="sign-line">G3 Secretariat & Records</div>
                        <div class="sign-line">G1 Executive Coordinator</div>
                    </div>
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    // Pastoral Care Actions
    const handleUpdateCareStatus = async (id, status) => {
        try {
            await api.put(`/support-requests/${id}`, { status });
            showToast('success', `Request marked as ${status}`);
            loadPortalData();
        } catch (err) {
            showToast('error', 'Failed to update request status');
        }
    };

    const handleAddCareNote = async (id) => {
        if (!careNoteText.trim()) return;
        try {
            setSavingCareNote(true);
            await api.post(`/support-requests/${id}/notes`, { text: careNoteText.trim() });
            showToast('success', 'Counseling note recorded');
            setCareNoteText('');
            loadPortalData();
        } catch (err) {
            showToast('error', 'Failed to add note');
        } finally {
            setSavingCareNote(false);
        }
    };

    const handleSignOut = () => {
        localStorage.clear();
        navigate('/admin');
    };

    // Reset Builder Form
    const startNewFellowship = () => {
        setBuilderForm({
            _id: null,
            title: '',
            date: new Date().toISOString().split('T')[0],
            theme: '',
            scriptureReference: '',
            scriptureText: '',
            devotional: '',
            reflectionQuestion: '',
            prayer: '',
            communityPrompt: '',
            coverImage: '',
            campus: 'All',
            status: 'DRAFT',
            scheduledAt: ''
        });
        setActiveTab('create');
    };

    // Populate Builder for Editing
    const handleEditFellowship = (item) => {
        setBuilderForm({
            _id: item._id,
            title: item.title || '',
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            theme: item.theme || '',
            scriptureReference: item.scriptureReference || '',
            scriptureText: item.scriptureText || '',
            devotional: item.devotional || '',
            reflectionQuestion: item.reflectionQuestion || '',
            prayer: item.prayer || '',
            communityPrompt: item.communityPrompt || '',
            coverImage: item.coverImage || '',
            campus: item.campus || 'All',
            status: item.status || 'DRAFT',
            scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().split('T')[0] : ''
        });
        setActiveTab('create');
    };

    // Save or Publish Devotional
    const handleSaveFellowship = async (targetStatus = 'DRAFT') => {
        if (!builderForm.title.trim()) {
            showToast('error', 'Please provide a title for the devotional');
            return;
        }
        if (!builderForm.devotional.trim()) {
            showToast('error', 'Please write the devotional message');
            return;
        }

        try {
            setIsSaving(true);
            const payload = {
                ...builderForm,
                status: targetStatus
            };

            if (builderForm._id) {
                await api.put(`/fellowships/${builderForm._id}`, payload);
                showToast('success', `Devotional ${targetStatus.toLowerCase()} updated`);
            } else {
                await api.post('/fellowships', payload);
                showToast('success', `Devotional saved as ${targetStatus.toLowerCase()}`);
            }

            setConfirmPublishOpen(false);
            loadPortalData();
            setActiveTab('fellowship');
        } catch (err) {
            console.error('Error saving devotional:', err);
            showToast('error', err.response?.data?.message || 'Failed to save devotional');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFellowship = async (id) => {
        if (!window.confirm('Are you sure you want to remove this devotional entry?')) return;
        try {
            await api.delete(`/fellowships/${id}`);
            showToast('success', 'Devotional removed');
            loadPortalData();
        } catch (err) {
            showToast('error', 'Failed to remove devotional');
        }
    };

    const filteredFellowships = fellowships.filter(f => {
        if (fellowshipSubTab !== 'all' && f.status?.toLowerCase() !== fellowshipSubTab) {
            return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = (f.title || '').toLowerCase().includes(q);
            const matchRef = (f.scriptureReference || '').toLowerCase().includes(q);
            const matchTheme = (f.theme || '').toLowerCase().includes(q);
            return matchTitle || matchRef || matchTheme;
        }
        return true;
    });

    const todayFellowship = dashboardData?.todayFellowship;
    const stats = dashboardData?.stats || {
        totalFellowships: fellowships.length,
        todayReach: 0,
        todayReflections: 0,
        todayPrayers: 0
    };

    const getPageTitle = (tab) => {
        switch (tab) {
            case 'fellowship':
                return 'Daily Devotionals Library';
            case 'create':
                return 'Devotional Studio & Live Preview';
            case 'minutes':
                return 'Executive Governance Minutes Vault';
            case 'transcripts':
                return 'Official Service Transcripts & Certificates';
            case 'care':
                return 'Pastoral Care & Member Prayer Requests';
            case 'dashboard':
            default:
                return 'Secretariat & Spiritual Ministry Command';
        }
    };

    const navItems = [
        { id: 'dashboard', label: "Today's Word", icon: LayoutDashboard },
        { id: 'fellowship', label: 'Devotionals Library', icon: BookOpen, badge: fellowships.length },
        { id: 'create', label: 'Devotional Studio', icon: Feather },
        { id: 'minutes', label: 'Minutes Vault', icon: FileText, comingSoon: true },
        { id: 'transcripts', label: 'Service Transcripts', icon: Award, comingSoon: true },
        { id: 'care', label: 'Pastoral Care', icon: HeartHandshake, comingSoon: true }
    ];

    return (
        <div className="g3-portal-root">
            {/* Mobile Backdrop */}
            {mobileNavOpen && (
                <div
                    className="g3-sidebar-backdrop"
                    onClick={() => setMobileNavOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`g3-sidebar ${mobileNavOpen ? 'open' : ''}`}>
                <div className="g3-sidebar-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="g3-brand-logo-box" title="Doulos Logo">
                            <Logo size={32} showText={false} />
                        </div>
                        <div className="g3-brand-titles">
                            <span className="g3-brand-title">Doulos {rolePrefix}</span>
                            <span className="g3-brand-subtitle">Daily Devotional</span>
                        </div>
                    </div>
                    {mobileNavOpen && (
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(false)}
                            className="g3-sidebar-close-btn"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav className="g3-nav-list">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`g3-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (item.comingSoon) {
                                        setComingSoonModal(item);
                                        setMobileNavOpen(false);
                                        return;
                                    }
                                    setActiveTab(item.id);
                                    setMobileNavOpen(false);
                                }}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                                {item.comingSoon ? (
                                    <span className="g3-nav-soon-pill">SOON</span>
                                ) : item.badge != null ? (
                                    <span className="g3-nav-badge">{item.badge}</span>
                                ) : null}
                            </button>
                        );
                    })}
                </nav>

                <div className="g3-sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="g3-avatar">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="g3-user-name">
                                {username}
                            </span>
                            <span className="g3-user-role">
                                {displayRole}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        title="Sign Out"
                        className="g3-logout-btn"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="g3-main-wrapper">
                {/* Topbar */}
                <header className="g3-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <button
                            type="button"
                            className="g3-menu-toggle"
                            onClick={() => setMobileNavOpen(!mobileNavOpen)}
                            aria-label="Toggle Navigation"
                        >
                            <Menu size={19} />
                        </button>
                        <div>
                            <h1 className="g3-page-title">{getPageTitle(activeTab)}</h1>
                            <p className="g3-page-subtitle">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • Athi River & Nairobi
                            </p>
                        </div>
                    </div>

                    <div className="g3-topbar-actions">
                        <button className="g3-icon-btn" onClick={loadPortalData} title="Refresh Devotionals">
                            <RefreshCw size={16} className={loading ? 'g5-spin' : ''} />
                        </button>
                        <button className="g3-btn-primary" onClick={startNewFellowship}>
                            <Plus size={16} /> Write Devotional
                        </button>
                    </div>
                </header>

                {/* Toast Notification */}
                {toast && (
                    <div style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        background: toast.type === 'error' ? '#991B1B' : '#0F172A',
                        color: '#FFF',
                        padding: '0.9rem 1.4rem',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        {toast.type === 'error' ? <X size={16} /> : <CheckCircle2 size={16} color="#34D399" />}
                        <span>{toast.message}</span>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="g3-main-content">
                    {/* ========================================================
                        TAB 1: TODAY'S DEVOTIONAL & COMMAND CENTRE
                       ======================================================== */}
                    {activeTab === 'dashboard' && (
                        <div>
                            {/* Welcome Hero Banner */}
                            <div className="sm-welcome-hero">
                                <div>
                                    <h2 className="sm-welcome-title">Daily Devotional Ministry</h2>
                                    <p className="sm-welcome-sub">
                                        Welcome back, <strong>{username}</strong>. Prepare and publish today's scripture meditation and reflection for students across Athi River & Nairobi campuses.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button className="sm-btn-primary" onClick={startNewFellowship}>
                                        <Plus size={15} /> Write Devotional
                                    </button>
                                    <button
                                        className="sm-btn-secondary"
                                        onClick={() => setActiveTab('fellowship')}
                                    >
                                        <BookOpen size={15} /> View All ({fellowships.length})
                                    </button>
                                </div>
                            </div>

                            {/* 3 Real Devotional KPIs */}
                            <div className="sm-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                <div className="sm-kpi-card">
                                    <div className="sm-kpi-label">Today's Devotional</div>
                                    <div className="sm-kpi-val" style={{ color: todayFellowship ? 'var(--sm-accent-sage)' : 'var(--sm-text-muted)' }}>
                                        {todayFellowship ? 'Published' : 'Draft'}
                                    </div>
                                    <div className="sm-kpi-subtitle">
                                        <Sparkles size={13} color="var(--sm-accent-gold)" />
                                        {todayFellowship ? (todayFellowship.title || 'Live for members') : 'None published yet'}
                                    </div>
                                </div>

                                <div className="sm-kpi-card">
                                    <div className="sm-kpi-label">Total Devotionals</div>
                                    <div className="sm-kpi-val" style={{ color: 'var(--sm-accent-gold)' }}>
                                        {fellowships.length}
                                    </div>
                                    <div className="sm-kpi-subtitle">
                                        Published & Draft entries in library
                                    </div>
                                </div>

                                <div className="sm-kpi-card">
                                    <div className="sm-kpi-label">Today's Readers</div>
                                    <div className="sm-kpi-val" style={{ color: 'var(--sm-accent-indigo)' }}>
                                        {todayFellowship?.openedCount || stats.todayReach || 0}
                                    </div>
                                    <div className="sm-kpi-subtitle">
                                        Members opened today's reflection
                                    </div>
                                </div>
                            </div>

                            {/* Today's Devotional Editorial Hero Card */}
                            <div className="sm-editorial-hero">
                                {todayFellowship ? (
                                    <div>
                                        <div className="sm-editorial-meta">
                                            <Sparkles size={14} /> Today's Active Devotional • {todayFellowship.theme || 'Spiritual Growth'}
                                        </div>
                                        <h2 className="sm-editorial-title">{todayFellowship.title}</h2>
                                        
                                        {todayFellowship.scriptureReference && (
                                            <div className="sm-scripture-callout">
                                                <div className="sm-scripture-ref">{todayFellowship.scriptureReference}</div>
                                                {todayFellowship.scriptureText && (
                                                    <p className="sm-scripture-quote">"{todayFellowship.scriptureText}"</p>
                                                )}
                                            </div>
                                        )}

                                        <div style={{
                                            fontSize: '0.95rem',
                                            lineHeight: '1.65',
                                            color: 'var(--sm-text-secondary)',
                                            maxHeight: '120px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            marginBottom: '1.25rem'
                                        }}>
                                            {todayFellowship.devotional}
                                        </div>

                                        <div className="sm-hero-metrics">
                                            <div className="sm-metric-item">
                                                <Eye size={15} color="var(--sm-accent-gold)" />
                                                <span><strong className="sm-metric-val">{todayFellowship.openedCount || 0}</strong> Opened</span>
                                            </div>
                                            <div className="sm-metric-item">
                                                <Edit3 size={15} color="var(--sm-accent-sage)" />
                                                <span><strong className="sm-metric-val">{todayFellowship.reflectionsCount || 0}</strong> Reflections</span>
                                            </div>
                                            <div className="sm-metric-item">
                                                <Bookmark size={15} color="var(--sm-accent-blue)" />
                                                <span><strong className="sm-metric-val">{todayFellowship.prayerInteractionsCount || 0}</strong> Prayers</span>
                                            </div>
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.65rem' }}>
                                                <button className="sm-btn-secondary" onClick={() => handleEditFellowship(todayFellowship)}>
                                                    <Edit3 size={14} /> Edit Devotional
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                                        <BookOpen size={44} color="var(--sm-accent-gold)" style={{ opacity: 0.8, marginBottom: '1rem' }} />
                                        <h2 className="sm-editorial-title" style={{ fontSize: '1.6rem' }}>Nothing Published for Today Yet</h2>
                                        <p style={{ color: 'var(--sm-text-secondary)', maxWidth: '480px', margin: '0.5rem auto 1.5rem', lineHeight: '1.5' }}>
                                            Prepare today's Scripture and devotional word to give members uplifting reflection before or after their sessions.
                                        </p>
                                        <button className="sm-btn-primary" onClick={startNewFellowship}>
                                            <Plus size={16} /> Write Today's Devotional
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Split Dashboard: Upcoming Drafts & Recent Activity */}
                            <div className="sm-dashboard-split">
                                {/* Left: Devotional Schedule & Drafts */}
                                <div className="sm-panel">
                                    <div className="sm-panel-header">
                                        <h3 className="sm-panel-title">
                                            <Calendar size={18} color="var(--sm-accent-blue)" />
                                            Upcoming Schedule & Drafts
                                        </h3>
                                        <button className="sm-btn-ghost" onClick={() => setActiveTab('fellowship')}>
                                            View All <ChevronRight size={14} />
                                        </button>
                                    </div>

                                    {dashboardData?.upcoming && dashboardData.upcoming.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {dashboardData.upcoming.map(u => (
                                                <div key={u._id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '0.85rem 1rem',
                                                    borderRadius: 'var(--sm-radius-md)',
                                                    border: '1px solid var(--sm-border-subtle)',
                                                    background: 'var(--sm-bg)'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.title}</div>
                                                        <div style={{ fontSize: '0.76rem', color: 'var(--sm-text-muted)' }}>
                                                            {new Date(u.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {u.scriptureReference}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                        <span className={`sm-status-badge ${u.status === 'SCHEDULED' ? 'sm-badge-scheduled' : 'sm-badge-draft'}`}>
                                                            {u.status}
                                                        </span>
                                                        <button className="sm-btn-ghost" onClick={() => handleEditFellowship(u)}>
                                                            <Edit3 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--sm-text-muted)', fontSize: '0.88rem' }}>
                                            No future devotionals scheduled yet. Click "Write Devotional" to prepare one.
                                        </div>
                                    )}
                                </div>

                                {/* Right: Recent Devotional Engagement Activity */}
                                <div className="sm-panel">
                                    <div className="sm-panel-header">
                                        <h3 className="sm-panel-title">
                                            <Compass size={18} color="var(--sm-accent-gold)" />
                                            Devotional Engagement Pulse
                                        </h3>
                                    </div>
                                    <div className="sm-activity-list">
                                        <div className="sm-activity-item">
                                            <div className="sm-activity-dot" />
                                            <div>
                                                <div className="sm-activity-text">
                                                    <strong>{todayFellowship?.openedCount || stats.todayReach || 0} members</strong> opened today's devotional
                                                </div>
                                                <div className="sm-activity-time">Athi River & Nairobi Campuses</div>
                                            </div>
                                        </div>
                                        <div className="sm-activity-item">
                                            <div className="sm-activity-dot" style={{ background: 'var(--sm-accent-sage)' }} />
                                            <div>
                                                <div className="sm-activity-text">
                                                    <strong>{todayFellowship?.reflectionsCount || stats.todayReflections || 0} members</strong> saved personal reflections
                                                </div>
                                                <div className="sm-activity-time">Private & encrypted in student journals</div>
                                            </div>
                                        </div>
                                        <div className="sm-activity-item">
                                            <div className="sm-activity-dot" style={{ background: 'var(--sm-accent-blue)' }} />
                                            <div>
                                                <div className="sm-activity-text">
                                                    <strong>{todayFellowship?.prayerInteractionsCount || stats.todayPrayers || 0} members</strong> engaged with the closing prayer
                                                </div>
                                                <div className="sm-activity-time">Spiritual fellowship community active</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================
                        TAB 2: ALL DEVOTIONALS LIST
                       ======================================================== */}
                    {activeTab === 'fellowship' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                {/* Filter Sub-Tabs */}
                                <div style={{ display: 'flex', gap: '0.45rem', background: '#FFF', padding: '4px', borderRadius: '12px', border: '1px solid var(--sm-border)' }}>
                                    {['all', 'published', 'scheduled', 'draft', 'archived'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setFellowshipSubTab(t)}
                                            style={{
                                                padding: '0.45rem 0.95rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: fellowshipSubTab === t ? 'var(--sm-accent-gold)' : 'transparent',
                                                color: fellowshipSubTab === t ? '#FFF' : 'var(--sm-text-secondary)',
                                                fontWeight: 700,
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                {/* Search Bar */}
                                <div style={{ position: 'relative', width: '280px' }}>
                                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sm-text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search scripture, title..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="sm-input"
                                        style={{ paddingLeft: '2.3rem', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            {/* Devotional Cards Grid */}
                            {filteredFellowships.length > 0 ? (
                                <div className="sm-fellowship-grid">
                                    {filteredFellowships.map(f => {
                                        const isPublished = f.status === 'PUBLISHED';
                                        const isScheduled = f.status === 'SCHEDULED';
                                        const isDraft = f.status === 'DRAFT';

                                        return (
                                            <div key={f._id} className="sm-content-card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                                    <span className={`sm-status-badge ${
                                                        isPublished ? 'sm-badge-published' :
                                                        isScheduled ? 'sm-badge-scheduled' :
                                                        isDraft ? 'sm-badge-draft' : 'sm-badge-archived'
                                                    }`}>
                                                        {f.status}
                                                    </span>
                                                    <span style={{ fontSize: '0.76rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>
                                                        {new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: '0.74rem', color: 'var(--sm-accent-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                                                    {f.theme || 'Spiritual Growth'}
                                                </div>

                                                <h3 className="sm-content-card-title">
                                                    {f.title}
                                                </h3>

                                                {f.scriptureReference && (
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--sm-text-secondary)', fontStyle: 'italic', marginBottom: '0.65rem' }}>
                                                        "{f.scriptureReference}"
                                                    </div>
                                                )}

                                                <p className="sm-content-card-excerpt">
                                                    {f.devotional}
                                                </p>

                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--sm-border-subtle)' }}>
                                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.76rem', color: 'var(--sm-text-muted)' }}>
                                                        <span><Eye size={12} style={{ verticalAlign: '-1px' }} /> {f.openedCount || 0}</span>
                                                        <span><Bookmark size={12} style={{ verticalAlign: '-1px' }} /> {f.prayerInteractionsCount || 0}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                                                        <button
                                                            className="sm-btn-ghost"
                                                            onClick={() => handleEditFellowship(f)}
                                                            title="Edit Devotional"
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>
                                                        <button
                                                            className="sm-btn-ghost"
                                                            style={{ color: '#EF4444' }}
                                                            onClick={() => handleDeleteFellowship(f._id)}
                                                            title="Delete Devotional"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="sm-empty-state">
                                    <BookOpen size={48} color="var(--sm-border)" style={{ marginBottom: '1rem' }} />
                                    <h3>No Devotionals Found</h3>
                                    <p>Try switching the filter or click "Write Devotional" to craft a new entry.</p>
                                    <button className="sm-btn-primary" onClick={startNewFellowship} style={{ marginTop: '1rem' }}>
                                        <Plus size={16} /> Write Devotional
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================
                        TAB 3: DEVOTIONAL STUDIO & BUILDER
                       ======================================================== */}
                    {activeTab === 'create' && (
                        <div className="sm-builder-layout">
                            {/* Left: Devotional Editor Form */}
                            <div className="sm-builder-form">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h2 style={{ fontFamily: 'var(--sm-font-serif)', fontSize: '1.45rem', margin: 0 }}>
                                            {builderForm._id ? 'Edit Devotional' : 'Craft Daily Devotional'}
                                        </h2>
                                        <p style={{ color: 'var(--sm-text-secondary)', fontSize: '0.84rem', margin: '0.2rem 0 0' }}>
                                            Enter today's scripture and devotional reflection for students
                                        </p>
                                    </div>
                                    <span className="sm-status-badge sm-badge-draft">
                                        {builderForm.status || 'DRAFT'}
                                    </span>
                                </div>

                                <div className="sm-form-grid">
                                    <div className="sm-form-group">
                                        <label className="sm-form-label">Devotional Title *</label>
                                        <input
                                            type="text"
                                            className="sm-form-input"
                                            placeholder="e.g. Walking in Surrender & Faith"
                                            value={builderForm.title}
                                            onChange={e => setBuilderForm({ ...builderForm, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="sm-form-group">
                                        <label className="sm-form-label">Devotional Date *</label>
                                        <input
                                            type="date"
                                            className="sm-form-input"
                                            value={builderForm.date}
                                            onChange={e => setBuilderForm({ ...builderForm, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="sm-form-grid">
                                    <div className="sm-form-group">
                                        <label className="sm-form-label">Spiritual Theme</label>
                                        <input
                                            type="text"
                                            className="sm-form-input"
                                            placeholder="e.g. Humility, Endurance, Prayer"
                                            value={builderForm.theme}
                                            onChange={e => setBuilderForm({ ...builderForm, theme: e.target.value })}
                                        />
                                    </div>

                                    <div className="sm-form-group">
                                        <label className="sm-form-label">Scripture Reference</label>
                                        <input
                                            type="text"
                                            className="sm-form-input"
                                            placeholder="e.g. Philippians 2:3-5"
                                            value={builderForm.scriptureReference}
                                            onChange={e => setBuilderForm({ ...builderForm, scriptureReference: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="sm-form-group">
                                    <label className="sm-form-label">Scripture Verse Text</label>
                                    <textarea
                                        className="sm-form-input"
                                        rows={2}
                                        placeholder="Paste the scripture verse text here..."
                                        value={builderForm.scriptureText}
                                        onChange={e => setBuilderForm({ ...builderForm, scriptureText: e.target.value })}
                                    />
                                </div>

                                <div className="sm-form-group">
                                    <label className="sm-form-label">Devotional Word *</label>
                                    <textarea
                                        className="sm-form-input"
                                        rows={6}
                                        placeholder="Write today's devotional reflection for Doulos members..."
                                        value={builderForm.devotional}
                                        onChange={e => setBuilderForm({ ...builderForm, devotional: e.target.value })}
                                    />
                                </div>

                                <div className="sm-form-group">
                                    <label className="sm-form-label">Personal Reflection Question</label>
                                    <input
                                        type="text"
                                        className="sm-form-input"
                                        placeholder="e.g. Where in your life are you called to choose humility today?"
                                        value={builderForm.reflectionQuestion}
                                        onChange={e => setBuilderForm({ ...builderForm, reflectionQuestion: e.target.value })}
                                    />
                                </div>

                                <div className="sm-form-group">
                                    <label className="sm-form-label">Closing Prayer</label>
                                    <textarea
                                        className="sm-form-input"
                                        rows={2}
                                        placeholder="e.g. Lord, give us servant hearts like Christ today..."
                                        value={builderForm.prayer}
                                        onChange={e => setBuilderForm({ ...builderForm, prayer: e.target.value })}
                                    />
                                </div>

                                <div className="sm-form-group">
                                    <label className="sm-form-label">Community Sharing Circle Prompt</label>
                                    <input
                                        type="text"
                                        className="sm-form-input"
                                        placeholder="e.g. Share an experience of grace with another brother/sister this week"
                                        value={builderForm.communityPrompt}
                                        onChange={e => setBuilderForm({ ...builderForm, communityPrompt: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--sm-border)' }}>
                                    <button
                                        type="button"
                                        className="sm-btn-secondary"
                                        onClick={() => handleSaveFellowship('DRAFT')}
                                        disabled={isSaving}
                                    >
                                        Save as Draft
                                    </button>

                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            type="button"
                                            className="sm-btn-secondary"
                                            onClick={() => setActiveTab('fellowship')}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="sm-btn-primary"
                                            onClick={() => setConfirmPublishOpen(true)}
                                            disabled={isSaving || !builderForm.title.trim() || !builderForm.devotional.trim()}
                                        >
                                            <Send size={15} /> Publish Devotional
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Apple iPhone Simulator Testing Suite */}
                            <div className="sm-simulator-wrapper">
                                {/* macOS Apple Simulator Window Header */}
                                <div className="apple-simulator-window">
                                    <div className="apple-traffic-lights">
                                        <div className="apple-traffic-dot apple-traffic-close" title="Close"></div>
                                        <div className="apple-traffic-dot apple-traffic-min" title="Minimize"></div>
                                        <div className="apple-traffic-dot apple-traffic-max" title="Zoom"></div>
                                    </div>
                                    <div className="apple-simulator-title">
                                        <span>iPhone 16 Pro</span>
                                        <span className="apple-simulator-badge">iOS 18.2</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setSimulatorTheme(simulatorTheme === 'dark' ? 'light' : 'dark')}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '4px 7px',
                                                color: '#E2E8F0',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700
                                            }}
                                            title="Toggle iPhone Dark/Light Mode"
                                        >
                                            {simulatorTheme === 'dark' ? <Sun size={12} color="#FBBF24" /> : <Moon size={12} color="#94A3B8" />}
                                            <span>{simulatorTheme === 'dark' ? 'Dark' : 'Light'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Physical Apple iPhone Chassis */}
                                <div className="iphone-device-chassis">
                                    {/* Hardware Side Buttons */}
                                    <div className="iphone-btn-action" title="Action Button"></div>
                                    <div className="iphone-btn-vol-up" title="Volume Up"></div>
                                    <div className="iphone-btn-vol-down" title="Volume Down"></div>
                                    <div className="iphone-btn-power" title="Side Button"></div>

                                    {/* iPhone Screen Viewport */}
                                    <div className={`iphone-screen-viewport ${simulatorTheme === 'dark' ? 'dark' : ''}`}>
                                        {/* Dynamic Island */}
                                        <div className="iphone-dynamic-island">
                                            <div className="iphone-camera-lens"></div>
                                            <div className="iphone-sensor-dot"></div>
                                        </div>

                                        {/* iOS Status Bar */}
                                        <div className="iphone-status-bar">
                                            <span className="iphone-status-time">9:41</span>
                                            <div className="iphone-status-icons">
                                                <Signal size={13} strokeWidth={2.5} />
                                                <Wifi size={13} strokeWidth={2.5} />
                                                <Battery size={15} strokeWidth={2.5} />
                                            </div>
                                        </div>

                                        {/* Doulos In-App Navigation Bar */}
                                        <div className="iphone-app-navbar">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sm-accent-gold)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                                <ArrowLeft size={16} />
                                                <span>Devotional</span>
                                            </div>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase', opacity: 0.85 }}>
                                                Doulos
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.75 }}>
                                                <Bookmark size={15} />
                                                <Share2 size={15} />
                                            </div>
                                        </div>

                                        {/* Scrollable Devotional Content */}
                                        <div style={{ padding: '1.25rem 1.15rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {/* Header & Theme Pill */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 900,
                                                    color: '#B45309',
                                                    background: '#FEF3C7',
                                                    padding: '0.2rem 0.55rem',
                                                    borderRadius: '12px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em'
                                                }}>
                                                    {builderForm.theme || "TODAY'S DEVOTIONAL"}
                                                </span>
                                                <span style={{ fontSize: '0.72rem', color: simulatorTheme === 'dark' ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                                                    {builderForm.date ? new Date(builderForm.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'}
                                                </span>
                                            </div>

                                            {/* Devotional Title */}
                                            <h2 style={{
                                                fontFamily: '"Playfair Display", Georgia, serif',
                                                fontSize: '1.38rem',
                                                fontWeight: 800,
                                                lineHeight: 1.3,
                                                margin: 0,
                                                color: simulatorTheme === 'dark' ? '#FFFFFF' : '#0F172A'
                                            }}>
                                                {builderForm.title || "Untitled Devotional"}
                                            </h2>

                                            {/* Scripture Reference Quote Card */}
                                            {builderForm.scriptureReference && (
                                                <div style={{
                                                    background: simulatorTheme === 'dark' ? 'rgba(217, 119, 6, 0.12)' : '#FFFDF8',
                                                    borderLeft: '3.5px solid #D97706',
                                                    borderTop: simulatorTheme === 'dark' ? '1px solid rgba(217, 119, 6, 0.25)' : '1px solid #FEF3C7',
                                                    borderRight: simulatorTheme === 'dark' ? '1px solid rgba(217, 119, 6, 0.25)' : '1px solid #FEF3C7',
                                                    borderBottom: simulatorTheme === 'dark' ? '1px solid rgba(217, 119, 6, 0.25)' : '1px solid #FEF3C7',
                                                    padding: '0.85rem 1rem',
                                                    borderRadius: '0 12px 12px 0'
                                                }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.76rem', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        {builderForm.scriptureReference}
                                                    </div>
                                                    <div style={{
                                                        fontFamily: '"Playfair Display", Georgia, serif',
                                                        fontStyle: 'italic',
                                                        fontSize: '0.88rem',
                                                        color: simulatorTheme === 'dark' ? '#E2E8F0' : '#334155',
                                                        marginTop: '4px',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        "{builderForm.scriptureText || 'Scripture reading for today...'}"
                                                    </div>
                                                </div>
                                            )}

                                            {/* Devotional Word */}
                                            <div style={{
                                                fontSize: '0.88rem',
                                                lineHeight: '1.68',
                                                color: simulatorTheme === 'dark' ? '#CBD5E1' : '#334155',
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {builderForm.devotional || 'Devotional reflection will appear here live as you type in the editor...'}
                                            </div>

                                            {/* Personal Reflection Card */}
                                            {builderForm.reflectionQuestion && (
                                                <div style={{
                                                    background: simulatorTheme === 'dark' ? '#1E293B' : '#F8FAFC',
                                                    border: simulatorTheme === 'dark' ? '1px solid #334155' : '1.5px solid #E2E8F0',
                                                    borderRadius: '14px',
                                                    padding: '1.1rem'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: 900, color: simulatorTheme === 'dark' ? '#38BDF8' : '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            MY REFLECTION
                                                        </div>
                                                        <span style={{ fontSize: '0.66rem', color: simulatorTheme === 'dark' ? '#94A3B8' : '#64748B', fontWeight: 700 }}>
                                                            🔒 Confidential
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: simulatorTheme === 'dark' ? '#F8FAFC' : '#0F172A', marginBottom: '0.65rem', lineHeight: '1.4' }}>
                                                        {builderForm.reflectionQuestion}
                                                    </div>
                                                    <textarea
                                                        rows={2}
                                                        readOnly
                                                        placeholder="Write your private reflection here (only you can see this)..."
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.6rem',
                                                            borderRadius: '8px',
                                                            border: simulatorTheme === 'dark' ? '1px solid #475569' : '1.5px solid #CBD5E1',
                                                            background: simulatorTheme === 'dark' ? '#0F172A' : '#FFFFFF',
                                                            color: simulatorTheme === 'dark' ? '#F8FAFC' : '#0F172A',
                                                            fontSize: '0.8rem',
                                                            outline: 'none',
                                                            boxSizing: 'border-box',
                                                            fontFamily: 'inherit',
                                                            marginBottom: '0.5rem',
                                                            cursor: 'default'
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        style={{
                                                            padding: '0.4rem 0.85rem',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: '#1D4ED8',
                                                            color: '#FFFFFF',
                                                            fontWeight: 800,
                                                            fontSize: '0.76rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Save Note
                                                    </button>
                                                </div>
                                            )}

                                            {/* Closing Prayer Card */}
                                            {builderForm.prayer && (
                                                <div style={{
                                                    background: simulatorTheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'linear-gradient(135deg, #FFFDF8 0%, #FFFBEB 100%)',
                                                    border: simulatorTheme === 'dark' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #FEF3C7',
                                                    borderRadius: '14px',
                                                    padding: '1.1rem'
                                                }}>
                                                    <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                                                        CLOSING PRAYER
                                                    </div>
                                                    <div style={{ fontSize: '0.84rem', color: simulatorTheme === 'dark' ? '#FDE68A' : '#78350F', fontStyle: 'italic', lineHeight: '1.55', marginBottom: '0.75rem' }}>
                                                        "{builderForm.prayer}"
                                                    </div>
                                                    <button
                                                        type="button"
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.55rem',
                                                            borderRadius: '10px',
                                                            border: '1px solid #F59E0B',
                                                            background: simulatorTheme === 'dark' ? '#1E293B' : '#FFFFFF',
                                                            color: '#D97706',
                                                            fontWeight: 800,
                                                            fontSize: '0.78rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        🙏 Say Amen
                                                    </button>
                                                </div>
                                            )}

                                            {/* Community Sharing Circle */}
                                            {builderForm.communityPrompt && (
                                                <div style={{
                                                    background: simulatorTheme === 'dark' ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
                                                    border: simulatorTheme === 'dark' ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid #C7D2FE',
                                                    borderRadius: '14px',
                                                    padding: '1rem'
                                                }}>
                                                    <div style={{ fontSize: '0.68rem', fontWeight: 900, color: simulatorTheme === 'dark' ? '#818CF8' : '#4338CA', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                                        COMMUNITY SHARING CIRCLE
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', color: simulatorTheme === 'dark' ? '#C7D2FE' : '#312E81', lineHeight: '1.45', fontWeight: 600 }}>
                                                        {builderForm.communityPrompt}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* iOS Home Indicator */}
                                        <div className="iphone-home-indicator"></div>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                    <Sparkles size={12} color="var(--sm-accent-gold)" />
                                    <span>Live Apple Simulator • Updates in real-time as you write</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Coming Soon workspace for upcoming directorate modules if tab is directly navigated */}
                    {(activeTab === 'minutes' || activeTab === 'transcripts' || activeTab === 'care') && (
                        <G5ComingSoonWorkspace
                            moduleKey={activeTab}
                            itemInfo={navItems.find(i => i.id === activeTab)}
                            onNavigateTab={(tab) => setActiveTab(tab)}
                        />
                    )}
                </main>
            </div>

            {/* Native Mobile Bottom Nav */}
            <nav className="g3-mobile-bottom-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`g3-bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => {
                            if (item.comingSoon) {
                                setComingSoonModal(item);
                                return;
                            }
                            setActiveTab(item.id);
                        }}
                    >
                        <item.icon size={18} />
                        <span>{item.label.split(' ')[0]}</span>
                        {item.comingSoon && (
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#D97706', lineHeight: 1 }}>SOON</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Coming Soon Interactive Modal */}
            {comingSoonModal && (
                <ComingSoonModal
                    itemInfo={comingSoonModal}
                    moduleKey={comingSoonModal.id}
                    onClose={() => setComingSoonModal(null)}
                />
            )}

            {/* Modal: Confirm Devotional Publish */}
            {confirmPublishOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '24px',
                        padding: '2.2rem',
                        maxWidth: '460px',
                        width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--sm-border)'
                    }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--sm-accent-gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                            <Send size={22} color="var(--sm-accent-gold)" />
                        </div>
                        <h3 style={{ fontFamily: 'var(--sm-font-serif)', fontSize: '1.4rem', margin: '0 0 0.5rem' }}>
                            Publish Devotional?
                        </h3>
                        <p style={{ color: 'var(--sm-text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1.5rem' }}>
                            This devotional will immediately become visible to Doulos members on the mobile app and student portal.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button className="sm-btn-secondary" onClick={() => setConfirmPublishOpen(false)}>
                                Cancel
                            </button>
                            <button className="sm-btn-primary" onClick={() => handleSaveFellowship('PUBLISHED')}>
                                Confirm & Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G3SpiritualPortal;
