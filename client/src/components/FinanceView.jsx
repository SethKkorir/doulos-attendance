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
    const [randomNotification, setRandomNotification] = useState(null);

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

    // Logic to determine random notification for unpaid months
    useEffect(() => {
        if (!loading) {
            const currentMonthIdx = new Date().getMonth();
            const pastMonths = months.slice(0, currentMonthIdx);

            const unpaid = pastMonths.filter(m => {
                const s = getMonthStatus(m);
                return s.status === 'unpaid' || s.status === 'rejected';
            });

            if (unpaid.length > 0) {
                // Select random unpaid month
                const randomM = unpaid[Math.floor(Math.random() * unpaid.length)];
                setRandomNotification({
                    month: randomM,
                    message: `Hey! We noticed contributions for ${randomM} are still pending. A small act of faithfulness goes a long way! 🌿`
                });
            }
        }
    }, [loading, payments]); // Dependency on payments ensures we re-check after fetch

    const currentMonthName = months[new Date().getMonth()];
    const currentMonthStatus = getMonthStatus(currentMonthName);

    // Derived lists
    const pastUnpaidMonths = months.slice(0, new Date().getMonth()).filter(m => {
        const s = getMonthStatus(m).status;
        return s === 'unpaid' || s === 'rejected';
    });

    const paidHistory = months.filter(m => getMonthStatus(m).status === 'approved');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>

            {/* Random Notification Banner */}
            {randomNotification && (
                <div style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '1rem',
                    background: 'linear-gradient(to right, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05))',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    animation: 'slideDown 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(234, 179, 8, 0.2)', borderRadius: '50%', color: '#fbbf24' }}>
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '1px', marginBottom: '0.2rem' }}>REMINDER</div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{randomNotification.message}</div>
                    </div>
                </div>
            )}

            {/* Current Month Hero Status */}
            <div className="glass-panel" style={{
                padding: '2rem',
                borderLeft: currentMonthStatus.status === 'approved' ? '4px solid #4ade80' : '4px solid #25AAE1',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-dim)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                CURRENT PERIOD
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>
                                {currentMonthName}
                            </h2>
                            <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                                {currentMonthStatus.status === 'approved'
                                    ? "Thank you! Your contribution for this month is verified."
                                    : currentMonthStatus.status === 'pending'
                                        ? "Your payment is currently awaiting approval."
                                        : "You haven't made a contribution for this month yet."}
                            </p>
                        </div>
                        <div style={{
                            padding: '1rem', borderRadius: '1rem',
                            background: currentMonthStatus.status === 'approved' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(37, 170, 225, 0.1)',
                            color: currentMonthStatus.status === 'approved' ? '#4ade80' : '#25AAE1'
                        }}>
                            {currentMonthStatus.status === 'approved' ? <CheckCircle size={32} /> : <Wallet size={32} />}
                        </div>
                    </div>

                    {currentMonthStatus.status === 'approved' && (
                        <button
                            onClick={() => setSelectedReceipt(currentMonthStatus.data)}
                            style={{
                                marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)',
                                color: '#4ade80', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            <FileText size={16} /> VIEW RECEIPT
                        </button>
                    )}
                </div>
            </div>

            {/* Unpaid Past Months (Defaulter Check) */}
            {pastUnpaidMonths.length > 0 && (
                <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f87171', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <XCircle size={16} /> OUTSTANDING CONTRIBUTIONS
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {pastUnpaidMonths.map(month => (
                            <div key={month} className="glass-panel" style={{
                                padding: '1rem', border: '1px solid rgba(248, 113, 113, 0.2)',
                                background: 'rgba(248, 113, 113, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{month}</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#f87171', padding: '0.2rem 0.5rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '4px' }}>UNPAID</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment History (Scrollable Row) */}
            {paidHistory.length > 0 && (
                <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-dim)', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={16} /> PAYMENT HISTORY ({new Date().getFullYear()})
                    </h3>
                    <div className="table-container" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {paidHistory.map(month => {
                            const { data } = getMonthStatus(month);
                            return (
                                <div key={month}
                                    onClick={() => setSelectedReceipt(data)}
                                    className="glass-panel"
                                    style={{
                                        minWidth: '140px', padding: '1rem', cursor: 'pointer',
                                        border: '1px solid rgba(74, 222, 128, 0.1)',
                                        background: 'rgba(74, 222, 128, 0.05)',
                                        textAlign: 'center', transition: 'transform 0.2s',
                                        transform: 'scale(1)'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>{month}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 700 }}>VERIFIED</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
