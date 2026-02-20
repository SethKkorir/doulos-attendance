
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import {
    LayoutDashboard, Users, Calendar, Settings, LogOut, Sun, Moon,
    Briefcase, Sparkles, Target, BookOpen, Heart, Globe, CreditCard,
    Monitor, Folder, ListChecks, Plus, Trash2, Pencil, Search, BarChart3,
    Trophy, MapPin, X, QrCode as QrIcon
} from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import MeetingInsights from '../components/MeetingInsights';
import QRCode from 'react-qr-code';

const ROLE_CONFIG = {
    'G1': { title: 'Coordinator Dashboard', subtitle: 'Executive Leadership', icon: Target, theme: '#3b82f6' },
    'G2': { title: 'Vice Coordinator Dashboard', subtitle: 'Executive Leadership', icon: Target, theme: '#3b82f6' },
    'G3': { title: 'Secretary Dashboard', subtitle: 'Administration & Records', icon: BookOpen, theme: '#8b5cf6' },
    'G4': { title: 'Org. Secretary Dashboard', subtitle: 'Events & Logistics', icon: Calendar, theme: '#f59e0b' },
    'G6': { title: 'Welfare Dashboard', subtitle: 'Member Care & Community', icon: Heart, theme: '#ec4899' },
    'G8': { title: 'Assets Dashboard', subtitle: 'Logistics & Inventory', icon: Briefcase, theme: '#10b981' },
    'G9': { title: 'Media Dashboard', subtitle: 'Projects & Technology', icon: Monitor, theme: '#6366f1' },
    // G5 (Training) and G7 (Finance) have custom dashboards
};

