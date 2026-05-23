import { useState, useEffect } from 'react';
import {
    CreditCard, Wallet, Check, X, Search, FileSpreadsheet, Clock, Filter,
    User, Calendar, DollarSign, BarChart3, PieChart as PieIcon, TrendingUp,
    Users, AlertCircle, FileText, Download, UserMinus, ShieldCheck, Trash2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import api from '../api';

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const COLORS = ['#25AAE1', '#4ade80', '#facc15', '#f87171', '#a78bfa'];

const AdminFinanceView = ({ isGuest }) => {
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('approvals'); // 'approvals', 'transactions', 'defaulters', 'insights', 'log-cash'
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);

    // Approvals State
    const [pending, setPending] = useState([]);

    // Transactions State
    const [allPayments, setAllPayments] = useState([]);
    const [txFilter, setTxFilter] = useState({ status: '', month: '', year: new Date().getFullYear(), search: '' });

    // Defaulters State
    const [defaulters, setDefaulters] = useState([]);
    const [defaulterFilter, setDefaulterFilter] = useState({ month: months[new Date().getMonth()], year: new Date().getFullYear() });

    // Cash Log state
    const [cashData, setCashData] = useState({
        studentRegNo: '',
        amount: '',
        month: months[new Date().getMonth()],
        year: new Date().getFullYear()
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            if (isGuest) {
                // Mock data for guest
                setStats({
                    overall: [
                        { _id: 'approved', total: 15400, count: 45 },
                        { _id: 'pending', total: 2200, count: 5 },
                        { _id: 'rejected', total: 500, count: 2 }
                    ],
                    modeStats: [
                        { _id: 'MPESA', total: 12000, count: 30 },
                        { _id: 'Cash', total: 3400, count: 15 }
                    ],
                    monthlyStats: [
                        { _id: 'January', total: 7200 },
                        { _id: 'February', total: 8200 }
                    ]
                });
                setPending([
                    { _id: '1', studentName: 'John Doe', studentRegNo: '22-0001', amount: 100, mpesaCode: 'SGH45XCV12', month: 'February', createdAt: new Date() }
                ]);
            } else {
                const [statsRes, pendingRes] = await Promise.all([
                    api.get('/payments/stats'),
                    api.get('/payments/pending')
                ]);
                setStats(statsRes.data);
                setPending(pendingRes.data);
            }
        } catch (err) {
            console.error('Failed to fetch finance data', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTransactions = async () => {
        if (isGuest) return;
        try {
            const { data } = await api.get('/payments/all', { params: txFilter });
            setAllPayments(data);
        } catch (err) {
            console.error('Failed to fetch transactions');
        }
    };

    const fetchDefaulters = async () => {
        if (isGuest) return;
        try {
            const { data } = await api.get('/payments/defaulters', { params: defaulterFilter });
            setDefaulters(data);
        } catch (err) {
            console.error('Failed to fetch defaulters');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'transactions') fetchAllTransactions();
        if (activeTab === 'defaulters') fetchDefaulters();
    }, [activeTab, txFilter, defaulterFilter]);

    const handleVerify = async (id, status) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        let rejectionReason = '';
        if (status === 'rejected') {
            rejectionReason = window.prompt("Reason for rejection:") || "Invalid details";
            if (rejectionReason === null) return;
        }
        try {
            await api.patch(`/payments/verify/${id}`, { status, rejectionReason });
            setMsg({ type: 'success', text: `Payment ${status}!` });
            fetchData();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to verify payment' });
        }
    };

    const handleLogCash = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        try {
            await api.post('/payments/log-cash', cashData);
            setMsg({ type: 'success', text: 'Cash payment recorded!' });
            setCashData({ ...cashData, studentRegNo: '' });
            fetchData();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to log cash' });
        }
    };

    const downloadTransactionsCSV = () => {
        const headers = ['Date', 'Student', 'Reg No', 'Amount', 'Month', 'Code', 'Status'];
        const rows = allPayments.map(p => [
            new Date(p.createdAt).toLocaleDateString(),
            p.studentName,
            p.studentRegNo,
            p.amount,
            p.month,
            p.mpesaCode || 'CASH',
            p.status
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (!stats && loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Syncing Finance Cloud...</div>;

    const approvedTotal = stats?.overall?.find(o => o._id === 'approved')?.total || 0;
    const pendingCount = stats?.overall?.find(o => o._id === 'pending')?.count || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', animation: 'fadeIn 0.4s' }}>

            {/* Summary Cards */}
            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #4ade80', background: '#0d111b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>TOTAL COLLECTED</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.6rem', color: '#4ade80', fontWeight: 900 }}>Ksh {approvedTotal.toLocaleString()}</h3>
                        </div>
                        <div style={{ padding: '0.6rem', background: 'rgba(74,222,128,0.08)', borderRadius: '0.5rem', border: '1px solid rgba(74,222,128,0.15)' }}>
                            <TrendingUp size={20} color="#4ade80" />
                        </div>
                    </div>
                </div>
                <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #fbbf24', background: '#0d111b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>AWAITING APPROVAL</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.6rem', color: '#fbbf24', fontWeight: 900 }}>{pendingCount}</h3>
                        </div>
                        <div style={{ padding: '0.6rem', background: 'rgba(251,191,36,0.08)', borderRadius: '0.5rem', border: '1px solid rgba(251,191,36,0.15)' }}>
                            <Clock size={20} color="#fbbf24" />
                        </div>
                    </div>
                </div>
                <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #25AAE1', background: '#0d111b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>THIS MONTH'S GAIN</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.6rem', color: '#25AAE1', fontWeight: 900 }}>
                                Ksh {stats?.monthlyStats?.find(m => m._id === months[new Date().getMonth()])?.total?.toLocaleString() || 0}
                            </h3>
                        </div>
                        <div style={{ padding: '0.6rem', background: 'rgba(37, 170, 225, 0.08)', borderRadius: '0.5rem', border: '1px solid rgba(37, 170, 225, 0.15)' }}>
                            <BarChart3 size={20} color="#25AAE1" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '0.75rem', flexWrap: 'wrap' }}>
                    {[
                        { id: 'approvals', label: 'Approvals', icon: ShieldCheck, count: pending.length },
                        { id: 'transactions', label: 'Transactions', icon: FileText },
                        { id: 'defaulters', label: 'Defaulters', icon: AlertCircle },
                        { id: 'insights', label: 'Insights', icon: PieIcon },
                        { id: 'log-cash', label: 'Record Cash', icon: Wallet }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                background: activeTab === tab.id ? 'rgba(37, 170, 225, 0.12)' : 'transparent',
                                color: activeTab === tab.id ? '#25AAE1' : 'rgba(255,255,255,0.4)',
                                border: activeTab === tab.id ? '1px solid rgba(37, 170, 225, 0.2)' : '1px solid transparent',
                                fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={15} /> {tab.label} {tab.count > 0 && <span style={{ background: 'rgba(37, 170, 225, 0.2)', color: '#25AAE1', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {msg && (
                    <div style={{
                        padding: '0.5rem 1.25rem', borderRadius: '0.6rem',
                        background: msg.type === 'success' ? 'rgba(74, 222, 128, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        color: msg.type === 'success' ? '#4ade80' : '#f87171',
                        border: `1px solid ${msg.type === 'success' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                        fontSize: '0.8rem', fontWeight: 800, animation: 'slideIn 0.3s'
                    }}>
                        {msg.text}
                    </div>
                )}
            </div>

            {/* Dynamic Content Sections */}
            <div className="glass-card-premium" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d111b', padding: '2rem !important' }}>

                {/* 1. Approvals Queue */}
                {activeTab === 'approvals' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>Pending Verifications</h3>
                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Compare codes with your Bank/M-PESA statement</p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {pending.length === 0 ? (
                                <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Queue empty. All payments are processed!</div>
                            ) : (
                                pending.map(p => (
                                    <div key={p._id} className="glass-panel" style={{ padding: '1.25rem', background: '#090c14', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(37, 170, 225, 0.1)', border: '1px solid rgba(37, 170, 225, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#25AAE1', fontSize: '0.85rem' }}>
                                                    {p.studentName?.charAt(0)?.toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{p.studentName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{p.studentRegNo}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#4ade80' }}>Ksh {p.amount.toLocaleString()}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{p.month} Contribution</div>
                                        </div>
                                        <div>
                                            <code style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', padding: '0.35rem 0.75rem', borderRadius: '8px', letterSpacing: '1px', fontSize: '0.8rem', fontWeight: 800, border: '1px solid rgba(37, 170, 225, 0.15)' }}>{p.mpesaCode}</code>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleVerify(p._id, 'approved')} className="btn btn-primary" style={{ background: 'rgba(74, 222, 128, 0.12) !important', color: '#4ade80 !important', border: '1px solid rgba(74, 222, 128, 0.25) !important', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', boxShadow: 'none !important', cursor: 'pointer' }} title="Approve"><Check size={16} /></button>
                                            <button onClick={() => handleVerify(p._id, 'rejected')} className="btn" style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', cursor: 'pointer' }} title="Reject"><X size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Full Transactions List */}
                {activeTab === 'transactions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.25rem', marginBottom: '0.5rem' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                <input placeholder="Search transactions..." className="modern-input" style={{ paddingLeft: '3rem', width: '100%', border: '1px solid rgba(255,255,255,0.05)' }} value={txFilter.search} onChange={e => setTxFilter({ ...txFilter, search: e.target.value })} />
                            </div>
                            <select className="modern-input" style={{ width: '150px', border: '1px solid rgba(255,255,255,0.05)' }} value={txFilter.month} onChange={e => setTxFilter({ ...txFilter, month: e.target.value })}>
                                <option value="">All Months</option>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select className="modern-input" style={{ width: '130px', border: '1px solid rgba(255,255,255,0.05)' }} value={txFilter.status} onChange={e => setTxFilter({ ...txFilter, status: e.target.value })}>
                                <option value="">All Status</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="pending">Pending</option>
                            </select>
                            <button className="btn" onClick={downloadTransactionsCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 170, 225, 0.08)', color: '#25AAE1', borderColor: 'rgba(37, 170, 225, 0.15)' }}>
                                <Download size={15} /> Export Cumulative
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {allPayments.length === 0 ? (
                                <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No transactions matching search found.</div>
                            ) : (
                                allPayments.map(p => (
                                    <div key={p._id} className="glass-panel" style={{ padding: '1.25rem', background: '#090c14', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{p.studentName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{p.studentRegNo}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, color: '#4ade80', fontSize: '1.05rem' }}>Ksh {p.amount}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{p.month} Contribution</div>
                                        </div>
                                        <div>
                                            <code style={{ fontSize: '0.75rem', color: '#25AAE1', background: 'rgba(37, 170, 225, 0.05)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(37, 170, 225, 0.1)', letterSpacing: '0.5px' }}>{p.mpesaCode || 'CASH_RECEIPT'}</code>
                                            <div style={{ fontSize: '0.62rem', opacity: 0.5, marginTop: '0.2rem', textTransform: 'uppercase', fontWeight: 700 }}>{p.paymentMode}</div>
                                        </div>
                                        <div>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                                                background: p.status === 'approved' ? 'rgba(74, 222, 128, 0.08)' : p.status === 'rejected' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                                                color: p.status === 'approved' ? '#4ade80' : p.status === 'rejected' ? '#f87171' : '#fbbf24',
                                                border: `1px solid ${p.status === 'approved' ? 'rgba(74, 222, 128, 0.15)' : p.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)'}`
                                            }}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this transaction record?')) {
                                                        api.delete(`/payments/${p._id}`)
                                                            .then(() => {
                                                                setMsg({ type: 'success', text: 'Transaction deleted' });
                                                                fetchAllTransactions();
                                                                fetchData();
                                                            })
                                                            .catch(() => setMsg({ type: 'error', text: 'Failed to delete' }));
                                                    }
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}
                                                title="Delete Record"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Defaulters List */}
                {activeTab === 'defaulters' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem', marginBottom: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <AlertCircle size={20} style={{ color: '#f87171' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white' }}>Non-Contributors List</h3>
                                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Found {defaulters.length} regular members who haven't contributed for the selected month.</p>
                                </div>
                            </div>
                            <select className="modern-input" style={{ width: '160px', border: '1px solid rgba(255,255,255,0.05)' }} value={defaulterFilter.month} onChange={e => setDefaulterFilter({ ...defaulterFilter, month: e.target.value })}>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {defaulters.length === 0 ? (
                                <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Perfect! No non-contributors found for this period.</div>
                            ) : (
                                defaulters.map((d, i) => (
                                    <div key={i} className="glass-panel" style={{ padding: '1.25rem', background: '#090c14', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{d.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{d.studentRegNo}</div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{d.campus}</div>
                                        <div>
                                            <span style={{ fontSize: '0.7rem', padding: '4px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>{d.memberType}</span>
                                        </div>
                                        <div>
                                            <button className="btn" style={{ fontSize: '0.75rem', padding: '0.45rem 1rem', background: 'rgba(37, 170, 225, 0.08)', color: '#25AAE1', borderColor: 'rgba(37, 170, 225, 0.15)', fontWeight: 800 }} onClick={() => { setActiveTab('log-cash'); setCashData({ ...cashData, studentRegNo: d.studentRegNo, month: defaulterFilter.month }); }}>Record Payment</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 4. Insights / Charts */}
                {activeTab === 'insights' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>Financial Analytics</h3>
                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Visual breakdowns of community contribution streams and monthly collections</p>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

                            {/* Monthly Trend */}
                            <div className="glass-panel" style={{ padding: '1.5rem', height: '350px', background: '#090c14', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>
                                    <TrendingUp size={18} color="#25AAE1" /> COLLECTION TREND (KSH)
                                </h4>
                                <ResponsiveContainer width="100%" height="80%">
                                    <BarChart data={stats?.monthlyStats}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="_id" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                                        <Tooltip
                                            contentStyle={{ background: '#0d111b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#25AAE1', fontWeight: 900 }}
                                        />
                                        <Bar dataKey="total" fill="#25AAE1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Payment Modes */}
                            <div className="glass-panel" style={{ padding: '1.5rem', height: '350px', background: '#090c14', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>
                                    <PieIcon size={18} color="#4ade80" /> PAYMENT METHODS
                                </h4>
                                <ResponsiveContainer width="100%" height="80%">
                                    <PieChart>
                                        <Pie
                                            data={stats?.modeStats}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="total"
                                            nameKey="_id"
                                        >
                                            {stats?.modeStats?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                        </div>
                    </div>
                )}

                {/* 5. Record Cash Form */}
                {activeTab === 'log-cash' && (
                    <div style={{ padding: '2rem', maxWidth: '500px', width: '100%', margin: '0 auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(74, 222, 128, 0.08)', color: '#4ade80', borderRadius: '12px', border: '1px solid rgba(74, 222, 128, 0.15)' }}>
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Manual Cash Receipt</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Record a physical contribution from a student</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogCash} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group-premium">
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Admission Number</label>
                                <input placeholder="e.g. 21-1234" className="modern-input" style={{ width: '100%' }} value={cashData.studentRegNo} onChange={e => setCashData({ ...cashData, studentRegNo: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Month</label>
                                    <select className="modern-input" style={{ width: '100%' }} value={cashData.month} onChange={e => setCashData({ ...cashData, month: e.target.value })}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Amount Cash (Ksh)</label>
                                    <input type="number" placeholder="200" className="modern-input" style={{ width: '100%' }} value={cashData.amount} onChange={e => setCashData({ ...cashData, amount: e.target.value })} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ height: '50px', fontWeight: 800, marginTop: '1rem', width: '100%' }}>
                                CONFIRM CASH PAYMENT
                            </button>
                        </form>
                    </div>
                )}

            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>
        </div>
    );
};

export default AdminFinanceView;
