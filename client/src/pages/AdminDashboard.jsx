import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import QRCode from 'react-qr-code';
import MeetingInsights from '../components/MeetingInsights';
import {
    Users, BarChart3, Sun, Moon, Link as LinkIcon, ExternalLink,
    ShieldAlert, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, Check, X,
    FileText, ListChecks, Settings as SettingsIcon, CheckCircle, LayoutDashboard,
    Calendar, Clock, Trash2, ShieldAlert as Ghost, Lightbulb, MessageCircle,
    GraduationCap, Wallet, Pencil, Plus, Download, FileSpreadsheet, Star,
    Activity, LogOut, Search, MapPin, Compass, Heart, Package, Award, Shield, DollarSign, QrCode, Bell, User, Menu
} from 'lucide-react';
import '../styles/adminTheme.css';
import { PrimaryButton, OutlineButton } from '../components/common/Buttons';
import Logo from '../components/Logo';
import AdminFinanceView from '../components/AdminFinanceView';
import EventsManager from '../components/EventsManager';

import MeetingsTab from '../components/dashboard/MeetingsTab';
import TrainingsTab from '../components/dashboard/TrainingsTab';
import MembersTab from '../components/dashboard/MembersTab';
import SystemSettingsTab from '../components/dashboard/SystemSettingsTab';
import SystemObservabilityTab from '../components/dashboard/SystemObservabilityTab';
import ReportsTab from '../components/dashboard/ReportsTab';
import ExecutiveOverviewTab from '../components/dashboard/ExecutiveOverviewTab';

// G-Council Dedicated Governance Consoles & Lifecycle Modals
import G1ExecutiveRadar from '../components/dashboard/G1ExecutiveRadar';
import G3SecretariatConsole from '../components/dashboard/G3SecretariatConsole';
import G4LogisticsConsole from '../components/dashboard/G4LogisticsConsole';
import G6WelfareConsole from '../components/dashboard/G6WelfareConsole';
import G7TreasuryConsole from '../components/dashboard/G7TreasuryConsole';
import G8AssetsConsole from '../components/dashboard/G8AssetsConsole';
import G9MediaConsole from '../components/dashboard/G9MediaConsole';
import RequisitionPipelineModal from '../components/dashboard/RequisitionPipelineModal';
import TenureHandoverModal from '../components/dashboard/TenureHandoverModal';