const GGenericDashboard = ({ roleId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
    const [meetings, setMeetings] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('meetings');
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [insightMeeting, setInsightMeeting] = useState(null);
    const [msg, setMsg] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const config = ROLE_CONFIG[roleId] || { title: `${roleId} Dashboard`, subtitle: 'General Management', icon: LayoutDashboard, theme: '#64748b' };
    const ThemeIcon = config.icon;

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isDarkMode]);

    const fetchData = async () => {
        setLoading(true);
        if (isGuest) {
            setMeetings([{ _id: '1', name: 'Guest Meeting', date: new Date().toISOString(), isActive: true, startTime: '18:00', endTime: '20:00', campus: 'Athi River' }]);
            setMembers([{ _id: '1', name: 'Guest Member', studentRegNo: '12-3456', memberType: 'Visitor', totalPoints: 10, campus: 'Athi River' }]);
            setLoading(false);
            return;
        }

        try {
            const [mRes, memRes] = await Promise.all([
                api.get('/meetings'),
                api.get('/members')
            ]);
            setMeetings(mRes.data.sort((a, b) => new Date(b.date) - new Date(a.date))); // Sort by date desc
            setMembers(memRes.data);
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to load data.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            // Refresh insights if open
            if (insightMeeting && insightMeeting._id === meetingId) {
                // Ideally, trigger refresh inside MeetingInsights, but closing/reopening works for now or let user refresh
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Check-in failed.' });
        }
    }


    const renderMeetingCard = (m) => {
        const isActive = m.isActive;
        return (
            <div key={m._id} className="glass-panel" style={{ padding: '1.5rem', border: isActive ? `1px solid ${config.theme}` : '1px solid var(--glass-border)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{m.name}</h3>
                    {isActive && <span style={{ color: config.theme, fontSize: '0.8rem', fontWeight: 'bold' }}>● LIVE</span>}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                    {new Date(m.date).toLocaleDateString()} • {m.startTime}-{m.endTime}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                    <MapPin size={12} style={{ display: 'inline' }} /> {m.campus}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    {isActive && (
                        <button className="btn" style={{ background: `rgba(${parseInt(config.theme.slice(1, 3), 16)}, ${parseInt(config.theme.slice(3, 5), 16)}, ${parseInt(config.theme.slice(5, 7), 16)}, 0.1)`, color: config.theme, flex: 1 }} onClick={() => setSelectedMeeting(m)}>
                            <QrIcon size={16} /> QR Code
                        </button>
                    )}
                    <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', flex: 1 }} onClick={() => setInsightMeeting(m)}>
                        <BarChart3 size={16} /> Insights
                    </button>
                </div>
            </div>
        );
    };

    // Filter members based on search
    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.studentRegNo.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
            <BackgroundGallery show={true} />
            <ValentineRain />

            <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
                {/* Header */}
                <header style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '3rem', background: `rgba(${parseInt(config.theme.slice(1, 3), 16)}, ${parseInt(config.theme.slice(3, 5), 16)}, ${parseInt(config.theme.slice(5, 7), 16)}, 0.1)`,
                    padding: '1.5rem 2rem', borderRadius: '1.5rem',
                    border: `1px solid rgba(${parseInt(config.theme.slice(1, 3), 16)}, ${parseInt(config.theme.slice(3, 5), 16)}, ${parseInt(config.theme.slice(5, 7), 16)}, 0.2)`,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="logo-container" style={{ transform: 'scale(0.8)' }}>
                            <Logo />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>
                                <span style={{ color: config.theme }}>{config.title.toUpperCase()}</span>
                            </h1>
                            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ThemeIcon size={14} /> {config.subtitle}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button onClick={logout} className="btn" style={{
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.6rem 1.2rem',
                            display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem'
                        }}>
                            <LogOut size={16} /> LOGOUT
                        </button>
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

                {/* Navigation Tabs */}
                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn"
                        style={{ background: activeTab === 'meetings' ? config.theme : 'rgba(255,255,255,0.05)', color: activeTab === 'meetings' ? 'white' : 'var(--color-text-dim)' }}
                        onClick={() => setActiveTab('meetings')}
                    >
                        <Calendar size={16} style={{ marginRight: '0.5rem' }} /> Meetings & Events
                    </button>
                    <button
                        className="btn"
                        style={{ background: activeTab === 'members' ? config.theme : 'rgba(255,255,255,0.05)', color: activeTab === 'members' ? 'white' : 'var(--color-text-dim)' }}
                        onClick={() => setActiveTab('members')}
                    >
                        <Users size={16} style={{ marginRight: '0.5rem' }} /> Member Directory
                    </button>
                </div>

                {/* Dashboard Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>Loading Dashboard...</div>
                ) : (
                    <>
                        {activeTab === 'meetings' && (
                            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h2 style={{ margin: 0 }}>Scheduled Meetings</h2>
                                    {/* Only G4 (Organizing Secretary) or G1/G2/G3 (Execs) usually create meetings, but for now allow generic creation if needed or restrict */}
                                </div>

                                {meetings.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>No meetings found.</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                                        {meetings.map(renderMeetingCard)}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                                <div className="glass-panel" style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <h2 style={{ margin: 0 }}>Member Directory</h2>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                                            <input
                                                className="input-field"
                                                placeholder="Search members..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                style={{ paddingLeft: '2.5rem', width: '300px' }}
                                            />
                                        </div>
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                                <th style={{ padding: '1rem' }}>Name</th>
                                                <th style={{ padding: '1rem' }}>Reg No</th>
                                                <th style={{ padding: '1rem' }}>Campus</th>
                                                <th style={{ padding: '1rem' }}>Type</th>
                                                <th style={{ padding: '1rem' }}>Points</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMembers.slice(0, 50).map(m => (
                                                <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{m.name}</td>
                                                    <td style={{ padding: '1rem', opacity: 0.7 }}>{m.studentRegNo}</td>
                                                    <td style={{ padding: '1rem' }}>{m.campus}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                                            background: m.memberType === 'Douloid' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
                                                            color: m.memberType === 'Douloid' ? '#FFD700' : 'var(--color-text-dim)'
                                                        }}>
                                                            {m.memberType}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#FFD700', fontWeight: 'bold' }}>{m.totalPoints}</td>
                                                </tr>
                                            ))}
                                            {filteredMembers.length === 0 && (
                                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No members found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                    {filteredMembers.length > 50 && (
                                        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', opacity: 0.5 }}>
                                            Showing first 50 results. Use search to find specific members.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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

export default GGenericDashboard;
