import { useState, useEffect } from 'react';
import api from '../api';
import QRCode from 'react-qr-code';
import { Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, Users, BarChart3, Activity, Trash2, Search, Link as LinkIcon, ExternalLink, ShieldAlert as Ghost } from 'lucide-react';
import Logo from '../components/Logo';

const AdminDashboard = () => {
    const [meetings, setMeetings] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null); // For QR Modal
    const [formData, setFormData] = useState({
        name: 'Weekly Doulos',
        date: new Date().toISOString().split('T')[0],
        campus: 'Athi River',
        startTime: '20:30',
        endTime: '23:00',
        requiredFields: [
            { label: 'Full Name', key: 'studentName', required: true },
            { label: 'Admission Number', key: 'studentRegNo', required: true }
        ],
        questionOfDay: ''
    });
    const [msg, setMsg] = useState(null);
    const [viewingAttendance, setViewingAttendance] = useState(null); // Meeting object
    const [activeTab, setActiveTab] = useState('meetings'); // 'meetings' or 'members'
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const fetchMeetings = async () => {
        try {
            const res = await api.get('/meetings');
            setMeetings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addField = () => {
        setFormData({
            ...formData,
            requiredFields: [...formData.requiredFields, { label: '', key: '', required: true }]
        });
    };

    const updateField = (index, field, value) => {
        const newFields = [...formData.requiredFields];
        newFields[index][field] = value;
        // Auto-generate key from label if key is empty
        if (field === 'label' && !newFields[index].key) {
            newFields[index].key = value.toLowerCase().replace(/\s+/g, '_');
        }
        setFormData({ ...formData, requiredFields: newFields });
    };

    const removeField = (index) => {
        if (formData.requiredFields.length > 1) {
            const newFields = formData.requiredFields.filter((_, i) => i !== index);
            setFormData({ ...formData, requiredFields: newFields });
        }
    };

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const res = await api.get('/attendance/insights/members');
            setMembers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    useEffect(() => {
        if (activeTab === 'members') fetchMembers();
    }, [activeTab]);

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
            if (data.length === 0) {
                alert('No attendance recorded yet.');
                return;
            }

            // Get all unique keys from responses
            const allKeys = new Set();
            data.forEach(r => {
                const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                Object.keys(responses || {}).forEach(k => allKeys.add(k));
            });
            const headers = Array.from(allKeys);

            const rows = data.map(r => {
                const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                return headers.map(h => responses[h] || '');
            });

            const csvContent = "data:text/csv;charset=utf-8,"
                + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${meetingName}_Attendance.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            console.error(err);
            alert('Failed to download report');
        }
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/admin';
    };

    const toggleStatus = async (meeting) => {
        try {
            await api.patch(`/meetings/${meeting._id}`, { isActive: !meeting.isActive });
            fetchMeetings();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const deleteMeeting = async (id) => {
        if (!window.confirm('Are you sure you want to delete this meeting and all its attendance?')) return;
        try {
            await api.delete(`/meetings/${id}`);
            fetchMeetings();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const totalAttendanceCount = meetings.reduce((acc, current) => acc + (current.attendanceCount || 0), 0);
    const activeMeetingsCount = meetings.filter(m => m.isActive).length;

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Logo size={45} />
                    <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                            onClick={() => setActiveTab('meetings')}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                background: activeTab === 'meetings' ? 'hsl(var(--color-primary))' : 'transparent',
                                color: activeTab === 'meetings' ? 'white' : 'var(--color-text-dim)',
                                fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
                            }}
                        >
                            Meetings
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                background: activeTab === 'members' ? 'hsl(var(--color-primary))' : 'transparent',
                                color: activeTab === 'members' ? 'white' : 'var(--color-text-dim)',
                                fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
                            }}
                        >
                            Members
                        </button>
                    </div>
                </div>
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

            {/* Analytics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(124, 58, 237, 0.2)', borderRadius: '0.75rem', color: '#a78bfa' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Total Check-ins</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{totalAttendanceCount}</h3>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '0.75rem', color: '#22d3ee' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Active Meetings</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{activeMeetingsCount}</h3>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '0.75rem', color: '#34d399' }}>
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Total Events</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{meetings.length}</h3>
                    </div>
                </div>
            </div>

            {activeTab === 'meetings' ? (
                <>
                    {/* Actions */}
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                            <Plus size={20} style={{ marginRight: '0.5rem' }} /> New Meeting
                        </button>
                    </div>

                    {/* Create Form */}
                    {showCreate && (
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '800px' }}>
                            <h3>Create Meeting</h3>
                            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label>Meeting Name</label>
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
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label>Question of the Day (Optional)</label>
                                    <input
                                        placeholder="e.g. What are you grateful for today?"
                                        className="input-field"
                                        value={formData.questionOfDay}
                                        onChange={e => setFormData({ ...formData, questionOfDay: e.target.value })}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.3rem' }}>
                                        This question will appear on the student check-in form.
                                    </p>
                                </div>

                                {/* Dynamic Fields Section */}
                                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <label style={{ fontWeight: 'bold' }}>Student Form Fields</label>
                                        <button type="button" className="btn" onClick={addField} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>+ Add Field</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {formData.requiredFields.map((field, index) => (
                                            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    placeholder="Label (e.g. Department)"
                                                    className="input-field"
                                                    value={field.label}
                                                    onChange={e => updateField(index, 'label', e.target.value)}
                                                    style={{ flex: 2 }}
                                                    required
                                                />
                                                <input
                                                    placeholder="Key (slug)"
                                                    className="input-field"
                                                    value={field.key}
                                                    onChange={e => updateField(index, 'key', e.target.value)}
                                                    style={{ flex: 1, fontSize: '0.8rem', opacity: 0.7 }}
                                                    required
                                                />
                                                <button type="button" onClick={() => removeField(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                                        * Use "Admission Number" (key: studentRegNo) for unique check-ins (Format: 00-0000).
                                    </p>
                                </div>

                                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>Create Meeting</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Meetings List */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {meetings.map(m => (
                            <div key={m._id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative', transition: 'all 0.3s ease', border: m.isActive ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{m.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                                            <MapPin size={14} /> {m.campus}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => toggleStatus(m)}
                                            style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '2rem',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                background: m.isActive ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                color: m.isActive ? '#4ade80' : '#94a3b8',
                                                border: m.isActive ? '1px solid #4ade80' : '1px solid #94a3b8',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {m.isActive ? '• ACTIVE' : 'CLOSED'}
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>
                                            <Users size={14} /> {m.attendanceCount || 0}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                                        <Calendar size={14} /> {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                                        <Clock size={14} /> {m.startTime} - {m.endTime}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button className="btn" style={{ flex: '1 1 60px', background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setSelectedMeeting(m)}>
                                        <QrIcon size={16} style={{ marginRight: '0.3rem' }} /> QR
                                    </button>
                                    <button className="btn" style={{ flex: '2 1 100px', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.5rem', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => setViewingAttendance(m)}>
                                        View Attendance
                                    </button>
                                    <button className="btn" style={{ flex: '1 1 60px', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', color: 'var(--color-text-dim)' }} onClick={() => downloadReport(m._id, m.name)}>
                                        <Download size={16} />
                                    </button>
                                    <button className="btn" style={{ flex: '0 0 40px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.5rem' }} onClick={() => deleteMeeting(m._id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Members Directory</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                            Tracking {members.length} unique individuals
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Member Info</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Commitment</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Last Seen</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingMembers ? (
                                    <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center' }}>Loading members...</td></tr>
                                ) : members.map((m, i) => {
                                    const name = m.details?.studentName || 'Unknown Student';
                                    const regNo = m._id;
                                    const isNewcomer = m.totalAttended === 1;
                                    const isRegular = m.totalAttended >= 3;
                                    const daysSinceLast = Math.floor((new Date() - new Date(m.lastSeen)) / (1000 * 60 * 60 * 24));
                                    const isGhosting = daysSinceLast > 14;

                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{regNo}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${Math.min(m.totalAttended * 25, 100)}%`,
                                                            height: '100%',
                                                            background: isRegular ? '#4ade80' : '#a78bfa'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem' }}>{m.totalAttended} meetings</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                                {new Date(m.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                <div style={{ fontSize: '0.7rem', color: isGhosting ? '#f87171' : 'var(--color-text-dim)' }}>
                                                    {daysSinceLast === 0 ? 'Today' : `${daysSinceLast} days ago`}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {isNewcomer && <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>NEWCOMER</span>}
                                                {isGhosting && <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>FOLLOW UP</span>}
                                                {isRegular && !isGhosting && <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>REGULAR</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Attendance View Modal */}
            {viewingAttendance && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', padding: 0 }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{viewingAttendance.name} - Attendance</h3>
                            <button className="btn" style={{ padding: '0.5rem 1rem' }} onClick={() => setViewingAttendance(null)}>Close</button>
                        </div>
                        <div style={{ overflow: 'auto', padding: '1rem', flex: 1 }}>
                            <AttendanceTable meetingId={viewingAttendance._id} />
                        </div>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            {selectedMeeting && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }} onClick={() => setSelectedMeeting(null)}>
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', background: '#fff' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#000', marginBottom: '1rem' }}>Scan to Check In</h3>
                        <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '0.5rem' }}>
                            <QRCode
                                value={`${window.location.origin}/check-in/${selectedMeeting.code}`}
                                size={256}
                                level="H"
                            />
                        </div>
                        <p style={{ color: '#333', marginTop: '1rem', fontWeight: 'bold' }}>{selectedMeeting.name}</p>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>{selectedMeeting.campus} | {selectedMeeting.startTime} - {selectedMeeting.endTime}</p>

                        {/* Test Links for Local Environment */}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button
                                className="btn"
                                style={{ background: '#f3f4f6', color: '#374151', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const link = `${window.location.origin}/check-in/${selectedMeeting.code}`;
                                    navigator.clipboard.writeText(link);
                                    alert('Link copied to clipboard!');
                                }}
                            >
                                <LinkIcon size={14} style={{ marginRight: '0.4rem' }} /> Copy Link
                            </button>
                            <a
                                href={`/check-in/${selectedMeeting.code}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn"
                                style={{ background: 'hsl(var(--color-primary))', color: 'white', fontSize: '0.8rem', padding: '0.5rem 1rem', textDecoration: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink size={14} style={{ marginRight: '0.4rem' }} /> Open Test Link
                            </a>
                        </div>

                        <p style={{ color: '#999', fontSize: '0.8rem', marginTop: '1.5rem' }}>Click anywhere outside to close</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const AttendanceTable = ({ meetingId }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await api.get(`/attendance/${meetingId}`);
                setRecords(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [meetingId]);

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</div>;

    // Determine headers
    const allKeys = new Set();
    records.forEach(r => {
        const responses = r.responses || {};
        Object.keys(responses).forEach(k => allKeys.add(k));
    });
    const headers = Array.from(allKeys);

    // Filtering logic
    const filteredRecords = records.filter(r => {
        const fullString = Object.values(r.responses || {}).join(' ').toLowerCase();
        return fullString.includes(searchTerm.toLowerCase());
    });

    return (
        <div>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                <input
                    placeholder="Search by name, reg no, or any field..."
                    className="input-field"
                    style={{ paddingLeft: '3rem' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Found {filteredRecords.length} records</span>
                {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}>Clear search</button>}
            </div>

            {filteredRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem' }}>
                    No students match your search.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Time</th>
                                {headers.map(h => (
                                    <th key={h} style={{ padding: '1rem', textTransform: 'capitalize', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        {h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    {headers.map(h => (
                                        <td key={h} style={{ padding: '1rem' }}>
                                            {r.responses?.[h] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
