import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalData } from '../hooks/usePortalQuery';
import { StatCardSkeleton, TableRowSkeleton, CardSkeleton, ListSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import QRCode from 'react-qr-code';
import api from '../api';
import G5MeetingModal from '../components/G5MeetingModal';
import CampScheduleStudio from '../components/dashboard/CampScheduleStudio';
import Logo from '../components/Logo';
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
    Menu,
    Trash2,
    Smartphone,
    Unlock,
    Lock,
    Edit
} from 'lucide-react';

const G5TrainingPortal = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Active Navigation Tab (9 items strictly)
    const [activeTab, setActiveTab] = useState('dashboard');

    // Responsive Mobile State
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
    const moreTabIds = ['trainings_camps', 'graduations', 'promotions', 'contributions', 'safety'];
    const isMoreActive = moreTabIds.includes(activeTab);

    const handleSelectTab = (tabId) => {
        setActiveTab(tabId);
        setMobileSidebarOpen(false);
        setMobileMoreOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [campusFilter, setCampusFilter] = useState('All');
    const [toast, setToast] = useState(null);

    // Profile info
    const username = localStorage.getItem('username') || 'g5_training';
    const userRole = localStorage.getItem('role') || 'trainer';
    const userCampus = localStorage.getItem('campus') || 'Athi River';

    const isDoulosAccount = useMemo(() => {
        const lower = (username || '').toLowerCase();
        return lower.includes('doulos') || lower.includes('training') || lower === 'admin' || lower === 'g5_training' || !username;
    }, [username]);

    const renderUserAvatar = (size = 36, fontSize = '0.85rem') => {
        if (isDoulosAccount) {
            return (
                <div
                    className="g5-avatar g5-avatar-logo"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        padding: '2px',
                        background: '#FFFFFF',
                        border: '1.5px solid #BFDBFE',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                    title="Doulos Ministry"
                >
                    <img
                        src="/logo.png"
                        alt="Doulos Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </div>
            );
        }
        return (
            <div className="g5-avatar" style={{ width: `${size}px`, height: `${size}px`, fontSize, flexShrink: 0 }}>
                {(username || '?').charAt(0).toUpperCase()}
            </div>
        );
    };

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
        name: '',
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
            latitude: '',
            longitude: ''
        }
    });
    const [meetingCreating, setMeetingCreating] = useState(false);
    const [allowMultipleMeeting, setAllowMultipleMeeting] = useState(false);
    const [gpsCapturing, setGpsCapturing] = useState(false);
    const [gpsCaptured, setGpsCaptured] = useState(false);

    // Edit Meeting State
    const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);
    const [editMeetingForm, setEditMeetingForm] = useState(null);
    const [editMeetingLoading, setEditMeetingLoading] = useState(false);
    const [editGpsCapturing, setEditGpsCapturing] = useState(false);
    const [editGpsCaptured, setEditGpsCaptured] = useState(false);

    // 1. Live G5 Dashboard Stats
    const {
        data: g5StatsData,
        isLoading: statsLoading,
        isError: statsError,
        refetch: refetchG5Stats
    } = usePortalData('g5-stats', '/g5/stats');

    const g5Stats = g5StatsData?.stats || {
        attendancePercentage: 0,
        totalAttended: 0,
        recruitsReadyToGraduate: 0,
        totalRecruits: 0,
        archivedRecruitsCount: 0,
        promotionsPending: 0,
        upcomingTrainings: 0,
        absenteeFlags: 0,
        activeLiveSession: null
    };

    // 2. Venues Query from DB
    const { data: venuesData } = usePortalData('venues', '/venues');
    const VENUE_PRESETS = (venuesData?.venues && venuesData.venues.length > 0) ? venuesData.venues : [
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

    // 3. Evaluation Domains Query from DB
    const { data: evalDomainsData } = usePortalData('eval-domains', '/ranking/evaluation-domains');
    const evaluationDomains = (evalDomainsData?.domains && evalDomainsData.domains.length > 0) ? evalDomainsData.domains : [
        { key: 'team', label: 'Team Building', tag: 'Facilitation', desc: 'Group dynamics, debrief facilitation, activity structuring & debrief synthesis' },
        { key: 'base', label: 'Freedom Base', tag: 'Operations', desc: 'Base station hardware, equipment definition, maintenance audits & anchor security' },
        { key: 'ropes', label: 'High Ropes', tag: 'Hardware & Rigging', desc: 'Hardware rigging, carabiner squeeze check, challenge element navigation' },
        { key: 'rescue', label: 'Rescue & Extrication', tag: 'Emergency', desc: 'Mid-element rescues, spine board extrication, litter extraction, descent control' },
        { key: 'firstAid', label: 'First Aid', tag: 'Medical Protocol', desc: 'Wilderness triage, incident response, CPR/wound care, medical protocol execution' },
        { key: 'safety', label: 'Safety & Risk Management', tag: 'Risk Assessment', desc: 'Environmental hazard assessment, participant briefings, double-check commands' },
        { key: 'mentorship', label: 'Curriculum & Mentorship', tag: 'Strategy', desc: 'Program strategy, apprentice development, facilitator guidance' }
    ];

    // 4. LOP Safety SOP Docs Query from DB
    const { data: lopDocsData } = usePortalData('safety-lop-docs', '/safety/lop-docs');
    const lopDocs = lopDocsData?.docs || [];

    // 5. Equipment Readiness Query from DB
    const { data: equipData } = usePortalData('equipment-readiness', '/equipment/readiness');
    const equipmentReadiness = equipData?.readiness || null;

    // 6. Contributions Status Query from DB
    const { data: contribData } = usePortalData('contributions-status', '/finance/contributions/status');
    const contributionsStatus = contribData?.status || null;

    // 7. Live Graduation Queue Query from DB
    const { data: gradQueueData, refetch: refetchGradQueue } = usePortalData('graduation-queue', '/membership/graduation-queue');
    const graduationQueue = gradQueueData?.queue || [];

    // 8. Candidates Query from DB
    const { data: candidatesData, refetch: refetchCandidates } = usePortalData('promotion-candidates', '/ranking/candidates');
    const promotionCandidates = candidatesData?.candidates || [];

    const getMeetingOrdinalLabel = (index) => {
        const labels = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
        return labels[Math.max(0, Math.min(index - 1, labels.length - 1))] || String(index);
    };

    const buildMeetingName = (campus, meetingList = meetings) => {
        const targetCampus = campus || 'Athi River';
        const count = (meetingList || []).filter((m) => {
            if (!m || !m.campus || m.isArchived) return false;
            return m.campus === targetCampus;
        }).length + 1;
        return `Meeting ${getMeetingOrdinalLabel(count)}`;
    };

    const applyVenuePreset = (preset) => {
        if (!preset) return;
        const targetCampus = preset.campus || newMeetingForm.campus || 'Athi River';
        setNewMeetingForm(prev => ({
            ...prev,
            campus: targetCampus,
            name: buildMeetingName(targetCampus, meetings),
            location: {
                name: preset.name,
                radius: preset.radius || 200,
                latitude: preset.lat || preset.latitude || 0,
                longitude: preset.lng || preset.longitude || 0
            }
        }));
        showToast(`Campus venue set to ${preset.name} (${targetCampus})`);
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
    const [rosterDeviceFilter, setRosterDeviceFilter] = useState('All'); // 'All' | 'Bound' | 'Unbound'
    const [rosterSearch, setRosterSearch] = useState('');

    // Real-Time Device Lock Removal State
    const [resettingDeviceMemberId, setResettingDeviceMemberId] = useState(null);
    const [showQuickUnlockModal, setShowQuickUnlockModal] = useState(false);
    const [quickUnlockQuery, setQuickUnlockQuery] = useState('');
    const [quickUnlockLoading, setQuickUnlockLoading] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ text: msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {}
        localStorage.clear();
        navigate('/admin?logout=true');
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
        return members.filter(m => 
            m.memberType === 'Recruit' && 
            m.status !== 'Archived' && 
            m.status !== 'Archived-Concluded'
        );
    }, [members]);

    const archivedRecruits = useMemo(() => {
        return members.filter(m => 
            m.memberType === 'Recruit' && 
            m.status === 'Archived'
        );
    }, [members]);

    const nextUpcomingMeeting = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = meetings
            .filter(m => !m.isArchived && (new Date(m.date) >= now || m.isActive))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        return upcoming[0] || null;
    }, [meetings]);

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
    const relevantMeetingsCount = activeMeetings.length > 0 ? activeMeetings.length : meetings.length;
    const totalExpected = relevantMeetingsCount > 0 && activeMembers.length > 0 ? relevantMeetingsCount * activeMembers.length : 0;
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

            // Device binding filter
            if (rosterDeviceFilter === 'Bound' && !m.linkedDeviceId) return false;
            if (rosterDeviceFilter === 'Unbound' && m.linkedDeviceId) return false;

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
    }, [activeMembers, cadres, rosterRoleFilter, rosterRankFilter, rosterCampusFilter, rosterBelayFilter, rosterDeviceFilter, rosterSearch]);

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
                 setGpsCaptured(true);
                 setNewMeetingForm(prev => ({
                     ...prev,
                     location: {
                         ...prev.location,
                         latitude: parseFloat(pos.coords.latitude.toFixed(6)),
                         longitude: parseFloat(pos.coords.longitude.toFixed(6))
                     }
                 }));
                 showToast(`Device GPS locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
             },
             (err) => {
                 setGpsCapturing(false);
                 console.error('GPS error:', err);
                 showToast('GPS access denied or unavailable. Please enable device location.', 'error');
             },
             { enableHighAccuracy: true, timeout: 12000 }
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

    // Check if an ACTIVE meeting already exists for this campus in the selected week (archived meetings are excluded)
    const existingConflictMeeting = useMemo(() => {
        if (!newMeetingForm.date || !newMeetingForm.campus) return null;
        const range = getWeekRangeClient(newMeetingForm.date);
        if (!range) return null;
        return meetings.find(m => {
            if (m.isArchived) return false; // Ignore archived meetings completely!
            if (m.campus !== newMeetingForm.campus) return false;
            const mDate = new Date(m.date);
            return mDate >= range.start && mDate <= range.end;
        });
    }, [newMeetingForm.date, newMeetingForm.campus, meetings]);

    const handleOpenNewMeetingModal = () => {
        const defaultCampus = 'Athi River';
        const nextName = buildMeetingName(defaultCampus, meetings);
        setNewMeetingForm({
            name: nextName,
            campus: defaultCampus,
            date: new Date().toISOString().split('T')[0],
            startTime: '20:30',
            endTime: '23:00',
            questionType: 'text',
            questionOfDay: '',
            questionOptions: ['', ''],
            location: {
                name: 'Doulos Store',
                radius: 200,
                latitude: '',
                longitude: ''
            }
        });
        setGpsCaptured(false);
        setAllowMultipleMeeting(false);
        setShowNewMeetingModal(true);
    };

    // Meeting Creation handler (Full Session Details & Geofencing)
    const handleCreateMeeting = async (e) => {
        e.preventDefault();

        // 1. Mandatory Question Validation
        const trimmedQuestion = (newMeetingForm.questionOfDay || '').trim();
        if (!trimmedQuestion) {
            showToast('Mandatory requirement: Please enter an interactive roll-call question for this meeting.', 'error');
            return;
        }

        if (['multiple_choice', 'checkboxes'].includes(newMeetingForm.questionType)) {
            const validOptions = (newMeetingForm.questionOptions || []).filter(o => o && o.trim());
            if (validOptions.length < 2) {
                showToast('Please provide at least 2 choices for your multiple choice / checkbox question.', 'error');
                return;
            }
        }

        // 2. Mandatory Device GPS Capture Validation
        const lat = Number(newMeetingForm.location.latitude);
        const lng = Number(newMeetingForm.location.longitude);
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            showToast('Mandatory requirement: You must capture device GPS coordinates before creating the meeting.', 'error');
            return;
        }

        if (existingConflictMeeting && !allowMultipleMeeting) {
            showToast(`A meeting is already scheduled for ${newMeetingForm.campus} this week. Check the override toggle to schedule an additional session.`, 'warning');
            return;
        }
        setMeetingCreating(true);
        try {
                const generatedMeetingName = buildMeetingName(newMeetingForm.campus, meetings);
            const payload = {
                name: generatedMeetingName,
                date: newMeetingForm.date,
                campus: newMeetingForm.campus,
                startTime: newMeetingForm.startTime,
                endTime: newMeetingForm.endTime,
                allowMultiple: allowMultipleMeeting,
                semester: 'MAY-AUG 2026',
                questionType: newMeetingForm.questionType || 'text',
                questionOfDay: trimmedQuestion,
                questionOptions: (newMeetingForm.questionType === 'multiple_choice' || newMeetingForm.questionType === 'checkboxes')
                    ? newMeetingForm.questionOptions.filter(o => o && o.trim())
                    : [],
                location: {
                    name: newMeetingForm.location.name,
                    radius: Number(newMeetingForm.location.radius) || 200,
                    latitude: lat,
                    longitude: lng
                }
            };
            const res = await api.post('/meetings', payload);
            showToast('Meeting session created successfully!');
            setShowNewMeetingModal(false);
            setAllowMultipleMeeting(false);
            setGpsCaptured(false);
            setMeetings(prev => [res.data || payload, ...prev]);
        } catch (err) {
            console.error('Meeting creation failed:', err);
            showToast(err.response?.data?.message || 'Could not schedule meeting', 'error');
        } finally {
            setMeetingCreating(false);
        }
    };

    // Meeting Edit Handlers (G5 Role Exclusive)
    const handleOpenEditMeeting = (meeting) => {
        if (!meeting) return;
        const initialDate = meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setEditMeetingForm({
            _id: meeting._id,
            name: meeting.name || 'Weekly Doulos',
            campus: meeting.campus || 'Athi River',
            date: initialDate,
            startTime: meeting.startTime || '18:00',
            endTime: meeting.endTime || '20:00',
            questionType: meeting.questionType || 'text',
            questionOfDay: meeting.questionOfDay || '',
            questionOptions: (meeting.questionOptions && meeting.questionOptions.length > 0)
                ? meeting.questionOptions
                : (meeting.questionType === 'multiple_choice' || meeting.questionType === 'checkboxes') ? ['', ''] : [],
            location: {
                name: meeting.location?.name || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store'),
                radius: Number(meeting.location?.radius) || 200,
                latitude: meeting.location?.latitude ?? '',
                longitude: meeting.location?.longitude ?? ''
            },
            allowMultiple: false,
            isTestMeeting: Boolean(meeting.isTestMeeting)
        });
        setEditGpsCaptured(Boolean(meeting.location?.latitude && meeting.location?.longitude));
        setShowEditMeetingModal(true);
    };

    const handleCaptureEditGps = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser.', 'error');
            return;
        }
        setEditGpsCapturing(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setEditGpsCapturing(false);
                setEditGpsCaptured(true);
                setEditMeetingForm(prev => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        latitude: parseFloat(pos.coords.latitude.toFixed(6)),
                        longitude: parseFloat(pos.coords.longitude.toFixed(6))
                    }
                }));
                showToast(`Device GPS updated: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            },
            (err) => {
                setEditGpsCapturing(false);
                console.error('GPS error:', err);
                showToast('GPS access denied or unavailable. Please enable device location.', 'error');
            },
            { enableHighAccuracy: true, timeout: 12000 }
        );
    };

    const applyEditVenuePreset = (preset) => {
        if (!preset) return;
        setEditMeetingForm(prev => ({
            ...prev,
            campus: preset.campus === 'Both' ? prev.campus : preset.campus,
            location: {
                ...prev.location,
                name: preset.name || preset.title,
                latitude: preset.lat || preset.latitude || prev.location.latitude,
                longitude: preset.lng || preset.longitude || prev.location.longitude,
                radius: preset.radius || prev.location.radius || 200
            }
        }));
        if (preset.latitude || preset.lat) {
            setEditGpsCaptured(true);
        }
        showToast(`Venue preset applied: ${preset.title || preset.name}`);
    };

    const editConflictMeeting = useMemo(() => {
        if (!editMeetingForm || !editMeetingForm.date || !editMeetingForm.campus) return null;
        const range = getWeekRangeClient(editMeetingForm.date);
        if (!range) return null;
        return meetings.find(m => {
            if (m._id === editMeetingForm._id) return false;
            if (m.isArchived) return false;
            if (m.campus !== editMeetingForm.campus) return false;
            const mDate = new Date(m.date);
            return mDate >= range.start && mDate <= range.end;
        });
    }, [editMeetingForm?.date, editMeetingForm?.campus, editMeetingForm?._id, meetings]);

    const handleSaveMeetingEdit = async (e) => {
        e.preventDefault();
        if (!editMeetingForm || !editMeetingForm._id) return;

        const trimmedQuestion = (editMeetingForm.questionOfDay || '').trim();
        if (!trimmedQuestion) {
            showToast('Mandatory requirement: Please enter an interactive roll-call question for this meeting.', 'error');
            return;
        }

        if (['multiple_choice', 'checkboxes'].includes(editMeetingForm.questionType)) {
            const validOptions = (editMeetingForm.questionOptions || []).filter(o => o && o.trim());
            if (validOptions.length < 2) {
                showToast('Please provide at least 2 choices for your multiple choice / checkbox question.', 'error');
                return;
            }
        }

        const lat = Number(editMeetingForm.location.latitude);
        const lng = Number(editMeetingForm.location.longitude);
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            showToast('Mandatory requirement: Valid device GPS coordinates are required for the venue.', 'error');
            return;
        }

        if (editConflictMeeting && !editMeetingForm.allowMultiple) {
            showToast(`A meeting is already scheduled for ${editMeetingForm.campus} this week. Check the override toggle to save changes.`, 'warning');
            return;
        }

        setEditMeetingLoading(true);
        try {
            const payload = {
                name: editMeetingForm.name,
                date: editMeetingForm.date,
                campus: editMeetingForm.campus,
                startTime: editMeetingForm.startTime,
                endTime: editMeetingForm.endTime,
                allowMultiple: editMeetingForm.allowMultiple,
                questionType: editMeetingForm.questionType || 'text',
                questionOfDay: trimmedQuestion,
                questionOptions: (editMeetingForm.questionType === 'multiple_choice' || editMeetingForm.questionType === 'checkboxes')
                    ? editMeetingForm.questionOptions.filter(o => o && o.trim())
                    : [],
                location: {
                    name: editMeetingForm.location.name,
                    radius: Number(editMeetingForm.location.radius) || 200,
                    latitude: lat,
                    longitude: lng
                },
                isTestMeeting: editMeetingForm.isTestMeeting
            };

            const res = await api.put(`/meetings/${editMeetingForm._id}`, payload);
            showToast('Meeting updated successfully! 💾');
            setShowEditMeetingModal(false);

            const updated = res.data?.meeting || res.data || { ...editMeetingForm, ...payload };
            setMeetings(prev => prev.map(m => m._id === editMeetingForm._id ? { ...m, ...updated } : m));
            if (insightMeeting && insightMeeting._id === editMeetingForm._id) {
                setInsightMeeting(prev => ({ ...prev, ...updated }));
            }
        } catch (err) {
            console.error('Update meeting failed:', err);
            showToast(err.response?.data?.message || 'Could not update meeting', 'error');
        } finally {
            setEditMeetingLoading(false);
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

    const handleDeleteMeeting = async (meeting) => {
        if (!window.confirm(`Permanently DELETE meeting "${meeting.name}"?\n\nThis will remove the meeting and all associated check-in records immediately.`)) return;
        try {
            await api.delete(`/meetings/${meeting._id}`);
            showToast(`Meeting "${meeting.name}" deleted successfully`);
            setMeetings(prev => prev.filter(m => m._id !== meeting._id));
        } catch (err) {
            console.error('Delete meeting failed:', err);
            showToast(err.response?.data?.message || 'Failed to delete meeting', 'error');
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
            const scores = promotionScores[cadre._id] || { team: 4, base: 4, ropes: 4, rescue: 4, firstAid: 4, safety: 4, mentorship: 4 };
            const belay = customBelay || cadre.belayStatus || (
                nextRank === 'Intermediate Douloid' || nextRank === 'Lead Douloid' ? 'Primary Belayer Certified' :
                nextRank === 'Basic Douloid' ? 'Secondary Belayer' : 'Not Permitted'
            );
            const solo = customSolo !== undefined ? customSolo : (nextRank === 'Intermediate Douloid' || nextRank === 'Lead Douloid');

            await api.put(`/trainings/members/${cadre._id}/rank`, {
                douloidRank: nextRank,
                belayStatus: belay,
                soloStationAllowed: solo,
                notes: notes || `Promoted to ${nextRank} through G5 Evaluation. Avg Score: ${(Object.values(scores).reduce((a,b)=>a+b,0)/Object.values(scores).length).toFixed(1)}★`,
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

    // Real-Time Device Lock Removal (Phone Change / Reset Binding)
    const handleResetDeviceLock = async (member) => {
        if (!member) return;
        setResettingDeviceMemberId(member._id);
        try {
            const res = await api.post(`/members/${member._id}/reset-device`);
            showToast(res.data.message || `Device ID removed for ${member.name}! Phone lock cleared 📱🔓`);
            // Immediate real-time optimistic state updates across all rosters
            setMembers(prev => prev.map(m => (m._id === member._id || m.studentRegNo === member.studentRegNo) ? { ...m, linkedDeviceId: null } : m));
            setCadres(prev => prev.map(c => (c._id === member._id || c.studentRegNo === member.studentRegNo) ? { ...c, linkedDeviceId: null } : c));
            queryClient.invalidateQueries({ queryKey: ['portal-data'] });
        } catch (err) {
            console.error('Device reset error:', err);
            showToast(err.response?.data?.message || 'Failed to remove device ID', 'error');
        } finally {
            setResettingDeviceMemberId(null);
        }
    };

    // Quick Device Unlock via Admission Number
    const handleQuickUnlockByRegNo = async (regNo) => {
        const cleanReg = (regNo || quickUnlockQuery || '').trim();
        if (!cleanReg) {
            return showToast('Please enter a student admission number to unlock', 'error');
        }
        setQuickUnlockLoading(true);
        try {
            const res = await api.post(`/members/${encodeURIComponent(cleanReg)}/reset-device`);
            showToast(res.data.message || `Device unlocked for student ${cleanReg}! 📱🔓`);
            const updatedMember = res.data.member;
            if (updatedMember) {
                setMembers(prev => prev.map(m => (m._id === updatedMember._id || m.studentRegNo === updatedMember.studentRegNo) ? { ...m, linkedDeviceId: null } : m));
                setCadres(prev => prev.map(c => (c._id === updatedMember._id || c.studentRegNo === updatedMember.studentRegNo) ? { ...c, linkedDeviceId: null } : c));
            } else {
                setMembers(prev => prev.map(m => m.studentRegNo?.toUpperCase() === cleanReg.toUpperCase() ? { ...m, linkedDeviceId: null } : m));
                setCadres(prev => prev.map(c => c.studentRegNo?.toUpperCase() === cleanReg.toUpperCase() ? { ...c, linkedDeviceId: null } : c));
            }
            queryClient.invalidateQueries({ queryKey: ['portal-data'] });
            setShowQuickUnlockModal(false);
            setQuickUnlockQuery('');
        } catch (err) {
            console.error('Quick unlock error:', err);
            showToast(err.response?.data?.message || `Failed to unlock device for "${cleanReg}"`, 'error');
        } finally {
            setQuickUnlockLoading(false);
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

    // Promotion helper - correct sequential rank progression ladder (4 Levels)
    const getNextRank = (currentRank) => {
        if (!currentRank || currentRank === 'None' || currentRank === 'Recruit') return 'Shadow Douloid';
        switch (currentRank) {
            case 'Shadow Douloid': return 'Basic Douloid';
            case 'Basic Douloid': return 'Intermediate Douloid';
            case 'Intermediate Douloid': return 'Lead Douloid';
            case 'Lead Douloid': return 'Lead Douloid'; // Highest facilitator rank
            default: return 'Basic Douloid';
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 'Lead Douloid': return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
            case 'Intermediate Douloid': return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
            case 'Basic Douloid': return { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' };
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
        { id: 'graduations', label: 'Recruit Graduations', icon: GraduationCap, badge: g5Stats.totalRecruits || recruits.length },
        { id: 'promotions', label: 'Rank Promotions', icon: Award, badge: g5Stats.promotionsPending || cadres.filter(c => c.douloidRank === 'Shadow Douloid' || c.douloidRank === 'Basic Douloid').length },
        { id: 'cadres', label: 'Membership Roster', icon: Users },
        { id: 'contributions', label: 'Contributions', icon: CreditCard },
        { id: 'safety', label: 'Safety & Incidents', icon: ShieldAlert, badge: incidents.length > 0 ? incidents.length : null }
    ];

    // Standard LOPs from Database (fallback to reference documents if initial load)
    const lops = (lopDocs && lopDocs.length > 0) ? lopDocs : [
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
                        <div className="g5-brand-icon-box" title="Doulos G5 Logo">
                            <Logo size={34} showText={false} />
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
                        {renderUserAvatar(36, '0.85rem')}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                        {/* Mobile Brand (Shown on mobile viewports) */}
                        <div
                            className="g5-mobile-app-brand"
                            onClick={() => handleSelectTab('dashboard')}
                            style={{ display: 'none', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flexShrink: 0 }}
                        >
                            <div className="g5-brand-icon-box" style={{ width: '34px', height: '34px', borderRadius: '9px', padding: '2px' }} title="Doulos G5 Logo">
                                <Logo size={26} showText={false} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)', letterSpacing: '-0.2px' }}>
                                Doulos G5
                            </span>
                        </div>

                        <button
                            type="button"
                            className="g5-menu-toggle"
                            onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                            aria-label="Toggle Navigation Menu"
                        >
                            <Menu size={18} />
                        </button>

                        <div className="g5-search-wrap">
                            <Search size={17} />
                            <input
                                type="text"
                                placeholder="Search personnel, skills, sessions..."
                                className="g5-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px 4px' }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="g5-topbar-actions">
                        {activeMeetings.some(m => m.isActive) ? (
                            <button
                                type="button"
                                onClick={() => handleSelectTab('meetings')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    background: 'var(--color-status-active-soft)',
                                    border: '1px solid rgba(76, 175, 125, 0.3)',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '999px',
                                    cursor: 'pointer',
                                    color: 'var(--color-status-active)',
                                    fontWeight: 800,
                                    fontSize: '0.76rem'
                                }}
                            >
                                <span className="g5-pulse-dot" style={{ width: '6px', height: '6px' }} />
                                <span>Live Drill</span>
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.35rem 0.85rem', borderRadius: '999px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1D4ED8' }}></span>
                                <span className="g5-ministry-badge-text" style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1D4ED8' }}>
                                    Outdoor Ministry
                                </span>
                            </div>
                        )}

                        <div
                            className="g5-profile-block"
                            onClick={() => setMobileMoreOpen(true)}
                            style={{ cursor: 'pointer' }}
                            title="Open Menu & Modules"
                        >
                            {renderUserAvatar(34, '0.85rem')}
                            <div className="g5-profile-info">
                                <span className="g5-profile-name">{username}</span>
                                <span className="g5-profile-role">{userCampus}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* TOAST NOTIFICATION (RESPONSIVE & SCREEN-CONSTRAINED) */}
                {toast && (
                    <div style={{
                        position: 'fixed',
                        top: '1.25rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 99999,
                        width: 'calc(100% - 2rem)',
                        maxWidth: '460px',
                        boxSizing: 'border-box',
                        background: toast.type === 'error' ? '#DC2626' : (toast.type === 'warning' ? '#D97706' : '#1D4ED8'),
                        color: '#FFFFFF',
                        padding: '0.75rem 1rem',
                        borderRadius: '14px',
                        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.25), 0 4px 10px rgba(0,0,0,0.15)',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.65rem',
                        backdropFilter: 'blur(8px)',
                        border: '1.5px solid rgba(255, 255, 255, 0.25)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                            <span style={{ flexShrink: 0, display: 'flex' }}>
                                {toast.type === 'error' ? <AlertTriangle size={18} /> : (toast.type === 'warning' ? <AlertTriangle size={18} /> : <Sparkles size={18} />)}
                            </span>
                            <span style={{
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                lineHeight: 1.4,
                                fontSize: '0.84rem'
                            }}>
                                {toast.text}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: '#FFFFFF',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                marginLeft: '0.25rem'
                            }}
                        >
                            <X size={13} />
                        </button>
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
                                    <div className="g5-dashboard-live-banner">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                            <div className="g5-pulse-dot" style={{ width: '10px', height: '10px' }} />
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.98rem' }}>
                                                    Live Check-In Active: {activeM.name}
                                                </div>
                                                <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                                                    {activeM.location?.name || (activeM.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="g5-dashboard-banner-actions">
                                            <button
                                                className="g5-btn-blue-solid"
                                                onClick={() => setInsightMeeting({ ...activeM, initialTab: 'attended' })}
                                            >
                                                <Radio size={15} /> Open Live Feed
                                            </button>
                                            <button
                                                className="g5-btn-blue-soft"
                                                onClick={() => setInsightMeeting({ ...activeM, initialTab: 'attended' })}
                                            >
                                                <Users size={15} /> Who Attended ({activeM.attendanceCount ?? 0})
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 5 Glanceable Stat Cards in a Balanced Responsive Grid */}
                            {statsLoading ? (
                                <div className="g5-stat-grid">
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                </div>
                            ) : statsError ? (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <ErrorState message="Could not load G5 operational statistics." onRetry={refetchG5Stats} />
                                </div>
                            ) : (
                                <div className="g5-stat-grid">
                                    <div className="g5-stat-card">
                                        <div className="g5-stat-top">
                                            <span className="g5-stat-label">Overall Attendance</span>
                                            <div className="g5-stat-icon-wrap" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                                                <CalendarCheck size={19} />
                                            </div>
                                        </div>
                                        <div className="g5-stat-number" style={{ color: '#1D4ED8' }}>
                                            {g5Stats.attendancePercentage}%
                                        </div>
                                        <span style={{ fontSize: '0.74rem', color: '#2563EB', fontWeight: 700 }}>
                                            {g5Stats.totalAttended} attendances across {g5Stats.totalMeetingsCount || meetings.length} sessions
                                        </span>
                                    </div>

                                    <div className="g5-stat-card">
                                        <div className="g5-stat-top">
                                            <span className="g5-stat-label">Recruits Pipeline</span>
                                            <div className="g5-stat-icon-wrap" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                                                <GraduationCap size={19} />
                                            </div>
                                        </div>
                                        <div className="g5-stat-number" style={{ color: '#0284C7' }}>
                                            {g5Stats.totalRecruits}
                                        </div>
                                        <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                                            {g5Stats.totalRecruits > 0 ? `${g5Stats.archivedRecruitsCount} in holding archive` : 'No recruits enrolled currently'}
                                        </span>
                                    </div>

                                    <div className="g5-stat-card">
                                        <div className="g5-stat-top">
                                            <span className="g5-stat-label">Promotions Pending</span>
                                            <div className="g5-stat-icon-wrap" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                                <Award size={19} />
                                            </div>
                                        </div>
                                        <div className="g5-stat-number" style={{ color: '#1D4ED8' }}>
                                            {g5Stats.promotionsPending}
                                        </div>
                                        <span style={{ fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 700 }}>
                                            Shadow & Basic Douloids
                                        </span>
                                    </div>

                                    <div className="g5-stat-card">
                                        <div className="g5-stat-top">
                                            <span className="g5-stat-label">Upcoming Trainings</span>
                                            <div className="g5-stat-icon-wrap" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                                                <Compass size={19} />
                                            </div>
                                        </div>
                                        <div className="g5-stat-number" style={{ color: '#0284C7' }}>
                                            {g5Stats.upcomingTrainings}
                                        </div>
                                        <span style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 600 }}>
                                            {g5Stats.upcomingTrainings > 0 ? 'Active drill modules in DB' : `${trainings.length} completed in database`}
                                        </span>
                                    </div>

                                    <div className="g5-stat-card">
                                        <div className="g5-stat-top">
                                            <span className="g5-stat-label">Absentee Flags</span>
                                            <div className="g5-stat-icon-wrap" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                                                <AlertTriangle size={19} />
                                            </div>
                                        </div>
                                        <div className="g5-stat-number" style={{ color: '#D97706' }}>
                                            {g5Stats.absenteeFlags}
                                        </div>
                                        <span style={{ fontSize: '0.74rem', color: '#B45309', fontWeight: 700 }}>
                                            3+ consecutive misses
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Warm Glanceable Overview Cards */}
                            <div className="g5-overview-split">
                                <div className="g5-card g5-dashboard-session-card">
                                    <div className="g5-card-header">
                                        <div>
                                            <div className="g5-card-title">
                                                {nextUpcomingMeeting ? 'Next Scheduled Meeting / Session' : 'Next Scheduled Meeting / Session'}
                                            </div>
                                            <div className="g5-card-desc" style={{ color: nextUpcomingMeeting ? '#1D4ED8' : '#64748B', fontWeight: 700 }}>
                                                {nextUpcomingMeeting ? nextUpcomingMeeting.name : 'Term Intersession — No Live Session Today'}
                                            </div>
                                        </div>
                                        <span className={`g5-pill ${nextUpcomingMeeting?.isActive ? 'g5-pill-active' : nextUpcomingMeeting ? 'g5-pill-blue' : 'g5-pill-soft'}`}>
                                            <Check size={14} /> {nextUpcomingMeeting?.isActive ? 'Live Now' : nextUpcomingMeeting ? 'Scheduled' : 'Concluded Term'}
                                        </span>
                                    </div>

                                    {nextUpcomingMeeting ? (
                                        <div className="g5-dashboard-meeting-meta-grid">
                                            <div className="g5-dashboard-meta-item">
                                                <div className="g5-dashboard-meta-label">DATE & TIME</div>
                                                <div className="g5-dashboard-meta-val">
                                                    {new Date(nextUpcomingMeeting.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })} • {nextUpcomingMeeting.startTime || 'TBD'}
                                                </div>
                                            </div>
                                            <div className="g5-dashboard-meta-item">
                                                <div className="g5-dashboard-meta-label">LOCATION</div>
                                                <div className="g5-dashboard-meta-val">
                                                    {nextUpcomingMeeting.location?.name || nextUpcomingMeeting.venue || nextUpcomingMeeting.campus || 'Not specified'}
                                                </div>
                                            </div>
                                            <div className="g5-dashboard-meta-item">
                                                <div className="g5-dashboard-meta-label">CAMPUS</div>
                                                <div className="g5-dashboard-meta-val" style={{ color: '#1D4ED8' }}>
                                                    {nextUpcomingMeeting.campus || 'All Campuses'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="g5-dashboard-meeting-meta-grid">
                                            <div className="g5-dashboard-meta-item">
                                                <div className="g5-dashboard-meta-label">LATEST CONCLUDED</div>
                                                <div className="g5-dashboard-meta-val">
                                                    {meetings[0]?.name ? `${meetings[0].name} (${new Date(meetings[0].date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })})` : 'None in history'}
                                                </div>
                                            </div>
                                            <div className="g5-dashboard-meta-item">
                                                <div className="g5-dashboard-meta-label">ARCHIVED SESSIONS</div>
                                                <div className="g5-dashboard-meta-val">
                                                    {meetings.length} sessions logged in DB
                                                </div>
                                            </div>
                                            <div className="g5-dashboard-meta-item">
                                                <div className="g5-dashboard-meta-label">CAMPUS REGION</div>
                                                <div className="g5-dashboard-meta-val" style={{ color: '#1D4ED8' }}>
                                                    {meetings[0]?.campus || 'Athi River & VR'}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="g5-dashboard-card-actions">
                                        <button className="g5-btn-blue-solid" onClick={() => setActiveTab('graduations')}>
                                            <GraduationCap size={16} /> View Recruit Graduations ({recruits.length})
                                        </button>
                                        <button className="g5-btn-blue-soft" onClick={() => setActiveTab('meetings')}>
                                            <Calendar size={16} /> View Session Archive ({meetings.length})
                                        </button>
                                    </div>
                                </div>

                                <div className="g5-card g5-dashboard-belay-card">
                                    <div>
                                        <div className="g5-card-header" style={{ marginBottom: '1rem' }}>
                                            <div>
                                                <div className="g5-card-title">Belay Safety Readiness</div>
                                                <div className="g5-card-desc">Certified belayers in membership roster</div>
                                            </div>
                                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Shield size={20} />
                                            </div>
                                        </div>
                                        <div style={{ background: '#EFF6FF', padding: '1.1rem', borderRadius: '14px', border: '1.5px solid #BFDBFE' }}>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1D4ED8' }}>
                                                {cadres.filter(c => c.belayStatus === 'Primary Belayer Certified' || c.douloidRank === 'Lead Douloid' || c.douloidRank === 'Intermediate Douloid').length} Certified Belayers
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '0.35rem', fontWeight: 600 }}>
                                                {cadres.length > 0 
                                                    ? `Out of ${cadres.filter(c => c.douloidRank && c.douloidRank !== 'None').length} Douloids in active roster (${cadres.length} total active members registered).`
                                                    : 'Awaiting membership roster enrollment.'}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        className="g5-btn-blue-soft" 
                                        style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', padding: '0.72rem' }} 
                                        onClick={() => setActiveTab('cadres')}
                                    >
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
                                            <CalendarCheck size={18} style={{ color: '#1D4ED8' }} /> Inspect Specific Session Attendance & Live Feeds
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                            Click any session below to view full attendee roster, scan times, survey answers, or live ticker
                                        </div>
                                    </div>
                                    <button
                                        className="g5-btn-blue-soft"
                                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                                        onClick={() => setActiveTab('meetings')}
                                    >
                                        All Sessions ({meetings.length}) <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="g5-quick-sessions-container">
                                    {meetings.slice(0, 6).map((m) => (
                                        <div
                                            key={m._id || m.code}
                                            onClick={() => setInsightMeeting({ ...m, initialTab: 'attended' })}
                                            className={`g5-quick-session-card ${m.isActive ? 'is-active' : ''}`}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '0.18rem 0.55rem', borderRadius: '6px' }}>
                                                    {new Date(m.date).toLocaleDateString()}
                                                </span>
                                                <span className={`g5-pill ${m.isActive ? 'g5-pill-active' : 'g5-pill-blue'}`} style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem' }}>
                                                    {m.isActive ? 'Live' : 'Done'}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {m.name}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748B' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                                    <MapPin size={12} style={{ color: '#1D4ED8', flexShrink: 0 }} />
                                                    {m.location?.name || (m.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                                </span>
                                                <span style={{ fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                                                    {m.attendanceCount ?? 0} attended →
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ATTENDANCE TRACKING & MEMBER ROSTER */}
                            {(() => {
                                const filteredAttendanceMembers = members
                                    .filter(m => campusFilter === 'All' || m.campus === campusFilter)
                                    .filter(m => !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || (m.studentRegNo && m.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase())));

                                return (
                                    <div className="g5-card" style={{ padding: '1.35rem 1.5rem' }}>
                                        <div className="g5-card-header" style={{ marginBottom: '1.25rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                                    <div className="g5-card-title">Attendance Tracking</div>
                                                    <span className="g5-pill g5-pill-blue">
                                                        <Users size={13} /> {filteredAttendanceMembers.length} Members
                                                    </span>
                                                </div>
                                                <div className="g5-card-desc">Live member drill attendance, semester rollups, and pastoral absentee radar</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <select
                                                    className="g5-form-select"
                                                    style={{ width: '160px', padding: '0.55rem 0.85rem', borderColor: '#BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, borderRadius: '10px' }}
                                                    value={campusFilter}
                                                    onChange={(e) => setCampusFilter(e.target.value)}
                                                >
                                                    <option value="All">All Campuses</option>
                                                    <option value="Athi River">Athi River</option>
                                                    <option value="Valley Road">Valley Road</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* MOBILE ATTENDANCE CARDS (< 860px) */}
                                        <div className="g5-attendance-mobile-cards">
                                            {filteredAttendanceMembers.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
                                                    <Users size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                                                    <div style={{ fontWeight: 700 }}>No members found matching filter</div>
                                                </div>
                                            ) : (
                                                filteredAttendanceMembers.slice(0, 30).map((member) => {
                                                    const rate = member.totalPoints ? Math.min(100, Math.max(0, Math.round((member.totalPoints / 80) * 100))) : 0;
                                                    const isAbsentFlag = (member.consecutiveAbsences || 0) >= 2;
                                                    return (
                                                        <div key={member._id} className="g5-attendance-member-card">
                                                            {/* Top Row: Avatar + Name + RegNo + Active Status */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                                                    <div className="g5-avatar" style={{ width: '40px', height: '40px', fontSize: '0.95rem', flexShrink: 0, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                                                        {member.name.charAt(0)}
                                                                    </div>
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {member.name}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                                            {member.studentRegNo ? `${member.studentRegNo} • ` : ''}{member.campus}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className={`g5-pill ${member.isActive !== false ? 'g5-pill-active' : 'g5-pill-inactive'}`} style={{ flexShrink: 0 }}>
                                                                    {member.isActive !== false ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>

                                                            {/* Badges Row */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    <span style={{
                                                                        fontSize: '0.72rem',
                                                                        fontWeight: 800,
                                                                        padding: '0.2rem 0.55rem',
                                                                        borderRadius: '999px',
                                                                        background: member.memberType === 'Douloid' ? '#EFF6FF' : '#FEF3C7',
                                                                        color: member.memberType === 'Douloid' ? '#1D4ED8' : '#B45309',
                                                                        border: `1px solid ${member.memberType === 'Douloid' ? '#BFDBFE' : '#FDE68A'}`
                                                                    }}>
                                                                        {member.memberType || 'Recruit'}
                                                                    </span>

                                                                    {member.douloidRank && member.douloidRank !== 'None' && (
                                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '999px', background: '#F1F5F9', color: '#334155' }}>
                                                                            {member.douloidRank}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    {isAbsentFlag ? (
                                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', padding: '0.18rem 0.55rem', borderRadius: '999px' }}>
                                                                            ⚠️ {member.consecutiveAbsences} missed
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.18rem 0.55rem', borderRadius: '999px' }}>
                                                                            ✓ Nominal
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Attendance Rate Progress Bar */}
                                                            <div style={{ background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #DBEAFE' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>Attendance Rate</span>
                                                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: rate >= 80 ? '#1D4ED8' : '#D97706' }}>{rate}%</span>
                                                                </div>
                                                                <div style={{ width: '100%', height: '7px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${rate}%`, height: '100%', background: rate >= 80 ? 'linear-gradient(90deg, #1D4ED8, #3B82F6)' : 'linear-gradient(90deg, #D97706, #F59E0B)', borderRadius: '999px' }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* DESKTOP ATTENDANCE TABLE (>= 860px) */}
                                        <div className="g5-attendance-desktop-table g5-table-wrap">
                                            <table className="g5-table" style={{ minWidth: '820px' }}>
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
                                                    {filteredAttendanceMembers.slice(0, 30).map((member) => {
                                                        const rate = member.totalPoints ? Math.min(100, Math.max(0, Math.round((member.totalPoints / 80) * 100))) : 0;
                                                        const isAbsentFlag = (member.consecutiveAbsences || 0) >= 2;
                                                        return (
                                                            <tr key={member._id}>
                                                                <td>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                                        <div className="g5-avatar" style={{ width: '38px', height: '38px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                                                            {member.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{member.name}</div>
                                                                            {member.studentRegNo ? <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{member.studentRegNo}</div> : null}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ fontWeight: 600 }}>{member.campus}</td>
                                                                <td>
                                                                    <span style={{
                                                                        fontSize: '0.74rem',
                                                                        fontWeight: 800,
                                                                        padding: '0.22rem 0.6rem',
                                                                        borderRadius: '999px',
                                                                        background: member.memberType === 'Douloid' ? '#EFF6FF' : '#FEF3C7',
                                                                        color: member.memberType === 'Douloid' ? '#1D4ED8' : '#B45309',
                                                                        border: `1px solid ${member.memberType === 'Douloid' ? '#BFDBFE' : '#FDE68A'}`
                                                                    }}>
                                                                        {member.memberType || 'Recruit'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                                        <div style={{ flex: 1, maxWidth: '100px', height: '7px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                                                            <div style={{ width: `${rate}%`, height: '100%', background: rate >= 80 ? 'linear-gradient(90deg, #1D4ED8, #3B82F6)' : 'linear-gradient(90deg, #D97706, #F59E0B)' }} />
                                                                        </div>
                                                                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: rate >= 80 ? '#1D4ED8' : '#D97706' }}>{rate}%</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {isAbsentFlag ? (
                                                                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                                                            <AlertTriangle size={13} style={{ display: 'inline', marginRight: '3px' }} /> {member.consecutiveAbsences} missed
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.82rem', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.18rem 0.55rem', borderRadius: '999px' }}>
                                                                            ✓ Nominal
                                                                        </span>
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
                                );
                            })()}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: MEETINGS (CARDS WITH WHO ATTENDED & LIVE FEED) */}
                    {/* ========================================================= */}
                    {activeTab === 'meetings' && (
                        <div>
                            {/* TAB 3 HERO CARD & SEGMENTED CONTROLS (HIGH CONTRAST & MOBILE FIRST) */}
                            <div className="g5-meetings-hero-card">
                                <div className="g5-meetings-hero-top">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                        <div className="g5-meetings-hero-icon">
                                            <Calendar size={22} style={{ color: '#FFFFFF' }} />
                                        </div>
                                        <div>
                                            <h2 className="g5-meetings-hero-title">
                                                Training Meetings & Field Drills
                                            </h2>
                                            <p className="g5-meetings-hero-desc">
                                                Weekly sessions, live attendance check-ins, who attended rosters & archive vault
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="g5-meetings-cta-btn"
                                        onClick={handleOpenNewMeetingModal}
                                    >
                                        <Plus size={18} />
                                        <span>+ New Meeting</span>
                                    </button>
                                </div>

                                {/* MODERN SEGMENTED PILL SWITCH (NATIVE APP EXPERIENCE) */}
                                <div className="g5-meetings-segmented-bar">
                                    <button
                                        type="button"
                                        onClick={() => setMeetingSubTab('active')}
                                        className={`g5-segmented-item ${meetingSubTab === 'active' ? 'active-blue' : ''}`}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <Calendar size={16} />
                                            <span>Active & Recent Sessions</span>
                                        </span>
                                        <span className={`g5-segmented-counter ${meetingSubTab === 'active' ? 'counter-blue' : ''}`}>
                                            {activeMeetings.length}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMeetingSubTab('archived')}
                                        className={`g5-segmented-item ${meetingSubTab === 'archived' ? 'active-amber' : ''}`}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <Archive size={16} />
                                            <span>Archived Sessions Vault</span>
                                        </span>
                                        <span className={`g5-segmented-counter ${meetingSubTab === 'archived' ? 'counter-amber' : ''}`}>
                                            {archivedMeetings.length}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* SEARCH & FILTERS BAR (CRISP BLUE ACCENT & TOUCH PILLS) */}
                            <div style={{
                                background: '#FFFFFF',
                                border: '1.5px solid #DBEAFE',
                                borderRadius: '16px',
                                padding: '1rem 1.25rem',
                                marginBottom: '1.5rem',
                                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                                        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#2563EB' }} />
                                            <input
                                                type="text"
                                                placeholder="Search meeting by name or code..."
                                                value={meetingSearch}
                                                onChange={(e) => setMeetingSearch(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid #CBD5E1',
                                                    background: '#F8FAFC',
                                                    color: '#0F172A',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600,
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        {/* TOUCH-FRIENDLY CAMPUS CHIPS (HIGH CONTRAST & VISIBLE) */}
                                        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                                            {['All', 'Athi River', 'Valley Road'].map((campus) => {
                                                const isSelected = meetingCampusFilter === campus;
                                                return (
                                                    <button
                                                        key={campus}
                                                        type="button"
                                                        onClick={() => setMeetingCampusFilter(campus)}
                                                        style={{
                                                            padding: '0.55rem 0.95rem',
                                                            borderRadius: '999px',
                                                            border: isSelected ? '2px solid #1D4ED8' : '1.5px solid #CBD5E1',
                                                            background: isSelected ? '#1D4ED8' : '#FFFFFF',
                                                            color: isSelected ? '#FFFFFF' : '#0F172A',
                                                            fontWeight: isSelected ? 800 : 700,
                                                            fontSize: '0.84rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease',
                                                            boxShadow: isSelected ? '0 3px 10px rgba(29, 78, 216, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)'
                                                        }}
                                                    >
                                                        {campus === 'All' ? '🌐 All Campuses' : campus}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* BATCH ARCHIVE ACTION BUTTON IN ACTIVE VIEW */}
                                    {meetingSubTab === 'active' && (() => {
                                        const completedPast = activeMeetings.filter(m => !m.isActive);
                                        return completedPast.length > 0 ? (
                                            <button
                                                type="button"
                                                className="g5-btn-archive-amber"
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
                                    {/* ACTIVE LIVE BANNER IF ANY SESSION IS LIVE (ROYAL BLUE HERO) */}
                                    {filteredActiveMeetings.filter(m => m.isActive).length > 0 && (() => {
                                        const activeM = filteredActiveMeetings.filter(m => m.isActive)[0];
                                        return (
                                            <div className="g5-live-banner">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '14px',
                                                        height: '14px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#10B981',
                                                        boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.35)',
                                                        animation: 'g5Pulse 1.6s infinite',
                                                        flexShrink: 0
                                                    }} />
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <span style={{
                                                                background: '#10B981',
                                                                color: '#FFFFFF',
                                                                fontWeight: 800,
                                                                fontSize: '0.72rem',
                                                                padding: '2px 8px',
                                                                borderRadius: '999px',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                LIVE SESSION ACTIVE
                                                            </span>
                                                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                                                                {activeM.name}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '0.86rem', color: '#DBEAFE', marginTop: '0.25rem' }}>
                                                            📍 {activeM.location?.name || (activeM.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="g5-live-banner-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => setInsightMeeting({ ...activeM, initialTab: 'qrcode' })}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
                                                            color: '#FFFFFF',
                                                            border: 'none',
                                                            borderRadius: '12px',
                                                            padding: '0.65rem 1.15rem',
                                                            fontSize: '0.86rem',
                                                            fontWeight: 800,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.45rem',
                                                            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                                                        }}
                                                    >
                                                        <QrCode size={16} /> QR Screen
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setInsightMeeting({ ...activeM, initialTab: 'attended' })}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                                            color: '#FFFFFF',
                                                            border: 'none',
                                                            borderRadius: '12px',
                                                            padding: '0.65rem 1.15rem',
                                                            fontSize: '0.86rem',
                                                            fontWeight: 800,
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
                                                            transition: 'all 0.18s ease'
                                                        }}
                                                    >
                                                        <Radio size={16} />
                                                        <span>Live Attendance Feed</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setInsightMeeting({ ...activeM, initialTab: 'attended' })}
                                                        style={{
                                                            background: '#FFFFFF',
                                                            color: '#1D4ED8',
                                                            border: '2px solid #BFDBFE',
                                                            borderRadius: '12px',
                                                            padding: '0.65rem 1.15rem',
                                                            fontSize: '0.86rem',
                                                            fontWeight: 800,
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.15)',
                                                            transition: 'all 0.18s ease'
                                                        }}
                                                    >
                                                        <Users size={16} />
                                                        <span>Who Attended ({activeM.attendanceCount ?? 0})</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {filteredActiveMeetings.length === 0 ? (
                                        <div style={{
                                            background: '#FFFFFF',
                                            border: '2px solid #BFDBFE',
                                            borderRadius: '20px',
                                            textAlign: 'center',
                                            padding: '3.5rem 1.5rem',
                                            boxShadow: '0 6px 24px rgba(37, 99, 235, 0.08)'
                                        }}>
                                            <div style={{
                                                width: '68px',
                                                height: '68px',
                                                margin: '0 auto 1.25rem',
                                                fontSize: '2rem',
                                                background: '#EFF6FF',
                                                border: '2px solid #93C5FD',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#1D4ED8',
                                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)'
                                            }}>
                                                📅
                                            </div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
                                                {meetingSearch || meetingCampusFilter !== 'All' ? 'No Matching Active Meetings Found' : 'No Active Meetings Scheduled'}
                                            </h3>
                                            <p style={{ fontSize: '0.92rem', color: '#334155', maxWidth: '480px', margin: '0.5rem auto 1.5rem', lineHeight: 1.5, fontWeight: 500 }}>
                                                {meetingSearch || meetingCampusFilter !== 'All'
                                                    ? 'Try clearing your search query or switching campus filters.'
                                                    : archivedMeetings.length > 0
                                                        ? `All current sessions (${archivedMeetings.length} meetings) are stored safely in the Archived Sessions Vault. You can open the vault below or schedule a new active session.`
                                                        : 'Schedule a new drill or weekly fellowship meeting using the button below.'}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <button type="button" className="g5-btn-blue-solid" onClick={handleOpenNewMeetingModal}>
                                                    <Plus size={18} /> Schedule New Meeting
                                                </button>
                                                {archivedMeetings.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="g5-btn-archive-amber"
                                                        style={{ padding: '0.72rem 1.25rem', fontSize: '0.88rem' }}
                                                        onClick={() => setMeetingSubTab('archived')}
                                                    >
                                                        <Archive size={17} /> Open Archived Sessions Vault ({archivedMeetings.length}) 🗄️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="g5-meetings-grid">
                                            {filteredActiveMeetings.map((meeting) => (
                                                <div
                                                    key={meeting._id || meeting.code || meeting.date}
                                                    className={`g5-meeting-card-v2 ${meeting.isActive ? 'active-session' : ''}`}
                                                    onClick={() => setInsightMeeting({ ...meeting, initialTab: 'attended' })}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div>
                                                        {/* CARD TOP META */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            <span style={{
                                                                background: '#EFF6FF',
                                                                color: '#1D4ED8',
                                                                border: '1px solid #BFDBFE',
                                                                padding: '0.3rem 0.65rem',
                                                                borderRadius: '8px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 700,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem'
                                                            }}>
                                                                <Calendar size={13} style={{ flexShrink: 0 }} /> {new Date(meeting.date).toLocaleDateString()}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    background: meeting.isActive ? '#ECFDF5' : '#F1F5F9',
                                                                    color: meeting.isActive ? '#047857' : '#475569',
                                                                    border: meeting.isActive ? '1.5px solid #A7F3D0' : '1.5px solid #CBD5E1',
                                                                    padding: '0.3rem 0.7rem',
                                                                    borderRadius: '999px',
                                                                    fontSize: '0.76rem',
                                                                    fontWeight: 800,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.35rem',
                                                                    flexShrink: 0
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setInsightMeeting({ ...meeting, initialTab: 'attended' });
                                                                }}
                                                            >
                                                                {meeting.isActive ? (
                                                                    <>
                                                                        <div className="g5-pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: '#10B981' }} />
                                                                        Live • Active
                                                                    </>
                                                                ) : (
                                                                    'Completed'
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* TITLE */}
                                                        <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.55rem', lineHeight: 1.35, wordBreak: 'break-word' }}>
                                                            {meeting.name || 'Weekly Training Drill'}
                                                        </h3>

                                                        {/* TIME & LOCATION */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.86rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                                                            <Clock size={15} style={{ color: '#2563EB', flexShrink: 0 }} /> <span>{meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}</span>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.86rem', marginBottom: '0.85rem', fontWeight: 600 }}>
                                                            <MapPin size={15} style={{ color: '#2563EB', flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.location?.name || meeting.venue || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}</span>
                                                        </div>
                                                    </div>

                                                    {/* CARD ACTION BUTTONS (MOBILE & DESKTOP OPTIMIZED TWO-TIER SYSTEM) */}
                                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                                        {meeting.isActive ? (
                                                            <>
                                                                {/* TIER 1: PRIMARY ACTION (FULL WIDTH TOUCH BUTTON) */}
                                                                <button
                                                                    type="button"
                                                                    className="g5-btn-blue-solid"
                                                                    style={{ width: '100%', padding: '0.72rem 0.75rem' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setInsightMeeting({ ...meeting, initialTab: 'attended' });
                                                                    }}
                                                                >
                                                                    <Radio size={16} style={{ flexShrink: 0 }} /> <span>Live Attendance Feed & Check-In</span>
                                                                </button>

                                                                {/* TIER 2: SECONDARY TOUCH GRID (ALL SOLID VIBRANT COLORS) */}
                                                                <div className="g5-meeting-actions-grid">
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-qr-cyan"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setInsightMeeting({ ...meeting, initialTab: 'qrcode' });
                                                                        }}
                                                                        title="Display QR code on screen"
                                                                    >
                                                                        <QrCode size={14} style={{ flexShrink: 0 }} /> <span>Display QR</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-edit-indigo"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenEditMeeting(meeting);
                                                                        }}
                                                                        title="Edit meeting details, timings, question or location"
                                                                    >
                                                                        <Edit size={14} style={{ flexShrink: 0 }} /> <span>Edit</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-archive-amber"
                                                                        title="Archive this active meeting session"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleArchiveMeeting(meeting);
                                                                        }}
                                                                    >
                                                                        <Archive size={14} style={{ flexShrink: 0 }} /> <span>Archive</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-delete-rose"
                                                                        title="Permanently delete this meeting"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteMeeting(meeting);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} style={{ flexShrink: 0 }} /> <span>Delete</span>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* TIER 1: PRIMARY ACTION */}
                                                                <button
                                                                    type="button"
                                                                    className="g5-btn-blue-soft"
                                                                    style={{ width: '100%', padding: '0.72rem 0.75rem' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setInsightMeeting({ ...meeting, initialTab: 'attended' });
                                                                    }}
                                                                >
                                                                    <Users size={16} style={{ flexShrink: 0 }} /> <span>Who Attended ({meeting.attendanceCount ?? 0})</span>
                                                                </button>

                                                                {/* TIER 2: SECONDARY ACTIONS GRID */}
                                                                <div className="g5-meeting-actions-grid">
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-qr-cyan"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setInsightMeeting({ ...meeting, initialTab: 'qrcode' });
                                                                        }}
                                                                        title="Display QR code"
                                                                    >
                                                                        <QrCode size={14} style={{ flexShrink: 0 }} /> <span>Display QR</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-edit-indigo"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenEditMeeting(meeting);
                                                                        }}
                                                                        title="Edit meeting details, timings, question or location"
                                                                    >
                                                                        <Edit size={14} style={{ flexShrink: 0 }} /> <span>Edit</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-archive-amber"
                                                                        title="Archive this completed session (attendance records remain safe in database)"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleArchiveMeeting(meeting);
                                                                        }}
                                                                    >
                                                                        <Archive size={14} style={{ flexShrink: 0 }} /> <span>Archive</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-delete-rose"
                                                                        title="Permanently delete this meeting"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteMeeting(meeting);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} style={{ flexShrink: 0 }} /> <span>Delete</span>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* ARCHIVED MEETINGS VIEW (SAFE REPOSITORY - BLUE & GOLD) */}
                            {/* ========================================================= */}
                            {meetingSubTab === 'archived' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                                    {/* ARCHIVE NOTICE BANNER (SOLID BLUE VAULT BANNER) */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                        border: '1.5px solid #93C5FD',
                                        borderRadius: '16px',
                                        padding: '1.25rem 1.5rem',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1rem',
                                        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)'
                                    }}>
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '12px',
                                            backgroundColor: '#1D4ED8',
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)'
                                        }}>
                                            <Archive size={22} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>
                                                    Archived Meeting Sessions Repository
                                                </h3>
                                                <span style={{
                                                    background: '#10B981',
                                                    color: '#FFFFFF',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 800,
                                                    padding: '2px 8px',
                                                    borderRadius: '999px'
                                                }}>
                                                    🔒 Attendance Safely Preserved in Database
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.86rem', color: '#1E40AF', marginTop: '0.35rem', lineHeight: 1.5 }}>
                                                Archived meetings retain all member check-ins, attendance logs, and student points in MongoDB. You can inspect rosters, export reports, or restore any meeting back to the active list at any time.
                                            </p>
                                        </div>
                                    </div>

                                    {filteredArchivedMeetings.length === 0 ? (
                                        <div style={{
                                            background: '#FFFFFF',
                                            border: '1.5px solid #DBEAFE',
                                            borderRadius: '18px',
                                            textAlign: 'center',
                                            padding: '3.5rem 1.5rem',
                                            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.05)'
                                        }}>
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                margin: '0 auto 1.25rem',
                                                fontSize: '1.8rem',
                                                backgroundColor: '#EFF6FF',
                                                color: '#1D4ED8',
                                                border: '1.5px solid #BFDBFE',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                🗄️
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                                                No Meetings in Archive
                                            </h3>
                                            <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '420px', margin: '0.5rem auto 0' }}>
                                                Completed meetings from previous weeks or past semesters can be archived to keep your active dashboard clean.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="g5-meetings-grid">
                                            {filteredArchivedMeetings.map((meeting) => (
                                                <div
                                                    key={meeting._id || meeting.code || meeting.date}
                                                    className="g5-meeting-card-v2"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setInsightMeeting({ ...meeting, initialTab: 'attended' })}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            <span style={{
                                                                background: '#EFF6FF',
                                                                color: '#1D4ED8',
                                                                border: '1px solid #BFDBFE',
                                                                padding: '0.3rem 0.65rem',
                                                                borderRadius: '8px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 700,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem'
                                                            }}>
                                                                <Calendar size={13} style={{ flexShrink: 0 }} /> {new Date(meeting.date).toLocaleDateString()}
                                                            </span>
                                                            <span style={{
                                                                background: '#FFFBEB',
                                                                color: '#B45309',
                                                                border: '1.5px solid #FDE68A',
                                                                padding: '0.3rem 0.7rem',
                                                                borderRadius: '999px',
                                                                fontSize: '0.76rem',
                                                                fontWeight: 800,
                                                                flexShrink: 0
                                                            }}>
                                                                🗄️ Archived {meeting.archivedAt ? `• ${new Date(meeting.archivedAt).toLocaleDateString()}` : ''}
                                                            </span>
                                                        </div>

                                                        <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.55rem', lineHeight: 1.35, wordBreak: 'break-word' }}>
                                                            {meeting.name || 'Weekly Training Drill'}
                                                        </h3>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.86rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                                                            <Clock size={15} style={{ color: '#2563EB', flexShrink: 0 }} /> <span>{meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}</span>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.86rem', marginBottom: '0.85rem', fontWeight: 600 }}>
                                                            <MapPin size={15} style={{ color: '#2563EB', flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.location?.name || meeting.venue || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}</span>
                                                        </div>
                                                    </div>

                                                    {/* TWO-TIER ACTION BUTTONS */}
                                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                                        {/* TIER 1: WHO ATTENDED FULL-WIDTH TOUCH */}
                                                        <button
                                                            type="button"
                                                            className="g5-btn-blue-soft"
                                                            style={{ width: '100%', padding: '0.72rem 0.75rem' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setInsightMeeting({ ...meeting, initialTab: 'attended' });
                                                            }}
                                                        >
                                                            <Users size={16} style={{ flexShrink: 0 }} /> <span>Who Attended ({meeting.attendanceCount ?? 0})</span>
                                                        </button>

                                                        {/* TIER 2: SECONDARY TOUCH GRID */}
                                                        <div className="g5-meeting-actions-grid">
                                                            <button
                                                                type="button"
                                                                className="g5-btn-qr-cyan"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setInsightMeeting({ ...meeting, initialTab: 'qrcode' });
                                                                }}
                                                                title="Display QR code"
                                                            >
                                                                <QrCode size={14} style={{ flexShrink: 0 }} /> <span>Display QR</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="g5-btn-edit-indigo"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenEditMeeting(meeting);
                                                                }}
                                                                title="Edit meeting details"
                                                            >
                                                                <Edit size={14} style={{ flexShrink: 0 }} /> <span>Edit</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="g5-btn-restore-indigo"
                                                                title="Restore this meeting back to active & recent sessions"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUnarchiveMeeting(meeting);
                                                                }}
                                                            >
                                                                <RotateCcw size={14} style={{ flexShrink: 0 }} /> <span>Restore</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="g5-btn-delete-rose"
                                                                title="Permanently delete this meeting"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteMeeting(meeting);
                                                                }}
                                                            >
                                                                <Trash2 size={14} style={{ flexShrink: 0 }} /> <span>Delete</span>
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
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                    <span>{recruit.studentRegNo}</span>
                                                                    <span>•</span>
                                                                    <span>{recruit.campus}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleResetDeviceLock(recruit)}
                                                                        disabled={resettingDeviceMemberId === recruit._id}
                                                                        title={recruit.linkedDeviceId ? "Locked to phone device. Click to unlink/reset" : "Phone is unlocked. Click to clear"}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '3px',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 700,
                                                                            padding: '0.12rem 0.45rem',
                                                                            borderRadius: '999px',
                                                                            border: recruit.linkedDeviceId ? '1px solid #BFDBFE' : '1px solid var(--color-border)',
                                                                            background: recruit.linkedDeviceId ? '#EFF6FF' : 'var(--color-page-bg)',
                                                                            color: recruit.linkedDeviceId ? '#1D4ED8' : 'var(--color-text-muted)',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.15s ease'
                                                                        }}
                                                                    >
                                                                        <Smartphone size={10} />
                                                                        {resettingDeviceMemberId === recruit._id ? 'Clearing...' : recruit.linkedDeviceId ? 'Bound' : 'Free'}
                                                                    </button>
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
                                    { id: 'Shadow Douloid', label: 'Shadow Facilitators', count: cadres.filter(c => c.douloidRank === 'Shadow Douloid').length, color: '#7E22CE' },
                                    { id: 'Basic Douloid', label: 'Basic Facilitators', count: cadres.filter(c => c.douloidRank === 'Basic Douloid').length, color: '#4F46E5' },
                                    { id: 'Intermediate Douloid', label: 'Intermediate Facilitators', count: cadres.filter(c => c.douloidRank === 'Intermediate Douloid').length, color: '#0284C7' },
                                    { id: 'Lead Douloid', label: 'Lead Facilitators', count: cadres.filter(c => c.douloidRank === 'Lead Douloid').length, color: '#D97706' }
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
                                <div className="g5-batch-action-bar">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#FFFFFF',
                                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                                            flexShrink: 0
                                        }}>
                                            <Award size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
                                                {selectedCadres.length} Student{selectedCadres.length > 1 ? 's' : ''} Selected for Batch Promotion
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#C7D2FE', marginTop: '0.15rem' }}>
                                                Assign target rank, belay certification, and safety station clearances simultaneously.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="g5-batch-controls-grid">
                                        {/* Target Rank Picker */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '150px' }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Rank</label>
                                            <select
                                                value={batchRank}
                                                onChange={(e) => {
                                                    const r = e.target.value;
                                                    setBatchRank(r);
                                                    if (r === 'Lead Douloid' || r === 'Intermediate Douloid') {
                                                        setBatchBelayStatus('Primary Belayer Certified');
                                                        setBatchSoloAllowed(true);
                                                    } else if (r === 'Basic Douloid') {
                                                        setBatchBelayStatus('Secondary Belayer');
                                                        setBatchSoloAllowed(false);
                                                    } else if (r === 'Shadow Douloid' || r === 'None') {
                                                        setBatchBelayStatus('Not Permitted');
                                                        setBatchSoloAllowed(false);
                                                    }
                                                }}
                                                style={{
                                                    background: '#FFFFFF',
                                                    color: '#1E1B4B',
                                                    border: 'none',
                                                    padding: '0.6rem 0.85rem',
                                                    borderRadius: '10px',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                <option value="Shadow Douloid">Shadow Douloid</option>
                                                <option value="Basic Douloid">Basic Douloid</option>
                                                <option value="Intermediate Douloid">Intermediate Douloid</option>
                                                <option value="Lead Douloid">Lead Douloid</option>
                                            </select>
                                        </div>

                                        {/* Belay Clearance Picker */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '170px' }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Belay Clearance</label>
                                            <select
                                                value={batchBelayStatus}
                                                onChange={(e) => setBatchBelayStatus(e.target.value)}
                                                disabled={batchRank === 'Shadow Douloid' || batchRank === 'None'}
                                                style={{
                                                    background: '#FFFFFF',
                                                    color: '#1E1B4B',
                                                    border: 'none',
                                                    padding: '0.6rem 0.85rem',
                                                    borderRadius: '10px',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    opacity: (batchRank === 'Shadow Douloid' || batchRank === 'None') ? 0.6 : 1,
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                <option value="Not Permitted">Not Permitted</option>
                                                <option value="Secondary Belayer">Secondary Belayer</option>
                                                <option value="Primary Belayer Certified">Primary Belayer Certified</option>
                                            </select>
                                        </div>

                                        {/* Solo Station Checkbox */}
                                        <label style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            cursor: (batchRank === 'Shadow Douloid' || batchRank === 'None') ? 'not-allowed' : 'pointer',
                                            opacity: (batchRank === 'Shadow Douloid' || batchRank === 'None') ? 0.5 : 1,
                                            background: 'rgba(255, 255, 255, 0.12)',
                                            padding: '0.55rem 0.9rem',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            userSelect: 'none'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={batchSoloAllowed}
                                                disabled={batchRank === 'Shadow Douloid' || batchRank === 'None'}
                                                onChange={(e) => setBatchSoloAllowed(e.target.checked)}
                                                style={{ width: '16px', height: '16px', accentColor: '#E8A33D', cursor: 'pointer' }}
                                            />
                                            Solo Station Cleared
                                        </label>

                                        {/* Batch Promote Button */}
                                        <div className="g5-batch-btn-wrap">
                                            <button
                                                type="button"
                                                className="g5-btn-warm"
                                                style={{
                                                    padding: '0.62rem 1.4rem',
                                                    fontSize: '0.88rem',
                                                    fontWeight: 800,
                                                    borderRadius: '10px',
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
                                </div>
                            )}

                            {/* MOBILE FACILITATOR CARDS (< 860px) */}
                            <div className="g5-promotion-mobile-cards">
                                {filteredCadres.length === 0 ? (
                                    <div className="g5-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                                        <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>No Douloids match your filters</div>
                                        <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Try clearing your search query or selecting "All Douloids".</div>
                                    </div>
                                ) : (
                                    filteredCadres.map((cadre) => {
                                        const currentRank = cadre.douloidRank || 'None';
                                        const nextRank = getNextRank(currentRank);
                                        const currentColor = getRankColor(currentRank);
                                        const nextColor = getRankColor(nextRank);
                                        const isSelected = selectedCadres.includes(cadre._id);

                                        return (
                                            <div 
                                                key={cadre._id}
                                                className="g5-card"
                                                style={{
                                                    padding: '1.15rem',
                                                    borderRadius: '16px',
                                                    border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                    backgroundColor: isSelected ? 'rgba(107, 95, 168, 0.04)' : '#FFFFFF',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.85rem'
                                                }}
                                            >
                                                {/* Card Header: Checkbox + Avatar + Name + Campus */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                setSelectedCadres(prev => 
                                                                    prev.includes(cadre._id) ? prev.filter(id => id !== cadre._id) : [...prev, cadre._id]
                                                                );
                                                            }}
                                                            style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer', flexShrink: 0 }}
                                                        />
                                                        <div className="g5-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', flexShrink: 0 }}>
                                                            {cadre.name.charAt(0)}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {cadre.name}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                                {cadre.studentRegNo ? <span>{cadre.studentRegNo} • </span> : null}
                                                                <span style={{ fontWeight: 600 }}>{cadre.campus}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleResetDeviceLock(cadre)}
                                                                    disabled={resettingDeviceMemberId === cadre._id}
                                                                    title={cadre.linkedDeviceId ? "Locked to phone. Click to unlink/reset" : "Device is unlocked. Click to clear"}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '3px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 700,
                                                                        padding: '0.1rem 0.45rem',
                                                                        borderRadius: '999px',
                                                                        border: cadre.linkedDeviceId ? '1px solid #BFDBFE' : '1px solid var(--color-border)',
                                                                        background: cadre.linkedDeviceId ? '#EFF6FF' : 'var(--color-page-bg)',
                                                                        color: cadre.linkedDeviceId ? '#1D4ED8' : 'var(--color-text-muted)',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.15s ease'
                                                                    }}
                                                                >
                                                                    <Smartphone size={10} />
                                                                    {resettingDeviceMemberId === cadre._id ? '...' : cadre.linkedDeviceId ? 'Locked' : 'Free'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span style={{
                                                        background: currentColor.bg,
                                                        color: currentColor.text,
                                                        border: `1px solid ${currentColor.border}`,
                                                        padding: '0.2rem 0.55rem',
                                                        borderRadius: '999px',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        flexShrink: 0
                                                    }}>
                                                        {currentRank}
                                                    </span>
                                                </div>

                                                {/* Rank Progression Strip */}
                                                <div style={{
                                                    background: 'var(--color-page-bg)',
                                                    borderRadius: '10px',
                                                    padding: '0.65rem 0.85rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    border: '1px solid var(--color-border)',
                                                    gap: '0.5rem',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>Target:</span>
                                                        <span style={{
                                                            background: nextColor.bg,
                                                            color: nextColor.text,
                                                            border: `1px solid ${nextColor.border}`,
                                                            padding: '0.18rem 0.55rem',
                                                            borderRadius: '6px',
                                                            fontWeight: 800,
                                                            fontSize: '0.74rem'
                                                        }}>
                                                            {nextRank}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem' }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{cadre.belayStatus || 'Not Permitted'}</span>
                                                        {cadre.soloStationAllowed && (
                                                            <span style={{ color: 'var(--color-status-active)', fontWeight: 800 }}>• Solo ✓</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-secondary"
                                                        style={{ padding: '0.55rem 0.65rem', fontSize: '0.82rem', justifyContent: 'center' }}
                                                        onClick={() => {
                                                            setEvaluatingCadre(cadre);
                                                            if (!promotionScores[cadre._id]) {
                                                                setPromotionScores(prev => ({
                                                                    ...prev,
                                                                    [cadre._id]: { team: 4, base: 4, ropes: 4, rescue: 4, firstAid: 4, safety: 4, mentorship: 4 }
                                                                }));
                                                            }
                                                        }}
                                                    >
                                                        <Sliders size={14} /> 7-Area Eval
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="g5-btn-warm"
                                                        style={{ padding: '0.55rem 0.65rem', fontSize: '0.82rem', justifyContent: 'center' }}
                                                        onClick={() => handleConfirmPromotion(cadre, nextRank)}
                                                    >
                                                        <Award size={14} /> Promote
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* DESKTOP CADRES PROMOTION ROSTER TABLE (>= 860px) */}
                            <div className="g5-promotion-desktop-table g5-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="g5-table-wrap">
                                    <table className="g5-table" style={{ minWidth: '920px' }}>
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
                                                                        {cadre.studentRegNo ? (
                                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                                {cadre.studentRegNo}
                                                                            </div>
                                                                        ) : null}
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
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem', alignItems: 'center' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-outline"
                                                                        style={{
                                                                            width: '32px',
                                                                            height: '32px',
                                                                            padding: 0,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            borderRadius: '8px',
                                                                            borderColor: cadre.linkedDeviceId ? '#BFDBFE' : 'var(--color-border)',
                                                                            color: cadre.linkedDeviceId ? '#1D4ED8' : 'var(--color-text-muted)',
                                                                            background: cadre.linkedDeviceId ? '#EFF6FF' : 'transparent'
                                                                        }}
                                                                        disabled={resettingDeviceMemberId === cadre._id}
                                                                        onClick={() => handleResetDeviceLock(cadre)}
                                                                        title={cadre.linkedDeviceId ? "Locked to phone device. Click to reset/unlink" : "Device is unlocked (click to clear)"}
                                                                    >
                                                                        {resettingDeviceMemberId === cadre._id ? (
                                                                            <RefreshCw size={13} className="g5-spin" />
                                                                        ) : (
                                                                            <Smartphone size={13} />
                                                                        )}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-secondary"
                                                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                                                                        onClick={() => {
                                                                            setEvaluatingCadre(cadre);
                                                                            if (!promotionScores[cadre._id]) {
                                                                                setPromotionScores(prev => ({
                                                                                    ...prev,
                                                                                    [cadre._id]: { team: 4, base: 4, ropes: 4, rescue: 4, firstAid: 4, safety: 4, mentorship: 4 }
                                                                                }));
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Sliders size={13} /> 7-Area Eval
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-warm"
                                                                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                                                                        onClick={() => handleConfirmPromotion(cadre, nextRank)}
                                                                    >
                                                                        <Award size={13} /> Promote
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

                            {/* 7-AREA EVALUATION MODAL */}
                            {evaluatingCadre && (() => {
                                const cadre = evaluatingCadre;
                                const currentRank = cadre.douloidRank || 'None';
                                const nextRank = getNextRank(currentRank);
                                const scores = promotionScores[cadre._id] || { team: 4, base: 4, ropes: 4, rescue: 4, firstAid: 4, safety: 4, mentorship: 4 };
                                const avgScore = (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1);
                                const numAvg = Number(avgScore);

                                const updateScore = (domain, val) => {
                                    setPromotionScores(prev => ({
                                        ...prev,
                                        [cadre._id]: {
                                            ...(prev[cadre._id] || { team: 4, base: 4, ropes: 4, rescue: 4, firstAid: 4, safety: 4, mentorship: 4 }),
                                            [domain]: Number(val)
                                        }
                                    }));
                                };

                                const targetBelay = (nextRank === 'Lead Douloid' || nextRank === 'Intermediate Douloid') 
                                    ? 'Primary Belayer Certified' 
                                    : (nextRank === 'Basic Douloid' ? 'Secondary Belayer' : 'Not Permitted');
                                
                                const targetSolo = (nextRank === 'Lead Douloid' || nextRank === 'Intermediate Douloid');

                                return (
                                    <div className="g5-eval-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setEvaluatingCadre(null); }}>
                                        <div className="g5-eval-modal-card">
                                            {/* Header */}
                                            <div className="g5-eval-modal-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                    <div className="g5-avatar" style={{ width: '46px', height: '46px', fontSize: '1.15rem' }}>
                                                        {cadre.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                                                            {cadre.name}
                                                        </h3>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                                            {cadre.studentRegNo ? `${cadre.studentRegNo} • ` : ''}{cadre.campus}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setEvaluatingCadre(null)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.35rem', borderRadius: '8px' }}
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* Scrollable Body */}
                                            <div className="g5-eval-modal-body">
                                                {/* Current Rank vs Next Rank Progression Pill */}
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)',
                                                    borderRadius: '16px',
                                                    padding: '1rem 1.25rem',
                                                    border: '1.5px solid #E2E8F0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.75rem'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CURRENT RANK</div>
                                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.15rem' }}>
                                                                {currentRank}
                                                            </div>
                                                        </div>
                                                        <ArrowUpRight size={20} style={{ color: 'var(--color-accent-warm)' }} />
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TARGET PROMOTION</div>
                                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)', marginTop: '0.15rem' }}>
                                                                {nextRank}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AVG SCORE</div>
                                                            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: numAvg >= 4.0 ? '#10B981' : numAvg >= 3.0 ? 'var(--color-accent-warm)' : '#EF4444', marginTop: '0.1rem' }}>
                                                                {avgScore}★
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Belay & Solo Clearance Notice */}
                                                    <div style={{
                                                        borderTop: '1px solid #E2E8F0',
                                                        paddingTop: '0.65rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        fontSize: '0.76rem',
                                                        flexWrap: 'wrap',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <div style={{ color: '#475569', fontWeight: 600 }}>
                                                            Clearance Granted: <strong style={{ color: '#1E293B' }}>{targetBelay}</strong>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '0.72rem',
                                                            fontWeight: 800,
                                                            color: targetSolo ? '#059669' : '#D97706',
                                                            background: targetSolo ? '#ECFDF5' : '#FFFBEB',
                                                            border: `1px solid ${targetSolo ? '#A7F3D0' : '#FDE68A'}`,
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '999px'
                                                        }}>
                                                            {targetSolo ? '✓ Solo Station Cleared' : 'Supervised Station Only'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 7 Key Evaluation Areas */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            7 Key Evaluation Areas (1 to 5 Stars)
                                                        </div>
                                                        <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                                                            Tap any star to score
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                                        {evaluationDomains.map(domain => {
                                                            const currentScore = scores[domain.key] || 4;
                                                            const levelLabels = { 1: 'Novice', 2: 'Developing', 3: 'Competent', 4: 'Proficient', 5: 'Mastery' };

                                                            return (
                                                                <div key={domain.key} className="g5-eval-domain-card">
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                                                                {domain.label}
                                                                            </span>
                                                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                                                                {domain.tag}
                                                                            </span>
                                                                        </div>
                                                                        <span style={{
                                                                            fontSize: '0.82rem',
                                                                            fontWeight: 800,
                                                                            color: currentScore >= 4 ? '#D97706' : '#64748B',
                                                                            background: currentScore >= 4 ? '#FEF3C7' : '#F1F5F9',
                                                                            padding: '0.15rem 0.55rem',
                                                                            borderRadius: '999px'
                                                                        }}>
                                                                            {currentScore}★ • {levelLabels[currentScore]}
                                                                        </span>
                                                                    </div>

                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.35' }}>
                                                                        {domain.desc}
                                                                    </div>

                                                                    {/* 5-Star Interactive Button Selector */}
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.2rem' }}>
                                                                        <div className="g5-star-btn-group">
                                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                                <button
                                                                                    key={star}
                                                                                    type="button"
                                                                                    className={`g5-star-btn ${currentScore === star ? 'active' : ''}`}
                                                                                    onClick={() => updateScore(domain.key, star)}
                                                                                >
                                                                                    {star}★
                                                                                </button>
                                                                            ))}
                                                                        </div>

                                                                        <input
                                                                            type="range"
                                                                            min="1"
                                                                            max="5"
                                                                            value={currentScore}
                                                                            onChange={(e) => updateScore(domain.key, e.target.value)}
                                                                            style={{ width: '90px', accentColor: 'var(--color-accent-warm)', cursor: 'pointer' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Fixed/Sticky Footer */}
                                            <div className="g5-eval-modal-footer">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Overall Avg:</span>
                                                    <span style={{
                                                        fontSize: '0.88rem',
                                                        fontWeight: 800,
                                                        color: numAvg >= 4.0 ? '#059669' : 'var(--color-accent-warm)',
                                                        background: numAvg >= 4.0 ? '#ECFDF5' : '#FFFBEB',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${numAvg >= 4.0 ? '#A7F3D0' : '#FDE68A'}`
                                                    }}>
                                                        {avgScore}★ {numAvg >= 4.0 ? '• Qualified' : ''}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.65rem' }}>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-secondary"
                                                        style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                                                        onClick={() => setEvaluatingCadre(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="g5-btn-warm"
                                                        style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 800 }}
                                                        onClick={async () => {
                                                            await handleConfirmPromotion(cadre, nextRank, targetBelay, targetSolo);
                                                            setEvaluatingCadre(null);
                                                        }}
                                                    >
                                                        <Award size={16} /> Confirm Promotion to {nextRank}
                                                    </button>
                                                </div>
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
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
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Device Bindings</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '0.2rem' }}>
                                            {activeMembers.filter(m => !!m.linkedDeviceId).length}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Active locked phones</div>
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
                                                    style={{ width: '150px', height: '42px', fontSize: '0.85rem' }}
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
                                                    style={{ width: '180px', height: '42px', fontSize: '0.85rem' }}
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
                                                    style={{ width: '140px', height: '42px', fontSize: '0.85rem' }}
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
                                                    style={{ width: '175px', height: '42px', fontSize: '0.85rem' }}
                                                    value={rosterBelayFilter}
                                                    onChange={(e) => setRosterBelayFilter(e.target.value)}
                                                >
                                                    <option value="All">All Clearances</option>
                                                    <option value="Primary Belayer Certified">Primary Belayer Certified</option>
                                                    <option value="Belayer Qualified">Belayer Qualified</option>
                                                    <option value="Not Permitted">Not Permitted</option>
                                                </select>

                                                {/* Device Status Filter */}
                                                <select
                                                    className="g5-form-input"
                                                    style={{ width: '175px', height: '42px', fontSize: '0.85rem' }}
                                                    value={rosterDeviceFilter}
                                                    onChange={(e) => setRosterDeviceFilter(e.target.value)}
                                                >
                                                    <option value="All">All Device Locks</option>
                                                    <option value="Bound">📱 Bound Phones</option>
                                                    <option value="Unbound">🔓 Unbound / Free</option>
                                                </select>
                                            </div>

                                            {/* Bottom Row: Match Counter & Action Buttons */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                        Showing <strong style={{ color: 'var(--color-text-main)' }}>{filteredRosterMembers.length}</strong> of {activeMembers.length} personnel
                                                    </span>
                                                    {(rosterSearch || rosterRoleFilter !== 'All' || rosterRankFilter !== 'All' || rosterCampusFilter !== 'All' || rosterBelayFilter !== 'All' || rosterDeviceFilter !== 'All') && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRosterSearch('');
                                                                setRosterRoleFilter('All');
                                                                setRosterRankFilter('All');
                                                                setRosterCampusFilter('All');
                                                                setRosterBelayFilter('All');
                                                                setRosterDeviceFilter('All');
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
                                                        className="g5-btn-primary"
                                                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                                        onClick={() => setShowQuickUnlockModal(true)}
                                                    >
                                                        <Smartphone size={15} /> Quick Device Unlock ⚡
                                                    </button>
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
                                                        <th>Device Binding</th>
                                                        <th>Belay Clearance</th>
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
                                                                        setRosterDeviceFilter('All');
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
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                                                                                    {member.studentRegNo ? (
                                                                                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                                                                                            {member.studentRegNo}
                                                                                        </span>
                                                                                    ) : null}
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
                                                                        {member.linkedDeviceId ? (
                                                                            <span style={{
                                                                                background: '#EFF6FF',
                                                                                color: '#1D4ED8',
                                                                                border: '1px solid #BFDBFE',
                                                                                padding: '0.2rem 0.55rem',
                                                                                borderRadius: '999px',
                                                                                fontSize: '0.72rem',
                                                                                fontWeight: 800,
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.3rem'
                                                                            }} title={`Locked to device: ${member.linkedDeviceId}`}>
                                                                                <Smartphone size={12} /> Bound
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{
                                                                                background: '#ECFDF5',
                                                                                color: '#047857',
                                                                                border: '1px solid #A7F3D0',
                                                                                padding: '0.2rem 0.55rem',
                                                                                borderRadius: '999px',
                                                                                fontSize: '0.72rem',
                                                                                fontWeight: 800,
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.3rem'
                                                                            }}>
                                                                                <Unlock size={12} /> Free
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`g5-pill ${belay === 'Primary Belayer Certified' ? 'g5-pill-active' : belay === 'Belayer Qualified' ? 'g5-pill-blue' : 'g5-pill-recruit'}`}>
                                                                            <Shield size={13} /> {belay}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ textAlign: 'right' }}>
                                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'flex-end' }}>
                                                                            <button
                                                                                type="button"
                                                                                className="g5-btn-secondary"
                                                                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                                                                onClick={() => {
                                                                                    if (isRecruit) {
                                                                                        setActiveTab('graduations');
                                                                                    } else {
                                                                                        setActiveTab('promotions');
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {isRecruit ? 'Graduation' : 'Evaluate'}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="g5-btn-outline"
                                                                                style={{
                                                                                    width: '32px',
                                                                                    height: '32px',
                                                                                    padding: 0,
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    borderRadius: '8px',
                                                                                    borderColor: member.linkedDeviceId ? '#BFDBFE' : 'var(--color-border)',
                                                                                    color: member.linkedDeviceId ? '#1D4ED8' : 'var(--color-text-muted)',
                                                                                    background: member.linkedDeviceId ? '#EFF6FF' : 'transparent'
                                                                                }}
                                                                                disabled={resettingDeviceMemberId === member._id}
                                                                                onClick={() => handleResetDeviceLock(member)}
                                                                                title={member.linkedDeviceId ? "Clear bound phone device ID (Real-time)" : "Phone is unlocked (Click to clear)"}
                                                                            >
                                                                                {resettingDeviceMemberId === member._id ? (
                                                                                    <RefreshCw size={13} className="g5-spin" />
                                                                                ) : (
                                                                                    <Smartphone size={13} />
                                                                                )}
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
                        {/* MODAL HEADER: ROYAL BLUE & HIGH CONTRAST */}
                        <div className="g5-modal-header" style={{
                            padding: '1.25rem 1.75rem',
                            background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
                            color: '#FFFFFF'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#1D4ED8',
                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                                }}>
                                    <Compass size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                                        Create Meeting Session
                                    </h3>
                                    <p style={{ fontSize: '0.82rem', color: '#DBEAFE', marginTop: '0.2rem' }}>
                                        Schedule outdoor practicals, weekly fellowship, and geofenced attendance verification
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNewMeetingModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#FFFFFF',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <div className="g5-modal-body" style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1 }}>
                                {/* ACTIVE SESSION CONFLICT NOTICE WITH 1-CLICK OVERRIDE */}
                                {existingConflictMeeting && (
                                    <div style={{
                                        background: '#FFFBEB',
                                        border: '1.5px solid #F59E0B',
                                        borderRadius: '14px',
                                        padding: '1rem 1.25rem',
                                        marginBottom: '1.35rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.65rem',
                                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            <AlertTriangle size={22} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.92rem' }}>
                                                    Notice: Another active session is already scheduled for {newMeetingForm.campus} this week
                                                </div>
                                                <div style={{ fontSize: '0.83rem', color: '#B45309', marginTop: '0.25rem', lineHeight: 1.4 }}>
                                                    "<strong>{existingConflictMeeting.name}</strong>" is scheduled on {new Date(existingConflictMeeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ({existingConflictMeeting.startTime} - {existingConflictMeeting.endTime}).
                                                </div>
                                            </div>
                                        </div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.65rem',
                                            paddingTop: '0.65rem',
                                            borderTop: '1px dashed #FDE68A',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            color: '#78350F'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={allowMultipleMeeting}
                                                onChange={(e) => setAllowMultipleMeeting(e.target.checked)}
                                                style={{ width: '18px', height: '18px', accentColor: '#1D4ED8', cursor: 'pointer' }}
                                            />
                                            <span>Allow additional training session / field drill for this week (Admin Override & Test Mode)</span>
                                        </label>
                                    </div>
                                )}

                                <div className="g5-form-layout-2col">

                                    {/* COLUMN 1: SESSION DETAILS */}
                                    <div className="g5-form-card-panel">
                                        <div className="g5-form-section-title">
                                            <Settings size={15} /> 1. Session Details
                                        </div>

                                        <div className="g5-form-group" style={{ marginBottom: '0.85rem' }}>
                                            <label className="g5-form-label">Meeting Name *</label>
                                            <input
                                                type="text"
                                                className="g5-form-input"
                                                placeholder="Meeting One"
                                                readOnly
                                                value={newMeetingForm.name || buildMeetingName(newMeetingForm.campus, meetings)}
                                                onFocus={(e) => e.target.blur()}
                                            />
                                        </div>

                                        <div className="g5-form-group" style={{ marginBottom: '0.85rem' }}>
                                            <label className="g5-form-label">Campus Location *</label>
                                            <div className="g5-campus-toggle">
                                                <button
                                                    type="button"
                                                    className={`g5-campus-btn ${newMeetingForm.campus === 'Athi River' ? 'active' : ''}`}
                                                    onClick={() => applyVenuePreset(VENUE_PRESETS[0])}
                                                >
                                                    <Tent size={16} /> Athi River Base
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`g5-campus-btn ${newMeetingForm.campus === 'Valley Road' ? 'active' : ''}`}
                                                    onClick={() => applyVenuePreset(VENUE_PRESETS[1])}
                                                >
                                                    <Users size={16} /> Nairobi Campus (DAC)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="g5-form-grid-3" style={{ gap: '0.65rem', marginBottom: '0.85rem' }}>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">Date *</label>
                                                <input
                                                    type="date"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.65rem 0.75rem', fontSize: '0.88rem' }}
                                                    required
                                                    value={newMeetingForm.date}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, date: e.target.value })}
                                                />
                                            </div>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">Start Time *</label>
                                                <input
                                                    type="time"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.65rem 0.75rem', fontSize: '0.88rem' }}
                                                    required
                                                    value={newMeetingForm.startTime}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, startTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">End Time *</label>
                                                <input
                                                    type="time"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.65rem 0.75rem', fontSize: '0.88rem' }}
                                                    required
                                                    value={newMeetingForm.endTime}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, endTime: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* MANDATORY ROLL-CALL QUESTION STUDIO */}
                                        <div style={{
                                            background: '#F8FAFC',
                                            border: '1.5px solid #93C5FD',
                                            borderRadius: '14px',
                                            padding: '0.95rem 1rem',
                                            marginTop: '0.45rem',
                                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.04)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                                    <Lightbulb size={18} style={{ color: '#2563EB' }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            Interactive Roll-Call Question
                                                            <span style={{ color: '#DC2626', fontSize: '0.95rem', fontWeight: 900 }}>*</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>
                                                            Mandatory — Students must answer during scan check-in
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 800,
                                                    background: '#EFF6FF',
                                                    color: '#1D4ED8',
                                                    border: '1px solid #BFDBFE',
                                                    borderRadius: '6px',
                                                    padding: '0.15rem 0.45rem',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Required
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
                                                <label className="g5-form-label" style={{ fontSize: '0.8rem' }}>
                                                    Question Prompt <span style={{ color: '#DC2626' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="g5-form-input"
                                                    style={{
                                                        padding: '0.6rem 0.8rem',
                                                        fontSize: '0.86rem',
                                                        borderColor: !newMeetingForm.questionOfDay ? '#FCA5A5' : '#CBD5E1',
                                                        background: '#FFFFFF'
                                                    }}
                                                    placeholder="e.g. Rate your readiness or Belay station reflection..."
                                                    required
                                                    value={newMeetingForm.questionOfDay}
                                                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, questionOfDay: e.target.value })}
                                                />
                                            </div>

                                            {(newMeetingForm.questionType === 'multiple_choice' || newMeetingForm.questionType === 'checkboxes') && (
                                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1D4ED8' }}>
                                                            Poll Choices (Minimum 2 required) <span style={{ color: '#DC2626' }}>*</span>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="g5-btn-blue-soft"
                                                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem' }}
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
                                                                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', minWidth: '16px' }}>{idx + 1}.</span>
                                                                <input
                                                                    type="text"
                                                                    className="g5-form-input"
                                                                    style={{ padding: '0.45rem 0.7rem', fontSize: '0.84rem', background: '#FFFFFF' }}
                                                                    placeholder={`Choice ${idx + 1}`}
                                                                    required
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
                                                                        className="g5-btn-delete-rose"
                                                                        style={{ padding: '0.4rem 0.55rem' }}
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
                                                <span className="g5-form-label" style={{ marginBottom: 0 }}>
                                                    Official Campus Venue Preset
                                                </span>
                                                <span style={{ fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 800 }}>
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
                                                                {isSelected && <Check size={16} style={{ color: '#1D4ED8', strokeWidth: 3 }} />}
                                                            </div>
                                                            <div className="g5-venue-sub">{p.sub}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* LOCATION NAME INPUT */}
                                        <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                            <label className="g5-form-label">Venue / Location Name *</label>
                                            <input
                                                type="text"
                                                className="g5-form-input"
                                                placeholder="Doulos Store, DAC 506, or Wall"
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
                                                    <Radio size={16} style={{ color: '#2563EB' }} />
                                                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                                                        Satellite GPS Lock
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    {gpsCaptured ? (
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', background: '#ECFDF5', padding: '0.15rem 0.45rem', borderRadius: '6px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <CheckCircle2 size={12} /> Device Locked
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B91C1C', background: '#FEF2F2', padding: '0.15rem 0.45rem', borderRadius: '6px', border: '1px solid #FECACA' }}>
                                                            Required *
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className={gpsCaptured ? "g5-btn-emerald-solid" : "g5-btn-blue-solid"}
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'center',
                                                    padding: '0.75rem',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 800,
                                                    background: gpsCaptured ? '#059669' : '#1D4ED8',
                                                    boxShadow: gpsCaptured ? '0 3px 10px rgba(5, 150, 105, 0.25)' : '0 3px 10px rgba(29, 78, 216, 0.25)'
                                                }}
                                                onClick={handleCaptureGps}
                                                disabled={gpsCapturing}
                                            >
                                                <Navigation size={16} />
                                                {gpsCapturing ? 'Locating Device Satellites...' : gpsCaptured ? '✓ Device GPS Locked (Tap to Re-lock)' : '📡 Capture Device GPS (Mandatory)'}
                                            </button>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: '#FFFFFF',
                                                padding: '0.65rem 0.95rem',
                                                borderRadius: '10px',
                                                border: `1.5px solid ${gpsCaptured ? '#86EFAC' : '#FCA5A5'}`
                                            }}>
                                                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569' }}>COORDINATES PIN:</span>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: gpsCaptured ? '#059669' : '#DC2626', fontFamily: 'monospace' }}>
                                                    {gpsCaptured && newMeetingForm.location.latitude && newMeetingForm.location.longitude
                                                        ? `${Number(newMeetingForm.location.latitude).toFixed(5)}, ${Number(newMeetingForm.location.longitude).toFixed(5)}`
                                                        : '⚠️ No device GPS captured yet'}
                                                </span>
                                            </div>

                                            {/* COMPACT GEOFENCE RADIUS (CLEAN & MINIMAL HEIGHT) */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '0.75rem',
                                                background: '#FFFFFF',
                                                padding: '0.6rem 0.95rem',
                                                borderRadius: '10px',
                                                border: '1.5px solid #BFDBFE'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
                                                        Geofence Radius (m) *
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                                        Allowed check-in perimeter around pin
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <input
                                                        type="number"
                                                        className="g5-form-input"
                                                        style={{ width: '90px', padding: '0.4rem 0.6rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: 800 }}
                                                        required
                                                        min="20"
                                                        max="2500"
                                                        value={newMeetingForm.location?.radius ?? 200}
                                                        onChange={(e) => setNewMeetingForm({
                                                            ...newMeetingForm,
                                                            location: { ...newMeetingForm.location, radius: parseInt(e.target.value, 10) || 200 }
                                                        })}
                                                    />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>m</span>
                                                </div>
                                            </div>

                                            {/* COLLAPSIBLE MANUAL COORDINATES (HIDDEN BY DEFAULT TO SAVE SCREEN SPACE) */}
                                            <details style={{ fontSize: '0.74rem', color: '#64748B', padding: '0.2rem 0.35rem' }}>
                                                <summary style={{ cursor: 'pointer', userSelect: 'none', color: '#2563EB', fontWeight: 700 }}>
                                                    ⚙️ Advanced: Adjust coordinates manually
                                                </summary>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.5rem' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px', color: '#475569' }}>Latitude</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            className="g5-form-input"
                                                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                                                            value={newMeetingForm.location?.latitude ?? ''}
                                                            onChange={(e) => setNewMeetingForm({
                                                                ...newMeetingForm,
                                                                location: { ...newMeetingForm.location, latitude: e.target.value === '' ? '' : parseFloat(e.target.value) }
                                                            })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px', color: '#475569' }}>Longitude</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            className="g5-form-input"
                                                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                                                            value={newMeetingForm.location?.longitude ?? ''}
                                                            onChange={(e) => setNewMeetingForm({
                                                                ...newMeetingForm,
                                                                location: { ...newMeetingForm.location, longitude: e.target.value === '' ? '' : parseFloat(e.target.value) }
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                            </details>
                                        </div>

                                    </div>

                                </div>
                            </div>

                            {/* STICKY MODAL FOOTER - COMPACT & SAFE FROM STATUS BAR COLLISION */}
                            <div className="g5-modal-footer" style={{
                                position: 'sticky',
                                bottom: 0,
                                zIndex: 30,
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem 1.25rem',
                                background: '#FFFFFF',
                                borderTop: '1.5px solid #E2E8F0',
                                boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                                        {newMeetingForm.campus} ({newMeetingForm.location.radius}m)
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        type="button"
                                        className="g5-btn-blue-soft"
                                        style={{ background: '#F1F5F9', color: '#334155', borderColor: '#CBD5E1', padding: '0.48rem 0.8rem', fontSize: '0.82rem', fontWeight: 700 }}
                                        onClick={() => setShowNewMeetingModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="g5-btn-blue-solid"
                                        disabled={meetingCreating || (!!existingConflictMeeting && !allowMultipleMeeting)}
                                        style={{
                                            padding: '0.48rem 0.95rem',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            gap: '0.35rem',
                                            opacity: (existingConflictMeeting && !allowMultipleMeeting) ? 0.6 : 1,
                                            cursor: (existingConflictMeeting && !allowMultipleMeeting) ? 'not-allowed' : 'pointer'
                                        }}
                                        title={existingConflictMeeting && !allowMultipleMeeting ? 'Check the override box above to allow multiple sessions this week' : ''}
                                    >
                                        <Sparkles size={14} />
                                        {meetingCreating ? 'Creating...' : (existingConflictMeeting && !allowMultipleMeeting) ? 'Override Required' : '+ Create Meeting'}
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
                    onEditMeeting={(m) => {
                        setInsightMeeting(null);
                        handleOpenEditMeeting(m);
                    }}
                />
            )}

            {/* ========================================================= */}
            {/* MODAL: EDIT MEETING (G5 ROLE ONLY) */}
            {/* ========================================================= */}
            {showEditMeetingModal && editMeetingForm && (
                <div className="g5-modal-backdrop" onClick={() => setShowEditMeetingModal(false)}>
                    <div className="g5-modal g5-modal-xl g5-modal-scrollable" onClick={(e) => e.stopPropagation()}>
                        {/* MODAL HEADER */}
                        <div className="g5-modal-header" style={{
                            padding: '1.25rem 1.75rem',
                            background: 'linear-gradient(135deg, #312E81 0%, #4338CA 50%, #4F46E5 100%)',
                            color: '#FFFFFF'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#4F46E5',
                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                                }}>
                                    <Edit size={22} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                                        Edit Meeting Session
                                    </h3>
                                    <p style={{ fontSize: '0.82rem', color: '#E0E7FF', marginTop: '0.2rem' }}>
                                        Update session details, roll-call question, timing & GPS geofence
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditMeetingModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#FFFFFF',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMeetingEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <div className="g5-modal-body" style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1 }}>
                                {/* ACTIVE SESSION CONFLICT NOTICE WITH 1-CLICK OVERRIDE */}
                                {editConflictMeeting && (
                                    <div style={{
                                        background: '#FFFBEB',
                                        border: '1.5px solid #F59E0B',
                                        borderRadius: '14px',
                                        padding: '1rem 1.25rem',
                                        marginBottom: '1.35rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.65rem',
                                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            <AlertTriangle size={22} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.92rem' }}>
                                                    Notice: Another active session is already scheduled for {editMeetingForm.campus} this week
                                                </div>
                                                <div style={{ fontSize: '0.83rem', color: '#B45309', marginTop: '0.25rem', lineHeight: 1.4 }}>
                                                    "<strong>{editConflictMeeting.name}</strong>" is scheduled on {new Date(editConflictMeeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ({editConflictMeeting.startTime} - {editConflictMeeting.endTime}).
                                                </div>
                                            </div>
                                        </div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.65rem',
                                            paddingTop: '0.65rem',
                                            borderTop: '1px dashed #FDE68A',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            color: '#78350F'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={editMeetingForm.allowMultiple}
                                                onChange={(e) => setEditMeetingForm({ ...editMeetingForm, allowMultiple: e.target.checked })}
                                                style={{ width: '18px', height: '18px', accentColor: '#4F46E5', cursor: 'pointer' }}
                                            />
                                            <span>Allow additional training session / field drill for this week (Admin Override & Test Mode)</span>
                                        </label>
                                    </div>
                                )}

                                <div className="g5-form-layout-2col">

                                    {/* COLUMN 1: SESSION DETAILS */}
                                    <div className="g5-form-card-panel">
                                        <div className="g5-form-section-title">
                                            <Settings size={15} /> 1. Session Details
                                        </div>

                                        <div className="g5-form-group" style={{ marginBottom: '0.85rem' }}>
                                            <label className="g5-form-label">Meeting Name *</label>
                                            <input
                                                type="text"
                                                className="g5-form-input"
                                                placeholder="e.g. Weekly Doulos / Weekend Field Drill"
                                                required
                                                value={editMeetingForm.name}
                                                onChange={(e) => setEditMeetingForm({ ...editMeetingForm, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="g5-form-group" style={{ marginBottom: '0.85rem' }}>
                                            <label className="g5-form-label">Campus Location *</label>
                                            <div className="g5-campus-toggle">
                                                <button
                                                    type="button"
                                                    className={`g5-campus-btn ${editMeetingForm.campus === 'Athi River' ? 'active' : ''}`}
                                                    onClick={() => applyEditVenuePreset(VENUE_PRESETS[0])}
                                                >
                                                    <Tent size={16} /> Athi River Base
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`g5-campus-btn ${editMeetingForm.campus === 'Valley Road' ? 'active' : ''}`}
                                                    onClick={() => applyEditVenuePreset(VENUE_PRESETS[1])}
                                                >
                                                    <Users size={16} /> Nairobi Campus (DAC)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="g5-form-grid-3" style={{ gap: '0.65rem', marginBottom: '0.85rem' }}>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">Date *</label>
                                                <input
                                                    type="date"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.65rem 0.75rem', fontSize: '0.88rem' }}
                                                    required
                                                    value={editMeetingForm.date}
                                                    onChange={(e) => setEditMeetingForm({ ...editMeetingForm, date: e.target.value })}
                                                />
                                            </div>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">Start Time *</label>
                                                <input
                                                    type="time"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.65rem 0.75rem', fontSize: '0.88rem' }}
                                                    required
                                                    value={editMeetingForm.startTime}
                                                    onChange={(e) => setEditMeetingForm({ ...editMeetingForm, startTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label">End Time *</label>
                                                <input
                                                    type="time"
                                                    className="g5-form-input"
                                                    style={{ padding: '0.65rem 0.75rem', fontSize: '0.88rem' }}
                                                    required
                                                    value={editMeetingForm.endTime}
                                                    onChange={(e) => setEditMeetingForm({ ...editMeetingForm, endTime: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* MANDATORY ROLL-CALL QUESTION STUDIO */}
                                        <div style={{
                                            background: '#F8FAFC',
                                            border: '1.5px solid #C7D2FE',
                                            borderRadius: '14px',
                                            padding: '0.95rem 1rem',
                                            marginTop: '0.45rem',
                                            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.04)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                                    <Lightbulb size={18} style={{ color: '#4F46E5' }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            Interactive Roll-Call Question
                                                            <span style={{ color: '#DC2626', fontSize: '0.95rem', fontWeight: 900 }}>*</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: '#4F46E5', fontWeight: 700 }}>
                                                            Mandatory — Students must answer during scan check-in
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 800,
                                                    background: '#EEF2FF',
                                                    color: '#4338CA',
                                                    border: '1px solid #C7D2FE',
                                                    borderRadius: '6px',
                                                    padding: '0.15rem 0.45rem',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Required
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
                                                        className={`g5-type-chip ${editMeetingForm.questionType === t.id ? 'active' : ''}`}
                                                        onClick={() => setEditMeetingForm(prev => ({
                                                            ...prev,
                                                            questionType: t.id,
                                                            questionOptions: (t.id === 'multiple_choice' || t.id === 'checkboxes')
                                                                ? (prev.questionOptions.length >= 2 ? prev.questionOptions : ['', ''])
                                                                : []
                                                        }))}
                                                    >
                                                        <t.icon size={13} />
                                                        <span>{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                                <label className="g5-form-label" style={{ fontSize: '0.8rem' }}>
                                                    Question Prompt <span style={{ color: '#DC2626' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="g5-form-input"
                                                    style={{
                                                        padding: '0.6rem 0.8rem',
                                                        fontSize: '0.86rem',
                                                        borderColor: !editMeetingForm.questionOfDay ? '#FCA5A5' : '#CBD5E1',
                                                        background: '#FFFFFF'
                                                    }}
                                                    placeholder="e.g. Rate your readiness or Belay station reflection..."
                                                    required
                                                    value={editMeetingForm.questionOfDay}
                                                    onChange={(e) => setEditMeetingForm({ ...editMeetingForm, questionOfDay: e.target.value })}
                                                />
                                            </div>

                                            {(editMeetingForm.questionType === 'multiple_choice' || editMeetingForm.questionType === 'checkboxes') && (
                                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#4338CA' }}>
                                                            Poll Choices (Minimum 2 required) <span style={{ color: '#DC2626' }}>*</span>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="g5-btn-blue-soft"
                                                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem' }}
                                                            onClick={() => setEditMeetingForm(prev => ({
                                                                ...prev,
                                                                questionOptions: [...prev.questionOptions, '']
                                                            }))}
                                                        >
                                                            + Add Choice
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        {editMeetingForm.questionOptions.map((opt, idx) => (
                                                            <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', minWidth: '16px' }}>{idx + 1}.</span>
                                                                <input
                                                                    type="text"
                                                                    className="g5-form-input"
                                                                    style={{ padding: '0.45rem 0.7rem', fontSize: '0.84rem', background: '#FFFFFF' }}
                                                                    placeholder={`Choice ${idx + 1}`}
                                                                    required
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const updated = [...editMeetingForm.questionOptions];
                                                                        updated[idx] = e.target.value;
                                                                        setEditMeetingForm({ ...editMeetingForm, questionOptions: updated });
                                                                    }}
                                                                />
                                                                {editMeetingForm.questionOptions.length > 2 && (
                                                                    <button
                                                                        type="button"
                                                                        className="g5-btn-delete-chip"
                                                                        onClick={() => {
                                                                            const updated = editMeetingForm.questionOptions.filter((_, i) => i !== idx);
                                                                            setEditMeetingForm({ ...editMeetingForm, questionOptions: updated });
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
                                                <span className="g5-form-label" style={{ marginBottom: 0 }}>
                                                    Official Campus Venue Preset
                                                </span>
                                                <span style={{ fontSize: '0.74rem', color: '#4F46E5', fontWeight: 800 }}>
                                                    {editMeetingForm.campus === 'Athi River' ? 'Athi River Base' : 'Nairobi Campus'}
                                                </span>
                                            </div>
                                            <div className="g5-venue-preset-grid">
                                                {VENUE_PRESETS.map((p) => {
                                                    const isSelected = editMeetingForm.location.name === p.name || editMeetingForm.location.name === p.title;
                                                    return (
                                                        <div
                                                            key={p.title}
                                                            className={`g5-venue-preset-card ${isSelected ? 'active' : ''}`}
                                                            onClick={() => applyEditVenuePreset(p)}
                                                        >
                                                            <div className="g5-venue-title">
                                                                <span>{p.title}</span>
                                                                {isSelected && <Check size={16} style={{ color: '#4F46E5', strokeWidth: 3 }} />}
                                                            </div>
                                                            <div className="g5-venue-sub">{p.sub}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* LOCATION NAME INPUT */}
                                        <div className="g5-form-group" style={{ marginBottom: 0 }}>
                                            <label className="g5-form-label">Venue / Location Name *</label>
                                            <input
                                                type="text"
                                                className="g5-form-input"
                                                placeholder="Doulos Store, DAC 506, or Wall"
                                                required
                                                value={editMeetingForm.location.name}
                                                onChange={(e) => setEditMeetingForm({
                                                    ...editMeetingForm,
                                                    location: { ...editMeetingForm.location, name: e.target.value }
                                                })}
                                            />
                                        </div>

                                        {/* GPS SATELLITE RADAR BOX */}
                                        <div className="g5-gps-radar-box">
                                            <div className="g5-gps-radar-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Radio size={16} style={{ color: '#4F46E5' }} />
                                                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                                                        Satellite GPS Lock
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    {editGpsCaptured ? (
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', background: '#ECFDF5', padding: '0.15rem 0.45rem', borderRadius: '6px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <CheckCircle2 size={12} /> Saved Location
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B91C1C', background: '#FEF2F2', padding: '0.15rem 0.45rem', borderRadius: '6px', border: '1px solid #FECACA' }}>
                                                            Required *
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className={editGpsCaptured ? "g5-btn-emerald-solid" : "g5-btn-blue-solid"}
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'center',
                                                    padding: '0.75rem',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 800,
                                                    background: editGpsCaptured ? '#059669' : '#4F46E5',
                                                    boxShadow: editGpsCaptured ? '0 3px 10px rgba(5, 150, 105, 0.25)' : '0 3px 10px rgba(79, 70, 229, 0.25)'
                                                }}
                                                onClick={handleCaptureEditGps}
                                                disabled={editGpsCapturing}
                                            >
                                                <Navigation size={16} />
                                                {editGpsCapturing ? 'Locating Device Satellites...' : editGpsCaptured ? '✓ Device GPS Configured (Tap to Re-lock)' : '📡 Capture Device GPS (Mandatory)'}
                                            </button>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.45rem 0.75rem',
                                                background: '#FFFFFF',
                                                borderRadius: '8px',
                                                border: '1px solid #E2E8F0',
                                                fontSize: '0.76rem',
                                                fontWeight: 700,
                                                color: '#64748B'
                                            }}>
                                                <span>LAT: {editMeetingForm.location.latitude ? Number(editMeetingForm.location.latitude).toFixed(4) : '—'}</span>
                                                <span>LNG: {editMeetingForm.location.longitude ? Number(editMeetingForm.location.longitude).toFixed(4) : '—'}</span>
                                            </div>

                                            {/* GEOFENCE RADIUS SLIDER */}
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <Crosshair size={13} style={{ color: '#4F46E5' }} /> Geofence Radius
                                                    </span>
                                                    <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#4F46E5', background: '#EEF2FF', padding: '0.15rem 0.55rem', borderRadius: '6px', border: '1px solid #C7D2FE' }}>
                                                        {editMeetingForm.location.radius} meters
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="800"
                                                    step="25"
                                                    value={editMeetingForm.location.radius}
                                                    onChange={(e) => setEditMeetingForm({
                                                        ...editMeetingForm,
                                                        location: { ...editMeetingForm.location, radius: parseInt(e.target.value, 10) }
                                                    })}
                                                    style={{ width: '100%', accentColor: '#4F46E5', cursor: 'pointer' }}
                                                />
                                            </div>
                                        </div>

                                    </div>

                                </div>
                            </div>

                            {/* MODAL FOOTER */}
                            <div className="g5-modal-footer" style={{
                                padding: '0.85rem 1.75rem',
                                background: '#F8FAFC',
                                borderTop: '1px solid #E2E8F0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexShrink: 0
                            }}>
                                <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Shield size={14} style={{ color: '#4F46E5' }} />
                                    <span>
                                        {editMeetingForm.campus} ({editMeetingForm.location.radius}m)
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        type="button"
                                        className="g5-btn-blue-soft"
                                        style={{ background: '#F1F5F9', color: '#334155', borderColor: '#CBD5E1', padding: '0.48rem 0.8rem', fontSize: '0.82rem', fontWeight: 700 }}
                                        onClick={() => setShowEditMeetingModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="g5-btn-blue-solid"
                                        disabled={editMeetingLoading || (!!editConflictMeeting && !editMeetingForm.allowMultiple)}
                                        style={{
                                            padding: '0.48rem 0.95rem',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            gap: '0.35rem',
                                            background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                                            opacity: (editConflictMeeting && !editMeetingForm.allowMultiple) ? 0.6 : 1,
                                            cursor: (editConflictMeeting && !editMeetingForm.allowMultiple) ? 'not-allowed' : 'pointer'
                                        }}
                                        title={editConflictMeeting && !editMeetingForm.allowMultiple ? 'Check the override box above to allow changes' : ''}
                                    >
                                        <Sparkles size={14} />
                                        {editMeetingLoading ? 'Saving...' : (editConflictMeeting && !editMeetingForm.allowMultiple) ? 'Override Required' : 'Save Meeting Changes 💾'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* DEDICATED MEETING QR CODE PROJECTOR MODAL */}
            {/* ========================================================= */}
            {qrMeeting && (
                <div
                    className="g5-modal-backdrop"
                    style={{
                        zIndex: 10000,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                    }}
                    onClick={() => setQrMeeting(null)}
                >
                    <div
                        className="g5-modal g5-modal-container"
                        style={{
                            maxWidth: '460px',
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

                        {/* BUTTONS */}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
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
                                                    .link { font-size: 13px; color: #64748b; word-break: break-all; margin-top: 12px; }
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
                                                    <div class="link">Scan with camera to check in: ${checkInUrl}</div>
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

            {/* ========================================================= */}
            {/* QUICK REAL-TIME DEVICE UNLOCK MODAL */}
            {/* ========================================================= */}
            {showQuickUnlockModal && (
                <div className="g5-modal-backdrop" onClick={() => setShowQuickUnlockModal(false)}>
                    <div className="g5-modal g5-modal-scrollable" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
                        {/* MODAL HEADER: ROYAL BLUE & HIGH CONTRAST */}
                        <div className="g5-modal-header" style={{
                            padding: '1.25rem 1.75rem',
                            background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
                            color: '#FFFFFF'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#1D4ED8',
                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                                    flexShrink: 0
                                }}>
                                    <Smartphone size={22} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, margin: 0 }}>
                                        Quick Device Unlock
                                    </h3>
                                    <p style={{ fontSize: '0.8rem', color: '#DBEAFE', margin: '0.2rem 0 0' }}>
                                        Instant real-time phone hardware unlock for student scans
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowQuickUnlockModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '50%',
                                    width: '34px',
                                    height: '34px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#FFFFFF',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="g5-modal-body" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                            <div style={{
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: '12px',
                                padding: '0.75rem 1rem',
                                fontSize: '0.82rem',
                                color: '#1E3A8A',
                                lineHeight: 1.45
                            }}>
                                💡 <strong>When to use:</strong> If a student changed phones, lost their phone, or borrows a friend's phone to check in, unlocking clears their locked hardware ID so their next scan succeeds immediately.
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleQuickUnlockByRegNo();
                                }}
                            >
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Search by Admission No or Name
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div className="g5-search-wrap" style={{ flex: 1, height: '42px' }}>
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            className="g5-search-input"
                                            placeholder="e.g. 23-1450, 22-0981 or Student Name..."
                                            value={quickUnlockQuery}
                                            onChange={(e) => setQuickUnlockQuery(e.target.value)}
                                            autoFocus
                                            style={{ fontSize: '0.88rem' }}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="g5-btn-warm"
                                        disabled={quickUnlockLoading || !quickUnlockQuery.trim()}
                                        style={{ padding: '0 1.25rem', height: '42px', fontSize: '0.85rem' }}
                                    >
                                        {quickUnlockLoading ? 'Unlocking...' : '⚡ Unlock'}
                                    </button>
                                </div>
                            </form>

                            {/* LIVE MATCH SUGGESTIONS */}
                            {quickUnlockQuery.trim().length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.5rem' }}>
                                        Matching Roster Members ({members.filter(m => {
                                            const q = quickUnlockQuery.toLowerCase();
                                            return (m.name || '').toLowerCase().includes(q) ||
                                                (m.studentRegNo || '').toLowerCase().includes(q);
                                        }).length})
                                    </div>
                                    <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingRight: '0.15rem' }}>
                                        {members.filter(m => {
                                            const q = quickUnlockQuery.toLowerCase();
                                            return (m.name || '').toLowerCase().includes(q) ||
                                                (m.studentRegNo || '').toLowerCase().includes(q);
                                        }).slice(0, 6).map(m => {
                                            const isBound = Boolean(m.linkedDeviceId);
                                            const isResettingThis = resettingDeviceMemberId === m._id;
                                            return (
                                                <div
                                                    key={m._id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '0.65rem 0.85rem',
                                                        background: 'var(--color-surface)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '12px',
                                                        gap: '0.75rem'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                                                        <div className="g5-avatar" style={{ width: '34px', height: '34px', fontSize: '0.85rem', flexShrink: 0 }}>
                                                            {(m.name || 'M').charAt(0)}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {m.name}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                                                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-main)' }}>{m.studentRegNo}</span>
                                                                <span>•</span>
                                                                <span>{m.douloidRank || m.memberType || 'Member'}</span>
                                                                <span>•</span>
                                                                <span style={{
                                                                    color: isBound ? '#1D4ED8' : '#059669',
                                                                    fontWeight: 700,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.2rem'
                                                                }}>
                                                                    {isBound ? <Lock size={11} /> : <Unlock size={11} />}
                                                                    {isBound ? 'Bound' : 'Unlocked'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={isResettingThis}
                                                        onClick={() => handleResetDeviceLock(m)}
                                                        className={isBound ? "g5-btn-warm" : "g5-btn-secondary"}
                                                        style={{
                                                            padding: '0.35rem 0.75rem',
                                                            fontSize: '0.78rem',
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {isResettingThis ? (
                                                            'Clearing...'
                                                        ) : (
                                                            <>
                                                                <Unlock size={12} />
                                                                {isBound ? 'Unlock Phone' : 'Clear'}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="g5-modal-footer" style={{ padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)' }}>
                            <button
                                type="button"
                                className="g5-btn-outline"
                                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                                onClick={() => {
                                    setShowQuickUnlockModal(false);
                                    setQuickUnlockQuery('');
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================================== */}
            {/* NATIVE-STYLE MOBILE BOTTOM NAVIGATION BAR */}
            {/* ===================================================== */}
            <nav className="g5-mobile-bottom-nav">
                <button
                    type="button"
                    className={`g5-bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => handleSelectTab('dashboard')}
                    aria-label="Dashboard Home"
                >
                    <LayoutDashboard size={20} />
                    <span>Home</span>
                </button>

                <button
                    type="button"
                    className={`g5-bottom-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => handleSelectTab('attendance')}
                    aria-label="Attendance Ledger"
                >
                    <CalendarCheck size={20} />
                    <span>Attend</span>
                </button>

                <button
                    type="button"
                    className={`g5-bottom-nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
                    onClick={() => handleSelectTab('meetings')}
                    aria-label="Field Meetings"
                >
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                        <Calendar size={20} />
                        {activeMeetings.some(m => m.isActive) && (
                            <span className="g5-bottom-nav-dot" />
                        )}
                    </div>
                    <span>Meetings</span>
                </button>

                <button
                    type="button"
                    className={`g5-bottom-nav-item ${activeTab === 'cadres' ? 'active' : ''}`}
                    onClick={() => handleSelectTab('cadres')}
                    aria-label="Membership Roster"
                >
                    <Users size={20} />
                    <span>Roster</span>
                </button>

                <button
                    type="button"
                    className={`g5-bottom-nav-item ${(isMoreActive || mobileMoreOpen) ? 'active' : ''}`}
                    onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                    aria-label="More Ministry Portals"
                >
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                        <Layers size={20} />
                        {(recruits.length > 0 || incidents.length > 0) && (
                            <span className="g5-bottom-nav-badge">
                                {recruits.length + incidents.length}
                            </span>
                        )}
                    </div>
                    <span>More</span>
                </button>
            </nav>

            {/* ===================================================== */}
            {/* MOBILE APP "MORE" ACTION SHEET / DRAWER */}
            {/* ===================================================== */}
            <div
                className={`g5-mobile-sheet-backdrop ${mobileMoreOpen ? 'active' : ''}`}
                onClick={() => setMobileMoreOpen(false)}
            />
            <div className={`g5-mobile-sheet ${mobileMoreOpen ? 'open' : ''}`}>
                <div className="g5-mobile-sheet-handle" onClick={() => setMobileMoreOpen(false)} />
                <div className="g5-mobile-sheet-header">
                    <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.2px' }}>
                            Ministry Portals & Tools
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                            Daystar University Doulos Ministry • Freedom Base
                        </div>
                    </div>
                    <button
                        type="button"
                        className="g5-mobile-sheet-close"
                        onClick={() => setMobileMoreOpen(false)}
                        aria-label="Close sheet"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="g5-mobile-sheet-grid">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`g5-sheet-item ${isActive ? 'active' : ''}`}
                                onClick={() => handleSelectTab(item.id)}
                            >
                                <div className="g5-sheet-icon-box">
                                    <Icon size={22} />
                                    {item.badge ? (
                                        <span className="g5-sheet-badge">{item.badge}</span>
                                    ) : null}
                                </div>
                                <span className="g5-sheet-item-label">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="g5-mobile-sheet-user">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {renderUserAvatar(38, '0.9rem')}
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{username}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-primary)', fontWeight: 700 }}>{userRole} • {userCampus}</div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="g5-btn-outline"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>

        </div>
    );
};

export default G5TrainingPortal;
