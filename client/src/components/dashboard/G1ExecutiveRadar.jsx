import React, { useState, useEffect } from 'react';
import { 
    Activity, ShieldAlert, Award, RefreshCw, CheckCircle2, 
    AlertTriangle, ArrowRight, RotateCcw, FileText, Check, 
    X, Layers, Landmark, Users, Clock, Compass
} from 'lucide-react';
import defaultApi from '../../api';

const G1ExecutiveRadar = ({ api, setMsg, isGuest, userRole }) => {
    const client = api || defaultApi;
    const notify = (msg) => {
        if (typeof setMsg === 'function') setMsg(msg);
        else console.log('[G1Radar]', msg);
    };

    const [radar, setRadar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actingRequisitionId, setActingRequisitionId] = useState(null);
    
    // Rollover Modal States
    const [showRolloverModal, setShowRolloverModal] = useState(false);
    const [rolloverForm, setRolloverForm] = useState({
        fromSemester: 'MAY-AUG 2026',
        toSemester: 'SEP-DEC 2026',
        spiritualTheme: 'Anchored in Competence, Formed in Faith',
        anchorScripture: 'Colossians 3:23-24'
    });
    const [rolloverLoading, setRolloverLoading] = useState(false);
    const [rollbackLoading, setRollbackLoading] = useState(false);

    const fetchRadar = async () => {
        setLoading(true);
        try {
            const res = await client.get('/council/executive-radar');
            setRadar(res.data);
        } catch (err) {
            console.error('Error fetching executive radar:', err);
            notify({ type: 'error', text: 'Failed to load executive radar data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRadar();
    }, []);

    const handleApproveRequisition = async (id) => {
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        setActingRequisitionId(id);
        try {
            const res = await client.post(`/council/requisitions/${id}/advance`, {
                stage: 'g1_executive',
                action: 'approve',
                notes: 'Approved by G1 Executive Coordinator'
            });
            notify({ type: 'success', text: res.data.message });
            fetchRadar();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to approve requisition' });
        } finally {
            setActingRequisitionId(null);
        }
    };

    const handleRejectRequisition = async (id) => {
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        const reason = prompt('Please enter justification for rejecting this requisition:');
        if (!reason) return;

        setActingRequisitionId(id);
        try {
            const res = await client.post(`/council/requisitions/${id}/advance`, {
                stage: 'g1_executive',
                action: 'reject',
                rejectionReason: reason
            });
            notify({ type: 'warning', text: res.data.message });
            fetchRadar();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to reject requisition' });
        } finally {
            setActingRequisitionId(null);
        }
    };

    const handleExecuteRollover = async (e) => {
        e.preventDefault();
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        if (!confirm(`Confirm 5-Step Semester Rollover to ${rolloverForm.toSemester}? This will snapshot data, batch-graduate eligible recruits, and mint a new Master QR code.`)) return;

        setRolloverLoading(true);
        try {
            const res = await client.post('/council/rollover/execute', rolloverForm);
            notify({ type: 'success', text: res.data.message });
            setShowRolloverModal(false);
            fetchRadar();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Semester rollover failed' });
        } finally {
            setRolloverLoading(false);
        }
    };

    const handleRollback = async () => {
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        if (!confirm('CRITICAL ACTION: Are you sure you want to trigger the 1-Click Rollback? This will restore the database to the pre-rollover snapshot.')) return;

        setRollbackLoading(true);
        try {
            const res = await client.post('/council/rollover/rollback');
            notify({ type: 'success', text: res.data.message });
            fetchRadar();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Rollback failed' });
        } finally {
            setRollbackLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#7E7A9B' }}>
                <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '3px solid #EBEBF2', borderTopColor: '#4B3F8C', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '1rem', fontWeight: 700 }}>Synchronizing G1/G2 Executive Command Center...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* HERO EXECUTIVE BANNER */}
            <div style={{ 
                background: '#FFFFFF', 
                border: '1px solid #EBEBF2', 
                borderRadius: '20px', 
                padding: '1.75rem',
                boxShadow: '0 4px 16px rgba(75, 63, 140, 0.04)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.25rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <div style={{ background: '#FEF3C7', color: '#D97706', padding: '0.35rem', borderRadius: '8px', display: 'flex' }}>
                            <Landmark size={20} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#B45309' }}>
                            EXECUTIVE COMMAND CENTER (G1 & G2)
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#7E7A9B', fontWeight: 700 }}>
                            • GLOBAL GOVERNANCE RADAR
                        </span>
                    </div>
                    <h2 style={{ margin: 0, color: '#1E1B39', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                        Cross-Campus Alignment & Executive Governance
                    </h2>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#7E7A9B', fontSize: '0.85rem' }}>
                        Overseeing Athi River & Valley Road ministry operations, 4-tier requisitions, and semester lifecycles.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowRolloverModal(true)}
                        style={{
                            background: '#4B3F8C',
                            color: "#1E1B39",
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '10px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(75, 63, 140, 0.25)'
                        }}
                    >
                        <RefreshCw size={16} />
                        <span>Semester Rollover Wizard</span>
                    </button>

                    {radar?.rollbackAvailable && (
                        <button
                            onClick={handleRollback}
                            disabled={rollbackLoading}
                            style={{
                                background: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                padding: '0.6rem 1.1rem',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                cursor: 'pointer'
                            }}
                        >
                            <RotateCcw size={16} />
                            <span>{rollbackLoading ? 'Restoring...' : 'Rollback Rollover'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* CROSS-CAMPUS HEALTH ALIGNMENT (ATHI RIVER VS VALLEY ROAD) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Athi River Campus */}
                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(75, 63, 140, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4B3F8C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ATHI RIVER CAMPUS (FREEDOM BASE)
                        </span>
                        <Compass size={18} style={{ color: '#4B3F8C' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: '#F8F8FC', padding: '1rem', borderRadius: '12px', border: '1px solid #EBEBF2' }}>
                            <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 700 }}>
                                Active Cadres
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E1B39', marginTop: '0.2rem' }}>
                                {radar?.campuses?.athiRiver?.activeMembers || 0}
                            </div>
                        </div>
                        <div style={{ background: '#F8F8FC', padding: '1rem', borderRadius: '12px', border: '1px solid #EBEBF2' }}>
                            <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 700 }}>
                                Recruits Pipeline
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D97706', marginTop: '0.2rem' }}>
                                {radar?.campuses?.athiRiver?.recruitsInPipeline || 0}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#666280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                        <span>High ropes & base camp facilities nominal</span>
                    </div>
                </div>

                {/* Valley Road Campus */}
                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(75, 63, 140, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            VALLEY ROAD CAMPUS (CITY CADRES)
                        </span>
                        <Users size={18} style={{ color: '#6D28D9' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: '#F8F8FC', padding: '1rem', borderRadius: '12px', border: '1px solid #EBEBF2' }}>
                            <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 700 }}>
                                Active Cadres
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E1B39', marginTop: '0.2rem' }}>
                                {radar?.campuses?.valleyRoad?.activeMembers || 0}
                            </div>
                        </div>
                        <div style={{ background: '#F8F8FC', padding: '1rem', borderRadius: '12px', border: '1px solid #EBEBF2' }}>
                            <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 700 }}>
                                Recruits Pipeline
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D97706', marginTop: '0.2rem' }}>
                                {radar?.campuses?.valleyRoad?.recruitsInPipeline || 0}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#666280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                        <span>Urban chapters & transport pipeline active</span>
                    </div>
                </div>
            </div>

            {/* CRITICAL OPERATIONAL ALERTS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 800 }}>
                        GEAR RETIREMENT ALERTS
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: radar?.gearLoad?.alertsCount > 0 ? '#DC2626' : '#10b981', marginTop: '0.25rem' }}>
                        {radar?.gearLoad?.alertsCount || 0} Assets
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#7E7A9B', marginTop: '0.35rem' }}>
                        Requires inspection / decommissioning
                    </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 800 }}>
                        UNVERIFIED MPESA DUES
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#D97706', marginTop: '0.25rem' }}>
                        {radar?.treasury?.unverifiedMpesaCount || 0} Transactions
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#7E7A9B', marginTop: '0.35rem' }}>
                        Pending G7 Treasury matching
                    </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 800 }}>
                        OPEN SAFETY INVESTIGATIONS
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: radar?.safety?.openIncidentsCount > 0 ? '#DC2626' : '#10b981', marginTop: '0.25rem' }}>
                        {radar?.safety?.openIncidentsCount || 0} Open
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#7E7A9B', marginTop: '0.35rem' }}>
                        Root-cause action plans active
                    </div>
                </div>
            </div>

            {/* PENDING G1 EXECUTIVE REQUISITIONS (US-REQ-015 FINAL STAGE) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(75, 63, 140, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: '#1E1B39', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={18} style={{ color: '#4B3F8C' }} />
                            Pending Executive Requisition Approvals (Stage 4 of 4)
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: '#7E7A9B', fontSize: '0.8rem' }}>
                            Equipment purchases cleared by G5 Safety & G7 Budget awaiting final G1 executive sign-off.
                        </p>
                    </div>
                    <span style={{ fontSize: '0.78rem', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>
                        {(radar?.pendingRequisitions || []).length} Pending Sign-Off
                    </span>
                </div>

                {(radar?.pendingRequisitions || []).length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#7E7A9B', fontSize: '0.88rem' }}>
                        ✓ All requisitions cleared. No pending executive approvals.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {radar.pendingRequisitions.map((reqItem) => (
                            <div
                                key={reqItem._id}
                                style={{
                                    background: '#F8F8FC',
                                    border: '1px solid #EBEBF2',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{ flex: 1, minWidth: '260px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{ 
                                            background: reqItem.urgency === 'Life-Safety Critical' ? '#FEF2F2' : '#FEF3C7',
                                            color: reqItem.urgency === 'Life-Safety Critical' ? '#DC2626' : '#D97706',
                                            fontSize: '0.68rem',
                                            fontWeight: 800,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {reqItem.urgency}
                                        </span>
                                        <span style={{ color: '#7E7A9B', fontSize: '0.75rem' }}>
                                            {reqItem.itemType} • Ref: {reqItem.affectedGearSerial || 'Facility'}
                                        </span>
                                    </div>
                                    <div style={{ color: '#1E1B39', fontWeight: 800, fontSize: '0.98rem' }}>
                                        {reqItem.title}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#666280', marginTop: '0.2rem' }}>
                                        Est. Cost: <strong style={{ color: '#4B3F8C' }}>KES {reqItem.estimatedCost?.toLocaleString()}</strong> • 
                                        G7 Disbursement Code: <code style={{ color: '#6D28D9', background: '#F4F2FB', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{reqItem.budgetClearance?.disbursementCode}</code>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <button
                                        onClick={() => handleRejectRequisition(reqItem._id)}
                                        disabled={actingRequisitionId === reqItem._id}
                                        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApproveRequisition(reqItem._id)}
                                        disabled={actingRequisitionId === reqItem._id}
                                        style={{ background: '#4B3F8C', color: "#1E1B39", border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(75, 63, 140, 0.25)' }}
                                    >
                                        {actingRequisitionId === reqItem._id ? 'Authorizing...' : 'Approve & Decommission'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL: 5-STEP SEMESTER ROLLOVER WIZARD (US-ROL-012) */}
            {showRolloverModal && (
                <div style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    background: 'rgba(46, 42, 77, 0.45)', 
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    zIndex: 9999, 
                    padding: '1rem' 
                }}>
                    <div style={{ 
                        background: '#FFFFFF', 
                        border: '1px solid #EBEBF2', 
                        borderRadius: '18px', 
                        maxWidth: '580px', 
                        width: '100%', 
                        padding: '2rem',
                        boxShadow: '0 24px 60px rgba(46, 42, 77, 0.18)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#4B3F8C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    CONSTITUTIONAL LIFECYCLE
                                </span>
                                <h3 style={{ margin: '0.2rem 0 0 0', color: '#1E1B39', fontWeight: 800, fontSize: '1.25rem' }}>
                                    5-Step Semester Rollover Wizard
                                </h3>
                            </div>
                            <button onClick={() => setShowRolloverModal(false)} style={{ background: '#F4F2FB', border: 'none', color: '#6B6882', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#4A4560', lineHeight: 1.45 }}>
                            <strong style={{ color: '#1E1B39' }}>Automated Pipeline Stages:</strong><br />
                            1. Creates atomic cloud snapshot of current state.<br />
                            2. Batch-promotes recruits with 8+ meetings to <strong>Shadow Douloid</strong>.<br />
                            3. Cleanses active attendance streaks & dues state (lifetime transcripts untouched).<br />
                            4. Mints new cryptographically signed Master QR token for physical printing.
                        </div>

                        <form onSubmit={handleExecuteRollover} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                                        CURRENT SEMESTER
                                    </label>
                                    <input
                                        type="text"
                                        value={rolloverForm.fromSemester}
                                        onChange={(e) => setRolloverForm({ ...rolloverForm, fromSemester: e.target.value })}
                                        style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                                        NEW TARGET SEMESTER
                                    </label>
                                    <input
                                        type="text"
                                        value={rolloverForm.toSemester}
                                        onChange={(e) => setRolloverForm({ ...rolloverForm, toSemester: e.target.value })}
                                        style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                                    NEW SEMESTER SPIRITUAL THEME
                                </label>
                                <input
                                    type="text"
                                    value={rolloverForm.spiritualTheme}
                                    onChange={(e) => setRolloverForm({ ...rolloverForm, spiritualTheme: e.target.value })}
                                    style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                                    ANCHOR SCRIPTURE VERSE
                                </label>
                                <input
                                    type="text"
                                    value={rolloverForm.anchorScripture}
                                    onChange={(e) => setRolloverForm({ ...rolloverForm, anchorScripture: e.target.value })}
                                    style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowRolloverModal(false)}
                                    style={{ background: '#FFFFFF', color: '#4A4560', border: '1px solid #D1D1DB', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={rolloverLoading}
                                    style={{ background: '#4B3F8C', color: "#1E1B39", fontWeight: 700, border: 'none', borderRadius: '8px', padding: '0.6rem 1.3rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(75, 63, 140, 0.25)' }}
                                >
                                    {rolloverLoading ? 'Executing 5-Step Pipeline...' : 'Commit Semester Rollover'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G1ExecutiveRadar;
