import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalData } from '../hooks/usePortalQuery';
import { StatCardSkeleton, TableRowSkeleton, CardSkeleton, ListSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import api from '../api';
import Logo from '../components/Logo';
import RankBadge from '../components/common/RankBadge';
import G2MemberImportModal from '../components/common/G2MemberImportModal';
import '../styles/g2Portal.css';
import {
    LayoutDashboard,
    Users,
    Calendar,
    RefreshCw,
    BookOpen,
    ShieldAlert,
    User,
    Search,
    Bell,
    LogOut,
    Plus,
    Download,
    Upload,
    Filter,
    CheckCircle2,
    AlertCircle,
    Clock,
    ChevronRight,
    ChevronLeft,
    Eye,
    Edit2,
    Archive,
    ArrowRight,
    ExternalLink,
    Shield,
    X,
    MapPin,
    Phone,
    Mail,
    Check,
    RotateCcw,
    Menu,
    AlertTriangle,
    CalendarCheck,
    Crown,
    Trash2,
    QrCode,
    Printer
} from 'lucide-react';

const G2OperationsPortal = () => {
    const navigate = useNavigate();

    // Active Navigation
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState(null);

    // Profile & Credentials
    const username = localStorage.getItem('username') || 'G2 Operations';
    const userCampus = localStorage.getItem('campus') || 'Athi River';

    // Acting as G1 elevation state
    const [actingAsG1, setActingAsG1] = useState(() => {
        return localStorage.getItem('g2_acting_as_g1') === 'true';
    });
    const [actingSince, setActingSince] = useState(() => {
        return localStorage.getItem('g2_acting_since') || '';
    });
    const [actingReason, setActingReason] = useState(() => {
        return localStorage.getItem('g2_acting_reason') || 'Documented Delegation / Field Leave';
    });

    const queryClient = useQueryClient();

    // 1. Dashboard Stats (Server-computed from GET /api/g2/stats)
    const {
        data: g2StatsData,
        isLoading: statsLoading,
        isError: statsError,
        refetch: refetchStats
    } = usePortalData('g2-stats', '/g2/stats');

    const g2Stats = g2StatsData?.stats || {
        totalActiveDouloids: 0,
        recruitsAwaitingGrad: 0,
        totalRecruits: 0,
        daysUntilSemesterEnd: 0,
        upcomingEventsThisWeek: 0,
        currentSemester: 'MAY-AUG 2026',
        semesterEndDate: '',
        totalActiveMembers: 0,
        unplacedMembers: 0
    };

    const currentSemester = g2Stats.currentSemester;
    const semesterEndDate = g2Stats.semesterEndDate;

    // Members Tab Controls
    const [memberTab, setMemberTab] = useState('all'); // 'all' | 'douloids' | 'recruits' | 'alumni'
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [filterCampus, setFilterCampus] = useState('All');
    const [filterRank, setFilterRank] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // 2. Members Query (Single unified endpoint backing All, Douloids, Recruits, Alumni tabs)
    const {
        data: rosterData,
        isLoading: membersLoading,
        isError: membersError,
        refetch: refetchMembers
    } = usePortalData(
        ['roster-members', memberTab, filterCampus, filterRank, filterStatus, searchQuery],
        `/roster/members?memberType=${memberTab}&campus=${filterCampus}&rank=${filterRank}&status=${filterStatus}&search=${encodeURIComponent(searchQuery)}`
    );
    const filteredMembers = rosterData?.members || [];

    // Modals
    const [showAddRecruitModal, setShowAddRecruitModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importDataText, setImportDataText] = useState('');
    const [memberToView, setMemberToView] = useState(null);
    const [memberToEdit, setMemberToEdit] = useState(null);
    const [memberToArchive, setMemberToArchive] = useState(null);
    const [portalPreviewMember, setPortalPreviewMember] = useState(null);
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [showActingModal, setShowActingModal] = useState(false);

    // Add Recruit Form State
    const [recruitName, setRecruitName] = useState('');
    const [recruitRegNo, setRecruitRegNo] = useState('');
    const [recruitCampus, setRecruitCampus] = useState('Athi River');
    const [recruitPhone, setRecruitPhone] = useState('');
    const [submittingRecruit, setSubmittingRecruit] = useState(false);

    // Calendar month control
    const [calDate, setCalDate] = useState(new Date());
    const calMonth = calDate.getMonth();
    const calYear = calDate.getFullYear();

    // 3. Calendar Events Query (Tagged with ownerModule: 'G2' vs 'G5')
    const {
        data: calendarData,
        isLoading: calendarLoading,
        isError: calendarError,
        refetch: refetchCalendar
    } = usePortalData(
        ['calendar-events', calMonth, calYear],
        `/events/calendar?month=${calMonth}&year=${calYear}`
    );
    const calendarEntries = calendarData?.entries || [];

    // Helper: Compute next semester code dynamically
    const getNextSemester = (sem) => {
        if (!sem) return 'SEP-DEC 2026';
        const match = sem.match(/(JAN-APR|MAY-AUG|SEP-DEC)\s+(\d{4})/i);
        if (!match) return sem;
        const [_, term, yearStr] = match;
        const year = parseInt(yearStr, 10);
        const upperTerm = term.toUpperCase();
        if (upperTerm === 'JAN-APR') return `MAY-AUG ${year}`;
        if (upperTerm === 'MAY-AUG') return `SEP-DEC ${year}`;
        if (upperTerm === 'SEP-DEC') return `JAN-APR ${year + 1}`;
        return sem;
    };

    // Semester Rollover guided state
    const [rolloverStep, setRolloverStep] = useState(1);
    const [rolloverForm, setRolloverForm] = useState({
        toSemester: 'SEP-DEC 2026',
        startDate: '',
        endDate: '',
        theme: '',
        verse: '',
        overridePending: false
    });
    const [rolloverExecuting, setRolloverExecuting] = useState(false);

    // 4. Pre-Rollover Checklist Query (Server-aggregated live check)
    const {
        data: checklistData,
        isLoading: checklistLoading,
        refetch: refetchChecklist
    } = usePortalData('rollover-checklist', '/rollover/checklist');
    const preRolloverChecklist = checklistData?.checklist || {
        outstandingGraduations: 0,
        openEvaluations: 0,
        unsettledAttendanceCounters: 0,
        totalActiveMembers: 0,
        canProceedWithoutOverride: true
    };
    const rolloverSnapshotAvailable = !!checklistData?.snapshotAvailable;

    // 5. Official Register History & Snapshot Ledger Query
    const {
        data: historyData,
        isLoading: historyLoading,
        refetch: refetchHistory
    } = usePortalData('register-history', '/register/history');
    const officialLedgerEntries = historyData?.entries || [];

    // 6. Acting as G1 Elevation State
    const {
        data: delegationData,
        refetch: refetchDelegation
    } = usePortalData('delegation-status', '/delegation/status');

    useEffect(() => {
        if (delegationData?.status) {
            setActingAsG1(!!delegationData.status.active);
            setActingSince(delegationData.status.since || '');
            setActingReason(delegationData.status.reason || '');
        }
    }, [delegationData]);

    // Toast helper
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ================= ACTIONS =================
    // Quick Add Recruit (4 Fields only, under 10 seconds!)
    const handleQuickAddRecruit = async (e) => {
        e.preventDefault();
        if (!recruitName.trim()) {
            showToast('Please enter the recruit full name', 'error');
            return;
        }

        setSubmittingRecruit(true);
        try {
            const payload = {
                fullName: recruitName.trim(),
                admissionNumber: recruitRegNo.trim().toUpperCase(),
                campus: recruitCampus,
                phone: recruitPhone.trim()
            };

            const res = await api.post('/roster/recruits', payload);
            showToast(`Recruit ${res.data?.member?.name || recruitName} enrolled successfully!`);

            setRecruitName('');
            setRecruitRegNo('');
            setRecruitCampus('Athi River');
            setRecruitPhone('');
            setShowAddRecruitModal(false);

            queryClient.invalidateQueries({ queryKey: ['roster-members'] });
            queryClient.invalidateQueries({ queryKey: ['g2-stats'] });
        } catch (err) {
            console.error('Error adding recruit:', err);
            showToast(err.response?.data?.message || 'Error adding recruit to database', 'error');
        } finally {
            setSubmittingRecruit(false);
        }
    };

    // Soft Archive Member with confirmation (20-day grace)
    const handleConfirmArchive = async () => {
        if (!memberToArchive) return;
        try {
            await api.post(`/roster/members/${memberToArchive._id}/archive`, {
                archiveReason: 'Archived by G2 Operations',
                archiveDays: 20
            });
            showToast(`Member ${memberToArchive.name} moved to archives.`);
            queryClient.invalidateQueries({ queryKey: ['roster-members'] });
            queryClient.invalidateQueries({ queryKey: ['g2-stats'] });
        } catch (err) {
            console.error('Error archiving member:', err);
            showToast(err.response?.data?.message || 'Failed to archive member', 'error');
        } finally {
            setMemberToArchive(null);
        }
    };

    // Edit Member (Contact / Campus / Admission No / Category / Rank)
    const handleSaveMemberEdit = async (e) => {
        e.preventDefault();
        if (!memberToEdit) return;
        try {
            const cleanReg = memberToEdit.studentRegNo ? memberToEdit.studentRegNo.trim().toUpperCase() : '';
            await api.patch(`/roster/members/${memberToEdit._id}`, {
                name: memberToEdit.name,
                studentRegNo: cleanReg,
                campus: memberToEdit.campus,
                memberType: memberToEdit.memberType || 'Douloid',
                douloidRank: memberToEdit.douloidRank || 'None',
                belayStatus: memberToEdit.belayStatus || 'Not Permitted',
                phone: memberToEdit.phone,
                email: memberToEdit.email,
                status: memberToEdit.status || 'Active'
            });
            showToast(`Member details updated for ${memberToEdit.name}`);
            setMemberToEdit(null);
            queryClient.invalidateQueries({ queryKey: ['roster-members'] });
            queryClient.invalidateQueries({ queryKey: ['g2-stats'] });
        } catch (err) {
            console.error('Error updating member:', err);
            showToast(err.response?.data?.message || 'Failed to update member', 'error');
        }
    };

    // Permanent Delete Member
    const handleDeleteMemberPermanently = async (member) => {
        if (!member) return;
        const confirmMsg = `Are you sure you want to permanently delete ${member.name} (${member.studentRegNo || 'No Adm No'})?\n\nThis will completely remove the member and their entire attendance history from the database. This action cannot be undone.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await api.delete(`/roster/members/${member._id}`);
            showToast(res.data?.message || `Member ${member.name} permanently deleted.`);
            setMemberToEdit(null);
            queryClient.invalidateQueries({ queryKey: ['roster-members'] });
            queryClient.invalidateQueries({ queryKey: ['g2-stats'] });
        } catch (err) {
            console.error('Error deleting member:', err);
            showToast(err.response?.data?.message || 'Failed to delete member', 'error');
        }
    };

    // Open Student Portal Preview
    const handleOpenPortalPreview = async (member) => {
        try {
            const res = await api.get(`/roster/members/${member._id}/portal-view`);
            setPortalPreviewMember(res.data?.portalView || member);
        } catch (err) {
            setPortalPreviewMember(member);
        }
    };

    // Export Register (CSV/Excel)
    const handleExportRegister = () => {
        window.open(`${api.defaults.baseURL}/register/export?format=csv`, '_blank');
        showToast('Official register exported successfully');
    };

    // Import Members directly into backend DB
    const handleProcessImport = async () => {
        const lines = importDataText.split('\n').filter(l => l.trim());
        if (lines.length === 0) {
            showToast('Please provide lines to import', 'error');
            return;
        }

        const parsed = lines.map(line => {
            const [name, reg, campus, phone] = line.split(',').map(s => (s || '').trim());
            return {
                name: name || 'New Recruit',
                studentRegNo: (reg || '').toUpperCase(),
                campus: campus || 'Athi River',
                phone: phone || '',
                memberType: 'Recruit',
                status: 'Active',
                douloidRank: 'None',
                totalPoints: 10,
                lastActiveSemester: currentSemester
            };
        });

        try {
            const res = await api.post('/members/import', { members: parsed });
            showToast(res.data?.message || `Imported ${parsed.length} members into register!`);
            setShowImportModal(false);
            setImportDataText('');
            queryClient.invalidateQueries({ queryKey: ['roster-members'] });
            queryClient.invalidateQueries({ queryKey: ['g2-stats'] });
        } catch (err) {
            console.error('Import error:', err);
            showToast('Failed to import members to backend', 'error');
        }
    };

    // Add Milestone to Calendar via backend API
    const handleAddCalendarMilestone = async (e) => {
        e.preventDefault();
        const title = e.target.title.value;
        const date = e.target.date.value;
        const time = e.target.time.value;
        const location = e.target.location.value;
        const type = e.target.type.value;

        if (!title || !date) {
            showToast('Please specify title and date', 'error');
            return;
        }

        try {
            const payload = {
                title: title.trim(),
                date,
                time: time || '17:00',
                location: location || 'Doulos Freedom Base',
                type: type || 'Operations',
                semester: currentSemester,
                createdBy: username || 'G2 Operations'
            };

            await api.post('/events/calendar', payload);
            showToast(`Added milestone: ${title}`);
            setShowAddEventModal(false);
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            queryClient.invalidateQueries({ queryKey: ['g2-stats'] });
        } catch (err) {
            console.error('Error adding milestone:', err);
            showToast('Failed to save milestone to backend', 'error');
        }
    };

    // Delete Milestone via backend API
    const handleDeleteMilestone = async (eventId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Delete this milestone from the semester calendar?')) return;
        try {
            await api.delete(`/events/${eventId}`);
            showToast('Milestone removed from calendar');
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            queryClient.invalidateQueries({ queryKey: ['g2-stats'] });
        } catch (err) {
            console.error('Error deleting milestone:', err);
            showToast('Failed to delete milestone from backend', 'error');
        }
    };

    // Execute Guided Semester Rollover via backend API
    const handleExecuteRollover = async () => {
        setRolloverExecuting(true);
        try {
            const payload = {
                semesterName: rolloverForm.toSemester,
                startDate: rolloverForm.startDate,
                endDate: rolloverForm.endDate,
                theme: rolloverForm.theme,
                verse: rolloverForm.verse,
                overrideChecklist: rolloverForm.overridePending
            };

            const res = await api.post('/rollover/start', payload);
            showToast(res.data?.message || `Semester successfully rolled over to ${rolloverForm.toSemester}!`);
            setRolloverStep(5);
            queryClient.invalidateQueries();
        } catch (err) {
            console.error('Rollover error:', err);
            showToast('Rollover failed: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setRolloverExecuting(false);
        }
    };

    // 1-Click Rollback via backend API
    const handleRollbackRollover = async () => {
        try {
            const res = await api.post('/rollover/rollback');
            showToast(res.data?.message || 'Semester rollover successfully rolled back.');
            setRolloverStep(1);
            queryClient.invalidateQueries();
        } catch (err) {
            console.error('Rollback error:', err);
            showToast('Rollback failed: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    // Toggle Acting as G1 elevation mode
    const handleToggleActing = async (enable, reason = '') => {
        try {
            if (enable) {
                await api.post('/delegation/activate', { reason, officer: username });
                showToast('Acting as G1 mode activated. Banner visible on all screens.');
            } else {
                await api.post('/delegation/deactivate');
                showToast('Exited Acting as G1 mode. Normal G2 operations restored.');
            }
            queryClient.invalidateQueries({ queryKey: ['delegation-status'] });
        } catch (err) {
            showToast('Error updating delegation status', 'error');
        }
        setShowActingModal(false);
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        navigate('/admin');
    };

    // Sidebar items definition
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'members', label: 'Members', icon: Users, badge: g2Stats.totalActiveMembers },
        { id: 'calendar', label: 'Semester Calendar', icon: Calendar },
        { id: 'rollover', label: 'Semester Rollover', icon: RefreshCw },
        { id: 'records', label: 'Records & Register', icon: BookOpen },
        { id: 'acting_g1', label: 'Acting as G1', icon: ShieldAlert, activeIndicator: actingAsG1 },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    return (
        <div className="g2-portal-root">
            {/* MOBILE SIDEBAR BACKDROP */}
            {mobileNavOpen && (
                <div
                    className="g2-sidebar-backdrop"
                    onClick={() => setMobileNavOpen(false)}
                />
            )}

            {/* SIDEBAR NAVIGATION (STRICTLY 8 G2 ITEMS) */}
            <aside className={`g2-sidebar ${mobileNavOpen ? 'open' : ''}`}>
                <div className="g2-sidebar-brand">
                    <div className="g2-brand-logo-box" title="Doulos Logo">
                        <Logo size={32} showText={false} />
                    </div>
                    <div className="g2-brand-titles">
                        <span className="g2-brand-title">Doulos G2</span>
                        <span className="g2-brand-subtitle">Operations & Roster</span>
                    </div>
                </div>

                <nav className="g2-nav-list">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`g2-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setMobileNavOpen(false);
                                }}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className="g2-nav-badge">{item.badge}</span>
                                )}
                                {item.activeIndicator && (
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '999px',
                                        background: '#D97706',
                                        marginLeft: 'auto'
                                    }} />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="g2-sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="g2-avatar">
                            <img src="/logo.png" alt="Doulos" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
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
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* MAIN APP WRAPPER */}
            <div className="g2-main-wrapper">
                {/* PERSISTENT BANNER: ACTING AS G1 MODE */}
                {actingAsG1 && (
                    <div className="g2-acting-banner">
                        <div className="g2-acting-banner-content">
                            <ShieldAlert size={20} />
                            <span>
                                <strong>You are currently acting on behalf of G1 (Executive Student Coordinator)</strong> — Active since {actingSince || 'today'} • [{actingReason}]
                            </span>
                        </div>
                        <button
                            type="button"
                            className="g2-acting-exit-btn"
                            onClick={() => handleToggleActing(false)}
                        >
                            Exit G1 Mode
                        </button>
                    </div>
                )}

                {/* TOPBAR */}
                <header className="g2-topbar">
                    <button
                        type="button"
                        className="g2-mobile-toggle"
                        onClick={() => setMobileNavOpen(true)}
                        aria-label="Open Navigation"
                    >
                        <Menu size={22} />
                    </button>

                    {/* Prominent Search Bar */}
                    <div className="g2-search-container">
                        <Search size={17} color="#64748B" />
                        <input
                            type="text"
                            className="g2-search-input"
                            placeholder="Search roster by name, admission no, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="g2-topbar-actions">
                        {/* G5 Portal Quick Jump */}
                        <button
                            type="button"
                            className="g2-btn-outline"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                            onClick={() => window.open('/g5/portal', '_blank')}
                            title="Open G5 Training Portal in new tab"
                        >
                            <ExternalLink size={13} />
                            <span>G5 Training</span>
                        </button>

                        {/* Profile Block */}
                        <div className="g2-profile-card" onClick={() => setActiveTab('profile')}>
                            <div className="g2-avatar">
                                <img src="/logo.png" alt="Doulos" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                            </div>
                            <div className="g2-profile-meta">
                                <span className="g2-profile-name">{username}</span>
                                <span className="g2-profile-role">Assistant Coordinator</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* TOAST ALERT */}
                {toast && (
                    <div style={{
                        position: 'fixed',
                        top: '1.25rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: toast.type === 'error' ? '#EF4444' : toast.type === 'info' ? '#1D4ED8' : '#10B981',
                        color: '#FFFFFF',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '999px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        <span>{toast.message}</span>
                    </div>
                )}

                {/* MAIN PAGE VIEW */}
                <main className="g2-page-content">
                    {/* ================= SECTION 1: DASHBOARD ================= */}
                    {activeTab === 'dashboard' && (
                        <div>
                            {/* 5 Soft Stat Cards */}
                            {statsLoading ? (
                                <div className="g2-stat-strip">
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                </div>
                            ) : statsError ? (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <ErrorState message="Could not load G2 operational statistics." onRetry={refetchStats} />
                                </div>
                            ) : (
                                <div className="g2-stat-strip">
                                    <div className="g2-stat-card">
                                        <div className="g2-stat-top">
                                            <span className="g2-stat-label">Active Douloids</span>
                                            <div className="g2-stat-icon"><Users size={18} /></div>
                                        </div>
                                        <div className="g2-stat-val">{g2Stats.totalActiveDouloids}</div>
                                        <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                                            ● Certified Facilitators
                                        </span>
                                    </div>

                                    <div className="g2-stat-card">
                                        <div className="g2-stat-top">
                                            <span className="g2-stat-label">Recruits Awaiting Grad</span>
                                            <div className="g2-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                                                <Shield size={18} />
                                            </div>
                                        </div>
                                        <div className="g2-stat-val">{g2Stats.recruitsAwaitingGrad}</div>
                                        <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700 }}>
                                            Read-only (Owned by G5)
                                        </span>
                                    </div>

                                    <div className="g2-stat-card">
                                        <div className="g2-stat-top">
                                            <span className="g2-stat-label">Total Recruits</span>
                                            <div className="g2-stat-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                                                <Users size={18} />
                                            </div>
                                        </div>
                                        <div className="g2-stat-val">{g2Stats.totalRecruits}</div>
                                        <span style={{ fontSize: '0.72rem', color: '#1D4ED8', fontWeight: 700 }}>
                                            ● Enrolled in Roster
                                        </span>
                                    </div>

                                    <div className="g2-stat-card">
                                        <div className="g2-stat-top">
                                            <span className="g2-stat-label">Days to Semester End</span>
                                            <div className="g2-stat-icon"><Clock size={18} /></div>
                                        </div>
                                        <div className="g2-stat-val">{g2Stats.daysUntilSemesterEnd}</div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                                            {currentSemester}
                                        </span>
                                    </div>

                                    <div className="g2-stat-card">
                                        <div className="g2-stat-top">
                                            <span className="g2-stat-label">Upcoming Events</span>
                                            <div className="g2-stat-icon" style={{ background: '#F1F5F9', color: '#475569' }}>
                                                <Calendar size={18} />
                                            </div>
                                        </div>
                                        <div className="g2-stat-val">{g2Stats.upcomingEventsThisWeek}</div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                                            This week's milestones
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* "Needs Your Attention" Section */}
                            <div className="g2-content-card" style={{ marginBottom: '1.75rem' }}>
                                <div className="g2-card-header">
                                    <div>
                                        <div className="g2-card-title">
                                            <AlertCircle size={18} color="#D97706" />
                                            <span>Needs Your Attention</span>
                                        </div>
                                        <div className="g2-card-subtitle">
                                            Glanceable operational checklist for the Assistant Student Coordinator seat
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="g2-btn-primary"
                                        onClick={() => setShowAddRecruitModal(true)}
                                    >
                                        <Plus size={16} /> Add Recruit
                                    </button>
                                </div>

                                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                                    {g2Stats.recruitsAwaitingGrad > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.95rem 1.15rem',
                                            background: '#EFF6FF',
                                            border: '1px solid #BFDBFE',
                                            borderRadius: '14px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#1D4ED8' }} />
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E40AF' }}>
                                                        {g2Stats.recruitsAwaitingGrad} recruits have met graduation requirements (8+ drills)
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: '#2563EB' }}>
                                                        Awaiting official 7-Area Evaluation and promotion by G5 Training Directorate.
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="g2-btn-outline"
                                                style={{ padding: '0.45rem 0.95rem', fontSize: '0.78rem' }}
                                                onClick={() => window.open('/g5/portal', '_blank')}
                                            >
                                                View in G5 Portal <ExternalLink size={12} />
                                            </button>
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.95rem 1.15rem',
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '14px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#10B981' }} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                                                    Semester Calendar Schedule is up to date
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                                    {calendarEntries.length} operational milestones logged alongside weekly G5 training sessions.
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="g2-btn-outline"
                                            style={{ padding: '0.45rem 0.95rem', fontSize: '0.78rem' }}
                                            onClick={() => setActiveTab('calendar')}
                                        >
                                            View Calendar →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= SECTION 2: MEMBERS REGISTER ================= */}
                    {activeTab === 'members' && (
                        <div className="g2-content-card">
                            {/* Card Header with Counts & Action Bar */}
                            <div className="g2-card-header">
                                <div>
                                    <div className="g2-card-title">
                                        <Users size={20} color="var(--color-primary)" />
                                        <span>Official Ministry Register</span>
                                    </div>
                                    <div className="g2-card-subtitle">
                                        Comprehensive roster management for active facilitators, recruits, and alumni
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="g2-btn-primary"
                                        onClick={() => setShowAddRecruitModal(true)}
                                    >
                                        <Plus size={16} /> Add Recruit
                                    </button>

                                    <button
                                        type="button"
                                        className="g2-btn-outline"
                                        onClick={() => setShowImportModal(true)}
                                    >
                                        <Upload size={14} /> Import Members
                                    </button>

                                    <button
                                        type="button"
                                        className="g2-btn-outline"
                                        onClick={handleExportRegister}
                                    >
                                        <Download size={14} /> Export Register
                                    </button>

                                    <a
                                        href={`/api/rollover/qr-poster-pdf?semester=${encodeURIComponent(currentSemester)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="g2-btn-outline"
                                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#1D4ED8', borderColor: '#BFDBFE' }}
                                    >
                                        <Printer size={14} /> Print QR Poster
                                    </a>

                                    <button
                                        type="button"
                                        className="g2-btn-outline"
                                        onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                                        style={{ background: (filterCampus !== 'All' || filterRank !== 'All' || filterStatus !== 'All') ? 'var(--color-primary-soft)' : undefined }}
                                    >
                                        <Filter size={14} /> Filter
                                    </button>
                                </div>
                            </div>

                            {/* Sub-Tabs (Douloids / Recruits / Associates & Alumni) */}
                            <div style={{
                                padding: '0.75rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid var(--color-border-subtle)',
                                background: '#F8FAFC',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className={`g2-btn-outline ${memberTab === 'all' ? 'active' : ''}`}
                                        style={{
                                            padding: '0.45rem 1rem',
                                            borderRadius: '999px',
                                            fontSize: '0.82rem',
                                            background: memberTab === 'all' ? 'var(--color-primary)' : '#FFFFFF',
                                            color: memberTab === 'all' ? '#FFFFFF' : 'var(--color-text-main)',
                                            borderColor: memberTab === 'all' ? 'var(--color-primary)' : 'var(--color-border-subtle)'
                                        }}
                                        onClick={() => setMemberTab('all')}
                                    >
                                        All Members ({g2Stats.totalActiveMembers || 0})
                                    </button>

                                    <button
                                        type="button"
                                        className={`g2-btn-outline ${memberTab === 'douloids' ? 'active' : ''}`}
                                        style={{
                                            padding: '0.45rem 1rem',
                                            borderRadius: '999px',
                                            fontSize: '0.82rem',
                                            background: memberTab === 'douloids' ? 'var(--color-primary)' : '#FFFFFF',
                                            color: memberTab === 'douloids' ? '#FFFFFF' : 'var(--color-text-main)',
                                            borderColor: memberTab === 'douloids' ? 'var(--color-primary)' : 'var(--color-border-subtle)'
                                        }}
                                        onClick={() => setMemberTab('douloids')}
                                    >
                                        Douloids ({g2Stats.totalActiveDouloids})
                                    </button>

                                    <button
                                        type="button"
                                        className={`g2-btn-outline ${memberTab === 'recruits' ? 'active' : ''}`}
                                        style={{
                                            padding: '0.45rem 1rem',
                                            borderRadius: '999px',
                                            fontSize: '0.82rem',
                                            background: memberTab === 'recruits' ? 'var(--color-primary)' : '#FFFFFF',
                                            color: memberTab === 'recruits' ? '#FFFFFF' : 'var(--color-text-main)',
                                            borderColor: memberTab === 'recruits' ? 'var(--color-primary)' : 'var(--color-border-subtle)'
                                        }}
                                        onClick={() => setMemberTab('recruits')}
                                    >
                                        Recruits ({g2Stats.totalRecruits})
                                    </button>

                                    <button
                                        type="button"
                                        className={`g2-btn-outline ${memberTab === 'alumni' ? 'active' : ''}`}
                                        style={{
                                            padding: '0.45rem 1rem',
                                            borderRadius: '999px',
                                            fontSize: '0.82rem',
                                            background: memberTab === 'alumni' ? 'var(--color-primary)' : '#FFFFFF',
                                            color: memberTab === 'alumni' ? '#FFFFFF' : 'var(--color-text-main)',
                                            borderColor: memberTab === 'alumni' ? 'var(--color-primary)' : 'var(--color-border-subtle)'
                                        }}
                                        onClick={() => setMemberTab('alumni')}
                                    >
                                        Associates & Alumni ({g2Stats.totalAlumni || 0})
                                    </button>
                                </div>

                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                    Showing <strong>{filteredMembers.length}</strong> members • Active this semester: <strong>{g2Stats.totalActiveMembers}</strong>
                                </div>
                            </div>

                            {/* Slide-out Filter Drawer (if toggled) */}
                            {filterDrawerOpen && (
                                <div style={{
                                    padding: '1rem 1.5rem',
                                    background: '#F1F5F9',
                                    borderBottom: '1px solid var(--color-border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.25rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Campus:</span>
                                        <select
                                            className="g2-form-input"
                                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                                            value={filterCampus}
                                            onChange={(e) => setFilterCampus(e.target.value)}
                                        >
                                            <option value="All">All Campuses</option>
                                            <option value="Athi River">Athi River</option>
                                            <option value="Valley Road">Valley Road</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Rank:</span>
                                        <select
                                            className="g2-form-input"
                                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                                            value={filterRank}
                                            onChange={(e) => setFilterRank(e.target.value)}
                                        >
                                            <option value="All">All Cadres</option>
                                            <option value="Lead Douloid">Lead Douloid</option>
                                            <option value="Intermediate Douloid">Intermediate Douloid</option>
                                            <option value="Basic Douloid">Basic Douloid</option>
                                            <option value="Shadow Douloid">Shadow Douloid</option>
                                            <option value="None">None (Recruits)</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Status:</span>
                                        <select
                                            className="g2-form-input"
                                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Active">Active</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        className="g2-btn-outline"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                        onClick={() => {
                                            setFilterCampus('All');
                                            setFilterRank('All');
                                            setFilterStatus('All');
                                        }}
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            )}

                            {/* Desktop Data Table */}
                            <div className="g2-table-wrapper">
                                <table className="g2-table">
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Campus & Phone</th>
                                            <th>Email</th>
                                            <th>Cadre Rank (G5 Owned)</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {membersLoading ? (
                                            <>
                                                <TableRowSkeleton columns={6} />
                                                <TableRowSkeleton columns={6} />
                                                <TableRowSkeleton columns={6} />
                                                <TableRowSkeleton columns={6} />
                                                <TableRowSkeleton columns={6} />
                                            </>
                                        ) : membersError ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '2rem' }}>
                                                    <ErrorState message="Failed to load member roster from database." onRetry={refetchMembers} />
                                                </td>
                                            </tr>
                                        ) : filteredMembers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '2rem' }}>
                                                    <EmptyState
                                                        icon={Users}
                                                        title="No members found"
                                                        message={searchQuery ? 'No members match the query.' : 'No members found in this roster view.'}
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMembers.map(m => {
                                                const initials = (m.name || '?').charAt(0).toUpperCase();
                                                return (
                                                    <tr key={m._id || m.studentRegNo}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div className="g2-avatar" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                                                                        {m.name}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                                                        {(m.studentRegNo || m.regNo || m.admissionNumber) ? (m.studentRegNo || m.regNo || m.admissionNumber) : <span style={{ color: '#94A3B8', fontStyle: 'italic', fontFamily: 'sans-serif' }}>Pending Reg</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div>{m.campus || 'Athi River'}</div>
                                                            {m.phone ? (
                                                                <a
                                                                    href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    style={{ fontSize: '0.74rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 600 }}
                                                                >
                                                                    <Phone size={11} /> {m.phone}
                                                                </a>
                                                            ) : (
                                                                <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>No phone</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                                {m.email || '—'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {/* READ-ONLY RANK BADGE (G2 CANNOT EDIT) */}
                                                            <RankBadge rank={m.douloidRank} />
                                                        </td>
                                                        <td>
                                                            <span className={`g2-status-pill g2-status-${(m.status || 'Active').toLowerCase()}`}>
                                                                ● {m.status || 'Active'}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                                                                <button
                                                                    type="button"
                                                                    className="g2-btn-outline"
                                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                                                                    onClick={() => setPortalPreviewMember(m)}
                                                                    title="View exactly what this student sees in their Student Portal"
                                                                >
                                                                    <Eye size={12} /> View Portal
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="g2-btn-outline"
                                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                                                                    onClick={() => setMemberToEdit({ ...m })}
                                                                    title="Edit Member Contact & Profile"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="g2-btn-outline"
                                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', color: '#D97706' }}
                                                                    onClick={() => setMemberToArchive(m)}
                                                                    title="Archive Member (Soft Action)"
                                                                >
                                                                    <Archive size={12} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="g2-btn-outline"
                                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                                                                    onClick={() => handleDeleteMemberPermanently(m)}
                                                                    title="Permanently Delete Member & Attendance"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Responsive Mobile Members List */}
                            <div className="g2-mobile-members-list">
                                {membersLoading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
                                        <CardSkeleton height={95} />
                                        <CardSkeleton height={95} />
                                        <CardSkeleton height={95} />
                                    </div>
                                ) : membersError ? (
                                    <div style={{ padding: '1.5rem' }}>
                                        <ErrorState message="Could not load mobile roster." onRetry={refetchMembers} />
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div style={{ padding: '2rem' }}>
                                        <EmptyState
                                            icon={Users}
                                            title="No members found"
                                            message={searchQuery ? 'No members match your search.' : 'No members found in this roster view.'}
                                        />
                                    </div>
                                ) : (
                                    filteredMembers.map(m => (
                                        <div key={m._id || m.studentRegNo} className="g2-mobile-member-card">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                    <div className="g2-avatar" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                                                        {(m.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{m.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                                            {(m.studentRegNo || m.regNo || m.admissionNumber) ? `${m.studentRegNo || m.regNo || m.admissionNumber} • ` : ''}{m.campus}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`g2-status-pill g2-status-${(m.status || 'Active').toLowerCase()}`}>
                                                    {m.status || 'Active'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9' }}>
                                                <RankBadge rank={m.douloidRank || 'Recruit'} />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    Drills: <strong>{m.totalPoints || 0} pts</strong>
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                <button
                                                    type="button"
                                                    className="g2-btn-outline"
                                                    style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                                                    onClick={() => handleViewPortal(m)}
                                                >
                                                    <Eye size={12} /> Student View
                                                </button>
                                                <button
                                                    type="button"
                                                    className="g2-btn-outline"
                                                    style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                                                    onClick={() => setMemberToEdit(m)}
                                                >
                                                    <Edit2 size={12} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="g2-btn-outline"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#EF4444' }}
                                                    onClick={() => setMemberToArchive(m)}
                                                >
                                                    <Archive size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ================= SECTION 3: SEMESTER CALENDAR ================= */}
                    {activeTab === 'calendar' && (
                        <div className="g2-content-card">
                            <div className="g2-card-header">
                                <div>
                                    <div className="g2-card-title">
                                        <Calendar size={20} color="var(--color-primary)" />
                                        <span>Master Semester Schedule</span>
                                    </div>
                                    <div className="g2-card-subtitle">
                                        One single source of truth: G2 operations milestones displayed alongside weekly G5 training sessions
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.75rem' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#2563EB' }} />
                                            G5 Training / Meeting (Read-only)
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#B45309' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#D97706' }} />
                                            G2 Semester Milestone
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="g2-btn-primary"
                                        onClick={() => setShowAddEventModal(true)}
                                    >
                                        <Plus size={16} /> Add Semester Milestone
                                    </button>
                                </div>
                            </div>

                            {/* Month Controls */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#F8FAFC',
                                borderBottom: '1px solid var(--color-border-subtle)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        className="g2-btn-outline"
                                        style={{ padding: '0.35rem 0.65rem' }}
                                        onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                                        {calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button
                                        type="button"
                                        className="g2-btn-outline"
                                        style={{ padding: '0.35rem 0.65rem' }}
                                        onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="g2-btn-outline"
                                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                                    onClick={() => setCalDate(new Date())}
                                >
                                    Today
                                </button>
                            </div>

                            {/* Calendar Month Grid */}
                            <div style={{ padding: '1.25rem' }}>
                                {calendarLoading ? (
                                    <div style={{ padding: '2rem' }}>
                                        <CardSkeleton height={320} />
                                    </div>
                                ) : calendarError ? (
                                    <div style={{ padding: '2rem' }}>
                                        <ErrorState message="Failed to load semester schedule." onRetry={refetchCalendar} />
                                    </div>
                                ) : (
                                    <div className="g2-calendar-grid">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} className="g2-cal-day-header">{day}</div>
                                        ))}

                                        {/* Dynamically compute exact days in month and map all backend events */}
                                        {(() => {
                                            const year = calDate.getFullYear();
                                            const month = calDate.getMonth();
                                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                                            const firstDayOffset = new Date(year, month, 1).getDay();
                                            const totalCells = Math.ceil((daysInMonth + firstDayOffset) / 7) * 7;

                                            return Array.from({ length: totalCells }).map((_, i) => {
                                                const dayNumber = i - firstDayOffset + 1;
                                                const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
                                                const isToday = isValidDay && dayNumber === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                                                if (!isValidDay) {
                                                    return <div key={i} className="g2-cal-cell empty" style={{ background: '#F8FAFC', opacity: 0.4 }} />;
                                                }

                                                // Match all backend events, meetings, and trainings for this day from calendarEntries
                                                const dayEvents = calendarEntries.filter(ev => {
                                                    const d = new Date(ev.date);
                                                    return d.getDate() === dayNumber && d.getMonth() === month && d.getFullYear() === year;
                                                }).map(ev => ({
                                                    ...ev,
                                                    isMine: ev.ownerModule === 'G2'
                                                }));

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`g2-cal-cell ${isToday ? 'today' : ''}`}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                                            <span>{dayNumber}</span>
                                                            {isToday && <span>Today</span>}
                                                        </div>

                                                        {dayEvents.map(ev => (
                                                            <div
                                                                key={ev.id}
                                                                className={`g2-cal-event-pill ${ev.isMine ? 'g2-cal-g2' : 'g2-cal-g5'}`}
                                                                title={`${ev.title} (${ev.time}) - ${ev.isMine ? 'G2 Milestone' : 'G5 Session'}`}
                                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}
                                                            >
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {ev.isMine ? '📌' : '⛺'} {ev.title}
                                                                </span>
                                                                {ev.isMine && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleDeleteMilestone(ev.id, e)}
                                                                        title="Delete milestone from backend"
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            padding: 0,
                                                                            cursor: 'pointer',
                                                                            color: '#B45309',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            opacity: 0.7
                                                                        }}
                                                                    >
                                                                        <X size={11} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Scheduled Operations Milestones Table */}
                            {(() => {
                                const g2Milestones = calendarEntries.filter(ev => ev.ownerModule === 'G2');
                                if (g2Milestones.length === 0) return null;
                                return (
                                    <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: '1.25rem 1.5rem', background: '#FAFAFA' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
                                            Registered Operations Milestones ({g2Milestones.length})
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                                            {g2Milestones.map(ev => (
                                                <div
                                                    key={ev.id}
                                                    style={{
                                                        background: '#FFFFFF',
                                                        border: '1px solid #E2E8F0',
                                                        borderRadius: '12px',
                                                        padding: '0.85rem 1rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '0.75rem'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ev.title}</div>
                                                        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                                                            {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {ev.time || '17:00'} • {ev.location || 'Freedom Base'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteMilestone(ev.id, e)}
                                                        className="g2-btn-outline"
                                                        style={{ padding: '0.35rem 0.55rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                                                        title="Delete Milestone"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* ================= SECTION 4: SEMESTER ROLLOVER ================= */}
                    {activeTab === 'rollover' && (
                        <div className="g2-content-card">
                            <div className="g2-card-header">
                                <div>
                                    <div className="g2-card-title">
                                        <RefreshCw size={20} color="var(--color-primary)" />
                                        <span>Semester Rollover Studio</span>
                                    </div>
                                    <div className="g2-card-subtitle">
                                        Calm, spacious, clearly sequenced transition from {currentSemester} to the next academic term
                                    </div>
                                </div>

                                {rolloverSnapshotAvailable && (
                                    <button
                                        type="button"
                                        className="g2-btn-outline"
                                        style={{ color: '#D97706', borderColor: '#FDE68A', background: '#FFFBEB' }}
                                        onClick={handleRollbackRollover}
                                    >
                                        <RotateCcw size={14} /> Rollback Last Rollover
                                    </button>
                                )}
                            </div>

                            <div style={{ padding: '2rem' }}>
                                {/* 5-Step Stepper */}
                                <div className="g2-stepper">
                                    {[
                                        { num: 1, label: 'Pre-Checklist' },
                                        { num: 2, label: 'New Term Setup' },
                                        { num: 3, label: 'Preview Changes' },
                                        { num: 4, label: 'Confirmation' },
                                        { num: 5, label: 'Complete / Rollback' }
                                    ].map(s => {
                                        const isActive = rolloverStep === s.num;
                                        const isCompleted = rolloverStep > s.num;
                                        return (
                                            <div
                                                key={s.num}
                                                className={`g2-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                            >
                                                <div className="g2-step-circle">
                                                    {isCompleted ? <Check size={16} /> : s.num}
                                                </div>
                                                <span className="g2-step-label">{s.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Step 1: Pre-Rollover Live Checklist from G5 */}
                                {rolloverStep === 1 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '680px', margin: '0 auto' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                            Step 1: Pre-Rollover Readiness Audit
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            Live audit verifying training assessments and session rollups from G5 Training Directorate before locking the semester.
                                        </p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                            <div style={{
                                                padding: '1.15rem',
                                                borderRadius: '16px',
                                                border: '1.5px solid #E2E8F0',
                                                background: preRolloverChecklist.outstandingGraduations === 0 ? '#ECFDF5' : '#FFFBEB',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {preRolloverChecklist.outstandingGraduations === 0 ? (
                                                        <CheckCircle2 size={22} color="#10B981" />
                                                    ) : (
                                                        <AlertTriangle size={22} color="#D97706" />
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                                                            Recruit Cohort Commissioning
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                                            {preRolloverChecklist.outstandingGraduations === 0 ? (
                                                                'All eligible recruits have been promoted or reviewed by G5.'
                                                            ) : (
                                                                `${preRolloverChecklist.outstandingGraduations} recruits have met attendance criteria but remain unpromoted.`
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="g2-btn-outline"
                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                                    onClick={() => window.open('/g5/portal', '_blank')}
                                                >
                                                    Open G5 Portal <ExternalLink size={12} />
                                                </button>
                                            </div>

                                            <div style={{
                                                padding: '1.15rem',
                                                borderRadius: '16px',
                                                border: '1.5px solid #E2E8F0',
                                                background: '#ECFDF5',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <CheckCircle2 size={22} color="#10B981" />
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                                                            7-Area Facilitator Competency Checks
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                                            {g2Stats.totalActiveDouloids} active facilitators certified with station clearances in G5 Directorate.
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>Done ✓</span>
                                            </div>

                                            <div style={{
                                                padding: '1.15rem',
                                                borderRadius: '16px',
                                                border: '1.5px solid #E2E8F0',
                                                background: '#ECFDF5',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {preRolloverChecklist.unsettledAttendanceCounters === 0 ? (
                                                        <CheckCircle2 size={22} color="#10B981" />
                                                    ) : (
                                                        <Clock size={22} color="#D97706" />
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                                                            Weekly Session Archives & Scan Rollups
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                                            {preRolloverChecklist.unsettledAttendanceCounters > 0
                                                                ? `${preRolloverChecklist.unsettledAttendanceCounters} active meeting/drill counter(s) ready to finalize upon rollover execution.`
                                                                : 'All meeting attendance records and counters are finalized.'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: preRolloverChecklist.unsettledAttendanceCounters === 0 ? '#10B981' : '#D97706' }}>
                                                    {preRolloverChecklist.unsettledAttendanceCounters === 0 ? 'Done ✓' : 'Auto-Archive Ready'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                            <button
                                                type="button"
                                                className="g2-btn-primary"
                                                onClick={() => setRolloverStep(2)}
                                            >
                                                Proceed to Term Setup →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: New Term Setup */}
                                {rolloverStep === 2 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '680px', margin: '0 auto' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                            Step 2: New Semester Configuration
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            Define the incoming semester parameters. These will surface dynamically in the Student Portal welcome modal.
                                        </p>

                                        <div className="g2-form-group">
                                            <label className="g2-form-label">Incoming Semester Code <span style={{ color: '#EF4444' }}>*</span></label>
                                            <input
                                                type="text"
                                                className="g2-form-input"
                                                value={rolloverForm.toSemester}
                                                onChange={(e) => setRolloverForm({ ...rolloverForm, toSemester: e.target.value })}
                                                placeholder="e.g. SEP-DEC 2026"
                                                required
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="g2-form-group">
                                                <label className="g2-form-label">Start Date <span style={{ color: '#EF4444' }}>*</span></label>
                                                <input
                                                    type="date"
                                                    className="g2-form-input"
                                                    value={rolloverForm.startDate}
                                                    onChange={(e) => setRolloverForm({ ...rolloverForm, startDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="g2-form-group">
                                                <label className="g2-form-label">End Date <span style={{ color: '#EF4444' }}>*</span></label>
                                                <input
                                                    type="date"
                                                    className="g2-form-input"
                                                    value={rolloverForm.endDate}
                                                    onChange={(e) => setRolloverForm({ ...rolloverForm, endDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="g2-form-group">
                                            <label className="g2-form-label">Spiritual Theme <span style={{ color: '#EF4444' }}>*</span></label>
                                            <input
                                                type="text"
                                                className="g2-form-input"
                                                value={rolloverForm.theme}
                                                onChange={(e) => setRolloverForm({ ...rolloverForm, theme: e.target.value })}
                                                placeholder="e.g. Rooted & Built Up In Him"
                                                required
                                            />
                                        </div>

                                        <div className="g2-form-group">
                                            <label className="g2-form-label">Anchor Scripture / Memory Verse <span style={{ color: '#EF4444' }}>*</span></label>
                                            <input
                                                type="text"
                                                className="g2-form-input"
                                                value={rolloverForm.verse}
                                                onChange={(e) => setRolloverForm({ ...rolloverForm, verse: e.target.value })}
                                                placeholder="e.g. Colossians 2:6-7"
                                                required
                                            />
                                        </div>

                                        {(!rolloverForm.toSemester?.trim() || !rolloverForm.startDate || !rolloverForm.endDate || !rolloverForm.theme?.trim() || !rolloverForm.verse?.trim()) && (
                                            <div style={{ fontSize: '0.78rem', color: '#D97706', background: '#FFFBEB', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                                                ⚠️ All 5 semester configuration fields (Semester Code, Start Date, End Date, Theme, and Scripture Verse) must be provided before you can roll over.
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                            <button
                                                type="button"
                                                className="g2-btn-outline"
                                                onClick={() => setRolloverStep(1)}
                                            >
                                                ← Back to Checklist
                                            </button>
                                            <button
                                                type="button"
                                                className="g2-btn-primary"
                                                disabled={!rolloverForm.toSemester?.trim() || !rolloverForm.startDate || !rolloverForm.endDate || !rolloverForm.theme?.trim() || !rolloverForm.verse?.trim()}
                                                style={{
                                                    opacity: (!rolloverForm.toSemester?.trim() || !rolloverForm.startDate || !rolloverForm.endDate || !rolloverForm.theme?.trim() || !rolloverForm.verse?.trim()) ? 0.5 : 1,
                                                    cursor: (!rolloverForm.toSemester?.trim() || !rolloverForm.startDate || !rolloverForm.endDate || !rolloverForm.theme?.trim() || !rolloverForm.verse?.trim()) ? 'not-allowed' : 'pointer'
                                                }}
                                                onClick={() => setRolloverStep(3)}
                                            >
                                                Preview Impact →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Preview Changes */}
                                {rolloverStep === 3 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '680px', margin: '0 auto' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                            Step 3: Preview Operational Impact
                                        </h3>

                                        <div style={{
                                            background: '#F8FAFC',
                                            border: '1.5px solid #E2E8F0',
                                            borderRadius: '16px',
                                            padding: '1.25rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.85rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Members Carrying Forward:</span>
                                                <strong>{g2Stats.totalActiveMembers} members</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Certified Douloid Cadres:</span>
                                                <strong style={{ color: '#10B981' }}>{g2Stats.totalActiveDouloids} facilitators</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Attendance Points & Streaks:</span>
                                                <strong style={{ color: '#D97706' }}>Archived & Reset for new term</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Hardware Device Links:</span>
                                                <strong style={{ color: '#2563EB' }}>All Device Links Reset (Fresh Start)</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Master Semester QR Token:</span>
                                                <strong style={{ color: 'var(--color-primary)' }}>Re-minted for {rolloverForm.toSemester}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Automatic Atomic Backup:</span>
                                                <strong style={{ color: '#10B981' }}>Captured in SemesterRolloverSnapshot</strong>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                            <button
                                                type="button"
                                                className="g2-btn-outline"
                                                onClick={() => setRolloverStep(2)}
                                            >
                                                ← Edit Parameters
                                            </button>
                                            <button
                                                type="button"
                                                className="g2-btn-primary"
                                                onClick={() => setRolloverStep(4)}
                                            >
                                                Proceed to Confirm →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Confirm & Execute */}
                                {rolloverStep === 4 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '680px', margin: '0 auto' }}>
                                        <div style={{
                                            background: '#FEF2F2',
                                            border: '1.5px solid #FCA5A5',
                                            borderRadius: '16px',
                                            padding: '1.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#B91C1C', fontWeight: 800 }}>
                                                <AlertTriangle size={22} />
                                                <span>Final Authorization Required</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#991B1B' }}>
                                                Executing this rollover locks the {currentSemester} operational ledger and switches all portals to <strong>{rolloverForm.toSemester}</strong>. An atomic snapshot is created immediately so you can 1-click rollback if required.
                                            </p>

                                            {preRolloverChecklist.outstandingGraduations > 0 && (
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={rolloverForm.overridePending}
                                                        onChange={(e) => setRolloverForm({ ...rolloverForm, overridePending: e.target.checked })}
                                                    />
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#991B1B' }}>
                                                        I acknowledge {preRolloverChecklist.outstandingGraduations} recruit evaluations are still pending with G5 and authorize override.
                                                    </span>
                                                </label>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                            <button
                                                type="button"
                                                className="g2-btn-outline"
                                                onClick={() => setRolloverStep(3)}
                                            >
                                                ← Back to Preview
                                            </button>
                                            <button
                                                type="button"
                                                className="g2-btn-primary"
                                                disabled={preRolloverChecklist.outstandingGraduations > 0 && !rolloverForm.overridePending}
                                                style={{
                                                    background: '#D97706',
                                                    opacity: (preRolloverChecklist.outstandingGraduations > 0 && !rolloverForm.overridePending) ? 0.5 : 1
                                                }}
                                                onClick={handleExecuteRollover}
                                            >
                                                {rolloverExecuting ? 'Executing Transition...' : `Confirm & Rollover to ${rolloverForm.toSemester}`}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 5: Completed */}
                                {rolloverStep === 5 && (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', maxWidth: '540px', margin: '0 auto' }}>
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '999px',
                                            background: '#ECFDF5',
                                            color: '#10B981',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1.25rem'
                                        }}>
                                            <Check size={32} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                                            Semester Rollover Complete!
                                        </h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: '0.65rem 0 1.5rem' }}>
                                            Active term updated to <strong>{currentSemester}</strong>. All member attendance points and hardware device links have been reset fresh for the new semester cycle.
                                        </p>

                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <a
                                                href={`/api/rollover/qr-poster-pdf?semester=${encodeURIComponent(currentSemester)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="g2-btn-primary"
                                                style={{
                                                    textDecoration: 'none',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    background: '#1E3A8A'
                                                }}
                                            >
                                                <Printer size={16} /> Print Semester QR Poster (PDF)
                                            </a>
                                            <button
                                                type="button"
                                                className="g2-btn-outline"
                                                onClick={() => setActiveTab('members')}
                                            >
                                                View Updated Register
                                            </button>
                                            <button
                                                type="button"
                                                className="g2-btn-outline"
                                                style={{ color: '#D97706', borderColor: '#FDE68A' }}
                                                onClick={handleRollbackRollover}
                                            >
                                                <RotateCcw size={14} /> 1-Click Rollback
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ================= SECTION 6: RECORDS & REGISTER ================= */}
                    {activeTab === 'records' && (
                        <div className="g2-content-card">
                            <div className="g2-card-header">
                                <div>
                                    <div className="g2-card-title">
                                        <BookOpen size={20} color="var(--color-primary)" />
                                        <span>Article 3(8) Official Register & Archives</span>
                                    </div>
                                    <div className="g2-card-subtitle">
                                        Chronological audit log of all membership status changes, registrations, and archived semester records
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="g2-btn-outline"
                                    onClick={handleExportRegister}
                                >
                                    <Download size={14} /> Export Official Ledger
                                </button>
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                <div style={{
                                    borderLeft: '2px solid var(--color-primary-border)',
                                    marginLeft: '0.75rem',
                                    paddingLeft: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.25rem'
                                }}>
                                    {historyLoading ? (
                                        <div style={{ padding: '0.5rem 0' }}>
                                            <ListSkeleton count={4} />
                                        </div>
                                    ) : officialLedgerEntries.length === 0 ? (
                                        <div style={{ padding: '1rem 0' }}>
                                            <EmptyState
                                                icon={BookOpen}
                                                title="No archive records"
                                                message="No archive ledger records found for the current operational cycle."
                                            />
                                        </div>
                                    ) : (
                                        officialLedgerEntries.map((rec, i) => (
                                            <div key={rec.id || i} style={{ position: 'relative' }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-1.65rem',
                                                    top: '3px',
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '999px',
                                                    background: rec.type === 'rollback' ? '#EF4444' : rec.type === 'rollover' ? '#D97706' : rec.type === 'promotion' ? '#10B981' : 'var(--color-primary)',
                                                    border: '2px solid #FFFFFF'
                                                }} />
                                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-text-main)' }}>
                                                    {rec.title}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                                    {rec.date} • Logged by <strong>{rec.user}</strong>
                                                </div>
                                                <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                                                    {rec.desc}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= SECTION 7: ACTING AS G1 ================= */}
                    {activeTab === 'acting_g1' && (
                        <div className="g2-content-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
                            <div className="g2-card-header">
                                <div>
                                    <div className="g2-card-title">
                                        <Crown size={20} color="#D97706" />
                                        <span>Acting as G1 (Executive Student Coordinator)</span>
                                    </div>
                                    <div className="g2-card-subtitle">
                                        Constitutional delegation mode when G1 is absent, on academic leave, or field sabbatical
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{
                                    padding: '1.25rem',
                                    borderRadius: '16px',
                                    background: actingAsG1 ? '#FFFBEB' : '#F8FAFC',
                                    border: `1.5px solid ${actingAsG1 ? '#FDE68A' : '#E2E8F0'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: actingAsG1 ? '#92400E' : 'var(--color-text-main)' }}>
                                            Status: {actingAsG1 ? 'Acting for G1 Active' : 'Not currently acting for G1'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                            {actingAsG1 ? `Active since ${actingSince} • Reason: ${actingReason}` : 'Standard G2 Assistant Coordinator boundaries apply.'}
                                        </div>
                                    </div>

                                    {actingAsG1 ? (
                                        <button
                                            type="button"
                                            className="g2-btn-primary"
                                            style={{ background: '#D97706' }}
                                            onClick={() => handleToggleActing(false)}
                                        >
                                            Exit G1 Mode
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="g2-btn-primary"
                                            onClick={() => setShowActingModal(true)}
                                        >
                                            Elevate to Acting G1
                                        </button>
                                    )}
                                </div>

                                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                                    <strong>Operational Safeguards:</strong>
                                    <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0' }}>
                                        <li>A persistent high-visibility banner stays displayed across the entire portal while active.</li>
                                        <li>Every executive action taken in this mode is tagged in the audit log as <em>"performed by G2 acting for G1"</em>.</li>
                                        <li>Rank certifications remain strictly owned by G5 Training Directorate.</li>
                                        <li>One-click exit available at all times.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= SECTION 8: PROFILE ================= */}
                    {activeTab === 'profile' && (
                        <div className="g2-content-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
                            <div className="g2-card-header">
                                <div>
                                    <div className="g2-card-title">
                                        <User size={20} color="var(--color-primary)" />
                                        <span>G2 Account Profile</span>
                                    </div>
                                    <div className="g2-card-subtitle">
                                        Assistant Student Coordinator Seat Information
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="g2-brand-logo-box" style={{ width: '56px', height: '56px' }}>
                                        <img src="/logo.png" alt="Doulos" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{username}</h3>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                                            G2 Assistant Student Coordinator • {userCampus}
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    background: '#F8FAFC',
                                    borderRadius: '14px',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.65rem',
                                    fontSize: '0.85rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Role Seat:</span>
                                        <strong>Assistant Student Coordinator (G2)</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Current Semester:</span>
                                        <strong>{currentSemester}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Acting G1 Status:</span>
                                        <strong>{actingAsG1 ? 'Active (Acting for G1)' : 'Standby (Standard)'}</strong>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="g2-btn-outline"
                                    style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} /> Sign Out of G2 Portal
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ================= MODAL: ADD RECRUIT (4 FIELDS ONLY) ================= */}
            {showAddRecruitModal && (
                <div className="g2-modal-backdrop" onClick={() => setShowAddRecruitModal(false)}>
                    <div className="g2-modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>+ Add Recruit</h3>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Fast 4-field interview registration</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddRecruitModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAddRecruit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Field 1: Full Name */}
                            <div className="g2-form-group">
                                <label className="g2-form-label">Full Name *</label>
                                <input
                                    type="text"
                                    className="g2-form-input"
                                    placeholder="e.g. Abigael Chebet"
                                    value={recruitName}
                                    onChange={(e) => setRecruitName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* Field 2: Admission Number */}
                            <div className="g2-form-group">
                                <label className="g2-form-label">Admission Number (Reg No) *</label>
                                <input
                                    type="text"
                                    className="g2-form-input"
                                    placeholder="e.g. 24-0578 or 21-1234"
                                    value={recruitRegNo}
                                    onChange={(e) => setRecruitRegNo(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>

                            {/* Field 3: Campus */}
                            <div className="g2-form-group">
                                <label className="g2-form-label">Campus *</label>
                                <select
                                    className="g2-form-input"
                                    value={recruitCampus}
                                    onChange={(e) => setRecruitCampus(e.target.value)}
                                >
                                    <option value="Athi River">Athi River</option>
                                    <option value="Valley Road">Valley Road</option>
                                </select>
                            </div>

                            {/* Field 4: Phone / WhatsApp */}
                            <div className="g2-form-group">
                                <label className="g2-form-label">Phone / WhatsApp</label>
                                <input
                                    type="tel"
                                    className="g2-form-input"
                                    placeholder="e.g. 0712345678"
                                    value={recruitPhone}
                                    onChange={(e) => setRecruitPhone(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    className="g2-btn-outline"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    onClick={() => setShowAddRecruitModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="g2-btn-primary"
                                    disabled={submittingRecruit}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    {submittingRecruit ? 'Enrolling...' : 'Enrol Recruit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL: EDIT MEMBER PROFILE ================= */}
            {memberToEdit && (
                <div className="g2-modal-backdrop" onClick={() => setMemberToEdit(null)}>
                    <div className="g2-modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1EFFF', color: '#4B3F8C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Edit2 size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Edit Member Record</h3>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Update profile details and registry classifications</span>
                                </div>
                            </div>
                            <button onClick={() => setMemberToEdit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSaveMemberEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem' }}>
                                <div className="g2-form-group">
                                    <label className="g2-form-label">Admission No (Reg No) *</label>
                                    <input
                                        type="text"
                                        className="g2-form-input"
                                        style={{ fontWeight: 700, fontFamily: 'monospace' }}
                                        value={memberToEdit.studentRegNo || ''}
                                        onChange={(e) => setMemberToEdit({ ...memberToEdit, studentRegNo: e.target.value.toUpperCase() })}
                                        placeholder="e.g. 24-0578"
                                        required
                                    />
                                </div>
                                <div className="g2-form-group">
                                    <label className="g2-form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="g2-form-input"
                                        value={memberToEdit.name || ''}
                                        onChange={(e) => setMemberToEdit({ ...memberToEdit, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="g2-form-group">
                                    <label className="g2-form-label">Campus</label>
                                    <select
                                        className="g2-form-input"
                                        value={memberToEdit.campus || 'Athi River'}
                                        onChange={(e) => setMemberToEdit({ ...memberToEdit, campus: e.target.value })}
                                    >
                                        <option value="Athi River">Athi River</option>
                                        <option value="Valley Road">Valley Road</option>
                                    </select>
                                </div>

                                <div className="g2-form-group">
                                    <label className="g2-form-label">Member Category</label>
                                    <select
                                        className="g2-form-input"
                                        value={memberToEdit.memberType || 'Douloid'}
                                        onChange={(e) => setMemberToEdit({ ...memberToEdit, memberType: e.target.value })}
                                    >
                                        <option value="Douloid">Douloid (Facilitator)</option>
                                        <option value="Recruit">Recruit</option>
                                        <option value="Visitor">Visitor</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="g2-form-group">
                                    <label className="g2-form-label">Douloid Rank</label>
                                    <select
                                        className="g2-form-input"
                                        value={memberToEdit.douloidRank || 'None'}
                                        onChange={(e) => setMemberToEdit({ ...memberToEdit, douloidRank: e.target.value })}
                                    >
                                        <option value="None">None</option>
                                        <option value="Shadow Douloid">Shadow Douloid</option>
                                        <option value="Basic Douloid">Basic Douloid</option>
                                        <option value="Intermediate Douloid">Intermediate Douloid</option>
                                        <option value="Lead Douloid">Lead Douloid</option>
                                    </select>
                                </div>

                                <div className="g2-form-group">
                                    <label className="g2-form-label">Status</label>
                                    <select
                                        className="g2-form-input"
                                        value={memberToEdit.status || 'Active'}
                                        onChange={(e) => setMemberToEdit({ ...memberToEdit, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Archived">Archived</option>
                                        <option value="Graduated">Graduated</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="g2-form-group">
                                    <label className="g2-form-label">Phone / WhatsApp</label>
                                    <input
                                        type="tel"
                                        className="g2-form-input"
                                        placeholder="+254 7..."
                                        value={memberToEdit.phone || ''}
                                        onChange={(e) => setMemberToEdit({ ...memberToEdit, phone: e.target.value })}
                                    />
                                </div>

                                <div className="g2-form-group">
                                    <label className="g2-form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="g2-form-input"
                                        placeholder="user@daystar.ac.ke"
                                        value={memberToEdit.email || ''}
                                        onChange={(e) => setMemberToEdit({ ...memberToEdit, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F1F5' }}>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteMemberPermanently(memberToEdit)}
                                    style={{
                                        background: '#FEE2E2',
                                        color: '#DC2626',
                                        border: '1px solid #FCA5A5',
                                        borderRadius: '8px',
                                        padding: '0.6rem 1rem',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}
                                >
                                    <Trash2 size={14} /> Delete Member
                                </button>

                                <div style={{ display: 'flex', gap: '0.65rem' }}>
                                    <button type="button" className="g2-btn-outline" onClick={() => setMemberToEdit(null)}>Cancel</button>
                                    <button type="submit" className="g2-btn-primary" style={{ justifyContent: 'center' }}>Save Changes</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL: SOFT ARCHIVE CONFIRMATION ================= */}
            {memberToArchive && (
                <div className="g2-modal-backdrop" onClick={() => setMemberToArchive(null)}>
                    <div className="g2-modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#D97706' }}>
                            <Archive size={24} />
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Confirm Archive Record</h3>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0 }}>
                            Are you sure you want to move <strong>{memberToArchive.name}</strong> to the inactive archive?
                            This is a reversible soft action — records are preserved in Article 3(8) history.
                        </p>
                        <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                            <button type="button" className="g2-btn-outline" style={{ flex: 1 }} onClick={() => setMemberToArchive(null)}>Cancel</button>
                            <button type="button" className="g2-btn-primary" style={{ flex: 1, background: '#D97706', justifyContent: 'center' }} onClick={handleConfirmArchive}>
                                Confirm Soft Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL: VIEW STUDENT PORTAL PREVIEW ================= */}
            {portalPreviewMember && (
                <div className="g2-modal-backdrop" onClick={() => setPortalPreviewMember(null)}>
                    <div className="g2-modal-card" style={{ maxWidth: '460px', padding: 0 }} onClick={e => e.stopPropagation()}>
                        {/* Mock Phone Frame Header */}
                        <div style={{
                            background: '#1D4ED8',
                            color: '#FFFFFF',
                            padding: '1.25rem',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.85 }}>
                                    Student Portal Preview
                                </span>
                                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 800 }}>
                                    {portalPreviewMember.name}
                                </h3>
                            </div>
                            <button onClick={() => setPortalPreviewMember(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Simulated Student Portal View */}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#F8FAFC' }}>
                            <div style={{
                                background: '#FFFFFF',
                                borderRadius: '16px',
                                padding: '1.15rem',
                                border: '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.85rem'
                            }}>
                                <div className="g2-avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem', background: '#EFF6FF', color: '#1D4ED8' }}>
                                    {(portalPreviewMember.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{portalPreviewMember.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                        {(portalPreviewMember.studentRegNo || portalPreviewMember.regNo || portalPreviewMember.admissionNumber) ? `${portalPreviewMember.studentRegNo || portalPreviewMember.regNo || portalPreviewMember.admissionNumber} • ` : ''}{portalPreviewMember.campus}
                                    </div>
                                    <div style={{ marginTop: '0.35rem' }}>
                                        <RankBadge rank={portalPreviewMember.douloidRank} />
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                background: '#FFFFFF',
                                borderRadius: '16px',
                                padding: '1.15rem',
                                border: '1px solid #E2E8F0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748B' }}>Belay Clearance:</span>
                                    <strong>{portalPreviewMember.belayStatus || 'Secondary Belayer'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748B' }}>Semester Points:</span>
                                    <strong style={{ color: '#10B981' }}>{portalPreviewMember.totalPoints || 0} pts</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL: ADD SEMESTER MILESTONE ================= */}
            {showAddEventModal && (
                <div className="g2-modal-backdrop" onClick={() => setShowAddEventModal(false)}>
                    <div className="g2-modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>+ Add Semester Milestone</h3>
                            <button onClick={() => setShowAddEventModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleAddCalendarMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div className="g2-form-group">
                                <label className="g2-form-label">Milestone Title *</label>
                                <input name="title" type="text" className="g2-form-input" placeholder="e.g. Annual General Meeting (AGM)" required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="g2-form-group">
                                    <label className="g2-form-label">Date *</label>
                                    <input name="date" type="date" className="g2-form-input" required defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="g2-form-group">
                                    <label className="g2-form-label">Time</label>
                                    <input name="time" type="time" className="g2-form-input" defaultValue="18:00" />
                                </div>
                            </div>

                            <div className="g2-form-group">
                                <label className="g2-form-label">Venue / Location</label>
                                <input name="location" type="text" className="g2-form-input" placeholder="e.g. Hope Centre / DAC 506" defaultValue="Freedom Base" />
                            </div>

                            <div className="g2-form-group">
                                <label className="g2-form-label">Milestone Category</label>
                                <select name="type" className="g2-form-input">
                                    <option value="Milestone">General Semester Milestone</option>
                                    <option value="Operations">Operations / Roster Freeze</option>
                                    <option value="Retreat">Retreat / Camp Outbound</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                                <button type="button" className="g2-btn-outline" style={{ flex: 1 }} onClick={() => setShowAddEventModal(false)}>Cancel</button>
                                <button type="submit" className="g2-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Milestone</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL: ACTING AS G1 ACTIVATION ================= */}
            {showActingModal && (
                <div className="g2-modal-backdrop" onClick={() => setShowActingModal(false)}>
                    <div className="g2-modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#D97706' }}>
                            <ShieldAlert size={24} />
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Activate Acting as G1 Mode</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
                            Document the official reason for performing executive G1 coordinator duties in their absence:
                        </p>

                        <div className="g2-form-group">
                            <label className="g2-form-label">Reason for G1 Absence</label>
                            <select
                                className="g2-form-input"
                                value={actingReason}
                                onChange={(e) => setActingReason(e.target.value)}
                            >
                                <option value="Academic Leave / Field Sabbatical">Academic Leave / Field Sabbatical</option>
                                <option value="Official Delegation from G1 Coordinator">Official Delegation from G1 Coordinator</option>
                                <option value="Executive Sabbatical / Mission Outbound">Executive Sabbatical / Mission Outbound</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                            <button type="button" className="g2-btn-outline" style={{ flex: 1 }} onClick={() => setShowActingModal(false)}>Cancel</button>
                            <button
                                type="button"
                                className="g2-btn-primary"
                                style={{ flex: 1, background: '#D97706', justifyContent: 'center' }}
                                onClick={() => handleToggleActing(true, actingReason)}
                            >
                                Confirm Activation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL: MULTI-FORMAT RECRUIT IMPORTER ================= */}
            <G2MemberImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                currentSemester={currentSemester}
                api={api}
                showToast={showToast}
                onImportSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['roster-members'] });
                    queryClient.invalidateQueries({ queryKey: ['g2-stats'] });
                }}
            />
        </div>
    );
};

export default G2OperationsPortal;
