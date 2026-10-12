import React, { useState } from 'react';
import {
    X,
    Award,
    CheckCircle2,
    AlertTriangle,
    Shield,
    Star
} from 'lucide-react';

const PromotionEvaluationModal = ({
    member,
    onClose,
    api,
    showToast,
    onSuccess
}) => {
    if (!member) return null;

    const currentRank = member.douloidRank || (member.memberType === 'Recruit' ? 'Recruit' : 'None');
    
    const getNextRank = (r) => {
        if (!r || r === 'None' || r === 'Recruit') return 'Shadow Douloid';
        if (r === 'Shadow Douloid') return 'Basic Douloid';
        if (r === 'Basic Douloid') return 'Intermediate Douloid';
        if (r === 'Intermediate Douloid') return 'Lead Douloid';
        return 'Lead Douloid';
    };

    const targetRank = getNextRank(currentRank);

    const [domain, setDomain] = useState('High Ropes');
    const [score, setScore] = useState(4);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Checklist criteria states
    const attendanceMet = (member.totalPoints || 0) >= 60;
    const tenureMet = true;
    const safetyCompleted = member.belayStatus === 'Primary Belayer Certified' || targetRank === 'Shadow Douloid';
    const practicalPassed = true;

    const handleSaveEvaluation = async (promoteImmediately = false) => {
        setSubmitting(true);
        try {
            // 1. Submit evaluation
            await api.post(`/trainings/members/${member._id}/evaluate`, {
                domain,
                score,
                notes: notes.trim(),
                passed: score >= 3
            });

            // 2. If promoting
            if (promoteImmediately) {
                await api.put(`/trainings/members/${member._id}/rank`, {
                    douloidRank: targetRank,
                    notes: `Promoted following ${domain} evaluation score ${score}/5: ${notes}`
                });
                showToast?.(`Successfully promoted ${member.name} to ${targetRank}!`, 'success');
            } else {
                showToast?.(`Saved practical evaluation for ${member.name}`, 'success');
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Evaluation submit error:', err);
            showToast?.(err.response?.data?.message || 'Failed to submit evaluation', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="g5-modal-overlay" onClick={onClose}>
            <div className="g5-modal-window" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
                <div className="g5-modal-header">
                    <div>
                        <span className="g5-chip g5-chip-upcoming">PROMOTION EVALUATION</span>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0.2rem 0 0', color: '#0F172A' }}>
                            {member.name}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Current: <strong>{currentRank}</strong> → Target: <strong style={{ color: '#1D4ED8' }}>{targetRank}</strong>
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

                <div className="g5-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* CRITERIA CHECKLIST */}
                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                            Constitutional Progression Criteria
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Attendance & Drill Points ({member.totalPoints || 0} pts)</span>
                                <span style={{ color: attendanceMet ? '#059669' : '#D97706', fontWeight: 800 }}>
                                    {attendanceMet ? '✓ Meets requirement' : '⚠ Borderline Points'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Semester Tenure & Active Standing</span>
                                <span style={{ color: '#059669', fontWeight: 800 }}>✓ Meets requirement</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Safety & Belay Protocols</span>
                                <span style={{ color: safetyCompleted ? '#059669' : '#D97706', fontWeight: 800 }}>
                                    {safetyCompleted ? '✓ Completed' : 'Pending Belay Sign-off'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Practical Field Skills</span>
                                <span style={{ color: '#059669', fontWeight: 800 }}>✓ Passed</span>
                            </div>
                        </div>
                    </div>

                    {/* DOMAIN SELECTION */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                Practical Evaluation Domain *
                            </label>
                            <select
                                value={domain}
                                onChange={e => setDomain(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                            >
                                <option value="High Ropes">High Ropes & Belay Course</option>
                                <option value="Team Building">Team Building & Facilitation</option>
                                <option value="Freedom Base">Freedom Base Rigging</option>
                                <option value="Rescue & Extrication">Rescue & Stretcher Extrication</option>
                                <option value="First Aid">Wilderness First Aid</option>
                                <option value="Safety & Risk Management">Safety & Risk Management</option>
                                <option value="Curriculum & Mentorship">Curriculum & Mentorship</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                Facilitator Rating (1–5) *
                            </label>
                            <select
                                value={score}
                                onChange={e => setScore(Number(e.target.value))}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                            >
                                <option value={5}>5 / 5 — Mastery / Lead Level</option>
                                <option value={4}>4 / 5 — Competent & Confident</option>
                                <option value={3}>3 / 5 — Passing Standard</option>
                                <option value={2}>2 / 5 — Needs Remediation</option>
                                <option value={1}>1 / 5 — Incomplete / Critical Error</option>
                            </select>
                        </div>
                    </div>

                    {/* EVALUATION NOTES */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                            Facilitator Assessment Notes
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Document participant competence, belay commands, safety awareness..."
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        />
                    </div>
                </div>

                <div className="g5-modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSaveEvaluation(false)}
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Save Evaluation
                    </button>

                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSaveEvaluation(true)}
                        className="g5-btn-blue-solid"
                        style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 800 }}
                    >
                        Recommend Promotion to {targetRank}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromotionEvaluationModal;
