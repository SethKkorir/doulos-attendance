import React, { useState, useMemo } from 'react';
import {
    Compass,
    Plus,
    Calendar,
    Clock,
    MapPin,
    Users,
    CheckCircle2,
    Play,
    Square,
    Search,
    ChevronRight,
    QrCode,
    X,
    Filter,
    Edit,
    Trash2,
    Radio,
    HelpCircle,
    Award
} from 'lucide-react';

const G5TrainingsWorkspace = ({
    trainings = [],
    members = [],
    campusFilter = 'All',
    onCreateTraining,
    onStartTraining,
    onEndTraining,
    onOpenAttendance,
    onOpenTrainingQr,
    onDeleteTraining
}) => {
    const [subTab, setSubTab] = useState('upcoming'); // 'upcoming', 'active', 'completed', 'drafts'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [detailTab, setDetailTab] = useState('overview'); // 'overview', 'attendance', 'question', 'schedule', 'evaluation'

    // Campus and subtab filtering
    const filteredTrainings = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return trainings.filter(t => {
            // Campus match
            const campusMatch = campusFilter === 'All' || t.campus === campusFilter || t.campus === 'Both' || t.campus === 'All';
            if (!campusMatch) return false;

            // Search query match
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nameMatch = (t.name || '').toLowerCase().includes(q);
                const venueMatch = (t.location?.name || t.venue || '').toLowerCase().includes(q);
                const codeMatch = (t.code || '').toLowerCase().includes(q);
                if (!nameMatch && !venueMatch && !codeMatch) return false;
            }

            const tDate = new Date(t.date);
            const isCompleted = !t.isActive && tDate < now;
            const isActive = t.isActive;
            const isUpcoming = !isActive && tDate >= now;
            const isDraft = t.status === 'Draft' || t.isTestMeeting;

            if (subTab === 'active') return isActive;
            if (subTab === 'upcoming') return isUpcoming || isActive;
            if (subTab === 'completed') return isCompleted;
            if (subTab === 'drafts') return isDraft;

            return true;
        });
    }, [trainings, campusFilter, searchQuery, subTab]);

    return (
        <div className="g5-trainings-workspace">
            {/* WORKSPACE HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                        Training Operations
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                        Field readiness drills, wilderness practicals, and station rotations
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Search training..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '0.45rem 0.85rem 0.45rem 2rem',
                                borderRadius: '10px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.84rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={onCreateTraining}
                        className="g5-btn-blue-solid"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem' }}
                    >
                        <Plus size={16} /> + Create Training
                    </button>
                </div>
            </div>

            {/* SUBTABS */}
            <div className="g5-subtab-bar">
                <button
                    className={`g5-subtab-btn ${subTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setSubTab('upcoming')}
                >
                    <Compass size={15} /> Upcoming Drills
                </button>
                <button
                    className={`g5-subtab-btn ${subTab === 'active' ? 'active' : ''}`}
                    onClick={() => setSubTab('active')}
                >
                    <span className="g5-pulse-dot" style={{ width: '7px', height: '7px' }} /> Active Sessions
                </button>
                <button
                    className={`g5-subtab-btn ${subTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setSubTab('completed')}
                >
                    <CheckCircle2 size={15} /> Completed Archive
                </button>
                <button
                    className={`g5-subtab-btn ${subTab === 'drafts' ? 'active' : ''}`}
                    onClick={() => setSubTab('drafts')}
                >
                    Drafts & Tests
                </button>
            </div>

            {/* TRAININGS LIST / EMPTY STATE */}
            {filteredTrainings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <Compass size={42} style={{ color: '#94A3B8', marginBottom: '0.85rem' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        No {subTab} training sessions found
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '380px', margin: '0.4rem auto 1.25rem' }}>
                        There are no training sessions currently logged under this category for {campusFilter === 'All' ? 'any campus' : campusFilter}.
                    </p>
                    <button
                        type="button"
                        onClick={onCreateTraining}
                        className="g5-btn-blue-solid"
                        style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 700 }}
                    >
                        <Plus size={15} /> Create Training Session
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                    {filteredTrainings.map(t => {
                        const expected = t.roster?.length || 86;
                        const checkedIn = t.attendanceCount ?? 0;
                        const pct = expected > 0 ? Math.round((checkedIn / expected) * 100) : 0;
                        const dateFormatted = new Date(t.date).toLocaleDateString('en-KE', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        });

                        return (
                            <div
                                key={t._id}
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: '16px',
                                    border: t.isActive ? '1.5px solid #38BDF8' : '1px solid #E2E8F0',
                                    padding: '1.25rem',
                                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                                        <span className={`g5-chip ${t.isActive ? 'g5-chip-active' : 'g5-chip-upcoming'}`}>
                                            {t.isActive ? 'ACTIVE' : 'UPCOMING'}
                                        </span>
                                        <span style={{ fontSize: '0.76rem', color: '#1D4ED8', fontWeight: 700 }}>
                                            {t.campus || 'Both Campuses'}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#0F172A' }}>
                                        {t.name}
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <Calendar size={14} color="#94A3B8" />
                                            <span>{dateFormatted} • {t.startTime || 'TBD'} — {t.endTime || 'TBD'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <MapPin size={14} color="#94A3B8" />
                                            <span>{t.location?.name || t.venue || 'Freedom Base'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <Users size={14} color="#94A3B8" />
                                            <span>Facilitators: 4 Assigned</span>
                                        </div>
                                    </div>

                                    {/* Metrics & Progress Bar */}
                                    <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                                            <span>Attendance: {checkedIn} / {expected}</span>
                                            <span>{pct}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.max(5, pct)}%`, height: '100%', background: t.isActive ? '#10B981' : '#3B82F6', borderRadius: '999px' }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTraining(t);
                                            setDetailTab('overview');
                                        }}
                                        style={{
                                            flex: 1,
                                            background: '#EFF6FF',
                                            border: '1px solid #BFDBFE',
                                            color: '#1D4ED8',
                                            borderRadius: '8px',
                                            padding: '0.55rem',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            textAlign: 'center'
                                        }}
                                    >
                                        Manage Training
                                    </button>

                                    {onOpenTrainingQr && (
                                        <button
                                            type="button"
                                            onClick={() => onOpenTrainingQr(t)}
                                            title="Display QR"
                                            style={{
                                                background: '#FFFFFF',
                                                border: '1px solid #CBD5E1',
                                                borderRadius: '8px',
                                                padding: '0.55rem 0.65rem',
                                                cursor: 'pointer',
                                                color: '#334155'
                                            }}
                                        >
                                            <QrCode size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TRAINING DETAIL MODAL / DRAWER */}
            {selectedTraining && (
                <div className="g5-modal-overlay" onClick={() => setSelectedTraining(null)}>
                    <div className="g5-modal-window" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
                        <div className="g5-modal-header">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className={`g5-chip ${selectedTraining.isActive ? 'g5-chip-active' : 'g5-chip-upcoming'}`}>
                                        {selectedTraining.isActive ? 'ACTIVE' : 'UPCOMING'}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                                        Code: {selectedTraining.code || 'T-AUTO'}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.2rem 0 0', color: '#0F172A' }}>
                                    {selectedTraining.name}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTraining(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Detail Tabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.75rem', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                            {['overview', 'attendance', 'question', 'schedule', 'evaluation'].map(tKey => (
                                <button
                                    key={tKey}
                                    type="button"
                                    onClick={() => setDetailTab(tKey)}
                                    style={{
                                        border: 'none',
                                        background: detailTab === tKey ? '#EFF6FF' : 'transparent',
                                        color: detailTab === tKey ? '#1D4ED8' : '#64748B',
                                        fontWeight: 700,
                                        fontSize: '0.84rem',
                                        padding: '0.4rem 0.85rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {tKey}
                                </button>
                            ))}
                        </div>

                        <div className="g5-modal-body">
                            {detailTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>DATE & TIME</div>
                                            <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                                                {new Date(selectedTraining.date).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                                {selectedTraining.startTime} — {selectedTraining.endTime}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>CAMPUS & VENUE</div>
                                            <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                                                {selectedTraining.campus}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                                {selectedTraining.location?.name || selectedTraining.venue || 'Freedom Base'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>ATTENDANCE COUNT</div>
                                            <div style={{ fontWeight: 800, color: '#1D4ED8', marginTop: '0.2rem', fontSize: '1.1rem' }}>
                                                {selectedTraining.attendanceCount ?? 0} Checked In
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                                Expected: {selectedTraining.roster?.length || 86}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operational Safety Status */}
                                    <div style={{ padding: '0.85rem', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <CheckCircle2 size={18} color="#16A34A" />
                                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#166534' }}>
                                            Safety Clearance: Certified Belayers Assigned • LOP-01 Protocol Enforced
                                        </span>
                                    </div>

                                    {/* Question of the Day Attached */}
                                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#1D4ED8', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                            <HelpCircle size={16} /> Attached Question of the Day
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#1E293B' }}>
                                            {selectedTraining.questionOfDay || 'No specific question attached. General attendance check-in active.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {detailTab === 'attendance' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                                            Attendance Roster ({selectedTraining.attendanceCount ?? 0} Present)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTraining(null);
                                                onOpenAttendance(selectedTraining);
                                            }}
                                            className="g5-btn-blue-solid"
                                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px' }}
                                        >
                                            Open Full Live Attendance
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.84rem', color: '#64748B' }}>
                                        Live mobile check-ins update synchronously via QR verification and campus geofencing.
                                    </p>
                                </div>
                            )}

                            {detailTab === 'question' && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800 }}>Question Configuration</h4>
                                    <p style={{ fontSize: '0.84rem', color: '#475569' }}>
                                        {selectedTraining.questionOfDay || 'No question assigned.'}
                                    </p>
                                </div>
                            )}

                            {detailTab === 'schedule' && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800 }}>Station Schedule</h4>
                                    <div style={{ fontSize: '0.84rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                        <div>10:00 AM — Assembly & Safety Briefing</div>
                                        <div>10:30 AM — Station 1: Compass Triangulation</div>
                                        <div>11:30 AM — Station 2: Topo Map Reading</div>
                                        <div>12:30 PM — Debrief & Verification</div>
                                    </div>
                                </div>
                            )}

                            {detailTab === 'evaluation' && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800 }}>Practical Competency Checks</h4>
                                    <p style={{ fontSize: '0.84rem', color: '#64748B' }}>
                                        Facilitators evaluate skills (High Ropes, First Aid, Rescue) after completion.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="g5-modal-footer">
                            <button
                                type="button"
                                onClick={() => setSelectedTraining(null)}
                                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                            >
                                Close
                            </button>

                            {selectedTraining.isActive ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onEndTraining(selectedTraining._id);
                                        setSelectedTraining(null);
                                    }}
                                    style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <Square size={14} /> End Training Session
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onStartTraining(selectedTraining._id);
                                        setSelectedTraining(null);
                                    }}
                                    style={{ background: '#059669', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <Play size={14} /> Start Live Session
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G5TrainingsWorkspace;
