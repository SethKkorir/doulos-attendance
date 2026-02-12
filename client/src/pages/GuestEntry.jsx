import { useNavigate } from 'react-router-dom';
import { User, Shield, ArrowRight } from 'lucide-react';
import BackgroundGallery from '../components/BackgroundGallery';
import Logo from '../components/Logo';

const GuestEntry = () => {
    const navigate = useNavigate();

    const handleGuestAccess = (type) => {
        // We will pass state to the routes to indicate guest mode
        if (type === 'student') {
            navigate('/portal', { state: { isGuest: true } });
        } else {
            navigate('/admin/dashboard', { state: { isGuest: true } });
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--color-bg)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BackgroundGallery />

            <div className="glass-panel" style={{ position: 'relative', zIndex: 1, padding: '3rem', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <div className="animate-float">
                    <Logo size={60} showText={false} />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Explore Doulos</h1>
                    <p style={{ color: 'var(--color-text-dim)' }}>Experience the system as a guest.</p>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={() => handleGuestAccess('student')}
                        className="glass-panel hover-card"
                        style={{
                            padding: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(37, 170, 225, 0.1)', border: '1px solid rgba(37, 170, 225, 0.2)', cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(37, 170, 225, 0.2)', borderRadius: '12px', color: '#25AAE1' }}>
                                <User size={24} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Student Portal</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>View attendance & community</span>
                            </div>
                        </div>
                        <ArrowRight size={20} color="#25AAE1" />
                    </button>

                    <button
                        onClick={() => handleGuestAccess('admin')}
                        className="glass-panel hover-card"
                        style={{
                            padding: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#ef4444' }}>
                                <Shield size={24} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Admin Dashboard</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>View analytics & management</span>
                            </div>
                        </div>
                        <ArrowRight size={20} color="#ef4444" />
                    </button>

                    <button
                        onClick={() => navigate('/admin')}
                        style={{
                            marginTop: '1rem', background: 'none', border: 'none',
                            color: 'var(--color-text-dim)', fontSize: '0.9rem', cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Back to Real Login
                    </button>
                </div>
            </div>

            <style>{`
                .hover-card { transition: all 0.3s ease; }
                .hover-card:hover { transform: translateX(5px); background: rgba(255,255,255,0.1) !important; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            `}</style>
        </div>
    );
};

export default GuestEntry;
