import { useState, useEffect } from 'react';
import api from '../api';
import QRCode from 'react-qr-code';
import { Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon } from 'lucide-react';

const AdminDashboard = () => {
    const [meetings, setMeetings] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null); // For QR Modal
    const [formData, setFormData] = useState({
        name: 'Weekly Doulos',
        date: new Date().toISOString().split('T')[0],
        campus: 'Athi River',
        startTime: '20:30',
        endTime: '23:00'
    });
    const [msg, setMsg] = useState(null);

    const fetchMeetings = async () => {
        try {
            const res = await api.get('/meetings');
            setMeetings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setMsg(null);
        try {
            await api.post('/meetings', formData);
            setMsg({ type: 'success', text: 'Meeting Created!' });
            setShowCreate(false);
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create' });
        }
    };

    const downloadReport = async (meetingId, meetingName) => {
        try {
            const res = await api.get(`/attendance/${meetingId}`);
            const data = res.data;

            // Convert to CSV
            const headers = ['Student Name', 'Reg No', 'Time'];
            const rows = data.map(r => [r.studentName, r.studentRegNo, new Date(r.timestamp).toLocaleTimeString()]);
            const csvContent = "data:text/csv;charset=utf-8,"
                + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${meetingName}_Attendance.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            alert('Failed to download report');
        }
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/admin';
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={logout}>Logout</button>
            </header>

            {msg && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '0.5rem',
                    background: msg.type === 'error' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: msg.type === 'error' ? '#fca5a5' : '#6ee7b7',
                    border: `1px solid ${msg.type === 'error' ? '#ef4444' : '#10b981'}`
                }}>
                    {msg.text}
                </div>
            )}

            {/* Actions */}
            <div style={{ marginBottom: '2rem' }}>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> New Meeting
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '600px' }}>
                    <h3>Create Meeting</h3>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label>Name</label>
                            <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div>
                            <label>Date</label>
                            <input type="date" className="input-field" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                        </div>
                        <div>
                            <label>Campus</label>
                            <select className="input-field" value={formData.campus} onChange={e => setFormData({ ...formData, campus: e.target.value })}>
                                <option value="Athi River">Athi River</option>
                                <option value="Valley Road">Valley Road</option>
                            </select>
                        </div>
                        <div>
                            <label>Start Time</label>
                            <input type="time" className="input-field" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                        </div>
                        <div>
                            <label>End Time</label>
                            <input type="time" className="input-field" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                        </div>
                        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Meeting</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Meetings List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {meetings.map(m => (
                    <div key={m._id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                            {m.isActive ? <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 'bold' }}>ACTIVE</span> : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>CLOSED</span>}
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>{m.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', marginBottom: '0.25rem' }}>
                            <Calendar size={16} /> {new Date(m.date).toDateString()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', marginBottom: '0.25rem' }}>
                            <Clock size={16} /> {m.startTime} - {m.endTime}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>
                            <MapPin size={16} /> {m.campus}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '0.5rem' }} onClick={() => setSelectedMeeting(m)}>
                                <QrIcon size={18} /> QR
                            </button>
                            <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '0.5rem' }} onClick={() => downloadReport(m._id, m.name)}>
                                <Download size={18} /> CSV
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* QR Modal */}
            {selectedMeeting && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }} onClick={() => setSelectedMeeting(null)}>
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', background: '#fff' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#000', marginBottom: '1rem' }}>Scan to Check In</h3>
                        <div style={{ background: 'white', padding: '1rem', display: 'inline-block' }}>
                            <QRCode value={selectedMeeting.code} size={256} />
                        </div>
                        <p style={{ color: '#333', marginTop: '1rem', fontWeight: 'bold' }}>{selectedMeeting.campus}</p>
                        <p style={{ color: '#666' }}>{selectedMeeting.startTime} - {selectedMeeting.endTime}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
