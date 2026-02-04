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
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div className="flex-center" style={{ marginBottom: '1.5rem', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                        <Lock size={32} color="hsl(var(--color-primary))" />
                    </div>
                    <h2>Admin Access</h2>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(220, 38, 38, 0.2)',
                        border: '1px solid rgba(220, 38, 38, 0.5)',
                        color: '#fca5a5',
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
