import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, Key, ArrowRight, User } from 'lucide-react';
import api from '../api';
import Logo from '../components/Logo';
import '../styles/adminDesignSystem.css';

const AcceptInvitation = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await api.get(`/auth/invitations/${token}`);
                setInviteData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Invalid or expired invitation link.');
            } finally {
                setLoading(false);
            }
        };
        verifyToken();
    }, [token]);

    const handleAccept = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post(`/auth/invitations/${token}/accept`, {
                username: username.trim(),
                password: password.trim()
            });

            setSuccess(true);
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.user.role);
                localStorage.setItem('username', res.data.user.username);
                localStorage.setItem('campus', res.data.user.campus || 'Athi River');
            }

            setTimeout(() => {
                if (res.data.user?.role === 'superadmin') {
                    navigate('/superadmin');
                } else {
                    navigate('/admin/dashboard');
                }
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to activate account. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="ds-spinner" style={{ margin: '0 auto 16px auto', width: '32px', height: '32px' }} />
                    <p style={{ color: '#64748B', fontWeight: 600 }}>Verifying invitation token...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0B132B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ backgroundColor: '#1E3A8A', padding: '32px 24px', textAlign: 'center', color: '#FFFFFF' }}>
                    <div style={{ display: 'inline-flex', padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', marginBottom: '16px' }}>
                        <Logo size={36} showText={false} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>DOULOUS PLATFORM</h1>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#93C5FD', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Official Account Activation
                    </p>
                </div>

                <div style={{ padding: '32px' }}>
                    {error && (
                        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: '10px', color: '#B91C1C', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <CheckCircle size={48} color="#16A34A" style={{ margin: '0 auto 16px auto' }} />
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Account Activated!</h2>
                            <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                Welcome to the Doulos platform. Redirecting you to your portal...
                            </p>
                        </div>
                    ) : inviteData ? (
                        <>
                            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                    Invited Account Scope
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                                    {inviteData.position || inviteData.role.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                                    {inviteData.email} &bull; {inviteData.campus}
                                </div>
                            </div>

                            <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Choose Username
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="e.g. jdoe"
                                        required
                                        className="ds-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Create Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        required
                                        className="ds-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat password"
                                        required
                                        className="ds-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="ds-btn ds-btn-primary"
                                    style={{ width: '100%', marginTop: '8px', padding: '12px', justifyContent: 'center' }}
                                >
                                    {submitting ? 'Activating Account...' : 'Complete Activation & Sign In'}
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
                                This invitation is invalid or has expired. Please contact the Super Administrator.
                            </p>
                            <button
                                onClick={() => navigate('/admin')}
                                className="ds-btn ds-btn-secondary"
                                style={{ marginTop: '16px' }}
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitation;
