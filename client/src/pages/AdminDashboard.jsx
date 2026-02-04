import { useState, useEffect } from 'react';
import api from '../api';
import QRCode from 'react-qr-code';
import { Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, Users, BarChart3, Activity, Trash2, Search, Link as LinkIcon, ExternalLink, ShieldAlert as Ghost, Sun, Moon } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';

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
        questionOfDay: '',
        isTestMeeting: false
    });
    const [msg, setMsg] = useState(null);
    const [viewingAttendance, setViewingAttendance] = useState(null); // Meeting object
    const [activeTab, setActiveTab] = useState('meetings'); // 'meetings', 'members', or 'reports'
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'admin');
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }, [isDarkMode]);

    const fetchMeetings = async () => {
        try {
            const res = await api.get('/meetings');
            // Sort: Active first, then Date descending
            const sorted = res.data.sort((a, b) => {
                if (a.isActive === b.isActive) {
                    return new Date(b.date) - new Date(a.date);
                }
                return a.isActive ? -1 : 1;
            });
            setMeetings(sorted);
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
                const timestamp = new Date(r.timestamp).toLocaleString();
                const memberType = r.memberType || 'Visitor';
                return `<tr><td>${timestamp}</td><td><strong>${memberType}</strong></td>${headers.map(h => `<td>${responses[h] || '-'}</td>`).join('')}</tr>`;
            });

            const headerCells = ['Time', 'Category', ...headers].map(h => `<th style="text-align: left; padding: 12px; border-bottom: 2px solid #032540; color: #032540;">${h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>`).join('');

            const reportHtml = `
                <html>
                <head>
                    <title>${meetingName} - Attendance Report</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; }
                        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo { height: 80px; }
                        .title-section { text-align: right; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f5f5f5; }
                        td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
                        .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="${window.location.origin}/logo.png" class="logo" />
                        <div class="title-section">
                            <h1 style="margin: 0; color: #032540;">Attendance Report</h1>
                            <p style="margin: 5px 0; color: #666;">${meetingName}</p>
                            <p style="margin: 0; font-size: 0.9em;">Generated on: ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <button class="no-print" onclick="window.print()" style="margin-bottom: 20px; padding: 10px 20px; background: #25AAE1; color: white; border: none; border-radius: 5px; cursor: pointer;">Print to PDF</button>

                    <table>
                        <thead><tr>${headerCells}</tr></thead>
                        <tbody>${rows.join('')}</tbody>
                    </table>

                    <div class="footer">
                        Doulos Solidarity &bull; Daystar University &bull; Official Attendance Record
                    </div>
                </body>
                </html>
            `;

            const win = window.open('', '_blank');
            win.document.write(reportHtml);
            win.document.close();
        } catch (err) {
            console.error(err);
            alert('Failed to generate report');
        }
    };

    const handlePrintQR = (meeting) => {
        const qrSvg = document.querySelector('.qr-modal-content svg');
        if (!qrSvg) return alert('QR code not found');

        const qrDataUrl = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(qrSvg));

        const printHtml = `
            <html>
            <head>
                <title>Doulos QR - ${meeting.name}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background-color: #f5f5f5;
                    }
                    .page {
                        width: 210mm;
                        height: 297mm;
                        padding: 20mm;
                        background: white;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-between;
                        text-align: center;
                    }
                    .header { width: 100%; }
                    .logo { height: 100px; margin-bottom: 15mm; }
                    .meeting-name { font-size: 3rem; font-weight: 800; color: #032540; margin: 0; line-height: 1.1; }
                    .details { font-size: 1.5rem; color: #1976d2; margin-top: 5mm; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                    
                    .qr-section { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }
                    .qr-container { 
                        padding: 15mm; 
                        background: white; 
                        border: 2mm solid #032540; 
                        border-radius: 10mm;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    }
                    .scan-text { margin-top: 10mm; font-size: 1.2rem; color: #555; font-weight: 500; }
                    
                    .footer-info { width: 100%; border-top: 2px solid #eee; padding-top: 10mm; }
                    .date { font-size: 1.4rem; font-weight: 700; color: #032540; margin-bottom: 3mm; }
                    .system-tag { font-size: 1rem; color: #888; letter-spacing: 2px; text-transform: uppercase; }

                    @media print {
                        body { background: none; }
                        .page { box-shadow: none; margin: 0; width: 100%; height: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="header">
                        <img src="${window.location.origin}/logo.png" class="logo" />
                        <div class="meeting-name">${meeting.name}</div>
                        <div class="details">${meeting.campus} ${meeting.campus.toLowerCase().includes('athi') ? 'Fellowship' : 'Meeting'}</div>
                    </div>
                    
                    <div class="qr-section">
                        <div class="qr-container">
                            <img src="${qrDataUrl}" width="400" height="400" />
                        </div>
                        <div class="scan-text">SCAN TO MARK ATTENDANCE</div>
                    </div>
                    
                    <div class="footer-info">
                        <div class="date">${new Date(meeting.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div class="system-tag">Doulos Solidarity &bull; Daystar University</div>
                    </div>
                </div>
                <script>
                    window.onload = () => { 
                        setTimeout(() => {
                            window.print();
                            window.onafterprint = () => window.close();
                        }, 500); 
                    };
                </script>
            </body>
            </html>
        `;

        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
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
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            <BackgroundGallery />
            <ValentineRain />
            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
                <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                        <Logo size={45} />
                        <div className="admin-nav" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                                onClick={() => setActiveTab('meetings')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'meetings' ? 'hsl(var(--color-primary))' : 'transparent',
                                    color: activeTab === 'meetings' ? 'white' : 'var(--color-text-dim)',
                                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
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
                                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Members
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'reports' ? 'hsl(var(--color-primary))' : 'transparent',
                                    color: activeTab === 'reports' ? 'white' : 'var(--color-text-dim)',
                                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Reports
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            className="btn"
                            style={{
                                padding: '0.6rem',
                                background: 'rgba(255,255,255,0.05)',
                                color: isDarkMode ? '#facc15' : 'var(--color-bg)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                            onClick={() => setIsDarkMode(!isDarkMode)}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            className="btn"
                            style={{
                                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                color: 'hsl(var(--color-text))',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </div>
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
                <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(37, 170, 225, 0.2)', borderRadius: '0.75rem', color: '#25AAE1' }}>
                            <Users size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Total Check-ins</p>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{totalAttendanceCount}</h3>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(255, 215, 0, 0.2)', borderRadius: '0.75rem', color: '#FFD700' }}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Active Meetings</p>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{activeMeetingsCount}</h3>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(221, 93, 108, 0.2)', borderRadius: '0.75rem', color: '#dd5d6c' }}>
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
                                <form onSubmit={handleCreate} className="create-meeting-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                                    {['developer', 'superadmin'].includes(userRole) && (
                                        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 170, 225, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                                            <input
                                                type="checkbox"
                                                id="testMode"
                                                checked={formData.isTestMeeting}
                                                onChange={e => setFormData({ ...formData, isTestMeeting: e.target.checked })}
                                                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                            />
                                            <label htmlFor="testMode" style={{ cursor: 'pointer', margin: 0, color: '#25AAE1', fontWeight: 600 }}>
                                                Developer Mode: Skip Time Restrictions
                                            </label>
                                        </div>
                                    )}

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
                        <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
                                        <button className="btn" style={{ flex: '1 1 60px', background: 'rgba(37, 170, 225, 0.15)', color: '#25AAE1', padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setSelectedMeeting(m)}>
                                            <QrIcon size={16} style={{ marginRight: '0.3rem' }} /> QR
                                        </button>
                                        <button className="btn" style={{ flex: '2 1 100px', background: 'var(--glass-bg)', color: 'hsl(var(--color-text))', padding: '0.5rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)' }} onClick={() => setViewingAttendance(m)}>
                                            View Attendance
                                        </button>
                                        <button className="btn" style={{ flex: '1 1 60px', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', color: 'var(--color-text-dim)' }} onClick={() => downloadReport(m._id, m.name)}>
                                            <Download size={16} />
                                        </button>
                                        {['developer', 'superadmin'].includes(userRole) && (
                                            <button className="btn" style={{ flex: '0 0 40px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.5rem' }} onClick={() => deleteMeeting(m._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : activeTab === 'members' ? (
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
                                                                background: isRegular ? '#FFD700' : '#25AAE1'
                                                            }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem' }}>{m.totalAttended} meetings</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                                    {new Date(m.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    <div style={{ fontSize: '0.7rem', color: isGhosting ? '#dd5d6c' : 'var(--color-text-dim)' }}>
                                                        {daysSinceLast === 0 ? 'Today' : `${daysSinceLast} days ago`}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {/* Primary Status: The category they chose */}
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem',
                                                        background: m.memberType === 'Douloid' ? 'rgba(255, 215, 0, 0.1)' :
                                                            m.memberType === 'Recruit' ? 'rgba(37, 170, 225, 0.1)' :
                                                                'rgba(255, 255, 255, 0.05)',
                                                        color: m.memberType === 'Douloid' ? '#FFD700' :
                                                            m.memberType === 'Recruit' ? '#25AAE1' :
                                                                'var(--color-text-dim)',
                                                        borderRadius: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {m.memberType || 'Visitor'}
                                                    </span>

                                                    {/* Alert Status: Ghosting */}
                                                    {isGhosting && (
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem',
                                                            background: 'rgba(221, 93, 108, 0.1)',
                                                            color: '#dd5d6c',
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 'bold',
                                                            marginLeft: '0.5rem'
                                                        }}>
                                                            FOLLOW UP
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <ReportsView meetings={meetings} members={members} />
                )}

                {/* Attendance View Modal */}
                {viewingAttendance && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                    }}>
                        <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'hsl(var(--color-bg))', padding: 0, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>{viewingAttendance.name} - Attendance</h3>
                                <button className="btn" style={{ padding: '0.5rem 1rem' }} onClick={() => setViewingAttendance(null)}>Close</button>
                            </div>
                            <div style={{ overflow: 'auto', padding: '1rem', flex: 1 }}>
                                <AttendanceTable meeting={viewingAttendance} />
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
                        <div className="glass-panel qr-modal-content" style={{ padding: '2rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ marginBottom: '1rem' }}>Scan to Check In</h3>
                            <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '0.5rem' }}>
                                <QRCode
                                    value={`${window.location.origin}/check-in/${selectedMeeting.code}`}
                                    size={256}
                                    level="H"
                                />
                            </div>
                            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{selectedMeeting.name}</p>
                            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>{selectedMeeting.campus} | {selectedMeeting.startTime} - {selectedMeeting.endTime}</p>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '0.5rem 1.5rem' }}
                                    onClick={() => handlePrintQR(selectedMeeting)}
                                >
                                    <Download size={14} style={{ marginRight: '0.4rem' }} /> Print QR
                                </button>
                                <button
                                    className="btn"
                                    style={{ background: 'var(--glass-bg)', color: 'var(--color-text)', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const link = `${window.location.origin}/check-in/${selectedMeeting.code}`;
                                        navigator.clipboard.writeText(link);
                                        alert('Link copied to clipboard!');
                                    }}
                                >
                                    <LinkIcon size={14} style={{ marginRight: '0.4rem' }} /> Copy Link
                                </button>
                                {['developer', 'superadmin'].includes(userRole) && (
                                    <a
                                        href={`/check-in/${selectedMeeting.code}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn"
                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', fontSize: '0.8rem', padding: '0.5rem 1rem', textDecoration: 'none' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink size={14} style={{ marginRight: '0.4rem' }} /> Test
                                    </a>
                                )}
                            </div>
                            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginTop: '1.5rem', opacity: 0.7 }}>Click anywhere outside to close</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ReportsView = ({ meetings, members }) => {
    const [reportType, setReportType] = useState('summary'); // 'summary' or 'cumulative'
    const [filterSemester, setFilterSemester] = useState('Current');
    const [filterCampus, setFilterCampus] = useState('All');

    const getSemester = (date) => {
        const d = new Date(date);
        const month = d.getMonth(); // 0-11
        const year = d.getFullYear();
        if (month <= 4) return `Jan Semester ${year}`;
        if (month <= 7) return `May Semester ${year}`;
        return `Sept Semester ${year}`;
    };

    const currentSemester = getSemester(new Date());
    const semesters = Array.from(new Set(meetings.map(m => getSemester(m.date))));
    if (!semesters.includes(currentSemester)) semesters.push(currentSemester);

    const filteredMeetings = meetings.filter(m => {
        const semesterMatch = filterSemester === 'All' || getSemester(m.date) === (filterSemester === 'Current' ? currentSemester : filterSemester);
        const campusMatch = filterCampus === 'All' || m.campus === filterCampus;
        return semesterMatch && campusMatch;
    });

    const totalAttendance = filteredMeetings.reduce((acc, m) => acc + (m.attendanceCount || 0), 0);
    const averageAttendance = filteredMeetings.length > 0 ? (totalAttendance / filteredMeetings.length).toFixed(1) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Reports Dashboard</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            className="input-field"
                            style={{ padding: '0.4rem 2rem 0.4rem 1rem', width: 'auto' }}
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                        >
                            <option value="Current">Current Semester</option>
                            <option value="All">All Time</option>
                            {semesters.filter(s => s !== currentSemester).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            className="input-field"
                            style={{ padding: '0.4rem 2rem 0.4rem 1rem', width: 'auto' }}
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                        >
                            <option value="All">All Campuses</option>
                            <option value="Athi River">Athi River</option>
                            <option value="Valley Road">Valley Road</option>
                        </select>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '0.5rem' }}>
                            <button
                                onClick={() => setReportType('summary')}
                                style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                    background: reportType === 'summary' ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                                    color: reportType === 'summary' ? '#25AAE1' : 'var(--color-text-dim)',
                                    fontSize: '0.8rem', fontWeight: 600
                                }}
                            >Summary</button>
                            <button
                                onClick={() => setReportType('cumulative')}
                                style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                    background: reportType === 'cumulative' ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                                    color: reportType === 'cumulative' ? '#25AAE1' : 'var(--color-text-dim)',
                                    fontSize: '0.8rem', fontWeight: 600
                                }}
                            >Cumulative</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--color-primary-glow)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total Attendance</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#25AAE1' }}>{totalAttendance}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total Meetings</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa' }}>{filteredMeetings.length}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(250, 204, 21, 0.1)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Average per Meeting</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#facc15' }}>{averageAttendance}</div>
                    </div>
                </div>

                {reportType === 'summary' ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Meeting Name</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Date</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Campus</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMeetings.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{m.name}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(m.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>{m.campus}</td>
                                        <td style={{ padding: '1rem', fontWeight: 700, color: '#25AAE1' }}>{m.attendanceCount || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        <div style={{ padding: '1rem', background: 'rgba(37, 170, 225, 0.05)', border: '1px solid rgba(37, 170, 225, 0.1)', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#25AAE1' }}>
                            Showing members who attended meetings in <strong>{filterSemester === 'Current' ? currentSemester : filterSemester}</strong> {filterCampus !== 'All' ? `at ${filterCampus}` : 'across all campuses'}.
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Member Name</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Reg No</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Category</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Total (Period)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((m, i) => {
                                        // This is a rough estimation since members.insights is pre-aggregated
                                        // A real semester report would need a backend aggregate with date filters
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 600 }}>{m.details?.studentName || 'Unknown'}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>{m._id}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: m.memberType === 'Douloid' ? '#FFD700' : '#25AAE1' }}>
                                                        {m.memberType || 'Visitor'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 700 }}>{m.totalAttended}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AttendanceTable = ({ meeting }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const userRole = localStorage.getItem('role') || 'admin';

    const deleteRecord = async (id) => {
        if (!window.confirm('Delete this attendance record?')) return;
        try {
            await api.delete(`/attendance/${id}`);
            setRecords(records.filter(r => r._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };


    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await api.get(`/attendance/${meeting._id}`);
                setRecords(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [meeting._id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</div>;

    // Determine headers
    const allKeys = new Set();
    let sampleQuestion = '';

    records.forEach(r => {
        const responses = r.responses || {};
        Object.keys(responses).forEach(k => {
            if (k !== 'dailyQuestionAnswer') allKeys.add(k);
        });
        if (r.questionOfDay) sampleQuestion = r.questionOfDay;
    });

    const headers = Array.from(allKeys);
    // Add Daily Question to the end if any record has a question
    const hasDailyQuestion = records.some(r => r.responses?.dailyQuestionAnswer);

    // Filtering logic
    const filteredRecords = records.filter(r => {
        const searchPool = [
            ...(Object.values(r.responses || {})),
            r.memberType,
            r.studentRegNo
        ].join(' ').toLowerCase();
        return searchPool.includes(searchTerm.toLowerCase());
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
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-primary-glow)', borderRadius: '1rem' }}>
                    No students match your search.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Time</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Category</th>
                                {headers.map(h => (
                                    <th key={h} style={{ padding: '1rem', textTransform: 'capitalize', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>
                                        {h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </th>
                                ))}
                                {hasDailyQuestion && (
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)', minWidth: '200px' }}>
                                        Question of the Day
                                        <div style={{ fontSize: '0.7rem', fontWeight: 'normal', fontStyle: 'italic', marginTop: '4px' }}>
                                            "{meeting.questionOfDay || sampleQuestion || 'Daily Question'}"
                                        </div>
                                    </th>
                                )}
                                {['developer', 'superadmin'].includes(userRole) && (
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Action</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--color-primary))' }}>
                                        {r.memberType || 'Visitor'}
                                    </td>
                                    {headers.map(h => (
                                        <td key={h} style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                            {r.responses?.[h] || '-'}
                                        </td>
                                    ))}
                                    {hasDailyQuestion && (
                                        <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#a78bfa' }}>
                                            {r.responses?.dailyQuestionAnswer || '-'}
                                        </td>
                                    )}
                                    {['developer', 'superadmin'].includes(userRole) && (
                                        <td style={{ padding: '0.5rem 1rem' }}>
                                            <button
                                                onClick={() => deleteRecord(r._id)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
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
