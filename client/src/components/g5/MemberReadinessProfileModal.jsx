import React from 'react';
import {
    X,
    Award,
    CheckCircle2,
    Calendar,
    Shield,
    Compass,
    ArrowUpRight,
    Lock
} from 'lucide-react';

const MemberReadinessProfileModal = ({
    member,
    onClose,
    onEvaluate,
    onPromote,
    onViewAttendance
}) => {
    if (!member) return null;

    const rank = member.douloidRank || (member.memberType === 'Recruit' ? 'Recruit' : 'None');
    const points = member.totalPoints ?? 0;
    const attendancePct = member.attendancePercentage ?? (Math.min(100, Math.round((points / 120) * 100)) || 88);
    const trainingsCount = member.trainingsAttended ?? 14;
    const totalTrainings = 16;
    const readinessScore = Math.min(100, Math.round((points * 0.5) + (attendancePct * 0.5)));

    // Rank Progression Steps
    const ranksOrder = ['Recruit', 'Shadow Douloid', 'Basic Douloid', 'Intermediate Douloid', 'Lead Douloid'];
    const currentRankIndex = ranksOrder.indexOf(rank);

    return (
        <div className="g5-modal-overlay" onClick={onClose}>
            <div className="g5-modal-window" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
                {/* MODAL HEADER */}
                <div className="g5-modal-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span className="g5-chip g5-chip-upcoming">MEMBER READINESS PROFILE</span>
                            <span style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 700 }}>
                                {member.campus || 'Athi River'} Campus
                            </span>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>
                            {member.name}
                        </h2>
                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.15rem' }}>
                            Admission: {member.studentRegNo || 'REG-N/A'} • {member.phone || 'No phone'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="g5-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                    {/* CORE OPERATIONAL READINESS METRICS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
                        <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>ATTENDANCE</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.2rem' }}>
                                {attendancePct}%
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Meets Threshold</div>
                        </div>

                        <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>TRAINING</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
                                {trainingsCount} / {totalTrainings}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Modules Passed</div>
                        </div>

                        <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>SAFETY STATUS</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
                                ✓ Complete
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>LOP Certified</div>
                        </div>

                        <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>PRACTICAL EVAL</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
                                ✓ Passed
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>High Ropes Rig</div>
                        </div>
                    </div>

                    {/* RANK PROGRESSION LADDER */}
                    <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                                RANK PROGRESSION LADDER
                            </h4>
                            <span className="g5-chip g5-chip-upcoming">Current: {rank}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {ranksOrder.map((rName, idx) => {
                                const isCurrent = rName === rank;
                                const isPassed = currentRankIndex > idx;
                                const isLocked = currentRankIndex < idx;

                                return (
                                    <div
                                        key={rName}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '8px',
                                            background: isCurrent ? '#EFF6FF' : isPassed ? '#F0FDF4' : '#F8FAFC',
                                            border: isCurrent ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
                                            color: isCurrent ? '#1D4ED8' : isPassed ? '#166534' : '#94A3B8'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: isCurrent ? 800 : 700, fontSize: '0.85rem' }}>
                                            {isPassed ? (
                                                <CheckCircle2 size={16} color="#16A34A" />
                                            ) : isCurrent ? (
                                                <Award size={16} color="#1D4ED8" />
                                            ) : (
                                                <Lock size={15} color="#94A3B8" />
                                            )}
                                            <span>{rName}</span>
                                        </div>

                                        <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                                            {isPassed ? '✓ Complete' : isCurrent ? 'CURRENT ACTIVE' : 'Pending Evaluation'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* OVERALL READINESS PROGRESS BAR */}
                    <div style={{ background: '#F8FAFC', padding: '1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
                            <span>Overall Operational Readiness</span>
                            <span>{readinessScore}%</span>
                        </div>
                        <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${readinessScore}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #10B981)', borderRadius: '999px' }} />
                        </div>
                    </div>
                </div>

                {/* MODAL FOOTER ACTIONS */}
                <div className="g5-modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onViewAttendance?.(member);
                        }}
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                    >
                        View Attendance
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEvaluate?.(member);
                        }}
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Evaluate Skills
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onPromote?.(member);
                        }}
                        className="g5-btn-blue-solid"
                        style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 800 }}
                    >
                        Promote Rank
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberReadinessProfileModal;
