import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import api from '../api';
import G5MeetingModal from '../components/G5MeetingModal';
import CampScheduleStudio from '../components/dashboard/CampScheduleStudio';
import '../styles/g5Portal.css';
import {
    LayoutDashboard,
    CalendarCheck,
    Calendar,
    Compass,
    GraduationCap,
    Award,
    Users,
    CreditCard,
    ShieldAlert,
    Search,
    Bell,
    LogOut,
    Plus,
    CheckCircle2,
    Clock,
    MapPin,
    AlertTriangle,
    Star,
    Check,
    X,
    ExternalLink,
    Download,
    FileText,
    MessageCircle,
    ChevronRight,
    Sparkles,
    Shield,
    Tent,
    Sliders,
    ArrowUpRight,
    RefreshCw,
    Settings,
    Lightbulb,
    Radio,
    Navigation,
    Crosshair,
    Layers,
    Archive,
    RotateCcw,
    CheckSquare,
    Square,
    UserCheck,
    History,
    UserMinus,
    QrCode,
    Printer,
    Copy,
    Menu
} from 'lucide-react';

const G5TrainingPortal = () => {
    const navigate = useNavigate();

    // Responsive Mobile Sidebar State
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Active Navigation Tab (9 items strictly)
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [campusFilter, setCampusFilter] = useState('All');
    const [toast, setToast] = useState(null);

    // Profile info
    const username = localStorage.getItem('username') || 'g5_training';
    const userRole = localStorage.getItem('role') || 'trainer';
    const userCampus = localStorage.getItem('campus') || 'Athi River';

    // Data states
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [cadres, setCadres] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [trainings, setTrainings] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [absenteeMembers, setAbsenteeMembers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [gearAssets, setGearAssets] = useState([]);
    const [campProgram, setCampProgram] = useState(null);

    // Modals
    const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
    const [insightMeeting, setInsightMeeting] = useState(null);
    const [qrMeeting, setQrMeeting] = useState(null);
    const [copiedQrLink, setCopiedQrLink] = useState(false);
    const [newMeetingForm, setNewMeetingForm] = useState({
        name: 'Weekly Doulos',
        campus: 'Athi River',
        date: new Date().toISOString().split('T')[0],
        startTime: '20:30',
        endTime: '23:00',
        questionType: 'text',
        questionOfDay: '',
        questionOptions: ['', ''],
        location: {
            name: 'Doulos Store',
            radius: 200,
            latitude: -1.44800,
            longitude: 37.01500
        }
    });
    const [meetingCreating, setMeetingCreating] = useState(false);
    const [gpsCapturing, setGpsCapturing] = useState(false);

    const VENUE_PRESETS = [
        {
            title: 'Doulos Store',
            sub: 'Athi River Campus',
            name: 'Doulos Store',
            campus: 'Athi River',
            lat: -1.44800,
            lng: 37.01500,
            radius: 200
        },
        {
            title: 'DAC 506',
            sub: 'Nairobi Campus (Valley Road)',
            name: 'DAC 506',
            campus: 'Valley Road',
            lat: -1.29210,
            lng: 36.80730,
            radius: 200
        }
    ];

    const applyVenuePreset = (preset) => {
        setNewMeetingForm(prev => ({
            ...prev,
            campus: preset.campus,
            location: {
                name: preset.name,
                radius: preset.radius,
                latitude: preset.lat,
                longitude: preset.lng
            }
        }));
        showToast(`Venue set to ${preset.name} (${preset.campus})`);
    };

    const [showReportIncidentModal, setShowReportIncidentModal] = useState(false);
    const [incidentForm, setIncidentForm] = useState({
        title: '',
        severity: 'Near-Miss',
        location: 'Freedom Base',
        campus: 'Athi River',
        description: '',
        correctiveActionPlan: ''
    });
    const [incidentSubmitting, setIncidentSubmitting] = useState(false);

    // Promotion Scoring & Batch Selection State
    const [promotionScores, setPromotionScores] = useState({});
    const [selectedCadres, setSelectedCadres] = useState([]);
    const [batchRank, setBatchRank] = useState('Basic Douloid');
    const [batchBelayStatus, setBatchBelayStatus] = useState('Secondary Belayer');
    const [batchSoloAllowed, setBatchSoloAllowed] = useState(false);
    const [batchSubmitting, setBatchSubmitting] = useState(false);
    const [promotionRankFilter, setPromotionRankFilter] = useState('All');
    const [promotionSearch, setPromotionSearch] = useState('');
    const [promotionCampusFilter, setPromotionCampusFilter] = useState('All');
    const [evaluatingCadre, setEvaluatingCadre] = useState(null);

    // Tab 5: Recruit Graduation & 20-Day Grace Archive State
    const [selectedRecruitIds, setSelectedRecruitIds] = useState([]);
    const [recruitSearch, setRecruitSearch] = useState('');
    const [recruitCampusFilter, setRecruitCampusFilter] = useState('All');
    const [recruitSubTab, setRecruitSubTab] = useState('active'); // 'active' | 'archived'
    const [quickPickCount, setQuickPickCount] = useState('');
    const [isGraduatingRecruits, setIsGraduatingRecruits] = useState(false);
    const [isArchivingRecruits, setIsArchivingRecruits] = useState(false);

    // Tab 3: Meetings & Archive State
    const [meetingSubTab, setMeetingSubTab] = useState('active'); // 'active' | 'archived'
    const [meetingSearch, setMeetingSearch] = useState('');
    const [meetingCampusFilter, setMeetingCampusFilter] = useState('All');
    const [isArchivingMeetings, setIsArchivingMeetings] = useState(false);

    // Tab 7: Membership Roster & Export Studio State
    const [rosterSubTab, setRosterSubTab] = useState('directory'); // 'directory' | 'export_studio'
    const [rosterRoleFilter, setRosterRoleFilter] = useState('All'); // 'All' | 'Douloid' | 'Recruit'
    const [rosterRankFilter, setRosterRankFilter] = useState('All'); // 'All' | rank | 'Recruit'
    const [rosterCampusFilter, setRosterCampusFilter] = useState('All'); // 'All' | 'Athi River' | 'Valley Road'
    const [rosterBelayFilter, setRosterBelayFilter] = useState('All'); // 'All' | 'Primary Belayer Certified' | 'Belayer Qualified' | 'Not Permitted'
    const [rosterSearch, setRosterSearch] = useState('');

    const showToast = (msg, type = 'success') => {
        setToast({ text: msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/admin');
    };

    // Load portal data
    const fetchPortalData = async () => {
        setLoading(true);
        try {
            const [
                membersRes,
                cadresRes,
                meetingsRes,
                trainingsRes,
                incidentsRes,
                absenceRes,
                paymentsRes,
                assetsRes,
                campProgramRes
            ] = await Promise.allSettled([
                api.get('/members?includeArchived=true'),
                api.get('/trainings/cadres'),
                api.get('/meetings?includeArchived=true'),
                api.get('/trainings'),
                api.get('/council/incidents'),
                api.get('/council/absence-radar'),
                api.get('/payments/all'),
                api.get('/council/assets'),
                api.get('/trainings/camp-program?campus=Both')
            ]);

            if (membersRes.status === 'fulfilled') {
                setMembers(membersRes.value.data || []);
            }
            if (cadresRes.status === 'fulfilled') {
                setCadres(cadresRes.value.data?.members || []);
            }
            if (meetingsRes.status === 'fulfilled') {
                setMeetings(meetingsRes.value.data || []);
            }
            if (trainingsRes.status === 'fulfilled') {
                setTrainings(trainingsRes.value.data || []);
            }
            if (incidentsRes.status === 'fulfilled') {
                setIncidents(incidentsRes.value.data || []);
            }
            if (absenceRes.status === 'fulfilled') {
                setAbsenteeMembers(absenceRes.value.data?.members || []);
            }
            if (paymentsRes.status === 'fulfilled') {
                setPayments(paymentsRes.value.data || []);
            }
            if (assetsRes.status === 'fulfilled') {
                setGearAssets(assetsRes.value.data || []);
            }
            if (campProgramRes.status === 'fulfilled') {
                setCampProgram(campProgramRes.value.data || null);
            }
        } catch (err) {
            console.error('Failed to load portal data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortalData();
    }, []);

    const activeMembers = useMemo(() => {
        return members.filter(m => m.status !== 'Archived' && m.status !== 'Archived-Concluded');
    }, [members]);

    const recruits = useMemo(() => {
        return members.filter(m => (m.memberType === 'Recruit' || m.status === 'Recruit') && m.status !== 'Archived' && m.status !== 'Archived-Concluded');
    }, [members]);

    const archivedRecruits = useMemo(() => {
        return members.filter(m => (m.memberType === 'Recruit' || m.status === 'Recruit' || m.archivedAt) && m.status === 'Archived');
    }, [members]);

    const filteredRecruits = useMemo(() => {
        return recruits.filter(r => {
            const matchesSearch = !recruitSearch.trim() || 
                (r.name || '').toLowerCase().includes(recruitSearch.toLowerCase()) || 
                (r.studentRegNo || '').toLowerCase().includes(recruitSearch.toLowerCase());
            const matchesCampus = recruitCampusFilter === 'All' || r.campus === recruitCampusFilter;
            return matchesSearch && matchesCampus;
        });
    }, [recruits, recruitSearch, recruitCampusFilter]);

    const filteredArchivedRecruits = useMemo(() => {
        return archivedRecruits.filter(r => {
            const matchesSearch = !recruitSearch.trim() || 
                (r.name || '').toLowerCase().includes(recruitSearch.toLowerCase()) || 
                (r.studentRegNo || '').toLowerCase().includes(recruitSearch.toLowerCase());
            const matchesCampus = recruitCampusFilter === 'All' || r.campus === recruitCampusFilter;
            return matchesSearch && matchesCampus;
        });
    }, [archivedRecruits, recruitSearch, recruitCampusFilter]);

    const activeMeetings = useMemo(() => {
        return meetings.filter(m => !m.isArchived);
    }, [meetings]);

    const archivedMeetings = useMemo(() => {
        return meetings.filter(m => m.isArchived);
    }, [meetings]);

    const filteredActiveMeetings = useMemo(() => {
        return activeMeetings.filter(m => {
            const matchesSearch = !meetingSearch.trim() || 
                (m.name || '').toLowerCase().includes(meetingSearch.toLowerCase()) || 
                (m.code || '').toLowerCase().includes(meetingSearch.toLowerCase());
            const matchesCampus = meetingCampusFilter === 'All' || m.campus === meetingCampusFilter;
            return matchesSearch && matchesCampus;
        });
    }, [activeMeetings, meetingSearch, meetingCampusFilter]);

    const filteredArchivedMeetings = useMemo(() => {
        return archivedMeetings.filter(m => {
            const matchesSearch = !meetingSearch.trim() || 
                (m.name || '').toLowerCase().includes(meetingSearch.toLowerCase()) || 
                (m.code || '').toLowerCase().includes(meetingSearch.toLowerCase());
            const matchesCampus = meetingCampusFilter === 'All' || m.campus === meetingCampusFilter;
            return matchesSearch && matchesCampus;
        });
    }, [archivedMeetings, meetingSearch, meetingCampusFilter]);

    const totalAttended = meetings.reduce((sum, m) => sum + (m.attendanceCount || 0), 0);
    const totalExpected = activeMeetings.length > 0 && activeMembers.length > 0 ? activeMeetings.length * activeMembers.length : 0;
    const attendancePercentage = totalExpected > 0 ? Math.min(100, Math.round((totalAttended / totalExpected) * 100)) : 0;

    // Filtered cadres for Rank Promotions Tab
    const filteredCadres = useMemo(() => {
        return cadres.filter(c => {
            const matchesSearch = !promotionSearch.trim() || 
                (c.name || '').toLowerCase().includes(promotionSearch.toLowerCase()) || 
                (c.studentRegNo || '').toLowerCase().includes(promotionSearch.toLowerCase());

            const matchesCampus = promotionCampusFilter === 'All' || c.campus === promotionCampusFilter;

            const rankVal = c.douloidRank || 'None';
            const matchesRank = promotionRankFilter === 'All' || 
                (promotionRankFilter === 'Unranked' ? (!c.douloidRank || c.douloidRank === 'None') : rankVal === promotionRankFilter);

            return matchesSearch && matchesCampus && matchesRank;
        });
    }, [cadres, promotionSearch, promotionCampusFilter, promotionRankFilter]);

    // Helper: Map personnel details with latest cadre data
    const getMemberDetails = (m) => {
        const isRecruit = m.memberType === 'Recruit' || m.status === 'Recruit';
        const cadreObj = !isRecruit ? cadres.find(c => String(c.studentRegNo || '').trim().toUpperCase() === String(m.studentRegNo || '').trim().toUpperCase()) : null;
        const rank = isRecruit ? 'Recruit Candidate' : (cadreObj?.douloidRank || m.douloidRank || 'Shadow Douloid');
        const belay = isRecruit ? 'Not Permitted' : (cadreObj?.belayStatus || m.belayStatus || 'Not Permitted');
        const solo = isRecruit ? false : (cadreObj?.soloStationAllowed ?? m.soloStationAllowed ?? false);
        return { isRecruit, rank, belay, solo };
    };

    // Filtered members for Membership Roster & Export Studio (Tab 7)
    const filteredRosterMembers = useMemo(() => {
        return activeMembers.filter(m => {
            const { isRecruit, rank, belay } = getMemberDetails(m);
            const isDouloid = !isRecruit;

            // Role filter
            if (rosterRoleFilter === 'Douloid' && !isDouloid) return false;
            if (rosterRoleFilter === 'Recruit' && !isRecruit) return false;

            // Rank filter
            if (rosterRankFilter !== 'All') {
                if (rosterRankFilter === 'Recruit') {
                    if (!isRecruit) return false;
                } else {
                    if (rank !== rosterRankFilter) return false;
                }
            }

            // Campus filter
            if (rosterCampusFilter !== 'All' && m.campus !== rosterCampusFilter) return false;

            // Belay filter
            if (rosterBelayFilter !== 'All') {
                if (rosterBelayFilter === 'Primary Belayer Certified') {
                    if (belay !== 'Primary Belayer Certified') return false;
                } else if (rosterBelayFilter === 'Belayer Qualified') {
                    if (belay !== 'Belayer Qualified' && belay !== 'Primary Belayer Certified') return false;
                } else if (rosterBelayFilter === 'Not Permitted') {
                    if (belay && belay !== 'Not Permitted') return false;
                }
            }

            // Search query
            if (rosterSearch.trim()) {
                const q = rosterSearch.toLowerCase();
                const nameMatch = (m.name || '').toLowerCase().includes(q);
                const regMatch = (m.studentRegNo || '').toLowerCase().includes(q);
                const phoneMatch = (m.phone || '').toLowerCase().includes(q);
                if (!nameMatch && !regMatch && !phoneMatch) return false;
            }

            return true;
        });
    }, [activeMembers, cadres, rosterRoleFilter, rosterRankFilter, rosterCampusFilter, rosterBelayFilter, rosterSearch]);

    // Export Roster to CSV
    const handleExportRosterCSV = (listToExport = filteredRosterMembers, filenameSuffix = '') => {
        if (!listToExport || listToExport.length === 0) {
            showToast('No personnel records to export with current filters', 'error');
            return;
        }
        const headers = ['Full Name', 'Admission No', 'Role Type', 'Douloid Rank', 'Campus', 'Belay Clearance', 'Solo Station Allowed', 'Status', 'Phone', 'Email'];
        const rows = listToExport.map(m => {
            const { isRecruit, rank, belay, solo } = getMemberDetails(m);
            return [
                `"${(m.name || '').replace(/"/g, '""')}"`,
                `"${(m.studentRegNo || '').replace(/"/g, '""')}"`,
                `"${isRecruit ? 'Recruit' : 'Douloid'}"`,
                `"${rank}"`,
                `"${m.campus || 'Athi River'}"`,
                `"${belay}"`,
                `"${solo ? 'Yes' : 'No'}"`,
                `"${m.status || 'Active'}"`,
                `"${m.phone || ''}"`,
                `"${m.email || ''}"`
            ];
        });
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanSuffix = filenameSuffix ? `_${filenameSuffix.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
        a.download = `doulos_roster${cleanSuffix}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Exported ${listToExport.length} members to CSV!`);
    };

    // Download / Print Roster PDF
    const handleDownloadRosterPDF = (listToExport = filteredRosterMembers, customTitle = '') => {
        if (!listToExport || listToExport.length === 0) {
            showToast('No personnel records to export with current filters', 'error');
            return;
        }

        const totalCount = listToExport.length;
        const douloidCount = listToExport.filter(m => m.memberType !== 'Recruit' && m.status !== 'Recruit').length;
        const recruitCount = listToExport.filter(m => m.memberType === 'Recruit' || m.status === 'Recruit').length;
        const belayerCount = listToExport.filter(m => {
            const { belay } = getMemberDetails(m);
            return belay === 'Primary Belayer Certified' || belay === 'Belayer Qualified';
        }).length;

        const docTitle = customTitle || (
            rosterRankFilter !== 'All' ? `${rosterRankFilter.toUpperCase()} ROSTER` :
            rosterRoleFilter === 'Douloid' ? 'OFFICIAL DOULOID MEMBERSHIP ROSTER' :
            rosterRoleFilter === 'Recruit' ? 'OFFICIAL RECRUITS PIPELINE ROSTER' :
            'OFFICIAL DOULOS MEMBERSHIP ROSTER'
        );

        const campusDesc = rosterCampusFilter !== 'All' ? `• Campus: ${rosterCampusFilter}` : '• All Campuses (Athi River & Nairobi)';
        const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const rowsHtml = listToExport.map((m, idx) => {
            const { isRecruit, rank, belay, solo } = getMemberDetails(m);
            const roleBadgeStyle = isRecruit 
                ? 'background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;'
                : 'background: #F3E8FF; color: #7E22CE; border: 1px solid #E9D5FF;';
            const belayBadgeStyle = belay === 'Primary Belayer Certified'
                ? 'background: #DCFCE7; color: #166534; font-weight: 700;'
                : belay === 'Belayer Qualified'
                ? 'background: #E0F2FE; color: #075985; font-weight: 700;'
                : 'color: #9CA3AF; font-size: 11px;';

            return `
                <tr style="border-bottom: 1px solid #E5E7EB; background: ${idx % 2 === 0 ? '#FFFFFF' : '#FAFAFC'};">
                    <td style="padding: 9px 12px; font-weight: 700; color: #6B7280; font-size: 11px; width: 35px;">${idx + 1}</td>
                    <td style="padding: 9px 12px;">
                        <div style="font-weight: 800; color: #111827; font-size: 13px;">${m.name}</div>
                        <div style="font-size: 11px; color: #6B7280; font-family: monospace;">${m.studentRegNo}</div>
                    </td>
                    <td style="padding: 9px 12px;">
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; ${roleBadgeStyle}">
                            ${rank}
                        </span>
                    </td>
                    <td style="padding: 9px 12px; font-size: 12px; font-weight: 600; color: #374151;">${m.campus || 'Athi River'}</td>
                    <td style="padding: 9px 12px;">
                        <span style="display: inline-block; padding: 2px 6px; border-radius: 6px; font-size: 11px; ${belayBadgeStyle}">
                            ${belay}
                        </span>
                    </td>
                    <td style="padding: 9px 12px; font-size: 11px; font-weight: 700; color: ${solo ? '#16A34A' : '#9CA3AF'};">
                        ${solo ? '✓ Authorized' : 'Tandem Only'}
                    </td>
                </tr>
            `;
        }).join('');

        const printHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${docTitle} - Daystar Doulos Ministry</title>
                    <meta charset="utf-8" />
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
                        @page { size: A4 portrait; margin: 12mm 14mm 14mm; }
                        * { box-sizing: border-box; }
                        body {
                            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            margin: 0; padding: 0; background: #FFFFFF; color: #111827;
                            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
                        }
                        .header-bar {
                            display: flex; justify-content: space-between; align-items: flex-start;
                            border-bottom: 3px solid #6B5FA8; padding-bottom: 12px; margin-bottom: 14px;
                        }
                        .org-title {
                            font-size: 18px; font-weight: 900; color: #6B5FA8; text-transform: uppercase; letter-spacing: 0.5px;
                            margin: 0; line-height: 1.2;
                        }
                        .org-sub {
                            font-size: 11px; font-weight: 700; color: #4B5563; margin-top: 2px;
                        }
                        .doc-heading {
                            font-size: 14px; font-weight: 900; color: #1F2937; margin: 8px 0 2px;
                            text-transform: uppercase; letter-spacing: 0.5px;
                        }
                        .doc-meta {
                            font-size: 11px; color: #6B7280; font-weight: 500;
                        }
                        .stat-strip {
                            display: flex; gap: 10px; margin-bottom: 14px;
                        }
                        .stat-card {
                            flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; padding: 6px 10px;
                            background: #F9FAFB;
                        }
                        .stat-val { font-size: 16px; font-weight: 900; color: #111827; }
                        .stat-lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #6B7280; letter-spacing: 0.5px; margin-top: 1px; }
                        table {
                            width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 11.5px;
                        }
                        th {
                            background: #F3F4F6; color: #374151; font-weight: 800; font-size: 10.5px;
                            text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 10px; text-align: left;
                            border-top: 1px solid #D1D5DB; border-bottom: 2px solid #9CA3AF;
                        }
                        .footer {
                            margin-top: 20px; padding-top: 10px; border-top: 1px solid #E5E7EB;
                            display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #6B7280;
                        }
                        .signatures {
                            display: flex; justify-content: space-between; margin-top: 30px; padding: 0 16px;
                        }
                        .sig-line {
                            width: 170px; border-top: 1px solid #9CA3AF; text-align: center; font-size: 10px; font-weight: 700; color: #4B5563; padding-top: 4px;
                        }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header-bar">
                        <div>
                            <h1 class="org-title">Daystar University Doulos Ministry</h1>
                            <div class="org-sub">G5 Training Base & Leadership Directorate • Freedom Base, Athi River</div>
                            <div class="doc-heading">${docTitle}</div>
                            <div class="doc-meta">${dateStr} • ${timeStr} ${campusDesc}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="display: inline-block; padding: 5px 10px; background: #EDE9FE; color: #6B5FA8; font-weight: 800; font-size: 10px; border-radius: 6px; border: 1px solid #DDD6FE;">
                                OFFICIAL REGISTRY
                            </div>
                        </div>
                    </div>

                    <div class="stat-strip">
                        <div class="stat-card">
                            <div class="stat-val">${totalCount}</div>
                            <div class="stat-lbl">Total Enlisted</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-val" style="color: #6B5FA8;">${douloidCount}</div>
                            <div class="stat-lbl">Douloid Members</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-val" style="color: #D97706;">${recruitCount}</div>
                            <div class="stat-lbl">Recruits Cohort</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-val" style="color: #16A34A;">${belayerCount}</div>
                            <div class="stat-lbl">Safety Belayers</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Member Name & Reg</th>
                                <th>Role & Rank</th>
                                <th>Campus</th>
                                <th>Belay Clearance</th>
                                <th>Station Clearance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <div class="signatures">
                        <div class="sig-line">G5 Training Commander</div>
                        <div class="sig-line">Base Safety Officer</div>
                        <div class="sig-line">Patron / Ministry Oversight</div>
                    </div>

                    <div class="footer">
                        <div>Daystar University Doulos Ministry • Freedom Base Athi River & Valley Road Campus</div>
                        <div>Generated by ${username}</div>
                    </div>

                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(printHtml);
            win.document.close();
            showToast(`Opening printable PDF document with ${listToExport.length} members...`);
        } else {
            showToast('Popup blocked! Please allow popups to download the PDF.', 'error');
        }
    };

    // GPS Geolocation Capture
    const handleCaptureGps = () => {
        if (!navigator.geolocation) {
            showToast('GPS geolocation is not supported by your browser', 'error');
            return;
        }
        setGpsCapturing(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsCapturing(false);
                setNewMeetingForm(prev => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        latitude: parseFloat(pos.coords.latitude.toFixed(6)),
                        longitude: parseFloat(pos.coords.longitude.toFixed(6))
                    }
                }));
                showToast(`GPS captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            },
            (err) => {
                setGpsCapturing(false);
                console.error('GPS error:', err);
                showToast('GPS permission denied or unavailable', 'error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Helper: calculate Monday-Sunday week range for date
    const getWeekRangeClient = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        const day = d.getDay(); // 0 = Sun, 1 = Mon...
        const diff = (day === 0 ? -6 : 1 - day);
        const start = new Date(d);
        start.setDate(d.getDate() + diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    // Check if a meeting already exists for this campus in the selected week
    const existingConflictMeeting = useMemo(() => {
        if (!newMeetingForm.date || !newMeetingForm.campus) return null;
        const range = getWeekRangeClient(newMeetingForm.date);
        if (!range) return null;
        return meetings.find(m => {
            if (m.campus !== newMeetingForm.campus) return false;
            const mDate = new Date(m.date);
            return mDate >= range.start && mDate <= range.end;
        });
    }, [newMeetingForm.date, newMeetingForm.campus, meetings]);

    // Meeting Creation handler (Full Session Details & Geofencing)
    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        if (existingConflictMeeting) {
            showToast(`Policy restriction: A meeting is already scheduled for ${newMeetingForm.campus} this week`, 'error');
            return;
        }
        setMeetingCreating(true);
        try {
            const payload = {
                name: newMeetingForm.name,
                date: newMeetingForm.date,
                campus: newMeetingForm.campus,
                startTime: newMeetingForm.startTime,
                endTime: newMeetingForm.endTime,
                semester: 'MAY-AUG 2026',
                questionType: newMeetingForm.questionType,
                questionOfDay: newMeetingForm.questionOfDay,
                questionOptions: (newMeetingForm.questionType === 'multiple_choice' || newMeetingForm.questionType === 'checkboxes')
                    ? newMeetingForm.questionOptions.filter(o => o && o.trim())
                    : [],
                location: {
                    name: newMeetingForm.location.name,
                    radius: Number(newMeetingForm.location.radius) || 200,
                    latitude: Number(newMeetingForm.location.latitude),
                    longitude: Number(newMeetingForm.location.longitude)
                }
            };
            const res = await api.post('/meetings', payload);
            showToast('Meeting session created successfully!');
            setShowNewMeetingModal(false);
            setMeetings(prev => [res.data || payload, ...prev]);
        } catch (err) {
            console.error('Meeting creation failed:', err);
            showToast(err.response?.data?.message || 'Could not schedule meeting', 'error');
        } finally {
            setMeetingCreating(false);
        }
    };

    // Tab 3: Meeting Archive & Restore Handlers
    const handleArchiveMeeting = async (meeting) => {
        if (!window.confirm(`Archive meeting "${meeting.name}"?\n\nNote: All attendance records and member points will remain safely preserved in the database.`)) return;
        try {
            await api.post(`/meetings/${meeting._id}/archive`);
            showToast(`Meeting "${meeting.name}" archived successfully`);
            setMeetings(prev => prev.map(m => m._id === meeting._id ? { ...m, isArchived: true, archivedAt: new Date(), isActive: false } : m));
        } catch (err) {
            console.error('Archive meeting failed:', err);
            showToast(err.response?.data?.message || 'Failed to archive meeting', 'error');
        }
    };

    const handleUnarchiveMeeting = async (meeting) => {
        try {
            await api.post(`/meetings/${meeting._id}/unarchive`);
            showToast(`Meeting "${meeting.name}" restored to active sessions`);
            setMeetings(prev => prev.map(m => m._id === meeting._id ? { ...m, isArchived: false, archivedAt: null } : m));
        } catch (err) {
            console.error('Restore meeting failed:', err);
            showToast(err.response?.data?.message || 'Failed to restore meeting', 'error');
        }
    };

    const handleBulkArchiveMeetings = async () => {
        const pastCompleted = meetings.filter(m => !m.isActive && !m.isArchived);
        if (pastCompleted.length === 0) {
            showToast('No completed meetings available to archive', 'error');
            return;
        }
        if (!window.confirm(`Archive all ${pastCompleted.length} completed past meeting(s)?\n\nAll attendance records will remain safely preserved in the database.`)) return;

        setIsArchivingMeetings(true);
        try {
            const res = await api.post('/meetings/bulk-archive', {
                meetingIds: pastCompleted.map(m => m._id)
            });
            showToast(res.data?.message || `Archived ${pastCompleted.length} past meetings`);
            const archivedIds = pastCompleted.map(m => m._id);
            setMeetings(prev => prev.map(m => archivedIds.includes(m._id) ? { ...m, isArchived: true, archivedAt: new Date() } : m));
        } catch (err) {
            console.error('Bulk archive meetings failed:', err);
            showToast(err.response?.data?.message || 'Failed to archive completed meetings', 'error');
        } finally {
            setIsArchivingMeetings(false);
        }
    };

    // Tab 5: Recruit Graduation & 20-Day Archive Handlers
    const handleToggleRecruit = (id) => {
        setSelectedRecruitIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllFilteredRecruits = () => {
        const visibleIds = filteredRecruits.map(r => r._id);
        const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedRecruitIds.includes(id));
        if (allSelected) {
            setSelectedRecruitIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setSelectedRecruitIds(prev => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const handleQuickPick = (count) => {
        const num = parseInt(count);
        if (isNaN(num) || num <= 0) return;
        const toSelect = filteredRecruits.slice(0, num).map(r => r._id);
        setSelectedRecruitIds(toSelect);
        showToast(`Selected ${toSelect.length} recruit(s) for graduation`);
    };

    const handleBulkGraduate = async () => {
        if (selectedRecruitIds.length === 0) {
            showToast('Please select at least one recruit to graduate', 'error');
            return;
        }
        if (!window.confirm(`Graduate all ${selectedRecruitIds.length} selected recruit(s) to Douloid status?`)) return;

        setIsGraduatingRecruits(true);
        try {
            const idsToGraduate = [...selectedRecruitIds];
            await api.post('/members/bulk-graduate', { memberIds: idsToGraduate });
            showToast(`🎉 Spectacular! ${idsToGraduate.length} recruits graduated to Douloid!`);
            setMembers(prev => prev.map(m => idsToGraduate.includes(m._id) ? {
                ...m,
                memberType: 'Douloid',
                status: 'Active',
                douloidRank: 'Shadow Douloid',
                needsGraduationCongrats: true
            } : m));
            setSelectedRecruitIds(prev => prev.filter(id => !idsToGraduate.includes(id)));
        } catch (err) {
            console.error('Bulk graduation failed:', err);
            showToast(err.response?.data?.message || 'Failed to graduate recruits', 'error');
        } finally {
            setIsGraduatingRecruits(false);
        }
    };

    const handleArchiveRecruits = async (mode = 'unselected') => {
        let targetIds = [];
        if (mode === 'unselected') {
            const unselected = recruits.filter(r => !selectedRecruitIds.includes(r._id));
            targetIds = unselected.map(r => r._id);
        } else if (mode === 'selected') {
            targetIds = [...selectedRecruitIds];
        } else if (mode === 'all') {
            targetIds = recruits.map(r => r._id);
        }

        if (targetIds.length === 0) {
            showToast('No candidates found to archive', 'error');
            return;
        }

        const confirmMsg = `Safely archive ${targetIds.length} non-graduated recruit(s) for a 20-day holding period?\n\nNOTE: They will NOT be deleted from the database. After 20 days in the system, they will be removed as archived.`;
        if (!window.confirm(confirmMsg)) return;

        setIsArchivingRecruits(true);
        try {
            const now = new Date();
            const durationDays = 20;
            const archivedUntil = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

            const res = await api.post('/members/bulk-archive-recruits', {
                memberIds: targetIds,
                days: durationDays,
                reason: 'Recruit not graduated during cohort'
            });

            showToast(res.data?.message || `🗄️ ${targetIds.length} recruit(s) safely archived for 20 days (retained in DB)`);
            setMembers(prev => prev.map(m => targetIds.includes(m._id) ? {
                ...m,
                status: 'Archived',
                archivedAt: now,
                archivedUntil: archivedUntil,
                archiveDays: durationDays,
                archiveReason: 'Recruit not graduated during cohort'
            } : m));
            setSelectedRecruitIds(prev => prev.filter(id => !targetIds.includes(id)));
        } catch (err) {
            console.error('Archiving recruits failed:', err);
            showToast(err.response?.data?.message || 'Failed to archive recruits', 'error');
        } finally {
            setIsArchivingRecruits(false);
        }
    };

    const handleGraduateSingle = async (recruit) => {
        try {
            await api.post(`/members/${recruit._id}/graduate`);
            showToast(`🎉 Hallelujah! ${recruit.name} has graduated to Douloid!`);
            setMembers(prev => prev.map(m => m._id === recruit._id ? {
                ...m,
                memberType: 'Douloid',
                status: 'Active',
                douloidRank: 'Shadow Douloid',
                needsGraduationCongrats: true
            } : m));
            setSelectedRecruitIds(prev => prev.filter(id => id !== recruit._id));
        } catch (err) {
            console.error('Graduation error:', err);
            showToast(err.response?.data?.message || 'Failed to graduate recruit', 'error');
        }
    };

    const handleArchiveSingle = async (recruit) => {
        if (!window.confirm(`Archive ${recruit.name} for 20 days?\n\nThey will be safely preserved in the database.`)) return;
        try {
            const now = new Date();
            const until = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
            await api.post(`/members/${recruit._id}/archive`, { days: 20, reason: 'Recruit not graduated during cohort' });
            showToast(`🗄️ ${recruit.name} archived for 20 days (safe in database)`);
            setMembers(prev => prev.map(m => m._id === recruit._id ? {
                ...m,
                status: 'Archived',
                archivedAt: now,
                archivedUntil: until,
                archiveDays: 20,
                archiveReason: 'Recruit not graduated during cohort'
            } : m));
            setSelectedRecruitIds(prev => prev.filter(id => id !== recruit._id));
        } catch (err) {
            console.error('Archive error:', err);
            showToast(err.response?.data?.message || 'Failed to archive recruit', 'error');
        }
    };

    const handleUnarchiveRecruit = async (recruit) => {
        try {
            await api.post(`/members/${recruit._id}/unarchive`);
            showToast(`✅ ${recruit.name} restored to active recruit roster!`);
            setMembers(prev => prev.map(m => m._id === recruit._id ? {
                ...m,
                status: 'Active',
                archivedAt: null,
                archivedUntil: null
            } : m));
        } catch (err) {
            console.error('Unarchive error:', err);
            showToast(err.response?.data?.message || 'Failed to restore recruit', 'error');
        }
    };

    const getDaysRemaining = (archivedUntil) => {
        if (!archivedUntil) return 0;
        const diffMs = new Date(archivedUntil).getTime() - Date.now();
        return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    };

    // Confirm Rank Promotion
    const handleConfirmPromotion = async (cadre, nextRank, customBelay, customSolo, notes) => {
        try {
            const scores = promotionScores[cadre._id] || { team: 4, ropes: 4, base: 4, rescue: 4, firstAid: 4 };
            const belay = customBelay || cadre.belayStatus || (nextRank === 'Shadow Douloid' || nextRank === 'None' ? 'Not Permitted' : 'Secondary Belayer');
            const solo = customSolo !== undefined ? customSolo : (nextRank === 'Intermediate Douloid' || nextRank === 'Lead Douloid' || nextRank === 'Senior Lead Douloid');

            await api.put(`/trainings/members/${cadre._id}/rank`, {
                douloidRank: nextRank,
                belayStatus: belay,
                soloStationAllowed: solo,
                notes: notes || `Promoted to ${nextRank} through G5 Evaluation. Avg Score: ${(Object.values(scores).reduce((a,b)=>a+b,0)/5).toFixed(1)}★`,
                promotedBy: username
            });
            showToast(`🌟 Promoted ${cadre.name} to ${nextRank}!`);
            setCadres(prev => prev.map(c => c._id === cadre._id ? { 
                ...c, 
                douloidRank: nextRank,
                belayStatus: belay,
                soloStationAllowed: solo
            } : c));
        } catch (err) {
            console.error('Promotion error:', err);
            showToast(err.response?.data?.message || 'Failed to update rank', 'error');
        }
    };

    // Batch Promotion Handler (Select multiple students and promote them at once)
    const handleBatchPromote = async () => {
        if (selectedCadres.length === 0) {
            showToast('Please select at least one student to promote', 'error');
            return;
        }

        if ((batchRank === 'Shadow Douloid' || batchRank === 'None') && batchBelayStatus === 'Primary Belayer Certified') {
            showToast('Safety Rule: Shadow Douloids cannot hold Primary Belayer certification', 'error');
            return;
        }

        setBatchSubmitting(true);
        try {
            const res = await api.put('/trainings/members/batch-rank', {
                memberIds: selectedCadres,
                douloidRank: batchRank,
                belayStatus: batchBelayStatus,
                soloStationAllowed: batchSoloAllowed,
                promotedBy: username,
                notes: `Batch promoted to ${batchRank} by ${username}`
            });

            showToast(res.data.message || `Promoted ${selectedCadres.length} students to ${batchRank}!`);

            setCadres(prev => prev.map(c => {
                if (selectedCadres.includes(c._id)) {
                    return {
                        ...c,
                        douloidRank: batchRank,
                        belayStatus: batchBelayStatus,
                        soloStationAllowed: batchSoloAllowed
                    };
                }
                return c;
            }));

            setSelectedCadres([]);
        } catch (err) {
            console.error('Batch promotion error:', err);
            showToast(err.response?.data?.message || 'Failed to batch promote students', 'error');
        } finally {
            setBatchSubmitting(false);
        }
    };

    // Promotion helper - correct sequential rank progression ladder
    const getNextRank = (currentRank) => {
        if (!currentRank || currentRank === 'None' || currentRank === 'Recruit') return 'Shadow Douloid';
        switch (currentRank) {
            case 'Shadow Douloid': return 'Basic Douloid';
            case 'Basic Douloid': return 'Intermediate Douloid';
            case 'Intermediate Douloid': return 'Lead Douloid';
            case 'Lead Douloid': return 'Senior Lead Douloid';
            default: return 'Basic Douloid';
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 'Senior Lead Douloid': return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' };
            case 'Lead Douloid': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
            case 'Intermediate Douloid': return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
            case 'Basic Douloid': return { bg: '#E0E7FF', text: '#4F46E5', border: '#C7D2FE' };
            case 'Shadow Douloid': return { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' };
            default: return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
        }
    };

    // 9 Sidebar Items
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'meetings', label: 'Meetings', icon: Calendar },
        { id: 'trainings_camps', label: 'Trainings & Camps', icon: Compass },
        { id: 'graduations', label: 'Recruit Graduations', icon: GraduationCap, badge: recruits.length },
        { id: 'promotions', label: 'Rank Promotions', icon: Award, badge: cadres.filter(c => c.douloidRank === 'Shadow Douloid' || c.douloidRank === 'Basic Douloid').length },
        { id: 'cadres', label: 'Membership Roster', icon: Users },
        { id: 'contributions', label: 'Contributions', icon: CreditCard },
        { id: 'safety', label: 'Safety & Incidents', icon: ShieldAlert, badge: incidents.length > 0 ? incidents.length : null }
    ];

    // Standard LOPs
    const lops = [
        { id: 'LOP-01', title: 'High Ropes Belay Safety & Rigging SOP', code: 'LOP-SOP-01', desc: 'Double-check carabiner squeeze, dynamic rope lifespan, ground anchor inspection.' },
        { id: 'LOP-02', title: 'Wilderness Evacuation & Extrication Tree', code: 'LOP-MED-02', desc: 'Lukenya ridge stretcher dispatch, spine stabilization, Daystar clinic hotline.' },
        { id: 'LOP-03', title: 'Severe Weather & Lightning Shutdown', code: 'LOP-ENV-03', desc: '30-second flash-to-bang rule, immediate course clearance & safe zone dispersal.' },
        { id: 'LOP-04', title: 'Solo Station & Peer Coaching Clearance', code: 'LOP-CAD-04', desc: 'Prerequisites for Intermediate Douloids operating zip line and pamper pole alone.' }
    ];

    return (
        <div className="g5-portal-root">
            {/* BACKDROP OVERLAY ON MOBILE */}
            <div
                className={`g5-sidebar-backdrop ${mobileSidebarOpen ? 'active' : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
            />

            {/* FIXED / MOBILE SLIDE-OUT SIDEBAR */}
            <aside className={`g5-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="g5-sidebar-brand" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div className="g5-brand-icon-box">
                            <Compass size={24} />
                        </div>
                        <div>
                            <div className="g5-brand-title">Doulos G5</div>
                            <div className="g5-brand-subtitle">Training Portal</div>
                        </div>
                    </div>
                    {mobileSidebarOpen && (
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                padding: '0.35rem',
                                borderRadius: '8px'
                            }}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav className="g5-nav-list">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`g5-nav-btn ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setMobileSidebarOpen(false);
                                }}
                            >
                                <Icon size={19} />
                                <span>{item.label}</span>
                                {item.badge ? (
                                    <span className="g5-nav-badge">{item.badge}</span>
                                ) : null}
                            </button>
                        );
                    })}
                </nav>

                <div className="g5-sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="g5-avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                {username}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                {userCampus}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Sign Out"
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '0.4rem'
                        }}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* MAIN PORTAL WRAPPER */}
            <div className="g5-main-wrapper">
                {/* TOPBAR */}
                <header className="g5-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <button
                            type="button"
                            className="g5-menu-toggle"
                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                            aria-label="Toggle Navigation Menu"
                        >
                            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="g5-search-wrap">
                            <Search size={17} />
                            <input
                                type="text"
                                placeholder="Search cadets, recruits, skills..."
                                className="g5-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="g5-topbar-actions">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-soft)', padding: '0.35rem 0.85rem', borderRadius: '999px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-status-active)' }}></span>
                            <span className="g5-ministry-badge-text" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                Outdoor Ministry Mode
                            </span>
                        </div>

                        <div className="g5-profile-block">
                            <div className="g5-avatar">
                                🧗
                            </div>
                            <div className="g5-profile-info">
                                <span className="g5-profile-name">{username}</span>
                                <span className="g5-profile-role">Training Coordinator</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* TOAST NOTIFICATION */}
                {toast && (
                    <div style={{
                        position: 'fixed',
                        top: '86px',
                        right: '2rem',
                        zIndex: 9999,
                        background: toast.type === 'error' ? 'var(--color-status-inactive)' : 'var(--color-accent-warm)',
                        color: '#FFFFFF',
                        padding: '0.85rem 1.4rem',
                        borderRadius: 'var(--radius-button)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {toast.type === 'error' ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
                        <span>{toast.text}</span>
                    </div>
                )}

                {/* CONTENT VIEWPORT */}
                <main className="g5-content">

                    {/* ========================================================= */}
                    {/* TAB 1: DASHBOARD (LANDING PAGE) */}
                    {/* ========================================================= */}
                    {activeTab === 'dashboard' && (
                        <div>
                            {/* ACTIVE LIVE BANNER ON DASHBOARD IF ANY SESSION IS LIVE */}
                            {meetings.some(m => m.isActive) && (() => {
                                const activeM = meetings.find(m => m.isActive);
                                return (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #EAF7F0 0%, #E0F5E9 100%)',
                                        border: '1.5px solid var(--color-status-active)',
                                        borderRadius: 'var(--radius-card)',
                                        padding: '1rem 1.5rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                        boxShadow: '0 4px 18px rgba(76, 175, 125, 0.12)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                            <div className="g5-pulse-dot" style={{ width: '10px', height: '10px' }} />
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.98rem' }}>
                                                    Live Check-In Active: {activeM.name}
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                                                    {activeM.location?.name || (activeM.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')} • Join Code: <strong style={{ color: 'var(--color-primary)' }}>{activeM.code}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="g5-btn-warm"
                                                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                                                onClick={() => setInsightMeeting({ ...activeM, initialTab: 'live' })}
                                            >
                                                <Radio size={14} /> Open Live Feed
                                            </button>
                                            <button
                                                className="g5-btn-secondary"
                                                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                                                onClick={() => setInsightMeeting({ ...activeM, initialTab: 'attended' })}
                                            >
                                                <Users size={14} /> Who Attended ({activeM.attendanceCount ?? 0})
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 5 Glanceable Stat Cards in a Row */}
                            <div className="g5-stat-grid">
                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Overall Attendance</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: 'var(--color-status-active-soft)', color: 'var(--color-status-active)' }}>
                                            <CalendarCheck size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number">
                                        {attendancePercentage}%
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-status-active)', fontWeight: 600 }}>
                                        {totalAttended} total attendances recorded
                                    </span>
                                </div>

                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Recruits in Pipeline</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: 'var(--color-accent-warm-soft)', color: 'var(--color-accent-warm)' }}>
                                            <GraduationCap size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number" style={{ color: 'var(--color-accent-warm)' }}>
                                        {recruits.length}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        {archivedRecruits.length} in 20-day holding archive
                                    </span>
                                </div>

                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Promotions Pending</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                                            <Award size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number">
                                        {cadres.filter(c => c.douloidRank === 'Shadow Douloid' || c.douloidRank === 'Basic Douloid').length}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                        Shadow & Basic Douloids in DB
                                    </span>
                                </div>

                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Upcoming Trainings</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                                            <Compass size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number">
                                        {trainings.length}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: '#0284C7', fontWeight: 600 }}>
                                        Active drill modules in DB
                                    </span>
                                </div>

                                <div className="g5-stat-card">
                                    <div className="g5-stat-top">
                                        <span className="g5-stat-label">Absentee Flags</span>
                                        <div className="g5-stat-icon-wrap" style={{ backgroundColor: 'var(--color-status-inactive-soft)', color: 'var(--color-status-inactive)' }}>
                                            <AlertTriangle size={20} />
                                        </div>
                                    </div>
                                    <div className="g5-stat-number" style={{ color: 'var(--color-status-inactive)' }}>
                                        {absenteeMembers.length}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        2+ consecutive misses
                                    </span>
                                </div>
                            </div>

                            {/* Warm Glanceable Overview Cards */}
                            <div className="g5-overview-split">
                                <div className="g5-card">
                                    <div className="g5-card-header">
                                        <div>
                                            <div className="g5-card-title">Next Scheduled Meeting / Session</div>
                                            <div className="g5-card-desc">{meetings[0]?.name || 'No meeting scheduled yet in database'}</div>
                                        </div>
                                        <span className={`g5-pill ${meetings[0]?.isActive ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                            <Check size={14} /> {meetings[0]?.isActive ? 'Live Now' : 'Scheduled'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', background: 'var(--color-page-bg)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>DATE & TIME</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                                                {meetings[0]?.date ? `${new Date(meetings[0].date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })} • ${meetings[0].startTime || 'TBD'}` : 'None'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>LOCATION</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                                                {meetings[0]?.location?.name || meetings[0]?.venue || meetings[0]?.campus || 'Not specified'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>CAMPUS</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-accent-warm)', marginTop: '0.2rem' }}>
                                                {meetings[0]?.campus || 'All Campuses'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                        <button className="g5-btn-warm" onClick={() => setActiveTab('graduations')}>
                                            <GraduationCap size={18} /> View Recruit Graduations ({recruits.length})
                                        </button>
                                        <button className="g5-btn-secondary" onClick={() => setActiveTab('meetings')}>
                                            <Calendar size={18} /> View Field Meetings ({activeMeetings.length})
                                        </button>
                                    </div>
                                </div>

                                <div className="g5-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div className="g5-card-header" style={{ marginBottom: '1rem' }}>
                                            <div>
                                                <div className="g5-card-title">Belay Safety Readiness</div>
                                                <div className="g5-card-desc">Certified belayers in membership roster</div>
                                            </div>
                                            <Shield size={22} style={{ color: 'var(--color-status-active)' }} />
                                        </div>
                                        <div style={{ background: 'var(--color-status-active-soft)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(76,175,125,0.2)' }}>
                                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-status-active)' }}>
                                                {cadres.filter(c => c.belayStatus === 'Primary Belayer Certified' || c.douloidRank === 'Lead Douloid' || c.douloidRank === 'Intermediate Douloid').length} Certified Belayers
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', marginTop: '0.3rem', fontWeight: 600 }}>
                                                {cadres.length > 0 
                                                    ? `Out of ${cadres.length} total active Douloids in database registry.`
                                                    : 'Awaiting membership roster enrollment.'}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="g5-btn-outline" style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('cadres')}>
                                        Inspect Membership Roster & Clearances <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: ATTENDANCE (CLEAN GENEROUS-ROW TABLE) */}
                    {/* ========================================================= */}
                    {activeTab === 'attendance' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* QUICK SESSION ATTENDANCE INSPECTOR */}
                            <div className="g5-card" style={{ padding: '1.25rem 1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CalendarCheck size={18} style={{ color: 'var(--color-primary)' }} /> Inspect Specific Session Attendance & Live Feeds
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                            Click any session below to view full attendee roster, scan times, survey answers, or live ticker
                                        </div>
                                    </div>
                                    <button
                                        className="g5-btn-outline"
                                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                                        onClick={() => setActiveTab('meetings')}
                                    >
                                        All Sessions ({meetings.length}) <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                                    {meetings.slice(0, 4).map((m) => (
                                        <div
                                            key={m._id || m.code}
                                            onClick={() => setInsightMeeting({ ...m, initialTab: 'attended' })}
                                            style={{
                                                background: m.isActive ? 'var(--color-status-active-soft)' : 'var(--color-page-bg)',
                                                border: m.isActive ? '1.5px solid var(--color-status-active)' : '1px solid var(--color-border)',
                                                borderRadius: '12px',
                                                padding: '0.85rem 1rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                gap: '0.4rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                    {new Date(m.date).toLocaleDateString()}
                                                </span>
                                                <span className={`g5-pill ${m.isActive ? 'g5-pill-active' : 'g5-pill-inactive'}`} style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem' }}>
                                                    {m.isActive ? 'Live' : 'Done'}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {m.name}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                <span>{m.location?.name || (m.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}</span>
                                                <span style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    {m.attendanceCount ?? 0} attended →
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="g5-card">
                            <div className="g5-card-header">
                                <div>
                                    <div className="g5-card-title">Attendance Tracking</div>
                                    <div className="g5-card-desc">Live member drill attendance, semester rollups, and pastoral absentee radar</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <select
                                        className="g5-form-select"
                                        style={{ width: '160px', padding: '0.5rem 0.75rem' }}
                                        value={campusFilter}
                                        onChange={(e) => setCampusFilter(e.target.value)}
                                    >
                                        <option value="All">All Campuses</option>
                                        <option value="Athi River">Athi River</option>
                                        <option value="Valley Road">Valley Road</option>
                                    </select>
                                </div>
                            </div>

                            <div className="g5-table-wrap">
                                <table className="g5-table">
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Campus</th>
                                            <th>Role Type</th>
                                            <th>Attendance Rate</th>
                                            <th>Consecutive Absences</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members
                                            .filter(m => campusFilter === 'All' || m.campus === campusFilter)
                                            .filter(m => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .slice(0, 15)
                                            .map((member) => {
                                                const rate = member.totalPoints ? Math.min(100, Math.round((member.totalPoints / 80) * 100)) : 85;
                                                const isAbsentFlag = (member.consecutiveAbsences || 0) >= 2;
                                                return (
                                                    <tr key={member._id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                                <div className="g5-avatar" style={{ width: '38px', height: '38px' }}>
                                                                    {member.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{member.name}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{member.studentRegNo}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>{member.campus}</td>
                                                        <td>
                                                            <span className={`g5-pill ${member.memberType === 'Douloid' ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                                                {member.memberType || 'Recruit'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                                <div style={{ flex: 1, maxWidth: '100px', height: '7px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${rate}%`, height: '100%', background: rate >= 80 ? 'var(--color-status-active)' : 'var(--color-accent-warm)' }} />
                                                                </div>
                                                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{rate}%</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {isAbsentFlag ? (
                                                                <span className="g5-pill g5-pill-inactive">
                                                                    <AlertTriangle size={13} /> {member.consecutiveAbsences} missed
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Nominal</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`g5-pill ${member.isActive !== false ? 'g5-pill-active' : 'g5-pill-inactive'}`}>
                                                                {member.isActive !== false ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: MEETINGS (CARDS WITH WHO ATTENDED & LIVE FEED) */}
                    {/* ========================================================= */}
                    {activeTab === 'meetings' && (
                        <div>
                            {/* TAB 3 HEADER */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Training Meetings & Field Drills</h2>
                                        <span className="g5-pill g5-pill-purple">
                                            {activeMeetings.length} Active Sessions
                                        </span>
                                        {archivedMeetings.length > 0 && (
                                            <span className="g5-pill g5-pill-inactive">
                                                🗄️ {archivedMeetings.length} Archived
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                        Weekly sessions, live attendance feeds, who attended rosters, and safe archive repository
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button className="g5-btn-warm" onClick={() => setShowNewMeetingModal(true)}>
                                        <Plus size={18} /> + New Meeting
                                    </button>
                                </div>
                            </div>

                            {/* SUB-TABS: ACTIVE & RECENT vs ARCHIVED */}
                            <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'nowrap' }}>
                                <button
                                    type="button"
                                    onClick={() => setMeetingSubTab('active')}
                                    style={{
                                        background: meetingSubTab === 'active' ? 'var(--color-surface)' : 'transparent',
                                        color: meetingSubTab === 'active' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        border: meetingSubTab === 'active' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: '10px',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flexShrink: 0,
                                        boxShadow: meetingSubTab === 'active' ? '0 2px 8px rgba(107, 95, 168, 0.15)' : 'none',
                                        transition: 'all 0.18s ease'
                                    }}
                                >
                                    <Calendar size={17} /> Active & Recent Sessions ({activeMeetings.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMeetingSubTab('archived')}
                                    style={{
                                        background: meetingSubTab === 'archived' ? 'var(--color-surface)' : 'transparent',
                                        color: meetingSubTab === 'archived' ? 'var(--color-accent-warm)' : 'var(--color-text-muted)',
                                        border: meetingSubTab === 'archived' ? '2px solid var(--color-accent-warm)' : '1px solid var(--color-border)',
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: '10px',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flexShrink: 0,
                                        boxShadow: meetingSubTab === 'archived' ? '0 2px 8px rgba(232, 163, 61, 0.15)' : 'none',
                                        transition: 'all 0.18s ease'
                                    }}
                                >
                                    <Archive size={17} /> Archived Sessions ({archivedMeetings.length})
                                </button>
                            </div>

                            {/* SEARCH & FILTERS BAR */}
                            <div className="g5-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                            <input
                                                type="text"
                                                placeholder="Search meeting by name or code..."
                                                value={meetingSearch}
                                                onChange={(e) => setMeetingSearch(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                                                    borderRadius: '10px',
                                                    border: '1px solid var(--color-border)',
                                                    background: 'var(--color-page-bg)',
                                                    color: 'var(--color-text-main)',
                                                    fontSize: '0.88rem',
                                                    fontWeight: 600
                                                }}
                                            />
                                        </div>
                                        <select
                                            value={meetingCampusFilter}
                                            onChange={(e) => setMeetingCampusFilter(e.target.value)}
                                            style={{
                                                padding: '0.6rem 1rem',
                                                borderRadius: '10px',
                                                border: '1px solid var(--color-border)',
                                                background: 'var(--color-page-bg)',
                                                color: 'var(--color-text-main)',
                                                fontSize: '0.88rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            <option value="All">All Campuses</option>
                                            <option value="Athi River">Athi River</option>
                                            <option value="Valley Road">Valley Road</option>
                                        </select>
                                    </div>

                                    {/* BATCH ARCHIVE ACTION BUTTON IN ACTIVE VIEW */}
                                    {meetingSubTab === 'active' && (() => {
                                        const completedPast = activeMeetings.filter(m => !m.isActive);
                                        return completedPast.length > 0 ? (
                                            <button
                                                type="button"
                                                className="g5-btn-secondary"
                                                onClick={handleBulkArchiveMeetings}
                                                disabled={isArchivingMeetings}
                                                style={{ fontSize: '0.84rem' }}
                                                title="Safely moves completed meetings to the Archived vault. Attendance data remains in the database."
                                            >
                                                <Archive size={15} />
                                                {isArchivingMeetings ? 'Archiving...' : `Archive Completed Meetings (${completedPast.length}) 🗄️`}
                                            </button>
                                        ) : null;
                                    })()}
                                </div>
                            </div>

                            {/* ========================================================= */}
                            {/* ACTIVE MEETINGS VIEW */}
                            {/* ========================================================= */}
                            {meetingSubTab === 'active' && (
                                <div>
                                    {/* ACTIVE LIVE BANNER IF ANY SESSION IS LIVE */}
                                    {filteredActiveMeetings.filter(m => m.isActive).length > 0 && (() => {
                                        const activeM = filteredActiveMeetings.filter(m => m.isActive)[0];
                                        return (
                                            <div style={{
                                                background: 'linear-gradient(135deg, #EAF7F0 0%, #E0F5E9 100%)',
                                                border: '1.5px solid var(--color-status-active)',
                                                borderRadius: 'var(--radius-card)',
                                                padding: '1.25rem 1.75rem',
                                                marginBottom: '1.75rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '1rem',
                                                boxShadow: '0 4px 18px rgba(76, 175, 125, 0.15)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="g5-pulse-dot" style={{ width: '12px', height: '12px' }} />
                                                    <div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                            Live Check-In Active: {activeM.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                            {activeM.location?.name || (activeM.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')} • Join Code: <strong style={{ color: 'var(--color-primary)', letterSpacing: '1px' }}>{activeM.code}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-warm"
                                                        style={{ background: '#25AAE1', borderColor: '#25AAE1' }}
                                                        onClick={() => setQrMeeting(activeM)}
                                                    >
                                                        <QrCode size={16} /> Display QR Code 📱
                                                    </button>
                                                    <button
                                                        className="g5-btn-warm"
                                                        onClick={() => setInsightMeeting({ ...activeM, initialTab: 'live' })}
                                                    >
                                                        <Radio size={16} /> Open Live Attendance Feed
                                                    </button>
                                                    <button
                                                        className="g5-btn-secondary"
                                                        onClick={() => setInsightMeeting({ ...activeM, initialTab: 'attended' })}
                                                    >
                                                        <Users size={16} /> Who Attended ({activeM.attendanceCount ?? 0})
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {filteredActiveMeetings.length === 0 ? (
                                        <div className="g5-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                                            <div className="g5-avatar" style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', fontSize: '1.8rem' }}>
                                                📅
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                {meetingSearch || meetingCampusFilter !== 'All' ? 'No Matching Meetings Found' : 'No Active Meetings Scheduled'}
                                            </h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0.5rem auto 1.25rem' }}>
                                                {meetingSearch || meetingCampusFilter !== 'All'
                                                    ? 'Try adjusting your search query or campus filter.'
                                                    : 'Schedule a new drill or weekly fellowship meeting using the button below.'}
                                            </p>
                                            <button className="g5-btn-warm" onClick={() => setShowNewMeetingModal(true)}>
                                                <Plus size={18} /> Schedule New Meeting
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                            {filteredActiveMeetings.map((meeting) => (
                                                <div
                                                    key={meeting._id || meeting.code || meeting.date}
                                                    className="g5-card"
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                                        border: meeting.isActive ? '1.5px solid var(--color-status-active)' : '1px solid var(--color-border)'
                                                    }}
                                                    onClick={() => setInsightMeeting({ ...meeting, initialTab: 'attended' })}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                                            <span className="g5-pill g5-pill-purple">
                                                                <Calendar size={13} /> {new Date(meeting.date).toLocaleDateString()}
                                                            </span>
                                                            <span
                                                                className={`g5-pill ${meeting.isActive ? 'g5-pill-active' : 'g5-pill-inactive'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setInsightMeeting({ ...meeting, initialTab: 'attended' });
                                                                }}
                                                            >
                                                                {meeting.isActive ? (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                        <div className="g5-pulse-dot" style={{ width: '6px', height: '6px' }} />
                                                                        Live • Active
                                                                    </span>
                                                                ) : (
                                                                    'Completed'
                                                                )}
                                                            </span>
                                                        </div>

                                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                                            {meeting.name || 'Weekly Training Drill'}
                                                        </h3>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                                            <Clock size={15} /> {meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                            <MapPin size={15} /> {meeting.location?.name || meeting.venue || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                                                                CODE: {meeting.code || 'DOULOS'}
                                                            </span>
                                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-status-active)' }}>
                                                                ✓ {meeting.campus}
                                                            </span>
                                                        </div>

                                                        {meeting.isActive ? (
                                                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                                                <button
                                                                    className="g5-btn-warm"
                                                                    style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setInsightMeeting({ ...meeting, initialTab: 'live' });
                                                                    }}
                                                                >
                                                                    <Radio size={15} /> Live Attendance Feed & Check-In
                                                                </button>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-secondary"
                                                                        style={{ justifyContent: 'center', padding: '0.6rem', fontSize: '0.82rem', color: '#25AAE1', borderColor: 'rgba(37, 170, 225, 0.35)' }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setQrMeeting(meeting);
                                                                        }}
                                                                        title="Display QR code on screen"
                                                                    >
                                                                        <QrCode size={14} /> Display QR
                                                                    </button>
                                                                    <button
                                                                        className="g5-btn-secondary"
                                                                        style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.82rem' }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setInsightMeeting({ ...meeting, initialTab: 'attended' });
                                                                        }}
                                                                    >
                                                                        <Users size={14} /> Who Attended ({meeting.attendanceCount ?? 0})
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem' }}>
                                                                <button
                                                                    className="g5-btn-secondary"
                                                                    style={{ justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setInsightMeeting({ ...meeting, initialTab: 'attended' });
                                                                    }}
                                                                >
                                                                    <Users size={15} /> Who Attended ({meeting.attendanceCount ?? 0})
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="g5-btn-secondary"
                                                                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem', color: '#25AAE1', borderColor: 'rgba(37, 170, 225, 0.35)' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setQrMeeting(meeting);
                                                                    }}
                                                                    title="Display QR code"
                                                                >
                                                                    <QrCode size={14} /> QR
                                                                </button>
                                                                <button
                                                                    className="g5-btn-outline"
                                                                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem' }}
                                                                    title="Archive this completed session (attendance records remain safe in database)"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleArchiveMeeting(meeting);
                                                                    }}
                                                                >
                                                                    <Archive size={15} /> Archive
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* ARCHIVED MEETINGS VIEW */}
                            {/* ========================================================= */}
                            {meetingSubTab === 'archived' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {/* ARCHIVE NOTICE BANNER */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(232, 163, 61, 0.08), rgba(107, 95, 168, 0.08))',
                                        border: '1.5px solid var(--color-border)',
                                        borderRadius: '14px',
                                        padding: '1.25rem 1.5rem',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1rem'
                                    }}>
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '10px',
                                            backgroundColor: 'var(--color-accent-warm-soft)',
                                            color: 'var(--color-accent-warm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Archive size={22} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                                                    Archived Meeting Sessions
                                                </h3>
                                                <span className="g5-pill g5-pill-active" style={{ fontSize: '0.72rem' }}>
                                                    🔒 Attendance Safely Preserved in Database
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                                                Archived meetings retain all member check-ins, attendance logs, and student points in MongoDB. You can inspect rosters, export reports, or restore any meeting back to the active list at any time.
                                            </p>
                                        </div>
                                    </div>

                                    {filteredArchivedMeetings.length === 0 ? (
                                        <div className="g5-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                                            <div className="g5-avatar" style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', fontSize: '1.8rem', backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                                                🗄️
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                No Meetings in Archive
                                            </h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0.5rem auto 0' }}>
                                                Completed meetings from previous weeks or past semesters can be archived to keep your active dashboard clean.
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                            {filteredArchivedMeetings.map((meeting) => (
                                                <div
                                                    key={meeting._id || meeting.code || meeting.date}
                                                    className="g5-card"
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer',
                                                        border: '1px solid var(--color-border)'
                                                    }}
                                                    onClick={() => setInsightMeeting({ ...meeting, initialTab: 'attended' })}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                                            <span className="g5-pill g5-pill-purple">
                                                                <Calendar size={13} /> {new Date(meeting.date).toLocaleDateString()}
                                                            </span>
                                                            <span className="g5-pill g5-pill-inactive">
                                                                🗄️ Archived {meeting.archivedAt ? `• ${new Date(meeting.archivedAt).toLocaleDateString()}` : ''}
                                                            </span>
                                                        </div>

                                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                                            {meeting.name || 'Weekly Training Drill'}
                                                        </h3>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                                            <Clock size={15} /> {meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                            <MapPin size={15} /> {meeting.location?.name || meeting.venue || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                                                                CODE: {meeting.code || 'DOULOS'}
                                                            </span>
                                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-status-active)' }}>
                                                                🔒 Database Retained
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem' }}>
                                                            <button
                                                                className="g5-btn-secondary"
                                                                style={{ justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setInsightMeeting({ ...meeting, initialTab: 'attended' });
                                                                }}
                                                            >
                                                                <Users size={15} /> Who Attended ({meeting.attendanceCount ?? 0})
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="g5-btn-secondary"
                                                                style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem', color: '#25AAE1', borderColor: 'rgba(37, 170, 225, 0.35)' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setQrMeeting(meeting);
                                                                }}
                                                                title="Display QR code"
                                                            >
                                                                <QrCode size={14} /> QR
                                                            </button>
                                                            <button
                                                                className="g5-btn-outline"
                                                                style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem', borderColor: 'var(--color-primary)' }}
                                                                title="Restore this meeting back to active & recent sessions"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUnarchiveMeeting(meeting);
                                                                }}
                                                            >
                                                                <RotateCcw size={15} /> Restore
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 4: TRAININGS & CAMPS */}
                    {/* ========================================================= */}
                    {activeTab === 'trainings_camps' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            {/* 3-DAY CAMP SCHEDULE STUDIO (FRIDAY, SATURDAY, SUNDAY) */}
                            <CampScheduleStudio
                                api={api}
                                campus={campusFilter === 'All' ? userCampus : campusFilter}
                                cadres={cadres}
                                meetings={meetings}
                                showToast={showToast}
                            />

                            {/* CAMP READINESS & HARDWARE AUDIT CARDS */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                                        <Shield size={20} style={{ color: 'var(--color-accent-warm)' }} />
                                        <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>Equipment Readiness Check</h4>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                        {gearAssets.length > 0 
                                            ? `${gearAssets.length} hardware assets logged in inventory (${gearAssets.filter(a => a.status === 'Operational').length} Operational, ${gearAssets.filter(a => a.status === 'Needs Maintenance').length} In Maintenance).`
                                            : 'No gear assets registered yet in G8 asset database.'}
                                    </p>
                                    <span className={`g5-pill ${gearAssets.some(a => a.status === 'Needs Maintenance') ? 'g5-pill-recruit' : 'g5-pill-active'}`}>
                                        {gearAssets.length > 0 ? `${gearAssets.filter(a => a.status === 'Operational').length}/${gearAssets.length} Operational` : 'Database Standby'}
                                    </span>
                                </div>

                                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                                        <Award size={20} style={{ color: 'var(--color-status-active)' }} />
                                        <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>Belay Station Deployment</h4>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                        {campProgram?.dutyRoster?.length > 0
                                            ? `${campProgram.dutyRoster.length} duty stations configured in database (${campProgram.dutyRoster.filter(s => s.safetyCleared && s.primaryBelayer).length} staffed & safety-cleared).`
                                            : 'No camp duty stations configured yet in database.'}
                                    </p>
                                    <span className="g5-pill g5-pill-active">
                                        {campProgram?.dutyRoster?.length > 0 ? `${campProgram.dutyRoster.filter(s => s.safetyCleared && s.primaryBelayer).length} Stations Staffed` : 'Roster Standby'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 5: RECRUIT GRADUATIONS (EMOTIONAL HIGH POINT - WARM CARDS) */}
                    {/* ========================================================= */}
                    {activeTab === 'graduations' && (
                        <div>
                            {/* TAB 5 HEADER */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Recruit Graduations</h2>
                                        <span className="g5-pill g5-pill-recruit">
                                            🎓 {recruits.length} Active Candidates
                                        </span>
                                        {archivedRecruits.length > 0 && (
                                            <span className="g5-pill g5-pill-inactive">
                                                🗄️ {archivedRecruits.length} in 20-Day Archive
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                        Pick any number of recruits to graduate to Douloid rank simultaneously. Non-graduating recruits can be held in a 20-day grace archive (retained safely in the database).
                                    </p>
                                </div>
                            </div>

                            {/* SUB-TABS: ACTIVE RECRUITS vs 20-DAY ARCHIVED RECRUITS */}
                            <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'nowrap' }}>
                                <button
                                    type="button"
                                    onClick={() => setRecruitSubTab('active')}
                                    style={{
                                        background: recruitSubTab === 'active' ? 'var(--color-surface)' : 'transparent',
                                        color: recruitSubTab === 'active' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        border: recruitSubTab === 'active' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: '10px',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flexShrink: 0,
                                        boxShadow: recruitSubTab === 'active' ? '0 2px 8px rgba(107, 95, 168, 0.15)' : 'none',
                                        transition: 'all 0.18s ease'
                                    }}
                                >
                                    <Users size={17} /> Active Candidates ({recruits.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRecruitSubTab('archived')}
                                    style={{
                                        background: recruitSubTab === 'archived' ? 'var(--color-surface)' : 'transparent',
                                        color: recruitSubTab === 'archived' ? 'var(--color-accent-warm)' : 'var(--color-text-muted)',
                                        border: recruitSubTab === 'archived' ? '2px solid var(--color-accent-warm)' : '1px solid var(--color-border)',
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: '10px',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flexShrink: 0,
                                        boxShadow: recruitSubTab === 'archived' ? '0 2px 8px rgba(232, 163, 61, 0.15)' : 'none',
                                        transition: 'all 0.18s ease'
                                    }}
                                >
                                    <Archive size={17} /> 20-Day Archived Recruits ({archivedRecruits.length})
                                </button>
                            </div>

                            {/* ========================================================= */}
                            {/* SUB-TAB 1: ACTIVE CANDIDATES (MULTI-SELECT & QUICK PICK) */}
                            {/* ========================================================= */}
                            {recruitSubTab === 'active' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {/* SEARCH, FILTERS & QUICK PICK TOOLBAR */}
                                    <div className="g5-card" style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                                                <div style={{ position: 'relative', flex: 1 }}>
                                                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search recruit by name or admission number..."
                                                        value={recruitSearch}
                                                        onChange={(e) => setRecruitSearch(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                                                            borderRadius: '10px',
                                                            border: '1px solid var(--color-border)',
                                                            background: 'var(--color-page-bg)',
                                                            color: 'var(--color-text-main)',
                                                            fontSize: '0.88rem',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </div>
                                                <select
                                                    value={recruitCampusFilter}
                                                    onChange={(e) => setRecruitCampusFilter(e.target.value)}
                                                    style={{
                                                        padding: '0.65rem 1rem',
                                                        borderRadius: '10px',
                                                        border: '1px solid var(--color-border)',
                                                        background: 'var(--color-page-bg)',
                                                        color: 'var(--color-text-main)',
                                                        fontSize: '0.88rem',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    <option value="All">All Campuses</option>
                                                    <option value="Athi River">Athi River</option>
                                                    <option value="Valley Road">Valley Road</option>
                                                </select>
                                            </div>

                                            {/* QUICK COUNT PICKER */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                                    Pick Count:
                                                </span>
                                                {[5, 10, 15, 20].map(cnt => (
                                                    <button
                                                        key={cnt}
                                                        type="button"
                                                        onClick={() => handleQuickPick(cnt)}
                                                        style={{
                                                            padding: '0.4rem 0.75rem',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--color-border)',
                                                            background: 'var(--color-page-bg)',
                                                            color: 'var(--color-primary)',
                                                            fontWeight: 700,
                                                            fontSize: '0.82rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Top {cnt}
                                                    </button>
                                                ))}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={filteredRecruits.length}
                                                        placeholder="#"
                                                        value={quickPickCount}
                                                        onChange={(e) => setQuickPickCount(e.target.value)}
                                                        style={{
                                                            width: '60px',
                                                            padding: '0.4rem 0.5rem',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--color-border)',
                                                            background: 'var(--color-page-bg)',
                                                            color: 'var(--color-text-main)',
                                                            fontSize: '0.82rem',
                                                            fontWeight: 700,
                                                            textAlign: 'center'
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickPick(quickPickCount)}
                                                        disabled={!quickPickCount}
                                                        style={{
                                                            padding: '0.4rem 0.75rem',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--color-primary)',
                                                            background: 'var(--color-primary-soft)',
                                                            color: 'var(--color-primary)',
                                                            fontWeight: 700,
                                                            fontSize: '0.82rem',
                                                            cursor: quickPickCount ? 'pointer' : 'not-allowed',
                                                            opacity: quickPickCount ? 1 : 0.6
                                                        }}
                                                    >
                                                        Select
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllFilteredRecruits}
                                                    style={{
                                                        padding: '0.4rem 0.85rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--color-primary)',
                                                        background: 'var(--color-primary)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 700,
                                                        fontSize: '0.82rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {filteredRecruits.length > 0 && filteredRecruits.every(r => selectedRecruitIds.includes(r._id))
                                                        ? 'Deselect All'
                                                        : `Select All (${filteredRecruits.length})`}
                                                </button>
                                                {selectedRecruitIds.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedRecruitIds([])}
                                                        style={{
                                                            padding: '0.4rem 0.65rem',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--color-border)',
                                                            background: 'transparent',
                                                            color: 'var(--color-text-muted)',
                                                            fontWeight: 700,
                                                            fontSize: '0.82rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* BATCH ACTION BAR */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(107, 95, 168, 0.08), rgba(232, 163, 61, 0.08))',
                                        border: '1.5px solid var(--color-border)',
                                        borderRadius: '14px',
                                        padding: '1.15rem 1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                            <div style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '10px',
                                                backgroundColor: selectedRecruitIds.length > 0 ? 'var(--color-accent-warm)' : 'var(--color-border)',
                                                color: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '1.05rem'
                                            }}>
                                                {selectedRecruitIds.length}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    {selectedRecruitIds.length === 0
                                                        ? 'Select recruits above to graduate or archive'
                                                        : `${selectedRecruitIds.length} candidate(s) selected`}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                                    {recruits.length - selectedRecruitIds.length} candidate(s) unselected
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            {/* GRADUATE SELECTED BUTTON */}
                                            <button
                                                type="button"
                                                className="g5-btn-warm"
                                                onClick={handleBulkGraduate}
                                                disabled={selectedRecruitIds.length === 0 || isGraduatingRecruits}
                                                style={{
                                                    opacity: selectedRecruitIds.length === 0 || isGraduatingRecruits ? 0.6 : 1,
                                                    cursor: selectedRecruitIds.length === 0 || isGraduatingRecruits ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                <Sparkles size={18} />
                                                {isGraduatingRecruits
                                                    ? 'Graduating...'
                                                    : `Graduate ${selectedRecruitIds.length > 0 ? selectedRecruitIds.length : ''} to Douloid 🎉`}
                                            </button>

                                            {/* ARCHIVE NON-GRADUATED RECRUITS BUTTON (20 DAYS - SAFE IN DB) */}
                                            <button
                                                type="button"
                                                className="g5-btn-secondary"
                                                onClick={() => handleArchiveRecruits(selectedRecruitIds.length > 0 ? 'unselected' : 'all')}
                                                disabled={isArchivingRecruits || recruits.length === 0}
                                                style={{
                                                    opacity: isArchivingRecruits || recruits.length === 0 ? 0.6 : 1,
                                                    cursor: isArchivingRecruits || recruits.length === 0 ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                <Archive size={17} />
                                                {isArchivingRecruits
                                                    ? 'Archiving...'
                                                    : selectedRecruitIds.length > 0
                                                        ? `Archive Remaining (${recruits.length - selectedRecruitIds.length}) for 20 Days 🗄️`
                                                        : `Archive All Recruits (20 Days) 🗄️`}
                                            </button>

                                            {selectedRecruitIds.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="g5-btn-outline"
                                                    onClick={() => handleArchiveRecruits('selected')}
                                                    disabled={isArchivingRecruits}
                                                    style={{ fontSize: '0.82rem', padding: '0.65rem 0.9rem' }}
                                                >
                                                    Archive Selected ({selectedRecruitIds.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* CANDIDATES LIST / CARDS */}
                                    {filteredRecruits.length === 0 ? (
                                        <div className="g5-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                                            <div className="g5-avatar" style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', fontSize: '1.8rem' }}>
                                                🎓
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                {recruitSearch || recruitCampusFilter !== 'All' ? 'No Matching Recruits Found' : 'All Recruits Graduated or Archived!'}
                                            </h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '450px', margin: '0.5rem auto 0' }}>
                                                {recruitSearch || recruitCampusFilter !== 'All'
                                                    ? 'Try adjusting your search criteria or campus filter.'
                                                    : 'There are currently no active recruits pending graduation in the roster.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="g5-celebrate-grid">
                                            {filteredRecruits.map((recruit) => {
                                                const isSelected = selectedRecruitIds.includes(recruit._id);
                                                return (
                                                    <div
                                                        key={recruit._id}
                                                        className="g5-celebrate-card"
                                                        style={{
                                                            border: isSelected ? '2px solid var(--color-accent-warm)' : '1px solid var(--color-border)',
                                                            boxShadow: isSelected ? '0 4px 18px rgba(232, 163, 61, 0.22)' : 'var(--shadow-card)',
                                                            transition: 'all 0.18s ease'
                                                        }}
                                                    >
                                                        {/* SELECTION CHECKBOX PIN */}
                                                        <div
                                                            onClick={() => handleToggleRecruit(recruit._id)}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '1rem',
                                                                right: '1rem',
                                                                cursor: 'pointer',
                                                                zIndex: 3,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                background: isSelected ? 'var(--color-accent-warm)' : 'var(--color-page-bg)',
                                                                color: isSelected ? '#FFFFFF' : 'var(--color-text-muted)',
                                                                padding: '0.35rem 0.65rem',
                                                                borderRadius: '8px',
                                                                fontSize: '0.78rem',
                                                                fontWeight: 700,
                                                                border: isSelected ? '1px solid var(--color-accent-warm)' : '1px solid var(--color-border)'
                                                            }}
                                                        >
                                                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                                            <span>{isSelected ? 'Selected' : 'Pick'}</span>
                                                        </div>

                                                        {/* RECRUIT IDENTITY */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
                                                            <div className="g5-avatar" style={{ width: '52px', height: '52px', fontSize: '1.25rem', backgroundColor: isSelected ? 'var(--color-accent-warm)' : undefined }}>
                                                                {recruit.name.charAt(0)}
                                                            </div>
                                                            <div style={{ maxWidth: '65%' }}>
                                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {recruit.name}
                                                                </h3>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '0.15rem' }}>
                                                                    {recruit.studentRegNo} • {recruit.campus}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* READINESS & ATTENDANCE SUMMARY */}
                                                        <div style={{ background: 'var(--color-page-bg)', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.25rem', border: '1px solid var(--color-border)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
                                                                <span>Attendance Points</span>
                                                                <span style={{ color: (recruit.totalPoints || 0) >= 30 ? 'var(--color-status-active)' : 'var(--color-accent-warm)' }}>
                                                                    {recruit.totalPoints || 0} pts
                                                                </span>
                                                            </div>
                                                            <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    width: `${Math.min(100, Math.max(15, ((recruit.totalPoints || 0) / 40) * 100))}%`,
                                                                    height: '100%',
                                                                    background: 'linear-gradient(90deg, #E8A33D, #4CAF7D)'
                                                                }} />
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>
                                                                <span>Status: Active Recruit</span>
                                                                <span>Attended: {recruit.totalAttended || 0} sessions</span>
                                                            </div>
                                                        </div>

                                                        {/* ACTION BUTTONS */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.65rem' }}>
                                                            <button
                                                                type="button"
                                                                className="g5-btn-warm"
                                                                style={{ justifyContent: 'center', padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                                                                onClick={() => handleGraduateSingle(recruit)}
                                                            >
                                                                <Sparkles size={16} /> Graduate 🎉
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="g5-btn-outline"
                                                                title="Archive for 20-day grace period (preserved safely in database)"
                                                                style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                                                                onClick={() => handleArchiveSingle(recruit)}
                                                            >
                                                                <Archive size={16} /> Archive 20d
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* SUB-TAB 2: 20-DAY ARCHIVED RECRUITS (GRACE PERIOD RADAR) */}
                            {/* ========================================================= */}
                            {recruitSubTab === 'archived' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {/* 20-DAY SAFE HARBOR INFO BANNER */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(232, 163, 61, 0.09), rgba(107, 95, 168, 0.08))',
                                        border: '1.5px solid rgba(232, 163, 61, 0.35)',
                                        borderRadius: '14px',
                                        padding: '1.25rem 1.5rem',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1rem'
                                    }}>
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '10px',
                                            backgroundColor: 'var(--color-accent-warm-soft)',
                                            color: 'var(--color-accent-warm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Archive size={22} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                                                    20-Day Grace Archive Active
                                                </h3>
                                                <span className="g5-pill g5-pill-active" style={{ fontSize: '0.72rem' }}>
                                                    🔒 Preserved Safely in MongoDB
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                                                Recruits who do not graduate are <strong>never deleted from the database</strong>. They are held in the system for exactly <strong>20 days</strong>. During this window, you can restore any recruit back to Active with 1 click. After 20 days, the holding archive status automatically concludes in the system.
                                            </p>
                                        </div>
                                    </div>

                                    {/* ARCHIVED RECRUITS LIST */}
                                    {filteredArchivedRecruits.length === 0 ? (
                                        <div className="g5-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                                            <div className="g5-avatar" style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', fontSize: '1.8rem', backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                                                🗄️
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                No Recruits Currently in 20-Day Grace Archive
                                            </h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0.5rem auto 0' }}>
                                                Non-graduated recruits placed into holding will appear here with a 20-day countdown before the archive period concludes.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="g5-celebrate-grid">
                                            {filteredArchivedRecruits.map((recruit) => {
                                                const daysLeft = getDaysRemaining(recruit.archivedUntil);
                                                const daysPassed = Math.min(20, Math.max(0, 20 - daysLeft));
                                                const progressPct = Math.round((daysPassed / 20) * 100);

                                                return (
                                                    <div key={recruit._id} className="g5-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                                    <div className="g5-avatar" style={{ width: '48px', height: '48px', fontSize: '1.15rem' }}>
                                                                        {recruit.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                                                                            {recruit.name}
                                                                        </h4>
                                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                                                            {recruit.studentRegNo} • {recruit.campus}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <span className="g5-pill g5-pill-inactive" style={{ fontSize: '0.74rem' }}>
                                                                    Archived
                                                                </span>
                                                            </div>

                                                            {/* 20-DAY COUNTDOWN PROGRESS */}
                                                            <div style={{ background: 'var(--color-page-bg)', borderRadius: '12px', padding: '0.9rem', marginBottom: '1.25rem', border: '1px solid var(--color-border)' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                                                                    <span style={{ color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                        <Clock size={14} /> Grace Period
                                                                    </span>
                                                                    <span style={{ color: daysLeft <= 5 ? '#EF4444' : 'var(--color-accent-warm)', fontWeight: 800 }}>
                                                                        ⏳ {daysLeft} Day{daysLeft !== 1 ? 's' : ''} Remaining
                                                                    </span>
                                                                </div>
                                                                <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                                                                    <div style={{
                                                                        width: `${progressPct}%`,
                                                                        height: '100%',
                                                                        background: daysLeft <= 5 ? '#EF4444' : 'linear-gradient(90deg, #6B5FA8, #E8A33D)'
                                                                    }} />
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>
                                                                    <span>Archived: {recruit.archivedAt ? new Date(recruit.archivedAt).toLocaleDateString() : 'Active'}</span>
                                                                    <span>Expires: {recruit.archivedUntil ? new Date(recruit.archivedUntil).toLocaleDateString() : 'In 20 Days'}</span>
                                                                </div>
                                                            </div>

                                                            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <CheckCircle2 size={14} style={{ color: 'var(--color-status-active)' }} />
                                                                <span>Retained in database · Reason: {recruit.archiveReason || 'Cohort not graduated'}</span>
                                                            </div>
                                                        </div>

                                                        {/* RESTORE BUTTON */}
                                                        <button
                                                            type="button"
                                                            className="g5-btn-secondary"
                                                            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                                                            onClick={() => handleUnarchiveRecruit(recruit)}
                                                        >
                                                            <RotateCcw size={16} /> Restore to Active Recruit
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 6: RANK PROMOTIONS (BATCH PROMOTION STUDIO & 5-DOMAIN EVALUATION) */}
                    {/* ========================================================= */}
                    {activeTab === 'promotions' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* HEADER & RANK LADDER OVERVIEW */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Douloid Rank Promotions</h2>
                                        <span className="g5-pill g5-pill-purple">
                                            <Award size={14} /> {cadres.length} Active Douloids
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                        Promote individual students or select multiple candidates for batch rank advancement.
                                    </p>
                                </div>
                            </div>

                            {/* RANK LADDER FILTER CHIPS */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {[
                                    { id: 'All', label: 'All Douloids', count: cadres.length, color: '#6B5FA8' },
                                    { id: 'Unranked', label: 'Unranked / Recruits', count: cadres.filter(c => !c.douloidRank || c.douloidRank === 'None').length, color: '#6B7280' },
                                    { id: 'Shadow Douloid', label: 'Shadow Douloids', count: cadres.filter(c => c.douloidRank === 'Shadow Douloid').length, color: '#7E22CE' },
                                    { id: 'Basic Douloid', label: 'Basic Douloids', count: cadres.filter(c => c.douloidRank === 'Basic Douloid').length, color: '#4F46E5' },
                                    { id: 'Intermediate Douloid', label: 'Intermediate Douloids', count: cadres.filter(c => c.douloidRank === 'Intermediate Douloid').length, color: '#0284C7' },
                                    { id: 'Lead Douloid', label: 'Lead Douloids', count: cadres.filter(c => c.douloidRank === 'Lead Douloid').length, color: '#D97706' },
                                    { id: 'Senior Lead Douloid', label: 'Senior Leads', count: cadres.filter(c => c.douloidRank === 'Senior Lead Douloid').length, color: '#B45309' }
                                ].map(chip => (
                                    <button
                                        key={chip.id}
                                        type="button"
                                        onClick={() => setPromotionRankFilter(chip.id)}
                                        style={{
                                            padding: '0.45rem 0.9rem',
                                            borderRadius: '999px',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            border: promotionRankFilter === chip.id ? `2px solid ${chip.color}` : '1px solid var(--color-border)',
                                            background: promotionRankFilter === chip.id ? 'var(--color-surface)' : 'var(--color-page-bg)',
                                            color: promotionRankFilter === chip.id ? chip.color : 'var(--color-text-main)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.45rem',
                                            boxShadow: promotionRankFilter === chip.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <span>{chip.label}</span>
                                        <span style={{
                                            background: promotionRankFilter === chip.id ? chip.color : 'rgba(0,0,0,0.06)',
                                            color: promotionRankFilter === chip.id ? '#FFFFFF' : 'var(--color-text-muted)',
                                            padding: '0.1rem 0.45rem',
                                            borderRadius: '999px',
                                            fontSize: '0.74rem'
                                        }}>
                                            {chip.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* SEARCH & CONTROLS TOOLBAR */}
                            <div className="g5-card" style={{ padding: '0.85rem 1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
                                    <div style={{ display: 'flex', gap: '0.85rem', flex: 1, minWidth: '280px', alignItems: 'center' }}>
                                        <div className="g5-search-wrap" style={{ flex: 1, height: '40px' }}>
                                            <Search size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search student name or admission number..."
                                                value={promotionSearch}
                                                onChange={(e) => setPromotionSearch(e.target.value)}
                                                className="g5-search-input"
                                                style={{ fontSize: '0.85rem' }}
                                            />
                                        </div>

                                        <select
                                            className="g5-form-input"
                                            style={{ width: '160px', height: '40px', padding: '0 0.75rem', fontSize: '0.85rem' }}
                                            value={promotionCampusFilter}
                                            onChange={(e) => setPromotionCampusFilter(e.target.value)}
                                        >
                                            <option value="All">All Campuses</option>
                                            <option value="Athi River">Athi River</option>
                                            <option value="Valley Road">Valley Road</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <button
                                            type="button"
                                            className="g5-btn-secondary"
                                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                                            onClick={() => {
                                                if (selectedCadres.length === filteredCadres.length) {
                                                    setSelectedCadres([]);
                                                } else {
                                                    setSelectedCadres(filteredCadres.map(c => c._id));
                                                }
                                            }}
                                        >
                                            {selectedCadres.length === filteredCadres.length && filteredCadres.length > 0 
                                                ? 'Deselect All' 
                                                : `Select All (${filteredCadres.length})`}
                                        </button>

                                        {selectedCadres.length > 0 && (
                                            <button
                                                type="button"
                                                className="g5-btn-outline"
                                                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                                                onClick={() => setSelectedCadres([])}
                                            >
                                                Clear ({selectedCadres.length})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* BATCH PROMOTION ACTION BAR (STICKY WHEN 1 OR MORE CADRES SELECTED) */}
                            {selectedCadres.length > 0 && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                                    color: '#FFFFFF',
                                    padding: '1.25rem 1.5rem',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '1rem',
                                    boxShadow: '0 10px 30px rgba(49, 46, 129, 0.25)',
                                    border: '1.5px solid #4338CA'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                        <div style={{
                                            background: '#4F46E5',
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#FFFFFF'
                                        }}>
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.2px' }}>
                                                {selectedCadres.length} Student{selectedCadres.length > 1 ? 's' : ''} Selected for Batch Promotion
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#C7D2FE', marginTop: '0.15rem' }}>
                                                Assign target rank, belay certification, and safety station clearances simultaneously.
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {/* Target Rank Picker */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C7D2FE', textTransform: 'uppercase' }}>Target Rank</label>
                                            <select
                                                value={batchRank}
                                                onChange={(e) => {
                                                    const r = e.target.value;
                                                    setBatchRank(r);
                                                    if (r === 'Shadow Douloid' || r === 'None') {
                                                        setBatchBelayStatus('Not Permitted');
                                                        setBatchSoloAllowed(false);
                                                    }
                                                }}
                                                style={{
                                                    background: '#FFFFFF',
                                                    color: '#1E1B4B',
                                                    border: 'none',
                                                    padding: '0.5rem 0.85rem',
                                                    borderRadius: '8px',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <option value="Shadow Douloid">Shadow Douloid</option>
                                                <option value="Basic Douloid">Basic Douloid</option>
                                                <option value="Intermediate Douloid">Intermediate Douloid</option>
                                                <option value="Lead Douloid">Lead Douloid</option>
                                                <option value="Senior Lead Douloid">Senior Lead Douloid</option>
                                            </select>
                                        </div>

                                        {/* Belay Clearance Picker */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C7D2FE', textTransform: 'uppercase' }}>Belay Clearance</label>
                                            <select
                                                value={batchBelayStatus}
                                                onChange={(e) => setBatchBelayStatus(e.target.value)}
                                                disabled={batchRank === 'Shadow Douloid' || batchRank === 'None'}
                                                style={{
                                                    background: '#FFFFFF',
                                                    color: '#1E1B4B',
                                                    border: 'none',
                                                    padding: '0.5rem 0.85rem',
                                                    borderRadius: '8px',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    opacity: (batchRank === 'Shadow Douloid' || batchRank === 'None') ? 0.6 : 1
                                                }}
                                            >
                                                <option value="Not Permitted">Not Permitted</option>
                                                <option value="Secondary Belayer">Secondary Belayer</option>
                                                <option value="Primary Belayer Certified">Primary Belayer Certified</option>
                                            </select>
                                        </div>

                                        {/* Solo Station Checkbox */}
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.45rem',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            cursor: (batchRank === 'Shadow Douloid' || batchRank === 'None') ? 'not-allowed' : 'pointer',
                                            opacity: (batchRank === 'Shadow Douloid' || batchRank === 'None') ? 0.5 : 1,
                                            marginTop: '1rem'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={batchSoloAllowed}
                                                disabled={batchRank === 'Shadow Douloid' || batchRank === 'None'}
                                                onChange={(e) => setBatchSoloAllowed(e.target.checked)}
                                                style={{ width: '16px', height: '16px', accentColor: '#E8A33D' }}
                                            />
                                            Solo Station
                                        </label>

                                        {/* Batch Promote Button */}
                                        <button
                                            type="button"
                                            className="g5-btn-warm"
                                            style={{
                                                padding: '0.55rem 1.25rem',
                                                fontSize: '0.88rem',
                                                marginTop: '0.8rem',
                                                boxShadow: '0 4px 14px rgba(232, 163, 61, 0.4)'
                                            }}
                                            disabled={batchSubmitting}
                                            onClick={handleBatchPromote}
                                        >
                                            {batchSubmitting ? (
                                                <>
                                                    <RefreshCw size={15} className="g5-spin" /> Promoting...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} /> Promote {selectedCadres.length} Selected to {batchRank}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CADRES PROMOTION ROSTER TABLE */}
                            <div className="g5-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="g5-table-wrap">
                                    <table className="g5-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px', textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={filteredCadres.length > 0 && selectedCadres.length === filteredCadres.length}
                                                        onChange={() => {
                                                            if (selectedCadres.length === filteredCadres.length) {
                                                                setSelectedCadres([]);
                                                            } else {
                                                                setSelectedCadres(filteredCadres.map(c => c._id));
                                                            }
                                                        }}
                                                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                                                    />
                                                </th>
                                                <th>Student Name</th>
                                                <th>Campus</th>
                                                <th>Current Rank</th>
                                                <th>Next Rank Step</th>
                                                <th>Belay & Clearances</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCadres.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                                                        <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>No Douloids match your filters</div>
                                                        <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Try clearing your search query or selecting "All Douloids".</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredCadres.map((cadre) => {
                                                    const currentRank = cadre.douloidRank || 'None';
                                                    const nextRank = getNextRank(currentRank);
                                                    const currentColor = getRankColor(currentRank);
                                                    const nextColor = getRankColor(nextRank);
                                                    const isSelected = selectedCadres.includes(cadre._id);

                                                    return (
                                                        <tr 
                                                            key={cadre._id}
                                                            style={{
                                                                backgroundColor: isSelected ? 'rgba(107, 95, 168, 0.05)' : 'transparent',
                                                                transition: 'background-color 0.15s ease'
                                                            }}
                                                        >
                                                            <td style={{ textAlign: 'center' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        setSelectedCadres(prev => 
                                                                            prev.includes(cadre._id) ? prev.filter(id => id !== cadre._id) : [...prev, cadre._id]
                                                                        );
                                                                    }}
                                                                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                                    <div className="g5-avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>
                                                                        {cadre.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.92rem' }}>
                                                                            {cadre.name}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                            {cadre.studentRegNo || 'No Reg No'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                                {cadre.campus}
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    background: currentColor.bg,
                                                                    color: currentColor.text,
                                                                    border: `1px solid ${currentColor.border}`,
                                                                    padding: '0.3rem 0.75rem',
                                                                    borderRadius: '999px',
                                                                    fontWeight: 800,
                                                                    fontSize: '0.78rem'
                                                                }}>
                                                                    {currentRank}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                                    <ArrowUpRight size={15} style={{ color: 'var(--color-accent-warm)' }} />
                                                                    <span style={{
                                                                        background: nextColor.bg,
                                                                        color: nextColor.text,
                                                                        border: `1px solid ${nextColor.border}`,
                                                                        padding: '0.25rem 0.65rem',
                                                                        borderRadius: '999px',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.76rem'
                                                                    }}>
                                                                        {nextRank}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                                    <span style={{ fontSize: '0.76rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                                                                        {cadre.belayStatus || 'Not Permitted'}
                                                                    </span>
                                                                    {cadre.soloStationAllowed && (
                                                                        <span style={{ fontSize: '0.72rem', color: 'var(--color-status-active)', fontWeight: 700 }}>
                                                                            ✓ Solo Station Cleared
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-secondary"
                                                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                                                                        onClick={() => {
                                                                            setEvaluatingCadre(cadre);
                                                                            if (!promotionScores[cadre._id]) {
                                                                                setPromotionScores(prev => ({
                                                                                    ...prev,
                                                                                    [cadre._id]: { team: 4, ropes: 4, base: 4, rescue: 4, firstAid: 4 }
                                                                                }));
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Sliders size={13} /> 5-Domain Evaluation
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-warm"
                                                                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                                                                        onClick={() => handleConfirmPromotion(cadre, nextRank)}
                                                                    >
                                                                        <Award size={13} /> Promote to {nextRank}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 5-DOMAIN EVALUATION MODAL */}
                            {evaluatingCadre && (() => {
                                const cadre = evaluatingCadre;
                                const currentRank = cadre.douloidRank || 'None';
                                const nextRank = getNextRank(currentRank);
                                const scores = promotionScores[cadre._id] || { team: 4, ropes: 4, base: 4, rescue: 4, firstAid: 4 };
                                const avgScore = (Object.values(scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);

                                const updateScore = (domain, val) => {
                                    setPromotionScores(prev => ({
                                        ...prev,
                                        [cadre._id]: {
                                            ...(prev[cadre._id] || { team: 4, ropes: 4, base: 4, rescue: 4, firstAid: 4 }),
                                            [domain]: Number(val)
                                        }
                                    }));
                                };

                                return (
                                    <div style={{
                                        position: 'fixed',
                                        inset: 0,
                                        backgroundColor: 'rgba(30, 27, 75, 0.65)',
                                        backdropFilter: 'blur(6px)',
                                        zIndex: 9999,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '1.5rem'
                                    }}>
                                        <div style={{
                                            background: '#FFFFFF',
                                            borderRadius: '24px',
                                            maxWidth: '560px',
                                            width: '100%',
                                            maxHeight: '90vh',
                                            overflowY: 'auto',
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                            border: '1px solid var(--color-border)',
                                            padding: '2rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                    <div className="g5-avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                                                        {cadre.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                            {cadre.name}
                                                        </h3>
                                                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                            {cadre.studentRegNo} • {cadre.campus}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setEvaluatingCadre(null)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* Current Rank vs Next Rank Progression Pill */}
                                            <div style={{
                                                background: 'var(--color-page-bg)',
                                                borderRadius: '14px',
                                                padding: '0.85rem 1.25rem',
                                                marginBottom: '1.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                border: '1px solid var(--color-border)'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>CURRENT RANK</div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.15rem' }}>
                                                        {currentRank}
                                                    </div>
                                                </div>
                                                <ArrowUpRight size={20} style={{ color: 'var(--color-accent-warm)' }} />
                                                <div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>TARGET PROMOTION</div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)', marginTop: '0.15rem' }}>
                                                        {nextRank}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>AVG SCORE</div>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-accent-warm)', marginTop: '0.15rem' }}>
                                                        {avgScore}★
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 5-Domain Competency Sliders */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    5-Domain Competency Scoring (1 to 5 Stars)
                                                </div>

                                                {[
                                                    { key: 'team', label: 'Team Building Debriefs', desc: 'Group dynamics, spiritual discipleship, debrief synthesis' },
                                                    { key: 'ropes', label: 'High Ropes & Dynamic Belaying', desc: 'Hardware rigging, carabiner squeeze, double-check commands' },
                                                    { key: 'base', label: 'Freedom Base Hardware Audits', desc: 'Helmet inspection, dynamic rope life cycle, anchor security' },
                                                    { key: 'rescue', label: 'Ridge Rescue & Fall Arrest', desc: 'Spine board extrication, litter extraction, descent control' },
                                                    { key: 'firstAid', label: 'Wilderness Triage & First Aid', desc: 'Wilderness incident management, trauma response, hydration' }
                                                ].map(domain => (
                                                    <div key={domain.key} style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                                                {domain.label}
                                                            </span>
                                                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-accent-warm)' }}>
                                                                {scores[domain.key]}★
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem' }}>
                                                            {domain.desc}
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="5"
                                                            value={scores[domain.key]}
                                                            onChange={(e) => updateScore(domain.key, e.target.value)}
                                                            style={{ width: '100%', accentColor: 'var(--color-accent-warm)' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    className="g5-btn-secondary"
                                                    onClick={() => setEvaluatingCadre(null)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="g5-btn-warm"
                                                    onClick={async () => {
                                                        await handleConfirmPromotion(cadre, nextRank);
                                                        setEvaluatingCadre(null);
                                                    }}
                                                >
                                                    <Award size={16} /> Confirm Promotion to {nextRank}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 7: MEMBERSHIP ROSTER & EXPORT STUDIO */}
                    {/* ========================================================= */}
                    {activeTab === 'cadres' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* TOP HEADER & SUB-TAB NAVIGATION */}
                            <div className="g5-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                                                Membership Roster & Export Studio
                                            </h2>
                                            <span className="g5-pill g5-pill-purple">
                                                <Users size={14} /> {activeMembers.length} Total Enlisted
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
                                            Official personnel ledger for Douloid members and recruits. Filter by rank hierarchy, campus, or safety certifications, and generate official Daystar PDF documents or CSV spreadsheets.
                                        </p>
                                    </div>

                                    {/* SUB-TAB TOGGLES */}
                                    <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-page-bg)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <button
                                            type="button"
                                            className={rosterSubTab === 'directory' ? 'g5-btn-primary' : 'g5-btn-secondary'}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            onClick={() => setRosterSubTab('directory')}
                                        >
                                            <Users size={16} /> Personnel Directory ({filteredRosterMembers.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={rosterSubTab === 'export_studio' ? 'g5-btn-primary' : 'g5-btn-secondary'}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            onClick={() => setRosterSubTab('export_studio')}
                                        >
                                            <Download size={16} /> Export & PDF Studio
                                        </button>
                                    </div>
                                </div>

                                {/* QUICK STAT STRIP */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                                    <div style={{ background: 'var(--color-page-bg)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Douloid Members</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                                            {activeMembers.filter(m => m.memberType !== 'Recruit' && m.status !== 'Recruit').length}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Shadow through Senior Lead</div>
                                    </div>

                                    <div style={{ background: 'var(--color-page-bg)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Recruits Pipeline</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent-warm)', marginTop: '0.2rem' }}>
                                            {activeMembers.filter(m => m.memberType === 'Recruit' || m.status === 'Recruit').length}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>In-training candidates</div>
                                    </div>

                                    <div style={{ background: 'var(--color-page-bg)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Certified Belayers</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-status-active)', marginTop: '0.2rem' }}>
                                            {activeMembers.filter(m => {
                                                const { belay } = getMemberDetails(m);
                                                return belay === 'Primary Belayer Certified' || belay === 'Belayer Qualified';
                                            }).length}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>High ropes safety cleared</div>
                                    </div>

                                    <div style={{ background: 'var(--color-page-bg)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Filtered Output</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                                            {filteredRosterMembers.length}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Ready for print / export</div>
                                    </div>
                                </div>
                            </div>

                            {/* ===================================================== */}
                            {/* SUB-TAB 1: LIVE DIRECTORY */}
                            {/* ===================================================== */}
                            {rosterSubTab === 'directory' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {/* CONTROLS & FILTER TOOLBAR */}
                                    <div className="g5-card" style={{ padding: '1rem 1.25rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                            {/* Top Row: Search & Filters */}
                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <div className="g5-search-wrap" style={{ flex: '1 1 240px', height: '42px' }}>
                                                    <Search size={16} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search member name, admission no, or phone..."
                                                        value={rosterSearch}
                                                        onChange={(e) => setRosterSearch(e.target.value)}
                                                        className="g5-search-input"
                                                        style={{ fontSize: '0.85rem' }}
                                                    />
                                                    {rosterSearch && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRosterSearch('')}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Role Filter */}
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '160px', height: '42px', fontSize: '0.85rem' }}
                                                    value={rosterRoleFilter}
                                                    onChange={(e) => setRosterRoleFilter(e.target.value)}
                                                >
                                                    <option value="All">All Roles</option>
                                                    <option value="Douloid">Douloids Only</option>
                                                    <option value="Recruit">Recruits Only</option>
                                                </select>

                                                {/* Rank Filter */}
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '190px', height: '42px', fontSize: '0.85rem' }}
                                                    value={rosterRankFilter}
                                                    onChange={(e) => setRosterRankFilter(e.target.value)}
                                                >
                                                    <option value="All">All Ranks</option>
                                                    <option value="Senior Lead Douloid">Senior Lead Douloid</option>
                                                    <option value="Lead Douloid">Lead Douloid</option>
                                                    <option value="Intermediate Douloid">Intermediate Douloid</option>
                                                    <option value="Basic Douloid">Basic Douloid</option>
                                                    <option value="Shadow Douloid">Shadow Douloid</option>
                                                    <option value="Recruit Candidate">Recruit Candidate</option>
                                                </select>

                                                {/* Campus Filter */}
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '150px', height: '42px', fontSize: '0.85rem' }}
                                                    value={rosterCampusFilter}
                                                    onChange={(e) => setRosterCampusFilter(e.target.value)}
                                                >
                                                    <option value="All">All Campuses</option>
                                                    <option value="Athi River">Athi River</option>
                                                    <option value="Valley Road">Valley Road</option>
                                                </select>

                                                {/* Belay Clearance Filter */}
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '190px', height: '42px', fontSize: '0.85rem' }}
                                                    value={rosterBelayFilter}
                                                    onChange={(e) => setRosterBelayFilter(e.target.value)}
                                                >
                                                    <option value="All">All Belay Clearances</option>
                                                    <option value="Primary Belayer Certified">Primary Belayer Certified</option>
                                                    <option value="Belayer Qualified">Belayer Qualified</option>
                                                    <option value="Not Permitted">Not Permitted</option>
                                                </select>
                                            </div>

                                            {/* Bottom Row: Match Counter & Action Buttons */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                        Showing <strong style={{ color: 'var(--color-text-main)' }}>{filteredRosterMembers.length}</strong> of {activeMembers.length} personnel
                                                    </span>
                                                    {(rosterSearch || rosterRoleFilter !== 'All' || rosterRankFilter !== 'All' || rosterCampusFilter !== 'All' || rosterBelayFilter !== 'All') && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRosterSearch('');
                                                                setRosterRoleFilter('All');
                                                                setRosterRankFilter('All');
                                                                setRosterCampusFilter('All');
                                                                setRosterBelayFilter('All');
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'var(--color-primary)',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 700,
                                                                textDecoration: 'underline'
                                                            }}
                                                        >
                                                            Reset Filters
                                                        </button>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-warm"
                                                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                                                        onClick={() => handleDownloadRosterPDF(filteredRosterMembers)}
                                                    >
                                                        <Printer size={15} /> Download PDF ({filteredRosterMembers.length})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-secondary"
                                                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                                                        onClick={() => handleExportRosterCSV(filteredRosterMembers, `${rosterRoleFilter}_${rosterRankFilter}`)}
                                                    >
                                                        <Download size={15} /> Export CSV ({filteredRosterMembers.length})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-outline"
                                                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                                                        onClick={() => setRosterSubTab('export_studio')}
                                                    >
                                                        <FileText size={15} /> Export Studio & Presets <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DIRECTORY TABLE */}
                                    <div className="g5-card" style={{ padding: 0, overflow: 'hidden' }}>
                                        <div className="g5-table-wrap">
                                            <table className="g5-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                                                        <th>Member</th>
                                                        <th>Role</th>
                                                        <th>Rank Hierarchy</th>
                                                        <th>Campus</th>
                                                        <th>Belay Clearance</th>
                                                        <th>Solo Station</th>
                                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRosterMembers.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-muted)' }}>
                                                                <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                                                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
                                                                    No personnel match the selected filters
                                                                </div>
                                                                <div style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                                                                    Try broadening your search query or reset the role and rank filters.
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="g5-btn-secondary"
                                                                    style={{ marginTop: '1rem', display: 'inline-flex' }}
                                                                    onClick={() => {
                                                                        setRosterSearch('');
                                                                        setRosterRoleFilter('All');
                                                                        setRosterRankFilter('All');
                                                                        setRosterCampusFilter('All');
                                                                        setRosterBelayFilter('All');
                                                                    }}
                                                                >
                                                                    Reset All Filters
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredRosterMembers.map((member, index) => {
                                                            const { isRecruit, rank, belay, solo } = getMemberDetails(member);
                                                            const rankColor = getRankColor(rank);

                                                            return (
                                                                <tr key={member._id}>
                                                                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                                        {index + 1}
                                                                    </td>
                                                                    <td>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                                            <div className="g5-avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>
                                                                                {(member.name || 'M').charAt(0)}
                                                                            </div>
                                                                            <div>
                                                                                <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                                                                                    {member.name}
                                                                                </div>
                                                                                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                                                                    {member.studentRegNo || 'No Admission No'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`g5-pill ${isRecruit ? 'g5-pill-recruit' : 'g5-pill-purple'}`}>
                                                                            {isRecruit ? 'Recruit' : 'Douloid'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span style={{
                                                                            background: rankColor.bg,
                                                                            color: rankColor.text,
                                                                            border: `1px solid ${rankColor.border}`,
                                                                            padding: '0.25rem 0.75rem',
                                                                            borderRadius: '999px',
                                                                            fontWeight: 800,
                                                                            fontSize: '0.76rem',
                                                                            display: 'inline-block'
                                                                        }}>
                                                                            {rank}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                                        {member.campus || 'Athi River'}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`g5-pill ${belay === 'Primary Belayer Certified' ? 'g5-pill-active' : belay === 'Belayer Qualified' ? 'g5-pill-blue' : 'g5-pill-recruit'}`}>
                                                                            <Shield size={13} /> {belay}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {solo ? (
                                                                            <span style={{ color: 'var(--color-status-active)', fontWeight: 700, fontSize: '0.82rem' }}>
                                                                                ✓ Authorized
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                                                                                Tandem Only
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ textAlign: 'right' }}>
                                                                        <button
                                                                            type="button"
                                                                            className="g5-btn-secondary"
                                                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                                                            onClick={() => {
                                                                                if (isRecruit) {
                                                                                    setActiveTab('graduations');
                                                                                } else {
                                                                                    setActiveTab('promotions');
                                                                                }
                                                                            }}
                                                                        >
                                                                            {isRecruit ? 'Graduation' : 'Evaluate Rank'}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===================================================== */}
                            {/* SUB-TAB 2: EXPORT & PDF STUDIO */}
                            {/* ===================================================== */}
                            {rosterSubTab === 'export_studio' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* PRESET EXPORT BUNDLES */}
                                    <div className="g5-card" style={{ padding: '1.5rem' }}>
                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                                                    1-Click Preset Export Bundles
                                                </h3>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                                                Standardized administrative reports formatted with Daystar University Doulos Ministry letterhead, Freedom Base coordinates, and signature lines.
                                            </p>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                            {/* Preset 1: Full Ministry */}
                                            <div style={{ background: 'var(--color-page-bg)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>Full Ministry Roster</span>
                                                        <span className="g5-pill g5-pill-purple">{activeMembers.length} Enlisted</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', marginBottom: 0 }}>
                                                        Complete roster containing all active Douloids and recruits across both campuses with full safety clearances.
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-warm"
                                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                                                        onClick={() => handleDownloadRosterPDF(activeMembers, 'DAYSTAR DOULOS FULL MINISTRY ROSTER')}
                                                    >
                                                        <Printer size={15} /> Print PDF
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-secondary"
                                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                                                        onClick={() => handleExportRosterCSV(activeMembers, 'full_ministry_all')}
                                                    >
                                                        <Download size={15} /> Export CSV
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Preset 2: Douloids by Rank */}
                                            <div style={{ background: 'var(--color-page-bg)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>Douloids by Rank</span>
                                                        <span className="g5-pill g5-pill-purple">
                                                            {activeMembers.filter(m => m.memberType !== 'Recruit' && m.status !== 'Recruit').length} Douloids
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', marginBottom: 0 }}>
                                                        All active Douloid members grouped by rank ladder from Shadow Douloid up to Senior Lead Douloid.
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-warm"
                                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                                                        onClick={() => handleDownloadRosterPDF(activeMembers.filter(m => m.memberType !== 'Recruit' && m.status !== 'Recruit'), 'DOULOID MEMBERS RANK & CLEARANCE ROSTER')}
                                                    >
                                                        <Printer size={15} /> Print PDF
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-secondary"
                                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                                                        onClick={() => handleExportRosterCSV(activeMembers.filter(m => m.memberType !== 'Recruit' && m.status !== 'Recruit'), 'douloids_only')}
                                                    >
                                                        <Download size={15} /> Export CSV
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Preset 3: Recruits Pipeline */}
                                            <div style={{ background: 'var(--color-page-bg)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>Recruits Pipeline Cohort</span>
                                                        <span className="g5-pill g5-pill-recruit">
                                                            {activeMembers.filter(m => m.memberType === 'Recruit' || m.status === 'Recruit').length} Recruits
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', marginBottom: 0 }}>
                                                        Active recruit candidate cohort across Athi River and Valley Road in training for qualification camp.
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-warm"
                                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                                                        onClick={() => handleDownloadRosterPDF(activeMembers.filter(m => m.memberType === 'Recruit' || m.status === 'Recruit'), 'ACTIVE RECRUITS PIPELINE COHORT')}
                                                    >
                                                        <Printer size={15} /> Print PDF
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-secondary"
                                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                                                        onClick={() => handleExportRosterCSV(activeMembers.filter(m => m.memberType === 'Recruit' || m.status === 'Recruit'), 'recruits_pipeline')}
                                                    >
                                                        <Download size={15} /> Export CSV
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Preset 4: Safety Belayers */}
                                            <div style={{ background: 'var(--color-page-bg)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>Safety-Cleared Belayers</span>
                                                        <span className="g5-pill g5-pill-active">
                                                            {activeMembers.filter(m => {
                                                                const { belay } = getMemberDetails(m);
                                                                return belay === 'Primary Belayer Certified' || belay === 'Belayer Qualified';
                                                            }).length} Belayers
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', marginBottom: 0 }}>
                                                        Personnel certified and qualified for high-ropes, zip lines, and solo station operation.
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-warm"
                                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                                                        onClick={() => handleDownloadRosterPDF(
                                                            activeMembers.filter(m => {
                                                                const { belay } = getMemberDetails(m);
                                                                return belay === 'Primary Belayer Certified' || belay === 'Belayer Qualified';
                                                            }),
                                                            'SAFETY-CLEARED BELAYERS & RIGGERS DIRECTORY'
                                                        )}
                                                    >
                                                        <Printer size={15} /> Print PDF
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-secondary"
                                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                                                        onClick={() => handleExportRosterCSV(
                                                            activeMembers.filter(m => {
                                                                const { belay } = getMemberDetails(m);
                                                                return belay === 'Primary Belayer Certified' || belay === 'Belayer Qualified';
                                                            }),
                                                            'certified_belayers'
                                                        )}
                                                    >
                                                        <Download size={15} /> Export CSV
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CUSTOM EXPORT MATRIX BUILDER */}
                                    <div className="g5-card" style={{ padding: '1.5rem' }}>
                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                <Sliders size={20} style={{ color: 'var(--color-accent-warm)' }} />
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                                                    Custom Export Matrix Builder
                                                </h3>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                                                Choose your exact parameters below to generate a tailor-made print-ready PDF or raw CSV spreadsheet.
                                            </p>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                                    Role Filter
                                                </label>
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '100%', height: '42px', marginTop: '0.35rem', fontSize: '0.85rem' }}
                                                    value={rosterRoleFilter}
                                                    onChange={(e) => setRosterRoleFilter(e.target.value)}
                                                >
                                                    <option value="All">All Personnel (Douloids + Recruits)</option>
                                                    <option value="Douloid">Douloid Members Only</option>
                                                    <option value="Recruit">Recruits Pipeline Only</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                                    Rank Hierarchy
                                                </label>
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '100%', height: '42px', marginTop: '0.35rem', fontSize: '0.85rem' }}
                                                    value={rosterRankFilter}
                                                    onChange={(e) => setRosterRankFilter(e.target.value)}
                                                >
                                                    <option value="All">All Ranks</option>
                                                    <option value="Senior Lead Douloid">Senior Lead Douloid</option>
                                                    <option value="Lead Douloid">Lead Douloid</option>
                                                    <option value="Intermediate Douloid">Intermediate Douloid</option>
                                                    <option value="Basic Douloid">Basic Douloid</option>
                                                    <option value="Shadow Douloid">Shadow Douloid</option>
                                                    <option value="Recruit Candidate">Recruit Candidate</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                                    Campus
                                                </label>
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '100%', height: '42px', marginTop: '0.35rem', fontSize: '0.85rem' }}
                                                    value={rosterCampusFilter}
                                                    onChange={(e) => setRosterCampusFilter(e.target.value)}
                                                >
                                                    <option value="All">All Campuses</option>
                                                    <option value="Athi River">Athi River</option>
                                                    <option value="Valley Road">Valley Road</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                                    Belay Clearance
                                                </label>
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '100%', height: '42px', marginTop: '0.35rem', fontSize: '0.85rem' }}
                                                    value={rosterBelayFilter}
                                                    onChange={(e) => setRosterBelayFilter(e.target.value)}
                                                >
                                                    <option value="All">All Belay Clearances</option>
                                                    <option value="Primary Belayer Certified">Primary Belayer Certified</option>
                                                    <option value="Belayer Qualified">Belayer Qualified</option>
                                                    <option value="Not Permitted">Not Permitted</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* LIVE MATCH COUNTER & EXECUTE BUTTONS */}
                                        <div style={{
                                            marginTop: '1.5rem',
                                            padding: '1.25rem',
                                            background: 'linear-gradient(135deg, rgba(107, 95, 168, 0.08) 0%, rgba(224, 138, 77, 0.08) 100%)',
                                            borderRadius: '14px',
                                            border: '1.5px solid rgba(107, 95, 168, 0.2)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '1rem'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    🎯 {filteredRosterMembers.length} Personnel Records Match Your Selection
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                    {filteredRosterMembers.filter(m => m.memberType !== 'Recruit' && m.status !== 'Recruit').length} Douloid Members • {filteredRosterMembers.filter(m => m.memberType === 'Recruit' || m.status === 'Recruit').length} Recruits Pipeline
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <button
                                                    type="button"
                                                    className="g5-btn-warm"
                                                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                                                    disabled={filteredRosterMembers.length === 0}
                                                    onClick={() => handleDownloadRosterPDF(filteredRosterMembers)}
                                                >
                                                    <Printer size={16} /> Download Custom PDF Document
                                                </button>
                                                <button
                                                    type="button"
                                                    className="g5-btn-secondary"
                                                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                                                    disabled={filteredRosterMembers.length === 0}
                                                    onClick={() => handleExportRosterCSV(filteredRosterMembers, 'custom_matrix')}
                                                >
                                                    <Download size={16} /> Export Custom CSV Spreadsheet
                                                </button>
                                                <button
                                                    type="button"
                                                    className="g5-btn-outline"
                                                    style={{ padding: '0.65rem 1rem', fontSize: '0.88rem' }}
                                                    onClick={() => setRosterSubTab('directory')}
                                                >
                                                    <Users size={16} /> View in Directory
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 8: CONTRIBUTIONS (GLANCE-AND-NUDGE MINIMAL LIST) */}
                    {/* ========================================================= */}
                    {activeTab === 'contributions' && (
                        <div className="g5-card">
                            <div className="g5-card-header">
                                <div>
                                    <div className="g5-card-title">Member & Recruit Contributions</div>
                                    <div className="g5-card-desc">Training dues liaison overview (read-only glance-and-nudge list)</div>
                                </div>
                            </div>

                            <div className="g5-table-wrap">
                                <table className="g5-table">
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Campus</th>
                                            <th>Semester Dues</th>
                                            <th>Status</th>
                                            <th>Nudge Liaison</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member) => {
                                            const memberPayments = payments.filter(p => String(p.studentRegNo).trim().toUpperCase() === String(member.studentRegNo).trim().toUpperCase());
                                            const approvedPayment = memberPayments.find(p => p.status === 'approved');
                                            const pendingPayment = memberPayments.find(p => p.status === 'pending');
                                            const isPaid = !!approvedPayment;
                                            const statusText = approvedPayment ? 'Paid' : (pendingPayment ? 'Pending Verification' : 'Unpaid');
                                            const amountDisplay = approvedPayment 
                                                ? `KES ${approvedPayment.amount.toLocaleString()}` 
                                                : (pendingPayment ? `KES ${pendingPayment.amount.toLocaleString()}` : 'KES 0');
                                            return (
                                                <tr key={member._id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                            <div className="g5-avatar" style={{ width: '38px', height: '38px' }}>
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{member.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{member.studentRegNo}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{member.campus}</td>
                                                    <td style={{ fontWeight: 700 }}>{amountDisplay}</td>
                                                    <td>
                                                        <span className={`g5-pill ${isPaid ? 'g5-pill-active' : (pendingPayment ? 'g5-pill-recruit' : 'g5-pill-inactive')}`}>
                                                            {statusText}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {!isPaid ? (
                                                            <a
                                                                href={`https://wa.me/?text=${encodeURIComponent(`Habari ${member.name.split(' ')[0]}! Kindly remember to submit your Doulos semester contribution via the student portal. Let's make camp a blessing! 🙏⛺`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="g5-btn-outline"
                                                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none' }}
                                                            >
                                                                <MessageCircle size={14} /> Send WhatsApp Nudge
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: 'var(--color-status-active)', fontWeight: 600, fontSize: '0.85rem' }}>
                                                                ✓ Cleared
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
                    )}

                    {/* ========================================================= */}
                    {/* TAB 9: SAFETY & INCIDENTS (LOP LIBRARY + INCIDENT LOG) */}
                    {/* ========================================================= */}
                    {activeTab === 'safety' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* LOP Documents Card Grid */}
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
                                    Standard Operating Procedures (LOP Library)
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                                    Standard safety protocols approved by G5 Training Directorate
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                    {lops.map((lop) => (
                                        <div key={lop.id} className="g5-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                    <span className="g5-pill g5-pill-purple">{lop.code}</span>
                                                    <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                                                </div>
                                                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                                    {lop.title}
                                                </h4>
                                                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                    {lop.desc}
                                                </p>
                                            </div>
                                            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                                                <button className="g5-btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => showToast(`Opened ${lop.code}`)}>
                                                    <ExternalLink size={15} /> View Protocol
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chronological Incident Log */}
                            <div className="g5-card">
                                <div className="g5-card-header">
                                    <div>
                                        <div className="g5-card-title">Incident & Near-Miss Log</div>
                                        <div className="g5-card-desc">Chronological tracking of field occurrences and corrective action plans</div>
                                    </div>
                                    <button className="g5-btn-warm" onClick={() => setShowReportIncidentModal(true)}>
                                        <Plus size={16} /> + Report Incident
                                    </button>
                                </div>

                                {incidents.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
                                        <Shield size={36} style={{ color: 'var(--color-status-active)', margin: '0 auto 0.75rem' }} />
                                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>Zero Active Incidents Filed</div>
                                        <div style={{ fontSize: '0.85rem' }}>All training courses operating safely within LOP specifications.</div>
                                    </div>
                                ) : (
                                    <div className="g5-table-wrap">
                                        <table className="g5-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Title</th>
                                                    <th>Severity</th>
                                                    <th>Location</th>
                                                    <th>Corrective Action</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {incidents.map((incident) => (
                                                    <tr key={incident._id}>
                                                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                            {new Date(incident.incidentDate || incident.createdAt || Date.now()).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ fontWeight: 700 }}>{incident.title}</td>
                                                        <td>
                                                            <span className={`g5-pill ${incident.severity === 'Near-Miss' ? 'g5-pill-recruit' : 'g5-pill-inactive'}`}>
                                                                {incident.severity}
                                                            </span>
                                                        </td>
                                                        <td>{incident.location || incident.campus}</td>
                                                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                            {incident.correctiveActionPlan || 'Root-cause audit complete.'}
                                                        </td>
                                                        <td>
                                                            <span className="g5-pill g5-pill-active">Logged</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* ========================================================= */}
            {/* BESPOKE 2-COLUMN MODAL: CREATE MEETING SESSION */}
            {/* ========================================================= */}
            {showNewMeetingModal && (
                <div className="g5-modal-backdrop" onClick={() => setShowNewMeetingModal(false)}>
                    <div className="g5-modal g5-modal-xl g5-modal-scrollable" onClick={(e) => e.stopPropagation()}>
                        <div className="g5-modal-header" style={{ padding: '1.25rem 1.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #6B5FA8 0%, #8E82CA 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFFFFF',
                                    boxShadow: '0 4px 12px rgba(107, 95, 168, 0.25)'
                                }}>
                                    <Compass size={22} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1.2 }}>
                                        Create Meeting Session
                                    </h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                        Schedule outdoor practicals, weekly fellowship, and geofenced attendance verification
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNewMeetingModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'var(--color-page-bg)',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMeeting}>
                            <div className="g5-modal-body" style={{ padding: '1.5rem 1.75rem' }}>
                                {/* WEEKLY CAMPUS LIMIT CONFLICT BANNER */}
                                {existingConflictMeeting && (
                                    <div style={{
                                        background: 'var(--color-accent-warm-soft)',
                                        border: '1.5px solid var(--color-accent-warm)',
                                        borderRadius: '14px',
                                        padding: '0.85rem 1.25rem',
                                        marginBottom: '1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.85rem',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-text-main)'
                                    }}>
                                        <AlertTriangle size={20} style={{ color: 'var(--color-accent-warm)', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                Policy Restriction: 1 Meeting Per Week Allowed for {newMeetingForm.campus}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                "<strong>{existingConflictMeeting.name}</strong>" is already scheduled for this week on {new Date(existingConflictMeeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ({existingConflictMeeting.startTime} - {existingConflictMeeting.endTime}).
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="g5-form-layout-2col">

                                    {/* COLUMN 1: SESSION DETAILS */}
                                    <div className="g5-form-card-panel">
                                        <div className="g5-form-section-title">
                                            <Settings size={15} /> 1. Session Details
                                        </div>

                                        <div className="g5-form-group" style={{ marginBottom: '0.85rem' }}>
                                            <label className="g5-form-label">Meeting Name</label>
                                            <input
                                                type="text"
                                                className="g5-form-input"
                                                placeholder="Weekly Doulos"
                                                required
                                                value={newMeetingForm.name}
                                                onChange={(e) => setNewMeetingForm({ ...newMeetingForm, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="g5-form-group" style={{ marginBottom: '0.85rem' }}>
                                            <label className="g5-form-label">Campus Location</label>
                                            <div className="g5-campus-toggle">
                                                <button
                                                    type="button"
                                                    className={`g5-campus-btn ${newMeetingForm.campus === 'Athi River' ? 'active' : ''}`}
                                                    onClick={() => applyVenuePreset(VENUE_PRESETS[0])}
                                                >
                                                    <Tent size={16} /> Athi River (Doulos Store)
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`g5-campus-btn ${newMeetingForm.campus === 'Valley Road' ? 'active' : ''}`}
                                                    onClick={() => applyVenuePreset(VENUE_PRESETS[1])}
                                                >
                                                    <Users size={16} /> Nairobi Campus (DAC 506)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="g5-form-grid-3" style={{ gap: '0.65rem', marginBottom: '0.85rem' }}>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">Date</label>
                                                <input
                                                    type="date"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.date}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, date: e.target.value })}
                                                />
                                            </div>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">Start Time</label>
                                                <input
                                                    type="time"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.startTime}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, startTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">End Time</label>
                                                <input
                                                    type="time"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.endTime}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, endTime: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* QUESTION / POLL STUDIO */}
                                        <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                                                <Lightbulb size={15} style={{ color: 'var(--color-primary)' }} />
                                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    Interactive Roll-Call Question
                                                </span>
                                            </div>

                                            <div className="g5-type-chip-grid" style={{ marginBottom: '0.75rem' }}>
                                                {[
                                                    { id: 'text', label: 'Open Text', icon: FileText },
                                                    { id: 'yes_no', label: 'Yes / No', icon: CheckCircle2 },
                                                    { id: 'multiple_choice', label: 'Single Choice', icon: Check },
                                                    { id: 'checkboxes', label: 'Checkboxes', icon: Layers },
                                                    { id: 'rating', label: '1-5 Stars', icon: Star }
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        className={`g5-type-chip ${newMeetingForm.questionType === t.id ? 'active' : ''}`}
                                                        onClick={() => setNewMeetingForm(prev => ({
                                                            ...prev,
                                                            questionType: t.id,
                                                            questionOptions: (t.id === 'multiple_choice' || t.id === 'checkboxes') ? ['', ''] : []
                                                        }))}
                                                    >
                                                        <t.icon size={13} />
                                                        <span>{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label" style={{ fontSize: '0.78rem' }}>Question Wording</label>
                                                <input
                                                    type="text"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                                                    placeholder="e.g. Rate your week / Choose an option"
                                                    value={newMeetingForm.questionOfDay}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, questionOfDay: e.target.value })}
                                                />
                                            </div>

                                            {(newMeetingForm.questionType === 'multiple_choice' || newMeetingForm.questionType === 'checkboxes') && (
                                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                                            Poll Choices
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="g5-btn-secondary"
                                                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                                                            onClick={() => setNewMeetingForm(prev => ({
                                                                ...prev,
                                                                questionOptions: [...prev.questionOptions, '']
                                                            }))}
                                                        >
                                                            + Add Choice
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        {newMeetingForm.questionOptions.map((opt, idx) => (
                                                            <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', minWidth: '16px' }}>{idx + 1}.</span>
                                                                <input
                                                                    type="text"
                                                                    className="g5-form-input"
                                                                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}
                                                                    placeholder={`Choice ${idx + 1}`}
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const updated = [...newMeetingForm.questionOptions];
                                                                        updated[idx] = e.target.value;
                                                                        setNewMeetingForm({ ...newMeetingForm, questionOptions: updated });
                                                                    }}
                                                                />
                                                                {newMeetingForm.questionOptions.length > 2 && (
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-outline"
                                                                        style={{ padding: '0.35rem 0.55rem', color: 'var(--color-status-inactive)' }}
                                                                        onClick={() => {
                                                                            const updated = newMeetingForm.questionOptions.filter((_, i) => i !== idx);
                                                                            setNewMeetingForm({ ...newMeetingForm, questionOptions: updated });
                                                                        }}
                                                                    >
                                                                        <X size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* COLUMN 2: LOCATION & GEOFENCING */}
                                    <div className="g5-form-card-panel">
                                        <div className="g5-form-section-title">
                                            <MapPin size={15} /> 2. Location & Geofencing
                                        </div>

                                        {/* OFFICIAL VENUE SELECTION */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                    Official Campus Venue
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                                    {newMeetingForm.campus === 'Athi River' ? 'Athi River Base' : 'Nairobi Campus'}
                                                </span>
                                            </div>
                                            <div className="g5-venue-preset-grid">
                                                {VENUE_PRESETS.map((p) => {
                                                    const isSelected = newMeetingForm.location.name === p.name;
                                                    return (
                                                        <div
                                                            key={p.title}
                                                            className={`g5-venue-preset-card ${isSelected ? 'active' : ''}`}
                                                            onClick={() => applyVenuePreset(p)}
                                                        >
                                                            <div className="g5-venue-title">
                                                                <span>{p.title}</span>
                                                                {isSelected && <Check size={14} style={{ color: 'var(--color-accent-warm)' }} />}
                                                            </div>
                                                            <div className="g5-venue-sub">{p.sub}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* LOCATION NAME INPUT */}
                                        <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                            <label className="g5-form-label">Venue / Location Name</label>
                                            <input
                                                type="text"
                                                className="g5-form-input"
                                                placeholder="Doulos Store or DAC 506"
                                                required
                                                value={newMeetingForm.location.name}
                                                onChange={(e) => setNewMeetingForm({
                                                    ...newMeetingForm,
                                                    location: { ...newMeetingForm.location, name: e.target.value }
                                                })}
                                            />
                                        </div>

                                        {/* GPS SATELLITE RADAR BOX */}
                                        <div className="g5-gps-radar-box">
                                            <div className="g5-gps-radar-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Radio size={16} style={{ color: 'var(--color-primary)' }} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                        Satellite GPS Lock
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <div className="g5-pulse-dot" />
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-status-active)' }}>
                                                        High-Accuracy Geofence
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="g5-btn-warm"
                                                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                                                onClick={handleCaptureGps}
                                                disabled={gpsCapturing}
                                            >
                                                <Navigation size={16} />
                                                {gpsCapturing ? 'Locating Device Coordinates...' : 'Capture GPS'}
                                            </button>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>COORDINATES:</span>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                                                    {Number(newMeetingForm.location.latitude).toFixed(5)}, {Number(newMeetingForm.location.longitude).toFixed(5)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* GEOFENCE RADIUS & COORDINATES GRID */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.65rem' }}>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                                    <label className="g5-form-label" style={{ fontSize: '0.78rem' }}>Radius (m) *</label>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-accent-warm)' }}>
                                                        {newMeetingForm.location.radius}m
                                                    </span>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.location.radius}
                                                    onChange={(e) => setNewMeetingForm({
                                                        ...newMeetingForm,
                                                        location: { ...newMeetingForm.location, radius: parseInt(e.target.value) || 200 }
                                                    })}
                                                />
                                            </div>

                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label" style={{ fontSize: '0.78rem' }}>Latitude *</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.location.latitude}
                                                    onChange={(e) => setNewMeetingForm({
                                                        ...newMeetingForm,
                                                        location: { ...newMeetingForm.location, latitude: parseFloat(e.target.value) }
                                                    })}
                                                />
                                            </div>

                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label" style={{ fontSize: '0.78rem' }}>Longitude *</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                                                    required
                                                    value={newMeetingForm.location.longitude}
                                                    onChange={(e) => setNewMeetingForm({
                                                        ...newMeetingForm,
                                                        location: { ...newMeetingForm.location, longitude: parseFloat(e.target.value) }
                                                    })}
                                                />
                                            </div>
                                        </div>

                                    </div>

                                </div>
                            </div>

                            <div className="g5-modal-footer" style={{ justifyContent: 'space-between', padding: '1rem 1.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-status-active)' }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                        {newMeetingForm.campus} • {newMeetingForm.location.radius}m perimeter verified
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" className="g5-btn-outline" onClick={() => setShowNewMeetingModal(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="g5-btn-warm"
                                        disabled={meetingCreating || !!existingConflictMeeting}
                                        style={{
                                            opacity: existingConflictMeeting ? 0.5 : 1,
                                            cursor: existingConflictMeeting ? 'not-allowed' : 'pointer'
                                        }}
                                        title={existingConflictMeeting ? `A meeting already exists for ${newMeetingForm.campus} this week` : ''}
                                    >
                                        <Sparkles size={16} />
                                        {meetingCreating ? 'Creating Session...' : existingConflictMeeting ? 'Weekly Limit Reached' : 'Create Meeting Session'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: REPORT INCIDENT */}
            {/* ========================================================= */}
            {showReportIncidentModal && (
                <div className="g5-modal-backdrop" onClick={() => setShowReportIncidentModal(false)}>
                    <div className="g5-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="g5-modal-header">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                Report Safety Occurrence
                            </h3>
                            <button
                                onClick={() => setShowReportIncidentModal(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleReportIncident}>
                            <div className="g5-modal-body">
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Occurrence Title</label>
                                    <input
                                        type="text"
                                        className="g5-form-input"
                                        placeholder="e.g., Carabiner gate stiff during zip line drill"
                                        required
                                        value={incidentForm.title}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Severity Level</label>
                                    <select
                                        className="g5-form-select"
                                        value={incidentForm.severity}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                                    >
                                        <option value="Near-Miss">Near-Miss (No Injury / Hazard Identified)</option>
                                        <option value="Minor First Aid">Minor First Aid (Scrape / Hydration)</option>
                                        <option value="Equipment Failure">Equipment Quarantine Required</option>
                                        <option value="Serious Incident">Serious Occurrence</option>
                                    </select>
                                </div>
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Location / Course</label>
                                    <input
                                        type="text"
                                        className="g5-form-input"
                                        value={incidentForm.location}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                                    />
                                </div>
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Description & Observations</label>
                                    <textarea
                                        className="g5-form-textarea"
                                        rows="3"
                                        placeholder="Detail the sequence of events and immediate actions taken..."
                                        required
                                        value={incidentForm.description}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="g5-form-group">
                                    <label className="g5-form-label">Corrective Action Plan</label>
                                    <textarea
                                        className="g5-form-textarea"
                                        rows="2"
                                        placeholder="Steps taken to prevent recurrence (hardware retirement, brief retraining)..."
                                        value={incidentForm.correctiveActionPlan}
                                        onChange={(e) => setIncidentForm({ ...incidentForm, correctiveActionPlan: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="g5-modal-footer">
                                <button type="button" className="g5-btn-outline" onClick={() => setShowReportIncidentModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="g5-btn-warm" disabled={incidentSubmitting}>
                                    {incidentSubmitting ? 'Logging...' : 'File Safety Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ========================================================= */}
            {/* G5 MEETING ATTENDANCE & LIVE FEED MODAL */}
            {/* ========================================================= */}
            {insightMeeting && (
                <G5MeetingModal
                    meeting={insightMeeting}
                    onClose={() => setInsightMeeting(null)}
                    api={api}
                    onRefresh={fetchPortalData}
                />
            )}

            {/* ========================================================= */}
            {/* DEDICATED MEETING QR CODE PROJECTOR MODAL */}
            {/* ========================================================= */}
            {qrMeeting && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '0.75rem'
                    }}
                    onClick={() => setQrMeeting(null)}
                >
                    <div
                        className="g5-card"
                        style={{
                            maxWidth: '440px',
                            width: '94vw',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            background: '#FFFFFF',
                            borderRadius: '20px',
                            padding: '1.75rem 1.25rem',
                            textAlign: 'center',
                            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.35)',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setQrMeeting(null)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: 'var(--color-page-bg)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-muted)'
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.85rem' }}>
                            <QrCode size={13} /> Meeting Check-In QR
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text-main)', margin: '0 0 0.35rem', wordBreak: 'break-word' }}>
                            {qrMeeting.name || 'Training Meeting'}
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem' }}>
                            {qrMeeting.campus} • {new Date(qrMeeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {qrMeeting.startTime || '18:00'} - {qrMeeting.endTime || '20:00'}
                        </p>

                        {/* QR BOX */}
                        <div style={{
                            background: '#FFFFFF',
                            padding: '1.25rem',
                            borderRadius: '16px',
                            display: 'inline-block',
                            border: '2px solid rgba(37, 170, 225, 0.3)',
                            boxShadow: '0 8px 30px rgba(37, 170, 225, 0.15)',
                            marginBottom: '1.25rem',
                            maxWidth: '100%'
                        }}>
                            <QRCode
                                value={`${window.location.origin}/check-in/${qrMeeting.code}`}
                                size={Math.min(240, typeof window !== 'undefined' ? window.innerWidth - 120 : 240)}
                                level="H"
                            />
                        </div>

                        {/* JOIN CODE */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Meeting Code
                            </div>
                            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '3px', fontFamily: 'monospace', lineHeight: 1.1, margin: '0.2rem 0' }}>
                                {(qrMeeting.code || 'DOULOS').toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                                Point camera to scan, or enter code at <strong>{window.location.host}/check-in</strong>
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="g5-btn-secondary"
                                style={{ fontSize: '0.82rem', padding: '0.55rem 0.9rem' }}
                                onClick={() => {
                                    const link = `${window.location.origin}/check-in/${qrMeeting.code}`;
                                    navigator.clipboard.writeText(link);
                                    setCopiedQrLink(true);
                                    setTimeout(() => setCopiedQrLink(false), 2000);
                                }}
                            >
                                {copiedQrLink ? <Check size={14} color="var(--color-status-active)" /> : <Copy size={14} />}
                                {copiedQrLink ? 'Copied!' : 'Copy Link'}
                            </button>

                            <a
                                href={`/check-in/${qrMeeting.code}`}
                                target="_blank"
                                rel="noreferrer"
                                className="g5-btn-secondary"
                                style={{ fontSize: '0.82rem', padding: '0.55rem 0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                                <ExternalLink size={14} /> Open Page
                            </a>

                            <button
                                type="button"
                                className="g5-btn-warm"
                                style={{ fontSize: '0.82rem', padding: '0.55rem 1rem', background: '#25AAE1', borderColor: '#25AAE1' }}
                                onClick={() => {
                                    const checkInUrl = `${window.location.origin}/check-in/${qrMeeting.code}`;
                                    const printWin = window.open('', '_blank');
                                    if (!printWin) return;
                                    printWin.document.write(`
                                        <html>
                                            <head>
                                                <title>Doulos Meeting QR - ${qrMeeting.name}</title>
                                                <style>
                                                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; color: #1E1B39; }
                                                    .card { border: 2px solid #25AAE1; border-radius: 24px; padding: 40px; max-width: 460px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                                                    .title { font-size: 24px; font-weight: 900; margin-bottom: 6px; }
                                                    .sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }
                                                    .qr-box { padding: 20px; background: #fff; border-radius: 16px; display: inline-block; border: 1px solid #e2e8f0; margin-bottom: 20px; }
                                                    .code { font-size: 38px; font-weight: 900; letter-spacing: 4px; color: #25AAE1; margin-bottom: 8px; font-family: monospace; }
                                                    .link { font-size: 13px; color: #64748b; word-break: break-all; }
                                                </style>
                                            </head>
                                            <body>
                                                <div class="card">
                                                    <div style="font-size: 12px; font-weight: 800; color: #25AAE1; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">DOULOS ATTENDANCE CHECK-IN</div>
                                                    <div class="title">${qrMeeting.name || 'Training Session'}</div>
                                                    <div class="sub">${qrMeeting.campus || 'Campus'} • ${new Date(qrMeeting.date).toLocaleDateString()} • ${qrMeeting.startTime || ''} - ${qrMeeting.endTime || ''}</div>
                                                    <div class="qr-box">
                                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(checkInUrl)}" width="250" height="250" alt="Meeting QR" />
                                                    </div>
                                                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">MEETING JOIN CODE</div>
                                                    <div class="code">${(qrMeeting.code || 'DOULOS').toUpperCase()}</div>
                                                    <div class="link">${checkInUrl}</div>
                                                </div>
                                                <script>
                                                    window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 400); };
                                                </script>
                                            </body>
                                        </html>
                                    `);
                                    printWin.document.close();
                                }}
                            >
                                <Printer size={14} /> Print Poster
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default G5TrainingPortal;
