import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { isAttendanceOpen } from '../utils/timeUtils';
import { submitAttendance } from '../services/mockData';

const AttendanceForm = ({ currentLocation }) => {
    const [name, setName] = useState('');
    const [regNo, setRegNo] = useState('');
    const [status, setStatus] = useState({ isOpen: false, reason: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Check time status
        const checkStatus = () => {
            const timeStatus = isAttendanceOpen();
            // For DEMO purposes, we can uncomment this to force it open if testing:
            // const timeStatus = { isOpen: true, reason: 'Debug Mode Open' }; 
            setStatus(timeStatus);
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !regNo) return;

        setLoading(true);
        setMessage(null);
        try {
            const res = await submitAttendance(name, currentLocation);
            setMessage({ type: 'success', text: res.message });
            setName('');
            setRegNo('');
        } catch (err) {
            setMessage({ type: 'error', text: err });
        } finally {
            setLoading(false);
        }
    };

    if (!status.isOpen) {
        return (
            <Card style={{ textAlign: 'center', borderColor: 'var(--danger)' }}>
                <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Check-in Closed</h2>
                <p>{status.reason}</p>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Attendance is only available on Mondays from 8:30 PM to 11:00 PM.
                </p>
            </Card>
        )
    }

    return (
        <Card>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Mark Attendance</h2>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>
                📍 {currentLocation === 'athi' ? 'Athi River Campus' : 'Valley Road Campus (DAC 606)'}
            </p>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    textAlign: 'center'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Input
                    label="Full Name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                />
                <Input
                    label="Registration Number"
                    name="regNo"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    required
                    placeholder="e.g. 19-1234"
                />

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Check In'}
                </Button>
            </form>
        </Card>
    );
};

export default AttendanceForm;
