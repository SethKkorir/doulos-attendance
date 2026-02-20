
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import QRCode from 'react-qr-code';
import {
    Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, Users,
    BarChart3, Activity, Trash2, Search, Link as LinkIcon, ExternalLink,
    Ghost, Pencil, Moon, Sun, BookOpen, Quote,
    ChevronDown, GraduationCap, RotateCcw,
    FileSpreadsheet, CheckCircle, ListChecks
} from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import MeetingInsights from '../components/MeetingInsights';

const SpiritualDashboard = () => {
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
    const [g9Role, setG9Role] = useState(localStorage.getItem('g9Role') || 'G3');
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
    const [activeTab, setActiveTab] = useState('meetings');
    const [quickRegNo, setQuickRegNo] = useState('');
    const [semesterSettings, setSemesterSettings] = useState({ theme: 'Unstoppable', verse: 'Acts 28:31' });
    const [loadingSettings, setLoadingSettings] = useState(false);


    const [formData, setFormData] = useState({
        name: 'Weekly Fellowship',
        date: new Date().toISOString().split('T')[0],
        campus: 'Athi River',
        startTime: '19:00',
        endTime: '21:00',
        semester: 'JAN-APR 2026',
        requiredFields: [],
        questionOfDay: '',  // Used for sermon/word sometimes
        location: { name: '', latitude: null, longitude: null, radius: 200 }
    });

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

    const fetchMeetings = async () => {
        if (isGuest) {
            setMeetings([{ _id: '1', name: 'Guest Fellowship', date: new Date().toISOString(), isActive: true, campus: 'Athi River', startTime: '19:00', endTime: '21:00' }]);
            return;
        }
        try {
            const res = await api.get('/meetings');
            const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setMeetings(sorted);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to sync meetings.' });
        }
    };

    // Simulate fetching semester settings (In a real app, this would be an API call to /settings)
    useEffect(() => {
        // Mock fetch settings
        fetchMeetings();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/meetings', formData);
            setMsg({ type: 'success', text: 'Fellowship session created!' });
            setShowCreate(false);
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to create.' });
        }
    };

    const logout = () => {
        localStorage.clear();
        navigate('/admin');
    };

    const handleQuickCheckIn = async (meetingId, regNo) => {
        try {
            await api.post('/attendance/manual', {
                meetingId,
                studentRegNo: regNo,
            });
            setMsg({ type: 'success', text: `Checked in ${regNo}` });
        } catch (err) {
            setMsg({ type: 'error', text: 'Check-in failed.' });
        }
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            <BackgroundGallery show={true} />
            <ValentineRain />

            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
                <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Logo size={40} />
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Spiritual Directorate</h1>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>{g9Role} • Theme & Word Oversight</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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

                {/* Spiritual Focus Panel */}
                <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa' }}>
                                <BookOpen size={20} /> Semester Theme
                            </h3>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                "{semesterSettings.theme}"
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: 0.7 }}>
                                <Quote size={14} /> {semesterSettings.verse}
                            </div>
                            {/* In future, add Edit button here to pop up a modal to change global settings */}
                        </div>
                        <div style={{ flex: 1, minWidth: '250px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, color: '#f472b6' }}>Guidance & Word</h3>
                            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                                As Spiritual Coordinator, you oversee the spiritual direction of the semester. Ensure every meeting has a "Word of the Day" recorded.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn"
                        style={{ background: activeTab === 'meetings' ? '#8b5cf6' : 'rgba(255,255,255,0.05)' }}
                        onClick={() => setActiveTab('meetings')}
                    >
                        Fellowships & Services
                    </button>
                </div>

                {activeTab === 'meetings' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Fellowship Sessions</h2>
                            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                                <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Service
                            </button>
                        </div>

                        {showCreate && (
                            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid #8b5cf6' }}>
                                <h3 style={{ marginTop: 0 }}>Schedule Service / Fellowship</h3>
                                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input className="input-field" placeholder="Service Name (e.g., Weekly Fellowship)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                    <input className="input-field" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                    <input className="input-field" type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                                    <input className="input-field" type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                                    <input className="input-field" placeholder="Word of the Day / Sermon Topic (Optional)" value={formData.questionOfDay} onChange={e => setFormData({ ...formData, questionOfDay: e.target.value })} style={{ gridColumn: '1/-1' }} />
                                    <select className="input-field" value={formData.campus} onChange={e => setFormData({ ...formData, campus: e.target.value })}>
                                        <option value="Athi River">Athi River</option>
                                        <option value="Valley Road">Valley Road</option>
                                    </select>
                                    <button className="btn btn-primary" style={{ gridColumn: '1/-1', background: '#8b5cf6', borderColor: '#8b5cf6' }}>Create Service</button>
                                </form>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {meetings.map((m) => {
                                const isActive = m.isActive;
                                return (
                                    <div key={m._id} className="glass-panel" style={{ padding: '1.5rem', border: isActive ? '1px solid #8b5cf6' : '1px solid var(--glass-border)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{m.name}</h3>
                                            {isActive && <span style={{ color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 'bold' }}>● LIVE</span>}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                                            {new Date(m.date).toLocaleDateString()} • {m.startTime}-{m.endTime}
                                        </div>
                                        {m.questionOfDay && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#f472b6', fontStyle: 'italic' }}>
                                                "{m.questionOfDay}"
                                            </div>
                                        )}

                                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                            {isActive && (
                                                <button className="btn" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', flex: 1 }} onClick={() => setSelectedMeeting(m)}>
                                                    <QrIcon size={16} /> QR Code
                                                </button>
                                            )}
                                            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1 }} onClick={() => setInsightMeeting(m)}>
                                                <BarChart3 size={16} /> Insights
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
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

export default SpiritualDashboard;
