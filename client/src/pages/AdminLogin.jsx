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
        if (sessionStorage.getItem('token')) {
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
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('role', res.data.role);
            sessionStorage.setItem('username', loginUsername);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2rem' }}>
            <BackgroundGallery />
            <ValentineRain />
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', background: 'rgba(255, 255, 255, 0.95)', color: '#0f172a', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div className="flex-center" style={{ marginBottom: '1.5rem', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', background: 'rgba(226, 232, 240, 0.5)', borderRadius: '50%', marginBottom: '1rem' }}>
                        <Lock size={32} color="hsl(var(--color-primary))" />
                    </div>
                    <h2>Admin Access</h2>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#b91c1c',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                        Enter System
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
