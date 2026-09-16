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
    ExternalLink
} from 'lucide-react';

const G5MeetingModal = ({ meeting, onClose, api, onRefresh }) => {
    // Automatically default to 'attended' ("Who Attended") so attendee roster displays immediately upon opening
    const resolveInitialTab = (tab) => {
        if (tab === 'live') return 'live';
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
                memberName: record.responses?.studentName || memberObj?.name || 'Cadre Member',
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

    // Copy join code
    const handleCopyCode = () => {
        if (!meeting?.code) return;
        navigator.clipboard.writeText(meeting.code);
        setCopiedCode(true);
        showToast('Meeting code copied to clipboard!');
        setTimeout(() => setCopiedCode(false), 2000);
    };

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
                        .code { font-size: 38px; font-weight: 900; letter-spacing: 4px; color: #25AAE1; margin-bottom: 8px; font-family: monospace; }
                        .link { font-size: 13px; color: #64748b; word-break: break-all; }
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
                        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">MEETING JOIN CODE</div>
                        <div class="code">${(meeting.code || 'DOULOS').toUpperCase()}</div>
                        <div class="link">${checkInUrl}</div>
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
    const handleCheckInMember = async (studentRegNo, name) => {
        setActionLoading(studentRegNo);
        try {
            await api.post('/attendance/manual', {
                meetingId: meeting._id,
                studentRegNo: studentRegNo.trim().toUpperCase(),
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
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(30, 27, 57, 0.55)',
                backdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
        >
            <div
                className="g5-modal-container"
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    width: '96vw',
                    maxWidth: '1040px',
                    height: '93vh',
                    maxHeight: '920px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 60px -15px rgba(107, 95, 168, 0.35)',
                    border: '1px solid var(--color-border)',
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
                            top: '1rem',
                            right: '4.5rem',
                            zIndex: 100,
                            background: toastMessage.isError ? '#FCEEEC' : '#EAF7F0',
                            border: `1px solid ${toastMessage.isError ? '#E07A6D' : '#4CAF7D'}`,
                            color: toastMessage.isError ? '#C53030' : '#22543D',
                            padding: '0.65rem 1.15rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    >
                        {toastMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        <span>{toastMessage.text}</span>
                    </div>
                )}

                {/* MODAL HEADER */}
                <div
                    className="g5-meeting-modal-header"
                    style={{
                        padding: '1.5rem 2rem 1.25rem',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        background: 'linear-gradient(180deg, #FAF9FC 0%, #FFFFFF 100%)',
                        flexShrink: 0
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                <span className={`g5-pill ${meeting.isActive ? 'g5-pill-active' : 'g5-pill-inactive'}`}>
                                    {meeting.isActive ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <div className="g5-pulse-dot" style={{ width: '7px', height: '7px' }} />
                                            Live Check-In Active
                                        </span>
                                    ) : (
                                        'Session Completed'
                                    )}
                                </span>
                                <span className="g5-pill g5-pill-purple">
                                    <Calendar size={13} /> {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="g5-pill g5-pill-purple">
                                    <Clock size={13} /> {meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}
                                </span>
                                <span className="g5-pill g5-pill-warm">
                                    <MapPin size={13} /> {meeting.location?.name || meeting.venue || (meeting.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-main)', margin: 0 }}>
                                    {meeting.name || 'Weekly Training Session'}
                                </h2>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                <div
                                    onClick={handleCopyCode}
                                    title="Click to copy check-in code"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.3rem 0.75rem',
                                        background: 'var(--color-primary-soft)',
                                        border: '1px solid rgba(107, 95, 168, 0.25)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.82rem',
                                        fontWeight: 800,
                                        color: 'var(--color-primary)',
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    <span>CODE: {meeting.code || 'DOULOS'}</span>
                                    {copiedCode ? <Check size={13} color="var(--color-status-active)" /> : <Copy size={13} />}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('qrcode')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.32rem 0.75rem',
                                        background: activeTab === 'qrcode' ? '#25AAE1' : 'rgba(37, 170, 225, 0.1)',
                                        color: activeTab === 'qrcode' ? '#FFFFFF' : '#25AAE1',
                                        border: '1px solid rgba(37, 170, 225, 0.3)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.82rem',
                                        fontWeight: 800,
                                        transition: 'all 0.15s ease'
                                    }}
                                    title="Display QR code screen for room/projector check-in"
                                >
                                    <QrCode size={14} />
                                    <span>Display QR</span>
                                </button>
                            </div>
                            </div>
                        </div>

                        {/* CLOSE BUTTON */}
                        <button
                            onClick={onClose}
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: 'var(--color-border-subtle)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-status-inactive-soft)';
                                e.currentTarget.style.color = 'var(--color-status-inactive)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* OPTIONAL CONTEXTUAL QUESTION CHIP */}
                    {questionText && (
                        <div
                            style={{
                                marginTop: '0.85rem',
                                padding: '0.6rem 1rem',
                                background: 'var(--color-page-bg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                fontSize: '0.85rem'
                            }}
                        >
                            <MessageCircle size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Discussion Prompt:</span>
                            <span style={{ color: 'var(--color-text-main)', fontWeight: 800, fontStyle: 'italic' }}>
                                "{questionText}"
                            </span>
                            {answeredList.length > 0 && (
                                <span
                                    onClick={() => setActiveTab('answers')}
                                    style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    View {answeredList.length} Responses →
                                </span>
                            )}
                        </div>
                    )}

                    {/* STAT COUNTERS STRIP */}
                    <div
                        className="g5-meeting-stat-strip"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '0.75rem',
                            marginTop: '1rem'
                        }}
                    >
                        <div
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid var(--color-border)',
                                borderRadius: '14px',
                                padding: '0.65rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Total Attended
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-text-main)', marginTop: '0.1rem' }}>
                                    {attendedList.length}
                                </div>
                            </div>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--color-status-active-soft)', color: 'var(--color-status-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={17} />
                            </div>
                        </div>

                        <div
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid var(--color-border)',
                                borderRadius: '14px',
                                padding: '0.65rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Douloid Cadres
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-primary)', marginTop: '0.1rem' }}>
                                    {attendedList.filter(a => a.memberType === 'Douloid').length}
                                </div>
                            </div>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={17} />
                            </div>
                        </div>

                        <div
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid var(--color-border)',
                                borderRadius: '14px',
                                padding: '0.65rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Recruits Present
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-accent-warm)', marginTop: '0.1rem' }}>
                                    {attendedList.filter(a => a.memberType === 'Recruit').length}
                                </div>
                            </div>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--color-accent-warm-soft)', color: 'var(--color-accent-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={17} />
                            </div>
                        </div>

                        <div
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid var(--color-border)',
                                borderRadius: '14px',
                                padding: '0.65rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Unchecked / Absent
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                                    {absentList.length}
                                </div>
                            </div>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--color-border-subtle)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserX size={17} />
                            </div>
                        </div>
                    </div>

                    {/* TAB SWITCHER & ACTION CONTROLS */}
                    <div
                        className="g5-modal-tabs-wrapper"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '1.25rem',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                        }}
                    >
                        {/* TAB PILLS */}
                        <div
                            className="g5-modal-tabs-pills"
                            style={{
                                display: 'flex',
                                gap: '0.4rem',
                                background: 'var(--color-page-bg)',
                                padding: '0.3rem',
                                borderRadius: '14px',
                                border: '1px solid var(--color-border)',
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                maxWidth: '100%'
                            }}
                        >
                            <button
                                onClick={() => setActiveTab('attended')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: activeTab === 'attended' ? '#FFFFFF' : 'transparent',
                                    color: activeTab === 'attended' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: activeTab === 'attended' ? 800 : 600,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: activeTab === 'attended' ? '0 2px 8px rgba(107, 95, 168, 0.12)' : 'none',
                                    transition: 'all 0.18s',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Users size={15} />
                                <span>Who Attended</span>
                                <span
                                    style={{
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        background: activeTab === 'attended' ? 'var(--color-primary-soft)' : 'var(--color-border)',
                                        color: activeTab === 'attended' ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                    }}
                                >
                                    {attendedList.length}
                                </span>
                            </button>

                            {meeting.isActive && (
                                <button
                                    onClick={() => setActiveTab('live')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: activeTab === 'live' ? '#FFFFFF' : 'transparent',
                                        color: activeTab === 'live' ? 'var(--color-status-active)' : 'var(--color-text-muted)',
                                        fontWeight: activeTab === 'live' ? 800 : 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        boxShadow: activeTab === 'live' ? '0 2px 8px rgba(76, 175, 125, 0.15)' : 'none',
                                        transition: 'all 0.18s',
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <div className="g5-pulse-dot" style={{ width: '7px', height: '7px' }} />
                                    <span>Live Feed & Ticker</span>
                                </button>
                            )}

                            {questionText && (
                                <button
                                    onClick={() => setActiveTab('answers')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: activeTab === 'answers' ? '#FFFFFF' : 'transparent',
                                        color: activeTab === 'answers' ? 'var(--color-accent-warm)' : 'var(--color-text-muted)',
                                        fontWeight: activeTab === 'answers' ? 800 : 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        boxShadow: activeTab === 'answers' ? '0 2px 8px rgba(232, 163, 61, 0.15)' : 'none',
                                        transition: 'all 0.18s',
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <MessageCircle size={15} />
                                    <span>Question Answers</span>
                                    <span
                                        style={{
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            background: activeTab === 'answers' ? 'var(--color-accent-warm-soft)' : 'var(--color-border)',
                                            color: activeTab === 'answers' ? 'var(--color-accent-warm)' : 'var(--color-text-muted)'
                                        }}
                                    >
                                        {answeredList.length}
                                    </span>
                                </button>
                            )}

                            <button
                                onClick={() => setActiveTab('absent')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: activeTab === 'absent' ? '#FFFFFF' : 'transparent',
                                    color: activeTab === 'absent' ? 'var(--color-status-inactive)' : 'var(--color-text-muted)',
                                    fontWeight: activeTab === 'absent' ? 800 : 600,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: activeTab === 'absent' ? '0 2px 8px rgba(224, 122, 109, 0.15)' : 'none',
                                    transition: 'all 0.18s',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <UserX size={15} />
                                <span>Absent / Checklist</span>
                                <span
                                    style={{
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        background: activeTab === 'absent' ? 'var(--color-status-inactive-soft)' : 'var(--color-border)',
                                        color: activeTab === 'absent' ? 'var(--color-status-inactive)' : 'var(--color-text-muted)'
                                    }}
                                >
                                    {absentList.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('qrcode')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: activeTab === 'qrcode' ? '#FFFFFF' : 'transparent',
                                    color: activeTab === 'qrcode' ? '#25AAE1' : 'var(--color-text-muted)',
                                    fontWeight: activeTab === 'qrcode' ? 800 : 600,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: activeTab === 'qrcode' ? '0 2px 8px rgba(37, 170, 225, 0.18)' : 'none',
                                    transition: 'all 0.18s',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <QrCode size={15} />
                                <span>QR Display Screen</span>
                            </button>
                        </div>

                        {/* EXPORT & REFRESH BUTTONS */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                className="g5-btn-outline"
                                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', height: '36px' }}
                                onClick={() => fetchData(false)}
                                title="Refresh roster"
                            >
                                <RefreshCw size={14} className={loading ? 'g5-spin' : ''} />
                                <span>Refresh</span>
                            </button>
                            <button
                                className="g5-btn-outline"
                                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', height: '36px' }}
                                onClick={handleExportCSV}
                                title="Export attendance to CSV"
                            >
                                <Download size={14} />
                                <span>Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* SEARCH & SUB-FILTERS BAR */}
                <div
                    className="g5-modal-filter-bar"
                    style={{
                        padding: '0.85rem 2rem',
                        background: '#FFFFFF',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                        flexWrap: 'wrap',
                        flexShrink: 0
                    }}
                >
                    <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '420px' }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Filter by student name, admission number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.55rem 1rem 0.55rem 2.25rem',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.85rem',
                                backgroundColor: 'var(--color-page-bg)',
                                color: 'var(--color-text-main)',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Filter:</span>
                        {['All', 'Douloid', 'Recruit'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '8px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: filterType === type ? 'var(--color-primary-soft)' : 'transparent',
                                    color: filterType === type ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SCROLLABLE MODAL CONTENT BODY */}
                <div
                    className="g5-modal-scroll-body"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1.5rem 2rem',
                        backgroundColor: 'var(--color-page-bg)'
                    }}
                >
                    {/* TAB 1: WHO ATTENDED */}
                    {activeTab === 'attended' && (
                        <div>
                            {filteredAttended.length === 0 ? (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: '4rem 2rem',
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        border: '1px dashed var(--color-border)'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '54px',
                                            height: '54px',
                                            borderRadius: '50%',
                                            background: 'var(--color-primary-soft)',
                                            color: 'var(--color-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem'
                                        }}
                                    >
                                        <Users size={24} />
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                        {searchQuery ? 'No attendees match your search' : 'No Attendees Checked In Yet'}
                                    </h4>
                                    <p style={{ margin: '0.5rem 0 1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        {searchQuery
                                            ? 'Try refining your name or admission number search above.'
                                            : 'As students scan the QR code or enter code, their live attendance records will appear here.'}
                                    </p>
                                    <button
                                        className="g5-btn-warm"
                                        style={{ margin: '0 auto' }}
                                        onClick={() => setActiveTab('absent')}
                                    >
                                        <UserPlus size={16} /> Open Check-In Roster ({absentList.length} Unchecked)
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="g5-table-wrap"
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        border: '1px solid var(--color-border)',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 10px rgba(107, 95, 168, 0.04)'
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
                                                <th style={{ textAlign: 'right' }}>Actions</th>
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
                                                                    background: record.memberType === 'Douloid' ? 'var(--color-primary-soft)' : 'var(--color-accent-warm-soft)',
                                                                    color: record.memberType === 'Douloid' ? 'var(--color-primary)' : 'var(--color-accent-warm)',
                                                                    fontWeight: 800,
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            >
                                                                {record.memberName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                                                                    {record.memberName}
                                                                </div>
                                                                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                                                                    {record.campus}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                                                            {record.studentRegNo}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`g5-pill ${record.memberType === 'Douloid' ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                                            {record.memberType}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)', fontSize: '0.82rem', fontWeight: 600 }}>
                                                            <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
                                                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    {questionText && (
                                                        <td style={{ maxWidth: '240px' }}>
                                                            {record.answer ? (
                                                                <div
                                                                    style={{
                                                                        fontSize: '0.82rem',
                                                                        color: 'var(--color-text-main)',
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
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>—</span>
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
                                                                color: 'var(--color-text-muted)',
                                                                cursor: 'pointer',
                                                                padding: '0.4rem',
                                                                borderRadius: '8px',
                                                                transition: 'all 0.15s'
                                                            }}
                                                            title="Remove attendee"
                                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-status-inactive)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
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

                    {/* TAB 2: LIVE FEED & TICKER (FOR ACTIVE DRILLS) */}
                    {activeTab === 'live' && (
                        <div className="g5-overview-split" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                            {/* LIVE INCOMING TICKER */}
                            <div className="g5-card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div className="g5-pulse-dot" style={{ width: '8px', height: '8px' }} />
                                            Real-Time Attendance Stream
                                        </h3>
                                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                            Auto-refreshing every 3s as students scan on-site
                                        </p>
                                    </div>
                                    <span className="g5-pill g5-pill-active">
                                        {attendedList.length} Checked In
                                    </span>
                                </div>

                                {attendedList.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                                        <Radio size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Awaiting First Check-In</div>
                                        <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                                            Cadres and recruits entering code <strong>{meeting.code}</strong> will appear here live.
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
                                        {attendedList.slice(0, 15).map((a, idx) => (
                                            <div
                                                key={a._id || idx}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '12px',
                                                    background: 'var(--color-page-bg)',
                                                    border: '1px solid var(--color-border)',
                                                    animation: 'fadeIn 0.3s ease-out'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div
                                                        className="g5-avatar"
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 800,
                                                            background: 'var(--color-status-active-soft)',
                                                            color: 'var(--color-status-active)'
                                                        }}
                                                    >
                                                        ✓
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.88rem' }}>
                                                            {a.memberName}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                                            {a.studentRegNo} • {a.memberType}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* INSTANT MANUAL CHECK-IN BOX */}
                            <div className="g5-card" style={{ padding: '1.25rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <UserPlus size={18} style={{ color: 'var(--color-primary)' }} />
                                        Manual Check-In Override
                                    </h3>
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                        One-tap check-in for members without their phone
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto' }}>
                                    {filteredAbsent.slice(0, 10).map((m) => {
                                        const regUpper = String(m.studentRegNo).trim().toUpperCase();
                                        const otherMeetingName = weeklyAttendedMap.get(regUpper);
                                        return (
                                            <div
                                                key={m._id || m.studentRegNo}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.65rem 0.85rem',
                                                    borderRadius: '10px',
                                                    background: otherMeetingName ? 'var(--color-page-bg)' : '#FFFFFF',
                                                    border: '1px solid var(--color-border)',
                                                    opacity: otherMeetingName ? 0.75 : 1
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                                                        {m.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                                        {m.studentRegNo} • {m.memberType || 'Recruit'}
                                                        {otherMeetingName && (
                                                            <span style={{ color: 'var(--color-status-inactive)', fontWeight: 700, marginLeft: '0.35rem' }}>
                                                                • Attended {otherMeetingName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {otherMeetingName ? (
                                                    <span className="g5-pill g5-pill-inactive" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                                                        Attended This Week
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="g5-btn-warm"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                                        disabled={actionLoading === m.studentRegNo}
                                                        onClick={() => handleCheckInMember(m.studentRegNo, m.name)}
                                                    >
                                                        {actionLoading === m.studentRegNo ? '...' : '+ Check In'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: QUESTION ANSWERS */}
                    {activeTab === 'answers' && (
                        <div>
                            {answeredList.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
                                    <MessageCircle size={32} style={{ color: 'var(--color-accent-warm)', margin: '0 auto 0.75rem' }} />
                                    <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--color-text-main)' }}>No Answers Recorded Yet</h4>
                                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        When members answer "{questionText}" during check-in, their feedback will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {answeredList.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                background: '#FFFFFF',
                                                borderRadius: '16px',
                                                padding: '1.25rem',
                                                border: '1px solid var(--color-border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                boxShadow: '0 2px 8px rgba(107, 95, 168, 0.04)'
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                        <div
                                                            className="g5-avatar"
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                background: 'var(--color-primary-soft)',
                                                                color: 'var(--color-primary)',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 800
                                                            }}
                                                        >
                                                            {item.memberName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                                                                {item.memberName}
                                                            </div>
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
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
                                                        background: 'var(--color-page-bg)',
                                                        borderRadius: '12px',
                                                        padding: '0.85rem 1rem',
                                                        border: '1px solid var(--color-border-subtle)',
                                                        fontSize: '0.88rem',
                                                        color: 'var(--color-text-main)',
                                                        lineHeight: 1.5,
                                                        fontStyle: 'italic'
                                                    }}
                                                >
                                                    "{item.answer}"
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: ABSENT MEMBERS / MANUAL CHECKLIST */}
                    {activeTab === 'absent' && (
                        <div>
                            {/* BULK ACTION BAR */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem',
                                    background: '#FFFFFF',
                                    padding: '0.85rem 1.25rem',
                                    borderRadius: '14px',
                                    border: '1px solid var(--color-border)',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button
                                        className="g5-btn-outline"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                        onClick={handleSelectAllAbsent}
                                    >
                                        {selectedRegs.size === filteredAbsent.length && filteredAbsent.length > 0
                                            ? 'Deselect All'
                                            : 'Select All Unchecked'}
                                    </button>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                                        {selectedRegs.size} selected for check-in
                                    </span>
                                </div>

                                {selectedRegs.size > 0 && (
                                    <button
                                        className="g5-btn-warm"
                                        disabled={bulkLoading}
                                        onClick={handleBulkCheckIn}
                                        style={{ padding: '0.5rem 1.15rem', fontSize: '0.85rem' }}
                                    >
                                        <Check size={16} />
                                        <span>Check In Selected ({selectedRegs.size})</span>
                                    </button>
                                )}
                            </div>

                            {filteredAbsent.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                    <CheckCircle2 size={36} style={{ color: 'var(--color-status-active)', margin: '0 auto 0.75rem' }} />
                                    <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--color-text-main)' }}>All Members Checked In!</h4>
                                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        100% attendance recorded for this campus cohort.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className="g5-table-wrap"
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        border: '1px solid var(--color-border)',
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
                                                                        background: 'var(--color-border-subtle)',
                                                                        color: 'var(--color-text-muted)',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    {(m.name || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.88rem' }}>
                                                                        {m.name}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                                                        Consecutive Absences: {m.consecutiveAbsences || 0}
                                                                        {otherMeetingName && (
                                                                            <span style={{ color: 'var(--color-status-inactive)', fontWeight: 700, marginLeft: '0.35rem' }}>
                                                                                • Attended {otherMeetingName}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                                                                {m.studentRegNo}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`g5-pill ${m.memberType === 'Douloid' ? 'g5-pill-active' : 'g5-pill-recruit'}`}>
                                                                {m.memberType || 'Recruit'}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.85rem' }}>
                                                            {m.campus || 'Athi River'}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {otherMeetingName ? (
                                                                <span className="g5-pill g5-pill-inactive" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }} title={`Already attended ${otherMeetingName} this week`}>
                                                                    Attended This Week
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    className="g5-btn-warm"
                                                                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                                                                    disabled={actionLoading === m.studentRegNo}
                                                                    onClick={() => handleCheckInMember(m.studentRegNo, m.name)}
                                                                >
                                                                    {actionLoading === m.studentRegNo ? '...' : '+ Check In'}
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

                    {/* TAB 5: QR CODE PROJECTOR SCREEN */}
                    {activeTab === 'qrcode' && (
                        <div style={{ textAlign: 'center', padding: '1.5rem 1rem', maxWidth: '620px', margin: '0 auto' }}>
                            <div style={{
                                background: '#FFFFFF',
                                borderRadius: '24px',
                                padding: '2rem 1.25rem',
                                border: '1.5px solid rgba(37, 170, 225, 0.25)',
                                boxShadow: '0 16px 48px rgba(107, 95, 168, 0.08)'
                            }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem' }}>
                                    <QrCode size={14} /> Scan With Phone Camera
                                </div>

                                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--color-text-main)', margin: '0 0 0.5rem' }}>
                                    {meeting.name || 'Weekly Training Meeting'}
                                </h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '0 0 1.75rem' }}>
                                    {meeting.campus} • {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} • {meeting.startTime || '18:00'} - {meeting.endTime || '20:00'}
                                </p>

                                {/* QR CODE CONTAINER */}
                                <div style={{
                                    background: '#FFFFFF',
                                    padding: '1.25rem',
                                    borderRadius: '20px',
                                    display: 'inline-block',
                                    border: '2px solid rgba(37, 170, 225, 0.3)',
                                    boxShadow: '0 12px 36px rgba(37, 170, 225, 0.12)',
                                    marginBottom: '1.5rem',
                                    maxWidth: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <QRCode value={checkInUrl} size={Math.min(240, typeof window !== 'undefined' ? Math.max(180, window.innerWidth - 120) : 240)} level="H" />
                                </div>

                                {/* MEETING CODE DISPLAY */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                        Join Code
                                    </div>
                                    <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '3px', fontFamily: 'monospace', margin: '0.2rem 0' }}>
                                        {(meeting.code || 'DOULOS').toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                        Students can scan the QR code above or type this code manually at <strong style={{ color: 'var(--color-text-main)' }}>{window.location.host}/check-in</strong>
                                    </div>
                                </div>

                                {/* QUICK ACTIONS */}
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                                    <button
                                        type="button"
                                        className="g5-btn-secondary"
                                        onClick={handleCopyLink}
                                        style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                                    >
                                        {copiedLink ? <Check size={15} color="var(--color-status-active)" /> : <Copy size={15} />}
                                        {copiedLink ? 'Link Copied!' : 'Copy Check-In Link'}
                                    </button>

                                    <a
                                        href={checkInUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="g5-btn-secondary"
                                        style={{ fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                                    >
                                        <ExternalLink size={15} /> Open Check-In Page
                                    </a>

                                    <button
                                        type="button"
                                        className="g5-btn-warm"
                                        onClick={handlePrintQR}
                                        style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#25AAE1', borderColor: '#25AAE1' }}
                                    >
                                        <Printer size={15} /> Print QR Poster
                                    </button>
                                </div>

                                {/* LIVE CHECK-IN TALLY BADGE */}
                                <div style={{
                                    background: 'var(--color-page-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1.25rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    fontSize: '0.88rem'
                                }}>
                                    <div className="g5-pulse-dot" style={{ width: '8px', height: '8px' }} />
                                    <span style={{ color: 'var(--color-text-muted)' }}>Attendance Status:</span>
                                    <strong style={{ color: 'var(--color-status-active)', fontWeight: 800 }}>
                                        {attendedList.length} Students Checked In So Far
                                    </strong>
                                    <button
                                        type="button"
                                        onClick={() => fetchData(true)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                        title="Refresh live count"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div
                    style={{
                        padding: '1rem 2rem',
                        borderTop: '1px solid var(--color-border-subtle)',
                        background: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0
                    }}
                >
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} />
                        <span>Real-time Doulos G5 Attendance Ledger</span>
                    </div>

                    <button
                        className="g5-btn-secondary"
                        onClick={onClose}
                        style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem' }}
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
};

export default G5MeetingModal;
