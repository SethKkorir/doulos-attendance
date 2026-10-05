import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
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
    Menu
} from 'lucide-react';

const G3SpiritualPortal = () => {
    const navigate = useNavigate();

    // Active Navigation
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'fellowship' | 'create'
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

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // Load Devotional Data
    const loadPortalData = async () => {
        try {
            setLoading(true);
            const [statsRes, listRes] = await Promise.all([
                api.get('/fellowships/stats/dashboard'),
                api.get('/fellowships')
            ]);
            setDashboardData(statsRes.data);
            setFellowships(listRes.data || []);
        } catch (err) {
            console.error('Failed to load spiritual portal data:', err);
            showToast('error', 'Could not sync devotional data');
        } finally {
            setLoading(false);
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
                return 'All Daily Devotionals';
            case 'create':
                return 'Devotional Studio';
            case 'dashboard':
            default:
                return 'Daily Devotional Command Centre';
        }
    };

    const navItems = [
        { id: 'dashboard', label: "Today's Devotional", icon: LayoutDashboard },
        { id: 'fellowship', label: 'All Devotionals', icon: BookOpen, badge: fellowships.length },
        { id: 'create', label: 'Devotional Studio', icon: Feather }
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
                                    setActiveTab(item.id);
                                    setMobileNavOpen(false);
                                }}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                                {item.badge != null && (
                                    <span className="g3-nav-badge">{item.badge}</span>
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
                        <div className="sm-builder-container">
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

                            {/* Right: Live Preview Panel */}
                            <div className="sm-builder-preview">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--sm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Live Member Preview
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.35rem', background: '#FFF', padding: '3px', borderRadius: '8px', border: '1px solid var(--sm-border)' }}>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode('mobile')}
                                            style={{
                                                padding: '4px 8px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                background: previewMode === 'mobile' ? 'var(--sm-bg-quote)' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                            title="Mobile View"
                                        >
                                            <Smartphone size={15} color={previewMode === 'mobile' ? 'var(--sm-accent-gold)' : 'var(--sm-text-muted)'} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode('desktop')}
                                            style={{
                                                padding: '4px 8px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                background: previewMode === 'desktop' ? 'var(--sm-bg-quote)' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                            title="Desktop View"
                                        >
                                            <Monitor size={15} color={previewMode === 'desktop' ? 'var(--sm-accent-gold)' : 'var(--sm-text-muted)'} />
                                        </button>
                                    </div>
                                </div>

                                <div className={`sm-preview-frame ${previewMode === 'mobile' ? 'sm-preview-mobile' : 'sm-preview-desktop'}`}>
                                    {/* Preview Header & Theme */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--sm-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {builderForm.theme || 'TODAY\'S DEVOTIONAL'}
                                        </span>
                                        <span style={{ fontSize: '0.74rem', color: 'var(--sm-text-muted)' }}>
                                            {builderForm.date ? new Date(builderForm.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 style={{ fontFamily: 'var(--sm-font-serif)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--sm-text-primary)', margin: '0 0 0.85rem 0', lineHeight: 1.3 }}>
                                        {builderForm.title || 'Devotional Title Preview'}
                                    </h2>

                                    {/* Scripture Reference Quote */}
                                    {builderForm.scriptureReference && (
                                        <div style={{
                                            background: 'var(--sm-bg-quote)',
                                            borderLeft: '3.5px solid var(--sm-accent-gold)',
                                            padding: '0.85rem 1rem',
                                            borderRadius: '0 10px 10px 0',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--sm-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                {builderForm.scriptureReference}
                                            </div>
                                            <div style={{ fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--sm-text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                                                "{builderForm.scriptureText || 'Scripture reading for today...'}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Devotional Word */}
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.65', color: 'var(--sm-text-secondary)', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                                        {builderForm.devotional || 'Devotional reflection will appear here as written...'}
                                    </div>

                                    {/* Reflection Prompt */}
                                    {builderForm.reflectionQuestion && (
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                YOUR REFLECTION
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                                                {builderForm.reflectionQuestion}
                                            </div>
                                        </div>
                                    )}

                                    {/* Closing Prayer */}
                                    {builderForm.prayer && (
                                        <div style={{ background: '#FFFDF8', border: '1px solid #FEF3C7', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#B45309', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                CLOSING PRAYER
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: '#78350F', fontStyle: 'italic' }}>
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
                    )}
                </main>
            </div>

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
