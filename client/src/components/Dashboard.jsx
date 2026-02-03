import React, { useEffect, useState } from 'react';
import Card from './Card';
import { getAttendanceStats } from '../services/mockData';

const Dashboard = ({ currentLocation }) => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        getAttendanceStats().then(setStats);
    }, []);

    if (!stats) return <div style={{ color: 'var(--text-secondary)' }}>Loading stats...</div>;

    const currentStats = stats[currentLocation];
    const totalStats = stats.total;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <Card>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current Campus</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {currentStats.count} <span style={{ fontSize: '1rem', color: 'var(--success)' }}>today</span>
                </p>
            </Card>
            <Card>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>System Total</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {totalStats} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>students</span>
                </p>
            </Card>
            <Card style={{ border: '1px solid var(--accent-gold)' }}>
                <h3 style={{ color: 'var(--accent-gold)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Next Meeting</h3>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Monday, 8:30 PM</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>DAC 606 / Athi Chapel</p>
            </Card>
        </div>
    );
};

export default Dashboard;
