import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState('Initializing Developer Access...');

    useEffect(() => {
        const handlePromotion = async () => {
            const username = localStorage.getItem('username');
            if (!username) {
                setMsg('Please login as admin first.');
                setTimeout(() => navigate('/admin'), 2000);
                return;
            }

            const secret = window.prompt("Enter Developer Secret:");
            if (!secret) {
                navigate('/admin/dashboard');
                return;
            }

            try {
                const res = await api.post('/auth/promote', { username, secret });
                localStorage.setItem('role', res.data.role);
                setMsg('Success! You are now a Developer. Redirecting...');
                setTimeout(() => navigate('/admin/dashboard'), 1500);
            } catch (err) {
                setMsg(err.response?.data?.message || 'Promotion failed');
                setTimeout(() => navigate('/admin/dashboard'), 2000);
            }
        };

        handlePromotion();
    }, [navigate]);

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: 'hsl(var(--color-primary))' }}>Developer Portal</h2>
                <p style={{ color: 'var(--color-text-dim)' }}>{msg}</p>
            </div>
        </div>
    );
};

export default SuperAdmin;
