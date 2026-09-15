import React, { useState, useEffect } from 'react';
import { 
    Wallet, CheckCircle2, XCircle, Search, AlertCircle, 
    Download, Shield, TrendingUp, Check, RefreshCw
} from 'lucide-react';
import defaultApi from '../../api';

const G7TreasuryConsole = ({ api, setMsg, isGuest }) => {
    const client = api || defaultApi;
    const notify = (msg) => {
        if (typeof setMsg === 'function') setMsg(msg);
        else console.log('[G7Treasury]', msg);
    };

    const [queueData, setQueueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState(null);
    const [statementRef, setStatementRef] = useState('');

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await client.get('/council/finance/queue');
            setQueueData(res.data);
        } catch (err) {
            console.error('Error fetching treasury queue:', err);
            notify({ type: 'error', text: 'Failed to load treasury queue' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleVerifyPayment = async (id, action) => {
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        setVerifyingId(id);
        try {
            const res = await client.post(`/council/finance/verify-mpesa/${id}`, {
                action,
                matchedBankStatementRef: statementRef || undefined,
                notes: action === 'approve' ? 'Matched against till/bank statement' : 'Code mismatch'
            });
            notify({ type: action === 'approve' ? 'success' : 'warning', text: res.data.message });
            fetchQueue();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Verification failed' });
        } finally {
            setVerifyingId(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* G7 HEADER */}
            <div style={{ 
                background: '#FFFFFF', 
                border: '1px solid #EBEBF2', 
                borderRadius: '16px', 
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(75, 63, 140, 0.04)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Wallet size={18} style={{ color: '#4B3F8C' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#4B3F8C' }}>
                            G7 FINANCE & TREASURY STEWARDSHIP
                        </span>
                    </div>
                    <h3 style={{ margin: 0, color: '#1E1B39', fontWeight: 800, fontSize: '1.3rem' }}>
                        MPESA Reconciliation Queue & Semester Dues Ledger
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#7E7A9B', fontSize: '0.82rem' }}>
                        1-tap transaction matching against organization bank/till statements and dues clearance.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                        onClick={fetchQueue} 
                        style={{ 
                            background: '#F8F8FC', 
                            color: '#4A4560', 
                            border: '1px solid #D1D1DB', 
                            borderRadius: '10px', 
                            padding: '0.55rem 0.9rem', 
                            fontSize: '0.78rem', 
                            fontWeight: 700,
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem', 
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <RefreshCw size={14} />
                        <span>Refresh Queue</span>
                    </button>
                </div>
            </div>

            {/* TREASURY SUMMARY STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 800 }}>
                        TOTAL DUES COLLECTED
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981', marginTop: '0.25rem' }}>
                        KES {(queueData?.totalCollectedAmount || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', marginTop: '0.35rem' }}>
                        {queueData?.approvedCount || 0} Verified contributions
                    </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 800 }}>
                        PENDING VERIFICATION
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: (queueData?.pendingPayments || []).length > 0 ? '#D97706' : '#10b981', marginTop: '0.25rem' }}>
                        {(queueData?.pendingPayments || []).length} Submissions
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', marginTop: '0.35rem' }}>
                        Awaiting till / statement match
                    </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', textTransform: 'uppercase', fontWeight: 800 }}>
                        GEAR MAINTENANCE RESERVE
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#4B3F8C', marginTop: '0.25rem' }}>
                        KES {Math.round((queueData?.totalCollectedAmount || 0) * 0.3).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#7E7A9B', marginTop: '0.35rem' }}>
                        30% allocation for hardware requisitions
                    </div>
                </div>
            </div>

            {/* MPESA CODE VERIFICATION QUEUE (US-G7-008) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(75, 63, 140, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: 0, color: '#1E1B39', fontWeight: 800, fontSize: '1.05rem' }}>
                        Pending MPESA Confirmation Code Queue
                    </h4>
                </div>

                {(queueData?.pendingPayments || []).length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#7E7A9B', fontSize: '0.85rem' }}>
                        ✓ All student MPESA submissions have been reconciled!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {queueData.pendingPayments.map((p) => (
                            <div
                                key={p._id}
                                style={{
                                    background: '#F8F8FC',
                                    border: '1px solid #EBEBF2',
                                    borderRadius: '12px',
                                    padding: '1.1rem 1.25rem',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                                        <code style={{ background: '#F4F2FB', color: '#4B3F8C', border: '1px solid #DCD6F7', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.85rem' }}>
                                            {p.mpesaCode}
                                        </code>
                                        <span style={{ color: '#1E1B39', fontWeight: 800, fontSize: '0.92rem' }}>
                                            KES {p.amount?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#666280' }}>
                                        Student: <strong style={{ color: '#1E1B39' }}>{p.studentName || 'Student'}</strong> ({p.studentRegNo}) • Month: {p.month} {p.year}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleVerifyPayment(p._id, 'reject')}
                                        disabled={verifyingId === p._id}
                                        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Flag / Mismatch
                                    </button>
                                    <button
                                        onClick={() => handleVerifyPayment(p._id, 'approve')}
                                        disabled={verifyingId === p._id}
                                        style={{ background: '#4B3F8C', color: "#1E1B39", border: 'none', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(75, 63, 140, 0.25)' }}
                                    >
                                        {verifyingId === p._id ? 'Verifying...' : '1-Tap Match & Clear'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default G7TreasuryConsole;
