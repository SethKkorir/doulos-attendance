import React from 'react';
import {
    CalendarCheck,
    Calendar,
    Users,
    Award,
    Radio,
    AlertTriangle,
    CheckCircle2,
    Clock,
    MapPin,
    ChevronRight,
    Plus,
    FileText,
    HelpCircle
} from 'lucide-react';

const G5CommandDashboard = ({
    g5Stats = {},
    username,
    campusFilter,
    setCampusFilter,
    activeMeeting,
    nextUpcomingMeeting,
    meetings = [],
    recruits = [],
    activeMembers = [],
    flaggedMembers = [],
    onNavigateTab,
    onOpenSession,
    onCreateMeeting
}) => {
    // Dynamic greeting based on current time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const formattedDate = new Date().toLocaleDateString('en-KE', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    // Real metrics calculations (100% genuine data, no mock fallbacks)
    const recruitsCount = recruits.length || g5Stats.totalRecruits || 0;
    const meetingsCount = meetings.length || g5Stats.totalMeetingsCount || 0;
    const attendanceRate = g5Stats.attendancePercentage || 0;
    const progressionCount = g5Stats.recruitsReadyToGraduate || 0;

    // Active session details
    const liveSession = activeMeeting || (meetings.find(m => m.isActive)) || null;
    const upcomingSession = !liveSession ? (nextUpcomingMeeting || null) : null;

    // Check-in counts for live session
    const checkedInCount = liveSession
        ? (liveSession.attendees?.length || liveSession.attendanceCount || g5Stats.todayCheckedIn || 0)
        : 0;
    const expectedCount = liveSession?.roster?.length || activeMembers.length || recruitsCount || 0;
    const checkInRate = expectedCount > 0 ? Math.min(100, Math.round((checkedInCount / expectedCount) * 100)) : 0;

    // Recent 4 meetings for the real sessions log
    const recentMeetings = [...meetings]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4);

    return (
        <div className="g5-command-centre-landing">
            {/* 1. DASHBOARD HEADER */}
            <div className="g5-command-header">
                <div>
                    <h1 className="g5-command-greeting">
                        {greeting}, {username || 'Director'}
                    </h1>
                    <div className="g5-command-sub">
                        <span style={{ color: '#1D4ED8', fontWeight: 800 }}>Training & Safety Directorate</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                            Campus:
                        </label>
                        <select
                            className="g5-campus-select"
                            value={campusFilter}
                            onChange={(e) => setCampusFilter(e.target.value)}
                        >
                            <option value="All">All Campuses ▼</option>
                            <option value="Athi River">Athi River</option>
                            <option value="Valley Road">Valley Road</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={onCreateMeeting}
                        className="g5-btn-primary"
                        style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
                    >
                        <Plus size={16} /> New Meeting
                    </button>
                </div>
            </div>

            {/* 2. REAL DIRECTORATE KPI METRICS (4 GENUINE KPI CARDS) */}
            <div className="g5-command-kpi-grid">
                {/* ACTIVE RECRUITS */}
                <div
                    className="g5-command-kpi-card"
                    onClick={() => onNavigateTab('recruits')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="g5-command-kpi-title">ACTIVE RECRUITS</div>
                    <div className="g5-command-kpi-value" style={{ color: '#0F172A' }}>
                        {recruitsCount}
                    </div>
                    <div className="g5-command-kpi-meta">
                        Enrolled in training cohorts
                    </div>
                </div>

                {/* TOTAL MEETINGS */}
                <div
                    className="g5-command-kpi-card"
                    onClick={() => onNavigateTab('meetings')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="g5-command-kpi-title">TOTAL SESSIONS</div>
                    <div className="g5-command-kpi-value" style={{ color: '#1D4ED8' }}>
                        {meetingsCount}
                    </div>
                    <div className="g5-command-kpi-meta">
                        Scheduled meetings & trainings
                    </div>
                </div>

                {/* ATTENDANCE RATE */}
                <div
                    className="g5-command-kpi-card"
                    onClick={() => onNavigateTab('attendance')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="g5-command-kpi-title">ATTENDANCE RATE</div>
                    <div className="g5-command-kpi-value" style={{ color: '#059669' }}>
                        {attendanceRate}%
                    </div>
                    <div className="g5-command-kpi-meta">
                        Active semester attendance
                    </div>
                </div>

                {/* PROGRESSION READY */}
                <div
                    className="g5-command-kpi-card"
                    onClick={() => onNavigateTab('progression')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="g5-command-kpi-title">PROGRESSION READY</div>
                    <div className="g5-command-kpi-value" style={{ color: '#D97706' }}>
                        {progressionCount}
                    </div>
                    <div className="g5-command-kpi-meta">
                        Eligible for rank advancement
                    </div>
                </div>
            </div>

            {/* 3. SESSION STATUS BANNER (REAL DATA ONLY) */}
            {liveSession ? (
                /* CASE A: LIVE ACTIVE SESSION */
                <div
                    className="g5-today-training-banner"
                    style={{
                        background: 'linear-gradient(135deg, #064E3B 0%, #065F46 60%, #047857 100%)',
                        border: '1.5px solid #10B981',
                        boxShadow: '0 12px 30px -10px rgba(16, 185, 129, 0.35)'
                    }}
                >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                            <span className="g5-chip" style={{ background: '#10B981', color: '#FFFFFF', fontWeight: 800 }}>
                                ● LIVE SESSION ACTIVE
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#A7F3D0', fontWeight: 600 }}>
                                {liveSession.campus || campusFilter}
                            </span>
                        </div>

                        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#FFFFFF' }}>
                            {liveSession.name}
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.84rem', color: '#D1FAE5', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Clock size={15} color="#6EE7B7" />
                                <span>{liveSession.startTime || 'Ongoing'}{liveSession.endTime ? ` — ${liveSession.endTime}` : ''}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <MapPin size={15} color="#6EE7B7" />
                                <span>{liveSession.location?.name || liveSession.venue || liveSession.campus || 'Main Venue'}</span>
                            </div>
                            {(liveSession.questionOfDay || liveSession.question) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <HelpCircle size={15} color="#6EE7B7" />
                                    <span>Question: "{liveSession.questionOfDay || liveSession.question}"</span>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginTop: '1.1rem', maxWidth: '420px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#ECFDF5', marginBottom: '0.2rem' }}>
                                <span>Attendance Check-ins</span>
                                <span>{checkedInCount} / {expectedCount} ({checkInRate}%)</span>
                            </div>
                            <div className="g5-today-progress-bar" style={{ background: 'rgba(0, 0, 0, 0.25)' }}>
                                <div className="g5-today-progress-fill" style={{ width: `${Math.max(6, checkInRate)}%`, background: '#34D399' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <button
                            type="button"
                            onClick={() => onOpenSession(liveSession)}
                            style={{
                                background: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0.85rem 1.4rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                            }}
                        >
                            <Radio size={16} /> Open Session Command
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('attendance')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            View Live Roster
                        </button>
                    </div>
                </div>
            ) : upcomingSession ? (
                /* CASE B: UPCOMING SCHEDULED SESSION ON STANDBY */
                <div
                    className="g5-today-training-banner"
                    style={{
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                        border: '1.5px solid #334155'
                    }}
                >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                            <span className="g5-chip" style={{ background: '#3B82F6', color: '#FFFFFF', fontWeight: 800 }}>
                                UPCOMING SESSION • STANDBY
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>
                                {upcomingSession.campus || campusFilter}
                            </span>
                        </div>

                        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#FFFFFF' }}>
                            {upcomingSession.name}
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.84rem', color: '#CBD5E1', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Calendar size={15} color="#38BDF8" />
                                <span>{new Date(upcomingSession.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Clock size={15} color="#38BDF8" />
                                <span>{upcomingSession.startTime || 'Time TBA'}{upcomingSession.endTime ? ` — ${upcomingSession.endTime}` : ''}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <MapPin size={15} color="#38BDF8" />
                                <span>{upcomingSession.location?.name || upcomingSession.venue || upcomingSession.campus || 'Main Campus'}</span>
                            </div>
                        </div>

                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                            Standby mode — attendance check-ins will activate once session is launched.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <button
                            type="button"
                            onClick={() => onOpenSession(upcomingSession)}
                            style={{
                                background: '#38BDF8',
                                color: '#0F172A',
                                border: 'none',
                                padding: '0.8rem 1.3rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            Inspect Details
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('meetings')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                padding: '0.55rem 1.1rem',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            All Sessions ({meetings.length})
                        </button>
                    </div>
                </div>
            ) : (
                /* CASE C: NO ACTIVE OR UPCOMING SESSION */
                <div
                    style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '1.75rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1.25rem',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <CalendarCheck size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                                No Session Currently Active
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.15rem' }}>
                                All quiet on the training front. Schedule a new meeting session to track attendance.
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCreateMeeting}
                        className="g5-btn-primary"
                        style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                    >
                        <Plus size={16} /> Schedule Meeting
                    </button>
                </div>
            )}

            {/* 4. SPLIT: REAL OPERATIONAL ALERTS & RECENT TRAINING SESSIONS */}
            <div className="g5-command-split" style={{ marginTop: '1.5rem' }}>
                {/* NEEDS ATTENTION (GENUINE DATA ONLY) */}
                <div className="g5-attention-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                                NEEDS ATTENTION
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                                Operational priority alerts requiring directorate follow-up
                            </p>
                        </div>
                        <span className="g5-chip g5-chip-attention">Priority Matrix</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* 1. Recruits with 3+ consecutive absences */}
                        {flaggedMembers.length > 0 ? (
                            <div
                                className="g5-attention-item"
                                onClick={() => onNavigateTab('attendance')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                                            {flaggedMembers.length} recruit{flaggedMembers.length !== 1 ? 's' : ''} with 3+ consecutive absences
                                        </div>
                                        <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                                            Review attendance records & counsel participants
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1D4ED8', fontSize: '0.8rem', fontWeight: 700 }}>
                                    <span>Review</span>
                                    <ChevronRight size={15} />
                                </div>
                            </div>
                        ) : null}

                        {/* 2. Recruits ready for progression */}
                        {progressionCount > 0 ? (
                            <div
                                className="g5-attention-item"
                                onClick={() => onNavigateTab('progression')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Award size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                                            {progressionCount} recruit{progressionCount !== 1 ? 's' : ''} eligible for Douloid advancement
                                        </div>
                                        <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                                            Met attendance points & qualifications criteria
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1D4ED8', fontSize: '0.8rem', fontWeight: 700 }}>
                                    <span>Evaluate</span>
                                    <ChevronRight size={15} />
                                </div>
                            </div>
                        ) : null}

                        {/* 3. When all records are clear */}
                        {flaggedMembers.length === 0 && progressionCount === 0 && (
                            <div style={{ padding: '0.85rem 1rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <CheckCircle2 size={18} color="#16A34A" />
                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#166534' }}>
                                    Zero urgent alerts. All active recruits and sessions are running smoothly.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RECENT SESSIONS ROSTER (REPLACES FAKE CAMP CARD) */}
                <div className="g5-attention-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                                RECENT SESSIONS
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                                Recent training sessions and attendance logs
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onNavigateTab('meetings')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#1D4ED8',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                            }}
                        >
                            All ({meetings.length}) <ChevronRight size={14} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {recentMeetings.length > 0 ? (
                            recentMeetings.map((m) => (
                                <div
                                    key={m._id}
                                    onClick={() => onOpenSession(m)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem 0.9rem',
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F172A' }}>
                                            {m.name}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.15rem' }}>
                                            {new Date(m.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })} • {m.campus}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <span style={{
                                            fontSize: '0.74rem',
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: m.isActive ? '#DCFCE7' : '#EFF6FF',
                                            color: m.isActive ? '#15803D' : '#1D4ED8'
                                        }}>
                                            {m.isActive ? 'Active' : `${m.attendees?.length || m.attendanceCount || 0} Attended`}
                                        </span>
                                        <ChevronRight size={14} color="#94A3B8" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                                No training sessions recorded yet this semester.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. QUICK COMMAND ACTIONS BAR (100% REAL ACTIONS ONLY) */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                <button
                    type="button"
                    onClick={onCreateMeeting}
                    style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '0.65rem 1.1rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        transition: 'border-color 0.15s ease'
                    }}
                >
                    <Plus size={16} color="#1D4ED8" /> Schedule Meeting
                </button>

                <button
                    type="button"
                    onClick={() => onNavigateTab('attendance')}
                    style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '0.65rem 1.1rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                    }}
                >
                    <CalendarCheck size={16} color="#059669" /> Take Attendance
                </button>

                <button
                    type="button"
                    onClick={() => onNavigateTab('recruits')}
                    style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '0.65rem 1.1rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                    }}
                >
                    <Users size={16} color="#7C3AED" /> Manage Recruits ({recruitsCount})
                </button>

                <button
                    type="button"
                    onClick={() => onNavigateTab('progression')}
                    style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '0.65rem 1.1rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                    }}
                >
                    <Award size={16} color="#D97706" /> Cadre Progression
                </button>
            </div>
        </div>
    );
};

export default G5CommandDashboard;
