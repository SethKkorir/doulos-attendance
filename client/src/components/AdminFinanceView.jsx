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
            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 800 }}>TOTAL COLLECTED</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', color: '#4ade80' }}>Ksh {approvedTotal.toLocaleString()}</h3>
                        </div>
                        <TrendingUp size={24} style={{ opacity: 0.3 }} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 800 }}>AWAITING APPROVAL</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', color: '#fbbf24' }}>{pendingCount}</h3>
                        </div>
                        <Clock size={24} style={{ opacity: 0.3 }} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(37, 170, 225, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 800 }}>THIS MONTH'S GAIN</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', color: '#25AAE1' }}>
                                Ksh {stats?.monthlyStats?.find(m => m._id === months[new Date().getMonth()])?.total?.toLocaleString() || 0}
                            </h3>
                        </div>
                        <BarChart3 size={24} style={{ opacity: 0.3 }} />
                    </div>
                </div>
            </div>

            {/* Navigation & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '0.75rem' }}>
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
                                padding: '0.6rem 1rem', borderRadius: '0.5rem', border: 'none',
                                background: activeTab === tab.id ? 'hsl(var(--color-primary))' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--color-text-dim)',
                                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={16} /> {tab.label} {tab.count > 0 && <span style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {msg && (
                    <div style={{
                        padding: '0.5rem 1rem', borderRadius: '0.5rem',
                        background: msg.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: msg.type === 'success' ? '#4ade80' : '#f87171',
                        fontSize: '0.8rem', fontWeight: 800, animation: 'slideIn 0.3s'
                    }}>
                        {msg.text}
                    </div>
                )}
            </div>

            {/* Dynamic Content Sections */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '500px' }}>

                {/* 1. Approvals Queue */}
                {activeTab === 'approvals' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Pending Verifications</h3>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Compare codes with your Bank/M-PESA statement</p>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Submission Date</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Student Detail</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Amount & Month</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>M-PESA Code</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.length === 0 ? (
                                        <tr><td colSpan="5" style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>Queue empty. All payments are processed!</td></tr>
                                    ) : (
                                        pending.map(p => (
                                            <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 700 }}>{p.studentName}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{p.studentRegNo}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 900, color: '#4ade80' }}>Ksh {p.amount.toLocaleString()}</div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>{p.month}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <code style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', padding: '0.3rem 0.6rem', borderRadius: '4px', letterSpacing: '1px' }}>{p.mpesaCode}</code>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => handleVerify(p._id, 'approved')} className="btn" style={{ background: '#4ade80', color: 'black', padding: '0.4rem', borderRadius: '0.4rem' }} title="Approve"><Check size={18} /></button>
                                                        <button onClick={() => handleVerify(p._id, 'rejected')} className="btn" style={{ background: '#f87171', color: 'black', padding: '0.4rem', borderRadius: '0.4rem' }} title="Reject"><X size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. Full Transactions List */}
                {activeTab === 'transactions' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                <input placeholder="Search transactions..." className="input-field" style={{ paddingLeft: '3rem', width: '100%' }} value={txFilter.search} onChange={e => setTxFilter({ ...txFilter, search: e.target.value })} />
                            </div>
                            <select className="input-field" style={{ width: '150px' }} value={txFilter.month} onChange={e => setTxFilter({ ...txFilter, month: e.target.value })}>
                                <option value="">All Months</option>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select className="input-field" style={{ width: '130px' }} value={txFilter.status} onChange={e => setTxFilter({ ...txFilter, status: e.target.value })}>
                                <option value="">All Status</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="pending">Pending</option>
                            </select>
                            <button className="btn" onClick={downloadTransactionsCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1' }}>
                                <Download size={16} /> Export
                            </button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Student</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Amount</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Reference</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Status</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPayments.map(p => (
                                        <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.studentName}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{p.studentRegNo}</div>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 800 }}>Ksh {p.amount} ({p.month})</td>
                                            <td style={{ padding: '1rem' }}>
                                                <code style={{ fontSize: '0.75rem', opacity: 0.8 }}>{p.mpesaCode || 'CASH_RECEIPT'}</code>
                                                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{p.paymentMode}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                                                    background: p.status === 'approved' ? 'rgba(74, 222, 128, 0.1)' : p.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                    color: p.status === 'approved' ? '#4ade80' : p.status === 'rejected' ? '#f87171' : '#fbbf24'
                                                }}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>
                                                {new Date(p.createdAt).toLocaleDateString()}
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
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
                                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. Defaulters List */}
                {activeTab === 'defaulters' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <AlertCircle size={20} style={{ color: '#f87171' }} />
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Non-Contributors List</h3>
                            </div>
                            <select className="input-field" value={defaulterFilter.month} onChange={e => setDefaulterFilter({ ...defaulterFilter, month: e.target.value })}>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', fontSize: '0.8rem', color: '#f87171', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                                Found {defaulters.length} regular members who haven't contributed for {defaulterFilter.month}.
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <tbody>
                                    {defaulters.map((d, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{d.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{d.studentRegNo}</div>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{d.campus}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{d.memberType}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button className="btn" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={() => { setActiveTab('log-cash'); setCashData({ ...cashData, studentRegNo: d.studentRegNo, month: defaulterFilter.month }); }}>Record Payment</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. Insights / Charts */}
                {activeTab === 'insights' && (
                    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                            {/* Monthly Trend */}
                            <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <TrendingUp size={18} color="#25AAE1" /> Collection Trend (Ksh)
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.monthlyStats}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="_id" stroke="var(--color-text-dim)" fontSize={10} />
                                        <YAxis stroke="var(--color-text-dim)" fontSize={10} />
                                        <Tooltip
                                            contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#25AAE1', fontWeight: 900 }}
                                        />
                                        <Bar dataKey="total" fill="#25AAE1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Payment Modes */}
                            <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <PieIcon size={18} color="#4ade80" /> Payment Methods
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
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
                    <div style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', borderRadius: '12px' }}>
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Manual Cash Receipt</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Record a physical contribution from a student</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogCash} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Admission Number</label>
                                <input placeholder="e.g. 21-1234" className="input-field" value={cashData.studentRegNo} onChange={e => setCashData({ ...cashData, studentRegNo: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Month</label>
                                    <select className="input-field" value={cashData.month} onChange={e => setCashData({ ...cashData, month: e.target.value })}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Amount Cash (Ksh)</label>
                                    <input type="number" placeholder="200" className="input-field" value={cashData.amount} onChange={e => setCashData({ ...cashData, amount: e.target.value })} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ height: '50px', fontWeight: 900, marginTop: '1rem' }}>
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
