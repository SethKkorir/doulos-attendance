import { useState, useEffect } from 'react';
import { 
    Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, 
    BarChart3, Trash2, Search, Link as LinkIcon, 
    ExternalLink, RotateCcw, X, Settings as SettingsIcon, Lightbulb, 
    ClipboardCheck, ListChecks 
} from 'lucide-react';
import QRCode from 'react-qr-code';
import MeetingInsights from '../MeetingInsights';

const MeetingsTab = ({ 
    meetings, 
    userRole, 
    isGuest, 
    fetchMeetings, 
    setMsg, 
    currentSemester, 
    api, 
    members, 
    quickRegNo, 
    setQuickRegNo, 
    quickCheckInLoading, 
    setQuickCheckInLoading,
    fetchMembers 
}) => {
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [insightMeeting, setInsightMeeting] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [meetingSemesterFilter, setMeetingSemesterFilter] = useState('Current');

    const [formData, setFormData] = useState({
        name: 'Weekly Doulos',
        date: new Date().toISOString().split('T')[0],
        campus: 'Athi River',
        startTime: '20:30',
        endTime: '23:00',
        semester: currentSemester || 'MAY-AUG 2026',
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

    useEffect(() => {
        if (!showCreate) return;
        setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
            semester: currentSemester || 'MAY-AUG 2026'
        }));
    }, [showCreate, currentSemester]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Creation disabled in Guest Mode.' });

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

    const handleToggleStatus = async (meeting) => {
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

    const handleQuickCheckIn = async (meetingId) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!quickRegNo) return;

        const normalize = (s) => s?.replace(/\D/g, '') || '';
        const member = members.find(m => normalize(m.studentRegNo) === normalize(quickRegNo));
        const meeting = meetings.find(m => m._id === meetingId);
        let studentName = member ? member.name : null;

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
                if (!window.confirm(`⚠️ DUPLICATE ALERT ⚠️\n\n${member.name} (${quickRegNo}) already checked in this week (on ${dayName}).\n\nDo you want to proceed anyway?`)) {
                    return;
                }
            }
        }

        if (!member) {
            alert(`⚠️ MEMBER NOT FOUND ⚠️\n\nThe Admission Number "${quickRegNo}" is NOT in the Doulos Registry. \n\nYou will need to enter their name to add them as a new member.`);
            studentName = window.prompt(`Registrating New Member\n\nPlease enter the student's FULL NAME for ${quickRegNo}:`);
            if (!studentName) return;
        }

        setQuickCheckInLoading(true);
        try {
            await api.post('/attendance/manual', {
                meetingId,
                studentRegNo: quickRegNo,
                name: studentName
            });

            const displayName = studentName || quickRegNo;
            setMsg({ type: 'success', text: `Success! ${displayName} has been checked in.` });
            setQuickRegNo('');
            fetchMeetings();
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Manual check-in failed' });
        } finally {
            setQuickCheckInLoading(false);
        }
    };

    const handleLookupMemberInsights = (reg) => {
        const normalize = (s) => s?.replace(/\D/g, '') || '';
        const member = members.find(m => normalize(m.studentRegNo) === normalize(reg));
        if (member) {
            // This will be caught by parent to show member modal
            const mockClick = document.querySelector(`tr[data-reg="${member.studentRegNo}"]`);
            if (mockClick) {
                mockClick.click();
            } else {
                setMsg({ type: 'success', text: `Lookup: Found ${member.name}. Open Members Registry to view full insights.` });
            }
        } else {
            setMsg({ type: 'error', text: `Admission number "${reg}" not found in registry.` });
        }
    };

    const handlePrintQR = () => {
        const meeting = selectedMeeting;
        if (!meeting) return;

        const qrSvg = document.querySelector('.qr-modal-content svg');
        if (!qrSvg) return;

        const qrDataUrl = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(qrSvg));

        const printHtml = `
            <html>
                <head>
                    <title>Doulos QR - ${meeting.name}</title>
                    <style>
                        @page { size: A4; margin: 0; }
                        body { 
                            font-family: 'Inter', system-ui, -apple-system, sans-serif;
                            margin: 0; padding: 0; background: white;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .page {
                            width: 210mm; height: 297mm; position: relative;
                            background: white; color: black; overflow: hidden;
                            display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
                        }
                        .content {
                            position: relative; z-index: 10; width: 100%; height: 100%;
                            display: flex; flex-direction: column; align-items: center; justify-content: space-between;
                            padding: 25mm; box-sizing: border-box;
                        }
                        .header { display: flex; flex-direction: column; align-items: center; gap: 15px; }
                        .logo-img { width: 120px; height: 120px; object-fit: contain; margin-bottom: 0.5rem; }
                        .meeting-title { font-size: 2.2rem; font-weight: 900; line-height: 1.1; color: #0c1a29; margin: 10px 0; max-width: 90%; }
                        .meeting-meta { font-size: 1.8rem; color: #4b5563; margin-top: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
                        .qr-outer-container { position: relative; padding: 15px; background: white; border-radius: 40px; border: 4px solid #0c1a29; }
                        .qr-inner-wrapper { padding: 30px; background: white; border-radius: 30px; }
                        .scan-badge { position: absolute; top: -25px; right: -25px; background: #ef4444; color: white; font-weight: 900; padding: 12px 25px; border-radius: 50px; transform: rotate(12deg); box-shadow: 0 10px 20px rgba(0,0,0,0.15); font-size: 1.4rem; border: 3px solid white; }
                        .footer { width: 100%; border-top: 2px solid #f3f4f6; padding-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .instruction { text-align: left; }
                        .instruction h3 { font-size: 1.6rem; color: #3b82f6; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 900; }
                        .instruction p { font-size: 1.1rem; color: #6b7280; margin: 0; max-width: 400px; }
                        .theme-section { margin: 20px 0; padding: 20px; border: 1px dashed #3b82f6; border-radius: 15px; max-width: 85%; }
                        .theme-title { font-size: 1.5rem; font-weight: 900; color: #032540; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
                        .theme-text { font-size: 1.8rem; font-weight: 800; color: #3b82f6; font-style: italic; margin: 10px 0; }
                        .theme-verse { font-size: 1rem; color: #4b5563; font-weight: 600; line-height: 1.4; margin-top: 10px; }
                        .meta { text-align: right; font-size: 1.1rem; color: #9ca3af; font-weight: 600; }
                        @media print { body { background: none; } .page { box-shadow: none; margin: 0; width: 100%; height: 100%; } }
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

        const monthStr = mDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const dayStr = mDate.getDate();
        const weekdayStr = mDate.toLocaleDateString('en-US', { weekday: 'short' });

        return (
            <div
                key={m._id}
                className="glass-card-premium metric-card-glow"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    border: isActuallyLive ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(29, 166, 217, 0.15)',
                    boxShadow: isActuallyLive ? '0 0 25px rgba(34, 197, 94, 0.15)' : '0 10px 30px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    padding: '1.5rem',
                    position: 'relative'
                }}
                onClick={() => setInsightMeeting(m)}
            >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        width: '55px',
                        height: '60px',
                        borderRadius: '0.75rem',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{
                            width: '100%',
                            background: isActuallyLive ? 'linear-gradient(135deg, #22c55e, #15803d)' : 'linear-gradient(135deg, #1da6d9, #0a4d68)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '0.2rem 0',
                            textAlign: 'center',
                            letterSpacing: '1px'
                        }}>
                            {monthStr}
                        </div>
                        <div style={{
                            flex: 1,
                            width: '100%',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'white',
                            fontSize: '1.3rem',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1
                        }}>
                            {dayStr}
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.name}
                            </h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 600 }}>
                            <MapPin size={12} color="#1da6d9" />
                            <span>{m.campus}</span>
                            <span style={{ opacity: 0.3 }}>•</span>
                            <span>{weekdayStr}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.85rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={12} color="rgba(255,255,255,0.4)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                            {m.startTime} - {m.endTime}
                        </span>
                    </div>

                    {(() => {
                        if (!m.isActive) return (
                            <span className="status-pill-modern completed">
                                Completed
                            </span>
                        );
                        if (isActuallyLive) return (
                            <span className="status-pill-modern live">
                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }}></span>
                                Live Now
                            </span>
                        );
                        return (
                            <span className="status-pill-modern standby">
                                Standby
                            </span>
                        );
                    })()}
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Attendance</span>
                        <span style={{ color: isActuallyLive ? '#22c55e' : '#1da6d9' }}>{m.attendees || 0} checked-in</span>
                    </div>
                    <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(100, ((m.attendees || 0) / 100) * 100)}%`,
                            height: '100%',
                            background: isActuallyLive ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #1da6d9, #0ea5e9)',
                            borderRadius: '10px',
                            transition: 'width 1s ease-in-out'
                        }} />
                    </div>
                </div>

                {((m.isActive && !isMeetingOver) || ['developer', 'superadmin', 'SuperAdmin'].includes(userRole)) && (
                    <div 
                        style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                className="input-field"
                                placeholder="Search Name / Reg No"
                                list="members-search"
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                                    borderRadius: '0.5rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                                value={quickRegNo}
                                onChange={e => setQuickRegNo(e.target.value)}
                            />
                        </div>
                        <button
                            className="btn"
                            style={{
                                padding: '0.45rem 0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => handleLookupMemberInsights(quickRegNo)}
                            title="Lookup Member History"
                        >
                            <Search size={14} />
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{
                                padding: '0.45rem 0.75rem',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                            onClick={() => handleQuickCheckIn(m._id)}
                            disabled={quickCheckInLoading}
                            title="Manual Check-In"
                        >
                            {quickCheckInLoading ? '...' : <Plus size={14} />}
                        </button>
                    </div>
                )}

                <div 
                    style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {((m.isActive && !isMeetingOver) || ['developer', 'superadmin', 'SuperAdmin'].includes(userRole)) && (
                        <button
                            className="btn"
                            style={{
                                flex: 1,
                                background: 'rgba(29, 166, 217, 0.1)',
                                color: '#1da6d9',
                                border: '1px solid rgba(29, 166, 217, 0.2)',
                                padding: '0.55rem',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem'
                            }}
                            onClick={() => {
                                const now = new Date();
                                const [startH, startM] = m.startTime.split(':').map(Number);
                                const [endH, endM] = m.endTime.split(':').map(Number);
                                const start = new Date(m.date);
                                start.setHours(startH, startM, 0, 0);
                                const end = new Date(m.date);
                                end.setHours(endH, endM, 0, 0);
                                const isWithinTime = now >= start && now <= end;

                                if (isWithinTime) {
                                    setSelectedMeeting(m);
                                } else {
                                    if (window.confirm(`⚠️ TIME WARNING ⚠️\n\nThis meeting is scheduled for ${m.startTime} - ${m.endTime}.\nCurrent time is ${now.toLocaleTimeString()}.\n\nDo you want to FORCE OPEN the QR code for printing/testing?`)) {
                                        setSelectedMeeting(m);
                                    }
                                }
                            }}
                        >
                            <QrIcon size={14} /> QR
                        </button>
                    )}

                    <button 
                        className="btn" 
                        style={{
                            flex: 1,
                            background: 'rgba(167, 139, 250, 0.1)',
                            color: '#c084fc',
                            border: '1px solid rgba(167, 139, 250, 0.2)',
                            fontSize: '0.75rem',
                            padding: '0.55rem',
                            fontWeight: 800,
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                        }}
                        onClick={() => setInsightMeeting(m)}
                    >
                        <BarChart3 size={14} /> Insights
                    </button>

                    <button 
                        className="btn" 
                        style={{
                            width: '36px',
                            height: '36px',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'rgba(255,255,255,0.5)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => handleToggleStatus(m)}
                    >
                        {m.isActive ? <X size={14} title="Close Meeting" /> : <RotateCcw size={14} title="Reopen Meeting" />}
                    </button>

                    {['developer', 'superadmin', 'SuperAdmin'].includes(userRole) && (
                        <button
                            className="btn"
                            style={{
                                width: '36px',
                                height: '36px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => handleDeleteMeeting(m._id, m.name)}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const activeList = meetings.filter(m => m.isActive);
    const historyList = meetings.filter(m => !m.isActive);

    const getSem = (d) => {
        const date = new Date(d);
        const m = date.getMonth();
        const y = date.getFullYear();
        if (m <= 3) return `Jan Semester ${y}`;
        if (m <= 7) return `May Semester ${y}`;
        return `Sept Semester ${y}`;
    };

    const semesters = Array.from(new Set(historyList.map(m => getSem(m.date))));
    const currentSem = getSem(new Date());

    const filteredHistory = historyList.filter(m => {
        if (meetingSemesterFilter === 'All') return true;
        const target = meetingSemesterFilter === 'Current' ? currentSem : meetingSemesterFilter;
        return getSem(m.date) === target;
    });

    return (
        <>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                    <Plus size={20} /> New Meeting Session
                </button>
            </div>

            {showCreate && (
                <div className="glass-card-premium" style={{ marginBottom: '2rem', maxWidth: '800px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1da6d9', fontWeight: 800 }}>
                            <Plus size={22} style={{ color: '#1da6d9' }} /> Create Meeting Session
                        </h3>
                        <button
                            onClick={() => setShowCreate(false)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-text-dim)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', transition: 'background-color 0.2s' }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleCreate} className="create-meeting-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1da6d9', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <SettingsIcon size={14} /> Session Details
                            </span>
                        </div>
                        
                        <div style={{ gridColumn: '1 / -1' }} className="form-group-premium">
                            <label>Meeting Name</label>
                            <input className="modern-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Wednesday Chapel" required />
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> Date</label>
                            <input type="date" className="modern-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={14} /> Campus</label>
                            <select className="modern-input" value={formData.campus} onChange={e => setFormData({ ...formData, campus: e.target.value })}>
                                <option value="Athi River">Athi River</option>
                                <option value="Valley Road">Valley Road</option>
                            </select>
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> Start Time</label>
                            <input type="time" className="modern-input" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> End Time</label>
                            <input type="time" className="modern-input" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><ClipboardCheck size={14} /> Reporting Semester</label>
                            <select className="modern-input" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                <option value="MAY-AUG 2026">MAY-AUG 2026</option>
                                <option value="SEP-DEC 2026">SEP-DEC 2026</option>
                            </select>
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><ListChecks size={14} /> Category</label>
                            <select className="modern-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="Meeting">Standard Meeting</option>
                                <option value="Training">Doulos Training</option>
                            </select>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }} className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Lightbulb size={14} /> Question of the Day</label>
                            <textarea
                                className="modern-input"
                                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                                value={formData.questionOfDay}
                                onChange={e => setFormData({ ...formData, questionOfDay: e.target.value })}
                                placeholder="e.g. What are you most grateful for this week?"
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1da6d9', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <MapPin size={14} /> Location & Geofencing
                            </span>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }} className="form-group-premium">
                            <label>Location Name</label>
                            <input className="modern-input" value={formData.location.name} onChange={e => setFormData({ ...formData, location: { ...formData.location, name: e.target.value } })} placeholder="e.g. Daystar University, Athi River Chapel" required />
                        </div>

                        <div className="form-group-premium">
                            <label>Latitude</label>
                            <input type="number" step="any" className="modern-input" value={formData.location.latitude || ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, latitude: parseFloat(e.target.value) } })} placeholder="-1.448" />
                        </div>
                        
                        <div className="form-group-premium">
                            <label>Longitude</label>
                            <input type="number" step="any" className="modern-input" value={formData.location.longitude || ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, longitude: parseFloat(e.target.value) } })} placeholder="37.015" />
                        </div>

                        <div className="form-group-premium">
                            <label>Geofence Radius (meters)</label>
                            <input type="number" className="modern-input" value={formData.location.radius} onChange={e => setFormData({ ...formData, location: { ...formData.location, radius: parseInt(e.target.value) } })} placeholder="200" />
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'rgba(29, 166, 217, 0.05)', border: '1px solid rgba(29, 166, 217, 0.15)', borderRadius: '1rem', padding: '1.25rem', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1da6d9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <MapPin size={16} /> GPS Geofence Link
                                </span>
                                {formData.location.latitude && formData.location.longitude ? (
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                        ✓ Coordinates captured: {formData.location.latitude.toFixed(5)}, {formData.location.longitude.toFixed(5)}
                                    </span>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                        Capture the current coordinates for device check-in verification.
                                    </span>
                                )}
                            </div>
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
                                            setMsg({ type: 'success', text: `GPS captured!` });
                                        }, () => setMsg({ type: 'error', text: 'GPS permission denied or unavailable.' }));
                                    }
                                }}
                                style={{ background: 'linear-gradient(135deg, rgba(29, 166, 217, 0.2) 0%, rgba(10, 77, 104, 0.3) 100%)', border: '1px solid rgba(29, 166, 217, 0.3)', borderRadius: '0.75rem', padding: '0.6rem 1.25rem', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                            >
                                <MapPin size={16} /> Use Current GPS Position
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(2, 21, 37, 0.4)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
                            <input
                                type="checkbox"
                                id="create-manual"
                                checked={formData.allowManualOverride}
                                onChange={e => setFormData({ ...formData, allowManualOverride: e.target.checked })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1da6d9' }}
                            />
                            <label htmlFor="create-manual" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                                Enable Admin-Only Manual Check-in (Remote/Internet Mode)
                            </label>
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }} disabled={importLoading}>
                                {importLoading ? 'CREATING...' : 'CREATE MEETING SESSION'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

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

            {/* QR Modal for Meeting */}
            {selectedMeeting && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setSelectedMeeting(null)}>
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Scan Meeting QR</h3>

                        <div className="qr-modal-content" style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1rem' }}>
                            <QRCode value={`${window.location.origin}/check-in/${selectedMeeting.code}`} size={220} level="H" />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>MEETING CODE</div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1da6d9', letterSpacing: '2px', lineHeight: 1 }}>
                                {selectedMeeting.code.toUpperCase()}
                            </div>
                        </div>

                        <h4 style={{ margin: '0 0 0.25rem' }}>{selectedMeeting.name}</h4>
                        <p style={{ opacity: 0.5, marginBottom: '1.5rem', fontSize: '0.85rem' }}>{selectedMeeting.campus} | Standard Meeting</p>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => handlePrintQR()}
                            >
                                <Download size={14} style={{ marginRight: '0.4rem' }} /> Print QR
                            </button>
                            <button
                                className="btn"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}
                                onClick={() => {
                                    const link = `${window.location.origin}/check-in/${selectedMeeting.code}`;
                                    navigator.clipboard.writeText(link);
                                    setMsg({ type: 'success', text: 'Link copied!' });
                                }}
                            >
                                <LinkIcon size={14} style={{ marginRight: '0.4rem' }} /> Copy Link
                            </button>
                            {['developer', 'superadmin', 'SuperAdmin'].includes(userRole) && (
                                <a
                                    href={`/check-in/${selectedMeeting.code}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn"
                                    style={{ background: 'rgba(29, 166, 217, 0.1)', color: '#1da6d9', border: '1px solid rgba(29, 166, 217, 0.2)', padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                >
                                    <ExternalLink size={14} style={{ marginRight: '0.4rem' }} /> Test
                                </a>
                            )}
                        </div>
                        <p style={{ marginTop: '1.5rem', opacity: 0.4, fontSize: '0.75rem' }}>Click anywhere outside to close</p>
                    </div>
                </div>
            )}

            {/* Insights Modal */}
            {insightMeeting && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setInsightMeeting(null)}>
                    <div style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <MeetingInsights 
                            meeting={insightMeeting} 
                            onClose={() => setInsightMeeting(null)} 
                            api={api} 
                            onQuickCheckIn={async (meetingId, regNo) => {
                                // Delegate manual check-in to local handler
                                const originalQuickRegNo = quickRegNo;
                                setQuickRegNo(regNo);
                                // Since state updates asynchronously, we call handleQuickCheckIn directly with regNo override
                                setQuickCheckInLoading(true);
                                try {
                                    await api.post('/attendance/manual', {
                                        meetingId,
                                        studentRegNo: regNo
                                    });
                                    setMsg({ type: 'success', text: `Success! Checked in ${regNo}` });
                                    fetchMeetings();
                                    fetchMembers();
                                } catch (err) {
                                    setMsg({ type: 'error', text: err.response?.data?.message || 'Check-in failed' });
                                } finally {
                                    setQuickCheckInLoading(false);
                                    setQuickRegNo(originalQuickRegNo);
                                }
                            }} 
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default MeetingsTab;
