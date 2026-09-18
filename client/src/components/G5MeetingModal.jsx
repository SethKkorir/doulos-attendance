import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code';
import {
    X,
    Users,
    Radio,
    Search,
    Clock,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Trash2,
    UserPlus,
    Calendar,
    MapPin,
    Copy,
    Check,
    Download,
    Filter,
    Shield,
    Sparkles,
    UserX,
    Activity,
    ChevronRight,
    RefreshCw,
    QrCode,
    Printer,
    ExternalLink,
    Edit
} from 'lucide-react';

const G5MeetingModal = ({ meeting, onClose, api, onRefresh, onEditMeeting }) => {
    // Automatically resolve initial tab: 'live' or anything else maps to 'attended' so it loads immediately
    const resolveInitialTab = (tab) => {
        if (tab === 'qrcode') return 'qrcode';
        if (tab === 'answers') return 'answers';
        if (tab === 'absent' || tab === 'checklist') return 'absent';
        return 'attended';
    };

    const [activeTab, setActiveTab] = useState(() => resolveInitialTab(meeting?.initialTab));

    useEffect(() => {
        setActiveTab(resolveInitialTab(meeting?.initialTab));
    }, [meeting?._id, meeting?.initialTab]);

    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All'); // 'All' | 'Douloid' | 'Recruit'
    const [selectedRegs, setSelectedRegs] = useState(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [weeklyAttendedMap, setWeeklyAttendedMap] = useState(new Map()); // studentRegNo -> meetingName
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const showToast = (msg, isError = false) => {
        setToastMessage({ text: msg, isError });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Helper: calculate Monday-Sunday week range
    const getWeekRange = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        const start = new Date(d);
        start.setDate(d.getDate() + diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    // Fetch attendance records, campus members, and other weekly meetings
    const fetchData = async (silent = false) => {
        if (!meeting?._id) return;
        if (!silent) setLoading(true);
        try {
            const [attRes, memRes, meetingsRes] = await Promise.allSettled([
                api.get(`/attendance/${meeting._id}`),
                api.get(`/members?campus=All&includeArchived=true`),
                api.get('/meetings?includeArchived=true')
            ]);

            if (attRes.status === 'fulfilled') {
                setAttendanceRecords(attRes.value.data || []);
            }
            if (memRes.status === 'fulfilled') {
                setAllMembers(memRes.value.data || []);
            }

            // Check other meetings in the same week to enforce 1 attendance per week
            if (meetingsRes.status === 'fulfilled' && meeting.date) {
                const allMeetings = meetingsRes.value.data || [];
                const range = getWeekRange(meeting.date);
                const otherM = allMeetings.filter(m => {
                    if (m._id === meeting._id) return false;
                    const md = new Date(m.date);
                    return md >= range.start && md <= range.end;
                });

                if (otherM.length > 0) {
                    const otherAttResults = await Promise.allSettled(
                        otherM.map(om => api.get(`/attendance/${om._id}`).then(r => ({ meeting: om, records: r.data || [] })))
                    );
                    const map = new Map();
                    otherAttResults.forEach(res => {
                        if (res.status === 'fulfilled') {
                            const { meeting: om, records } = res.value;
                            const campusLabel = om.campus === 'Valley Road' ? 'Nairobi' : om.campus;
                            records.forEach(r => {
                                const reg = String(r.studentRegNo || '').trim().toUpperCase();
                                map.set(reg, `${om.name || 'Meeting'} (${campusLabel})`);
                            });
                        }
                    });
                    setWeeklyAttendedMap(map);
                } else {
                    setWeeklyAttendedMap(new Map());
                }
            }
        } catch (err) {
            console.error('Failed to load meeting attendance data:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Polling if meeting is active for true real-time live attendance feed
        if (meeting?.isActive) {
            const timer = setInterval(() => {
                fetchData(true);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [meeting?._id, meeting?.isActive]);

    // Map attended records with registry members
    const attendedList = useMemo(() => {
        return attendanceRecords.map(record => {
            const regUpper = String(record.studentRegNo || '').trim().toUpperCase();
            const memberObj = allMembers.find(
                m => String(m.studentRegNo || '').trim().toUpperCase() === regUpper
            );
            return {
                ...record,
                memberName: record.memberName || record.responses?.studentName || memberObj?.name || 'Member',
                memberType: record.memberType || memberObj?.memberType || (memberObj?.status === 'Recruit' ? 'Recruit' : 'Douloid'),
                campus: record.campus || memberObj?.campus || meeting?.campus || 'Athi River',
                answer: record.responses?.answer || record.answer || null
            };
        });
    }, [attendanceRecords, allMembers, meeting?.campus]);

    // Absent members (in registry for this meeting's campus who have not yet checked in)
    const absentList = useMemo(() => {
        const attendedSet = new Set(
            attendanceRecords.map(a => String(a.studentRegNo || '').trim().toUpperCase())
        );
        const targetMembers = (meeting?.campus && meeting.campus !== 'Both' && meeting.campus !== 'All')
            ? allMembers.filter(m => m.campus === meeting.campus)
            : allMembers;

        return targetMembers.filter(
            m => !attendedSet.has(String(m.studentRegNo || '').trim().toUpperCase()) &&
                 m.status !== 'Archived' &&
                 m.status !== 'Archived-Concluded'
        );
    }, [allMembers, attendanceRecords, meeting?.campus]);

    // Filtered lists based on search and role filter
    const filteredAttended = useMemo(() => {
        return attendedList.filter(item => {
            const matchesSearch = !searchQuery ||
                item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.answer && item.answer.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesType = filterType === 'All' || item.memberType === filterType;
            return matchesSearch && matchesType;
        });
    }, [attendedList, searchQuery, filterType]);

    const filteredAbsent = useMemo(() => {
        return absentList.filter(item => {
            const matchesSearch = !searchQuery ||
                (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.studentRegNo && item.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesType = filterType === 'All' || item.memberType === filterType;
            return matchesSearch && matchesType;
        });
    }, [absentList, searchQuery, filterType]);

    const answeredList = useMemo(() => {
        return attendedList.filter(a => !!a.answer);
    }, [attendedList]);

    // Stipulated meeting start time validation
    const timingStatus = useMemo(() => {
        if (!meeting?.startTime || !meeting?.date) {
            return { hasStarted: true, hasEnded: false, statusText: 'Active', isBefore: false };
        }
        try {
            const now = new Date();
            // Kenyan/Local Date components
            const mDate = new Date(meeting.date);
            const mYear = mDate.getFullYear();
            const mMonth = mDate.getMonth();
            const mDay = mDate.getDate();

            const [sHours, sMinutes] = meeting.startTime.split(':').map(Number);
            const [eHours, eMinutes] = (meeting.endTime || '23:59').split(':').map(Number);

            const startDateTime = new Date(mYear, mMonth, mDay, sHours || 0, sMinutes || 0, 0);
            const endDateTime = new Date(mYear, mMonth, mDay, eHours || 23, eMinutes || 59, 59);

            const isBefore = now < startDateTime;
            const hasEnded = now > endDateTime;
            const hasStarted = !isBefore && !hasEnded;

            let statusText = 'Live Session Active';
            if (isBefore) {
                // Check if it is today or future date
                const isToday = now.toDateString() === mDate.toDateString();
                statusText = isToday 
                    ? `Starts at ${meeting.startTime}`
                    : `Scheduled for ${mDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${meeting.startTime}`;
            } else if (hasEnded) {
                statusText = 'Session Ended';
            }

            return { hasStarted, hasEnded, isBefore, statusText, startDateTime };
        } catch (e) {
            return { hasStarted: true, hasEnded: false, statusText: 'Active', isBefore: false };
        }
    }, [meeting?.date, meeting?.startTime, meeting?.endTime]);

    // Copy check-in link
    const [copiedLink, setCopiedLink] = useState(false);
    const checkInUrl = meeting?.code ? `${window.location.origin}/check-in/${meeting.code}` : '';

    const handleCopyLink = () => {
        if (!checkInUrl) return;
        navigator.clipboard.writeText(checkInUrl);
        setCopiedLink(true);
        showToast('Check-in link copied to clipboard!');
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // Print meeting QR poster
    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Doulos Meeting QR - ${meeting.name || 'Session'}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; color: #1E1B39; }
                        .card { border: 2px solid #25AAE1; border-radius: 24px; padding: 40px; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                        .title { font-size: 24px; font-weight: 900; margin-bottom: 6px; }
                        .sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }
                        .qr-box { padding: 20px; background: #fff; border-radius: 16px; display: inline-block; border: 1px solid #e2e8f0; margin-bottom: 20px; }
                        .link { font-size: 13px; color: #64748b; word-break: break-all; margin-top: 12px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div style="font-size: 12px; font-weight: 800; color: #25AAE1; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">DOULOS ATTENDANCE CHECK-IN</div>
                        <div class="title">${meeting.name || 'Training Session'}</div>
                        <div class="sub">${meeting.campus || 'Campus'} • ${new Date(meeting.date).toLocaleDateString()} • ${meeting.startTime || ''} - ${meeting.endTime || ''}</div>
                        <div class="qr-box">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(checkInUrl)}" width="260" height="260" alt="Meeting QR" />
                        </div>
                        <div class="link">Scan with camera to check in: ${checkInUrl}</div>
                    </div>
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 400); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Quick manual check-in
    const handleCheckInMember = async (studentRegNo, name, memberId) => {
        if (timingStatus.isBefore && !meeting.isTestMeeting) {
            showToast(`Meeting check-in unlocks at ${meeting.startTime || 'stipulated time'}.`, true);
            return;
        }
        const actionKey = studentRegNo || memberId || name;
        setActionLoading(actionKey);
        try {
            await api.post('/attendance/manual', {
                meetingId: meeting._id,
                studentRegNo: studentRegNo ? studentRegNo.trim().toUpperCase() : '',
                name: name,
                memberId: memberId,
                reason: 'G5 Training Coordinator Check-In'
            });
            showToast(`Checked in ${name || studentRegNo}`);
            fetchData(true);
            if (onRefresh) onRefresh();
        } catch (err) {
            showToast(err.response?.data?.message || 'Check-in failed', true);
        } finally {
            setActionLoading(null);
        }
    };

    // Bulk check-in
    const handleBulkCheckIn = async () => {
        if (selectedRegs.size === 0) return;
        if (timingStatus.isBefore && !meeting.isTestMeeting) {
            showToast(`Meeting check-in unlocks at ${meeting.startTime || 'stipulated time'}.`, true);
            return;
        }
        setBulkLoading(true);
        try {
            await api.post('/attendance/manual/bulk', {
                meetingId: meeting._id,
                studentRegNos: Array.from(selectedRegs),
                reason: 'G5 Training Coordinator Bulk Check-In'
            });
            showToast(`Successfully checked in ${selectedRegs.size} members!`);
            setSelectedRegs(new Set());
            fetchData(true);
            if (onRefresh) onRefresh();
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk check-in failed', true);
        } finally {
            setBulkLoading(false);
        }
    };

    // Remove attendee
    const handleRemoveAttendee = async (recordId, name) => {
        if (!window.confirm(`Are you sure you want to remove attendance for ${name}?`)) return;
        setActionLoading(recordId);
        try {
            await api.delete(`/attendance/${recordId}`);
            showToast(`Removed attendance record for ${name}`);
            fetchData(true);
            if (onRefresh) onRefresh();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not remove record', true);
        } finally {
            setActionLoading(null);
        }
    };

    // Toggle multi-select
    const toggleSelectReg = (regNo) => {
        const upper = regNo.trim().toUpperCase();
        const next = new Set(selectedRegs);
        if (next.has(upper)) next.delete(upper);
        else next.add(upper);
        setSelectedRegs(next);
    };

    const handleSelectAllAbsent = () => {
        const eligibleToSelect = filteredAbsent.filter(
            m => !weeklyAttendedMap.has(String(m.studentRegNo).trim().toUpperCase())
        );
        if (selectedRegs.size === eligibleToSelect.length && eligibleToSelect.length > 0) {
            setSelectedRegs(new Set());
        } else {
            setSelectedRegs(new Set(eligibleToSelect.map(m => String(m.studentRegNo).trim().toUpperCase())));
        }
    };

    // Export CSV
    const handleExportCSV = () => {
        if (attendedList.length === 0) {
            showToast('No attendees to export', true);
            return;
        }
        const headers = ['Name', 'Admission No', 'Role', 'Campus', 'Check-In Time', 'Question Answer'];
        const rows = attendedList.map(a => [
            `"${a.memberName}"`,
            `"${a.studentRegNo}"`,
            `"${a.memberType}"`,
            `"${a.campus}"`,
            `"${new Date(a.timestamp).toLocaleString()}"`,
            `"${(a.answer || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${meeting.name || 'meeting'}_attendance_${new Date(meeting.date).toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Exported CSV roster successfully!');
    };

    const questionText = meeting.questionOfDay || meeting.question || '';

    return (
        <div
            className="g5-modal-backdrop"
            style={{
                zIndex: 9999,
                padding: isMobile ? '0' : '1.25rem',
                display: 'flex',
                alignItems: isMobile ? 'flex-end' : 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
        >
            <div
                className="g5-modal-container"
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: isMobile ? '20px 20px 0 0' : '24px',
                    width: isMobile ? '100vw' : '96vw',
                    maxWidth: isMobile ? '100vw' : '1040px',
                    height: isMobile ? '96vh' : '93vh',
                    maxHeight: isMobile ? '96vh' : '920px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isMobile ? 'none' : '0 25px 60px -15px rgba(15, 23, 42, 0.4)',
                    border: isMobile ? 'none' : '1px solid var(--color-border)',
                    overflow: 'hidden',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* TOAST ALERT */}
                {toastMessage && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '0.75rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 100,
                            background: toastMessage.isError ? '#FEE2E2' : '#DCFCE7',
                            border: `1.5px solid ${toastMessage.isError ? '#EF4444' : '#10B981'}`,
                            color: toastMessage.isError ? '#991B1B' : '#14532D',
                            padding: '0.6rem 1rem',
                            borderRadius: '12px',
                            fontSize: '0.84rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            maxWidth: '90%',
                            boxSizing: 'border-box',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    >
                        {toastMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        <span>{toastMessage.text}</span>
                    </div>
                )}

                {/* MODAL HEADER - DEDICATED MOBILE & DESKTOP DESIGNS */}
                <div
                    className="g5-meeting-modal-header"
                    style={{
                        padding: isMobile ? '0.65rem 0.85rem 0.55rem' : '1.15rem 1.75rem 0.95rem',
                        borderBottom: '1px solid #E2E8F0',
                        background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
                        flexShrink: 0
                    }}
                >
                    {isMobile ? (
                        /* MOBILE CLEAN, COMPACT HEADER */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {/* ROW 1: Title + Status + Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
                                    <h3 style={{
                                        fontSize: '1.15rem',
                                        fontWeight: 900,
                                        color: '#0F172A',
                                        margin: 0,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {meeting.name || 'Training Session'}
                                    </h3>
                                    <span className={`g5-pill ${!meeting.isActive ? 'g5-pill-inactive' : timingStatus.isBefore ? 'g5-pill-purple' : 'g5-pill-active'}`} style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem', flexShrink: 0, fontWeight: 800 }}>
                                        {!meeting.isActive ? 'Ended' : timingStatus.isBefore ? (meeting.startTime || 'Soon') : 'Live'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                    {onEditMeeting && (
                                        <button
                                            type="button"
                                            onClick={() => onEditMeeting(meeting)}
                                            style={{
                                                padding: '0.35rem 0.55rem',
                                                background: '#EEF2FF',
                                                color: '#4F46E5',
                                                border: '1.5px solid #C7D2FE',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.72rem',
                                                fontWeight: 800
                                            }}
                                            title="Edit meeting"
                                        >
                                            <Edit size={13} />
                                            <span>Edit</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('qrcode')}
                                        style={{
                                            padding: '0.35rem 0.55rem',
                                            background: activeTab === 'qrcode' ? '#0284C7' : '#E0F2FE',
                                            color: activeTab === 'qrcode' ? '#FFFFFF' : '#0284C7',
                                            border: '1.5px solid #BAE6FD',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.72rem',
                                            fontWeight: 800
                                        }}
                                        title="QR Code"
                                    >
                                        <QrCode size={13} />
                                        <span>QR</span>
                                    </button>

                                    <button
                                        onClick={onClose}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: '#F1F5F9',
                                            border: '1px solid #CBD5E1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#475569'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* ROW 2: Single-line Compact Metadata Strip */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.72rem',
                                color: '#64748B',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                    {meeting.location?.name || meeting.venue || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                </span>
                                <span>•</span>
                                <span>{meeting.campus || 'Athi River'}</span>
                                <span>•</span>
                                <span>{new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <span>•</span>
                                <span>{meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}</span>
                            </div>

                            {/* ROW 3: Optional Compact Question Bar */}
                            {questionText && (
                                <div
                                    style={{
                                        padding: '0.25rem 0.55rem',
                                        background: '#FEF3C7',
                                        border: '1px solid #FDE68A',
                                        borderRadius: '7px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        fontSize: '0.72rem',
                                        color: '#92400E',
                                        fontWeight: 700
                                    }}
                                >
                                    <MessageCircle size={12} style={{ color: '#D97706', flexShrink: 0 }} />
                                    <span style={{ color: '#78350F', fontWeight: 800 }}>Q:</span>
                                    <span style={{ fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                                        "{questionText}"
                                    </span>
                                    {answeredList.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('answers')}
                                            style={{
                                                fontSize: '0.68rem',
                                                fontWeight: 800,
                                                color: '#2563EB',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                flexShrink: 0,
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            {answeredList.length} Ans →
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ROW 4: Segmented Tabs + Action Icons */}
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.25rem',
                                        background: '#F1F5F9',
                                        padding: '3px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #CBD5E1',
                                        flex: 1,
                                        overflowX: 'auto',
                                        scrollbarWidth: 'none'
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('attended')}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            padding: '0.38rem 0.45rem',
                                            borderRadius: '7px',
                                            border: 'none',
                                            background: activeTab === 'attended' ? '#10B981' : 'transparent',
                                            color: activeTab === 'attended' ? '#FFFFFF' : '#334155',
                                            fontWeight: 800,
                                            fontSize: '0.76rem',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <CheckCircle2 size={13} />
                                        <span>Attended</span>
                                        <span
                                            style={{
                                                padding: '0.05rem 0.35rem',
                                                borderRadius: '999px',
                                                fontSize: '0.66rem',
                                                fontWeight: 800,
                                                background: activeTab === 'attended' ? 'rgba(255, 255, 255, 0.25)' : '#DCFCE7',
                                                color: activeTab === 'attended' ? '#FFFFFF' : '#15803D'
                                            }}
                                        >
                                            {attendedList.length}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('absent')}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            padding: '0.38rem 0.45rem',
                                            borderRadius: '7px',
                                            border: 'none',
                                            background: activeTab === 'absent' ? '#1D4ED8' : 'transparent',
                                            color: activeTab === 'absent' ? '#FFFFFF' : '#334155',
                                            fontWeight: 800,
                                            fontSize: '0.76rem',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <UserPlus size={13} />
                                        <span>Check In</span>
                                        <span
                                            style={{
                                                padding: '0.05rem 0.35rem',
                                                borderRadius: '999px',
                                                fontSize: '0.66rem',
                                                fontWeight: 800,
                                                background: activeTab === 'absent' ? 'rgba(255, 255, 255, 0.25)' : '#EFF6FF',
                                                color: activeTab === 'absent' ? '#FFFFFF' : '#1D4ED8'
                                            }}
                                        >
                                            {absentList.length}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('qrcode')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            padding: '0.38rem 0.5rem',
                                            borderRadius: '7px',
                                            border: 'none',
                                            background: activeTab === 'qrcode' ? '#0284C7' : 'transparent',
                                            color: activeTab === 'qrcode' ? '#FFFFFF' : '#334155',
                                            fontWeight: 800,
                                            fontSize: '0.76rem',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <QrCode size={13} />
                                        <span>QR</span>
                                    </button>

                                    {questionText && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('answers')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.25rem',
                                                padding: '0.38rem 0.5rem',
                                                borderRadius: '7px',
                                                border: 'none',
                                                background: activeTab === 'answers' ? '#D97706' : 'transparent',
                                                color: activeTab === 'answers' ? '#FFFFFF' : '#334155',
                                                fontWeight: 800,
                                                fontSize: '0.76rem',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <MessageCircle size={13} />
                                            <span>Q&A</span>
                                            <span
                                                style={{
                                                    padding: '0.05rem 0.35rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.66rem',
                                                    fontWeight: 800,
                                                    background: activeTab === 'answers' ? 'rgba(255, 255, 255, 0.25)' : '#FEF3C7',
                                                    color: activeTab === 'answers' ? '#FFFFFF' : '#92400E'
                                                }}
                                            >
                                                {answeredList.length}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                <button
                                    className="g5-btn-outline"
                                    style={{ padding: '0.35rem 0.55rem', height: '32px', flexShrink: 0 }}
                                    onClick={() => fetchData(false)}
                                    title="Refresh"
                                >
                                    <RefreshCw size={13} className={loading ? 'g5-spin' : ''} />
                                </button>
                                <button
                                    className="g5-btn-outline"
                                    style={{ padding: '0.35rem 0.55rem', height: '32px', flexShrink: 0 }}
                                    onClick={handleExportCSV}
                                    title="CSV Export"
                                >
                                    <Download size={13} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* DESKTOP FULL HEADER */
                        <div>
                            {/* ROW 1: STATUS, VENUE, TIME & ACTION CONTROLS */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', minWidth: 0 }}>
                                    <span className={`g5-pill ${!meeting.isActive ? 'g5-pill-inactive' : timingStatus.isBefore ? 'g5-pill-purple' : 'g5-pill-active'}`} style={{ fontSize: '0.7rem', padding: '0.18rem 0.55rem', fontWeight: 800 }}>
                                        {!meeting.isActive ? 'Session Ended' : timingStatus.isBefore ? (meeting.startTime ? `Starts at ${meeting.startTime}` : 'Scheduled') : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                                                Live Session Active
                                            </span>
                                        )}
                                    </span>
                                    <span className="g5-pill g5-pill-warm" style={{ fontSize: '0.7rem', padding: '0.18rem 0.55rem' }}>
                                        <MapPin size={11} /> {meeting.location?.name || meeting.venue || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                    </span>
                                    <span className="g5-pill g5-pill-purple" style={{ fontSize: '0.7rem', padding: '0.18rem 0.55rem' }}>
                                        <Calendar size={11} /> {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="g5-pill g5-pill-purple" style={{ fontSize: '0.7rem', padding: '0.18rem 0.55rem' }}>
                                        <Clock size={11} /> {meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}
                                    </span>
                                </div>

                                {/* Top Action Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                    {onEditMeeting && (
                                        <button
                                            type="button"
                                            onClick={() => onEditMeeting(meeting)}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                padding: '0.35rem 0.65rem',
                                                background: '#EEF2FF',
                                                color: '#4F46E5',
                                                border: '1.5px solid #C7D2FE',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.76rem',
                                                fontWeight: 800
                                            }}
                                            title="Edit meeting"
                                        >
                                            <Edit size={13} />
                                            <span>Edit</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('qrcode')}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            padding: '0.35rem 0.65rem',
                                            background: activeTab === 'qrcode' ? '#0284C7' : '#E0F2FE',
                                            color: activeTab === 'qrcode' ? '#FFFFFF' : '#0284C7',
                                            border: '1.5px solid #BAE6FD',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.76rem',
                                            fontWeight: 800
                                        }}
                                        title="Show QR Screen"
                                    >
                                        <QrCode size={13} />
                                        <span>QR Screen</span>
                                    </button>

                                    <button
                                        onClick={onClose}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: '#F1F5F9',
                                            border: '1px solid #CBD5E1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#475569'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* ROW 2: TITLE & OPTIONAL QUESTION SNIPPET */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
                                    {meeting.name || 'Training Session'}
                                </h2>

                                {questionText && (
                                    <div
                                        style={{
                                            padding: '0.3rem 0.65rem',
                                            background: '#FEF3C7',
                                            border: '1px solid #FDE68A',
                                            borderRadius: '8px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.76rem',
                                            color: '#92400E',
                                            fontWeight: 700,
                                            maxWidth: '100%'
                                        }}
                                    >
                                        <MessageCircle size={13} style={{ color: '#D97706', flexShrink: 0 }} />
                                        <span style={{ color: '#78350F' }}>Question:</span>
                                        <span style={{ fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                                            "{questionText}"
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ROW 3: UNIFIED SEGMENTED TABS & CONTROLS */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.25rem',
                                        background: '#F1F5F9',
                                        padding: '3px',
                                        borderRadius: '11px',
                                        border: '1.5px solid #CBD5E1'
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('attended')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            padding: '0.45rem 0.95rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: activeTab === 'attended' ? '#10B981' : 'transparent',
                                            color: activeTab === 'attended' ? '#FFFFFF' : '#334155',
                                            fontWeight: 800,
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            boxShadow: activeTab === 'attended' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                                            transition: 'all 0.15s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <CheckCircle2 size={14} />
                                        <span>Attended</span>
                                        <span
                                            style={{
                                                padding: '0.08rem 0.4rem',
                                                borderRadius: '999px',
                                                fontSize: '0.68rem',
                                                fontWeight: 800,
                                                background: activeTab === 'attended' ? 'rgba(255, 255, 255, 0.28)' : '#DCFCE7',
                                                color: activeTab === 'attended' ? '#FFFFFF' : '#15803D'
                                            }}
                                        >
                                            {attendedList.length}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('absent')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            padding: '0.45rem 0.95rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: activeTab === 'absent' ? '#1D4ED8' : 'transparent',
                                            color: activeTab === 'absent' ? '#FFFFFF' : '#334155',
                                            fontWeight: 800,
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            boxShadow: activeTab === 'absent' ? '0 2px 8px rgba(29, 78, 216, 0.3)' : 'none',
                                            transition: 'all 0.15s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <UserPlus size={14} />
                                        <span>Check In Roster</span>
                                        <span
                                            style={{
                                                padding: '0.08rem 0.4rem',
                                                borderRadius: '999px',
                                                fontSize: '0.68rem',
                                                fontWeight: 800,
                                                background: activeTab === 'absent' ? 'rgba(255, 255, 255, 0.28)' : '#EFF6FF',
                                                color: activeTab === 'absent' ? '#FFFFFF' : '#1D4ED8'
                                            }}
                                        >
                                            {absentList.length}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('qrcode')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            padding: '0.45rem 0.85rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: activeTab === 'qrcode' ? '#0284C7' : 'transparent',
                                            color: activeTab === 'qrcode' ? '#FFFFFF' : '#334155',
                                            fontWeight: 800,
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            boxShadow: activeTab === 'qrcode' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                                            transition: 'all 0.15s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <QrCode size={14} />
                                        <span>QR Screen</span>
                                    </button>

                                    {questionText && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('answers')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.35rem',
                                                padding: '0.45rem 0.85rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: activeTab === 'answers' ? '#D97706' : 'transparent',
                                                color: activeTab === 'answers' ? '#FFFFFF' : '#334155',
                                                fontWeight: 800,
                                                fontSize: '0.82rem',
                                                cursor: 'pointer',
                                                boxShadow: activeTab === 'answers' ? '0 2px 8px rgba(217, 119, 6, 0.3)' : 'none',
                                                transition: 'all 0.15s ease',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <MessageCircle size={14} />
                                            <span>Q&A</span>
                                            <span
                                                style={{
                                                    padding: '0.08rem 0.4rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 800,
                                                    background: activeTab === 'answers' ? 'rgba(255, 255, 255, 0.28)' : '#FEF3C7',
                                                    color: activeTab === 'answers' ? '#FFFFFF' : '#92400E'
                                                }}
                                            >
                                                {answeredList.length}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                {/* REFRESH & CSV BUTTONS */}
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                    <button
                                        className="g5-btn-outline"
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', height: '34px' }}
                                        onClick={() => fetchData(false)}
                                        title="Refresh roster"
                                    >
                                        <RefreshCw size={13} className={loading ? 'g5-spin' : ''} />
                                        <span>Refresh</span>
                                    </button>
                                    <button
                                        className="g5-btn-outline"
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', height: '34px' }}
                                        onClick={handleExportCSV}
                                        title="Export attendance to CSV"
                                    >
                                        <Download size={13} />
                                        <span>CSV</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* SEARCH & ROLE FILTER BAR (Active on Attended & Check In tabs) */}
                {(activeTab === 'attended' || activeTab === 'absent') && (
                    <div
                        className="g5-modal-filter-bar"
                        style={{
                            padding: isMobile ? '0.45rem 0.75rem' : '0.75rem 2rem',
                            background: '#FFFFFF',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'stretch' : 'center',
                            justifyContent: 'space-between',
                            gap: '0.45rem',
                            flexShrink: 0
                        }}
                    >
                        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : '240px', maxWidth: isMobile ? '100%' : '440px' }}>
                            <Search
                                size={15}
                                style={{
                                    position: 'absolute',
                                    left: '11px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: searchQuery ? '#2563EB' : '#64748B',
                                    pointerEvents: 'none'
                                }}
                            />
                            <input
                                type="text"
                                placeholder={activeTab === 'absent' ? "Type name or admission number to check in..." : "Search attended members..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '0.45rem 2rem 0.45rem 2.1rem' : '0.55rem 2.2rem 0.55rem 2.3rem',
                                    borderRadius: '9px',
                                    border: '1.5px solid #CBD5E1',
                                    fontSize: '0.84rem',
                                    backgroundColor: '#FFFFFF',
                                    color: '#0F172A',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '9px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: '#E2E8F0',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#475569',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        padding: 0
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* SUB-FILTER BUTTONS */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            background: '#F1F5F9',
                            padding: '2.5px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            width: isMobile ? '100%' : 'auto'
                        }}>
                            {['All', 'Douloid', 'Recruit'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFilterType(type)}
                                    style={{
                                        flex: isMobile ? 1 : 'initial',
                                        padding: isMobile ? '0.28rem 0.5rem' : '0.35rem 0.85rem',
                                        borderRadius: '6px',
                                        fontSize: '0.76rem',
                                        fontWeight: filterType === type ? 800 : 600,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: filterType === type ? '#1D4ED8' : 'transparent',
                                        color: filterType === type ? '#FFFFFF' : '#64748B',
                                        boxShadow: filterType === type ? '0 1px 4px rgba(29, 78, 216, 0.25)' : 'none',
                                        textAlign: 'center',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* SCROLLABLE MODAL CONTENT BODY */}
                <div
                    className="g5-modal-scroll-body"
                    style={{
                        flex: '1 1 auto',
                        minHeight: 0,
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        padding: isMobile ? '0.65rem 0.75rem calc(3rem + env(safe-area-inset-bottom, 20px))' : '1.5rem 2rem',
                        backgroundColor: '#F8FAFC'
                    }}
                >
                    {/* MOBILE TOP BANNER: Question of the Day (inside scroll body so it scrolls away naturally) */}
                    {isMobile && questionText && (
                        <div
                            style={{
                                marginBottom: '0.65rem',
                                padding: '0.45rem 0.75rem',
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                fontSize: '0.74rem'
                            }}
                        >
                            <MessageCircle size={13} style={{ color: '#2563EB', flexShrink: 0 }} />
                            <span style={{ color: '#64748B', fontWeight: 700 }}>Q:</span>
                            <span style={{ color: '#0F172A', fontWeight: 800, fontStyle: 'italic', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                "{questionText}"
                            </span>
                            {answeredList.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('answers')}
                                    style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        color: '#2563EB',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        textDecoration: 'underline',
                                        flexShrink: 0
                                    }}
                                >
                                    {answeredList.length} Ans →
                                </button>
                            )}
                        </div>
                    )}

                    {/* TAB 1: ATTENDED MEMBERS */}
                    {activeTab === 'attended' && (
                        <div>
                            {filteredAttended.length === 0 ? (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: isMobile ? '2.5rem 1rem' : '4rem 2rem',
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        border: '1.5px dashed #CBD5E1'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '52px',
                                            height: '52px',
                                            borderRadius: '50%',
                                            background: '#EFF6FF',
                                            color: '#1D4ED8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 0.75rem'
                                        }}
                                    >
                                        <Users size={24} />
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                                        {searchQuery ? 'No attendees match your search' : 'No Attendees Checked In Yet'}
                                    </h4>
                                    <p style={{ margin: '0.35rem 0 1.25rem', fontSize: '0.84rem', color: '#64748B' }}>
                                        {searchQuery
                                            ? 'Try searching by a different name or admission number.'
                                            : 'When members scan the QR code or get manually checked in, they appear here live.'}
                                    </p>
                                    <button
                                        type="button"
                                        className="g5-btn-blue-solid"
                                        style={{ margin: '0 auto', width: isMobile ? '100%' : 'auto', maxWidth: '300px', justifyContent: 'center' }}
                                        onClick={() => setActiveTab('absent')}
                                    >
                                        <UserPlus size={16} /> Open Check-In Roster ({absentList.length} Unchecked)
                                    </button>
                                </div>
                            ) : isMobile ? (
                                /* MOBILE ATTENDEES CARDS */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                    {filteredAttended.map((record) => (
                                        <div
                                            key={record._id || record.studentRegNo}
                                            style={{
                                                background: '#FFFFFF',
                                                borderRadius: '13px',
                                                border: '1.5px solid #E2E8F0',
                                                padding: '0.65rem 0.85rem',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                                                <div
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: record.memberType === 'Douloid' ? '#EFF6FF' : '#FEF3C7',
                                                        color: record.memberType === 'Douloid' ? '#1D4ED8' : '#D97706',
                                                        fontWeight: 900,
                                                        fontSize: '0.8rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    ✓
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {record.memberName}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>
                                                            {record.studentRegNo}
                                                        </span>
                                                        <span>•</span>
                                                        <span className={`g5-pill ${record.memberType === 'Douloid' ? 'g5-pill-active' : 'g5-pill-recruit'}`} style={{ fontSize: '0.64rem', padding: '0.08rem 0.35rem' }}>
                                                            {record.memberType}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    {questionText && record.answer && (
                                                        <div style={{ marginTop: '4px', fontSize: '0.75rem', fontStyle: 'italic', color: '#334155', background: '#F8FAFC', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            "{record.answer}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAttendee(record._id, record.memberName)}
                                                disabled={actionLoading === record._id}
                                                style={{
                                                    background: '#FEE2E2',
                                                    border: 'none',
                                                    color: '#DC2626',
                                                    cursor: 'pointer',
                                                    padding: '0.45rem',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}
                                                title="Remove attendance"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* DESKTOP ATTENDEES TABLE */
                                <div
                                    className="g5-table-wrap"
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        border: '1px solid #CBD5E1',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
                                    }}
                                >
                                    <table className="g5-table" style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th>Member Name</th>
                                                <th>Admission Number</th>
                                                <th>Role Type</th>
                                                <th>Check-In Time</th>
                                                {questionText && <th>Question Response</th>}
                                                <th style={{ textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAttended.map((record) => (
                                                <tr key={record._id || record.studentRegNo}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div
                                                                className="g5-avatar"
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    background: record.memberType === 'Douloid' ? '#EFF6FF' : '#FEF3C7',
                                                                    color: record.memberType === 'Douloid' ? '#1D4ED8' : '#D97706',
                                                                    fontWeight: 800,
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            >
                                                                {record.memberName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                                                                    {record.memberName}
                                                                </div>
                                                                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                                                    {record.campus}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB', fontSize: '0.85rem' }}>
                                                            {record.studentRegNo}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`g5-pill ${record.memberType === 'Douloid' ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                                            {record.memberType}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F172A', fontSize: '0.82rem', fontWeight: 600 }}>
                                                            <Clock size={13} style={{ color: '#64748B' }} />
                                                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    {questionText && (
                                                        <td style={{ maxWidth: '240px' }}>
                                                            {record.answer ? (
                                                                <div
                                                                    style={{
                                                                        fontSize: '0.82rem',
                                                                        color: '#0F172A',
                                                                        fontStyle: 'italic',
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis'
                                                                    }}
                                                                    title={record.answer}
                                                                >
                                                                    "{record.answer}"
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>—</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleRemoveAttendee(record._id, record.memberName)}
                                                            disabled={actionLoading === record._id}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#94A3B8',
                                                                cursor: 'pointer',
                                                                padding: '0.4rem',
                                                                borderRadius: '8px',
                                                                transition: 'all 0.15s'
                                                            }}
                                                            title="Remove attendee"
                                                            onMouseEnter={(e) => e.currentTarget.style.color = '#DC2626'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: CHECK IN ROSTER (ABSENT MEMBERS) */}
                    {activeTab === 'absent' && (
                        <div>
                            {/* STIPULATED START TIME ALERT */}
                            {timingStatus.isBefore && !meeting.isTestMeeting && (
                                <div style={{
                                    marginBottom: '0.75rem',
                                    padding: '0.65rem 0.85rem',
                                    background: '#EFF6FF',
                                    border: '1.5px solid #BFDBFE',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.55rem',
                                    fontSize: isMobile ? '0.78rem' : '0.84rem',
                                    color: '#1E40AF',
                                    fontWeight: 600
                                }}>
                                    <Clock size={16} style={{ color: '#2563EB', flexShrink: 0 }} />
                                    <span>
                                        Official check-in begins at <strong>{meeting.startTime || 'stipulated time'}</strong>. Manual check-ins will unlock automatically then.
                                    </span>
                                </div>
                            )}

                            {/* BULK ACTION BAR */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.65rem',
                                    background: '#FFFFFF',
                                    padding: isMobile ? '0.6rem 0.75rem' : '0.85rem 1.25rem',
                                    borderRadius: '12px',
                                    border: '1.5px solid #E2E8F0',
                                    flexWrap: 'wrap',
                                    gap: '0.55rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <button
                                        type="button"
                                        className="g5-btn-outline"
                                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem' }}
                                        onClick={handleSelectAllAbsent}
                                    >
                                        {selectedRegs.size === filteredAbsent.length && filteredAbsent.length > 0
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </button>
                                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                                        {selectedRegs.size} selected
                                    </span>
                                </div>

                                {selectedRegs.size > 0 && (
                                    <button
                                        type="button"
                                        className="g5-btn-blue-solid"
                                        disabled={bulkLoading}
                                        onClick={handleBulkCheckIn}
                                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
                                    >
                                        <Check size={15} />
                                        <span>Check In Selected ({selectedRegs.size})</span>
                                    </button>
                                )}
                            </div>

                            {filteredAbsent.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: isMobile ? '2.5rem 1rem' : '4rem 2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #CBD5E1' }}>
                                    <CheckCircle2 size={36} style={{ color: '#10B981', margin: '0 auto 0.75rem' }} />
                                    <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>All Members Checked In!</h4>
                                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                                        100% attendance recorded for this session.
                                    </p>
                                </div>
                            ) : isMobile ? (
                                /* MOBILE ABSENT CARDS */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {filteredAbsent.map((m) => {
                                        const regUpper = String(m.studentRegNo).trim().toUpperCase();
                                        const isSelected = selectedRegs.has(regUpper);
                                        const otherMeetingName = weeklyAttendedMap.get(regUpper);
                                        const initials = (m.name || 'D').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                                        return (
                                            <div
                                                key={m._id || m.studentRegNo}
                                                style={{
                                                    background: otherMeetingName ? '#F8FAFC' : '#FFFFFF',
                                                    borderRadius: '13px',
                                                    border: '1.5px solid #E2E8F0',
                                                    padding: '0.75rem 0.85rem',
                                                    opacity: otherMeetingName ? 0.75 : 1,
                                                    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '0.65rem'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={!!otherMeetingName}
                                                        onChange={() => toggleSelectReg(m.studentRegNo)}
                                                        style={{ cursor: otherMeetingName ? 'not-allowed' : 'pointer', width: '20px', height: '20px', flexShrink: 0, accentColor: '#2563EB' }}
                                                    />
                                                    
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        background: m.memberType === 'Douloid' ? '#EFF6FF' : '#F8FAFC',
                                                        color: m.memberType === 'Douloid' ? '#1D4ED8' : '#475569',
                                                        border: `1.5px solid ${m.memberType === 'Douloid' ? '#93C5FD' : '#CBD5E1'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 900,
                                                        fontSize: '0.88rem',
                                                        flexShrink: 0
                                                    }}>
                                                        {initials}
                                                    </div>

                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {m.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {m.studentRegNo && (
                                                                <>
                                                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>
                                                                        {m.studentRegNo}
                                                                    </span>
                                                                    <span style={{ color: '#CBD5E1' }}>•</span>
                                                                </>
                                                            )}
                                                            <span style={{ fontWeight: 600, color: m.memberType === 'Douloid' ? '#1D4ED8' : '#64748B' }}>
                                                                {m.memberType || 'Recruit'}
                                                            </span>
                                                            {otherMeetingName && (
                                                                <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.74rem' }}>
                                                                    • Attended {otherMeetingName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {otherMeetingName ? (
                                                    <span className="g5-pill g5-pill-inactive" style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', flexShrink: 0 }}>
                                                        Attended
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="g5-btn-blue-solid"
                                                        style={{
                                                            padding: '0.55rem 0.95rem',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 800,
                                                            borderRadius: '10px',
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0,
                                                            cursor: 'pointer'
                                                        }}
                                                        disabled={actionLoading === (m.studentRegNo || m._id || m.name)}
                                                        onClick={() => handleCheckInMember(m.studentRegNo, m.name, m._id)}
                                                    >
                                                        {actionLoading === (m.studentRegNo || m._id || m.name) ? '...' : '+ Check In'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* DESKTOP ABSENT TABLE */
                                <div
                                    className="g5-table-wrap"
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        border: '1px solid #CBD5E1',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <table className="g5-table" style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px' }}></th>
                                                <th>Member Name</th>
                                                <th>Admission Number</th>
                                                <th>Role</th>
                                                <th>Campus</th>
                                                <th style={{ textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAbsent.map((m) => {
                                                const regUpper = String(m.studentRegNo).trim().toUpperCase();
                                                const isSelected = selectedRegs.has(regUpper);
                                                const otherMeetingName = weeklyAttendedMap.get(regUpper);
                                                return (
                                                    <tr key={m._id || m.studentRegNo} style={otherMeetingName ? { opacity: 0.65, background: 'rgba(0,0,0,0.02)' } : {}}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                disabled={!!otherMeetingName}
                                                                onChange={() => toggleSelectReg(m.studentRegNo)}
                                                                style={{ cursor: otherMeetingName ? 'not-allowed' : 'pointer', width: '16px', height: '16px' }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div
                                                                    className="g5-avatar"
                                                                    style={{
                                                                        width: '34px',
                                                                        height: '34px',
                                                                        background: '#F1F5F9',
                                                                        color: '#64748B',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    {(m.name || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
                                                                        {m.name}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                                                        Consecutive Absences: {m.consecutiveAbsences || 0}
                                                                        {otherMeetingName && (
                                                                            <span style={{ color: '#DC2626', fontWeight: 700, marginLeft: '0.35rem' }}>
                                                                                • Attended {otherMeetingName}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {m.studentRegNo ? (
                                                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB', fontSize: '0.85rem' }}>
                                                                    {m.studentRegNo}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>—</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`g5-pill ${m.memberType === 'Douloid' ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                                                {m.memberType || 'Recruit'}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.85rem' }}>
                                                            {m.campus || 'Athi River'}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {otherMeetingName ? (
                                                                <span className="g5-pill g5-pill-inactive" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }} title={`Already attended ${otherMeetingName} this week`}>
                                                                    Attended This Week
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="g5-btn-blue-solid"
                                                                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                                                                    disabled={actionLoading === (m.studentRegNo || m._id || m.name)}
                                                                    onClick={() => handleCheckInMember(m.studentRegNo, m.name, m._id)}
                                                                >
                                                                    {actionLoading === (m.studentRegNo || m._id || m.name) ? '...' : '+ Check In'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: QR CODE PROJECTOR SCREEN */}
                    {activeTab === 'qrcode' && (
                        <div style={{ textAlign: 'center', padding: isMobile ? '1rem 0.5rem' : '1.5rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{
                                background: '#FFFFFF',
                                borderRadius: '24px',
                                padding: isMobile ? '1.5rem 1rem' : '2.25rem 1.5rem',
                                border: '1.5px solid rgba(37, 170, 225, 0.25)',
                                boxShadow: '0 16px 48px rgba(15, 23, 42, 0.08)'
                            }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 170, 225, 0.1)', color: '#0284C7', padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem' }}>
                                    <QrCode size={14} /> Scan With Phone Camera
                                </div>

                                <h3 style={{ fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.5rem' }}>
                                    {meeting.name || 'Weekly Training Meeting'}
                                </h3>
                                <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
                                    {meeting.campus} • {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} • {meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}
                                </p>

                                {/* QR CODE CONTAINER */}
                                <div style={{
                                    background: '#FFFFFF',
                                    padding: isMobile ? '1rem' : '1.25rem',
                                    borderRadius: '20px',
                                    display: 'inline-block',
                                    border: '2px solid rgba(37, 170, 225, 0.3)',
                                    boxShadow: '0 12px 36px rgba(37, 170, 225, 0.15)',
                                    marginBottom: '1.5rem',
                                    maxWidth: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <QRCode value={checkInUrl} size={Math.min(240, typeof window !== 'undefined' ? Math.max(170, window.innerWidth - 100) : 240)} level="H" />
                                </div>

                                {/* QUICK ACTIONS */}
                                <div style={{ display: 'flex', gap: '0.55rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                    <button
                                        type="button"
                                        className="g5-btn-secondary"
                                        onClick={handleCopyLink}
                                        style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.95rem' }}
                                    >
                                        {copiedLink ? <Check size={15} color="#10B981" /> : <Copy size={15} />}
                                        {copiedLink ? 'Link Copied!' : 'Copy Link'}
                                    </button>

                                    <a
                                        href={checkInUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="g5-btn-secondary"
                                        style={{ fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.95rem' }}
                                    >
                                        <ExternalLink size={15} /> Open Page
                                    </a>

                                    <button
                                        type="button"
                                        className="g5-btn-blue-solid"
                                        onClick={handlePrintQR}
                                        style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.95rem', background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' }}
                                    >
                                        <Printer size={15} /> Print Poster
                                    </button>
                                </div>

                                {/* LIVE CHECK-IN TALLY BADGE */}
                                <div style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '12px',
                                    padding: '0.65rem 1rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.65rem',
                                    fontSize: '0.85rem'
                                }}>
                                    <div className="g5-pulse-dot" style={{ width: '8px', height: '8px' }} />
                                    <span style={{ color: '#64748B' }}>Live Attendance:</span>
                                    <strong style={{ color: '#10B981', fontWeight: 800 }}>
                                        {attendedList.length} Checked In
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: QUESTION ANSWERS */}
                    {activeTab === 'answers' && questionText && (
                        <div>
                            {answeredList.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: isMobile ? '3rem 1rem' : '4rem 2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                                    <MessageCircle size={32} style={{ color: '#D97706', margin: '0 auto 0.75rem' }} />
                                    <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>No Answers Recorded Yet</h4>
                                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                                        When members answer "{questionText}" during check-in, their feedback will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
                                    {answeredList.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                background: '#FFFFFF',
                                                borderRadius: '14px',
                                                padding: '1rem',
                                                border: '1.5px solid #E2E8F0',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                        <div
                                                            className="g5-avatar"
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                background: '#EFF6FF',
                                                                color: '#1D4ED8',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 800
                                                            }}
                                                        >
                                                            {item.memberName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                                                                {item.memberName}
                                                            </div>
                                                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                                                                {item.studentRegNo}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`g5-pill ${item.memberType === 'Douloid' ? 'g5-pill-active' : 'g5-pill-recruit'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                                                        {item.memberType}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        background: '#F8FAFC',
                                                        borderRadius: '10px',
                                                        padding: '0.75rem 0.9rem',
                                                        border: '1px solid #E2E8F0',
                                                        fontSize: '0.85rem',
                                                        color: '#1E293B',
                                                        lineHeight: 1.5,
                                                        fontStyle: 'italic'
                                                    }}
                                                >
                                                    "{item.answer}"
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div
                    style={{
                        padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                        paddingBottom: isMobile ? 'calc(0.75rem + env(safe-area-inset-bottom, 8px))' : '1rem',
                        borderTop: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0
                    }}
                >
                    <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={13} />
                        <span>Real-time Doulos G5 Attendance Ledger</span>
                    </div>

                    <button
                        type="button"
                        className="g5-btn-secondary"
                        onClick={onClose}
                        style={{ padding: isMobile ? '0.48rem 1.15rem' : '0.55rem 1.5rem', fontSize: '0.84rem', fontWeight: 700 }}
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
};

export default G5MeetingModal;
