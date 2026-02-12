import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, LogIn, Send, Heart, User, MessageSquare } from 'lucide-react';
import BackgroundGallery from '../components/BackgroundGallery';
import Logo from '../components/Logo';
import api from '../api';

const LandingPage = () => {
    const [feedback, setFeedback] = useState({ name: '', message: '' });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.message.trim()) return;

        setStatus('submitting');
        try {
            await api.post('/feedback', feedback);
            setStatus('success');
            setFeedback({ name: '', message: '' });
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--color-bg)', color: 'white', overflowX: 'hidden' }}>
            <BackgroundGallery />

            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Hero Section */}
                <header style={{ textAlign: 'center', margin: '4rem 0 3rem' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '25px',
                        background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #032540 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 20px 40px rgba(37, 170, 225, 0.4)',
                        margin: '0 auto 2rem',
                        animation: 'float 6s ease-in-out infinite'
                    }}>
                        <Logo size={60} showText={false} />
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1rem', textShadow: '0 0 30px rgba(37, 170, 225, 0.5)' }}>
                        DOULOS <span style={{ color: 'hsl(var(--color-primary))' }}>PORTAL</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                        The central hub for Doulos community, attendance tracking, and spiritual growth resources.
                    </p>
                </header>

                {/* Main Action Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%', maxWidth: '900px', marginBottom: '4rem' }}>

                    {/* Member Portal Access */}
                    <Link to="/portal" className="glass-panel hover-card" style={{ padding: '2.5rem', textAlign: 'center', textDecoration: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(37, 170, 225, 0.1)', borderRadius: '50%', color: '#25AAE1' }}>
                            <User size={40} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Member Portal</h2>
                            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Access your attendance history, profile, and community stats.</p>
                        </div>
                        <span className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>Login as Member</span>
                    </Link>

                    {/* Admin Dashboard Access */}
                    <Link to="/admin" className="glass-panel hover-card" style={{ padding: '2.5rem', textAlign: 'center', textDecoration: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#ef4444' }}>
                            <LogIn size={40} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Admin Access</h2>
                            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Manage meetings, view analytics, and oversee member data.</p>
                        </div>
                        <span className="btn" style={{ width: '100%', marginTop: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Admin Login</span>
                    </Link>
                </div>

                {/* Public Insight / Feedback Section */}
                <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '3rem', borderTop: '4px solid #facc15' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(250, 204, 21, 0.1)', borderRadius: '50%', color: '#facc15', marginBottom: '1rem' }}>
                            <MessageSquare size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Share Your Insights</h2>
                        <p style={{ color: 'var(--color-text-dim)' }}>
                            Have a suggestion, feedback, or a word of encouragement? We'd love to hear from you, even if you're just visiting!
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-dim)' }}>YOUR NAME (OPTIONAL)</label>
                            <input
                                type="text"
                                placeholder="Anonymous Guest"
                                value={feedback.name}
                                onChange={e => setFeedback({ ...feedback, name: e.target.value })}
                                style={{
                                    width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
                                    color: 'white', fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-dim)' }}>YOUR MESSAGE</label>
                            <textarea
                                required
                                placeholder="Type your thoughts here..."
                                value={feedback.message}
                                onChange={e => setFeedback({ ...feedback, message: e.target.value })}
                                rows={4}
                                style={{
                                    width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
                                    color: 'white', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'submitting' || status === 'success'}
                            className="btn btn-primary"
                            style={{
                                padding: '1rem', fontSize: '1rem', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                background: status === 'success' ? '#4ade80' : 'hsl(var(--color-primary))'
                            }}
                        >
                            {status === 'submitting' ? 'SENDING...' : status === 'success' ? 'SENT SUCCESSFULLY!' : status === 'error' ? 'FAILED - TRY AGAIN' : (
                                <>SEND INSIGHT <Send size={18} /></>
                            )}
                        </button>
                    </form>
                </div>

                <footer style={{ marginTop: '4rem', color: 'var(--color-text-dim)', fontSize: '0.8rem', textAlign: 'center' }}>
                    <p>&copy; {new Date().getFullYear()} Doulos Community. All rights reserved.</p>
                </footer>

            </div>

            <style>{`
                .hover-card { transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.05); }
                .hover-card:hover { transform: translateY(-10px); background: rgba(255,255,255,0.05); border-color: rgba(37, 170, 225, 0.3); }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
