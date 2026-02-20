import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Ensure this path is correct
import AdminFinanceView from '../components/AdminFinanceView';
import Logo from '../components/Logo';
import { LogOut, Sun, Moon, ShieldAlert } from 'lucide-react';
import BackgroundGallery from '../components/BackgroundGallery';

const G7FinanceDashboard = () => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Enforce G7 Role or Admin
        const role = localStorage.getItem('role');
        const g9Role = localStorage.getItem('g9Role'); // We need to ensure this is stored on login

        // Mock user check for now - we'll rely on backend protection later
        if (!role) {
            navigate('/admin');
            return;
        }

        // Set theme
        document.documentElement.setAttribute('data-theme', theme);

        setUser({
            username: localStorage.getItem('username'),
            role: role,
            g9Role: g9Role
        });

    }, [navigate, theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('g9Role');
        localStorage.removeItem('username');
        navigate('/admin');
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
            <BackgroundGallery show={true} />
            <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>

                {/* Finance Header */}
                <header style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '3rem', background: 'rgba(16, 185, 129, 0.1)',
                    padding: '1.5rem 2rem', borderRadius: '1.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="logo-container" style={{ transform: 'scale(0.8)' }}>
                            <Logo />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>
                                <span style={{ color: '#10b981' }}>THE VAULT</span> <span style={{ opacity: 0.5, fontSize: '1rem', fontWeight: 400 }}>| Finance Command</span>
                            </h1>
                            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>
                                {user?.username} • G7 COORDINATOR
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button onClick={toggleTheme} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button onClick={handleLogout} className="btn" style={{
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.6rem 1.2rem',
                            display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem'
                        }}>
                            <LogOut size={16} /> LOGOUT
                        </button>
                    </div>
                </header>

                {/* Main Vault Content */}
                <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
                    <AdminFinanceView />
                </div>

                {/* Secure Footer */}
                <footer style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', letterSpacing: '2px' }}>
                    SECURE FINANCIAL SYSTEM • DOULOS LEADERSHIP 2026
                </footer>

            </div>
        </div>
    );
};

export default G7FinanceDashboard;
