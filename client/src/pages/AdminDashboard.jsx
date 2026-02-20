import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import QRCode from 'react-qr-code';
import {
    Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, Users,
    BarChart3, Activity, Trash2, Search, Link as LinkIcon, ExternalLink,
    ShieldAlert as Ghost, ShieldAlert, Sun, Moon, Pencil, Trophy, GraduationCap, RotateCcw,
    FileSpreadsheet, ChevronDown, UploadCloud, CreditCard, Wallet, Filter, Check, X,
    FileText, ListChecks, Settings as SettingsIcon, CheckCircle, Archive
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import AdminFinanceView from '../components/AdminFinanceView';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const MeetingInsights = ({ meeting, onClose, api, onQuickCheckIn }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [insightSearch, setInsightSearch] = useState('');

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            try {
                // Fetch attendance for this meeting
                const attRes = await api.get(`/attendance/${meeting._id}`);
                const attendance = attRes.data;

                // Fetch all members for this campus
                const memRes = await api.get(`/members?campus=${meeting.campus}`);
                const allMembers = memRes.data;

                // present reg nos (Normalized)
                const presentRegNos = new Set(attendance.map(a => String(a.studentRegNo).trim().toUpperCase()));

                // absent members (Normalized Check)
                const absent = allMembers.filter(m => !presentRegNos.has(String(m.studentRegNo).trim().toUpperCase()));

                // breakdown
                const breakdown = attendance.reduce((acc, curr) => {
                    acc[curr.memberType] = (acc[curr.memberType] || 0) + 1;
                    return acc;
                }, {});

                // Recruits (First timers) in this meeting
                const recruitsCount = attendance.filter(a => a.memberType === 'Recruit').length;

                setStats({
                    presentCount: attendance.length,
                    absentCount: absent.length,
                    absentList: absent,
                    presentList: attendance,
                    breakdown,
                    recruitsCount,
                    totalEligible: allMembers.length
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [meeting, api]);

    if (loading) return (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="loading-spinner-small" style={{ margin: '0 auto 1.5rem', width: '50px', height: '50px', borderTopColor: 'hsl(var(--color-primary))' }}></div>
            <p style={{ fontWeight: 800, letterSpacing: '2px', color: 'hsl(var(--color-primary))', fontSize: '0.8rem' }}>DECODING ATTENDANCE PATTERNS...</p>
        </div>
    );

    if (!stats) return null;

    const rate = Math.round((stats.presentCount / stats.totalEligible) * 100) || 0;

    const filteredAbsent = stats.absentList.filter(m => {
        const cleanSearch = insightSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = m.studentRegNo.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch);
    });

    const filteredPresent = stats.presentList.filter(a => {
        const cleanSearch = insightSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = (a.responses?.studentName || 'Member').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = a.studentRegNo.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch);
    });

    return (
        <div className="glass-panel" style={{
            padding: '2.5rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(124, 58, 237, 0.5)',
            animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(124, 58, 237, 0.15)', borderRadius: '1rem' }}>
                            <BarChart3 size={32} color="hsl(var(--color-primary))" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 950, letterSpacing: '-1px', color: 'white' }}>Meeting Insights</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                                {meeting.name} • {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="btn"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '1px'
                    }}
                >
                    EXIT ANALYSIS
                </button>
            </div>

            {/* Smart Search Bar */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '1.25rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255,255,255,0.3)'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Live filter missed members or participants by name or admission number..."
                        value={insightSearch}
                        onChange={e => setInsightSearch(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '1rem 1.5rem 1rem 3.5rem',
                            borderRadius: '1.25rem',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                    />
                    {insightSearch && (
                        <button
                            onClick={() => setInsightSearch('')}
                            style={{
                                position: 'absolute',
                                right: '1.25rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '1rem' }}>PRESENCE</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: '#25AAE1', lineHeight: 1 }}>{stats.presentCount}</div>
                        <div style={{ fontSize: '1rem', opacity: 0.4, fontWeight: 700 }}>/ {stats.totalEligible}</div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(37, 170, 225, 0.8)', marginTop: '0.75rem', fontWeight: 600 }}>{stats.recruitsCount} First Timers (Recruits)</div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                        <Users size={80} />
                    </div>
                </div>

                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '1rem' }}>REACH RATE</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: '#4ade80', lineHeight: 1 }}>{rate}%</div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '1.25rem', overflow: 'hidden' }}>
                        <div style={{ width: `${rate}%`, height: '100%', background: '#4ade80', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                    </div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                        <Activity size={80} />
                    </div>
                </div>

                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '1rem' }}>ATTRITION</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: '#f87171', lineHeight: 1 }}>{stats.absentCount}</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(248, 113, 113, 0.8)', marginTop: '0.75rem', fontWeight: 600 }}>Members did not attend</div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                        <Ghost size={80} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Ghost size={20} color="#f87171" />
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>MISSED MEMBERS ({filteredAbsent.length})</h4>
                        </div>
                    </div>
                    <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.75rem' }}>
                        {filteredAbsent.length === 0 ? (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{insightSearch ? '🔍' : '🏆'}</div>
                                <h3 style={{ margin: 0, color: insightSearch ? 'white' : '#4ade80' }}>{insightSearch ? 'No matches found' : '100% Attendance!'}</h3>
                                <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>{insightSearch ? `Nobody matching "${insightSearch}" was found in the missed list.` : 'Every registered member shows up. Outstanding!'}</p>
                            </div>
                        ) : filteredAbsent.map(m => (
                            <div key={m._id} style={{
                                padding: '1.25rem',
                                background: 'rgba(239, 68, 68, 0.04)',
                                border: '1px solid rgba(239, 68, 68, 0.1)',
                                borderRadius: '1.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700 }}>{m.studentRegNo}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        fontSize: '0.65rem',
                                        padding: '0.4rem 0.75rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '2rem',
                                        fontWeight: 900,
                                        color: '#f87171',
                                        border: '1px solid rgba(248, 113, 113, 0.2)'
                                    }}>{m.memberType.toUpperCase()}</div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onQuickCheckIn(meeting._id, m.studentRegNo);
                                        }}
                                        className="btn"
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            background: 'rgba(74, 222, 128, 0.1)',
                                            color: '#4ade80',
                                            fontSize: '0.7rem',
                                            fontWeight: 900,
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(74, 222, 128, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}
                                    >
                                        <CheckCircle size={14} /> MARK PRESENT
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Users size={20} color="#4ade80" />
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>PARTICIPANTS ({filteredPresent.length})</h4>
                        </div>
                    </div>
                    <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.75rem' }}>
                        {filteredPresent.length === 0 ? (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{insightSearch ? '🔍' : '⏳'}</div>
                                <h3 style={{ margin: 0, color: 'white' }}>{insightSearch ? 'No matches found' : 'No participants yet'}</h3>
                                <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>{insightSearch ? `Nobody matching "${insightSearch}" was found in participants.` : 'Waiting for members to check in...'}</p>
                            </div>
                        ) : filteredPresent.map(a => (
                            <div key={a._id} style={{
                                padding: '1.25rem',
                                background: 'rgba(74, 222, 128, 0.04)',
                                border: '1px solid rgba(74, 222, 128, 0.1)',
                                borderRadius: '1.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white' }}>{a.responses.studentName || 'Member'}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700 }}>{a.studentRegNo}</div>
                                </div>
                                <div style={{
                                    fontSize: '0.65rem',
                                    padding: '0.4rem 0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '2rem',
                                    fontWeight: 900,
                                    color: '#4ade80',
                                    border: '1px solid rgba(74, 222, 128, 0.2)'
                                }}>{a.memberType.toUpperCase()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const location = useLocation();
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    useEffect(() => {
        if (location.state?.isGuest) {
            localStorage.setItem('isGuest', 'true');
        }
    }, [location.state]);

    const [meetings, setMeetings] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null); // For QR Modal
    const [insightMeeting, setInsightMeeting] = useState(null); // For detailed insights
    const [editingMeeting, setEditingMeeting] = useState(null); // For Edit Modal
    const [formData, setFormData] = useState({
        name: 'Weekly Doulos',
        date: new Date().toISOString().split('T')[0],
        campus: 'Athi River',
        startTime: '20:30',
        endTime: '23:00',
        semester: 'JAN-APR 2026',
        category: 'Meeting',
        allowManualOverride: false,
        requiredFields: [
            { label: 'Full Name', key: 'studentName', required: true },
            { label: 'Admission Number', key: 'studentRegNo', required: true }
        ],
        questionOfDay: '',
        location: {
            name: '',
            latitude: null,
            longitude: null,
            radius: 200
        }
    });
    const [msg, setMsg] = useState(null);
    const [guestFeaturesEnabled, setGuestFeaturesEnabled] = useState(true);
    const [viewingAttendance, setViewingAttendance] = useState(null); // Meeting object
    const [activeTab, setActiveTab] = useState('meetings'); // 'meetings', 'trainings', 'members', 'finance', or 'reports'
    const [financeTab, setFinanceTab] = useState('pending'); // 'pending' or 'log-cash'
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'admin');
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
    const [quickRegNo, setQuickRegNo] = useState('');
    const [quickCheckInLoading, setQuickCheckInLoading] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [memberCampusFilter, setMemberCampusFilter] = useState('All');
    const [memberTypeFilter, setMemberTypeFilter] = useState('All');
    const [editingMember, setEditingMember] = useState(null);
    const [memberInsights, setMemberInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [meetingSemesterFilter, setMeetingSemesterFilter] = useState('Current');
    const [trainingSemesterFilter, setTrainingSemesterFilter] = useState('Current');
    const [admins, setAdmins] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isEditingMemberProfile, setIsEditingMemberProfile] = useState(false);
    const [locationSource, setLocationSource] = useState(null); // 'gps' or 'default'
    const [currentSemester, setCurrentSemester] = useState('JAN-APR 2026');
    const [showBulkListTool, setShowBulkListTool] = useState(false);
    const [bulkListType, setBulkListType] = useState('graduate'); // 'graduate' or 'archive'
    const [bulkListInput, setBulkListInput] = useState('');
    // --- TRAINING STATE ---
    const [trainings, setTrainings] = useState([]);
    const [showCreateTraining, setShowCreateTraining] = useState(false);
    const [trainingFormData, setTrainingFormData] = useState({
        name: 'Doulos Training',
        date: new Date().toISOString().split('T')[0],
        campus: 'Athi River',
        startTime: '14:00',
        endTime: '17:00',
        semester: 'JAN-APR 2026',
        requiredFields: [
            { label: 'Full Name', key: 'studentName', required: true },
            { label: 'Admission Number', key: 'studentRegNo', required: true }
        ],
        questionOfDay: '',
        location: { name: '', latitude: null, longitude: null, radius: 200 }
    });
    const [selectedTraining, setSelectedTraining] = useState(null); // for QR modal

    useEffect(() => {
        if (['developer', 'superadmin', 'SuperAdmin'].includes(userRole)) {
            fetchAdmins();
        }
    }, [userRole]);

    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        if (isGuest) {
            setAdmins([
                { _id: '1', username: 'Guest Admin', role: 'admin', campus: 'Valley Road' },
                { _id: '2', username: 'Guest SuperUser', role: 'superadmin', campus: 'Athi River' }
            ]);
            setLoadingAdmins(false);
            return;
        }
        try {
            const { data } = await api.get('/auth/users');
            setAdmins(data);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
        } finally {
            setLoadingAdmins(false);
        }
    };

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isDarkMode]);

    // --- IDLE TIMER (AUTO LOCK) ---
    useEffect(() => {
        let timeout;

        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // Auto lock after 5 minutes of inactivity
                localStorage.clear();
                window.location.href = '/admin';
            }, 5 * 60 * 1000); // 5 minutes
        };

        // Events to listen for activity
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        // Start timer initially
        resetTimer();

        return () => {
            clearTimeout(timeout);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, []);

    const fetchMeetings = async () => {
        if (isGuest) {
            setMeetings([
                { _id: '1', name: 'Weekly Fellowship', date: new Date().toISOString(), isActive: true, campus: 'Valley Road', attendees: 45 },
                { _id: '2', name: 'Leadership Summit', date: new Date(Date.now() - 86400000 * 7).toISOString(), isActive: false, campus: 'Valley Road', attendees: 120 },
                { _id: '3', name: 'Prayer Night', date: new Date(Date.now() - 86400000 * 14).toISOString(), isActive: false, campus: 'Athi River', attendees: 30 }
            ]);
            return;
        }

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
            setMsg({ type: 'error', text: 'Failed to sync with server' });
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

    useEffect(() => {
        let timer;
        if (msg) {
            timer = setTimeout(() => setMsg(null), 4000);
        }
        return () => clearTimeout(timer);
    }, [msg]);

    const fetchMembers = async (forMembersTab = false) => {
        setLoadingMembers(true);
        if (isGuest) {
            setMembers([
                { _id: '1', name: 'Guest Member 1', studentRegNo: 'GM-001', memberType: 'Douloid', campus: 'Valley Road', totalPoints: 120, totalAttended: 15, lastSeen: new Date().toISOString() },
                { _id: '2', name: 'Guest Member 2', studentRegNo: 'GM-002', memberType: 'Recruit', campus: 'Athi River', totalPoints: 50, totalAttended: 5, lastSeen: new Date().toISOString() },
                { _id: '3', name: 'Guest Member 3', studentRegNo: 'GM-003', memberType: 'Visitor', campus: 'Valley Road', totalPoints: 10, totalAttended: 1, lastSeen: new Date().toISOString() },
            ]);
            setLoadingMembers(false);
            return;
        }
        try {
            const res = await api.get('/members', {
                params: {
                    campus: memberCampusFilter,
                    memberType: memberTypeFilter,
                    // Only include archived members when on the members tab (for the Archived section)
                    ...(forMembersTab && { includeArchived: 'true' })
                }
            });
            setMembers(res.data);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to fetch members directory' });
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchTrainings();
        fetchMembers(); // Load members early for quick lookup
    }, []);

    const fetchTrainings = async () => {
        try {
            const res = await api.get('/trainings');
            setTrainings(res.data);
        } catch (err) {
            console.error('Failed to fetch trainings', err);
        }
    };

    const handleCreateTraining = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Creation disabled in Guest Mode.' });
        if (!trainingFormData.location.name) return setMsg({ type: 'error', text: 'Venue name is required.' });
        setImportLoading(true);
        try {
            await api.post('/trainings', trainingFormData);
            setMsg({ type: 'success', text: 'Training session created!' });
            setShowCreateTraining(false);
            fetchTrainings();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create training' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleDeleteTraining = async (id, name) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        const password = window.prompt(`SECURITY CHECK: Enter admin password to DELETE "${name}":`);;
        if (!password) return;
        setImportLoading(true);
        try {
            const res = await api.post(`/trainings/${id}/delete-secure`, { confirmPassword: password });
            setMsg({ type: 'success', text: res.data.message });
            fetchTrainings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Deletion failed: ' + (err.response?.data?.message || 'Server error') });
        } finally {
            setImportLoading(false);
        }
    };

    const handleToggleTrainingStatus = async (id, currentStatus) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        try {
            await api.patch(`/trainings/${id}`, { isActive: !currentStatus });
            setMsg({ type: 'success', text: `Training ${!currentStatus ? 'opened' : 'closed'}.` });
            fetchTrainings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update training status' });
        }
    };

    useEffect(() => {
        if (activeTab === 'members') fetchMembers(true);
    }, [activeTab, memberCampusFilter, memberTypeFilter]);

    const handleCSVUpload = async (e) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Import disabled in Guest Mode.' });
        const file = e.target.files[0];
        if (!file) return;

        setImportLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                if (values.length < headers.length) return null;
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i]?.trim();
                });
                return obj;
            }).filter(d => d && d.name && (d.studentregno || d.regno));

            // Map keys to match our model
            const members = data.map(d => ({
                name: d.name,
                studentRegNo: d.studentregno || d.regno,
                memberType: d.type || d.membertype || 'Visitor',
                campus: d.campus || 'Athi River'
            }));

            try {
                await api.post('/members/import', { members });
                setMsg({ type: 'success', text: `Imported ${members.length} members successfully!` });
                fetchMembers();
            } catch (err) {
                setMsg({ type: 'error', text: 'Import failed: ' + (err.response?.data?.message || 'Check CSV format') });
            } finally {
                setImportLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleSyncRegistry = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('This will create registry profiles for everyone in your attendance history. Proceed?')) return;
        setImportLoading(true);
        try {
            const res = await api.post('/members/sync');
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Sync failed' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleBulkEnroll = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm(`This will automatically ENROLL all members who checked into any meetings assigned to ${currentSem}. Continue?`)) return;

        setImportLoading(true);
        try {
            const res = await api.post('/members/bulk-enroll');
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Bulk enrollment failed' });
        } finally {
            setImportLoading(false);
        }
    };




    const handleDeleteMember = async (id, name) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Deletion disabled in Guest Mode.' });
        const password = window.prompt(`SECURITY CHECK: Please enter your admin password to CONFIRM DELETING ${name}:`);
        if (!password) return;

        setImportLoading(true);
        try {
            const res = await api.post(`/members/${id}/delete-secure`, { confirmPassword: password });
            setMsg({ type: 'success', text: res.data.message });
            setEditingMember(null);
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Deletion failed: ' + (err.response?.data?.message || 'Server error') });
        } finally {
            setImportLoading(false);
        }
    };

    const handleDeleteMeeting = async (id, name) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        const password = window.prompt(`SECURITY CHECK: Enter admin password to PERMANENTLY DELETE "${name}" and all its attendance records:`);
        if (!password) return;

        setImportLoading(true);
        try {
            const res = await api.post(`/meetings/${id}/delete-secure`, { confirmPassword: password });
            setMsg({ type: 'success', text: res.data.message });
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Deletion failed: ' + (err.response?.data?.message || 'Server error') });
        } finally {
            setImportLoading(false);
        }
    };

    const handleSetupTestAccount = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        const regNo = window.prompt('Enter student registration number to set as dedicated TESTER:', '00-0000');
        if (!regNo) return;
        setImportLoading(true);
        try {
            const res = await api.post('/members/setup-test-account', { regNo });
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Setup failed' });
        } finally {
            setImportLoading(false);
        }
    };

    const fetchMemberInsights = async (regNo) => {
        setLoadingInsights(true);
        if (isGuest) {
            setMemberInsights({
                member: { name: 'Guest Member', studentRegNo: regNo, totalPoints: 100 },
                stats: { totalMeetings: 10, attendedCount: 8, percentage: 80, physicalAttended: 8, exemptedCount: 0 },
                history: [
                    { date: new Date().toISOString(), name: 'Sample Meeting 1', attended: true },
                    { date: new Date(Date.now() - 86400000).toISOString(), name: 'Sample Meeting 2', attended: true },
                ]
            });
            setLoadingInsights(false);
            return;
        }
        try {
            const res = await api.get(`/attendance/student/${regNo}`);
            setMemberInsights(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingInsights(false);
        }
    };

    const handleQuickCheckIn = async (meetingId, regNoOverride = null) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        const reg = regNoOverride || quickRegNo;
        if (!reg) return;

        // Smart Lookup: Find member in registry (Normalize both sides for robust matching)
        const normalize = (s) => s?.replace(/\D/g, '') || '';
        const member = members.find(m => normalize(m.studentRegNo) === normalize(reg));
        const meeting = meetings.find(m => m._id === meetingId);
        let studentName = member ? member.name : null;

        // 1. Weekly Duplicate Alert
        if (member && member.lastSeen) {
            const meetingDate = new Date(meeting.date);
            const startOfWeek = new Date(meetingDate);
            startOfWeek.setDate(meetingDate.getDate() - meetingDate.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const lastSeenDate = new Date(member.lastSeen);
            if (lastSeenDate >= startOfWeek && lastSeenDate <= endOfWeek) {
                const dayName = lastSeenDate.toLocaleDateString('en-US', { weekday: 'long' });
                if (!window.confirm(`⚠️ DUPLICATE ALERT ⚠️\n\n${member.name} (${reg}) already checked in this week (on ${dayName}).\n\nDo you want to proceed with this manual entry anyway?`)) {
                    return;
                }
            }
        }

        // 2. New Student Onboarding
        if (!member) {
            alert(`⚠️ MEMBER NOT FOUND ⚠️\n\nThe Admission Number "${reg}" is NOT in the Doulos Registry. \n\nYou will need to enter their name to add them as a new member.`);
            studentName = window.prompt(`Registrating New Member\n\nPlease enter the student's FULL NAME for ${reg}:`);
            if (!studentName) return; // Cancel if no name provided
        }

        setQuickCheckInLoading(true);
        try {
            await api.post('/attendance/manual', {
                meetingId,
                studentRegNo: reg,
                name: studentName // Pass the name (either found or prompted)
            });

            const displayName = studentName || reg;
            setMsg({ type: 'success', text: `Success! ${displayName} has been checked in.` });
            setQuickRegNo('');
            fetchMeetings(); // Refresh stats
            fetchMembers(); // Refresh registry to include new member
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Manual check-in failed' });
        } finally {
            setQuickCheckInLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Creation disabled in Guest Mode.' });

        // Basic validation for location name
        if (!formData.location.name) {
            return setMsg({ type: 'error', text: 'Location name is required.' });
        }

        setImportLoading(true);
        try {
            await api.post('/meetings', formData);
            setMsg({ type: 'success', text: 'Meeting created successfully!' });
            setShowCreate(false);
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create meeting' });
        } finally {
            setImportLoading(false);
        }
    };

    const downloadReport = async (meetingId, meetingName) => {
        try {
            const res = await api.get(`/attendance/${meetingId}`);
            const data = res.data;
            if (data.length === 0) {
                setMsg({ type: 'error', text: 'No attendance recorded yet.' });
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
            setMsg({ type: 'error', text: 'Failed to generate report' });
        }
    };

    const downloadCSV = async (meetingId, meetingName) => {
        try {
            const res = await api.get(`/attendance/${meetingId}`);
            const data = res.data;
            if (data.length === 0) {
                setMsg({ type: 'error', text: 'No attendance recorded yet.' });
                return;
            }

            const allKeys = new Set();
            data.forEach(r => {
                const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                Object.keys(responses || {}).forEach(k => allKeys.add(k));
            });
            const headers = ['Timestamp', 'Category', ...Array.from(allKeys)];

            const csvContent = [
                headers.join(','),
                ...data.map(r => {
                    const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                    const timestamp = new Date(r.timestamp).toLocaleString();
                    const category = r.memberType || 'Visitor';
                    return [
                        `"${timestamp}"`,
                        `"${category}"`,
                        ...Array.from(allKeys).map(h => `"${(responses[h] || '-').toString().replace(/"/g, '""')}"`)
                    ].join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${meetingName}_Attendance.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'CSV Export Started' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to download CSV' });
        }
    };

    const downloadCumulativeCSV = (filteredMembers, semesterName) => {
        try {
            const headers = ['Name', 'Registration Number', 'Category', 'Campus', 'Total Attendance'];
            const csvContent = [
                headers.join(','),
                ...filteredMembers.map(m => [
                    `"${m.name || 'Unknown'}"`,
                    `"${m.studentRegNo}"`,
                    `"${m.memberType || 'Visitor'}"`,
                    `"${m.campus}"`,
                    m.totalAttended
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Cumulative_Report_${semesterName.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'Cumulative Export Started' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export cumulative CSV' });
        }
    };

    const downloadRegistryCSV = () => {
        try {
            const headers = ['Name', 'Registration Number', 'Points', 'Campus', 'Category'];
            const csvContent = [
                headers.join(','),
                ...members.map(m => [
                    `"${m.name || 'Unknown'}"`,
                    `"${m.studentRegNo}"`,
                    m.totalPoints || 0,
                    `"${m.campus}"`,
                    `"${m.memberType || 'Visitor'}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Doulos_Member_Registry_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'Registry Export Started' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export registry' });
        }
    };

    // --- SMART FILE IMPORT LOGIC ---
    const handleFileImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportLoading(true);
        const fileType = file.name.split('.').pop().toLowerCase();

        try {
            if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
                handleExcelImport(file);
            } else if (fileType === 'docx' || fileType === 'doc') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                processExtractedText(result.value);
            } else if (fileType === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                processExtractedText(fullText);
            } else {
                setMsg({ type: 'error', text: 'Unsupported file format. Please use PDF, Word, or Excel files.' });
                setImportLoading(false);
            }
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to process file: ' + (err.message || 'Unknown error') });
            setImportLoading(false);
        } finally {
            e.target.value = '';
        }
    };

    const handleExcelImport = (file) => {
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                processImportedData(data, 'excel');
            } catch (err) {
                setMsg({ type: 'error', text: 'Failed to parse Excel file' });
                setImportLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const processExtractedText = (text) => {
        const lines = text.split(/\r?\n/);
        const membersFound = [];

        // Regex for Admission Number (e.g., 22-1234, 221234, 22 1234)
        const regNoRegex = /(\d{2})[- ]?(\d{4})/g;

        lines.forEach(line => {
            let match;
            while ((match = regNoRegex.exec(line)) !== null) {
                const stdRegNo = `${match[1]}-${match[2]}`;
                const lowerLine = line.toLowerCase();

                // Campus heuristics
                let campus = 'Athi River';
                if (lowerLine.includes('valley') || lowerLine.includes('nairobi')) campus = 'Valley Road';

                // Member type heuristics
                let memberType = 'Visitor';
                if (lowerLine.includes('douloid')) memberType = 'Douloid';
                else if (lowerLine.includes('recruit')) memberType = 'Recruit';
                else if (lowerLine.includes('exempt')) memberType = 'Exempted';

                // Name extraction (remove reg no and keywords, assume rest is name)
                let nameCandidate = line.replace(match[0], '')
                    .replace(/athi river|valley road|douloid|recruit|visitor|exempted/gi, '')
                    .replace(/[,\t|-]/g, ' ')
                    .trim()
                    .replace(/\s+/g, ' ');

                if (nameCandidate.length > 2) {
                    membersFound.push({
                        name: nameCandidate,
                        studentRegNo: stdRegNo,
                        campus,
                        memberType
                    });
                }
            }
        });

        processImportedData(membersFound, 'text');
    };

    const processImportedData = async (data, source) => {
        let formattedMembers = [];

        if (source === 'excel') {
            formattedMembers = data.map(row => {
                const getVal = (possibleKeys) => {
                    const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()));
                    return key ? row[key] : null;
                };

                const name = getVal(['name', 'full name', 'student name', 'fullname']);
                const rawReg = getVal(['adm', 'adm no', 'admission', 'admission number', 'reg', 'reg no', 'registration', 'registration number']);

                if (!name || !rawReg) return null;

                let studentRegNo = '';
                let clean = String(rawReg).replace(/[^0-9]/g, '');
                if (clean.length > 2) studentRegNo = clean.slice(0, 2) + '-' + clean.slice(2);
                else studentRegNo = clean;

                let type = getVal(['category', 'type', 'member type', 'role']) || 'Visitor';
                if (type.toLowerCase().includes('douloid')) type = 'Douloid';
                else if (type.toLowerCase().includes('recruit')) type = 'Recruit';
                else if (type.toLowerCase().includes('visitor')) type = 'Visitor';

                const campus = getVal(['campus', 'location']) || 'Athi River';

                return { name, studentRegNo, memberType: type, campus };
            }).filter(m => m !== null);
        } else {
            formattedMembers = data;
        }

        if (formattedMembers.length === 0) {
            setMsg({ type: 'error', text: 'No valid members found in file.' });
            setImportLoading(false);
            return;
        }

        try {
            await api.post('/members/import', { members: formattedMembers });
            setMsg({ type: 'success', text: `Imported ${formattedMembers.length} members successfully!` });
            fetchMembers();
            setShowAddMenu(false);
        } catch (error) {
            setMsg({ type: 'error', text: 'Import failed: ' + (error.response?.data?.message || error.message) });
        } finally {
            setImportLoading(false);
        }
    };

    const handlePrintQR = () => {
        const meeting = selectedMeeting || selectedTraining;
        if (!meeting) return;

        // Find the QR code SVG. 
        // Note: The on-screen version is blurred, but the SVG data itself is valid.
        // We will print it cleanly without the blur styles.
        const qrSvg = document.querySelector('.qr-modal-content svg') || document.querySelector('.training-qr-container svg');
        if (!qrSvg) return;

        // Create a clean version of the SVG for printing (removing parent filters if any)
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
                            font-family: 'Inter', system-ui, -apple-system, sans-serif;
                            margin: 0;
                            padding: 0;
                            background: white; /* Print background - Changed to white */
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .page {
                            width: 210mm;
                            height: 297mm;
                            position: relative;
                            background: white; /* Changed to white */
                            color: black; /* Changed to black */
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                        }

                        .content {
                            position: relative;
                            z-index: 10;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: space-between; /* Space out header, QR, footer */
                            padding: 25mm;
                            box-sizing: border-box;
                        }

                        .header {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 15px;
                        }
                        
                        .logo-img {
                            width: 120px;
                            height: 120px;
                            object-fit: contain;
                            margin-bottom: 0.5rem;
                        }

                        .meeting-title {
                            font-size: 2.2rem;
                            font-weight: 900;
                            line-height: 1.1;
                            color: #0c1a29;
                            margin: 10px 0;
                            max-width: 90%;
                        }

                        .meeting-meta {
                            font-size: 1.8rem;
                            color: #4b5563;
                            margin-top: 10px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }

                        .qr-outer-container {
                            position: relative;
                            padding: 15px;
                            background: white;
                            border-radius: 40px;
                            border: 4px solid #0c1a29;
                        }

                        .qr-inner-wrapper {
                            padding: 30px;
                            background: white;
                            border-radius: 30px;
                        }

                        /* "Scan Me" Badge */
                        .scan-badge {
                            position: absolute;
                            top: -25px;
                            right: -25px;
                            background: #ef4444;
                            color: white;
                            font-weight: 900;
                            padding: 12px 25px;
                            border-radius: 50px;
                            transform: rotate(12deg);
                            box-shadow: 0 10px 20px rgba(0,0,0,0.15);
                            font-size: 1.4rem;
                            border: 3px solid white;
                        }

                        .semester-badge {
                            position: absolute;
                            bottom: -20px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: #3b82f6;
                            color: white;
                            font-weight: 900;
                            padding: 8px 30px;
                            border-radius: 50px;
                            font-size: 1.1rem;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            border: 3px solid white;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        }

                        .footer {
                            width: 100%;
                            border-top: 2px solid #f3f4f6;
                            padding-top: 25px;
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-end;
                        }

                        .instruction {
                            text-align: left;
                        }
                        .instruction h3 {
                            font-size: 1.6rem;
                            color: #3b82f6;
                            margin: 0 0 5px 0;
                            text-transform: uppercase;
                            font-weight: 900;
                        }
                        .instruction p {
                            font-size: 1.1rem;
                            color: #6b7280;
                            margin: 0;
                            max-width: 400px;
                        }

                        .theme-section {
                            margin: 20px 0;
                            padding: 20px;
                            border: 1px dashed #3b82f6;
                            border-radius: 15px;
                            max-width: 85%;
                        }

                        .theme-title {
                            font-size: 1.5rem;
                            font-weight: 900;
                            color: #032540;
                            margin-bottom: 5px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }

                        .theme-text {
                            font-size: 1.8rem;
                            font-weight: 800;
                            color: #3b82f6;
                            font-style: italic;
                            margin: 10px 0;
                        }

                        .theme-verse {
                            font-size: 1rem;
                            color: #4b5563;
                            font-weight: 600;
                            line-height: 1.4;
                            margin-top: 10px;
                        }

                        .meta {
                            text-align: right;
                            font-size: 1.1rem;
                            color: #9ca3af;
                            font-weight: 600;
                        }

                        @media print {
                            body { background: none; }
                            .page { box-shadow: none; margin: 0; width: 100%; height: 100%; }
                        }
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="content">
                            <div class="header">
                                <img src="/logo.png" class="logo-img" alt="Logo" />
                                <h1 class="meeting-title">${meeting.name}</h1>
                                <div class="meeting-meta">
                                    <span>${meeting.campus.toUpperCase()} CAMPUS</span>
                                    <span>•</span>
                                    <span>${new Date(meeting.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>

                            <div class="qr-outer-container">
                                <div class="scan-badge">SCAN ME!</div>
                                <div class="qr-inner-wrapper">
                                    ${new XMLSerializer().serializeToString(qrSvg)}
                                </div>
                            </div>

                            <div class="theme-section">
                                <div class="theme-title">Semester Theme</div>
                                <div class="theme-text">"Trust the designer He knows the journey"</div>
                                <div class="theme-verse">
                                    <strong>Proverbs 3:5-6</strong><br/>
                                    "Trust the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him and He will make your paths straight"
                                </div>
                            </div>

                            <div class="footer">
                                <div class="instruction">
                                    <h3>Quick Check-In</h3>
                                    <p>Open your camera or QR scanner to mark your attendance instantly.</p>
                                </div>
                                <div class="meta">
                                    ${new Date(meeting.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                                    Leaders In Service System
                                </div>
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                // window.onafterprint = () => window.close(); // Optional: Close after print
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
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        const isSuperUser = ['developer', 'superadmin', 'SuperAdmin'].includes(userRole);

        if (!meeting.isActive && !isSuperUser) {
            setMsg({ type: 'error', text: 'Finalized meetings can only be reopened by a SuperAdmin.' });
            return;
        }

        const action = meeting.isActive ? 'CLOSE' : 'REOPEN';
        const confirmMsg = meeting.isActive
            ? 'Are you sure you want to CLOSE this meeting? This will finalize it.'
            : 'Are you sure you want to REOPEN this meeting? This will enable the QR code and student access again.';

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.patch(`/meetings/${meeting._id}`, { isActive: !meeting.isActive });
            fetchMeetings();
            setMsg({ type: 'success', text: `Meeting ${meeting.isActive ? 'finalized' : 'reopened'} successfully!` });
        } catch (err) {
            setMsg({ type: 'error', text: `Failed to ${action.toLowerCase()} meeting` });
        }
    };

    const saveMember = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });

        try {
            if (editingMember._id === 'NEW') {
                await api.post('/members', editingMember);
                const firstName = editingMember.name.split(' ')[0];
                setMsg({ type: 'success', text: `Success! ${firstName} has been added! Ready for next.` });
                // Reset form for next entry, keeping campus
                setEditingMember(prev => ({
                    ...prev,
                    name: '',
                    studentRegNo: '',
                    memberType: 'Visitor',
                    status: 'Active',
                    lastActiveSemester: '',
                    wateringDays: []
                }));
            } else {
                await api.patch(`/members/${editingMember._id}`, editingMember);
                setMsg({ type: 'success', text: 'Member profile updated!' });
                setEditingMember(null);
            }
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save member' });
        }
    };

    const handleResetAllPoints = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Are you sure you want to reset ALL points for ALL members? This cannot be undone.')) return;
        try {
            await api.post('/members/reset-all-points');
            setMsg({ type: 'success', text: 'All points have been reset.' });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to reset points' });
        }
    };

    const handleGraduateAll = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Are you sure you want to graduate all Recruits to Douloids?')) return;
        const pwd = prompt('Enter admin password to confirm:');
        if (!pwd) return;
        try {
            await api.post('/members/graduate-all', { confirmPassword: pwd });
            setMsg({ type: 'success', text: 'All recruits graduated!' });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to graduate recruits' });
        }
    };

    const handleArchiveAllRecruits = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('⚠️ ARCHIVE ALL RECRUITS ⚠️\n\nThis will archive ALL members currently marked as Recruits. They will no longer be able to log in but their data will remain. Proceed?')) return;

        const pwd = prompt('Enter admin password to confirm archival:');
        if (!pwd) return;

        try {
            const res = await api.post('/members/archive-all-recruits', { confirmPassword: pwd });
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to archive recruits' });
        }
    };

    const handleUndoGraduation = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('⚠️ UNDO GRADUATION ⚠️\n\nThis will revert all recently graduated members back to Recruits. Do you want to proceed?')) return;

        const pwd = prompt('Enter admin password to confirm undo:');
        if (!pwd) return;

        try {
            const res = await api.post('/members/undo-graduation', { confirmPassword: pwd });
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to undo graduation' });
        }
    };

    const handleGraduateMember = async (memberId) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Graduate this member to Douloid status?')) return;
        try {
            await api.post(`/members/${memberId}/graduate`);
            setMsg({ type: 'success', text: 'Member graduated!' });
            fetchMemberInsights(editingMember.studentRegNo); // Refresh insights
            fetchMembers(); // Refresh list
            if (editingMember) setEditingMember(prev => ({ ...prev, memberType: 'Douloid' }));
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to graduate member' });
        }
    };

    // Reset points for INDIVIDUAL member (requested for testing in insights)
    const handleResetMemberPoints = async (memberId) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Reset this member\'s points to 0?')) return;
        try {
            await api.post(`/members/${memberId}/reset-points`);
            setMsg({ type: 'success', text: 'Points reset.' });
            fetchMemberInsights(editingMember.studentRegNo); // Refresh insights
            fetchMembers();
            if (editingMember) setEditingMember(prev => ({ ...prev, totalPoints: 0 }));
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to reset points' });
        }
    };

    const handleResetDevice = async (memberId) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Are you sure you want to reset this student\'s device link? They will be able to check in with a new phone.')) return;
        try {
            await api.post(`/members/${memberId}/reset-device`);
            setMsg({ type: 'success', text: 'Device link reset successfully!' });
            fetchMembers();
            setEditingMember(null);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to reset device' });
        }
    };

    const handleSaveAdmin = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        try {
            if (editingAdmin._id === 'NEW') {
                await api.post('/auth/register', editingAdmin);
                setMsg({ type: 'success', text: 'New admin registered successfully!' });
            } else {
                await api.patch(`/auth/users/${editingAdmin._id}`, editingAdmin);
                setMsg({ type: 'success', text: 'Admin profile updated!' });
            }
            setEditingAdmin(null);
            fetchAdmins();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save admin' });
        }
    };

    const handleDeleteAdmin = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete admin "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/auth/users/${id}`);
            setMsg({ type: 'success', text: 'Admin deleted successfully.' });
            fetchAdmins();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to delete admin' });
        }
    };

    const handleBulkGraduate = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (selectedMemberIds.length === 0) return;
        if (!window.confirm(`Graduate ${selectedMemberIds.length} selected recruits to Douloid status? They will see the celebratory graduation screen when they next login.`)) return;
        try {
            await api.post('/members/bulk-graduate', { memberIds: selectedMemberIds });
            setMsg({ type: 'success', text: `Successfully graduated ${selectedMemberIds.length} members!` });
            setSelectedMemberIds([]);
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to graduate members' });
        }
    };

    const handleBulkListAction = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        const regNos = bulkListInput.split('\n').map(r => r.trim()).filter(r => r);
        if (regNos.length === 0) return;

        try {
            setImportLoading(true);
            const endpoint = bulkListType === 'graduate' ? '/members/graduate-by-regnos' : '/members/archive-by-regnos';
            const res = await api.post(endpoint, { regNos });
            setMsg({ type: 'success', text: res.data.message });
            setShowBulkListTool(false);
            setBulkListInput('');
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Action failed: ' + (err.response?.data?.message || 'Server error') });
        } finally {
            setImportLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const guestRes = await api.get('/settings/guest_features');
            setGuestFeaturesEnabled(guestRes.data?.value !== 'false');

            const semRes = await api.get('/settings/current_semester');
            if (semRes.data?.value) {
                setCurrentSemester(semRes.data.value);
            }


        } catch (err) {
            console.error('Failed to fetch settings', err);
        }
    };

    const handleSaveSetting = async (key, value) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        try {
            await api.patch(`/settings/${key}`, { value: String(value) });
            setMsg({ type: 'success', text: 'Setting updated successfully.' });
            fetchSettings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update setting' });
        }
    };

    // Automatic Defaults
    useEffect(() => {
        if (!showCreate) return;

        // Set Date to Today
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        setFormData(prev => ({
            ...prev,
            date: dateStr
        }));
    }, [showCreate]);

    const totalAttendanceCount = meetings.reduce((acc, current) => acc + (current.attendanceCount || 0), 0);
    const activeMeetingsCount = meetings.filter(m => m.isActive).length;

    const renderMeetingCard = (m) => {
        const now = new Date();
        const mDate = new Date(m.date);
        const [h, min] = m.startTime.split(':').map(Number);
        const mStart = new Date(mDate);
        mStart.setHours(h, min, 0, 0);

        const [endH, endMin] = m.endTime.split(':').map(Number);
        const mEnd = new Date(mDate);
        mEnd.setHours(endH, endMin, 0, 0);

        const isActuallyLive = m.isActive && now >= mStart;
        const isMeetingOver = now > mEnd;

        return (
            <div
                key={m._id}
                className="glass-panel meeting-card-hover"
                style={{
                    padding: '1.5rem',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    border: isActuallyLive ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    boxShadow: isActuallyLive ? '0 0 20px rgba(74, 222, 128, 0.1)' : 'none'
                }}
                onClick={() => setInsightMeeting(m)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{m.name}</h3>
                            {m.category === 'Training' && (
                                <span style={{
                                    fontSize: '0.6rem',
                                    padding: '0.2rem 0.5rem',
                                    background: 'rgba(234, 179, 8, 0.2)',
                                    color: '#eab308',
                                    borderRadius: '0.3rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    border: '1px solid rgba(234, 179, 8, 0.3)'
                                }}>Training</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                            <MapPin size={14} /> {m.campus}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        {(() => {
                            if (!m.isActive) return (
                                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', color: 'var(--color-text-dim)', fontSize: '0.7rem', fontWeight: 800 }}>
                                    • COMPLETED
                                </div>
                            );

                            const now = new Date();
                            const mDate = new Date(m.date);
                            const [h, min] = m.startTime.split(':').map(Number);
                            const mStart = new Date(mDate);
                            mStart.setHours(h, min, 0, 0);

                            const isFuture = now < mStart;
                            const isToday = now.toDateString() === mDate.toDateString();

                            if (isFuture) {
                                return (
                                    <div style={{
                                        padding: '0.5rem 0.8rem',
                                        background: isToday ? 'rgba(59, 130, 246, 0.1)' : 'rgba(124, 58, 237, 0.05)',
                                        borderRadius: '2rem',
                                        color: isToday ? '#3b82f6' : '#a78bfa',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        border: `1px solid ${isToday ? 'rgba(59, 130, 246, 0.2)' : 'rgba(124, 58, 237, 0.1)'}`
                                    }}>
                                        • {isToday ? 'STANDBY / UPCOMING' : 'SCHEDULED'}
                                    </div>
                                );
                            }

                            return (
                                <div style={{ padding: '0.5rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '2rem', color: '#4ade80', fontSize: '0.7rem', fontWeight: 800 }}>
                                    • LIVE NOW
                                </div>
                            );
                        })()}
                        {((m.isActive && !isMeetingOver) || ['developer', 'superadmin'].includes(userRole)) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMeeting(m);
                                }}
                                className="btn"
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3b82f6',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                }}
                                title="QR Code"
                            >
                                <QrIcon size={18} />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setInsightMeeting(m);
                            }}
                            className="btn"
                            style={{
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(124, 58, 237, 0.1)',
                                color: 'hsl(var(--color-primary))',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(124, 58, 237, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            <BarChart3 size={14} /> Insights
                        </button>


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

                {
                    ((m.isActive || ['developer', 'superadmin', 'SuperAdmin'].includes(userRole)) && !isMeetingOver) && (
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)', opacity: 0.5 }} />
                                <input
                                    className="input-field"
                                    placeholder="Search Name / Reg No"
                                    list="members-search"
                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem 0.4rem 2.2rem' }}
                                    value={quickRegNo}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setQuickRegNo(val);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <button
                                className="btn"
                                style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', border: '1px solid var(--glass-border)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLookupMemberInsights(quickRegNo);
                                }}
                                title="Lookup Member History"
                            >
                                <Search size={16} />
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', flexShrink: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickCheckIn(m._id);
                                }}
                                disabled={quickCheckInLoading}
                                title="Manual Check-In"
                            >
                                {quickCheckInLoading ? '...' : <Plus size={16} />}
                            </button>
                        </div>
                    )
                }

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {((m.isActive || userRole) && !isMeetingOver) && (
                        <button
                            className="btn"
                            style={{ flex: '1 1 60px', background: 'rgba(37, 170, 225, 0.15)', color: '#25AAE1', padding: '0.5rem', fontSize: '0.8rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const now = new Date();
                                const [startH, startM] = m.startTime.split(':').map(Number);
                                const [endH, endM] = m.endTime.split(':').map(Number);

                                const start = new Date(m.date);
                                start.setHours(startH, startM, 0, 0);

                                const end = new Date(m.date);
                                end.setHours(endH, endM, 0, 0);

                                // Use state 'userRole' which is initialized from localStorage
                                const role = userRole || localStorage.getItem('role');
                                const isSuperUser = ['developer', 'superadmin', 'SuperAdmin'].includes(role);

                                const isWithinTime = now >= start && now <= end;

                                // Anyone logged in is an "Admin" here. 
                                // Relax restriction: Allow any admin to open it, but warn if time is wrong.
                                if (isWithinTime) {
                                    setSelectedMeeting(m);
                                } else {
                                    // Admin Override
                                    if (window.confirm(`⚠️ TIME WARNING ⚠️\n\nThis meeting is scheduled for ${m.startTime} - ${m.endTime}.\nCurrent time is ${now.toLocaleTimeString()}.\n\nDo you want to FORCE OPEN the QR code for printing/testing?`)) {
                                        setSelectedMeeting(m);
                                    }
                                }
                            }}
                        >
                            <QrIcon size={16} style={{ marginRight: '0.3rem' }} /> QR
                        </button>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1, background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', fontSize: '0.75rem', padding: '0.5rem', fontWeight: 800, border: '1px solid rgba(124, 58, 237, 0.2)' }}
                            onClick={(e) => { e.stopPropagation(); setInsightMeeting(m); }}>
                            <BarChart3 size={14} style={{ marginRight: '0.4rem' }} /> {m.attendees || 0} Insights
                        </button>
                        <button className="btn" style={{ flex: '0 0 40px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', padding: '0.5rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleStatus(m);
                            }}
                        >
                            {m.isActive ? <X size={16} title="Close Meeting" /> : <RotateCcw size={16} title="Reopen Meeting" />}
                        </button>
                        {['developer', 'superadmin'].includes(userRole) && (
                            <button
                                className="btn"
                                style={{ flex: '0 0 40px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.5rem' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMeeting(m._id, m.name);
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderTrainingCard = (t) => {
        const now = new Date();
        const tDate = new Date(t.date);
        const [h, min] = t.startTime.split(':').map(Number);
        const tStart = new Date(tDate);
        tStart.setHours(h, min, 0, 0);

        const [endH, endMin] = t.endTime.split(':').map(Number);
        const tEnd = new Date(tDate);
        tEnd.setHours(endH, endMin, 0, 0);

        const isActuallyLive = t.isActive && now >= tStart;
        const isOver = now > tEnd;

        return (
            <div
                key={t._id}
                className="glass-panel meeting-card-hover"
                style={{
                    padding: '1.5rem',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    border: isActuallyLive ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid var(--glass-border)',
                    boxShadow: isActuallyLive ? '0 0 20px rgba(52, 211, 153, 0.1)' : 'none'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t.name}</h3>
                            <span style={{
                                fontSize: '0.6rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(52, 211, 153, 0.2)',
                                color: '#34d399',
                                borderRadius: '0.3rem',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                border: '1px solid rgba(52, 211, 153, 0.3)'
                            }}>Training</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                            <MapPin size={14} /> {t.campus}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        {(() => {
                            if (!t.isActive) return (
                                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', color: 'var(--color-text-dim)', fontSize: '0.7rem', fontWeight: 800 }}>
                                    • ARCHIVED
                                </div>
                            );

                            if (isOver) return (
                                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', color: 'var(--color-text-dim)', fontSize: '0.7rem', fontWeight: 800 }}>
                                    • COMPLETED
                                </div>
                            );

                            if (now < tStart) {
                                const isToday = now.toDateString() === tDate.toDateString();
                                return (
                                    <div style={{
                                        padding: '0.5rem 0.8rem',
                                        background: isToday ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '2rem',
                                        color: isToday ? '#34d399' : 'var(--color-text-dim)',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        border: `1px solid ${isToday ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
                                    }}>
                                        • {isToday ? 'STANDBY' : 'SCHEDULED'}
                                    </div>
                                );
                            }

                            return (
                                <div style={{ padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '2rem', color: '#34d399', fontSize: '0.7rem', fontWeight: 800 }}>
                                    • LIVE NOW
                                </div>
                            );
                        })()}
                        {(t.isActive && !isOver || ['developer', 'superadmin'].includes(userRole)) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTraining(t);
                                }}
                                className="btn"
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    background: 'rgba(52, 211, 153, 0.1)',
                                    color: '#34d399',
                                    border: '1px solid rgba(52, 211, 153, 0.3)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 800
                                }}
                            >
                                <QrIcon size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem' }}>
                        <div style={{ opacity: 0.5, fontSize: '0.65rem', textTransform: 'uppercase' }}>Date</div>
                        <div style={{ fontWeight: 700 }}>{new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                        <div style={{ opacity: 0.5, fontSize: '0.65rem', textTransform: 'uppercase' }}>Time</div>
                        <div style={{ fontWeight: 700 }}>{t.startTime}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1, background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', fontSize: '0.75rem', padding: '0.5rem', fontWeight: 800, border: '1px solid rgba(52, 211, 153, 0.2)' }}
                        onClick={(e) => { e.stopPropagation(); setInsightMeeting(t); }}>
                        <BarChart3 size={14} style={{ marginRight: '0.4rem' }} /> {t.attendanceCount || 0} Insights
                    </button>
                    <button className="btn" style={{ flex: '0 0 40px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', padding: '0.5rem' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTrainingStatus(t._id, t.isActive);
                        }}
                    >
                        {t.isActive ? <X size={16} title="Close Training" /> : <RotateCcw size={16} title="Reopen Training" />}
                    </button>
                    {['developer', 'superadmin'].includes(userRole) && (
                        <button
                            className="btn"
                            style={{ flex: '0 0 40px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.5rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTraining(t._id, t.name);
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            <BackgroundGallery />
            <ValentineRain />
            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
                <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                        <div className="rotating-logo">
                            <Logo size={45} />
                        </div>
                        {/* Guest Feedback Button */}
                        {isGuest && (
                            <button
                                onClick={async () => {
                                    const message = window.prompt("💡 Share your thoughts on the Admin Dashboard:");
                                    if (message) {
                                        try {
                                            await api.post('/feedback', { message, category: 'admin_guest_feedback' });
                                            alert("Thanks for your feedback!");
                                        } catch (e) {
                                            console.error(e);
                                            alert("Failed to send feedback. Please try again.");
                                        }
                                    }
                                }}
                                style={{
                                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 3000,
                                    padding: '1rem 1.5rem', borderRadius: '2rem',
                                    background: '#facc15', color: 'black', fontWeight: 'bold',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>💡</span> Give Feedback
                            </button>
                        )}

                        <style>{`
                .glass-panel { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border-radius: 1rem; border: 1px solid rgba(255, 255, 255, 0.1); }
                .light-mode .glass-panel { background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(0, 0, 0, 0.1); }
                .btn { cursor: pointer; border: none; transition: transform 0.2s; }
                .btn:active { transform: scale(0.95); }
                .btn-primary { background: hsl(var(--color-primary)); color: white; }
                .btn-danger { background: #ef4444; color: white; }
                .input-field { width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; outline: none; }
                .light-mode .input-field { background: white; border-color: #ddd; color: black; }
            `}</style>
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
                                onClick={() => setActiveTab('trainings')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'trainings' ? 'hsl(168, 80%, 40%)' : 'transparent',
                                    color: activeTab === 'trainings' ? 'white' : 'var(--color-text-dim)',
                                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                }}
                            >
                                🎓 Trainings
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
                            <button
                                onClick={() => setActiveTab('finance')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'finance' ? 'hsl(var(--color-primary))' : 'transparent',
                                    color: activeTab === 'finance' ? 'white' : 'var(--color-text-dim)',
                                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Finance
                            </button>
                            {guestFeaturesEnabled && (
                                <button
                                    onClick={() => setActiveTab('feedback')} // Feedback tab is hidden if features disabled
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                        background: activeTab === 'feedback' ? 'hsl(var(--color-primary))' : 'transparent',
                                        color: activeTab === 'feedback' ? 'white' : 'var(--color-text-dim)',
                                        fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>💡</span> Feedback
                                </button>
                            )}
                            {['developer', 'superadmin', 'SuperAdmin', 'admin', 'Admin'].includes(userRole) && (
                                <button
                                    onClick={() => setActiveTab('admins')}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                        background: activeTab === 'admins' ? 'hsl(var(--color-primary))' : 'transparent',
                                        color: activeTab === 'admins' ? 'white' : 'var(--color-text-dim)',
                                        fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Admins
                                </button>
                            )}
                            {['developer', 'superadmin', 'SuperAdmin'].includes(userRole) && (
                                <button
                                    onClick={() => setActiveTab('system')}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                        background: activeTab === 'system' ? 'hsl(var(--color-primary))' : 'transparent',
                                        color: activeTab === 'system' ? 'white' : 'var(--color-text-dim)',
                                        fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    System
                                </button>
                            )}
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
                                background: isDarkMode ? '#1e293b' : '#f1f5f9',
                                color: 'hsl(var(--color-text))',
                                border: '1px solid var(--glass-border)'
                            }}
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {msg && (
                    <div style={{
                        position: 'fixed',
                        top: '1.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2000,
                        minWidth: '280px',
                        maxWidth: 'calc(100vw - 2rem)',
                        width: 'max-content',
                        padding: '1rem 1.5rem',
                        borderRadius: '0.75rem',
                        background: msg.type === 'error' ? '#dc2626' : '#059669',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        wordBreak: 'break-word',
                        textAlign: 'center',
                        animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        {msg.type === 'error' ? '⚠️' : '✅'} {msg.text}
                        <style>{`
                            @keyframes slideDown {
                                0% { opacity: 0; transform: translate(-50%, -20px); }
                                100% { opacity: 1; transform: translate(-50%, 0); }
                            }
                        `}</style>
                    </div>
                )}

                {/* New Meeting Insights Area */}
                {insightMeeting && (activeTab === 'meetings' || activeTab === 'trainings') ? (
                    <div style={{ marginBottom: '3rem', animation: 'fadeIn 0.5s' }}>
                        <MeetingInsights
                            meeting={insightMeeting}
                            onClose={() => setInsightMeeting(null)}
                            api={api}
                            onQuickCheckIn={handleQuickCheckIn}
                        />
                    </div>
                ) : (activeTab === 'meetings' || activeTab === 'trainings') && (
                    <div
                        className="glass-panel"
                        style={{
                            padding: '3rem',
                            marginBottom: '3rem',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            border: '2px dashed rgba(255,255,255,0.1)',
                            borderRadius: '2rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', opacity: 0.3 }}>
                            <BarChart3 size={48} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: activeTab === 'trainings' ? '#34d399' : 'hsl(var(--color-primary))' }}>
                            {activeTab === 'meetings' ? 'Meeting' : 'Training'} Attendance Intelligence
                        </h3>
                        <p style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '1rem', fontWeight: 500 }}>
                            Select any {activeTab === 'meetings' ? 'meeting' : 'training'} card below to decode detailed participation insights, absent lists, and growth metrics.
                        </p>
                    </div>
                )}

                {/* ============================================================ */}
                {/* TRAININGS TAB */}
                {/* ============================================================ */}
                {activeTab === 'trainings' ? (
                    <>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setShowCreateTraining(!showCreateTraining)}
                                style={{ background: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'black', fontWeight: 800 }}>
                                <Plus size={20} /> New Training Session
                            </button>
                        </div>

                        {/* Create Training Form */}
                        {showCreateTraining && (
                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '800px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: 0 }}>Create Training Session</h3>
                                    <button onClick={() => setShowCreateTraining(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-text-dim)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                                        <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateTraining} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '1px' }}>Training Configuration</span>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label>Training Name</label>
                                        <input className="input-field" value={trainingFormData.name} onChange={e => setTrainingFormData({ ...trainingFormData, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label>Date</label>
                                        <input type="date" className="input-field" value={trainingFormData.date} onChange={e => setTrainingFormData({ ...trainingFormData, date: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label>Campus</label>
                                        <select className="input-field" value={trainingFormData.campus} onChange={e => setTrainingFormData({ ...trainingFormData, campus: e.target.value })}>
                                            <option value="Athi River">Athi River</option>
                                            <option value="Valley Road">Valley Road</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>Start Time</label>
                                        <input type="time" className="input-field" value={trainingFormData.startTime} onChange={e => setTrainingFormData({ ...trainingFormData, startTime: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label>End Time</label>
                                        <input type="time" className="input-field" value={trainingFormData.endTime} onChange={e => setTrainingFormData({ ...trainingFormData, endTime: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label>Venue Name *</label>
                                        <input className="input-field" placeholder="e.g. AR Guest House" value={trainingFormData.location.name}
                                            onChange={e => setTrainingFormData({ ...trainingFormData, location: { ...trainingFormData.location, name: e.target.value } })} required />
                                    </div>
                                    <div>
                                        <label>Geofence Radius (m)</label>
                                        <input type="number" className="input-field" value={trainingFormData.location.radius}
                                            onChange={e => setTrainingFormData({ ...trainingFormData, location: { ...trainingFormData.location, radius: Number(e.target.value) } })} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label>Question of the Day (optional)</label>
                                        <input className="input-field" placeholder="What is your takeaway?" value={trainingFormData.questionOfDay}
                                            onChange={e => setTrainingFormData({ ...trainingFormData, questionOfDay: e.target.value })} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <button type="button" className="btn" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                                            onClick={() => {
                                                navigator.geolocation.getCurrentPosition(pos => {
                                                    setTrainingFormData(prev => ({ ...prev, location: { ...prev.location, latitude: pos.coords.latitude, longitude: pos.coords.longitude } }));
                                                    setMsg({ type: 'success', text: `GPS captured!` });
                                                }, () => setMsg({ type: 'error', text: 'GPS failed.' }));
                                            }}>
                                            <MapPin size={16} /> Capture GPS
                                        </button>
                                        {trainingFormData.location.latitude && <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 700 }}>✓ GPS Linked</span>}
                                        <button type="submit" className="btn btn-primary" disabled={importLoading} style={{ background: '#34d399', marginLeft: 'auto', padding: '0.75rem 2rem', color: 'black', fontWeight: 800 }}>
                                            {importLoading ? 'Creating...' : 'Create Training Session'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* QR Modal for Training */}
                        {selectedTraining && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => setSelectedTraining(null)}>
                                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
                                    <h3 style={{ marginBottom: '0.5rem' }}>Scan Training QR</h3>

                                    <div className="training-qr-container" style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1rem' }}>
                                        <QRCode value={`${window.location.origin}/check-in/${selectedTraining.code}`} size={220} level="H" />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>TRAINING CODE</div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#34d399', letterSpacing: '2px', lineHeight: 1 }}>
                                            {selectedTraining.code.toUpperCase()}
                                        </div>
                                    </div>

                                    <h4 style={{ margin: '0 0 0.25rem' }}>{selectedTraining.name}</h4>
                                    <p style={{ opacity: 0.5, marginBottom: '1.5rem', fontSize: '0.85rem' }}>{selectedTraining.campus} | Training Session</p>

                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ background: '#34d399', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                            onClick={() => handlePrintQR()}
                                        >
                                            <Download size={14} style={{ marginRight: '0.4rem' }} /> Print QR
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}
                                            onClick={() => {
                                                const link = `${window.location.origin}/check-in/${selectedTraining.code}`;
                                                navigator.clipboard.writeText(link);
                                                setMsg({ type: 'success', text: 'Link copied!' });
                                            }}
                                        >
                                            <LinkIcon size={14} style={{ marginRight: '0.4rem' }} /> Copy Link
                                        </button>
                                        {['developer', 'superadmin'].includes(userRole) && (
                                            <a
                                                href={`/check-in/${selectedTraining.code}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn"
                                                style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                            >
                                                <ExternalLink size={14} style={{ marginRight: '0.4rem' }} /> Test
                                            </a>
                                        )}
                                    </div>
                                    <p style={{ marginTop: '1.5rem', opacity: 0.4, fontSize: '0.75rem' }}>Click anywhere outside to close</p>
                                </div>
                            </div>
                        )}

                        {/* Training Grid - Unified Layout */}
                        {(() => {
                            const getSem = (d) => {
                                const date = new Date(d);
                                const m = date.getMonth();
                                const y = date.getFullYear();
                                if (m <= 3) return `Jan Semester ${y}`;
                                if (m <= 7) return `May Semester ${y}`;
                                return `Sept Semester ${y}`;
                            };

                            const activeList = trainings.filter(t => t.isActive);
                            const historyList = trainings.filter(t => !t.isActive);

                            const semesters = Array.from(new Set(historyList.map(t => getSem(t.date))));
                            const currentSem = getSem(new Date());

                            const filteredHistory = historyList.filter(t => {
                                if (trainingSemesterFilter === 'All') return true;
                                const target = trainingSemesterFilter === 'Current' ? currentSem : trainingSemesterFilter;
                                return getSem(t.date) === target;
                            });

                            return (
                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0', opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(52,211,153,0.2)', paddingBottom: '0.5rem', color: '#34d399' }}>
                                        Active & Upcoming Trainings
                                    </h3>

                                    {activeList.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(52,211,153,0.02)', borderRadius: '1rem', marginBottom: '2rem', border: '1px dashed rgba(52,211,153,0.1)' }}>
                                            <p style={{ margin: 0, color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>No active training sessions.</p>
                                        </div>
                                    ) : (
                                        <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                                            {activeList.map(t => renderTrainingCard(t))}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                                        <h3 style={{ margin: 0, opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Training History</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '0.5rem' }}>
                                            <button onClick={() => setTrainingSemesterFilter('Current')}
                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', background: trainingSemesterFilter === 'Current' ? '#34d399' : 'transparent', color: trainingSemesterFilter === 'Current' ? 'black' : 'var(--color-text-dim)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                Current
                                            </button>
                                            {semesters.filter(s => s !== currentSem).map(s => (
                                                <button key={s} onClick={() => setTrainingSemesterFilter(s)}
                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', background: trainingSemesterFilter === s ? '#34d399' : 'transparent', color: trainingSemesterFilter === s ? 'black' : 'var(--color-text-dim)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    {s}
                                                </button>
                                            ))}
                                            <button onClick={() => setTrainingSemesterFilter('All')}
                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', background: trainingSemesterFilter === 'All' ? '#34d399' : 'transparent', color: trainingSemesterFilter === 'All' ? 'black' : 'var(--color-text-dim)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                All Time
                                            </button>
                                        </div>
                                    </div>

                                    {filteredHistory.length === 0 ? (
                                        <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>No archived trainings.</div>
                                    ) : (
                                        <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                            {filteredHistory.map(t => renderTrainingCard(t))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </>
                ) : activeTab === 'meetings' ? (
                    <>
                        {/* Actions */}
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                                <Plus size={20} /> New Meeting Session
                            </button>
                        </div>

                        {/* Create Form */}
                        {showCreate && (
                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '800px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: 0 }}>Create Meeting</h3>
                                    <button
                                        onClick={() => setShowCreate(false)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-text-dim)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                    >
                                        <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreate} className="create-meeting-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Meeting Configuration</span>
                                    </div>
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
                                    <div>
                                        <label>Reporting Semester</label>
                                        <select className="input-field" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                            <option value="JAN-APR 2026">JAN-APR 2026</option>
                                            <option value="MAY-AUG 2026">MAY-AUG 2026</option>
                                            <option value="SEP-DEC 2026">SEP-DEC 2026</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label>Question of the Day</label>
                                        <textarea
                                            className="input-field"
                                            style={{ width: '100%', minHeight: '60px' }}
                                            value={formData.questionOfDay}
                                            onChange={e => setFormData({ ...formData, questionOfDay: e.target.value })}
                                            placeholder="e.g. What are you most grateful for this week?"
                                        />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Meeting Type & Training</span>
                                    </div>
                                    <div>
                                        <label>Category</label>
                                        <select className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="Meeting">Standard Meeting</option>
                                            <option value="Training">Doulos Training</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                                        <input
                                            type="checkbox"
                                            id="create-manual"
                                            checked={formData.allowManualOverride}
                                            onChange={e => setFormData({ ...formData, allowManualOverride: e.target.checked })}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <label htmlFor="create-manual" style={{ margin: 0, cursor: 'pointer' }}>
                                            Admin-Only Check-in (Internet/Remote Mode)
                                        </label>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Location Settings</span>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label>Location Name</label>
                                        <input className="input-field" value={formData.location.name} onChange={e => setFormData({ ...formData, location: { ...formData.location, name: e.target.value } })} placeholder="e.g. Daystar University, Athi River Chapel" required />
                                    </div>

                                    <div style={{ position: 'relative' }}>
                                        <label>Latitude</label>
                                        <input type="number" step="any" className="input-field" value={formData.location.latitude || ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, latitude: parseFloat(e.target.value) } })} placeholder="-1.2345" />
                                    </div>
                                    <div>
                                        <label>Longitude</label>
                                        <input type="number" step="any" className="input-field" value={formData.location.longitude || ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, longitude: parseFloat(e.target.value) } })} placeholder="36.7890" />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() => {
                                                if (navigator.geolocation) {
                                                    navigator.geolocation.getCurrentPosition(pos => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            location: {
                                                                ...prev.location,
                                                                latitude: pos.coords.latitude,
                                                                longitude: pos.coords.longitude
                                                            }
                                                        }));
                                                    });
                                                }
                                            }}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            <MapPin size={16} style={{ marginRight: '8px' }} /> Use Current GPS Position
                                        </button>
                                    </div>

                                    <div>
                                        <label>Geofence Radius (meters)</label>
                                        <input type="number" className="input-field" value={formData.location.radius} onChange={e => setFormData({ ...formData, location: { ...formData.location, radius: parseInt(e.target.value) } })} />
                                    </div>



                                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>Create Meeting</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Meetings List */}
                        {/* Segregated Meetings View */}
                        {(() => {
                            const getSem = (d) => {
                                const date = new Date(d);
                                const m = date.getMonth();
                                const y = date.getFullYear();
                                if (m <= 3) return `Jan Semester ${y}`;
                                if (m <= 7) return `May Semester ${y}`;
                                return `Sept Semester ${y}`;
                            };

                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const activeList = meetings.filter(m => m.isActive);
                            const historyList = meetings.filter(m => !m.isActive);

                            const semesters = Array.from(new Set(historyList.map(m => getSem(m.date))));
                            const currentSem = getSem(new Date());

                            const filteredHistory = historyList.filter(m => {
                                if (meetingSemesterFilter === 'All') return true;
                                const target = meetingSemesterFilter === 'Current' ? currentSem : meetingSemesterFilter;
                                return getSem(m.date) === target;
                            });

                            return (
                                <div>
                                    {/* Active & Upcoming Section */}
                                    <h3 style={{ margin: '0 0 1rem 0', opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(124,58,237,0.2)', paddingBottom: '0.5rem', color: 'hsl(var(--color-primary))' }}>
                                        Active & Upcoming Meetings
                                    </h3>

                                    {activeList.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', marginBottom: '2rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                            <p style={{ margin: 0, color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>No active or upcoming meetings scheduled.</p>
                                        </div>
                                    ) : (
                                        <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                                            {activeList.map(m => renderMeetingCard(m))}
                                        </div>
                                    )}

                                    {/* History Section */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                                        <h3 style={{ margin: 0, opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Archived History</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '0.5rem' }}>
                                            <button
                                                onClick={() => setMeetingSemesterFilter('Current')}
                                                style={{
                                                    padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none',
                                                    background: meetingSemesterFilter === 'Current' ? 'hsl(var(--color-primary))' : 'transparent',
                                                    color: meetingSemesterFilter === 'Current' ? 'white' : 'var(--color-text-dim)',
                                                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >Current</button>
                                            {semesters.filter(s => s !== currentSem).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setMeetingSemesterFilter(s)}
                                                    style={{
                                                        padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none',
                                                        background: meetingSemesterFilter === s ? 'hsl(var(--color-primary))' : 'transparent',
                                                        color: meetingSemesterFilter === s ? 'white' : 'var(--color-text-dim)',
                                                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >{s}</button>
                                            ))}
                                            <button
                                                onClick={() => setMeetingSemesterFilter('All')}
                                                style={{
                                                    padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none',
                                                    background: meetingSemesterFilter === 'All' ? 'hsl(var(--color-primary))' : 'transparent',
                                                    color: meetingSemesterFilter === 'All' ? 'white' : 'var(--color-text-dim)',
                                                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >All Time</button>
                                        </div>
                                    </div>

                                    {filteredHistory.length === 0 ? (
                                        <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>No past meetings found in this period.</div>
                                    ) : (
                                        <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                            {filteredHistory.map(m => renderMeetingCard(m))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </>
                ) : activeTab === 'feedback' ? (
                    <FeedbackView isGuest={isGuest} />
                ) : activeTab === 'finance' ? (
                    <AdminFinanceView isGuest={isGuest} />
                ) : activeTab === 'members' ? (
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
                        {/* Registry Header & Toolbar */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Members Registry</h2>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginTop: '0.25rem' }}>
                                        {members.length} members registered in the system
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                    <button
                                        className="btn"
                                        style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', fontSize: '0.85rem', padding: '0.6rem 1rem', border: '1px solid rgba(37,170,225,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        onClick={downloadRegistryCSV}
                                        title="Export full registry to CSV"
                                    >
                                        <FileSpreadsheet size={16} /> Export CSV
                                    </button>
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            onClick={() => setShowAddMenu(!showAddMenu)}
                                        >
                                            <Plus size={18} /> Add Member <ChevronDown size={14} />
                                        </button>
                                        {showAddMenu && (
                                            <div className="glass-panel" style={{
                                                position: 'absolute', top: '115%', right: 0, zIndex: 100,
                                                background: 'hsl(var(--color-bg))', border: '1px solid var(--glass-border)',
                                                borderRadius: '0.5rem', padding: '0.5rem', display: 'flex', flexDirection: 'column',
                                                gap: '0.25rem', minWidth: '200px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                                            }}>
                                                <button className="btn" style={{ justifyContent: 'flex-start', padding: '0.75rem', fontSize: '0.9rem', background: 'transparent', border: 'none', textAlign: 'left', color: 'var(--color-text)' }}
                                                    onClick={() => { setEditingMember({ _id: 'NEW', name: '', studentRegNo: '', campus: 'Athi River', memberType: 'Visitor' }); setShowAddMenu(false); }}>
                                                    <Users size={16} style={{ marginRight: '0.75rem', opacity: 0.7 }} /> Single Entry
                                                </button>
                                                <button className="btn" style={{ justifyContent: 'flex-start', padding: '0.75rem', fontSize: '0.9rem', background: 'transparent', border: 'none', textAlign: 'left', color: 'var(--color-text)' }}
                                                    onClick={() => { document.getElementById('import-file-input').click(); setShowAddMenu(false); }}>
                                                    <FileSpreadsheet size={16} style={{ marginRight: '0.75rem', opacity: 0.7 }} /> Import Excel / CSV
                                                </button>
                                            </div>
                                        )}
                                        <input type="file" id="import-file-input" hidden accept=".csv, .xlsx, .xls" onChange={handleFileImport} />
                                    </div>
                                </div>
                            </div>

                            {/* Toolbar: Search & Filters */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                                    <input
                                        placeholder="Search by name or admission number..."
                                        className="input-field"
                                        style={{ paddingLeft: '3rem', width: '100%' }}
                                        value={memberSearch}
                                        onChange={e => setMemberSearch(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '0.5rem' }}>
                                    {['All', 'Athi River', 'Valley Road'].map(c => (
                                        <button key={c} onClick={() => setMemberCampusFilter(c)}
                                            style={{
                                                padding: '0.5rem 1rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                                background: memberCampusFilter === c ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                                                color: memberCampusFilter === c ? '#25AAE1' : 'var(--color-text-dim)',
                                                fontSize: '0.8rem', fontWeight: 600
                                            }}
                                        >{c === 'Valley Road' ? 'Nairobi' : c}</button>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '0.5rem' }}>
                                    {['All', 'Douloid', 'Recruit', 'Visitor', 'Exempted'].map(t => (
                                        <button key={t} onClick={() => setMemberTypeFilter(t)}
                                            style={{
                                                padding: '0.5rem 1rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                                background: memberTypeFilter === t ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                                                color: memberTypeFilter === t ? '#a78bfa' : 'var(--color-text-dim)',
                                                fontSize: '0.8rem', fontWeight: 600
                                            }}
                                        >{t}</button>
                                    ))}
                                </div>

                                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button className="btn" style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={handleBulkEnroll} title="Enroll everyone who has attended a meeting this semester">
                                        <CheckCircle size={14} style={{ marginRight: '0.4rem' }} /> Bulk Enroll
                                    </button>
                                    <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={handleSyncRegistry}>
                                        <RotateCcw size={14} style={{ marginRight: '0.4rem' }} /> Sync
                                    </button>
                                    {memberTypeFilter === 'Recruit' && (
                                        <>
                                            <button className="btn" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                onClick={handleGraduateAll} title="Graduate all Recruits to Douloids">
                                                <GraduationCap size={16} /> Graduate All
                                            </button>
                                            <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                onClick={handleArchiveAllRecruits} title="Archive all members who are currently Recruits">
                                                <Archive size={16} /> Archive Remaining
                                            </button>
                                            {selectedMemberIds.length > 0 && (
                                                <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                    onClick={handleBulkGraduate}>
                                                    <GraduationCap size={16} /> Graduate Selected ({selectedMemberIds.length})
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {memberTypeFilter === 'Douloid' && (
                                        <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            onClick={handleUndoGraduation} title="Undo recently graduated recruits (revert to Recruit)">
                                            <RotateCcw size={16} /> Undo Graduation
                                        </button>
                                    )}
                                    {['developer', 'superadmin'].includes(userRole) && (
                                        <>
                                            <button className="btn" style={{ background: 'hsl(var(--color-primary) / 0.1)', color: 'hsl(var(--color-primary))', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                onClick={() => setShowBulkListTool(true)} title="Graduate or Archive members by pasting a list of registration numbers">
                                                <ListChecks size={16} /> Bulk List Actions
                                            </button>
                                            <button className="btn" style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                                onClick={handleSetupTestAccount} title="Designate a student as a permanent tester">
                                                Setup Tester
                                            </button>
                                            <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                onClick={handleResetAllPoints} title="Reset all points to 0">
                                                <Trash2 size={14} /> Reset Points
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>


                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem', width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                onChange={(e) => {
                                                    const filtered = members.filter(m => {
                                                        const matchesSearch =
                                                            m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                                            m.studentRegNo.toLowerCase().includes(memberSearch.toLowerCase());
                                                        const matchesCampus = memberCampusFilter === 'All' || m.campus === memberCampusFilter;
                                                        const matchesType = memberTypeFilter === 'All' || m.memberType === memberTypeFilter;
                                                        return matchesSearch && matchesCampus && matchesType;
                                                    });
                                                    if (e.target.checked) {
                                                        setSelectedMemberIds(filtered.map(m => m._id));
                                                    } else {
                                                        setSelectedMemberIds([]);
                                                    }
                                                }}
                                                checked={selectedMemberIds.length > 0 && selectedMemberIds.length === members.filter(m => {
                                                    const matchesSearch =
                                                        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                                        m.studentRegNo.toLowerCase().includes(memberSearch.toLowerCase());
                                                    const matchesCampus = memberCampusFilter === 'All' || m.campus === memberCampusFilter;
                                                    const matchesType = memberTypeFilter === 'All' || m.memberType === memberTypeFilter;
                                                    return matchesSearch && matchesCampus && matchesType;
                                                }).length}
                                            />
                                        </th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Member Details</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Points</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Campus</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Category</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingMembers ? (
                                        <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center' }}>Loading directory...</td></tr>
                                    ) : (
                                        (() => {
                                            const filtered = members.filter(m => {
                                                const cleanSearch = memberSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                const cleanReg = m.studentRegNo.toLowerCase().replace(/[^a-z0-9]/g, '');

                                                const matchesSearch = !memberSearch ||
                                                    cleanName.includes(cleanSearch) ||
                                                    cleanReg.includes(cleanSearch);

                                                const matchesCampus = memberCampusFilter === 'All' || m.campus === memberCampusFilter;
                                                const matchesType = memberTypeFilter === 'All' || m.memberType === memberTypeFilter;
                                                return matchesSearch && matchesCampus && matchesType;
                                            });

                                            if (filtered.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan="6" style={{ padding: '4rem', textAlign: 'center' }}>
                                                            <div style={{ color: 'var(--color-text-dim)', marginBottom: '1.5rem' }}>
                                                                <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
                                                                <p>{memberSearch || memberCampusFilter !== 'All' ? 'No members match your filters.' : 'Registry is empty. Sync from history to populate it.'}</p>
                                                            </div>
                                                            {!memberSearch && memberCampusFilter === 'All' && (
                                                                <button className="btn btn-primary" onClick={handleSyncRegistry}>
                                                                    Sync Registry from History
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return filtered.map((m, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => { setEditingMember(m); fetchMemberInsights(m.studentRegNo); }}>
                                                    <td style={{ padding: '1rem', width: '40px' }} onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMemberIds.includes(m._id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedMemberIds([...selectedMemberIds, m._id]);
                                                                } else {
                                                                    setSelectedMemberIds(selectedMemberIds.filter(id => id !== m._id));
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{m.studentRegNo}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFD700', fontWeight: 800 }}>
                                                            <Trophy size={14} /> {m.totalPoints || 0}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                                        {m.campus}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem',
                                                            background: m.memberType === 'Douloid' ? 'rgba(255, 215, 0, 0.1)' :
                                                                m.memberType === 'Recruit' ? 'rgba(37, 170, 225, 0.1)' :
                                                                    m.memberType === 'Exempted' ? 'rgba(239, 68, 68, 0.1)' :
                                                                        'rgba(255, 255, 255, 0.05)',
                                                            color: m.memberType === 'Douloid' ? '#FFD700' :
                                                                m.memberType === 'Recruit' ? '#25AAE1' :
                                                                    m.memberType === 'Exempted' ? '#f87171' :
                                                                        'var(--color-text-dim)',
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 'bold',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {m.memberType}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                className="btn"
                                                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}
                                                                onClick={(e) => { e.stopPropagation(); setEditingMember(m); fetchMemberInsights(m.studentRegNo); }}
                                                            >
                                                                Insights
                                                            </button>
                                                            {['developer', 'superadmin'].includes(userRole) && (
                                                                <button
                                                                    className="btn"
                                                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteMember(m._id, m.name); }}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ));
                                        })()
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'admins' ? (
                    <AdminsView
                        admins={admins}
                        loading={loadingAdmins}
                        onEdit={setEditingAdmin}
                        onDelete={handleDeleteAdmin}
                        onRegister={() => setEditingAdmin({ _id: 'NEW', username: '', role: 'admin', campus: 'Athi River' })}
                        guestFeaturesEnabled={guestFeaturesEnabled}
                        currentSemester={currentSemester}
                        onUpdateSetting={handleSaveSetting}
                    />
                ) : activeTab === 'system' ? (
                    <SystemView onUpdateSetting={handleSaveSetting} isGuest={isGuest} />
                ) : activeTab === 'reports' ? (
                    <ReportsView
                        meetings={meetings}
                        members={members}
                        onViewAttendance={setViewingAttendance}
                        onDownload={downloadReport}
                        onDownloadCSV={downloadCSV}
                        onDownloadCumulativeCSV={downloadCumulativeCSV}
                    />
                ) : null}

                {/* Member Insights & Profile Modal */}
                {
                    editingMember && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110, padding: '1rem'
                        }} onClick={() => { setEditingMember(null); setMemberInsights(null); }}>
                            <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', background: 'hsl(var(--color-bg))' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'hsl(var(--color-primary))' }}>{editingMember._id === 'NEW' ? 'Register New Member' : editingMember.name}</h2>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                            <p style={{ color: 'var(--color-text-dim)', margin: 0 }}>{editingMember.studentRegNo} • {editingMember.campus}</p>
                                            {memberInsights?.history?.[0] && !loadingInsights && (
                                                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', color: 'var(--color-text-dim)' }}>
                                                    Last seen: {new Date(memberInsights.history[0].date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        {['developer', 'superadmin', 'admin', 'Admin'].includes(userRole) && editingMember._id !== 'NEW' && (
                                            <button
                                                className="btn"
                                                onClick={() => setIsEditingMemberProfile(!isEditingMemberProfile)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: isEditingMemberProfile ? 'hsl(var(--color-primary))' : 'rgba(255,255,255,0.05)',
                                                    color: isEditingMemberProfile ? 'white' : 'var(--color-text-dim)'
                                                }}
                                            >
                                                {isEditingMemberProfile ? 'View Insights' : 'Edit Profile'}
                                            </button>
                                        )}
                                        <button className="btn" onClick={() => { setEditingMember(null); setMemberInsights(null); setIsEditingMemberProfile(false); }} style={{ padding: '0.5rem 1rem' }}>Close</button>
                                    </div>
                                </div>

                                {editingMember._id === 'NEW' || isEditingMemberProfile ? (
                                    <form onSubmit={saveMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Full Name</label>
                                                <input className="input-field" required value={editingMember.name} onChange={e => setEditingMember({ ...editingMember, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Admission Number</label>
                                                <input
                                                    className="input-field"
                                                    required
                                                    value={editingMember.studentRegNo}
                                                    onChange={e => {
                                                        let val = e.target.value.replace(/\D/g, '');
                                                        if (val.length > 2) {
                                                            val = val.slice(0, 2) + '-' + val.slice(2, 6);
                                                        }
                                                        setEditingMember({ ...editingMember, studentRegNo: val });
                                                    }}
                                                    placeholder="e.g. 22-0000"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Campus</label>
                                                <select className="input-field" value={editingMember.campus} onChange={e => setEditingMember({ ...editingMember, campus: e.target.value })}>
                                                    <option value="Athi River">Athi River</option>
                                                    <option value="Valley Road">Valley Road</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Category</label>
                                                <select className="input-field" value={editingMember.memberType} onChange={e => setEditingMember({ ...editingMember, memberType: e.target.value })}>
                                                    <option value="Douloid">Douloid</option>
                                                    <option value="Recruit">Recruit</option>
                                                    <option value="Visitor">Visitor</option>
                                                    <option value="Exempted">Exempted</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Membership Status</label>
                                                <select className="input-field" value={editingMember.status || 'Active'} onChange={e => setEditingMember({ ...editingMember, status: e.target.value })}>
                                                    <option value="Active">Active</option>
                                                    <option value="Archived">Archived (Paused Access)</option>
                                                    <option value="Graduated">Graduated</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Last Active Semester</label>
                                                <input
                                                    className="input-field"
                                                    value={editingMember.lastActiveSemester || ''}
                                                    onChange={e => setEditingMember({ ...editingMember, lastActiveSemester: e.target.value })}
                                                    placeholder="e.g. JAN-APR 2026"
                                                />
                                            </div>
                                        </div>

                                        <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.75rem' }}>Tree Watering Commitments (Weekly)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                                    const isActive = (editingMember.wateringDays || []).includes(day);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = editingMember.wateringDays || [];
                                                                const updated = isActive
                                                                    ? current.filter(d => d !== day)
                                                                    : [...current, day];
                                                                setEditingMember({ ...editingMember, wateringDays: updated });
                                                            }}
                                                            style={{
                                                                padding: '0.5rem 0.8rem',
                                                                borderRadius: '0.5rem',
                                                                border: '1px solid',
                                                                borderColor: isActive ? '#4ade80' : 'rgba(255,255,255,0.1)',
                                                                background: isActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)',
                                                                color: isActive ? '#4ade80' : 'var(--color-text-dim)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {day.slice(0, 3).toUpperCase()}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {['developer', 'superadmin', 'Admin', 'superadmin'].includes(userRole) && (
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Total Points</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={editingMember.totalPoints || 0}
                                                    onChange={e => setEditingMember({ ...editingMember, totalPoints: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        )}
                                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>Save Changes</button>
                                        {isEditingMemberProfile && (
                                            <button type="button" className="btn" onClick={() => setIsEditingMemberProfile(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                                        )}
                                    </form>
                                ) : (
                                    <div>
                                        {loadingInsights ? (
                                            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Analyzing attendance data...</div>
                                        ) : memberInsights ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                {/* Stats Cards */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Points</div>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFD700' }}>{editingMember.totalPoints || 0}</div>
                                                    </div>
                                                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Attended</div>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#25AAE1' }}>{memberInsights.stats.physicalAttended}{memberInsights.stats.exemptedCount > 0 ? ` + ${memberInsights.stats.exemptedCount}E` : ''} / {memberInsights.stats.totalMeetings}</div>
                                                    </div>
                                                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Consistency</div>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: memberInsights.stats.percentage > 75 ? '#4ade80' : '#facc15' }}>{memberInsights.stats.percentage}%</div>
                                                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${Math.min(memberInsights.stats.percentage, 100)}%`,
                                                                height: '100%',
                                                                background: memberInsights.stats.percentage > 75 ? '#4ade80' : memberInsights.stats.percentage > 40 ? '#facc15' : '#ef4444',
                                                                transition: 'width 0.5s ease'
                                                            }}></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Attendance Trend (Custom Chart) */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Attendance Trend (Last 20)</h4>
                                                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <div style={{ width: '8px', height: '8px', background: '#25AAE1', borderRadius: '2px' }}></div> Present
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <div style={{ width: '8px', height: '8px', background: '#FFD700', borderRadius: '2px' }}></div> Exempt
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <div style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}></div> Absent
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem' }}>
                                                        {memberInsights.history.slice(0, 20).reverse().map((h, idx) => (
                                                            <div
                                                                key={idx}
                                                                title={`${h.name} (${new Date(h.date).toLocaleDateString()}): ${h.isExempted ? 'Exempted' : h.attended ? 'Present' : 'Absent'}`}
                                                                style={{
                                                                    flex: 1,
                                                                    height: (h.attended || h.isExempted) ? '100%' : '15%',
                                                                    background: h.isExempted ? '#FFD700' : h.attended ? '#25AAE1' : 'rgba(255,255,255,0.1)',
                                                                    borderRadius: '2px',
                                                                    transition: 'all 0.3s ease',
                                                                    opacity: (h.attended || h.isExempted) ? 1 : 0.3
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Category Display */}
                                                <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Profile Category</h4>
                                                    </div>
                                                    <span style={{
                                                        padding: '0.4rem 1rem',
                                                        borderRadius: '2rem',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        background: editingMember.memberType === 'Exempted' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                                                        color: editingMember.memberType === 'Exempted' ? '#f87171' : '#a78bfa',
                                                        border: editingMember.memberType === 'Exempted' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(167, 139, 250, 0.2)'
                                                    }}>
                                                        {editingMember.memberType.toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* History List */}
                                                <div>
                                                    <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Meeting History</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {memberInsights.history.slice(0, 10).map((h, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.4rem', fontSize: '0.85rem' }}>
                                                                <span>{h.name}</span>
                                                                <span style={{ color: h.isExempted ? '#FFD700' : h.attended ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                                                                    {h.isExempted ? 'EXEMPTED' : h.attended ? 'PRESENT' : 'ABSENT'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '3rem', textAlign: 'center' }}>No attendance history found.</div>
                                        )}
                                        {/* Super Admin Actions */}
                                        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <button
                                                className="btn"
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(37, 170, 225, 0.1)',
                                                    color: '#25AAE1',
                                                    border: '1px solid rgba(37, 170, 225, 0.2)',
                                                    padding: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem'
                                                }}
                                                onClick={() => handleResetDevice(editingMember._id)}
                                            >
                                                <RotateCcw size={16} /> Unlock Device / Reset Link
                                            </button>

                                            {editingMember.memberType === 'Recruit' && (
                                                <button
                                                    className="btn"
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(167, 139, 250, 0.1)',
                                                        color: '#a78bfa',
                                                        border: '1px solid rgba(167, 139, 250, 0.2)',
                                                        padding: '0.75rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                    onClick={() => handleGraduateMember(editingMember._id)}
                                                >
                                                    <GraduationCap size={16} /> Graduate / Promote
                                                </button>
                                            )}

                                            {['developer', 'superadmin'].includes(userRole) && (
                                                <button
                                                    className="btn"
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(234, 179, 8, 0.1)',
                                                        color: '#eab308',
                                                        border: '1px solid rgba(234, 179, 8, 0.2)',
                                                        padding: '0.75rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                    onClick={() => handleResetMemberPoints(editingMember._id)}
                                                >
                                                    <RotateCcw size={16} /> Reset Points (Set to 0)
                                                </button>
                                            )}

                                            {['developer', 'superadmin'].includes(userRole) && (
                                                <button
                                                    className="btn"
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        padding: '0.75rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                    onClick={() => handleDeleteMember(editingMember._id, editingMember.name)}
                                                >
                                                    <Trash2 size={16} /> Delete Member Permanentely
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Bulk List Tool Modal */}
                {showBulkListTool && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div className="glass-panel" style={{
                            width: '90%', maxWidth: '500px', padding: '2rem',
                            background: 'var(--color-bg-alt)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            animation: 'slideUp 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <ListChecks size={24} color="hsl(var(--color-primary))" />
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Master Bulk Tool</h3>
                                </div>
                                <button onClick={() => setShowBulkListTool(false)} className="btn" style={{ padding: '0.4rem', background: 'transparent' }}><X size={20} /></button>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                Paste a list of Student Registration Numbers (one per line) from your master list to process them in bulk.
                            </p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', opacity: 0.6 }}>SELECT TARGET ACTION</label>
                                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '0.5rem' }}>
                                    <button
                                        onClick={() => setBulkListType('graduate')}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                            background: bulkListType === 'graduate' ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                                            color: bulkListType === 'graduate' ? '#a78bfa' : 'var(--color-text-dim)',
                                            fontWeight: 800, fontSize: '0.8rem'
                                        }}
                                    >GRADUATE PASS</button>
                                    <button
                                        onClick={() => setBulkListType('archive')}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                            background: bulkListType === 'archive' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                            color: bulkListType === 'archive' ? '#f87171' : 'var(--color-text-dim)',
                                            fontWeight: 800, fontSize: '0.8rem'
                                        }}
                                    >ARCHIVE / FAIL</button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', opacity: 0.6 }}>PASTE REGISTRATION NUMBERS</label>
                                <textarea
                                    className="input"
                                    rows="8"
                                    placeholder="PASTE LIST HERE...&#10;CIT-1-1234/2022&#10;CIT-1-5678/2022"
                                    style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', fontSize: '0.9rem', fontFamily: 'monospace', borderRadius: '0.75rem', color: 'white' }}
                                    value={bulkListInput}
                                    onChange={(e) => setBulkListInput(e.target.value)}
                                />
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '0.5rem', fontWeight: 600 }}>
                                    Detected {bulkListInput.split('\n').filter(r => r.trim()).length} unique numbers.
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}
                                onClick={handleBulkListAction}
                                disabled={importLoading || !bulkListInput.trim()}
                            >
                                {importLoading ? 'PROCESSING LIST...' : `CONFIRM BULK ${bulkListType.toUpperCase()}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Attendance View Modal */}
                {
                    viewingAttendance && (
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
                                    <AttendanceTable meeting={viewingAttendance} setMsg={setMsg} isGuest={isGuest} />
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    selectedMeeting && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                        }} onClick={() => setSelectedMeeting(null)}>
                            <div className="glass-panel qr-modal-content" style={{ padding: '2rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                <h3 style={{ marginBottom: '1rem' }}>Scan to Check In</h3>

                                {/* 
                                SECURITY FEATURE: Screen Blur
                                We blur the QR code on screen so it cannot be scanned directly.
                                It must be printed to be scanned cleanly.
                            */}
                                <div style={{
                                    background: 'white',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    display: 'inline-block'
                                }}>
                                    <QRCode
                                        value={`${window.location.origin}/check-in/${selectedMeeting.code}`}
                                        size={256}
                                        level="H"
                                    />
                                </div>


                                <div style={{ margin: '1.5rem 0' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>MANUAL CODE</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'hsl(var(--color-primary))', letterSpacing: '4px', lineHeight: 1 }}>
                                        {selectedMeeting.code.toUpperCase()}
                                    </div>
                                </div>

                                <p style={{ marginTop: '0', fontWeight: 'bold' }}>{selectedMeeting.name}</p>
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
                                            setMsg({ type: 'success', text: 'Link copied to clipboard!' });
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
                                        </a >
                                    )}
                                </div >
                                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginTop: '1.5rem', opacity: 0.7 }}>Click anywhere outside to close</p>
                            </div>
                        </div>
                    )}



                {/* Edit Admin Modal */}
                {editingAdmin && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 120
                    }}>
                        <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{editingAdmin._id === 'NEW' ? 'Register New Admin' : `Edit Admin: ${editingAdmin.username}`}</h3>
                            <form onSubmit={handleSaveAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label>Username</label>
                                    <input
                                        className="input-field"
                                        value={editingAdmin.username}
                                        onChange={e => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                                        required
                                        placeholder="e.g. john_doe"
                                    />
                                </div>
                                <div>
                                    <label>{editingAdmin._id === 'NEW' ? 'Password' : 'New Password (leave blank to keep current)'}</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={editingAdmin.password || ''}
                                        onChange={e => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                                        required={editingAdmin._id === 'NEW'}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label>Role</label>
                                    <select
                                        className="input-field"
                                        value={editingAdmin.role}
                                        onChange={e => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                                    >
                                        <option value="admin">Admin (Standard)</option>
                                        <option value="superadmin">Super Admin (Can manage others)</option>
                                        <option value="developer">Developer (Full Control)</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Primary Campus</label>
                                    <select
                                        className="input-field"
                                        value={editingAdmin.campus}
                                        onChange={e => setEditingAdmin({ ...editingAdmin, campus: e.target.value })}
                                    >
                                        <option value="Athi River">Athi River</option>
                                        <option value="Valley Road">Valley Road</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingAdmin._id === 'NEW' ? 'Create Admin' : 'Save Changes'}</button>
                                    <button type="button" className="btn" onClick={() => setEditingAdmin(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Meeting Insights Modal */}
                {insightMeeting && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110, padding: '1rem'
                    }}>
                        <div style={{ width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto' }}>
                            <MeetingInsights
                                meeting={insightMeeting}
                                onClose={() => setInsightMeeting(null)}
                                api={api}
                                onQuickCheckIn={async (mid, reg) => {
                                    await handleQuickCheckIn(mid, reg);
                                    // Refresh insights after manual checkin
                                    setInsightMeeting({ ...insightMeeting });
                                }}
                            />
                        </div>
                    </div>
                )}
                {/* Edit Meeting Modal */}
                {
                    editingMeeting && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                        }}>
                            <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Edit Meeting Content</h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        // Format date and clean up
                                        const updateData = {
                                            ...editingMeeting,
                                            date: new Date(editingMeeting.date).toISOString()
                                        };
                                        await api.patch(`/meetings/${editingMeeting._id}`, updateData);
                                        setMsg({ type: 'success', text: 'Meeting updated!' });
                                        setEditingMeeting(null);
                                        fetchMeetings();
                                    } catch (err) {
                                        setMsg({ type: 'error', text: 'Failed to update: ' + (err.response?.data?.message || err.message) });
                                    }
                                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--glass-border)', pb: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label>Meeting Name</label>
                                            <input
                                                className="input-field"
                                                value={editingMeeting.name || ''}
                                                onChange={e => setEditingMeeting({ ...editingMeeting, name: e.target.value })}
                                                placeholder="e.g. Weekly Doulos"
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label>Date</label>
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    value={editingMeeting.date ? new Date(editingMeeting.date).toISOString().split('T')[0] : ''}
                                                    onChange={e => setEditingMeeting({ ...editingMeeting, date: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label>Campus</label>
                                                <select
                                                    className="input-field"
                                                    value={editingMeeting.campus}
                                                    onChange={e => setEditingMeeting({ ...editingMeeting, campus: e.target.value })}
                                                >
                                                    <option value="Athi River">Athi River</option>
                                                    <option value="Valley Road">Valley Road</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label>Start Time</label>
                                                <input
                                                    type="time"
                                                    className="input-field"
                                                    value={editingMeeting.startTime || ''}
                                                    onChange={e => setEditingMeeting({ ...editingMeeting, startTime: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label>End Time</label>
                                                <input
                                                    type="time"
                                                    className="input-field"
                                                    value={editingMeeting.endTime || ''}
                                                    onChange={e => setEditingMeeting({ ...editingMeeting, endTime: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label>Reporting Semester</label>
                                            <select className="input-field" value={editingMeeting.semester || 'JAN-APR 2026'} onChange={e => setEditingMeeting({ ...editingMeeting, semester: e.target.value })}>
                                                <option value="JAN-APR 2026">JAN-APR 2026</option>
                                                <option value="MAY-AUG 2026">MAY-AUG 2026</option>
                                                <option value="SEP-DEC 2026">SEP-DEC 2026</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label>Question of the Day</label>
                                            <textarea
                                                className="input-field"
                                                rows="2"
                                                value={editingMeeting.questionOfDay || ''}
                                                onChange={e => setEditingMeeting({ ...editingMeeting, questionOfDay: e.target.value })}
                                                placeholder="e.g. What are you grateful for?"
                                            />
                                        </div>

                                        <div>
                                            <label>Location Name</label>
                                            <input
                                                className="input-field"
                                                value={editingMeeting.location?.name || ''}
                                                onChange={e => setEditingMeeting({
                                                    ...editingMeeting,
                                                    location: { ...(editingMeeting.location || {}), name: e.target.value }
                                                })}
                                                placeholder="Venue Name"
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label>Category</label>
                                                <select
                                                    className="input-field"
                                                    value={editingMeeting.category || 'Meeting'}
                                                    onChange={e => setEditingMeeting({ ...editingMeeting, category: e.target.value })}
                                                >
                                                    <option value="Meeting">Standard Meeting</option>
                                                    <option value="Training">Doulos Training</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    id="edit-manual"
                                                    checked={editingMeeting.allowManualOverride || false}
                                                    onChange={e => setEditingMeeting({ ...editingMeeting, allowManualOverride: e.target.checked })}
                                                    style={{ width: '20px', height: '20px' }}
                                                />
                                                <label htmlFor="edit-manual" style={{ margin: 0, cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    Admin-Only Mode
                                                </label>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label>Latitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="input-field"
                                                    value={editingMeeting.location?.latitude || ''}
                                                    onChange={e => setEditingMeeting({
                                                        ...editingMeeting,
                                                        location: { ...(editingMeeting.location || {}), latitude: parseFloat(e.target.value) }
                                                    })}
                                                    placeholder="-1.2345"
                                                />
                                            </div>
                                            <div>
                                                <label>Longitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="input-field"
                                                    value={editingMeeting.location?.longitude || ''}
                                                    onChange={e => setEditingMeeting({
                                                        ...editingMeeting,
                                                        location: { ...(editingMeeting.location || {}), longitude: parseFloat(e.target.value) }
                                                    })}
                                                    placeholder="36.7890"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label>Devotion (Topic / Verse)</label>
                                        <textarea
                                            className="input-field"
                                            rows="3"
                                            value={editingMeeting.devotion || ''}
                                            onChange={e => setEditingMeeting({ ...editingMeeting, devotion: e.target.value })}
                                            placeholder="e.g. John 3:16 - The Heart of Service"
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label>Ice Breaker / Activity</label>
                                        <textarea
                                            className="input-field"
                                            rows="2"
                                            value={editingMeeting.iceBreaker || ''}
                                            onChange={e => setEditingMeeting({ ...editingMeeting, iceBreaker: e.target.value })}
                                            placeholder="e.g. Two Truths and a Lie"
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label>Announcements</label>
                                        <textarea
                                            className="input-field"
                                            rows="3"
                                            value={editingMeeting.announcements || ''}
                                            onChange={e => setEditingMeeting({ ...editingMeeting, announcements: e.target.value })}
                                            placeholder="Check your emails for the retreat info!"
                                        ></textarea>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                                        <button type="button" className="btn" onClick={() => setEditingMeeting(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Cancel</button>
                                    </div>


                                </form>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

const ReportsView = ({ meetings, members, onViewAttendance, onDownload, onDownloadCSV, onDownloadCumulativeCSV }) => {
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
        const semesterMatch = filterSemester === 'All' ||
            (filterSemester === 'Current' ? getSemester(m.date) === currentSemester : getSemester(m.date) === filterSemester);
        const campusMatch = filterCampus === 'All' || m.campus === filterCampus;
        return semesterMatch && campusMatch;
    });

    const totalAttendance = filteredMeetings.reduce((acc, m) => acc + (m.attendanceCount || 0), 0);
    const averageAttendance = filteredMeetings.length > 0 ? (totalAttendance / filteredMeetings.length).toFixed(1) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Reports & Analytics</h2>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Real-time attendance tracking and insights</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.75rem' }}>
                        <select
                            className="input-field"
                            style={{
                                padding: '0.5rem 2rem 0.5rem 1rem',
                                width: 'auto',
                                border: 'none',
                                background: 'rgba(255,255,255,0.05)',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                        >
                            <option value="Current">This Semester</option>
                            <option value="All">All Time</option>
                            {semesters.filter(s => s !== currentSemester).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            className="input-field"
                            style={{
                                padding: '0.5rem 2rem 0.5rem 1rem',
                                width: 'auto',
                                border: 'none',
                                background: 'rgba(255,255,255,0.05)',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                        >
                            <option value="All">Global (All)</option>
                            <option value="Athi River">Athi River</option>
                            <option value="Valley Road">Valley Road</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    <div style={{ padding: '2.5rem', background: 'linear-gradient(135deg, rgba(37, 170, 225, 0.1) 0%, rgba(37, 170, 225, 0.05) 100%)', borderRadius: '2rem', border: '1px solid rgba(37, 170, 225, 0.2)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#25AAE1', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>
                            <Activity size={18} /> Accumulative Reach
                        </div>
                        <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: 'white', lineHeight: 1 }}>{totalAttendance}</div>
                        <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Aggregate check-ins recorded</p>
                        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}>
                            <Activity size={120} />
                        </div>
                    </div>

                    <div style={{ padding: '2.5rem', background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%)', borderRadius: '2rem', border: '1px solid rgba(167, 139, 250, 0.2)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>
                            <Calendar size={18} /> Total Events
                        </div>
                        <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: 'white', lineHeight: 1 }}>{filteredMeetings.length}</div>
                        <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Sessions captured in repository</p>
                        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}>
                            <Calendar size={120} />
                        </div>
                    </div>

                    <div style={{ padding: '2.5rem', background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(250, 204, 21, 0.05) 100%)', borderRadius: '2rem', border: '1px solid rgba(250, 204, 21, 0.2)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#facc15', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>
                            <Users size={18} /> Mean Attendance
                        </div>
                        <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: 'white', lineHeight: 1 }}>{averageAttendance}</div>
                        <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Average members per session</p>
                        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}>
                            <Users size={120} />
                        </div>
                    </div>
                </div>

                {/* Visual Analytics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', height: '350px', background: 'rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', color: '#25AAE1' }}>Frequency Analysis</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={[...filteredMeetings].reverse().map(m => ({ name: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: m.attendanceCount || 0 }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--color-text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                                    itemStyle={{ color: 'hsl(var(--color-text))', fontWeight: 700 }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#25AAE1" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#25AAE1', stroke: 'hsl(var(--color-bg))', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem', height: '350px', background: 'var(--glass-bg)' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', color: '#a78bfa' }}>Segment Integrity</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Douloids', value: members.filter(m => m.memberType === 'Douloid' && (filterCampus === 'All' || m.campus === filterCampus)).length },
                                        { name: 'Recruits', value: members.filter(m => m.memberType === 'Recruit' && (filterCampus === 'All' || m.campus === filterCampus)).length },
                                        { name: 'Visitors', value: members.filter(m => (m.memberType === 'Visitor' || !m.memberType) && (filterCampus === 'All' || m.campus === filterCampus)).length },
                                    ]}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="#FFD700" />
                                    <Cell fill="#a78bfa" />
                                    <Cell fill="#25AAE1" />
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ background: 'var(--glass-bg)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--color-text-dim)' }}>Archived Logs</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '0.5rem' }}>
                                <button
                                    onClick={() => setReportType('summary')}
                                    style={{
                                        padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                        background: reportType === 'summary' ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                                        color: reportType === 'summary' ? '#25AAE1' : 'var(--color-text-dim)',
                                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase'
                                    }}
                                >Logs</button>
                                <button
                                    onClick={() => setReportType('cumulative')}
                                    style={{
                                        padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                        background: reportType === 'cumulative' ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                                        color: reportType === 'cumulative' ? '#25AAE1' : 'var(--color-text-dim)',
                                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase'
                                    }}
                                >Cumulative</button>
                            </div>
                        </div>
                    </div>

                    {reportType === 'summary' ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Meeting Name</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Campus</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Attendance</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'center' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMeetings.map((m, i) => (
                                        <tr key={i} className="hover-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s' }}>
                                            <td style={{ padding: '1.25rem', fontWeight: 600, color: 'white' }}>{m.name}</td>
                                            <td style={{ padding: '1.25rem', fontSize: '0.8rem', opacity: 0.6 }}>{new Date(m.date).toLocaleDateString('en-GB')}</td>
                                            <td style={{ padding: '1.25rem' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#facc15', background: 'rgba(250, 204, 21, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                    {m.campus.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem', fontWeight: 800, color: '#25AAE1', fontSize: '1.1rem' }}>{m.attendanceCount || 0}</td>
                                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => onViewAttendance(m)}
                                                        className="btn-icon"
                                                        style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1' }}
                                                    >
                                                        <Users size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDownloadCSV(m._id, m.name)}
                                                        className="btn-icon"
                                                        style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15' }}
                                                    >
                                                        <FileSpreadsheet size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Subject Name</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>ID Hash</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Classification</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Aggregated Units</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members
                                        .filter(m => filterCampus === 'All' || m.campus === filterCampus)
                                        .map((m, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '1.25rem', fontWeight: 600, color: 'white' }}>{m.name || 'Unknown'}</td>
                                                <td style={{ padding: '1.25rem', fontSize: '0.8rem', opacity: 0.6, fontFamily: 'monospace' }}>{m.studentRegNo}</td>
                                                <td style={{ padding: '1.25rem' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        color: m.memberType === 'Douloid' ? '#FFD700' : '#25AAE1',
                                                        border: `1px solid ${m.memberType === 'Douloid' ? 'rgba(255,215,0,0.3)' : 'rgba(37,170,225,0.3)'}`,
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '20px'
                                                    }}>
                                                        {m.memberType.toUpperCase() || 'VISITOR'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem', fontWeight: 800, fontSize: '1.1rem', color: '#4ade80' }}>{m.totalAttended}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AttendanceTable = ({ meeting, setMsg, isGuest }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const userRole = localStorage.getItem('role') || 'admin';

    const deleteRecord = async (id) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Delete this attendance record?')) return;
        try {
            await api.delete(`/attendance/${id}`);
            setRecords(records.filter(r => r._id !== id));
            setMsg({ type: 'success', text: 'Record deleted.' });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete' });
        }
    };

    const toggleExemption = async (id) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        try {
            const res = await api.patch(`/attendance/${id}/exemption`);
            setRecords(records.map(r => r._id === id ? { ...r, isExempted: res.data.isExempted } : r));
            setMsg({ type: 'success', text: `Status updated to ${res.data.isExempted ? 'Exempted' : 'Present'}` });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update exemption status' });
        }
    };


    useEffect(() => {
        const fetchAttendance = async () => {
            if (isGuest) {
                setRecords([
                    { _id: '1', timestamp: new Date().toISOString(), memberType: 'Douloid', studentRegNo: 'GM-001', responses: { name: 'Guest User 1' }, isExempted: false },
                    { _id: '2', timestamp: new Date().toISOString(), memberType: 'Visitor', studentRegNo: 'GM-002', responses: { name: 'Guest User 2' }, isExempted: true },
                ]);
                setLoading(false);
                return;
            }
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
        if (r.questionOfDay && !sampleQuestion) sampleQuestion = r.questionOfDay;
    });

    const hasDailyQuestion = records.some(r => r.questionOfDay);

    const headers = Array.from(allKeys);


    // Filtering logic
    const filteredRecords = records.filter(r => {
        const cleanSearch = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
        const responses = Object.values(r.responses || {}).join(' ').toLowerCase();
        const searchPool = [
            responses,
            r.memberType.toLowerCase(),
            r.studentRegNo.toLowerCase()
        ].join(' ').replace(/[^a-z0-9]/g, '');

        return searchPool.includes(cleanSearch);
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
                                <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Status</th>
                                {['developer', 'superadmin'].includes(userRole) && (
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Action</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((r, i) => {
                                const responses = r.responses || {};
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                            {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '1rem' }}>
                                            {r.memberType === 'Douloid' ? '🦁' : r.memberType === 'Recruit' ? '⚔️' : '👋'} {r.memberType}
                                        </td>
                                        {headers.map(h => (
                                            <td key={h} style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                {responses[h] || '-'}
                                            </td>
                                        ))}

                                        {hasDailyQuestion && (
                                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#a78bfa', maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                {r.questionOfDay || r.responses?.dailyQuestionAnswer || '-'}
                                            </td>
                                        )}
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => toggleExemption(r._id)}
                                                style={{
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '2rem',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    background: r.isExempted ? 'rgba(250, 204, 21, 0.1)' : 'rgba(37, 170, 225, 0.1)',
                                                    color: r.isExempted ? '#facc15' : '#25AAE1',
                                                    border: r.isExempted ? '1px solid rgba(250, 204, 21, 0.2)' : '1px solid rgba(37, 170, 225, 0.2)',
                                                    letterSpacing: '0.5px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {r.isExempted ? 'EXEMPTED' : 'PRESENT'}
                                            </button>
                                        </td>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const AdminsView = ({ admins, loading, onEdit, onDelete, onRegister, guestFeaturesEnabled, currentSemester, onUpdateSetting }) => {
    const userRole = localStorage.getItem('role')?.toLowerCase();
    const canManageAdmins = ['developer', 'superadmin'].includes(userRole);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s' }}>
            {canManageAdmins && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>System Administrators</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Manage access levels for the dashboard.</p>
                        </div>
                        <button className="btn btn-primary" onClick={onRegister} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> Register Admin
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>Username</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>Role</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Loading staff registry...</td></tr>
                                ) : (
                                    admins.map(a => (
                                        <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{a.username}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    background: a.role === 'developer' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(37, 170, 225, 0.1)',
                                                    color: a.role === 'developer' ? '#8b5cf6' : '#25AAE1',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {a.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button className="btn-icon" onClick={() => onEdit(a)}><Pencil size={18} /></button>
                                                    <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => onDelete(a._id)}><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}



            {canManageAdmins && (
                <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid #facc15' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', borderRadius: '0.75rem' }}>
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Guest & Feedback Access</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                    Control visibility of public guest links and the feedback system.
                                </p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: guestFeaturesEnabled ? '#4ade80' : '#ef4444', fontWeight: 700 }}>
                                    CURRENT STATUS: {guestFeaturesEnabled ? 'ACTIVE • Visible to public' : 'DISABLED • Hidden from interface'}
                                </p>
                            </div>
                        </div>
                        <button
                            className="btn"
                            onClick={() => onUpdateSetting('guest_features', !guestFeaturesEnabled)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: guestFeaturesEnabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                                color: guestFeaturesEnabled ? '#ef4444' : '#4ade80',
                                border: `1px solid ${guestFeaturesEnabled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)'}`,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {guestFeaturesEnabled ? (
                                <>Turn OFF Features <X size={18} /></>
                            ) : (
                                <>Turn ON Features <Check size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {canManageAdmins && (
                <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid #25AAE1', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', borderRadius: '0.75rem' }}>
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Active Semester</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                    Define the current academic period for enrollment and activity tracking.
                                </p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#25AAE1', fontWeight: 700 }}>
                                    CURRENT: {currentSemester}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                className="input-field"
                                style={{ width: '200px', fontSize: '0.9rem' }}
                                value={currentSemester}
                                onChange={(e) => onUpdateSetting('current_semester', e.target.value)}
                                placeholder="e.g. JAN-APR 2026"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeedbackView = ({ isGuest }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, new, read, resolved

    const fetchFeedbacks = async () => {
        setLoading(true);
        if (isGuest) {
            setFeedbacks([
                { _id: '1', name: 'Guest User', message: 'I love the new dashboard design!', category: 'general', status: 'new', createdAt: new Date().toISOString() },
                { _id: '2', name: 'Anonymous', message: 'Can you add a dark mode toggle?', category: 'feature_request', status: 'read', createdAt: new Date(Date.now() - 86400000).toISOString() }
            ]);
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/feedback');
            setFeedbacks(res.data);
        } catch (err) {
            console.error('Failed to fetch feedback', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, [isGuest]);

    const handleStatusUpdate = async (id, newStatus) => {
        if (isGuest) return alert('Action disabled in Guest Mode');
        const originalFeedbacks = [...feedbacks];
        // Optimistic update
        setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, status: newStatus } : f));

        try {
            await api.patch(`/feedback/${id}`, { status: newStatus });
        } catch (err) {
            alert('Failed to update status');
            setFeedbacks(originalFeedbacks); // Revert
        }
    };

    const handleDelete = async (id) => {
        if (isGuest) return alert('Action disabled in Guest Mode');
        if (!window.confirm('Delete this feedback?')) return;
        try {
            await api.delete(`/feedback/${id}`);
            setFeedbacks(prev => prev.filter(f => f._id !== id));
        } catch (err) {
            alert('Failed to delete feedback');
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => filter === 'all' || f.status === filter);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading feedback...</div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>User Feedback</h2>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-dim)' }}>Manage suggestions and issues reported by users.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                        {['all', 'new', 'read', 'resolved'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: filter === s ? 'hsl(var(--color-primary))' : 'transparent',
                                    color: filter === s ? 'white' : 'var(--color-text-dim)',
                                    border: 'none', borderRadius: '0.4rem', cursor: 'pointer',
                                    fontWeight: 600, textTransform: 'capitalize'
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredFeedbacks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No feedback found.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {filteredFeedbacks.map(f => (
                            <div key={f._id} style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                borderLeft: `4px solid ${f.status === 'new' ? '#facc15' : f.status === 'resolved' ? '#4ade80' : '#94a3b8'}`,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{f.name || 'Anonymous'}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                                        <span style={{
                                            fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '1rem',
                                            background: 'rgba(255,255,255,0.1)', color: 'var(--color-text-dim)', textTransform: 'uppercase'
                                        }}>
                                            {f.category}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>{f.message}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', minWidth: '120px' }}>
                                    <select
                                        value={f.status}
                                        onChange={(e) => handleStatusUpdate(f._id, e.target.value)}
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem' }}
                                    >
                                        <option value="new">New</option>
                                        <option value="read">Read</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <button
                                        onClick={() => handleDelete(f._id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const SystemView = ({ onUpdateSetting, isGuest }) => {
    const [semester, setSemester] = useState('JAN-APR 2026');
    const [guestAccess, setGuestAccess] = useState('true');
    const [waLink, setWaLink] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const [semRes, guestRes, waRes] = await Promise.all([
                    api.get('/settings/current_semester'),
                    api.get('/settings/guest_features'),
                    api.get('/settings/whatsapp_link')
                ]);
                if (semRes.data?.value) setSemester(semRes.data.value);
                if (guestRes.data?.value) setGuestAccess(guestRes.data.value);
                if (waRes.data?.value) setWaLink(waRes.data.value);
            } catch (err) {
                console.error("Failed to fetch system settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading System Configurations...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', borderRadius: '1rem' }}>
                        <SettingsIcon size={32} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Global Settings</h2>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-dim)' }}>Configure system-wide parameters and access controls.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {/* Active Semester */}
                    <div className="input-group">
                        <label>Active Tracking Semester</label>
                        <input
                            className="input-field"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            placeholder="JAN-APR 2026"
                        />
                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={() => onUpdateSetting('current_semester', semester)}>Update Semester</button>
                    </div>

                    {/* WhatsApp Support Link */}
                    <div className="input-group">
                        <label>G9 Group/Support Link</label>
                        <input
                            className="input-field"
                            value={waLink}
                            onChange={(e) => setWaLink(e.target.value)}
                            placeholder="https://chat.whatsapp.com/..."
                        />
                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={() => onUpdateSetting('whatsapp_link', waLink)}>Update Link</button>
                    </div>

                    {/* Guest Mode */}
                    <div className="input-group">
                        <label>Public Guest Access</label>
                        <select className="input-field" value={guestAccess} onChange={(e) => setGuestAccess(e.target.value)}>
                            <option value="true">Enabled (Allow Guest Link on Login)</option>
                            <option value="false">Disabled (Private Only)</option>
                        </select>
                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={() => onUpdateSetting('guest_features', guestAccess)}>Update Policy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