const AdminDashboard = () => {
    const location = useLocation();
    const isGuest = location.state?.isGuest || localStorage.getItem('isGuest') === 'true';

    const mainContentRef = useRef(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        if (location.state?.isGuest) {
            localStorage.setItem('isGuest', 'true');
        }
    }, [location.state]);

    const [meetings, setMeetings] = useState([]);
    const [trainings, setTrainings] = useState([]);
    const [members, setMembers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [msg, setMsg] = useState(null);
    const [guestFeaturesEnabled, setGuestFeaturesEnabled] = useState(true);
    const [activeTab, setActiveTab] = useState(() => {
        const initial = localStorage.getItem('initialTab');
        if (initial) {
            localStorage.removeItem('initialTab');
            return initial;
        }
        const role = localStorage.getItem('role');
        const user = localStorage.getItem('username');
        if (role === 'trainer' || (user && (user.startsWith('trainer') || user === 'g5_director' || user === 'g5_training'))) {
            return 'trainings';
        }
        if (user === 'g1_coordinator' || user === 'g2_vice') return 'g1_radar';
        if (user === 'g3_secretary') return 'g3_secretariat';
        if (user === 'g4_logistics') return 'g4_logistics';
        if (user === 'g6_welfare') return 'g6_welfare';
        if (user === 'g7_treasurer') return 'g7_treasury';
        if (user === 'g8_assets') return 'g8_assets';
        if (user === 'g9_media') return 'g9_media';
        return 'members'; // Default landing page per specification!
    }); 
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'admin');
    const [globalSearch, setGlobalSearch] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
    const [quickRegNo, setQuickRegNo] = useState('');
    const [quickCheckInLoading, setQuickCheckInLoading] = useState(false);
    const [currentSemester, setCurrentSemester] = useState('MAY-AUG 2026');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeTab]);

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
                localStorage.clear();
                window.location.href = '/admin';
            }, 5 * 60 * 1000); 
        };
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();
        return () => {
            clearTimeout(timeout);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, []);

    const fetchMeetings = async () => {
        if (isGuest) {
            setMeetings([
                { _id: '1', name: 'Weekly Meeting', date: new Date().toISOString(), isActive: true, campus: 'Valley Road', attendees: 45, attendanceCount: 45 },
                { _id: '2', name: 'Leadership Summit', date: new Date(Date.now() - 86400000 * 7).toISOString(), isActive: false, campus: 'Valley Road', attendees: 120, attendanceCount: 120 },
                { _id: '3', name: 'Prayer Night', date: new Date(Date.now() - 86400000 * 14).toISOString(), isActive: false, campus: 'Athi River', attendees: 30, attendanceCount: 30 }
            ]);
            return;
        }
        try {
            const res = await api.get('/meetings?includeArchived=true');
            const sorted = res.data.sort((a, b) => {
                if (a.isActive === b.isActive) {
                    return new Date(b.date) - new Date(a.date);
                }
                return a.isActive ? -1 : 1;
            });
            setMeetings(sorted);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to sync meetings with server' });
        }
    };

    const fetchTrainings = async () => {
        if (isGuest) {
            setTrainings([
                { _id: '1', name: 'Leadership Foundations', date: new Date().toISOString(), isActive: true, campus: 'Valley Road', attendanceCount: 15 },
                { _id: '2', name: 'The Art of Mentorship', date: new Date(Date.now() - 86400000 * 7).toISOString(), isActive: false, campus: 'Athi River', attendanceCount: 38 }
            ]);
            return;
        }
        try {
            const res = await api.get('/trainings');
            setTrainings(res.data);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to sync trainings with server' });
        }
    };

    const fetchMembers = async (options = {}) => {
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
            const params = {};
            if (options.activeThisSemester !== undefined) {
                params.activeThisSemester = options.activeThisSemester;
            }
            const res = await api.get('/members', { params });
            setMembers(res.data);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to fetch members registry' });
        } finally {
            setLoadingMembers(false);
        }
    };

    const fetchSemesterSetting = async () => {
        try {
            const res = await api.get('/settings/current_semester');
            if (res.data?.value) {
                setCurrentSemester(res.data.value);
            }
        } catch (err) {
            console.error("Failed to fetch current semester", err);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchTrainings();
        fetchMembers();
        fetchSemesterSetting();
    }, []);

    useEffect(() => {
        let timer;
        if (msg) {
            timer = setTimeout(() => setMsg(null), 4000);
        }
        return () => clearTimeout(timer);
    }, [msg]);

    const handleSaveSetting = async (key, value) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Settings updates disabled in Guest Mode.' });
        try {
            await api.patch(`/settings/${key}`, { value });
            setMsg({ type: 'success', text: 'Setting updated!' });
            if (key === 'current_semester') setCurrentSemester(value);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to save system configurations.' });
        }
    };

    const handleSaveAdmin = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Staff management disabled in Guest Mode.' });
        try {
            if (editingAdmin._id === 'NEW') {
                await api.post('/auth/register', editingAdmin);
                setMsg({ type: 'success', text: 'New Administrator registered!' });
            } else {
                await api.patch(`/auth/users/${editingAdmin._id}`, editingAdmin);
                setMsg({ type: 'success', text: 'Admin profile updated!' });
            }
            setEditingAdmin(null);
            fetchAdmins();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save admin account' });
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Staff deletion disabled in Guest Mode.' });
        if (!window.confirm('Are you sure you want to permanently delete this administrator profile?')) return;
        try {
            await api.delete(`/auth/users/${id}`);
            setMsg({ type: 'success', text: 'Admin removed successfully.' });
            fetchAdmins();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to delete administrator' });
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

    const downloadPDF = async (meetingId, meetingName) => {
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
                Object.keys(responses || {}).forEach(k => {
                    if (k !== 'studentName' && k !== 'studentRegNo') {
                        allKeys.add(k);
                    }
                });
            });
            const customKeys = Array.from(allKeys);

            const printHtml = `
                <html>
                    <head>
                        <title>${meetingName} - Attendance Roster</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                            body {
                                font-family: 'Inter', sans-serif;
                                color: #1e293b;
                                padding: 2rem;
                                background: #ffffff;
                                margin: 0;
                            }
                            .header-container {
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-start;
                                border-bottom: 2px solid #e2e8f0;
                                padding-bottom: 1.5rem;
                                margin-bottom: 2rem;
                            }
                            .logo-title {
                                display: flex;
                                align-items: center;
                                gap: 1rem;
                            }
                            .title-details h1 {
                                margin: 0;
                                font-size: 1.5rem;
                                font-weight: 800;
                                color: #0f172a;
                            }
                            .title-details p {
                                margin: 0.25rem 0 0 0;
                                font-size: 0.875rem;
                                color: #64748b;
                            }
                            .meta-info {
                                text-align: right;
                                font-size: 0.875rem;
                                color: #64748b;
                            }
                            .meta-info strong {
                                color: #0f172a;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-top: 1rem;
                            }
                            th {
                                background-color: #f8fafc;
                                color: #475569;
                                text-align: left;
                                font-weight: 600;
                                font-size: 0.75rem;
                                text-transform: uppercase;
                                letter-spacing: 0.05em;
                                padding: 0.75rem 1rem;
                                border-bottom: 2px solid #cbd5e1;
                            }
                            td {
                                padding: 0.75rem 1rem;
                                font-size: 0.875rem;
                                border-bottom: 1px solid #e2e8f0;
                                color: #334155;
                            }
                            tr:nth-child(even) td {
                                background-color: #f8fafc;
                            }
                            .badge {
                                display: inline-block;
                                padding: 0.125rem 0.375rem;
                                font-size: 0.75rem;
                                font-weight: 600;
                                border-radius: 0.25rem;
                                background-color: #f1f5f9;
                                color: #475569;
                            }
                            .badge.douloid {
                                background-color: #dcfce7;
                                color: #166534;
                            }
                            .badge.recruit {
                                background-color: #dbeafe;
                                color: #1e40af;
                            }
                            .badge.visitor {
                                background-color: #fef9c3;
                                color: #854d0e;
                            }
                            @media print {
                                body {
                                    padding: 0;
                                }
                                @page {
                                    margin: 1.5cm;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header-container">
                            <div class="logo-title">
                                <div class="title-details">
                                    <h1>${meetingName}</h1>
                                    <p>Official Attendance Roster & Check-in Ledger</p>
                                </div>
                            </div>
                            <div class="meta-info">
                                <div>Date: <strong>${new Date(data[0]?.timestamp || new Date()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                                <div>Total Checked-In: <strong>${data.length}</strong></div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%">#</th>
                                    <th>Name</th>
                                    <th>Admission No.</th>
                                    <th>Category</th>
                                    <th>Time</th>
                                    ${customKeys.map(k => `<th>${k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map((r, idx) => {
                                    const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses || {};
                                    const name = responses.studentName || responses.name || r.studentName || '-';
                                    const regNo = responses.studentRegNo || r.studentRegNo || '-';
                                    const category = r.memberType || 'Visitor';
                                    const time = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const catClass = category.toLowerCase();
                                    
                                    return `
                                        <tr>
                                            <td>${idx + 1}</td>
                                            <td><strong>${name}</strong></td>
                                            <td>${regNo}</td>
                                            <td><span class="badge ${catClass}">${category}</span></td>
                                            <td>${time}</td>
                                            ${customKeys.map(k => `<td>${responses[k] || '-'}</td>`).join('')}
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>

                        <script>
                            window.onload = () => {
                                setTimeout(() => {
                                    window.print();
                                }, 500);
                            };
                        </script>
                    </body>
                </html>
            `;
            const win = window.open('', '_blank');
            win.document.write(printHtml);
            win.document.close();
            setMsg({ type: 'success', text: 'PDF document generated.' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to generate PDF' });
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

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/admin';
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [campusFilter, setCampusFilter] = useState('All');
    const [memberTypeFilter, setMemberTypeFilter] = useState('All');
    const [trainingStatusFilter, setTrainingStatusFilter] = useState('All');
    
    // Bottom sheet state
    const [insightMeeting, setInsightMeeting] = useState(null);
    const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
    const [bottomSheetType, setBottomSheetType] = useState(null); // 'add_member' | 'create_training' | 'filter_members' | 'qr_view'
    const [activeMeetingForQR, setActiveMeetingForQR] = useState(null);
    const [meetingStatusFilter, setMeetingStatusFilter] = useState('All');
    const [selectedMemberInsights, setSelectedMemberInsights] = useState(null);
    const [loadingMemberInsights, setLoadingMemberInsights] = useState(false);
    const [mobMeetingForm, setMobMeetingForm] = useState({
        name: 'Weekly Meeting',
        date: new Date().toISOString().split('T')[0],
        campus: 'Valley Road',
        startTime: '17:30',
        endTime: '20:30',
        semester: currentSemester || 'MAY-AUG 2026',
        location: { name: '', latitude: null, longitude: null, radius: 200 }
    });

    // Form inputs for mobile sheets
    const [mobMemberForm, setMobMemberForm] = useState({ name: '', studentRegNo: '', campus: 'Athi River', memberType: 'Visitor' });
    const [mobTrainingForm, setMobTrainingForm] = useState({
        name: 'Doulos Training',
        date: new Date().toISOString().split('T')[0],
        campus: 'Both',
        startTime: '14:00',
        endTime: '17:00',
        semester: currentSemester || 'MAY-AUG 2026',
        requiredFields: [
            { label: 'Full Name', key: 'studentName', required: true },
            { label: 'Admission Number', key: 'studentRegNo', required: true }
        ],
        questionOfDay: '',
        questionType: 'text',
        questionOptions: [],
        location: { name: '', latitude: null, longitude: null, radius: 200 }
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Haptic feedback
    const triggerHaptic = (pattern = 15) => {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    };

    const handleMobileTabChange = (tab) => {
        triggerHaptic(15);
        setActiveTab(tab);
        setShowMoreMenu(false);
        setSearchActive(false);
        setSearchQuery('');
    };

    // Form Actions for Mobile Sheets
    const submitMobileMember = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        try {
            await api.post('/members', mobMemberForm);
            setMsg({ type: 'success', text: `Success! ${mobMemberForm.name.split(' ')[0]} added!` });
            setMobMemberForm({ name: '', studentRegNo: '', campus: 'Athi River', memberType: 'Visitor' });
            setBottomSheetOpen(false);
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save member' });
        }
    };

    const submitMobileTraining = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!mobTrainingForm.location.latitude || !mobTrainingForm.location.longitude) {
            return setMsg({ type: 'error', text: '⚠️ You MUST capture or input GPS coordinates before creating!' });
        }
        
        // Auto-assign location name based on campus
        let locName = 'Doulos store';
        if (mobTrainingForm.campus === 'Valley Road' || mobTrainingForm.campus.includes('Valley Road')) {
            locName = 'DAC 504';
        } else if (mobTrainingForm.campus === 'Athi River') {
            locName = 'Doulos store';
        }
        
        const submissionForm = {
            ...mobTrainingForm,
            location: {
                ...mobTrainingForm.location,
                name: locName
            }
        };

        try {
            await api.post('/trainings', submissionForm);
            setMsg({ type: 'success', text: 'Training session created!' });
            setBottomSheetOpen(false);
            fetchTrainings();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create training' });
        }
    };

    // Filtered lists for mobile cards
    const getFilteredMobileMembers = () => {
        return members.filter(m => {
            const matchesSearch = !searchQuery || 
                (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                (m.studentRegNo || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCampus = campusFilter === 'All' || m.campus === campusFilter;
            const matchesType = memberTypeFilter === 'All' || m.memberType === memberTypeFilter;
            return matchesSearch && matchesCampus && matchesType;
        });
    };

    const getFilteredMobileTrainings = () => {
        return trainings.filter(t => {
            const matchesSearch = !searchQuery || (t.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const now = new Date();
            const tDate = new Date(t.date);
            const [endH, endMin] = t.endTime.split(':').map(Number);
            const tEnd = new Date(tDate);
            tEnd.setHours(endH, endMin, 0, 0);
            const isCompleted = now > tEnd || !t.isActive;

            if (trainingStatusFilter === 'Active') return matchesSearch && !isCompleted;
            if (trainingStatusFilter === 'Completed') return matchesSearch && isCompleted;
            return matchesSearch;
        });
    };

    const handleToggleTrainingStatus = async (id, currentActive) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        try {
            await api.patch(`/trainings/${id}`, { isActive: !currentActive });
            setMsg({ type: 'success', text: `Training session ${!currentActive ? 'reopened' : 'finalized'} successfully!` });
            fetchTrainings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update training session' });
        }
    };

    const handleToggleMeetingStatus = async (id, currentActive) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        try {
            await api.patch(`/meetings/${id}`, { isActive: !currentActive });
            setMsg({ type: 'success', text: `Meeting ${!currentActive ? 'reopened' : 'closed'} successfully!` });
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update meeting status' });
        }
    };

    const submitMobileMeeting = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!mobMeetingForm.location.latitude || !mobMeetingForm.location.longitude) {
            return setMsg({ type: 'error', text: '⚠️ You MUST capture or input GPS coordinates before creating!' });
        }

        // Auto-assign location name based on campus
        let locName = 'Doulos store';
        if (mobMeetingForm.campus === 'Valley Road' || mobMeetingForm.campus.includes('Valley Road')) {
            locName = 'DAC 504';
        } else if (mobMeetingForm.campus === 'Athi River') {
            locName = 'Doulos store';
        }

        const submissionForm = {
            ...mobMeetingForm,
            location: {
                ...mobMeetingForm.location,
                name: locName
            }
        };

        try {
            await api.post('/meetings', submissionForm);
            setMsg({ type: 'success', text: 'Meeting scheduled successfully!' });
            setBottomSheetOpen(false);
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create meeting' });
        }
    };

    const openMemberInsights = async (member) => {
        triggerHaptic(15);
        setBottomSheetType('member_insights');
        setBottomSheetOpen(true);
        setLoadingMemberInsights(true);
        setSelectedMemberInsights(null);
        try {
            const res = await api.get(`/attendance/student/${member.studentRegNo}`);
            setSelectedMemberInsights({
                ...member,
                stats: res.data.stats,
                history: res.data.history
            });
        } catch (err) {
            setSelectedMemberInsights({
                ...member,
                stats: { percentage: Math.round(((member.totalAttended || 0) / 15) * 100), physicalAttended: member.totalAttended || 0, totalMeetings: 15 },
                history: []
            });
        } finally {
            setLoadingMemberInsights(false);
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Mobile Responsive Header with Hamburger */}
            <header className="doulos-mobile-header">
                <div className="doulos-mobile-header-brand">
                    <button 
                        className="doulos-hamburger-btn"
                        onClick={() => setMobileNavOpen(!mobileNavOpen)}
                        aria-label="Toggle Navigation"
                    >
                        <Menu size={20} />
                    </button>
                    <Logo size={28} showText={false} />
                    <span className="doulos-mobile-header-title">Doulos Admin</span>
                </div>
                <div 
                    className="doulos-identity-avatar"
                    style={{ width: '34px', height: '34px', fontSize: '0.9rem', cursor: 'pointer', overflow: 'hidden', padding: (localStorage.getItem('username') || '').toLowerCase().includes('doulos') ? '2px' : undefined, background: (localStorage.getItem('username') || '').toLowerCase().includes('doulos') ? '#FFFFFF' : undefined }}
                    onClick={() => { setActiveTab('identity'); setMobileNavOpen(false); }}
                >
                    {(localStorage.getItem('username') || '').toLowerCase().includes('doulos') ? (
                        <img src="/logo.png" alt="Doulos" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        (localStorage.getItem('username') || userRole).charAt(0).toUpperCase()
                    )}
                </div>
            </header>

            {/* Mobile Sidebar Backdrop */}
            <div 
                className={`doulos-sidebar-backdrop ${mobileNavOpen ? 'active' : ''}`}
                onClick={() => setMobileNavOpen(false)}
            /> 

            {/* Premium Header/Banner */}
            {msg && (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    background: msg.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(34, 197, 94, 0.95)',
                    color: 'white',
                    padding: '0.85rem 1.75rem',
                    borderRadius: '1rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontWeight: 700,
                    animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    border: '1px solid rgba(255,255,255,0.15)'
                }}>
                    {msg.type === 'error' ? '⚠️' : '✅'} {msg.text}
                </div>
            )}

            <div className="doulos-admin-viewport">
                {/* Ambient light purple corner wash bleeding top-left */}
                <div className="doulos-admin-corner-wash" />

                {/* Sidebar Navigation in deep indigo-purple */}
                <aside className="doulos-sidebar">
                    <div className="doulos-sidebar-brand">
                        <div style={{ animation: 'rotateLogo 60s linear infinite', flexShrink: 0 }}>
                            <Logo size={36} showText={false} />
                        </div>
                        <div>
                            <div className="doulos-sidebar-brand-title">Doulos Timeregistrering</div>
                            <div className="doulos-sidebar-brand-sub">Freedom Base Camp</div>
                        </div>
                    </div>

                    <div className="doulos-nav-list">
                        {[
                            { id: 'identity', label: 'My Profile', icon: User },
                            { id: 'members', label: 'Members', icon: Users },
                            { id: 'g_council', label: 'G-Council', icon: Shield },
                            { id: 'events', label: 'Events & Camps', icon: Calendar },
                            { id: 'requisitions', label: 'Requisitions', icon: Package },
                            { id: 'observability', label: 'Audit Log', icon: FileText },
                            { id: 'reports', label: 'Reports', icon: BarChart3 },
                            { id: 'finance', label: 'Finance', icon: DollarSign },
                            { id: 'freedom_base', label: 'Freedom Base', icon: MapPin },
                            { id: 'discipline', label: 'Discipline', icon: ShieldAlert },
                        ].map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id || 
                                (item.id === 'g_council' && ['g1_radar', 'g3_secretariat', 'g4_logistics', 'g9_media', 'admins'].includes(activeTab)) ||
                                (item.id === 'events' && ['meetings', 'trainings'].includes(activeTab)) ||
                                (item.id === 'finance' && activeTab === 'g7_treasury') ||
                                (item.id === 'freedom_base' && activeTab === 'g8_assets') ||
                                (item.id === 'discipline' && activeTab === 'g6_welfare');

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setMobileNavOpen(false);
                                        if (item.id === 'requisitions') {
                                            setIsRequisitionModalOpen(true);
                                        } else {
                                            setActiveTab(item.id);
                                        }
                                    }}
                                    className={`doulos-nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <span className="doulos-nav-icon"><Icon size={18} /></span>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Bottom Sign Out Bar */}
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                width: '100%',
                                padding: '0.65rem 0.95rem',
                                borderRadius: 'var(--radius-pill)',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#FFFFFF',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area: Floating White Card */}
                <main className="doulos-main-area" ref={mainContentRef}>
                    <div className="doulos-surface-card">
                        {/* Topbar: Search Pill, Bell, Identity Block */}
                        <div className="doulos-topbar">
                            <div className="doulos-search-box">
                                <Search size={16} color="#9E9EA7" />
                                <input
                                    type="text"
                                    className="doulos-search-input"
                                    placeholder="Search..."
                                    value={globalSearch}
                                    onChange={e => setGlobalSearch(e.target.value)}
                                />
                            </div>

                            <div className="doulos-topbar-actions">
                                <button
                                    className="doulos-bell-btn"
                                    onClick={() => setMsg({ type: 'info', text: 'All systems nominal. Database synchronized.' })}
                                    title="System Notifications"
                                >
                                    <Bell size={17} />
                                    <span className="doulos-bell-badge" />
                                </button>

                                <div
                                    className="doulos-identity-block"
                                    onClick={() => setActiveTab('identity')}
                                    title="Account Settings"
                                >
                                    <div 
                                        className="doulos-identity-avatar"
                                        style={{ overflow: 'hidden', padding: (localStorage.getItem('username') || '').toLowerCase().includes('doulos') ? '2px' : undefined, background: (localStorage.getItem('username') || '').toLowerCase().includes('doulos') ? '#FFFFFF' : undefined }}
                                    >
                                        {(localStorage.getItem('username') || '').toLowerCase().includes('doulos') ? (
                                            <img src="/logo.png" alt="Doulos" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            (localStorage.getItem('username') || userRole).charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="doulos-identity-info">
                                        <span className="doulos-identity-name">
                                            {localStorage.getItem('username') || 'Luke Asote'}
                                        </span>
                                        <span className="doulos-identity-role">
                                            {['superadmin', 'SuperAdmin'].includes(userRole) ? 'G1 Coordinator' :
                                             userRole === 'developer' ? 'Lead Systems' :
                                             userRole === 'trainer' ? 'G5 Training Directorate' : 'Admin for Associations'}
                                        </span>
                                    </div>
                                    <ChevronDown size={14} color="#838096" />
                                </div>
                            </div>
                        </div>

                        {/* Content Body / Tab Dispatcher */}
                        <div style={{ flex: 1 }}>
                            {activeTab === 'identity' ? (
                                <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-sidebar-bg) 0%, #2E2A4D 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800 }}>
                                            {(localStorage.getItem('username') || userRole).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#2D2D3A' }}>
                                                {localStorage.getItem('username') || 'Luke Asote'}
                                            </h2>
                                            <span style={{ fontSize: '0.8rem', color: '#8E8B9F', fontWeight: 600 }}>
                                                Role: {userRole?.toUpperCase()} · Campus: Athi River & Valley Road
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ background: '#FAFAFC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#2D2D3A' }}>Account Security</h4>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B6882' }}>Your session is protected with JWT credentials and G-Council authentication.</p>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            <PrimaryButton onClick={() => setEditingAdmin({ _id: 'ME', username: localStorage.getItem('username') || 'admin', role: userRole })}>
                                                Update Credentials
                                            </PrimaryButton>
                                            <OutlineButton onClick={handleLogout} style={{ color: '#D9534F', borderColor: '#FCA5A5' }}>
                                                Sign Out Account
                                            </OutlineButton>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'members' ? (
                                <MembersTab
                                    members={members}
                                    loadingMembers={loadingMembers}
                                    userRole={userRole}
                                    isGuest={isGuest}
                                    fetchMembers={fetchMembers}
                                    setMsg={setMsg}
                                    currentSemester={currentSemester}
                                    api={api}
                                    admins={admins}
                                    fetchAdmins={fetchAdmins}
                                />
                            ) : activeTab === 'g_council' ? (
                                <G1ExecutiveRadar api={api} setMsg={setMsg} isGuest={isGuest} userRole={userRole} />
                            ) : activeTab === 'events' ? (
                                <MeetingsTab
                                    meetings={meetings}
                                    userRole={userRole}
                                    isGuest={isGuest}
                                    fetchMeetings={fetchMeetings}
                                    setMsg={setMsg}
                                    currentSemester={currentSemester}
                                    api={api}
                                    members={members}
                                    quickRegNo={quickRegNo}
                                    setQuickRegNo={setQuickRegNo}
                                    quickCheckInLoading={quickCheckInLoading}
                                    setQuickCheckInLoading={setQuickCheckInLoading}
                                    fetchMembers={fetchMembers}
                                />
                            ) : activeTab === 'requisitions' ? (
                                <G8AssetsConsole api={api} setMsg={setMsg} isGuest={isGuest} onOpenRequisitionModal={() => setIsRequisitionModalOpen(true)} />
                            ) : activeTab === 'observability' ? (
                                <SystemObservabilityTab
                                    members={members}
                                    api={api}
                                    setMsg={setMsg}
                                    currentSemester={currentSemester}
                                    isGuest={isGuest}
                                />
                            ) : activeTab === 'reports' ? (
                                <ReportsTab
                                    meetings={meetings}
                                    members={members}
                                    onDownloadCSV={downloadCSV}
                                    onDownloadCumulativeCSV={downloadCumulativeCSV}
                                    isGuest={isGuest}
                                    api={api}
                                    setMsg={setMsg}
                                />
                            ) : activeTab === 'finance' ? (
                                <G7TreasuryConsole api={api} setMsg={setMsg} isGuest={isGuest} />
                            ) : activeTab === 'freedom_base' ? (
                                <G8AssetsConsole api={api} setMsg={setMsg} isGuest={isGuest} onOpenRequisitionModal={() => setIsRequisitionModalOpen(true)} />
                            ) : activeTab === 'discipline' ? (
                                <G6WelfareConsole api={api} setMsg={setMsg} isGuest={isGuest} members={members} />
                            ) : activeTab === 'dashboard' ? (
                                <ExecutiveOverviewTab
                                    members={members}
                                    meetings={meetings}
                                    trainings={trainings}
                                    currentSemester={currentSemester}
                                    userRole={userRole}
                                    setActiveTab={setActiveTab}
                                    onDownloadCumulativeCSV={downloadCumulativeCSV}
                                />
                            ) : activeTab === 'g1_radar' ? (
                                <G1ExecutiveRadar api={api} setMsg={setMsg} isGuest={isGuest} userRole={userRole} />
                            ) : activeTab === 'g3_secretariat' ? (
                                <G3SecretariatConsole api={api} setMsg={setMsg} isGuest={isGuest} members={members} />
                            ) : activeTab === 'g4_logistics' ? (
                                <G4LogisticsConsole api={api} setMsg={setMsg} isGuest={isGuest} />
                            ) : activeTab === 'g6_welfare' ? (
                                <G6WelfareConsole api={api} setMsg={setMsg} isGuest={isGuest} members={members} />
                            ) : activeTab === 'g7_treasury' ? (
                                <G7TreasuryConsole api={api} setMsg={setMsg} isGuest={isGuest} />
                            ) : activeTab === 'g8_assets' ? (
                                <G8AssetsConsole api={api} setMsg={setMsg} isGuest={isGuest} onOpenRequisitionModal={() => setIsRequisitionModalOpen(true)} />
                            ) : activeTab === 'g9_media' ? (
                                <G9MediaConsole api={api} setMsg={setMsg} isGuest={isGuest} currentSemester={currentSemester} />
                            ) : activeTab === 'meetings' ? (
                                <MeetingsTab
                                    meetings={meetings}
                                    userRole={userRole}
                                    isGuest={isGuest}
                                    fetchMeetings={fetchMeetings}
                                    setMsg={setMsg}
                                    currentSemester={currentSemester}
                                    api={api}
                                    members={members}
                                    quickRegNo={quickRegNo}
                                    setQuickRegNo={setQuickRegNo}
                                    quickCheckInLoading={quickCheckInLoading}
                                    setQuickCheckInLoading={setQuickCheckInLoading}
                                    fetchMembers={fetchMembers}
                                />
                            ) : activeTab === 'trainings' ? (
                                <TrainingsTab
                                    trainings={trainings}
                                    userRole={userRole}
                                    isGuest={isGuest}
                                    fetchTrainings={fetchTrainings}
                                    setMsg={setMsg}
                                    currentSemester={currentSemester}
                                    api={api}
                                    members={members}
                                    quickRegNo={quickRegNo}
                                    setQuickRegNo={setQuickRegNo}
                                    quickCheckInLoading={quickCheckInLoading}
                                    setQuickCheckInLoading={setQuickCheckInLoading}
                                    fetchMembers={fetchMembers}
                                />
                            ) : activeTab === 'events_mgr' ? (
                                <EventsManager api={api} setMsg={setMsg} isGuest={isGuest} />
                            ) : activeTab === 'admins' ? (
                                <AdminsView
                                    admins={admins}
                                    loading={loadingAdmins}
                                    onEdit={setEditingAdmin}
                                    onDelete={handleDeleteAdmin}
                                    guestFeaturesEnabled={guestFeaturesEnabled}
                                    currentSemester={currentSemester}
                                    onUpdateSetting={handleSaveSetting}
                                    api={api}
                                    setMsg={setMsg}
                                    fetchAdmins={fetchAdmins}
                                    isGuest={isGuest}
                                />
                            ) : activeTab === 'system' ? (
                                <SystemSettingsTab
                                    onUpdateSetting={handleSaveSetting}
                                    isGuest={isGuest}
                                    setMsg={setMsg}
                                    api={api}
                                    userRole={userRole}
                                />
                            ) : null}
                        </div>
                    </div>
                </main>
            </div>

            {/* Add/Edit Admin Modal */}
            {editingAdmin && (
                <div style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    background: 'rgba(46, 42, 77, 0.45)', 
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 9999, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '1rem' 
                }} onClick={() => setEditingAdmin(null)}>
                    <div style={{ 
                        padding: '2.25rem 2rem', 
                        maxWidth: '420px', 
                        width: '100%', 
                        background: '#FFFFFF',
                        border: '1px solid #EBEBF2',
                        borderRadius: '16px',
                        boxShadow: '0 24px 60px rgba(46, 42, 77, 0.18)',
                        color: '#1E1B39'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E1B39' }}>
                                {editingAdmin._id === 'NEW' ? 'Register New Staff' : 'Edit Staff Account'}
                            </h3>
                            <button onClick={() => setEditingAdmin(null)} style={{ background: '#F4F2FB', border: 'none', color: '#6B6882', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group-premium">
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</label>
                                <input className="modern-input" value={editingAdmin.username || ''} onChange={e => setEditingAdmin({ ...editingAdmin, username: e.target.value })} required disabled={editingAdmin._id !== 'NEW'} />
                            </div>
                            {editingAdmin._id === 'NEW' && (
                                <div className="form-group-premium">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                                    <input className="modern-input" type="password" value={editingAdmin.password || ''} onChange={e => setEditingAdmin({ ...editingAdmin, password: e.target.value })} required />
                                </div>
                            )}
                            <div className="form-group-premium">
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campus Jurisdiction</label>
                                <select className="modern-input" value={editingAdmin.campus || 'Athi River'} onChange={e => setEditingAdmin({ ...editingAdmin, campus: e.target.value })}>
                                    <option value="Athi River">Athi River</option>
                                    <option value="Valley Road">Valley Road</option>
                                    <option value="All">All Campuses (Global)</option>
                                </select>
                            </div>
                            <div className="form-group-premium">
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Role</label>
                                <select className="modern-input" value={editingAdmin.role || 'admin'} onChange={e => setEditingAdmin({ ...editingAdmin, role: e.target.value })}>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">SuperAdmin</option>
                                    <option value="developer">Developer</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', marginTop: '0.5rem', borderRadius: '10px', fontWeight: 700, background: '#4B3F8C', color: '#FFFFFF' }}>
                                {editingAdmin._id === 'NEW' ? 'Register Account' : 'Save Profiles'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* G-Council Requisition & Handover Modals */}
            <RequisitionPipelineModal
                isOpen={isRequisitionModalOpen}
                onClose={() => setIsRequisitionModalOpen(false)}
                api={api}
                setMsg={setMsg}
                isGuest={isGuest}
                userRole={userRole}
            />
            <TenureHandoverModal
                isOpen={isHandoverModalOpen}
                onClose={() => setIsHandoverModalOpen(false)}
                api={api}
                setMsg={setMsg}
                isGuest={isGuest}
                userRole={userRole}
            />
        </div>
    );

};

/* --- BOTTOM HELPER VIEWS --- */

const AdminsView = ({ admins, loading, onEdit, onDelete, currentSemester, api, setMsg, fetchAdmins, isGuest }) => {
    const userRole = localStorage.getItem('role')?.toLowerCase();
    const canManageAdmins = ['developer', 'superadmin'].includes(userRole);

    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newCampus, setNewCampus] = useState('Athi River');
    const [newRole, setNewRole] = useState('admin');
    const [registering, setRegistering] = useState(false);

    const roleColors = {
        developer: { bg: '#F5F3FB', color: '#4B3F8C', border: '#DCD6F7' },
        superadmin: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
        admin: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (isGuest) {
            setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
            return;
        }
        if (!newUsername.trim() || !newPassword.trim()) {
            alert('Username and Password are required.');
            return;
        }
        setRegistering(true);
        try {
            await api.post('/auth/register', {
                username: newUsername.trim(),
                password: newPassword.trim(),
                campus: newCampus,
                role: newRole
            });
            setMsg({ type: 'success', text: 'New Administrator registered!' });
            setNewUsername('');
            setNewPassword('');
            setNewCampus('Athi River');
            setNewRole('admin');
            fetchAdmins();
        } catch (err) {
            console.error("Failed to create admin:", err);
            alert(err.response?.data?.message || 'Failed to create administrator account.');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s' }}>
            
            {/* Header Card */}
            <div style={{ padding: '1.75rem 2rem', background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', boxShadow: '0 4px 16px rgba(75, 63, 140, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '0.85rem', background: '#F5F3FB', borderRadius: '12px', border: '1px solid #DCD6F7' }}>
                            <Users size={24} color="#4B3F8C" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4B3F8C', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>STAFF REGISTRY</div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1E1B39' }}>System Administrators</h2>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#7E7A9B' }}>Manage access privileges, credentials, and roles for Doulos</p>
                        </div>
                    </div>
                </div>
            </div>

            {canManageAdmins ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem', alignItems: 'start' }}>
                    
                    {/* Active Staff List (Left/Main Column) */}
                    <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid #EBEBF2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7E7A9B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Active Staff — {admins.length} accounts</span>
                        </div>

                        {loading ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: '#7E7A9B' }}>Syncing staff registry...</div>
                        ) : admins.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: '#FFFFFF', border: '1px dashed #EBEBF2', borderRadius: '12px', color: '#7E7A9B' }}>
                                No administrators registered yet.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                {admins.map(a => {
                                    const rc = roleColors[a.role] || roleColors.admin;
                                    return (
                                        <div key={a._id} style={{
                                            background: '#FFFFFF',
                                            border: '1px solid #EBEBF2',
                                            borderLeft: `4px solid ${rc.color}`,
                                            borderRadius: '12px',
                                            padding: '1.35rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1.15rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                            transition: 'all 0.2s'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: rc.bg, border: `1px solid ${rc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.92rem', fontWeight: 800, color: rc.color }}>
                                                        {a.username?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E1B39' }}>{a.username}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#7E7A9B', fontWeight: 500, marginTop: '2px' }}>{a.campus || 'All Campuses'}</div>
                                                    </div>
                                                </div>
                                                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {a.role}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #EBEBF2', paddingTop: '0.85rem' }}>
                                                <button onClick={() => onEdit(a)} style={{
                                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                                    padding: '0.45rem', fontSize: '0.75rem', fontWeight: 700, background: '#F8F8FC', color: '#4A4560',
                                                    border: '1px solid #D1D1DB', borderRadius: '8px', cursor: 'pointer'
                                                }}>
                                                    <Pencil size={13} /> Edit Profile
                                                </button>
                                                <button onClick={() => onDelete(a._id)} style={{
                                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                                    padding: '0.45rem', fontSize: '0.75rem', fontWeight: 700, background: '#FEF2F2', color: '#DC2626',
                                                    border: '1px solid #FCA5A5', borderRadius: '8px', cursor: 'pointer'
                                                }}>
                                                    <Trash2 size={13} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Embedded Registration Form Card (Right Column) */}
                    <div style={{ 
                        flex: '1 1 340px', 
                        maxWidth: '450px',
                        background: '#FFFFFF', 
                        padding: '1.75rem 2rem', 
                        border: '1px solid #EBEBF2',
                        borderRadius: '14px',
                        boxShadow: '0 8px 24px rgba(75, 63, 140, 0.06)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1.25rem' 
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E1B39' }}>Register Staff Account</h3>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#7E7A9B' }}>Create system credentials for Doulos leaders</p>
                        </div>

                        <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                            <div className="form-group-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#666280', letterSpacing: '0.5px' }}>Username</label>
                                <input 
                                    className="modern-input" 
                                    value={newUsername} 
                                    onChange={e => setNewUsername(e.target.value)} 
                                    required 
                                    placeholder="e.g. john_doe"
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                            
                            <div className="form-group-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#666280', letterSpacing: '0.5px' }}>Password</label>
                                <input 
                                    className="modern-input" 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    required 
                                    placeholder="••••••••"
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div className="form-group-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#666280', letterSpacing: '0.5px' }}>Campus Jurisdiction</label>
                                <select 
                                    className="modern-input" 
                                    value={newCampus} 
                                    onChange={e => setNewCampus(e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box', height: '42px', cursor: 'pointer' }}
                                >
                                    <option value="Athi River">Athi River</option>
                                    <option value="Valley Road">Valley Road</option>
                                    <option value="All">All Campuses (Global)</option>
                                </select>
                            </div>

                            <div className="form-group-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#666280', letterSpacing: '0.5px' }}>System Role</label>
                                <select 
                                    className="modern-input" 
                                    value={newRole} 
                                    onChange={e => setNewRole(e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box', height: '42px', cursor: 'pointer' }}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">SuperAdmin</option>
                                    <option value="developer">Developer</option>
                                </select>
                            </div>

                            <button 
                                type="submit" 
                                disabled={registering}
                                style={{ 
                                    width: '100%', 
                                    height: '46px', 
                                    borderRadius: '10px', 
                                    fontWeight: 700,
                                    background: '#4B3F8C',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 8px 20px rgba(75, 63, 140, 0.25)',
                                    marginTop: '0.5rem'
                                }}
                            >
                                {registering ? 'Registering...' : <><Plus size={16} /> Register Account</>}
                            </button>
                        </form>
                    </div>

                </div>
            ) : (
                <div style={{ padding: '4rem', textAlign: 'center', background: '#FFFFFF', border: '1px dashed #EBEBF2', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <ShieldAlert size={40} style={{ color: '#DC2626', opacity: 0.5 }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E1B39' }}>Access Restricted</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#7E7A9B', maxWidth: '400px', lineHeight: 1.5 }}>Only Developers and SuperAdmins are authorized to manage administrative system accounts.</p>
                </div>
            )}
        </div>
    );
};

const FeedbackView = ({ isGuest }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

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
    }, []);

    const handleStatusUpdate = async (id, status) => {
        if (isGuest) return;
        try {
            await api.put(`/feedback/${id}/status`, { status });
            setFeedbacks(feedbacks.map(f => f._id === id ? { ...f, status } : f));
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const handleDelete = async (id) => {
        if (isGuest) return;
        if (!window.confirm('Delete this feedback?')) return;
        try {
            await api.delete(`/feedback/${id}`);
            setFeedbacks(feedbacks.filter(f => f._id !== id));
        } catch (err) {
            console.error('Failed to delete feedback', err);
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => filter === 'all' || f.status === filter);

    const statusMeta = {
        new: { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', label: 'NEW' },
        read: { color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', label: 'READ' },
        resolved: { color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0', label: 'RESOLVED' }
    };

    if (loading) return (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#7E7A9B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid #EBEBF2', borderTopColor: '#4B3F8C', borderRadius: '50%' }} />
            <div>Syncing Feedback Cloud...</div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s' }}>
            
            {/* Header Card */}
            <div style={{ padding: '1.75rem 2rem', background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', boxShadow: '0 4px 16px rgba(75, 63, 140, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '0.85rem', background: '#FEF3C7', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                            <Lightbulb size={24} color="#D97706" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D97706', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>COMMUNITY VOICE</div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1E1B39' }}>User Feedback</h2>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#7E7A9B' }}>{feedbacks.length} total submissions · {feedbacks.filter(f => f.status === 'new').length} unread</p>
                        </div>
                    </div>
                    
                    {/* Status capsule filters */}
                    <div style={{ display: 'flex', gap: '0.4rem', background: '#F8F8FC', padding: '0.3rem', borderRadius: '10px', border: '1px solid #EBEBF2', flexWrap: 'wrap' }}>
                        {['all', 'new', 'read', 'resolved'].map(s => {
                            const isActive = filter === s;
                            const sm = statusMeta[s] || { color: '#4B3F8C', bg: '#F5F3FB' };
                            return (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    style={{
                                        padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer',
                                        background: isActive ? (s === 'all' ? '#4B3F8C' : sm.bg) : 'transparent',
                                        color: isActive ? (s === 'all' ? '#FFFFFF' : sm.color) : '#7E7A9B',
                                        border: isActive ? `1px solid ${s === 'all' ? '#4B3F8C' : sm.border}` : '1px solid transparent',
                                        fontWeight: 700, fontSize: '0.78rem', textTransform: 'capitalize', transition: 'all 0.15s ease'
                                    }}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {filteredFeedbacks.length === 0 ? (
                <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#FFFFFF', border: '1px dashed #EBEBF2', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '1rem', background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '50%', color: '#B0ADC5' }}>
                        <Lightbulb size={36} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E1B39' }}>No Feedback Found</div>
                        <div style={{ fontSize: '0.84rem', color: '#7E7A9B', marginTop: '0.25rem' }}>There are no messages matching the selected status filters.</div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {filteredFeedbacks.map(f => {
                        const sm = statusMeta[f.status] || statusMeta.read;
                        return (
                            <div key={f._id} style={{
                                border: '1px solid #EBEBF2',
                                borderLeft: `4px solid ${sm.color}`,
                                background: '#FFFFFF',
                                borderRadius: '12px',
                                padding: '1.35rem 1.5rem',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: sm.bg, border: `1px solid ${sm.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: sm.color }}>
                                                {(f.name || 'A').charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1E1B39' }}>{f.name || 'Anonymous Member'}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#7E7A9B', fontWeight: 500 }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.65rem', borderRadius: '999px', background: '#F8F8FC', color: '#666280', border: '1px solid #EBEBF2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {f.category?.replace('_', ' ')}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.65rem', borderRadius: '999px', background: sm.bg, color: sm.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', border: `1px solid ${sm.border}` }}>
                                                {sm.label}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9rem', color: '#2D2D3A', fontWeight: 500 }}>{f.message}</p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: '220px', justifyContent: 'flex-end' }}>
                                        <select
                                            value={f.status}
                                            onChange={(e) => handleStatusUpdate(f._id, e.target.value)}
                                            className="modern-input"
                                            style={{
                                                padding: '0.45rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, width: '120px', border: '1px solid #D1D1DB', background: '#FFFFFF', color: '#1E1B39'
                                            }}
                                        >
                                            <option value="new">Mark New</option>
                                            <option value="read">Mark Read</option>
                                            <option value="resolved">Mark Resolved</option>
                                        </select>
                                        <button
                                            onClick={() => handleDelete(f._id)}
                                            style={{
                                                background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626',
                                                cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', borderRadius: '8px', transition: 'all 0.15s ease', fontWeight: 700
                                            }}
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
