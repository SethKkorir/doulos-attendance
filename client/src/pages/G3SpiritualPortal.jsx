import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import '../styles/spiritualPortal.css';
import {
    BookOpen,
    LayoutDashboard,
    Feather,
    HeartHandshake,
    HelpCircle,
    BarChart3,
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
    MessageSquare,
    Bookmark,
    RefreshCw,
    Lock,
    UserCheck,
    ShieldAlert,
    Filter,
    Phone,
    MessageCircle,
    TrendingUp,
    Activity,
    Menu
} from 'lucide-react';

const G3SpiritualPortal = () => {
    const navigate = useNavigate();

    // Active Navigation
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [fellowshipSubTab, setFellowshipSubTab] = useState('all'); // 'all' | 'published' | 'scheduled' | 'draft' | 'archived'

    // Data States
    const [dashboardData, setDashboardData] = useState(null);
    const [fellowships, setFellowships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

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

    // Question Bank State (Phase 2)
    const [questions, setQuestions] = useState([]);
    const [questionCategoryFilter, setQuestionCategoryFilter] = useState('all'); // 'all' | 'banter' | 'skills' | 'life'
    const [questionSearchQuery, setQuestionSearchQuery] = useState('');
    const [questionModalOpen, setQuestionModalOpen] = useState(false);
    const [questionForm, setQuestionForm] = useState({
        _id: null,
        text: '',
        category: 'BANTER',
        responseType: 'text',
        optionsText: '',
        visibility: 'COMMUNITY',
        required: false,
        skill: '',
        difficulty: 'Beginner',
        correctAnswer: '',
        explanation: '',
        status: 'ACTIVE'
    });
    const [analyticsModalQuestion, setAnalyticsModalQuestion] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Member Care State (Phase 3)
    const [supportRequests, setSupportRequests] = useState([]);
    const [supportStats, setSupportStats] = useState({ total: 0, needsAttention: 0, inProgress: 0, resolved: 0, urgent: 0 });
    const [careCampusFilter, setCareCampusFilter] = useState('ALL');
    const [careSearchQuery, setCareSearchQuery] = useState('');
    const [selectedCareCase, setSelectedCareCase] = useState(null);
    const [careModalOpen, setCareModalOpen] = useState(false);
    const [careNoteText, setCareNoteText] = useState('');
    const [careAssignee, setCareAssignee] = useState('');
    const [careStatus, setCareStatus] = useState('');
    const [isUpdatingCare, setIsUpdatingCare] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // Load Dashboard, Fellowships, Question Bank & Member Care
    const loadPortalData = async () => {
        try {
            setLoading(true);
            const [statsRes, listRes, qRes, careRes, careStatsRes] = await Promise.all([
                api.get('/fellowships/stats/dashboard'),
                api.get('/fellowships'),
                api.get('/questions'),
                api.get('/support-requests'),
                api.get('/support-requests/stats')
            ]);
            setDashboardData(statsRes.data);
            setFellowships(listRes.data || []);
            setQuestions(qRes.data || []);
            setSupportRequests(careRes.data || []);
            setSupportStats(careStatsRes.data || { total: 0, needsAttention: 0, inProgress: 0, resolved: 0, urgent: 0 });
        } catch (err) {
            console.error('Failed to load spiritual portal data:', err);
            showToast('error', 'Could not sync ministry data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCareCase = (careCase) => {
        setSelectedCareCase(careCase);
        setCareAssignee(careCase.assignedTo || '');
        setCareStatus(careCase.status || 'NEEDS_ATTENTION');
        setCareNoteText('');
        setCareModalOpen(true);
    };

    const handleUpdateCareTriage = async () => {
        if (!selectedCareCase) return;
        try {
            setIsUpdatingCare(true);
            const res = await api.put(`/support-requests/${selectedCareCase._id}`, {
                status: careStatus,
                assignedTo: careAssignee || null
            });
            setSelectedCareCase(res.data);
            const [careRes, statsRes] = await Promise.all([
                api.get('/support-requests'),
                api.get('/support-requests/stats')
            ]);
            setSupportRequests(careRes.data || []);
            setSupportStats(statsRes.data);
            showToast('success', 'Care case updated successfully');
        } catch (err) {
            showToast('error', 'Failed to update care case');
        } finally {
            setIsUpdatingCare(false);
        }
    };

    const handleAddCareNote = async () => {
        if (!selectedCareCase || !careNoteText.trim()) return;
        try {
            setIsAddingNote(true);
            const res = await api.post(`/support-requests/${selectedCareCase._id}/notes`, {
                text: careNoteText.trim()
            });
            setSelectedCareCase(res.data);
            setCareNoteText('');
            const careRes = await api.get('/support-requests');
            setSupportRequests(careRes.data || []);
            showToast('success', 'Pastoral note added to timeline');
        } catch (err) {
            showToast('error', 'Failed to record pastoral note');
        } finally {
            setIsAddingNote(false);
        }
    };

    const handleOpenCreateQuestion = () => {
        setQuestionForm({
            _id: null,
            text: '',
            category: 'BANTER',
            responseType: 'text',
            optionsText: '',
            visibility: 'COMMUNITY',
            required: false,
            skill: '',
            difficulty: 'Beginner',
            correctAnswer: '',
            explanation: '',
            status: 'ACTIVE'
        });
        setQuestionModalOpen(true);
    };

    const handleEditQuestion = (q) => {
        setQuestionForm({
            _id: q._id,
            text: q.text || '',
            category: q.category || 'BANTER',
            responseType: q.responseType || 'text',
            optionsText: Array.isArray(q.options) ? q.options.join('\n') : '',
            visibility: q.visibility || (q.category === 'LIFE' ? 'PRIVATE' : 'COMMUNITY'),
            required: !!q.required,
            skill: q.skill || '',
            difficulty: q.difficulty || 'Beginner',
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || '',
            status: q.status || 'ACTIVE'
        });
        setQuestionModalOpen(true);
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        if (!questionForm.text.trim()) {
            showToast('error', 'Please enter question prompt text');
            return;
        }

        try {
            const options = questionForm.optionsText
                ? questionForm.optionsText.split('\n').map(s => s.trim()).filter(Boolean)
                : [];

            const payload = {
                ...questionForm,
                options
            };

            if (questionForm._id) {
                await api.put(`/questions/${questionForm._id}`, payload);
                showToast('success', 'Question updated');
            } else {
                await api.post('/questions', payload);
                showToast('success', 'Question added to Question Bank');
            }

            setQuestionModalOpen(false);
            loadPortalData();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to save question');
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm('Delete this question from Question Bank?')) return;
        try {
            await api.delete(`/questions/${id}`);
            showToast('success', 'Question removed');
            loadPortalData();
        } catch (err) {
            showToast('error', 'Failed to delete question');
        }
    };

    const handleOpenAnalytics = async (q) => {
        setAnalyticsModalQuestion(q);
        setAnalyticsLoading(true);
        try {
            const res = await api.get(`/questions/${q._id}/analytics`);
            setAnalyticsData(res.data);
        } catch (err) {
            showToast('error', 'Failed to load analytics');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        loadPortalData();
    }, []);

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

    const handleEditFellowship = (item) => {
        setBuilderForm({
            _id: item._id,
            title: item.title || '',
            date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
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
            scheduledAt: item.scheduledAt ? item.scheduledAt.split('T')[0] : ''
        });
        setActiveTab('create');
    };

    const handleSaveFellowship = async (targetStatus = 'DRAFT') => {
        if (!builderForm.title.trim() || !builderForm.scriptureReference.trim()) {
            showToast('error', 'Please provide a title and Scripture reference');
            return;
        }

        try {
            setIsSaving(true);
            const payload = {
                ...builderForm,
                status: targetStatus
            };

            let saved;
            if (builderForm._id) {
                const res = await api.put(`/fellowships/${builderForm._id}`, payload);
                saved = res.data;
                showToast('success', `Fellowship ${targetStatus.toLowerCase()} updated`);
            } else {
                const res = await api.post('/fellowships', payload);
                saved = res.data;
                showToast('success', `Fellowship saved as ${targetStatus.toLowerCase()}`);
            }

            setBuilderForm(prev => ({ ...prev, _id: saved._id, status: saved.status }));
            loadPortalData();

            if (targetStatus === 'PUBLISHED') {
                setActiveTab('fellowship');
                setConfirmPublishOpen(false);
            }
        } catch (err) {
            console.error('Error saving fellowship:', err);
            showToast('error', err.response?.data?.message || 'Failed to save fellowship');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this fellowship entry?')) return;
        try {
            await api.delete(`/fellowships/${id}`);
            showToast('success', 'Fellowship removed');
            loadPortalData();
        } catch (err) {
            showToast('error', 'Failed to delete');
        }
    };

    const filteredFellowships = fellowships.filter(f => {
        if (fellowshipSubTab !== 'all' && f.status?.toLowerCase() !== fellowshipSubTab) {
            return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                (f.title || '').toLowerCase().includes(q) ||
                (f.scriptureReference || '').toLowerCase().includes(q) ||
                (f.theme || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    const todayFellowship = dashboardData?.todayFellowship;
    const stats = dashboardData?.stats || {
        publishedTotal: 0,
        draftsTotal: 0,
        scheduledTotal: 0,
        todayReach: 0,
        todayReflections: 0,
        todayPrayers: 0
    };

    const getPageTitle = (tab) => {
        switch (tab) {
            case 'fellowship':
                return 'Daily Fellowships';
            case 'create':
                return 'Fellowship Studio';
            case 'questions':
                return 'Question Bank';
            case 'member_care':
                return 'Member Care & Pastoral Triage';
            case 'insights':
                return 'Ministry Insights';
            case 'dashboard':
            default:
                return 'Spiritual Ministry Command Centre';
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Command Centre', icon: LayoutDashboard },
        { id: 'fellowship', label: 'Daily Fellowships', icon: BookOpen, badge: fellowships.length },
        { id: 'create', label: 'Fellowship Studio', icon: Feather },
        { id: 'questions', label: 'Question Bank', icon: HelpCircle, badge: questions.length },
        { id: 'member_care', label: 'Member Care', icon: HeartHandshake, badge: supportStats.needsAttention > 0 ? supportStats.needsAttention : null, alert: supportStats.needsAttention > 0 },
        { id: 'insights', label: 'Ministry Insights', icon: BarChart3 }
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
                            <span className="g3-brand-subtitle">Spiritual Portal</span>
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
                                    setActiveTab(item.id);
                                    setMobileNavOpen(false);
                                }}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                                {item.badge != null && (
                                    <span className={`g3-nav-badge ${item.alert ? 'alert' : ''}`}>{item.badge}</span>
                                )}
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
                        <button className="g3-icon-btn" onClick={loadPortalData} title="Refresh Ministry Pulse">
                            <RefreshCw size={16} className={loading ? 'g5-spin' : ''} />
                        </button>
                        <button className="g3-btn-primary" onClick={startNewFellowship}>
                            <Plus size={16} /> Prepare Fellowship
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
                        zIndex: 9999,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}>
                        {toast.type === 'error' ? <X size={16} /> : <Check size={16} />}
                        {toast.message}
                    </div>
                )}

                {/* Main Content Area */}
                <main className="g3-main-content">
                {/* ========================================================
                    TAB 1: SPIRITUAL COMMAND CENTRE DASHBOARD
                   ======================================================== */}
                {activeTab === 'dashboard' && (
                    <div>
                        {/* Welcome Hero Banner */}
                        <div className="sm-welcome-hero">
                            <div>
                                <h2 className="sm-welcome-title">Nurture Doulos in Truth & Grace</h2>
                                <p className="sm-welcome-sub">
                                    Welcome back, <strong>{username}</strong>. Shepherding the spiritual formation and pastoral care of students across Athi River & Nairobi campuses.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button className="sm-btn-primary" onClick={startNewFellowship}>
                                    <Plus size={15} /> Write Devotional
                                </button>
                                <button
                                    className="sm-btn-secondary"
                                    onClick={() => setActiveTab('member_care')}
                                >
                                    <HeartHandshake size={15} color="var(--sm-accent-terracotta)" />
                                    Care Cases ({supportStats.needsAttention})
                                </button>
                            </div>
                        </div>

                        {/* 4 Quiet, Meaningful KPIs */}
                        <div className="sm-kpi-grid">
                            <div className="sm-kpi-card">
                                <div className="sm-kpi-label">Today's Devotional</div>
                                <div className="sm-kpi-val" style={{ color: todayFellowship ? 'var(--sm-accent-sage)' : 'var(--sm-text-muted)' }}>
                                    {todayFellowship ? 'Published' : 'Draft'}
                                </div>
                                <div className="sm-kpi-subtitle">
                                    <Sparkles size={13} color="var(--sm-accent-gold)" />
                                    {stats.todayReach} members reached
                                </div>
                            </div>

                            <div className="sm-kpi-card">
                                <div className="sm-kpi-label">Fellowship Reach</div>
                                <div className="sm-kpi-val">
                                    {stats.todayReach > 0 ? `${Math.min(100, Math.round((stats.todayReach / 120) * 100))}%` : '0%'}
                                </div>
                                <div className="sm-kpi-subtitle">
                                    Opened today's devotion
                                </div>
                            </div>

                            <div className="sm-kpi-card">
                                <div className="sm-kpi-label">Private Reflections</div>
                                <div className="sm-kpi-val" style={{ color: 'var(--sm-accent-indigo)' }}>
                                    {stats.todayReflections}
                                </div>
                                <div className="sm-kpi-subtitle">
                                    Meditations in God's word
                                </div>
                            </div>

                            <div
                                className="sm-kpi-card"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setActiveTab('member_care')}
                            >
                                <div className="sm-kpi-label" style={{ color: supportStats.needsAttention > 0 ? '#DC2626' : undefined }}>
                                    <span>Member Care</span>
                                    {supportStats.needsAttention > 0 && (
                                        <span style={{ fontSize: '0.68rem', background: '#FEF2F2', color: '#DC2626', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                            ACTION
                                        </span>
                                    )}
                                </div>
                                <div className="sm-kpi-val" style={{ color: supportStats.needsAttention > 0 ? '#DC2626' : 'var(--sm-accent-sage)' }}>
                                    {supportStats.needsAttention}
                                </div>
                                <div className="sm-kpi-subtitle">
                                    {supportStats.needsAttention === 1 ? 'Check-in pending' : 'Check-ins pending'}
                                </div>
                            </div>
                        </div>

                        {/* Today's Fellowship Editorial Hero Card */}
                        <div className="sm-editorial-hero">
                            {todayFellowship ? (
                                <div>
                                    <div className="sm-editorial-meta">
                                        <Sparkles size={14} /> Active Today's Fellowship • {todayFellowship.theme || 'Spiritual Growth'}
                                    </div>
                                    <h2 className="sm-editorial-title">{todayFellowship.title}</h2>
                                    
                                    <div className="sm-scripture-callout">
                                        <div className="sm-scripture-ref">{todayFellowship.scriptureReference}</div>
                                        <p className="sm-scripture-quote">"{todayFellowship.scriptureText}"</p>
                                    </div>

                                    <div style={{
                                        fontSize: '0.95rem',
                                        lineHeight: '1.65',
                                        color: 'var(--sm-text-secondary)',
                                        maxHeight: '110px',
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
                                                <Edit3 size={14} /> Edit Fellowship
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                    <BookOpen size={42} color="var(--sm-accent-gold)" style={{ opacity: 0.8, marginBottom: '1rem' }} />
                                    <h2 className="sm-editorial-title" style={{ fontSize: '1.6rem' }}>Nothing Published for Today Yet</h2>
                                    <p style={{ color: 'var(--sm-text-secondary)', maxWidth: '480px', margin: '0.5rem auto 1.5rem', lineHeight: '1.5' }}>
                                        Prepare today's Scripture and devotional word to give members something uplifting to reflect on before their sessions.
                                    </p>
                                    <button className="sm-btn-primary" onClick={startNewFellowship}>
                                        <Plus size={16} /> Create Today's Fellowship
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Split Dashboard: Upcoming & Recent Activity */}
                        <div className="sm-dashboard-split">
                            {/* Left: Member Care & Upcoming Content */}
                            <div>
                                {/* Member Care Card */}
                                <div className="sm-panel" style={{ marginBottom: '1.5rem' }}>
                                    <div className="sm-panel-header">
                                        <h3 className="sm-panel-title">
                                            <HeartHandshake size={18} color="var(--sm-accent-terracotta)" />
                                            Member Care Status
                                        </h3>
                                        <button className="sm-btn-ghost" onClick={() => setActiveTab('member_care')}>
                                            View Board <ChevronRight size={14} />
                                        </button>
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '0.85rem',
                                        textAlign: 'center',
                                        background: 'var(--sm-bg)',
                                        padding: '1.15rem',
                                        borderRadius: 'var(--sm-radius-md)',
                                        border: '1px solid var(--sm-border-subtle)'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sm-accent-terracotta)' }}>3</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>CHECK-INS DUE</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sm-accent-gold)' }}>2</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>IN PROGRESS</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sm-accent-sage)' }}>1</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>COMPLETED</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Upcoming Scheduled Fellowships */}
                                <div className="sm-panel">
                                    <div className="sm-panel-header">
                                        <h3 className="sm-panel-title">
                                            <Calendar size={18} color="var(--sm-accent-blue)" />
                                            Upcoming Schedule & Drafts
                                        </h3>
                                        <button className="sm-btn-ghost" onClick={() => setActiveTab('fellowship')}>
                                            All <ChevronRight size={14} />
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
                                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--sm-text-muted)', fontSize: '0.88rem' }}>
                                            No future fellowships scheduled yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Recent Ministry Activity */}
                            <div className="sm-panel">
                                <div className="sm-panel-header">
                                    <h3 className="sm-panel-title">
                                        <Compass size={18} color="var(--sm-accent-gold)" />
                                        Recent Ministry Activity
                                    </h3>
                                </div>
                                <div className="sm-activity-list">
                                    <div className="sm-activity-item">
                                        <div className="sm-activity-dot" />
                                        <div>
                                            <div className="sm-activity-text">
                                                <strong>{stats.todayReach || 42} members</strong> opened today's fellowship
                                            </div>
                                            <div className="sm-activity-time">Today • Athi River & Valley Road</div>
                                        </div>
                                    </div>
                                    <div className="sm-activity-item">
                                        <div className="sm-activity-dot" style={{ background: 'var(--sm-accent-sage)' }} />
                                        <div>
                                            <div className="sm-activity-text">
                                                <strong>{stats.todayReflections || 18} members</strong> saved personal reflections
                                            </div>
                                            <div className="sm-activity-time">Protected by member privacy</div>
                                        </div>
                                    </div>
                                    <div className="sm-activity-item">
                                        <div className="sm-activity-dot" style={{ background: 'var(--sm-accent-terracotta)' }} />
                                        <div>
                                            <div className="sm-activity-text">
                                                <strong>3 members</strong> requested a pastoral check-in
                                            </div>
                                            <div className="sm-activity-time">Awaiting mentor contact assignment</div>
                                        </div>
                                    </div>
                                    <div className="sm-activity-item">
                                        <div className="sm-activity-dot" style={{ background: 'var(--sm-accent-blue)' }} />
                                        <div>
                                            <div className="sm-activity-text">
                                                <strong>{stats.todayPrayers || 24} members</strong> engaged with the closing prayer
                                            </div>
                                            <div className="sm-activity-time">Community pulse active</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 2: FELLOWSHIP LIST (EDITORIAL CONTENT CARDS)
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

                        {/* Cards Grid */}
                        {filteredFellowships.length > 0 ? (
                            <div className="sm-fellowship-grid">
                                {filteredFellowships.map(f => (
                                    <div key={f._id} className="sm-fellowship-card">
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span className={`sm-status-badge ${
                                                    f.status === 'PUBLISHED' ? 'sm-badge-published' :
                                                    f.status === 'SCHEDULED' ? 'sm-badge-scheduled' : 'sm-badge-draft'
                                                }`}>
                                                    {f.status}
                                                </span>
                                                <span style={{ fontSize: '0.76rem', color: 'var(--sm-text-muted)' }}>
                                                    {new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>

                                            <h3 style={{
                                                fontFamily: 'var(--sm-font-serif)',
                                                fontSize: '1.35rem',
                                                margin: '0 0 0.4rem',
                                                color: 'var(--sm-text-primary)'
                                            }}>
                                                {f.title}
                                            </h3>

                                            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--sm-accent-gold)', marginBottom: '0.85rem' }}>
                                                {f.scriptureReference}
                                            </div>

                                            <p style={{
                                                fontSize: '0.86rem',
                                                color: 'var(--sm-text-secondary)',
                                                lineHeight: '1.5',
                                                maxHeight: '65px',
                                                overflow: 'hidden',
                                                margin: '0 0 1.25rem'
                                            }}>
                                                {f.devotional}
                                            </p>
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--sm-border-subtle)', paddingTop: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', fontSize: '0.78rem', color: 'var(--sm-text-muted)' }}>
                                                <span>{f.openedCount || 0} Reach</span>
                                                <span>{f.reflectionsCount || 0} Reflections</span>
                                                <span>{f.completionPercent || 0}% Complete</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="sm-btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }} onClick={() => handleEditFellowship(f)}>
                                                    <Edit3 size={13} /> Edit
                                                </button>
                                                <button className="sm-btn-ghost" style={{ padding: '0.45rem', color: '#991B1B' }} onClick={() => handleDelete(f._id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#FFF', borderRadius: 'var(--sm-radius-lg)', border: '1px solid var(--sm-border)' }}>
                                <BookOpen size={40} color="var(--sm-accent-gold)" style={{ opacity: 0.7, marginBottom: '1rem' }} />
                                <h3>No Fellowships Found</h3>
                                <p style={{ color: 'var(--sm-text-secondary)', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
                                    No records match this filter. Create a new fellowship or switch filters to view all entries.
                                </p>
                                <button className="sm-btn-primary" onClick={startNewFellowship}>
                                    <Plus size={16} /> Create Fellowship
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================
                    TAB 3: FELLOWSHIP BUILDER (CREATOR + LIVE PREVIEWS)
                   ======================================================== */}
                {activeTab === 'create' && (
                    <div className="sm-builder-layout">
                        {/* Left: Devotional Editor Form */}
                        <div className="sm-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--sm-border)' }}>
                                <div>
                                    <h2 style={{ fontFamily: 'var(--sm-font-serif)', fontSize: '1.65rem', margin: 0, color: 'var(--sm-text-primary)' }}>
                                        {builderForm._id ? 'Edit Fellowship' : 'Fellowship Studio'}
                                    </h2>
                                    <div style={{ fontSize: '0.84rem', color: 'var(--sm-text-muted)', marginTop: '0.25rem' }}>
                                        Craft the spiritual message, Scripture reference, reflection prompt, and closing prayer.
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.65rem' }}>
                                    <button className="sm-btn-secondary" onClick={() => handleSaveFellowship('DRAFT')} disabled={isSaving}>
                                        Save Draft
                                    </button>
                                    <button className="sm-btn-primary" onClick={() => setConfirmPublishOpen(true)} disabled={isSaving}>
                                        <Send size={15} /> Publish
                                    </button>
                                </div>
                            </div>

                            <div className="sm-form-group">
                                <label className="sm-form-label">Fellowship Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. The Courage to Begin"
                                    value={builderForm.title}
                                    onChange={e => setBuilderForm({ ...builderForm, title: e.target.value })}
                                    className="sm-input"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Date *</label>
                                    <input
                                        type="date"
                                        value={builderForm.date}
                                        onChange={e => setBuilderForm({ ...builderForm, date: e.target.value })}
                                        className="sm-input"
                                    />
                                </div>
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Theme</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Courage, Identity, Discipleship"
                                        value={builderForm.theme}
                                        onChange={e => setBuilderForm({ ...builderForm, theme: e.target.value })}
                                        className="sm-input"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Scripture Reference *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Joshua 1:9"
                                        value={builderForm.scriptureReference}
                                        onChange={e => setBuilderForm({ ...builderForm, scriptureReference: e.target.value })}
                                        className="sm-input"
                                    />
                                </div>
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Scripture Verse Text *</label>
                                    <input
                                        type="text"
                                        placeholder='e.g. "Be strong and courageous. Do not be afraid..."'
                                        value={builderForm.scriptureText}
                                        onChange={e => setBuilderForm({ ...builderForm, scriptureText: e.target.value })}
                                        className="sm-input"
                                    />
                                </div>
                            </div>

                            <div className="sm-form-group">
                                <label className="sm-form-label">Devotional Word *</label>
                                <textarea
                                    rows={8}
                                    placeholder="Write today's devotional reflection for Doulos members..."
                                    value={builderForm.devotional}
                                    onChange={e => setBuilderForm({ ...builderForm, devotional: e.target.value })}
                                    className="sm-input sm-textarea"
                                />
                            </div>

                            <div className="sm-form-group">
                                <label className="sm-form-label">Reflection Question</label>
                                <input
                                    type="text"
                                    placeholder="What is God asking you to step into courageously today?"
                                    value={builderForm.reflectionQuestion}
                                    onChange={e => setBuilderForm({ ...builderForm, reflectionQuestion: e.target.value })}
                                    className="sm-input"
                                />
                            </div>

                            <div className="sm-form-group">
                                <label className="sm-form-label">Closing Prayer</label>
                                <textarea
                                    rows={3}
                                    placeholder="Write a heartfelt closing prayer for the fellowship..."
                                    value={builderForm.prayer}
                                    onChange={e => setBuilderForm({ ...builderForm, prayer: e.target.value })}
                                    className="sm-input"
                                    style={{ minHeight: '90px' }}
                                />
                            </div>

                            <div className="sm-form-group">
                                <label className="sm-form-label">Community Prompt (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="What could members share with their fellowship circle?"
                                    value={builderForm.communityPrompt}
                                    onChange={e => setBuilderForm({ ...builderForm, communityPrompt: e.target.value })}
                                    className="sm-input"
                                />
                            </div>
                        </div>

                        {/* Right: Live Member App Mobile Preview */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--sm-text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    <Smartphone size={16} color="var(--sm-accent-gold)" />
                                    Member App Live Preview
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>
                                    Live Sync
                                </div>
                            </div>

                            {/* Phone Mockup Frame */}
                            <div className="sm-phone-frame">
                                <div className="sm-phone-notch" />
                                <div className="sm-phone-screen">
                                    {/* Mobile Status Bar */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', marginBottom: '0.85rem', paddingTop: '0.2rem' }}>
                                        <span>9:41</span>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.62rem' }}>5G</span>
                                            <div style={{ width: '16px', height: '8px', border: '1px solid #94A3B8', borderRadius: '2px', padding: '1px' }}>
                                                <div style={{ width: '70%', height: '100%', background: '#94A3B8' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile App Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.65rem', borderBottom: '1px solid #F1F5F9' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', overflow: 'hidden', background: '#FEF3C7', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src="/logo.png" alt="Doulos" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px', lineHeight: 1 }}>DOULOS</div>
                                            <div style={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 600 }}>Daily Fellowship</div>
                                        </div>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '0.15rem 0.45rem', borderRadius: '10px' }}>
                                            {builderForm.date || 'Today'}
                                        </span>
                                    </div>

                                    {/* Theme Badge */}
                                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--sm-accent-gold-dark)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                        {builderForm.theme || 'TODAY\'S FELLOWSHIP'}
                                    </div>

                                    {/* Title */}
                                    <h3 style={{ fontFamily: 'var(--sm-font-serif)', fontSize: '1.3rem', margin: '0 0 0.85rem', lineHeight: '1.3', color: '#0F172A' }}>
                                        {builderForm.title || 'Untitled Fellowship'}
                                    </h3>

                                    {/* Scripture Reference Quote Card */}
                                    {builderForm.scriptureReference && (
                                        <div style={{ background: '#FFFDF8', borderLeft: '3.5px solid var(--sm-accent-gold)', borderTop: '1px solid #FEF3C7', borderRight: '1px solid #FEF3C7', borderBottom: '1px solid #FEF3C7', padding: '0.85rem 1rem', borderRadius: '0 10px 10px 0', marginBottom: '1.15rem' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.76rem', color: 'var(--sm-accent-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                {builderForm.scriptureReference}
                                            </div>
                                            <div style={{ fontStyle: 'italic', fontSize: '0.84rem', color: '#334155', marginTop: '4px', lineHeight: '1.45', fontFamily: 'var(--sm-font-serif)' }}>
                                                "{builderForm.scriptureText || 'Scripture verse text...'}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Devotional Word */}
                                    <div style={{ fontSize: '0.86rem', lineHeight: '1.65', color: '#334155', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                                        {builderForm.devotional || 'Devotional reflection will appear here as written...'}
                                    </div>

                                    {/* Reflection Prompt */}
                                    {builderForm.reflectionQuestion && (
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.9rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                                    MY REFLECTION
                                                </div>
                                                <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>🔒 Confidential</span>
                                            </div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', lineHeight: '1.4' }}>
                                                {builderForm.reflectionQuestion}
                                            </div>
                                            <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.75rem', color: '#94A3B8' }}>
                                                Write your private reflection note here...
                                            </div>
                                        </div>
                                    )}

                                    {/* Closing Prayer Card */}
                                    {builderForm.prayer && (
                                        <div style={{ background: 'linear-gradient(135deg, #FFFDF7 0%, #FFFBEB 100%)', border: '1px solid #FEF3C7', padding: '0.95rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#B45309', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                                CLOSING PRAYER
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: '#78350F', fontStyle: 'italic', lineHeight: '1.5' }}>
                                                "{builderForm.prayer}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Community Prompt */}
                                    {builderForm.communityPrompt && (
                                        <div style={{ background: '#EEF2FF', border: '1px solid #E0E7FF', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#4338CA', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                COMMUNITY SHARING
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#312E81', lineHeight: '1.4' }}>
                                                {builderForm.communityPrompt}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TABS 4, 5, 6: PREVIEW MODULES FOR PHASES 2, 3, 4
                   ======================================================== */}
                {/* ========================================================
                    TAB 4: QUESTION BANK WORKSPACE (PHASE 2)
                   ======================================================== */}
                {activeTab === 'questions' && (
                    <div>
                        {/* Question Bank Header & Filters */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.45rem', background: '#FFF', padding: '4px', borderRadius: '12px', border: '1px solid var(--sm-border)' }}>
                                {['all', 'banter', 'skills', 'life'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setQuestionCategoryFilter(c)}
                                        style={{
                                            padding: '0.45rem 1rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: questionCategoryFilter === c ? 'var(--sm-accent-gold)' : 'transparent',
                                            color: questionCategoryFilter === c ? '#FFF' : 'var(--sm-text-secondary)',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: '260px' }}>
                                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sm-text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search question prompt..."
                                        value={questionSearchQuery}
                                        onChange={e => setQuestionSearchQuery(e.target.value)}
                                        className="sm-input"
                                        style={{ paddingLeft: '2.3rem', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <button className="sm-btn-primary" onClick={handleOpenCreateQuestion}>
                                    <Plus size={16} /> Create Question
                                </button>
                            </div>
                        </div>

                        {/* Questions Grid */}
                        {questions.filter(q => {
                            if (questionCategoryFilter !== 'all' && q.category?.toLowerCase() !== questionCategoryFilter) return false;
                            if (questionSearchQuery.trim()) {
                                const qL = questionSearchQuery.toLowerCase();
                                return (q.text || '').toLowerCase().includes(qL) || (q.skill || '').toLowerCase().includes(qL);
                            }
                            return true;
                        }).length > 0 ? (
                            <div className="sm-q-grid">
                                {questions
                                    .filter(q => {
                                        if (questionCategoryFilter !== 'all' && q.category?.toLowerCase() !== questionCategoryFilter) return false;
                                        if (questionSearchQuery.trim()) {
                                            const qL = questionSearchQuery.toLowerCase();
                                            return (q.text || '').toLowerCase().includes(qL) || (q.skill || '').toLowerCase().includes(qL);
                                        }
                                        return true;
                                    })
                                    .map(q => {
                                        const cat = q.category || 'BANTER';
                                        return (
                                            <div key={q._id} className="sm-q-card">
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                                        <span className={`sm-badge-category ${
                                                            cat === 'SKILLS' ? 'sm-cat-skills' :
                                                            cat === 'LIFE' ? 'sm-cat-life' : 'sm-cat-banter'
                                                        }`}>
                                                            {cat}
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <span className="sm-pill-vis">{q.visibility || 'COMMUNITY'}</span>
                                                            {q.required && (
                                                                <span className="sm-pill-vis" style={{ color: '#DC2626', borderColor: '#FCA5A5' }}>Required</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="sm-q-text">{q.text}</div>

                                                    {cat === 'SKILLS' && q.skill && (
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--sm-accent-blue)', fontWeight: 600, marginBottom: '0.65rem' }}>
                                                            🎯 Domain: {q.skill} {q.difficulty ? `• ${q.difficulty}` : ''}
                                                        </div>
                                                    )}

                                                    {Array.isArray(q.options) && q.options.length > 0 && (
                                                        <div style={{ background: 'var(--sm-bg)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--sm-text-secondary)', marginBottom: '0.85rem' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--sm-text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                                                Options ({q.responseType})
                                                            </div>
                                                            {q.options.slice(0, 3).map((opt, i) => (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                                                                    <span>•</span> <span>{opt}</span>
                                                                </div>
                                                            ))}
                                                            {q.options.length > 3 && <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)', marginTop: '2px' }}>+{q.options.length - 3} more</div>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ borderTop: '1px solid var(--sm-border-subtle)', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--sm-text-muted)', marginBottom: '0.75rem' }}>
                                                        <span><strong>{q.responseCount || 0}</strong> responses</span>
                                                        {cat === 'SKILLS' && (
                                                            <span style={{ color: 'var(--sm-accent-blue)', fontWeight: 700 }}>
                                                                {q.correctRate !== null ? `${q.correctRate}% Correct` : 'Not yet evaluated'}
                                                            </span>
                                                        )}
                                                        {cat === 'LIFE' && q.checkInRequests > 0 && (
                                                            <span style={{ color: 'var(--sm-accent-terracotta)', fontWeight: 700 }}>
                                                                {q.checkInRequests} Check-in {q.checkInRequests === 1 ? 'request' : 'requests'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
                                                        <button className="sm-btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }} onClick={() => handleOpenAnalytics(q)}>
                                                            <BarChart3 size={13} /> Analytics
                                                        </button>
                                                        <button className="sm-btn-ghost" style={{ padding: '0.4rem' }} onClick={() => handleEditQuestion(q)}>
                                                            <Edit3 size={13} />
                                                        </button>
                                                        <button className="sm-btn-ghost" style={{ padding: '0.4rem', color: '#991B1B' }} onClick={() => handleDeleteQuestion(q._id)}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#FFF', borderRadius: 'var(--sm-radius-lg)', border: '1px solid var(--sm-border)' }}>
                                <HelpCircle size={40} color="var(--sm-accent-gold)" style={{ opacity: 0.7, marginBottom: '1rem' }} />
                                <h3>Your Question Bank is Empty</h3>
                                <p style={{ color: 'var(--sm-text-secondary)', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
                                    Create daily check-in questions across Banter, Practical Skills, or Life reflections.
                                </p>
                                <button className="sm-btn-primary" onClick={handleOpenCreateQuestion}>
                                    <Plus size={16} /> Create Question
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================
                    TAB 5: MEMBER CARE BOARD (PHASE 3)
                   ======================================================== */}
                {activeTab === 'member_care' && (
                    <div>
                        {/* Care Header & Metrics */}
                        <div className="sm-panel" style={{ marginBottom: '1.5rem' }}>
                            <div className="sm-panel-header" style={{ marginBottom: '1rem' }}>
                                <div>
                                    <h3 className="sm-panel-title">
                                        <HeartHandshake size={20} color="var(--sm-accent-terracotta)" />
                                        Member Care & Pastoral Triage
                                    </h3>
                                    <div style={{ fontSize: '0.84rem', color: 'var(--sm-text-muted)', marginTop: '0.2rem' }}>
                                        Confidential support requests from daily check-ins and direct member submissions
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                    <button className="sm-btn-ghost" onClick={loadPortalData}>
                                        <RefreshCw size={15} /> Refresh
                                    </button>
                                </div>
                            </div>

                            {/* Care Metrics Strip */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                                <div style={{ background: 'var(--sm-bg-subtle)', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid var(--sm-border)' }}>
                                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--sm-text-muted)', textTransform: 'uppercase' }}>Total Cases</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--sm-text-primary)' }}>{supportStats.total}</div>
                                </div>
                                <div style={{ background: '#FEF2F2', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid #FECACA' }}>
                                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#DC2626' }}></span>
                                        Needs Attention
                                    </div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#991B1B' }}>{supportStats.needsAttention}</div>
                                </div>
                                <div style={{ background: '#FAF5FF', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid #E9D5FF' }}>
                                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>In Follow-Up</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#581C87' }}>{supportStats.inProgress}</div>
                                </div>
                                <div style={{ background: '#ECFDF5', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Resolved</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#065F46' }}>{supportStats.resolved}</div>
                                </div>
                            </div>

                            {/* Search and Campus Filter */}
                            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                                <div className="sm-search-bar" style={{ flex: 1, minWidth: '220px' }}>
                                    <Search size={16} color="var(--sm-text-muted)" />
                                    <input
                                        type="text"
                                        placeholder="Search by member name, ID, or prayer topic..."
                                        value={careSearchQuery}
                                        onChange={(e) => setCareSearchQuery(e.target.value)}
                                    />
                                    {careSearchQuery && (
                                        <button className="sm-btn-ghost" onClick={() => setCareSearchQuery('')} style={{ padding: '0.2rem' }}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--sm-bg-subtle)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--sm-border)' }}>
                                    {['ALL', 'Athi River', 'Nairobi'].map((campus) => (
                                        <button
                                            key={campus}
                                            className={`sm-tab-btn ${careCampusFilter === campus ? 'active' : ''}`}
                                            onClick={() => setCareCampusFilter(campus)}
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                                        >
                                            {campus === 'ALL' ? 'All Campuses' : campus}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3-Column Kanban Board */}
                        {(() => {
                            const filtered = supportRequests.filter((r) => {
                                if (careCampusFilter !== 'ALL' && r.campus !== careCampusFilter) return false;
                                if (careSearchQuery.trim()) {
                                    const q = careSearchQuery.toLowerCase();
                                    const match =
                                        (r.memberName && r.memberName.toLowerCase().includes(q)) ||
                                        (r.memberId && r.memberId.toLowerCase().includes(q)) ||
                                        (r.reason && r.reason.toLowerCase().includes(q)) ||
                                        (r.details && r.details.toLowerCase().includes(q));
                                    if (!match) return false;
                                }
                                return true;
                            });

                            const needsAttentionCases = filtered.filter((r) => r.status === 'NEEDS_ATTENTION');
                            const inProgressCases = filtered.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS');
                            const resolvedCases = filtered.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED');

                            const renderCareCard = (c) => (
                                <div key={c._id} className="sm-care-card" onClick={() => handleOpenCareCase(c)}>
                                    <div className="sm-care-card-top">
                                        <span className="sm-care-source-tag">
                                            {c.source === 'QUESTION_CHECK_IN' ? <Compass size={12} /> : <MessageSquare size={12} />}
                                            {c.source === 'QUESTION_CHECK_IN' ? 'Check-In' : 'Direct Request'}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {c.priority === 'URGENT' && (
                                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                                    URGENT
                                                </span>
                                            )}
                                            <Lock size={13} color="var(--sm-text-muted)" title="Confidential Pastoral Record" />
                                        </div>
                                    </div>
                                    <div className="sm-care-member-name">{c.memberName || 'Member'}</div>
                                    <div className="sm-care-campus-sub">{c.memberId} • {c.campus || 'Athi River'} • {c.memberType || 'Douloid'}</div>
                                    <div className="sm-care-reason">{c.reason}</div>
                                    {c.details && <div className="sm-care-details-snippet">"{c.details}"</div>}
                                    <div className="sm-care-card-footer">
                                        <span className="sm-care-assignee-pill">
                                            <UserCheck size={13} />
                                            {c.assignedTo ? `Assigned: ${c.assignedTo}` : 'Unassigned'}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {c.notes && c.notes.length > 0 && (
                                                <span style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)', background: 'var(--sm-bg-subtle)', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                                                    {c.notes.length} {c.notes.length === 1 ? 'note' : 'notes'}
                                                </span>
                                            )}
                                            <ChevronRight size={14} color="var(--sm-accent-gold)" />
                                        </div>
                                    </div>
                                </div>
                            );

                            return (
                                <div className="sm-care-board">
                                    {/* Column 1: Needs Attention */}
                                    <div className="sm-care-col" style={{ borderTop: '3px solid #DC2626' }}>
                                        <div className="sm-care-col-header">
                                            <div className="sm-care-col-title">
                                                <ShieldAlert size={16} color="#DC2626" />
                                                Needs Attention
                                            </div>
                                            <span className="sm-care-col-count" style={{ color: '#DC2626', fontWeight: 800 }}>
                                                {needsAttentionCases.length}
                                            </span>
                                        </div>
                                        {needsAttentionCases.length > 0 ? (
                                            needsAttentionCases.map(renderCareCard)
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--sm-text-muted)', fontSize: '0.84rem' }}>
                                                No unaddressed care requests. All members are being supported.
                                            </div>
                                        )}
                                    </div>

                                    {/* Column 2: In Progress */}
                                    <div className="sm-care-col" style={{ borderTop: '3px solid var(--sm-accent-gold)' }}>
                                        <div className="sm-care-col-header">
                                            <div className="sm-care-col-title">
                                                <Clock size={16} color="var(--sm-accent-gold)" />
                                                Active Follow-Up
                                            </div>
                                            <span className="sm-care-col-count" style={{ color: 'var(--sm-accent-gold)', fontWeight: 800 }}>
                                                {inProgressCases.length}
                                            </span>
                                        </div>
                                        {inProgressCases.length > 0 ? (
                                            inProgressCases.map(renderCareCard)
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--sm-text-muted)', fontSize: '0.84rem' }}>
                                                No active follow-ups in this view.
                                            </div>
                                        )}
                                    </div>

                                    {/* Column 3: Resolved */}
                                    <div className="sm-care-col" style={{ borderTop: '3px solid var(--sm-accent-sage)' }}>
                                        <div className="sm-care-col-header">
                                            <div className="sm-care-col-title">
                                                <CheckCircle2 size={16} color="var(--sm-accent-sage)" />
                                                Pastored & Resolved
                                            </div>
                                            <span className="sm-care-col-count" style={{ color: 'var(--sm-accent-sage)', fontWeight: 800 }}>
                                                {resolvedCases.length}
                                            </span>
                                        </div>
                                        {resolvedCases.length > 0 ? (
                                            resolvedCases.map(renderCareCard)
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--sm-text-muted)', fontSize: '0.84rem' }}>
                                                Resolved cases will appear here once follow-ups conclude.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* ========================================================
                    TAB 6: SPIRITUAL INSIGHTS (PHASE 4)
                   ======================================================== */}
                {activeTab === 'insights' && (
                    <div>
                        <div className="sm-panel" style={{ marginBottom: '1.5rem' }}>
                            <div className="sm-panel-header">
                                <div>
                                    <h3 className="sm-panel-title">
                                        <BarChart3 size={20} color="var(--sm-accent-gold)" />
                                        Spiritual Ministry Resonance & Reach
                                    </h3>
                                    <div style={{ fontSize: '0.84rem', color: 'var(--sm-text-muted)', marginTop: '0.2rem' }}>
                                        Aggregate health metrics and devotional resonance across Athi River and Nairobi campuses
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                    <button className="sm-btn-ghost" onClick={loadPortalData}>
                                        <RefreshCw size={15} /> Refresh Data
                                    </button>
                                </div>
                            </div>

                            {/* 4 Core Resonance KPIs */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
                                <div className="sm-insights-metric-card">
                                    <div className="sm-insights-metric-label">Devotional Reads This Week</div>
                                    <div className="sm-insights-metric-value">{dashboardData?.interactions?.totalReads || 48}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--sm-accent-sage)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                                        <TrendingUp size={13} /> Active engagement across mobile feeds
                                    </div>
                                </div>

                                <div className="sm-insights-metric-card">
                                    <div className="sm-insights-metric-label">Private Reflections Saved</div>
                                    <div className="sm-insights-metric-value">{dashboardData?.interactions?.reflections || 26}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--sm-text-secondary)' }}>
                                        Deep personal meditation in God's word
                                    </div>
                                </div>

                                <div className="sm-insights-metric-card">
                                    <div className="sm-insights-metric-label">Daily Question Responses</div>
                                    <div className="sm-insights-metric-value">
                                        {questions.reduce((acc, q) => acc + (q.responseCount || 0), 0)}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--sm-accent-gold)', fontWeight: 600 }}>
                                        Across Banter, Skills & Life categories
                                    </div>
                                </div>

                                <div className="sm-insights-metric-card">
                                    <div className="sm-insights-metric-label">Pastoral Care Resolution</div>
                                    <div className="sm-insights-metric-value">
                                        {supportStats.total > 0
                                            ? `${Math.round((supportStats.resolved / supportStats.total) * 100)}%`
                                            : '100%'}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--sm-accent-sage)', fontWeight: 600 }}>
                                        {supportStats.resolved} of {supportStats.total} member requests completed
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analytic Breakdowns Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            {/* Question Category Distribution */}
                            <div className="sm-panel">
                                <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>
                                    Question Bank Category Engagement
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                            <span>Banter & Community</span>
                                            <span>45%</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--sm-bg-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: '45%', background: '#D97706', borderRadius: '6px' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                            <span>Field & Safety Skills (Auto-Graded)</span>
                                            <span>35%</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--sm-bg-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: '35%', background: '#059669', borderRadius: '6px' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                            <span>Life & Pastoral Reflection</span>
                                            <span>20%</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--sm-bg-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: '20%', background: '#7C3AED', borderRadius: '6px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Campus Fellowship Resonance */}
                            <div className="sm-panel">
                                <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>
                                    Campus Readership Distribution
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ background: 'var(--sm-bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--sm-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Athi River Campus (Main)</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--sm-text-muted)' }}>Undergraduate & Douloid Training Registry</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--sm-accent-gold)' }}>68%</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)' }}>Share of Reads</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'var(--sm-bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--sm-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Nairobi Campus (Valley Road)</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--sm-text-muted)' }}>Evening & City Fellowship Registry</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--sm-accent-sage)' }}>32%</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)' }}>Share of Reads</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pastoral Principles Callout */}
                        <div style={{ background: 'var(--sm-bg-quote)', padding: '1.5rem', borderRadius: 'var(--sm-radius-md)', border: '1px solid var(--sm-accent-gold-border)' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--sm-border)', flexShrink: 0 }}>
                                    <Lock size={18} color="var(--sm-accent-gold)" />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.96rem', fontWeight: 800, color: 'var(--sm-accent-gold)' }}>
                                        Doulos Shepherd Non-Surveillance Commitment
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--sm-text-secondary)', lineHeight: 1.5 }}>
                                        Spiritual analytics in Doulos are designed to nurture, not evaluate. Individual private devotions and reflection questions remain completely shielded between the member and God. G3 and G4 view aggregate participation health, while individual intervention is only ever triggered when a member affirmatively requests pastoral care.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal: Create / Edit Question */}
            {questionModalOpen && (
                <div className="sm-modal-backdrop">
                    <div className="sm-modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontFamily: 'var(--sm-font-serif)', fontSize: '1.35rem', margin: 0 }}>
                                {questionForm._id ? 'Edit Question' : 'Create Question'}
                            </h3>
                            <button className="sm-btn-ghost" onClick={() => setQuestionModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuestion}>
                            <div className="sm-form-group">
                                <label className="sm-form-label">Question Category *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                                    {[
                                        { id: 'BANTER', label: 'Banter / Icebreaker', desc: 'Social & Fun' },
                                        { id: 'SKILLS', label: 'Practical Skills', desc: 'Trivia & Fieldcraft' },
                                        { id: 'LIFE', label: 'Life & Spiritual', desc: 'Private Reflection' }
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setQuestionForm({
                                                ...questionForm,
                                                category: cat.id,
                                                visibility: cat.id === 'LIFE' ? 'PRIVATE' : 'COMMUNITY'
                                            })}
                                            style={{
                                                padding: '0.85rem 0.65rem',
                                                borderRadius: '12px',
                                                border: `2px solid ${questionForm.category === cat.id ? 'var(--sm-accent-gold)' : 'var(--sm-border)'}`,
                                                background: questionForm.category === cat.id ? 'var(--sm-accent-gold-soft)' : '#FFF',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{ fontWeight: 800, fontSize: '0.84rem', color: questionForm.category === cat.id ? 'var(--sm-accent-gold)' : 'var(--sm-text-primary)' }}>
                                                {cat.label}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-muted)', marginTop: '2px' }}>
                                                {cat.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="sm-form-group">
                                <label className="sm-form-label">Question Prompt *</label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. What is the primary difference between screw-gate and auto-locking carabiners?"
                                    value={questionForm.text}
                                    onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })}
                                    className="sm-input"
                                    style={{ minHeight: '80px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Response Type</label>
                                    <select
                                        value={questionForm.responseType}
                                        onChange={e => setQuestionForm({ ...questionForm, responseType: e.target.value })}
                                        className="sm-input"
                                    >
                                        <option value="text">Open Text</option>
                                        <option value="multiple_choice">Single Choice</option>
                                        <option value="yes_no">Yes / No</option>
                                        <option value="checkboxes">Checkboxes</option>
                                        <option value="rating">1–5 Star Rating</option>
                                    </select>
                                </div>

                                <div className="sm-form-group">
                                    <label className="sm-form-label">Default Visibility</label>
                                    <select
                                        value={questionForm.visibility}
                                        onChange={e => setQuestionForm({ ...questionForm, visibility: e.target.value })}
                                        className="sm-input"
                                    >
                                        <option value="COMMUNITY">Community (Shared Feed)</option>
                                        <option value="ANONYMOUS_COMMUNITY">Anonymous Community</option>
                                        <option value="PRIVATE">Private (Member & Shepherds)</option>
                                        <option value="TRAINER">Trainer / Safety Lead Only</option>
                                        <option value="SQUAD">Squad Only</option>
                                    </select>
                                </div>
                            </div>

                            {/* Options if choices required */}
                            {['multiple_choice', 'checkboxes'].includes(questionForm.responseType) && (
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Options (One option per line)</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                                        value={questionForm.optionsText}
                                        onChange={e => setQuestionForm({ ...questionForm, optionsText: e.target.value })}
                                        className="sm-input"
                                    />
                                </div>
                            )}

                            {/* Conditional Skills Attributes */}
                            {questionForm.category === 'SKILLS' && (
                                <div style={{ background: 'rgba(42, 111, 151, 0.05)', border: '1px solid rgba(42, 111, 151, 0.2)', padding: '1.15rem', borderRadius: '14px', marginBottom: '1.25rem' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--sm-accent-blue)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                                        🎯 Skills Evaluation & Auto-Grading
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                                        <div>
                                            <label className="sm-form-label" style={{ fontSize: '0.78rem' }}>Skill Domain</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. High Ropes Rigging, Knots"
                                                value={questionForm.skill}
                                                onChange={e => setQuestionForm({ ...questionForm, skill: e.target.value })}
                                                className="sm-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="sm-form-label" style={{ fontSize: '0.78rem' }}>Difficulty</label>
                                            <select
                                                value={questionForm.difficulty}
                                                onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                                                className="sm-input"
                                            >
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="sm-form-group" style={{ marginBottom: '0.85rem' }}>
                                        <label className="sm-form-label" style={{ fontSize: '0.78rem' }}>Correct Answer (Exact match for auto-grade)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Screw-gate requires manual sleeve rotation to lock"
                                            value={questionForm.correctAnswer}
                                            onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                                            className="sm-input"
                                        />
                                    </div>

                                    <div>
                                        <label className="sm-form-label" style={{ fontSize: '0.78rem' }}>Explanation ("Why? [Explanation]")</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Explain why this answer is correct so the recruit learns immediately after answering..."
                                            value={questionForm.explanation}
                                            onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                            className="sm-input"
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <input
                                        type="checkbox"
                                        checked={questionForm.required}
                                        onChange={e => setQuestionForm({ ...questionForm, required: e.target.checked })}
                                    />
                                    Required during Check-In
                                </label>

                                <div style={{ display: 'flex', gap: '0.65rem' }}>
                                    <button type="button" className="sm-btn-secondary" onClick={() => setQuestionModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="sm-btn-primary">
                                        Save to Question Bank
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Question Analytics */}
            {analyticsModalQuestion && (
                <div className="sm-modal-backdrop">
                    <div className="sm-modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <span className={`sm-badge-category ${
                                    analyticsModalQuestion.category === 'SKILLS' ? 'sm-cat-skills' :
                                    analyticsModalQuestion.category === 'LIFE' ? 'sm-cat-life' : 'sm-cat-banter'
                                }`}>
                                    {analyticsModalQuestion.category} ANALYTICS
                                </span>
                                <h3 style={{ fontFamily: 'var(--sm-font-serif)', fontSize: '1.25rem', margin: '0.4rem 0 0' }}>
                                    {analyticsModalQuestion.text}
                                </h3>
                            </div>
                            <button className="sm-btn-ghost" onClick={() => { setAnalyticsModalQuestion(null); setAnalyticsData(null); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {analyticsLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--sm-text-muted)' }}>
                                Calculating question analytics...
                            </div>
                        ) : analyticsData ? (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--sm-bg)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sm-text-primary)' }}>
                                            {analyticsData.totalResponses || 0}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>TOTAL RESPONSES</div>
                                    </div>

                                    {analyticsData.category === 'SKILLS' && analyticsData.skillsAccuracy ? (
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sm-accent-blue)' }}>
                                                {analyticsData.skillsAccuracy.accuracyRate}%
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>ACCURACY RATE</div>
                                        </div>
                                    ) : analyticsData.category === 'LIFE' ? (
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sm-accent-terracotta)' }}>
                                                {analyticsData.checkInsRequested || 0}
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>CHECK-INS REQUESTED</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sm-accent-gold)' }}>
                                                Community
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: 'var(--sm-text-muted)', fontWeight: 600 }}>VISIBILITY</div>
                                        </div>
                                    )}
                                </div>

                                {/* Skills Accuracy Details */}
                                {analyticsData.category === 'SKILLS' && analyticsData.skillsAccuracy && (
                                    <div style={{ background: 'rgba(42, 111, 151, 0.05)', border: '1px solid rgba(42, 111, 151, 0.2)', padding: '1.15rem', borderRadius: '14px', marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                            <span style={{ color: 'var(--sm-accent-sage)' }}>✓ Correct: {analyticsData.skillsAccuracy.correctCount}</span>
                                            <span style={{ color: '#DC2626' }}>✕ Incorrect: {analyticsData.skillsAccuracy.incorrectCount}</span>
                                        </div>
                                        {analyticsData.skillsAccuracy.explanation && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--sm-text-secondary)', lineHeight: '1.45', marginTop: '0.5rem', borderTop: '1px solid rgba(42, 111, 151, 0.15)', paddingTop: '0.5rem' }}>
                                                <strong>Why?</strong> {analyticsData.skillsAccuracy.explanation}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Choice Distribution Bars */}
                                {Array.isArray(analyticsData.distribution) && analyticsData.distribution.length > 0 && (
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--sm-text-primary)', marginBottom: '0.85rem' }}>
                                            RESPONSE DISTRIBUTION
                                        </div>
                                        {analyticsData.distribution.map((d, i) => (
                                            <div key={i} className="sm-analytics-bar-wrap">
                                                <div className="sm-analytics-bar-header">
                                                    <span>{d.option}</span>
                                                    <span>{d.percent}% ({d.count})</span>
                                                </div>
                                                <div className="sm-analytics-bar-bg">
                                                    <div className="sm-analytics-bar-fill" style={{ width: `${d.percent}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {analyticsData.category === 'LIFE' && (
                                    <div style={{ fontSize: '0.82rem', color: 'var(--sm-text-secondary)', fontStyle: 'italic', background: 'var(--sm-bg)', padding: '1rem', borderRadius: '12px' }}>
                                        🔒 Private reflections are strictly protected. Only members who checked "Request a pastoral check-in" are surfaced to designated Shepherds.
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Confirmation Dialog: Publish Fellowship */}
            {confirmPublishOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
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
                            Publish Fellowship?
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

            {/* Modal: Member Care Case Detail & Pastoral Notes */}
            {careModalOpen && selectedCareCase && (
                <div className="sm-modal-backdrop">
                    <div className="sm-modal-box" style={{ maxWidth: '680px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--sm-bg-quote)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--sm-border)' }}>
                                    <HeartHandshake size={20} color="var(--sm-accent-terracotta)" />
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: 'var(--sm-font-serif)', fontSize: '1.3rem', margin: 0 }}>
                                        {selectedCareCase.memberName}
                                    </h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--sm-text-muted)', marginTop: '0.15rem' }}>
                                        {selectedCareCase.memberId} • {selectedCareCase.campus} • {selectedCareCase.memberType}
                                    </div>
                                </div>
                            </div>
                            <button className="sm-btn-ghost" onClick={() => setCareModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Request Context Pill */}
                        <div style={{ background: 'var(--sm-bg)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--sm-border)', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span className="sm-care-source-tag">
                                    {selectedCareCase.source === 'QUESTION_CHECK_IN' ? <Compass size={12} /> : <MessageSquare size={12} />}
                                    {selectedCareCase.source === 'QUESTION_CHECK_IN' ? 'Check-In Request' : 'Direct Request'}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--sm-text-muted)' }}>
                                    Preferred: {selectedCareCase.preferredContactMethod || 'In Person'}
                                </span>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--sm-text-primary)', marginBottom: '0.35rem' }}>
                                {selectedCareCase.reason}
                            </div>
                            {selectedCareCase.details && (
                                <div style={{ fontSize: '0.86rem', color: 'var(--sm-text-secondary)', lineHeight: 1.5 }}>
                                    "{selectedCareCase.details}"
                                </div>
                            )}
                        </div>

                        {/* Triage / Assignment Controls */}
                        <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--sm-border)', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--sm-text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Triage & Assignment
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                <div className="sm-form-group" style={{ margin: 0 }}>
                                    <label className="sm-form-label">Assigned Shepherd</label>
                                    <select
                                        className="sm-form-input"
                                        value={careAssignee}
                                        onChange={(e) => setCareAssignee(e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        <option value="g3">G3 Spiritual Coordinator (g3)</option>
                                        <option value="g4">G4 Spiritual Coordinator (g4)</option>
                                        <option value="g3_secretary">G3 Secretary</option>
                                        <option value="g4_logistics">G4 Logistics</option>
                                    </select>
                                </div>
                                <div className="sm-form-group" style={{ margin: 0 }}>
                                    <label className="sm-form-label">Case Status</label>
                                    <select
                                        className="sm-form-input"
                                        value={careStatus}
                                        onChange={(e) => setCareStatus(e.target.value)}
                                    >
                                        <option value="NEEDS_ATTENTION">🚨 Needs Attention</option>
                                        <option value="ASSIGNED">👤 Assigned</option>
                                        <option value="IN_PROGRESS">⏳ In Progress / Active Care</option>
                                        <option value="RESOLVED">✅ Resolved / Pastored</option>
                                        <option value="CLOSED">🔒 Closed</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className="sm-btn-secondary"
                                    onClick={handleUpdateCareTriage}
                                    disabled={isUpdatingCare}
                                    style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                                >
                                    {isUpdatingCare ? 'Saving...' : 'Update Status & Shepherd'}
                                </button>
                            </div>
                        </div>

                        {/* Pastoral Timeline Notes */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--sm-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Confidential Pastoral Timeline ({selectedCareCase.notes ? selectedCareCase.notes.length : 0})
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--sm-text-muted)' }}>
                                    <Lock size={12} /> Confidential to Coordinators
                                </div>
                            </div>

                            {selectedCareCase.notes && selectedCareCase.notes.length > 0 ? (
                                <div className="sm-care-timeline">
                                    {selectedCareCase.notes.map((note, idx) => (
                                        <div key={idx} className="sm-care-note-item">
                                            <div className="sm-care-note-author">
                                                <span>Shepherd: {note.author}</span>
                                                <span>{new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="sm-care-note-text">{note.text}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--sm-bg-subtle)', borderRadius: '10px', color: 'var(--sm-text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                                    No notes recorded yet. Add the first pastoral follow-up note below.
                                </div>
                            )}

                            {/* Add Note Input */}
                            <div style={{ marginTop: '1rem' }}>
                                <textarea
                                    className="sm-form-input"
                                    rows={2}
                                    placeholder="Add confidential prayer note, visitation record, or follow-up summary..."
                                    value={careNoteText}
                                    onChange={(e) => setCareNoteText(e.target.value)}
                                    style={{ width: '100%', marginBottom: '0.65rem' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                                    <button className="sm-btn-secondary" onClick={() => setCareModalOpen(false)}>
                                        Done
                                    </button>
                                    <button
                                        className="sm-btn-primary"
                                        onClick={handleAddCareNote}
                                        disabled={!careNoteText.trim() || isAddingNote}
                                    >
                                        <Send size={14} /> {isAddingNote ? 'Recording...' : 'Add Pastoral Note'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default G3SpiritualPortal;
