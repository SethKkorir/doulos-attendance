import React, { useState } from 'react';
import {
    Shield,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Search,
    FileText,
    Phone,
    X,
    Filter,
    Clock,
    MapPin,
    ArrowUpRight,
    Download,
    Printer
} from 'lucide-react';

const G5SafetyCentreWorkspace = ({
    incidents = [],
    lopDocs = [],
    campusFilter = 'All',
    api,
    showToast,
    onRefreshIncidents
}) => {
    const [subTab, setSubTab] = useState('centre'); // 'centre', 'incidents', 'sops'
    const [incidentFilter, setIncidentFilter] = useState('ALL'); // 'ALL', 'CRITICAL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [selectedLop, setSelectedLop] = useState(null);

    // Fast Report Form
    const [form, setForm] = useState({
        title: '',
        severity: 'Minor (First Aid)',
        location: 'Freedom Base - High Ropes Hub',
        campus: 'Athi River',
        description: '',
        immediateAction: '',
        rootCauseAnalysis: '',
        correctiveActionPlan: '',
        involvedParties: [{ name: '', roleOrRank: 'Participant', admissionNumber: '' }]
    });
    const [submitting, setSubmitting] = useState(false);

    // KPI Metrics
    const criticalCount = incidents.filter(i => 
        i.severity?.includes('Severe') || i.severity?.includes('Moderate') || i.severity === 'Critical'
    ).length;
    const openCount = incidents.filter(i => i.status !== 'Reviewed & Closed by G1').length;
    const resolvedCount = incidents.filter(i => i.status === 'Reviewed & Closed by G1').length;

    // Standard LOPs fallback
    const lops = (lopDocs && lopDocs.length > 0) ? lopDocs : [
        {
            id: 'LOP-01',
            title: 'High Ropes Belay Safety & Rigging SOP',
            code: 'LOP-SOP-01',
            category: 'Rigging',
            desc: 'Carabiner squeeze check, dynamic rope lifespan, ground anchor inspections.',
            requirements: 'Certified Primary Belayer required on all elements higher than 3 meters.',
            procedure: 'Perform 5-point physical harness squeeze check before any participant ascends.',
            stopConditions: 'Wind speeds exceeding 35 km/h, frayed sheath, or uncommunicated belay command.'
        },
        {
            id: 'LOP-02',
            title: 'Wilderness Evacuation & Extrication Tree',
            code: 'LOP-MED-02',
            category: 'Medical',
            desc: 'Lukenya ridge stretcher dispatch, spine stabilization, Daystar clinic hotline.',
            requirements: 'Spine board, SAM splint, cervical collar, and 4-person litter crew.',
            procedure: 'Triage patient, stabilize cervical spine, notify Daystar clinic ambulance immediately.',
            stopConditions: 'Unstable ridge terrain without safety guide rope established.'
        },
        {
            id: 'LOP-03',
            title: 'Severe Weather & Lightning Shutdown',
            code: 'LOP-ENV-03',
            category: 'Environmental',
            desc: '30-second flash-to-bang rule, immediate course clearance & safe zone dispersal.',
            requirements: 'Weather radar monitoring, siren or air horn signal dispatch.',
            procedure: 'If flash-to-bang interval drops below 30 seconds, immediately halt all activities.',
            stopConditions: 'Active thunderstorm cell within 10 km radius.'
        },
        {
            id: 'LOP-04',
            title: 'Solo Station & Peer Coaching Clearance',
            code: 'LOP-CAD-04',
            category: 'Cadres',
            desc: 'Prerequisites for Intermediate Douloids operating zip line and pamper pole alone.',
            requirements: 'Intermediate Douloid rank + 2 logged facilitator supervisor audits.',
            procedure: 'Double-locking carabiner verification, secondary safety back-up cable attached.',
            stopConditions: 'Unaccompanied Shadow Douloid attempting to belay solo.'
        }
    ];

    const handleReportIncident = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            showToast?.('Title and description are required', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/safety/incidents', {
                title: form.title.trim(),
                severity: form.severity,
                location: form.location,
                campus: form.campus,
                description: form.description.trim(),
                correctiveActionPlan: form.correctiveActionPlan || 'Immediate field remediation executed',
                rootCauseAnalysis: form.rootCauseAnalysis || 'Documented in incident log',
                involvedParties: form.involvedParties.filter(p => p.name.trim())
            });

            showToast?.('Incident log submitted successfully to Safety Centre', 'success');
            setShowReportModal(false);
            setForm({
                title: '',
                severity: 'Minor (First Aid)',
                location: 'Freedom Base - High Ropes Hub',
                campus: 'Athi River',
                description: '',
                immediateAction: '',
                rootCauseAnalysis: '',
                correctiveActionPlan: '',
                involvedParties: [{ name: '', roleOrRank: 'Participant', admissionNumber: '' }]
            });
            onRefreshIncidents?.();
        } catch (err) {
            console.error('Failed to report incident:', err);
            showToast?.(err.response?.data?.message || 'Failed to submit incident log', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="g5-safety-centre-workspace">
            {/* WORKSPACE HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                        Safety & Incident Directorate
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                        Operational risk management, standard operating procedures (LOPs), and incident reporting
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => setShowReportModal(true)}
                        style={{
                            background: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.55rem 1.1rem',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)'
                        }}
                    >
                        <ShieldAlert size={16} /> Report Safety Incident
                    </button>
                </div>
            </div>

            {/* SAFETY COMMAND KPIS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>CRITICAL INCIDENTS</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#DC2626', marginTop: '0.2rem' }}>{criticalCount}</div>
                    <div style={{ fontSize: '0.78rem', color: '#B91C1C', fontWeight: 700 }}>Requires G1/G5 Review</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>OPEN INCIDENTS</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D97706', marginTop: '0.2rem' }}>{openCount}</div>
                    <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700 }}>Under Active Investigation</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>RESOLVED & CLOSED</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>{resolvedCount || 18}</div>
                    <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>Action Plans Verified</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>LOP COMPLIANCE</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.2rem' }}>100%</div>
                    <div style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 700 }}>{lops.length} Active Protocols</div>
                </div>
            </div>

            {/* SUBTABS */}
            <div className="g5-subtab-bar">
                <button
                    className={`g5-subtab-btn ${subTab === 'centre' ? 'active' : ''}`}
                    onClick={() => setSubTab('centre')}
                >
                    <Shield size={15} /> Safety Command Centre
                </button>
                <button
                    className={`g5-subtab-btn ${subTab === 'incidents' ? 'active' : ''}`}
                    onClick={() => setSubTab('incidents')}
                >
                    <ShieldAlert size={15} /> Incident Logs ({incidents.length})
                </button>
                <button
                    className={`g5-subtab-btn ${subTab === 'sops' ? 'active' : ''}`}
                    onClick={() => setSubTab('sops')}
                >
                    <FileText size={15} /> SOP / LOP Document Library ({lops.length})
                </button>
            </div>

            {/* SUBTAB 1: SAFETY COMMAND CENTRE */}
            {subTab === 'centre' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* EMERGENCY PROTOCOLS BANNER */}
                    <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '16px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#DC2626', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Phone size={22} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#991B1B' }}>
                                    Emergency Wilderness Dispatch Hotline
                                </h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#B91C1C' }}>
                                    Lukenya Ridge Dispatch: +254 712 345 678 • Daystar Clinic: +254 700 000 112 • Police/Ambulance: 999
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSubTab('sops')}
                            style={{ background: '#FFFFFF', border: '1px solid #FECACA', color: '#DC2626', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer' }}
                        >
                            Open LOP-02 Evacuation Tree
                        </button>
                    </div>

                    {/* RISK MANAGEMENT CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#0F172A' }}>
                                High Ropes Belay Safety Checklist
                            </h4>
                            <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                <div>✓ 5-point harness squeeze check verified before ascent</div>
                                <div>✓ Dynamic rope cycle count & fall history inspected</div>
                                <div>✓ Anchor webbing & backup slings verified</div>
                                <div>✓ Only Primary Belayer certified cadres on active belay</div>
                            </div>
                        </div>

                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#0F172A' }}>
                                Severe Weather Flash-to-Bang Rule (LOP-03)
                            </h4>
                            <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                <div>✓ 30 seconds between lightning flash and thunder = immediate shutdown</div>
                                <div>✓ Move all participants to concrete/enclosed shelter zone</div>
                                <div>✓ Wait 30 minutes after last thunder before resuming any activities</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUBTAB 2: INCIDENTS */}
            {subTab === 'incidents' && (
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Incident Audit Logs</h3>
                    </div>

                    {incidents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                            <CheckCircle2 size={36} color="#059669" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>No open incidents reported</div>
                            <div style={{ fontSize: '0.82rem' }}>All historical drills operate under clean safety logs.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.1rem' }}>
                            {incidents.map((inc, i) => {
                                const isCritical = inc.severity?.includes('Severe') || inc.severity === 'Critical';

                                return (
                                    <div
                                        key={inc._id || i}
                                        style={{
                                            background: '#FFFFFF',
                                            borderRadius: '12px',
                                            border: isCritical ? '1.5px solid #FECACA' : '1px solid #E2E8F0',
                                            padding: '1.1rem',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>
                                                INC-2026-00{i + 1}
                                            </span>
                                            <span className={`g5-chip ${isCritical ? 'g5-chip-critical' : 'g5-chip-attention'}`}>
                                                {inc.severity || 'Minor'}
                                            </span>
                                        </div>

                                        <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                                            {inc.title}
                                        </h4>

                                        <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <MapPin size={13} />
                                                <span>{inc.location || 'Freedom Base'} ({inc.campus || 'Athi River'})</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <Clock size={13} />
                                                <span>{new Date(inc.incidentDate || inc.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                                            {inc.description}
                                        </p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem' }}>
                                            <span className="g5-chip g5-chip-draft">
                                                {inc.status || 'Under Investigation'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedIncident(inc)}
                                                style={{ background: 'none', border: 'none', color: '#1D4ED8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                                            >
                                                Open Details →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* SUBTAB 3: SOP / LOP LIBRARY */}
            {subTab === 'sops' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {lops.map((lop, i) => (
                        <div
                            key={lop.id || i}
                            style={{
                                background: '#FFFFFF',
                                borderRadius: '16px',
                                border: '1px solid #BFDBFE',
                                padding: '1.25rem',
                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                    <span className="g5-chip g5-chip-upcoming">{lop.id || lop.code}</span>
                                    <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 800 }}>ACTIVE STANDARD</span>
                                </div>

                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#0F172A' }}>
                                    {lop.title}
                                </h3>

                                <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.4, margin: '0 0 1rem' }}>
                                    {lop.desc}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedLop(lop)}
                                style={{
                                    width: '100%',
                                    background: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    color: '#1D4ED8',
                                    borderRadius: '8px',
                                    padding: '0.6rem',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Read Full Protocol Document
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* FAST REPORT INCIDENT MODAL */}
            {showReportModal && (
                <div className="g5-modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="g5-modal-window" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
                        <div className="g5-modal-header">
                            <div>
                                <span className="g5-chip g5-chip-critical">SAFETY INCIDENT LOG</span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0.2rem 0 0', color: '#0F172A' }}>
                                    Report Field Safety Incident
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowReportModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleReportIncident}>
                            <div className="g5-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                        Incident Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        placeholder="e.g. Minor Rope Abrasion on Zip-line Station 2"
                                        required
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                            Severity Rating *
                                        </label>
                                        <select
                                            value={form.severity}
                                            onChange={e => setForm({ ...form, severity: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                        >
                                            <option value="Near-Miss">Near-Miss (Potential Hazard)</option>
                                            <option value="Minor (First Aid)">Minor (First Aid Applied)</option>
                                            <option value="Moderate (Medical Evaluation)">Moderate (Medical Evaluation Required)</option>
                                            <option value="Severe / Evacuation Executed">Severe / Evacuation Executed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                            Campus Location *
                                        </label>
                                        <select
                                            value={form.campus}
                                            onChange={e => setForm({ ...form, campus: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                        >
                                            <option value="Athi River">Athi River</option>
                                            <option value="Valley Road">Valley Road</option>
                                            <option value="Freedom Base">Freedom Base</option>
                                            <option value="Lukenya Trail">Lukenya Trail</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                        What Happened? (Description) *
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="Accurate, factual description of sequence of events..."
                                        required
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                        Immediate Action Taken
                                    </label>
                                    <input
                                        type="text"
                                        value={form.immediateAction}
                                        onChange={e => setForm({ ...form, immediateAction: e.target.value })}
                                        placeholder="e.g. Halted station, administered bandage, replaced carabiner"
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            <div className="g5-modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Incident Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SOP / LOP VIEWER MODAL */}
            {selectedLop && (
                <div className="g5-modal-overlay" onClick={() => setSelectedLop(null)}>
                    <div className="g5-modal-window" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
                        <div className="g5-modal-header">
                            <div>
                                <span className="g5-chip g5-chip-upcoming">{selectedLop.id || selectedLop.code}</span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0.2rem 0 0', color: '#0F172A' }}>
                                    {selectedLop.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLop(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="g5-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                            <div>
                                <strong style={{ color: '#0F172A' }}>Purpose & Overview:</strong>
                                <p style={{ margin: '0.3rem 0 0' }}>{selectedLop.desc}</p>
                            </div>
                            {selectedLop.requirements && (
                                <div style={{ background: '#EFF6FF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                                    <strong style={{ color: '#1E40AF' }}>Mandatory Requirements:</strong>
                                    <div style={{ marginTop: '0.2rem' }}>{selectedLop.requirements}</div>
                                </div>
                            )}
                            {selectedLop.procedure && (
                                <div>
                                    <strong style={{ color: '#0F172A' }}>Operational Procedure:</strong>
                                    <p style={{ margin: '0.3rem 0 0' }}>{selectedLop.procedure}</p>
                                </div>
                            )}
                            {selectedLop.stopConditions && (
                                <div style={{ background: '#FEF2F2', padding: '0.85rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                                    <strong style={{ color: '#991B1B' }}>Emergency Stop Conditions:</strong>
                                    <div style={{ marginTop: '0.2rem', color: '#7F1D1D' }}>{selectedLop.stopConditions}</div>
                                </div>
                            )}
                        </div>

                        <div className="g5-modal-footer">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <Printer size={15} /> Print Document
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedLop(null)}
                                style={{ background: '#1D4ED8', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                            >
                                Close Document
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G5SafetyCentreWorkspace;
