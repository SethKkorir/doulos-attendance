import { useState, useEffect } from 'react';
import {
    CreditCard, Wallet, Check, X, Search, FileSpreadsheet, Clock, Filter,
    User, Calendar, DollarSign, BarChart3, PieChart as PieIcon, TrendingUp,
    Users, AlertCircle, FileText, Download, UserMinus, ShieldCheck, Trash2,
    Plus, Clipboard, PenTool, CheckCircle, HelpCircle, Archive, ScrollText
} from 'lucide-react';
import api from '../api';

const COLORS = ['#25AAE1', '#4ade80', '#facc15', '#f87171', '#a78bfa'];

const AdminFinanceView = ({ isGuest, userRole = 'admin' }) => {
    // Map standard roles for permissions
    const normalizedRole = userRole.toLowerCase();
    const isFC = ['finance_coordinator', 'superadmin', 'developer'].includes(normalizedRole);
    const isTC = normalizedRole === 'training_coordinator';
    const isG9 = ['g9_admin', 'admin'].includes(normalizedRole);

    const [activeSection, setActiveSection] = useState('balances'); // 'balances', 'transactions', 'requests', 'assets', 'reports', 'audit'
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);

    // Data states
    const [funds, setFunds] = useState([]);
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    // Filter states
    const [txFilter, setTxFilter] = useState({ status: '', type: '', fund: '', studentRegNo: '' });

    // Modals & form states
    const [showLogModal, setShowLogModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);

    const [txForm, setTxForm] = useState({
        studentRegNo: '',
        fundId: '',
        amount: '',
        type: 'contribution',
        method: 'mpesa',
        notes: ''
    });

    const [reqForm, setReqForm] = useState({
        fundId: '',
        amount: '',
        purpose: ''
    });

    const [assetForm, setAssetForm] = useState({
        id: '',
        name: '',
        condition: 'Good',
        location: '',
        notes: ''
    });

    // Fetch initial balances & stats
    const fetchStatsAndFunds = async () => {
        try {
            const fundsRes = await api.get('/finance/funds');
            setFunds(fundsRes.data);
            const statsRes = await api.get('/finance/stats');
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch stats & funds:', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/finance/transactions', { params: txFilter });
            setTransactions(res.data);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get('/finance/requests');
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch requests:', err);
        }
    };

    const fetchAssets = async () => {
        try {
            const res = await api.get('/finance/assets');
            setAssets(res.data);
        } catch (err) {
            console.error('Failed to fetch assets:', err);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await api.get('/finance/logs');
            setAuditLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    };

    const loadSectionData = async () => {
        setLoading(true);
        await fetchStatsAndFunds();

        if (activeSection === 'transactions') await fetchTransactions();
        if (activeSection === 'requests') await fetchRequests();
        if (activeSection === 'assets') await fetchAssets();
        if (activeSection === 'audit') await fetchAuditLogs();
        if (activeSection === 'reports') {
            await fetchTransactions();
            await fetchAssets();
        }
        setLoading(false);
    };

    useEffect(() => {
        loadSectionData();
    }, [activeSection, txFilter]);

    // Handle verification/consolidation (Step 2 of two-step flow)
    const handleConsolidate = async (txId) => {
        if (!isFC) return setMsg({ type: 'error', text: 'Access Denied: Only Finance Coordinator can consolidate payments.' });
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });

        try {
            await api.patch(`/finance/transactions/consolidate/${txId}`);
            setMsg({ type: 'success', text: 'Transaction consolidated successfully!' });
            loadSectionData();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to consolidate transaction' });
        }
    };

    // Log Transaction (Step 1 of two-step flow)
    const handleLogTransaction = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });

        try {
            await api.post('/finance/transactions/log', txForm);
            setMsg({ type: 'success', text: 'Transaction recorded successfully.' });
            setShowLogModal(false);
            setTxForm({ studentRegNo: '', fundId: '', amount: '', type: 'contribution', method: 'mpesa', notes: '' });
            loadSectionData();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to record transaction' });
        }
    };

    // Submit Fund Request
    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });

        try {
            await api.post('/finance/requests/submit', reqForm);
            setMsg({ type: 'success', text: 'Fund request submitted successfully.' });
            setShowRequestModal(false);
            setReqForm({ fundId: '', amount: '', purpose: '' });
            loadSectionData();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' });
        }
    };

    // Resolve Fund Request (FC only)
    const handleResolveRequest = async (requestId, status) => {
        if (!isFC) return setMsg({ type: 'error', text: 'Access Denied: Only Finance Coordinator can resolve requests.' });
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });

        try {
            await api.patch(`/finance/requests/resolve/${requestId}`, { status });
            setMsg({ type: 'success', text: `Request successfully ${status}!` });
            loadSectionData();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to resolve request' });
        }
    };

    // Manage Asset (FC only)
    const handleSaveAsset = async (e) => {
        e.preventDefault();
        if (!isFC) return setMsg({ type: 'error', text: 'Access Denied: Only Finance Coordinator can modify assets.' });
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });

        try {
            await api.post('/finance/assets', assetForm);
            setMsg({ type: 'success', text: 'Asset saved successfully!' });
            setShowAssetModal(false);
            setAssetForm({ id: '', name: '', condition: 'Good', location: '', notes: '' });
            loadSectionData();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save asset' });
        }
    };

    const handleEditAssetClick = (asset) => {
        setAssetForm({
            id: asset._id,
            name: asset.name,
            condition: asset.condition,
            location: asset.location,
            notes: asset.notes || ''
        });
        setShowAssetModal(true);
    };

    const downloadCSV = () => {
        const headers = ['Date', 'Type', 'Fund', 'Amount', 'Member', 'Reg No', 'Method', 'Status'];
        const csvRows = transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.type.toUpperCase(),
            t.fund?.name || 'N/A',
            t.amount,
            t.member?.name || 'N/A',
            t.member?.studentRegNo || 'N/A',
            t.method,
            t.status
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Doulos_Finance_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {/* Feedback Message */}
            {msg && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: msg.type === 'success' ? '#10b981' : '#ef4444',
                    display: 'flex',
                    justifyContent: 'between',
                    alignItems: 'center'
                }}>
                    <span>{msg.text}</span>
                    <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                </div>
            )}

            {/* Sub Nav Tab Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
                <button 
                    onClick={() => setActiveSection('balances')}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: activeSection === 'balances' ? 'rgba(37,170,225,0.15)' : 'transparent', border: activeSection === 'balances' ? '1px solid rgba(37,170,225,0.3)' : 'none', color: activeSection === 'balances' ? '#25AAE1' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Fund Balances
                </button>
                <button 
                    onClick={() => setActiveSection('transactions')}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: activeSection === 'transactions' ? 'rgba(37,170,225,0.15)' : 'transparent', border: activeSection === 'transactions' ? '1px solid rgba(37,170,225,0.3)' : 'none', color: activeSection === 'transactions' ? '#25AAE1' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Transactions Ledger
                </button>
                <button 
                    onClick={() => setActiveSection('requests')}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: activeSection === 'requests' ? 'rgba(37,170,225,0.15)' : 'transparent', border: activeSection === 'requests' ? '1px solid rgba(37,170,225,0.3)' : 'none', color: activeSection === 'requests' ? '#25AAE1' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Requests
                </button>
                {!isTC && (
                    <button 
                        onClick={() => setActiveSection('assets')}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: activeSection === 'assets' ? 'rgba(37,170,225,0.15)' : 'transparent', border: activeSection === 'assets' ? '1px solid rgba(37,170,225,0.3)' : 'none', color: activeSection === 'assets' ? '#25AAE1' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Assets Inventory
                    </button>
                )}
                {!isTC && (
                    <button 
                        onClick={() => setActiveSection('reports')}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: activeSection === 'reports' ? 'rgba(37,170,225,0.15)' : 'transparent', border: activeSection === 'reports' ? '1px solid rgba(37,170,225,0.3)' : 'none', color: activeSection === 'reports' ? '#25AAE1' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        AGM Report
                    </button>
                )}
                {!isTC && !isG9 && (
                    <button 
                        onClick={() => setActiveSection('audit')}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: activeSection === 'audit' ? 'rgba(37,170,225,0.15)' : 'transparent', border: activeSection === 'audit' ? '1px solid rgba(37,170,225,0.3)' : 'none', color: activeSection === 'audit' ? '#25AAE1' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Audit Logs
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(37,170,225,0.2)', borderTopColor: '#25AAE1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
            ) : (
                <div className="tab-content" style={{ animation: 'fadeUp 0.3s ease-out' }}>
                    
                    {/* SECTION: FUND BALANCES */}
                    {activeSection === 'balances' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                {funds.map((f, i) => (
                                    <div key={f._id} style={{ background: 'rgba(9,29,46,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: COLORS[i % COLORS.length] }}></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>{f.name}</span>
                                        <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>KES {f.currentBalance.toLocaleString()}</span>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{f.description}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ background: 'rgba(9,29,46,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'white' }}>Consolidated Treasury</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Sum of all constitutional earmark funds in active rotation.</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#25AAE1' }}>KES {stats?.totalFunds?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: TRANSACTIONS LEDGER */}
                    {activeSection === 'transactions' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <select value={txFilter.type} onChange={(e) => setTxFilter({...txFilter, type: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', outline: 'none' }}>
                                        <option value="">All Types</option>
                                        <option value="contribution">Contributions</option>
                                        <option value="expense">Expenses</option>
                                    </select>
                                    <select value={txFilter.status} onChange={(e) => setTxFilter({...txFilter, status: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', outline: 'none' }}>
                                        <option value="">All Statuses</option>
                                        <option value="pending_verification">Pending Verification</option>
                                        <option value="consolidated">Consolidated</option>
                                    </select>
                                    <input type="text" placeholder="Reg No Search..." value={txFilter.studentRegNo} onChange={(e) => setTxFilter({...txFilter, studentRegNo: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <Download size={16} /> Export CSV
                                    </button>
                                    {!isG9 && (
                                        <button onClick={() => setShowLogModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#25AAE1', border: '1px solid rgba(37,170,225,0.4)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                            <Plus size={16} /> Log Entry
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Date</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Type</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Member / Details</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Fund</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Method</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Amount</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Status</th>
                                            {isFC && <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={isFC ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No transactions found matching criteria.</td>
                                            </tr>
                                        ) : (
                                            transactions.map(t => (
                                                <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: t.type === 'expense' ? 'rgba(239,68,68,0.01)' : 'transparent' }}>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 'bold', color: t.type === 'expense' ? '#f87171' : '#4ade80', textTransform: 'uppercase' }}>{t.type}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                                                        {t.member ? (
                                                            <div>
                                                                <span style={{ fontWeight: 'bold' }}>{t.member.name}</span> <br/>
                                                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.member.studentRegNo} &bull; {t.member.campus}</span>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#64748b', fontStyle: 'italic' }}>{t.notes || 'N/A'}</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{t.fund?.name || 'N/A'}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>{t.method}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>KES {t.amount.toLocaleString()}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 'bold',
                                                            textTransform: 'uppercase',
                                                            background: t.status === 'consolidated' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                                            color: t.status === 'consolidated' ? '#34d399' : '#fbbf24'
                                                        }}>{t.status === 'consolidated' ? 'Consolidated' : 'Pending Verification'}</span>
                                                    </td>
                                                    {isFC && (
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                            {t.status === 'pending_verification' && (
                                                                <button onClick={() => handleConsolidate(t._id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '0.25rem', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                                    Consolidate
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION: FUND REQUESTS */}
                    {activeSection === 'requests' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowRequestModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#25AAE1', border: '1px solid rgba(37,170,225,0.4)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                    <Plus size={16} /> Submit Fund Request
                                </button>
                            </div>

                            <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Requested On</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Fund</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Purpose</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Requested By</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Amount</th>
                                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>Status</th>
                                            {isFC && <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.length === 0 ? (
                                            <tr>
                                                <td colSpan={isFC ? 7 : 6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No requests logged yet.</td>
                                            </tr>
                                        ) : (
                                            requests.map(r => (
                                                <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{r.fund?.name || 'N/A'}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{r.purpose}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{r.requestedBy}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>KES {r.amount.toLocaleString()}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 'bold',
                                                            textTransform: 'uppercase',
                                                            background: r.status === 'approved' ? 'rgba(16,185,129,0.15)' : r.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                            color: r.status === 'approved' ? '#34d399' : r.status === 'rejected' ? '#f87171' : '#fbbf24'
                                                        }}>{r.status}</span>
                                                    </td>
                                                    {isFC && (
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                            {r.status === 'pending' && (
                                                                <>
                                                                    <button onClick={() => handleResolveRequest(r._id, 'approved')} style={{ padding: '0.3rem 0.5rem', borderRadius: '0.25rem', background: '#10b981', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                                        Approve
                                                                    </button>
                                                                    <button onClick={() => handleResolveRequest(r._id, 'rejected')} style={{ padding: '0.3rem 0.5rem', borderRadius: '0.25rem', background: '#ef4444', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION: ASSETS INVENTORY */}
                    {activeSection === 'assets' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                {isFC && (
                                    <button onClick={() => { setAssetForm({ id: '', name: '', condition: 'Good', location: '', notes: '' }); setShowAssetModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#25AAE1', border: '1px solid rgba(37,170,225,0.4)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <Plus size={16} /> Add Asset Item
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                {assets.length === 0 ? (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>No assets logged in inventory.</div>
                                ) : (
                                    assets.map(a => (
                                        <div key={a._id} style={{ background: 'rgba(9,29,46,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h4 style={{ margin: 0, color: 'white' }}>{a.name}</h4>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 'bold',
                                                    padding: '0.15rem 0.4rem',
                                                    borderRadius: '0.2rem',
                                                    textTransform: 'uppercase',
                                                    background: a.condition === 'Excellent' || a.condition === 'Good' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                                    color: a.condition === 'Excellent' || a.condition === 'Good' ? '#34d399' : '#fbbf24'
                                                }}>{a.condition}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>📍 {a.location}</p>
                                            {a.notes && <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{a.notes}</p>}
                                            {isFC && (
                                                <button onClick={() => handleEditAssetClick(a)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#25AAE1', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
                                                    Edit Details
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECTION: AGM REPORT */}
                    {activeSection === 'reports' && (
                        <div style={{ background: 'rgba(9,29,46,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: 'white' }}>Annual General Meeting (AGM) Report</h2>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Generated on {new Date().toLocaleDateString()} &bull; Doulos Financial Position Ledger</p>
                                </div>
                                <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#25AAE1', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                    <FileText size={16} /> Print Report
                                </button>
                            </div>

                            {/* Funds Summary Table */}
                            <div>
                                <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>1. Constitutional Funds Position</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '0.5rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ padding: '0.5rem 0', color: '#94a3b8' }}>Fund Name</th>
                                            <th style={{ padding: '0.5rem 0', color: '#94a3b8', textAlign: 'right' }}>Current Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {funds.map(f => (
                                            <tr key={f._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '0.5rem 0', color: '#e2e8f0' }}>{f.name}</td>
                                                <td style={{ padding: '0.5rem 0', color: 'white', fontWeight: 'bold', textAlign: 'right' }}>KES {f.currentBalance.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                                            <td style={{ padding: '0.75rem 0', color: 'white', fontWeight: 'bold' }}>Total Cash Reserves</td>
                                            <td style={{ padding: '0.75rem 0', color: '#25AAE1', fontWeight: 'bold', textAlign: 'right', fontSize: '1.2rem' }}>KES {stats?.totalFunds?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Inventory Assets Summary */}
                            <div>
                                <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>2. Equipment & Asset Ledger</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '0.5rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ padding: '0.5rem 0', color: '#94a3b8' }}>Item Name</th>
                                            <th style={{ padding: '0.5rem 0', color: '#94a3b8' }}>Condition</th>
                                            <th style={{ padding: '0.5rem 0', color: '#94a3b8' }}>Current Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assets.map(a => (
                                            <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '0.5rem 0', color: '#e2e8f0' }}>{a.name}</td>
                                                <td style={{ padding: '0.5rem 0', color: '#e2e8f0' }}>{a.condition}</td>
                                                <td style={{ padding: '0.5rem 0', color: '#e2e8f0' }}>{a.location}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION: AUDIT LOGS */}
                    {activeSection === 'audit' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>System Activity Audit Trail</h3>
                            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1rem', background: 'rgba(9,29,46,0.4)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {auditLogs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No activities logged in the audit trail.</div>
                                ) : (
                                    auditLogs.map(l => (
                                        <div key={l._id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleTimeString()} &bull; {new Date(l.createdAt).toLocaleDateString()}</span>
                                            <div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>{l.actor}</span>
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}> performed </span>
                                                <span style={{ fontSize: '0.8rem', color: '#25AAE1', fontWeight: 'bold', background: 'rgba(37,170,225,0.1)', padding: '0.15rem 0.35rem', borderRadius: '0.2rem' }}>{l.action}</span>
                                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>{l.details}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* MODAL: LOG ENTRY */}
            {showLogModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2,21,37,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#091d2e', border: '1px solid rgba(37,170,225,0.2)', borderRadius: '1.25rem', padding: '2rem', width: '90%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'white' }}>Log Contribution / Expense</h3>
                            <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
                        </div>
                        <form onSubmit={handleLogTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Type</label>
                                <select value={txForm.type} onChange={(e) => setTxForm({...txForm, type: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}>
                                    <option value="contribution">Contribution (Member Income)</option>
                                    <option value="expense">Expense (Outflow)</option>
                                </select>
                            </div>
                            {txForm.type === 'contribution' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Member Registration Number</label>
                                    <input required type="text" placeholder="e.g., 22-1234" value={txForm.studentRegNo} onChange={(e) => setTxForm({...txForm, studentRegNo: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }} />
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Constitutional Fund</label>
                                <select required value={txForm.fundId} onChange={(e) => setTxForm({...txForm, fundId: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}>
                                    <option value="">Select Target Fund</option>
                                    {funds.map(f => (
                                        <option key={f._id} value={f._id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Amount (KES)</label>
                                    <input required type="number" placeholder="100" value={txForm.amount} onChange={(e) => setTxForm({...txForm, amount: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Method</label>
                                    <select value={txForm.method} onChange={(e) => setTxForm({...txForm, method: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}>
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="cash">Cash</option>
                                        <option value="bank">Bank Deposit</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Notes / Details</label>
                                <textarea placeholder="Transaction details..." value={txForm.notes} onChange={(e) => setTxForm({...txForm, notes: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', height: '60px', resize: 'none' }}></textarea>
                            </div>
                            <button type="submit" style={{ padding: '0.75rem', background: '#25AAE1', border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>Record Transaction</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: SUBMIT FUND REQUEST */}
            {showRequestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2,21,37,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#091d2e', border: '1px solid rgba(37,170,225,0.2)', borderRadius: '1.25rem', padding: '2rem', width: '90%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'white' }}>Submit Fund Request</h3>
                            <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
                        </div>
                        <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Constitutional Target Fund</label>
                                <select required value={reqForm.fundId} onChange={(e) => setReqForm({...reqForm, fundId: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}>
                                    <option value="">Select Earmarked Fund</option>
                                    {funds.map(f => (
                                        <option key={f._id} value={f._id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Requested Amount (KES)</label>
                                <input required type="number" placeholder="e.g., 500" value={reqForm.amount} onChange={(e) => setReqForm({...reqForm, amount: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Purpose & Justification</label>
                                <textarea required placeholder="Outline why this withdrawal/allocation is needed..." value={reqForm.purpose} onChange={(e) => setReqForm({...reqForm, purpose: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', height: '80px', resize: 'none' }}></textarea>
                            </div>
                            <button type="submit" style={{ padding: '0.75rem', background: '#25AAE1', border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>Submit Request</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: MANAGE ASSET */}
            {showAssetModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2,21,37,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#091d2e', border: '1px solid rgba(37,170,225,0.2)', borderRadius: '1.25rem', padding: '2rem', width: '90%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'white' }}>{assetForm.id ? 'Edit Inventory Asset' : 'Add New Inventory Asset'}</h3>
                            <button onClick={() => setShowAssetModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
                        </div>
                        <form onSubmit={handleSaveAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Asset Description / Name</label>
                                <input required type="text" placeholder="e.g., Audio Mixer, Tent, Chairs (20x)" value={assetForm.name} onChange={(e) => setAssetForm({...assetForm, name: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Condition Status</label>
                                <select value={assetForm.condition} onChange={(e) => setAssetForm({...assetForm, condition: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}>
                                    <option value="Excellent">Excellent</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Lost">Lost or Stolen</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Current Location / Custody</label>
                                <input required type="text" placeholder="e.g., Athi River Base Room" value={assetForm.location} onChange={(e) => setAssetForm({...assetForm, location: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Notes</label>
                                <input type="text" placeholder="Serial numbers, acquisition source..." value={assetForm.notes} onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }} />
                            </div>
                            <button type="submit" style={{ padding: '0.75rem', background: '#25AAE1', border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>Save Asset Details</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminFinanceView;
