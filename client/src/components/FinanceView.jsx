import { useState, useEffect } from 'react';
import { CreditCard, Wallet, History, FileText, CheckCircle, Clock, XCircle, Sparkles, Send, Copy, ExternalLink } from 'lucide-react';
import api from '../api';

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const FinanceView = ({ regNo, memberName }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        mpesaCode: '',
        amount: '',
        month: months[new Date().getMonth()],
        fullMessage: ''
    });

    const fetchPayments = async () => {
        try {
            const res = await api.get(`/payments/student/${regNo}`);
            setPayments(res.data);
        } catch (err) {
            console.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [regNo]);

    const handlePaste = (e) => {
        const text = e.clipboardData.getData('text');
        if (!text) return;

        // MPESA extraction logic
        const codeRegex = /\b([A-Z0-9]{10})\b/;
        const amountRegex = /Ksh\s?([\d,]+(\.\d{2})?)/i;

        const codeMatch = text.match(codeRegex);
        const amountMatch = text.match(amountRegex);

        if (codeMatch || amountMatch) {
            setFormData(prev => ({
                ...prev,
                mpesaCode: codeMatch ? codeMatch[1].toUpperCase() : prev.mpesaCode,
                amount: amountMatch ? amountMatch[1].replace(/,/g, '') : prev.amount,
                fullMessage: text
            }));

            // Visual feedback
            const feedback = document.getElementById('paste-feedback');
            if (feedback) {
                feedback.innerText = "✨ Details extracted!";
                setTimeout(() => feedback.innerText = "", 3000);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post('/payments/submit', {
                ...formData,
                studentRegNo: regNo
            });
            setSuccess(`Payment for ${formData.month} submitted! Awaiting approval.`);
            setFormData({
                mpesaCode: '',
                amount: '',
                month: months[new Date().getMonth()],
                fullMessage: ''
            });
            fetchPayments();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit payment");
        } finally {
            setSubmitting(false);
        }
    };

    const getMonthStatus = (monthName) => {
        const p = payments.find(p => p.month === monthName && p.year === new Date().getFullYear());
        if (!p) return { status: 'unpaid', data: null };
        return { status: p.status, data: p };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>

            {/* Monthly Progress Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {months.map((month) => {
                    const { status, data } = getMonthStatus(month);
                    const isCurrent = month === months[new Date().getMonth()];

                    return (
                        <div
                            key={month}
                            onClick={() => status === 'approved' && setSelectedReceipt(data)}
                            className="glass-panel"
                            style={{
                                padding: '1.25rem',
                                textAlign: 'center',
                                border: isCurrent ? '1px solid hsl(var(--color-primary) / 0.5)' : '1px solid rgba(255,255,255,0.05)',
                                background: status === 'approved' ? '#064e3b' :
                                    status === 'pending' ? '#78350f' :
                                        '#1e293b',
                                cursor: status === 'approved' ? 'pointer' : 'default',
                                position: 'relative',
                                transition: 'transform 0.2s',
                                transform: status === 'approved' ? 'scale(1)' : 'scale(0.98)',
                                opacity: status === 'unpaid' ? 0.6 : 1
                            }}
                        >
                            {isCurrent && (
                                <div style={{
                                    position: 'absolute', top: '-8px', right: '10px',
                                    background: 'hsl(var(--color-primary))', fontSize: '0.6rem',
                                    fontWeight: 900, padding: '2px 8px', borderRadius: '10px'
                                }}>CURRENT</div>
                            )}

                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800 }}>{month}</h4>

                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                {status === 'approved' ? (
                                    <div style={{ color: '#4ade80' }}><CheckCircle size={28} /></div>
                                ) : status === 'pending' ? (
                                    <div style={{ color: '#fbbf24' }}><Clock size={28} className="animate-pulse" /></div>
                                ) : status === 'rejected' ? (
                                    <div style={{ color: '#f87171' }}><XCircle size={28} /></div>
                                ) : (
                                    <div style={{ color: 'rgba(255,255,255,0.1)' }}><History size={28} /></div>
                                )}
                            </div>

                            <div style={{
                                fontSize: '0.65rem', fontWeight: 900,
                                color: status === 'approved' ? '#4ade80' :
                                    status === 'pending' ? '#fbbf24' :
                                        status === 'rejected' ? '#f87171' : 'var(--color-text-dim)',
                                textTransform: 'uppercase'
                            }}>
                                {status === 'approved' ? 'PAID' : status === 'pending' ? 'PENDING' : status === 'rejected' ? 'REJECTED' : 'UNPAID'}
                            </div>

                            {status === 'approved' && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Click for Receipt</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Submission Form */}
            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', borderRadius: '8px' }}>
                        <Wallet size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>SUBMIT CONTRIBUTION</h3>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="finance-form">
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                            Paste MPESA Message (Optional - Auto extracts code/amount)
                        </label>
                        <textarea
                            placeholder="Paste your MPESA confirmation message here..."
                            onPaste={handlePaste}
                            value={formData.fullMessage}
                            onChange={(e) => setFormData({ ...formData, fullMessage: e.target.value })}
                            style={{
                                width: '100%', height: '80px', borderRadius: '0.75rem',
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                padding: '1rem', color: 'white', fontSize: '0.85rem', resize: 'none'
                            }}
                        />
                        <div id="paste-feedback" style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700, marginTop: '0.3rem', height: '14px' }}></div>
                    </div>

                    <div style={{ gridColumn: 'span 1' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Month</label>
                        <select
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                            className="input-field"
                            style={{ width: '100%', height: '45px', background: 'rgba(0,0,0,0.3)' }}
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 1' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Amount (Ksh)</label>
                        <input
                            type="number"
                            placeholder="e.g. 100"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="input-field"
                            style={{ width: '100%', height: '45px', background: 'rgba(0,0,0,0.3)' }}
                            required
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>MPESA Transaction Code</label>
                        <input
                            placeholder="e.g. SGH45VBN78"
                            value={formData.mpesaCode}
                            onChange={(e) => setFormData({ ...formData, mpesaCode: e.target.value.toUpperCase().slice(0, 10) })}
                            className="input-field"
                            style={{ width: '100%', height: '45px', background: 'rgba(0,0,0,0.3)', letterSpacing: '2px', fontWeight: 900 }}
                            required
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary"
                            style={{ width: '100%', height: '50px', fontWeight: 900, letterSpacing: '1px' }}
                        >
                            {submitting ? 'SUBMITTING...' : 'NOTIFY TREASURER 🚀'}
                        </button>
                    </div>
                </form>

                {error && <div style={{ marginTop: '1rem', color: '#f87171', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>⚠️ {error}</div>}
                {success && <div style={{ marginTop: '1rem', color: '#4ade80', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>✅ {success}</div>}
            </div>

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 3000, padding: '1.5rem'
                    }}
                    onClick={() => setSelectedReceipt(null)}
                >
                    <div
                        className="glass-panel"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '350px', padding: '2.5rem',
                            background: '#0a0a0a', border: '1px solid #4ade80',
                            position: 'relative', overflow: 'hidden'
                        }}
                    >
                        {/* Receipt Background Sparkles */}
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', color: 'rgba(74, 222, 128, 0.1)' }}>
                            <Sparkles size={100} />
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', marginBottom: '1rem' }}>
                                <FileText size={40} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>DIGITAL RECEIPT</h2>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-dim)', fontWeight: 700, letterSpacing: '1px' }}>{selectedReceipt.month} {selectedReceipt.year}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 700 }}>STUDENT</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>{memberName}</span>
                            </div>
                            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 700 }}>AMOUNT</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#4ade80' }}>Ksh {selectedReceipt.amount.toLocaleString()}</span>
                            </div>
                            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 700 }}>METHOD</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>{selectedReceipt.paymentMode}</span>
                            </div>
                            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 700 }}>CODE</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px' }}>{selectedReceipt.mpesaCode || 'CASH_VERIFIED'}</span>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(74, 222, 128, 0.1)', padding: '1rem',
                            borderRadius: '0.75rem', border: '1px solid rgba(74, 222, 128, 0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 800, marginBottom: '0.2rem' }}>VERIFIED BY DOULOS FINANCE</div>
                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                Date: {new Date(selectedReceipt.verifiedAt).toLocaleDateString()}
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedReceipt(null)}
                            style={{
                                marginTop: '1.5rem', width: '100%', background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-dim)',
                                padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .finance-form {
                    grid-template-columns: 1fr 1fr;
                }
                @media (max-width: 600px) {
                    .finance-form {
                        grid-template-columns: 1fr;
                    }
                    .finance-form > div {
                        grid-column: span 1 !important;
                    }
                }
            `}</style>

        </div>
    );
};

export default FinanceView;
