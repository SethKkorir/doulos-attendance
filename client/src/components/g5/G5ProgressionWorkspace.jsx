import React, { useState } from 'react';
import {
    Award,
    GraduationCap,
    Users,
    CheckCircle2,
    Search,
    ChevronRight,
    ArrowUpRight,
    Archive,
    RotateCcw,
    Sparkles,
    Shield,
    CheckSquare,
    Square
} from 'lucide-react';

const G5ProgressionWorkspace = ({
    recruits = [],
    archivedRecruits = [],
    cadres = [],
    promotionCandidates = [],
    graduationQueue = [],
    onSelectMemberProfile,
    onEvaluateMember,
    onPromoteMember,
    onBatchPromote,
    onGraduateRecruits,
    onArchiveRecruit,
    onRestoreRecruit
}) => {
    const [subTab, setSubTab] = useState('pipeline'); // 'pipeline' (Recruit Graduation), 'ranks' (Rank Progression)
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // Pipeline Stats
    const eligibleRecruits = recruits.filter(r => (r.totalPoints || 0) >= 80);
    const readyRecruits = recruits.filter(r => (r.totalPoints || 0) >= 100);

    const shadowToBasic = cadres.filter(c => c.douloidRank === 'Shadow Douloid' && (c.totalPoints || 0) >= 60);
    const basicToIntermediate = cadres.filter(c => c.douloidRank === 'Basic Douloid' && (c.totalPoints || 0) >= 90);
    const intermediateToLead = cadres.filter(c => c.douloidRank === 'Intermediate Douloid' && (c.totalPoints || 0) >= 120);

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = (items) => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(i => i._id));
        }
    };

    return (
        <div className="g5-progression-workspace">
            {/* WORKSPACE HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                        Member Progression & Cadre Pipelines
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                        Recruit graduation pipeline, Douloid competency evaluation, and rank promotions
                    </p>
                </div>
            </div>

            {/* TOP DUAL PIPELINES METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                {/* RECRUIT PIPELINE */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #BFDBFE', padding: '1.25rem', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1D4ED8', fontSize: '0.88rem' }}>
                            <GraduationCap size={18} /> RECRUIT GRADUATION PIPELINE
                        </div>
                        <span className="g5-chip g5-chip-upcoming">{recruits.length} Enrolled</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                        <div style={{ background: '#F8FAFC', padding: '0.65rem 0.2rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>NEW</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A' }}>
                                {recruits.filter(r => (r.totalPoints || 0) < 40).length}
                            </div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '0.65rem 0.2rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>IN DRILL</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A' }}>
                                {recruits.filter(r => (r.totalPoints || 0) >= 40 && (r.totalPoints || 0) < 80).length}
                            </div>
                        </div>
                        <div style={{ background: '#EFF6FF', padding: '0.65rem 0.2rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1D4ED8' }}>ELIGIBLE</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1D4ED8' }}>
                                {eligibleRecruits.length}
                            </div>
                        </div>
                        <div style={{ background: '#ECFDF5', padding: '0.65rem 0.2rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669' }}>READY</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                                {readyRecruits.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RANK PROGRESSION PIPELINE */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
                            <Award size={18} color="#D97706" /> RANK PROMOTION PIPELINE
                        </div>
                        <span className="g5-chip g5-chip-attention">Review Active</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                        <div style={{ background: '#F8FAFC', padding: '0.65rem 0.2rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>SHADOW → BASIC</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A' }}>
                                {shadowToBasic.length} pending
                            </div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '0.65rem 0.2rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>BASIC → INTERM</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A' }}>
                                {basicToIntermediate.length} pending
                            </div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '0.65rem 0.2rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>INTERM → LEAD</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A' }}>
                                {intermediateToLead.length} pending
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SUBTABS */}
            <div className="g5-subtab-bar">
                <button
                    className={`g5-subtab-btn ${subTab === 'pipeline' ? 'active' : ''}`}
                    onClick={() => setSubTab('pipeline')}
                >
                    <GraduationCap size={15} /> Recruit Pipeline & Graduation ({recruits.length})
                </button>
                <button
                    className={`g5-subtab-btn ${subTab === 'ranks' ? 'active' : ''}`}
                    onClick={() => setSubTab('ranks')}
                >
                    <Award size={15} /> Douloid Rank Promotions & Evaluation ({cadres.length})
                </button>
            </div>

            {/* SUBTAB 1: RECRUIT PIPELINE & GRADUATION */}
            {subTab === 'pipeline' && (
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                                Recruits Enrolled in Current Semester
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                                Pick recruits to graduate into Shadow Douloid rank
                            </p>
                        </div>

                        {selectedIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onGraduateRecruits?.(selectedIds)}
                                className="g5-btn-blue-solid"
                                style={{ padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.84rem' }}
                            >
                                <GraduationCap size={16} /> Graduate {selectedIds.length} Selected Recruits
                            </button>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '0.75rem 0.5rem', width: '30px' }}>
                                        <button
                                            type="button"
                                            onClick={() => toggleSelectAll(recruits)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            {selectedIds.length === recruits.length && recruits.length > 0 ? (
                                                <CheckSquare size={16} color="#1D4ED8" />
                                            ) : (
                                                <Square size={16} color="#94A3B8" />
                                            )}
                                        </button>
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Recruit Candidate</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Campus</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Points / Drills</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Eligibility Status</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recruits.map(r => {
                                    const isSelected = selectedIds.includes(r._id);
                                    const pts = r.totalPoints || 0;
                                    const isEligible = pts >= 80;

                                    return (
                                        <tr key={r._id} style={{ borderBottom: '1px solid #F1F5F9', background: isSelected ? '#EFF6FF' : 'transparent' }}>
                                            <td style={{ padding: '0.85rem 0.5rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSelect(r._id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                >
                                                    {isSelected ? <CheckSquare size={16} color="#1D4ED8" /> : <Square size={16} color="#CBD5E1" />}
                                                </button>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                                                {r.name}
                                                <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>
                                                    {r.studentRegNo || 'N/A'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                                                {r.campus || 'Athi River'}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <span style={{ fontWeight: 800, color: pts >= 80 ? '#059669' : '#1D4ED8' }}>
                                                    {pts} pts
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <span className={`g5-chip ${isEligible ? 'g5-chip-ready' : 'g5-chip-draft'}`}>
                                                    {isEligible ? 'ELIGIBLE' : 'IN TRAINING'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => onSelectMemberProfile?.(r)}
                                                        style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0.4rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        Profile
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onEvaluateMember?.(r)}
                                                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.4rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        Evaluate
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SUBTAB 2: RANK PROMOTION & EVALUATION */}
            {subTab === 'ranks' && (
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                                Douloid Rank Advancement Ladder
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                                Shadow Douloid → Basic Douloid → Intermediate Douloid → Lead Douloid
                            </p>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>Douloid</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Current Rank</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Campus</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Belay Clearance</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Readiness Score</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadres.filter(c => c.douloidRank && c.douloidRank !== 'None').map(c => {
                                    const readiness = Math.min(100, Math.round((c.totalPoints || 40) * 0.8));

                                    return (
                                        <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                                                {c.name}
                                                <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>
                                                    {c.studentRegNo || 'N/A'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <span className="g5-chip g5-chip-upcoming">
                                                    {c.douloidRank}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                                                {c.campus || 'Athi River'}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <span className={`g5-chip ${c.belayStatus === 'Primary Belayer Certified' ? 'g5-chip-active' : 'g5-chip-draft'}`}>
                                                    {c.belayStatus === 'Primary Belayer Certified' ? '✓ Primary Belayer' : 'Secondary / Spotter'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '60px', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${readiness}%`, height: '100%', background: '#3B82F6', borderRadius: '999px' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{readiness}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => onSelectMemberProfile?.(c)}
                                                        style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0.4rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        Profile
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onEvaluateMember?.(c)}
                                                        className="g5-btn-blue-solid"
                                                        style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}
                                                    >
                                                        Evaluate & Promote
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G5ProgressionWorkspace;
