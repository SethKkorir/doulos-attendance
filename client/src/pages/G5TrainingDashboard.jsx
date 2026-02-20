
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import QRCode from 'react-qr-code';
import {
    Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, Users,
    BarChart3, Activity, Trash2, Search, Link as LinkIcon, ExternalLink,
    Ghost, Pencil, Moon, Sun, BookOpen,
    ChevronDown, GraduationCap, RotateCcw,
    FileSpreadsheet, CheckCircle, ListChecks
} from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import MeetingInsights from '../components/MeetingInsights';

const G5TrainingDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    // State
    const [meetings, setMeetings] = useState([]);
    const [members, setMembers] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [insightMeeting, setInsightMeeting] = useState(null);
    const [msg, setMsg] = useState(null);
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'admin');
    const [g9Role, setG9Role] = useState(localStorage.getItem('g9Role') || 'G5');
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
    const [activeTab, setActiveTab] = useState('meetings');
    const [quickRegNo, setQuickRegNo] = useState('');
    const [quickCheckInLoading, setQuickCheckInLoading] = useState(false);

    // Member Management State
    const [memberSearch, setMemberSearch] = useState('');
    const [memberCampusFilter, setMemberCampusFilter] = useState('All');
    const [loadingMembers, setLoadingMembers] = useState(false);

    const [formData, setFormData] = useState({
        name: 'Weekly Training',
        date: new Date().toISOString().split('T')[0],
        campus: 'Athi River',
        startTime: '18:00',
        endTime: '20:00',
        semester: 'JAN-APR 2026',
        requiredFields: [],
        questionOfDay: '',
        location: { name: '', latitude: null, longitude: null, radius: 200 }
    });

    // Logout
    const logout = () => {
        localStorage.clear();
        navigate('/admin');
    };

    // Dark Mode
    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isDarkMode]);

    // Fetch Meetings
    const fetchMeetings = async () => {
        if (isGuest) {
            setMeetings([{ _id: '1', name: 'Guest Training', date: new Date().toISOString(), isActive: true, campus: 'Athi River', startTime: '18:00', endTime: '20:00' }]);
            return;
        }
        try {
            const res = await api.get('/meetings');
            const sorted = res.data.sort((a, b) => {
                if (a.isActive === b.isActive) return new Date(b.date) - new Date(a.date);
                return a.isActive ? -1 : 1;
            });
            setMeetings(sorted);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to sync meetings.' });
        }
    };

    // Fetch Members
    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const res = await api.get('/members');
            setMembers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchMembers();
    }, []);

    // Create Meeting
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/meetings', formData);
            setMsg({ type: 'success', text: 'Training session created!' });
            setShowCreate(false);
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create.' });
        }
    };

    // Quick Check-In
    const handleQuickCheckIn = async (meetingId) => {
        if (!quickRegNo) return;
        setQuickCheckInLoading(true);
        try {
            await api.post('/attendance/manual', {
                meetingId,
                studentRegNo: quickRegNo,
            });
            setMsg({ type: 'success', text: `Checked in ${quickRegNo}` });
            setQuickRegNo('');
            // Refresh insights if open
            if (insightMeeting && insightMeeting._id === meetingId) {
                // Trigger re-fetch logic for insights if needed, or just let user re-open
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Check-in failed.' });
        } finally {
            setQuickCheckInLoading(false);
        }
    };

    // Rendering Logic
    const renderMeetingCard = (m) => {
        const isActive = m.isActive;
        return (
            <div key={m._id} className="glass-panel" style={{ padding: '1.5rem', border: isActive ? '1px solid #4ade80' : '1px solid var(--glass-border)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{m.name}</h3>
                    {isActive && <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 'bold' }}>● LIVE</span>}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                    {new Date(m.date).toLocaleDateString()} • {m.startTime}-{m.endTime}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                    <MapPin size={12} style={{ display: 'inline' }} /> {m.campus}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    {isActive && (
                        <button className="btn" style={{ background: 'rgba(37,170,225,0.1)', color: '#25AAE1', flex: 1 }} onClick={() => setSelectedMeeting(m)}>
                            <QrIcon size={16} /> QR Code
                        </button>
                    )}
                    <button className="btn" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', flex: 1 }} onClick={() => setInsightMeeting(m)}>
                        <BarChart3 size={16} /> Insights
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            <BackgroundGallery />
            <ValentineRain />

            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
                {/* Header */}
                <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Logo size={40} />
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{g9Role === 'G6' ? 'G6 Command Center' : 'G5 Command Center'}</h1>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Training & Attendance Oversight</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <a href="/Team Building Handbook.pdf" target="_blank" className="btn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <BookOpen size={16} /> Handbook
                        </a>
                        <button className="btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="btn" onClick={logout} style={{ background: 'rgba(255,255,255,0.1)' }}>Logout</button>
                    </div>
                </header>

                {/* Notifications */}
                {msg && (
                    <div style={{
                        position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
                        padding: '1rem 2rem', borderRadius: '0.5rem',
                        background: msg.type === 'error' ? '#ef4444' : '#10b981', color: 'white', fontWeight: 'bold'
                    }}>
                        {msg.text}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn"
                        style={{ background: activeTab === 'meetings' ? 'hsl(var(--color-primary))' : 'rgba(255,255,255,0.05)' }}
                        onClick={() => setActiveTab('meetings')}
                    >
                        Sessions & Meetings
                    </button>
                    <button
                        className="btn"
                        style={{ background: activeTab === 'members' ? 'hsl(var(--color-primary))' : 'rgba(255,255,255,0.05)' }}
                        onClick={() => setActiveTab('members')}
                    >
                        Member Registry
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'meetings' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Training Sessions</h2>
                            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                                <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Session
                            </button>
                        </div>

                        {/* Create Form */}
                        {showCreate && (
                            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid hsl(var(--color-primary))' }}>
                                <h3 style={{ marginTop: 0 }}>Schedule New Session</h3>
                                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input className="input-field" placeholder="Session Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                    <input className="input-field" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                    <input className="input-field" type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                                    <input className="input-field" type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                                    <select className="input-field" value={formData.campus} onChange={e => setFormData({ ...formData, campus: e.target.value })}>
                                        <option value="Athi River">Athi River</option>
                                        <option value="Valley Road">Valley Road</option>
                                    </select>
                                    <button className="btn btn-primary" style={{ gridColumn: '1/-1' }}>Create Session</button>
                                </form>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {meetings.map(renderMeetingCard)}
                        </div>
                    </>
                )}

                {activeTab === 'members' && (
                    <div>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2>Members Directory</h2>
                                <input
                                    className="input-field"
                                    placeholder="Search members..."
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                    style={{ width: '300px' }}
                                />
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Name</th>
                                        <th style={{ padding: '1rem' }}>Reg No</th>
                                        <th style={{ padding: '1rem' }}>Campus</th>
                                        <th style={{ padding: '1rem' }}>Category</th>
                                        <th style={{ padding: '1rem' }}>Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingMembers ? (
                                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                                    ) : (
                                        members.filter(m =>
                                            m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                            m.studentRegNo.toLowerCase().includes(memberSearch.toLowerCase())
                                        ).slice(0, 50).map(m => ( // Limit to 50 for performance
                                            <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem' }}>{m.name}</td>
                                                <td style={{ padding: '1rem', opacity: 0.7 }}>{m.studentRegNo}</td>
                                                <td style={{ padding: '1rem' }}>{m.campus}</td>
                                                <td style={{ padding: '1rem' }}>{m.memberType}</td>
                                                <td style={{ padding: '1rem', color: '#FFD700', fontWeight: 'bold' }}>{m.totalPoints}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* QR Modal */}
                {selectedMeeting && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setSelectedMeeting(null)}>
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', background: 'white', color: 'black' }} onClick={e => e.stopPropagation()}>
                            <QRCode value={`${window.location.origin}/check-in/${selectedMeeting.code}`} size={300} />
                            <h2 style={{ marginTop: '1.5rem', color: 'black' }}>{selectedMeeting.name}</h2>
                            <p style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '5px' }}>{selectedMeeting.code}</p>
                        </div>
                    </div>
                )}

                {/* Insights Modal */}
                {insightMeeting && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2500, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                        <div style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <MeetingInsights meeting={insightMeeting} onClose={() => setInsightMeeting(null)} api={api} onQuickCheckIn={handleQuickCheckIn} />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default G5TrainingDashboard;
