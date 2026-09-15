import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, CheckCircle2, ArrowRight, X, AlertTriangle, 
    Layers, DollarSign, Check, Plus, RefreshCw
} from 'lucide-react';
import defaultApi from '../../api';

const RequisitionPipelineModal = ({ isOpen, onClose, api, setMsg, isGuest, userRole, defaultGearSerial }) => {
    const client = api || defaultApi;
    const notify = (msg) => {
        if (typeof setMsg === 'function') setMsg(msg);
        else console.log('[Requisition]', msg);
    };

    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [actingId, setActingId] = useState(null);

    const [newForm, setNewForm] = useState({
        title: '',
        description: '',
        itemType: 'Gear Replacement',
        urgency: 'High',
        estimatedCost: '',
        affectedGearSerial: defaultGearSerial || '',
        damagePhotoUrls: [],
        campus: 'Freedom Base'
    });

    const fetchRequisitions = async () => {
        setLoading(true);
        try {
            const res = await client.get('/council/requisitions');
            setRequisitions(res.data);
        } catch (err) {
            console.error('Error fetching requisitions:', err);
            notify({ type: 'error', text: 'Failed to load requisition pipeline' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRequisitions();
            if (defaultGearSerial) {
                setNewForm(prev => ({ ...prev, affectedGearSerial: defaultGearSerial }));
                setShowNewForm(true);
            }
        }
    }, [isOpen, defaultGearSerial]);

    const handleCreateRequisition = async (e) => {
        e.preventDefault();
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        try {
            const res = await client.post('/council/requisitions', newForm);
            notify({ type: 'success', text: res.data.message });
            setShowNewForm(false);
            fetchRequisitions();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to initiate requisition' });
        }
    };

    const handleAdvanceStage = async (id, stage, action = 'approve', extraData = {}) => {
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        setActingId(id);
        try {
            const res = await client.post(`/council/requisitions/${id}/advance`, {
                stage,
                action,
                ...extraData
            });
            notify({ type: 'success', text: res.data.message });
            fetchRequisitions();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to update requisition' });
        } finally {
            setActingId(null);
        }
    };

    if (!isOpen) return null;

    return (
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
                borderRadius: '20px', 
                maxWidth: '820px', 
                width: '100%', 
                maxHeight: '90vh', 
                overflowY: 'auto', 
                padding: '2rem',
                boxShadow: '0 24px 60px rgba(46, 42, 77, 0.18)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <ShieldAlert size={18} style={{ color: '#4B3F8C' }} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4B3F8C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                MULTI-TIER LIFECYCLE (US-REQ-015)
                            </span>
                        </div>
                        <h3 style={{ margin: 0, color: '#1E1B39', fontWeight: 800, fontSize: '1.35rem' }}>
                            Equipment Requisition & Disposal Pipeline
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ background: '#F4F2FB', border: 'none', color: '#6B6882', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* 4-Stage Stepper Explanation */}
                <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span style={{ color: '#4B3F8C' }}>1. G8 Initiated</span>
                    <ArrowRight size={14} style={{ color: '#B0ADC5' }} />
                    <span style={{ color: '#6D28D9' }}>2. G5 Life-Safety Verification</span>
                    <ArrowRight size={14} style={{ color: '#B0ADC5' }} />
                    <span style={{ color: '#B45309' }}>3. G7 Budget Clearance</span>
                    <ArrowRight size={14} style={{ color: '#B0ADC5' }} />
                    <span style={{ color: '#15803D' }}>4. G1 Executive Approval</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#1E1B39', fontWeight: 800, fontSize: '1.05rem' }}>
                        Active Requisition Pipeline ({requisitions.length})
                    </h4>
                    <button
                        onClick={() => setShowNewForm(!showNewForm)}
                        style={{ 
                            background: '#4B3F8C', 
                            color: "#1E1B39", 
                            fontWeight: 700, 
                            fontSize: '0.78rem', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '8px', 
                            border: 'none', 
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(75, 63, 140, 0.25)'
                        }}
                    >
                        {showNewForm ? 'View List' : '+ Initiate Requisition (G8)'}
                    </button>
                </div>

                {showNewForm ? (
                    <form onSubmit={handleCreateRequisition} style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#4B3F8C', fontWeight: 800 }}>Stage 1: Initiate Requisition (G8 Assets Lead)</h4>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>REQUISITION TITLE</label>
                            <input
                                type="text"
                                placeholder="e.g. Replace Worn Dynamic Lead Rope (Fraying at 15m)"
                                value={newForm.title}
                                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                                style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem 0.75rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>ITEM TYPE</label>
                                <select
                                    value={newForm.itemType}
                                    onChange={(e) => setNewForm({ ...newForm, itemType: e.target.value })}
                                    style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem 0.75rem', borderRadius: '8px' }}
                                >
                                    <option value="Gear Replacement">Gear Replacement</option>
                                    <option value="Safety Hardware">Safety Hardware</option>
                                    <option value="Base Maintenance">Base Maintenance</option>
                                    <option value="Medical Supplies">Medical Supplies</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>URGENCY</label>
                                <select
                                    value={newForm.urgency}
                                    onChange={(e) => setNewForm({ ...newForm, urgency: e.target.value })}
                                    style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem 0.75rem', borderRadius: '8px' }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Life-Safety Critical">Life-Safety Critical</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>ESTIMATED COST (KES)</label>
                                <input
                                    type="number"
                                    placeholder="25000"
                                    value={newForm.estimatedCost}
                                    onChange={(e) => setNewForm({ ...newForm, estimatedCost: e.target.value })}
                                    style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem 0.75rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#666280', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>AFFECTED GEAR SERIAL (IF DECOMMISSIONING)</label>
                            <input
                                type="text"
                                placeholder="ROPE-2026-001"
                                value={newForm.affectedGearSerial}
                                onChange={(e) => setNewForm({ ...newForm, affectedGearSerial: e.target.value })}
                                style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D1DB', color: '#1E1B39', padding: '0.6rem 0.75rem', borderRadius: '8px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button type="button" onClick={() => setShowNewForm(false)} style={{ background: '#FFFFFF', color: '#4A4560', border: '1px solid #D1D1DB', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button type="submit" style={{ background: '#4B3F8C', color: "#1E1B39", fontWeight: 700, border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(75, 63, 140, 0.25)' }}>Forward to G5 Safety</button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {requisitions.map((reqItem) => (
                            <div key={reqItem._id} style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                            <span style={{ 
                                                background: reqItem.urgency === 'Life-Safety Critical' ? '#FEF2F2' : '#FEF3C7',
                                                color: reqItem.urgency === 'Life-Safety Critical' ? '#DC2626' : '#D97706',
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                padding: '0.15rem 0.45rem',
                                                borderRadius: '4px'
                                            }}>
                                                {reqItem.urgency}
                                            </span>
                                            <span style={{ color: '#4B3F8C', fontWeight: 800, fontSize: '0.85rem' }}>
                                                KES {reqItem.estimatedCost?.toLocaleString()}
                                            </span>
                                        </div>
                                        <h5 style={{ margin: 0, color: '#1E1B39', fontWeight: 800, fontSize: '1rem' }}>
                                            {reqItem.title}
                                        </h5>
                                    </div>
                                    <span style={{ background: '#FFFFFF', color: '#4B3F8C', border: '1px solid #DCD6F7', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                                        {reqItem.status}
                                    </span>
                                </div>

                                {/* Active Stage Action Button depending on current status */}
                                <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #EBEBF2', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    {reqItem.status === 'Pending G5 Safety' && (
                                        <button
                                            onClick={() => handleAdvanceStage(reqItem._id, 'g5_safety', 'approve', { mandatoryDecommission: true })}
                                            disabled={actingId === reqItem._id}
                                            style={{ background: '#7C3AED', color: "#1E1B39", fontWeight: 700, fontSize: '0.75rem', padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                                        >
                                            {actingId === reqItem._id ? 'Verifying...' : 'Sign G5 Life-Safety Verification'}
                                        </button>
                                    )}

                                    {reqItem.status === 'Pending G7 Budget' && (
                                        <button
                                            onClick={() => handleAdvanceStage(reqItem._id, 'g7_budget', 'approve', { disbursementCode: `DISB-${Date.now().toString().slice(-5)}` })}
                                            disabled={actingId === reqItem._id}
                                            style={{ background: '#D97706', color: "#1E1B39", fontWeight: 700, fontSize: '0.75rem', padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                                        >
                                            {actingId === reqItem._id ? 'Clearing...' : 'Clear G7 Budget & Assign Code'}
                                        </button>
                                    )}

                                    {reqItem.status === 'Pending G1 Approval' && (
                                        <button
                                            onClick={() => handleAdvanceStage(reqItem._id, 'g1_executive', 'approve')}
                                            disabled={actingId === reqItem._id}
                                            style={{ background: '#15803D', color: "#1E1B39", fontWeight: 700, fontSize: '0.75rem', padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                                        >
                                            {actingId === reqItem._id ? 'Approving...' : 'Grant G1 Final Executive Sign-Off'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequisitionPipelineModal;
