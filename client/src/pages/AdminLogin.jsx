import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (error) {
            timer = setTimeout(() => setError(''), 4000);
        }
        return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/admin/dashboard');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Check if user is just entering the 657 code in either field
            const isBypass = username === '657' || password === '657';
            const loginUsername = isBypass ? (username === '657' ? 'SuperAdmin' : username) : username;
            const loginPassword = isBypass ? '657' : password;

            const res = await api.post('/auth/login', { username: loginUsername, password: loginPassword });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('username', loginUsername);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
            <BackgroundGallery />
            <ValentineRain />

            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '430px',
                padding: '3rem',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Logo size={80} showText={false} />
                    <h1 style={{ fontSize: '1.75rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Admin Access</h1>
                    <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Secure management portal for Doulos Registry</p>
                </div>

                {error && (
                    <div style={{
                        position: 'fixed',
                        top: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2000,
                        minWidth: '300px',
                        padding: '1rem 1.5rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.95)',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        fontWeight: 600,
                        animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        ⚠️ {error}
                        <style>{`
                            @keyframes slideDown {
                                0% { opacity: 0; transform: translate(-50%, -20px); }
                                100% { opacity: 1; transform: translate(-50%, 0); }
                            }
                        `}</style>
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>USERNAME</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>PASSWORD</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                        Enter System
                    </button>
                </form>

                <div style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>
                    Doulos Attendance System &bull; 2026
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
