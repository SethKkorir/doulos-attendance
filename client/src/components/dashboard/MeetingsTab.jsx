import { useState, useEffect } from 'react';
import { 
    Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, 
    BarChart3, Trash2, Search, Link as LinkIcon, 
    ExternalLink, RotateCcw, X, Settings as SettingsIcon, Lightbulb, 
    ClipboardCheck, ListChecks, Users 
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
    
    const [semesterTheme, setSemesterTheme] = useState('');
    const [semesterVerse, setSemesterVerse] = useState('');

    useEffect(() => {
        const fetchSemesterSettings = async () => {
            try {
                const [themeRes, verseRes] = await Promise.all([
                    api.get('/settings/semester_theme'),
                    api.get('/settings/semester_verse')
                ]);
                if (themeRes.data?.value) setSemesterTheme(themeRes.data.value);
                if (verseRes.data?.value) setSemesterVerse(verseRes.data.value);
            } catch (err) {
                console.error("Failed to fetch semester theme/verse", err);
            }
        };
        fetchSemesterSettings();
    }, [api]);

    const splitVerse = (verseStr) => {
        if (!verseStr) {
            return {
                ref: 'Proverbs 3:5-6',
                text: 'Trust the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him and He will make your paths straight'
            };
        }
        const parts = verseStr.split(/[—–-]/);
        if (parts.length >= 2) {
            return {
                ref: parts[0].trim(),
                text: parts.slice(1).join('—').trim()
            };
        }
        return { ref: '', text: verseStr };
    };

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
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap');
                        @page { size: A4; margin: 0; }
                        body { 
                            font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif;
                            margin: 0; padding: 0; background: #ffffff;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color: #0c1c36;
                        }
                        .page {
                            width: 210mm; height: 297mm; position: relative;
                            background: radial-gradient(circle at 10% 20%, rgba(240, 245, 255, 0.6) 0%, #ffffff 80%); 
                            overflow: hidden;
                            display: flex; flex-direction: column; align-items: center; justify-content: center;
                            box-sizing: border-box;
                            border: 1px solid rgba(15, 23, 42, 0.08);
                        }
                        /* Light subtle geometric mesh in the background */
                        .page::before {
                            content: '';
                            position: absolute;
                            inset: 0;
                            background-image: radial-gradient(rgba(37, 170, 225, 0.02) 1.5px, transparent 1.5px);
                            background-size: 24px 24px;
                            pointer-events: none;
                        }
                        .content {
                            position: relative; z-index: 10; width: 100%; height: 100%;
                            display: flex; flex-direction: column; align-items: center; justify-content: space-between;
                            padding: 20mm 18mm; box-sizing: border-box;
                        }
                        .header { display: flex; flex-direction: column; align-items: center; text-align: center; }
                        .logo-img { width: 110px; height: 110px; object-fit: contain; margin-bottom: 0.5rem; }
                        .meeting-title { font-size: 3.2rem; font-weight: 900; line-height: 1.1; color: #0c1c36; margin: 0; font-family: 'Outfit', sans-serif; letter-spacing: -1px; }
                        .meeting-title span { color: #0066cc; }
                        
                        .meeting-meta-pill { 
                            display: flex; 
                            align-items: center; 
                            gap: 15px; 
                            background: #ffffff; 
                            padding: 8px 24px; 
                            border-radius: 50px; 
                            box-shadow: 0 4px 15px rgba(0, 102, 204, 0.05); 
                            border: 1px solid rgba(0, 102, 204, 0.12);
                            margin-top: 1.25rem;
                        }
                        .meta-item {
                            font-size: 0.95rem; font-weight: 800; color: #0c1c36; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; text-transform: uppercase;
                        }
                        .meta-item svg { color: #0066cc; }
                        .meta-divider { color: rgba(12, 28, 54, 0.15); font-weight: 300; }

                        /* QR Outer Shell Container with beautiful shadow */
                        .qr-outer-container { 
                            position: relative; 
                            padding: 16px; 
                            background: #ffffff; 
                            border-radius: 32px; 
                            box-shadow: 0 20px 50px rgba(12, 28, 54, 0.08); 
                            border: 1px solid rgba(0, 102, 204, 0.08);
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 14px;
                        }
                        .qr-inner-wrapper { 
                            padding: 12px; 
                            background: #ffffff; 
                            border-radius: 20px; 
                        }
                        .scan-btn-pill {
                            background: #0066cc;
                            color: #ffffff;
                            font-weight: 800;
                            font-size: 0.95rem;
                            padding: 10px 28px;
                            border-radius: 50px;
                            box-shadow: 0 4px 15px rgba(0, 102, 204, 0.2);
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            border: none;
                        }

                        /* Premium White Card theme section */
                        .theme-section { 
                            margin: 10px 0; 
                            padding: 24px 28px; 
                            background: #ffffff;
                            border: 1px solid rgba(0, 102, 204, 0.08); 
                            border-radius: 24px; 
                            max-width: 90%; 
                            width: 100%;
                            box-sizing: border-box;
                            text-align: center;
                            box-shadow: 0 10px 30px rgba(12, 28, 54, 0.04);
                            position: relative;
                        }
                        .theme-pill-tag {
                            position: absolute;
                            top: -12px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: #0066cc;
                            color: #ffffff;
                            font-weight: 800;
                            font-size: 0.68rem;
                            padding: 4px 18px;
                            border-radius: 50px;
                            letter-spacing: 1.5px;
                            text-transform: uppercase;
                        }
                        .theme-text { font-size: 2.2rem; font-weight: 900; color: #0c1c36; font-style: italic; margin: 10px 0; font-family: 'Outfit', sans-serif; letter-spacing: -0.5px; line-height: 1.2; }
                        
                        .theme-verse-ref {
                            display: inline-block;
                            background: rgba(0, 102, 204, 0.06);
                            color: #0066cc;
                            font-weight: 800;
                            font-size: 0.72rem;
                            padding: 4px 16px;
                            border-radius: 50px;
                            letter-spacing: 0.5px;
                            text-transform: uppercase;
                            margin: 8px 0;
                        }
                        .theme-verse-text { font-size: 0.95rem; color: #4b5563; font-weight: 600; line-height: 1.6; margin: 5px 0 0 0; }

                        /* Footer Layout styling */
                        .footer { 
                            width: 100%; 
                            border-top: 1px solid rgba(12, 28, 54, 0.06); 
                            padding-top: 18px; 
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            align-items: center;
                        }
                        .info-block {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            text-align: left;
                        }
                        .info-icon-circle {
                            width: 44px;
                            height: 44px;
                            border-radius: 50%;
                            background: rgba(0, 102, 204, 0.06);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #0066cc;
                            flex-shrink: 0;
                        }
                        .info-details h4 {
                            margin: 0 0 2px 0;
                            font-size: 0.88rem;
                            font-weight: 800;
                            color: #0c1c36;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        .info-details p {
                            margin: 0;
                            font-size: 0.78rem;
                            color: #6b7280;
                            font-weight: 500;
                            line-height: 1.3;
                        }
                        .meta-brand {
                            text-align: right;
                            font-size: 0.85rem;
                            color: #6b7280;
                            font-weight: 700;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                        }
                        .meta-brand span {
                            color: #0c1c36;
                            font-weight: 900;
                        }
                        @media print { body { background: none; } .page { box-shadow: none; margin: 0; width: 100%; height: 100%; } }
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="content">
                            <div class="header">
                                <img src="/logo.png" class="logo-img" alt="Logo" />
                                <h1 class="meeting-title">Doulos Meeting <span>${meeting.name.toUpperCase().replace('DOULOS MEETING', '').replace('DOULOS', '').trim()}</span></h1>
                                <div class="meeting-meta-pill">
                                    <div class="meta-item">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                        <span>${meeting.campus}</span>
                                    </div>
                                    <div class="meta-divider">|</div>
                                    <div class="meta-item">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                        <span>${new Date(meeting.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="qr-outer-container">
                                <div class="qr-inner-wrapper">
                                    ${new XMLSerializer().serializeToString(qrSvg)}
                                </div>
                                <button class="scan-btn-pill">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                    <span>Scan to Check In</span>
                                </button>
                            </div>
                            
                            <div class="theme-section">
                                <div class="theme-pill-tag">Semester Theme</div>
                                <div class="theme-text">"${semesterTheme || 'Transforming Grace'}"</div>
                                
                                <div class="theme-verse-ref">${splitVerse(semesterVerse).ref}</div>
                                <div class="theme-verse-text">
                                    "${splitVerse(semesterVerse).text}"
                                </div>
                            </div>
                            
                            <div class="footer">
                                <div class="info-block">
                                    <div class="info-icon-circle">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                                    </div>
                                    <div class="info-details">
                                        <h4>Quick Check-In</h4>
                                        <p>Open camera or scanner to mark your attendance.</p>
                                    </div>
                                </div>
                                <div class="meta-brand">
                                    Leaders In Service <span>System</span>
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
                    <form onSubmit={handleCreate} className="create-meeting-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem' }}>
                        <div style={{ gridColumn: 'span 12', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1da6d9', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <SettingsIcon size={14} /> Session Details
                            </span>
                        </div>
                        
                        <div style={{ gridColumn: 'span 8' }} className="form-group-premium">
                            <label>Meeting Name</label>
                            <input className="modern-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Wednesday Chapel" required />
                        </div>
                        
                        <div style={{ gridColumn: 'span 4' }} className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={14} /> Campus</label>
                            <select className="modern-input" value={formData.campus} onChange={e => setFormData({ ...formData, campus: e.target.value })}>
                                <option value="Athi River">Athi River</option>
                                <option value="Valley Road">Valley Road</option>
                            </select>
                        </div>
                        
                        <div style={{ gridColumn: 'span 4' }} className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> Date</label>
                            <input type="date" className="modern-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                        </div>
                        
                        <div style={{ gridColumn: 'span 4' }} className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> Start Time</label>
                            <input type="time" className="modern-input" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                        </div>
                        
                        <div style={{ gridColumn: 'span 4' }} className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> End Time</label>
                            <input type="time" className="modern-input" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                        </div>

                        <div style={{ gridColumn: 'span 12' }} className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Lightbulb size={14} /> Question of the Day</label>
                            <textarea
                                className="modern-input"
                                style={{ width: '100%', minHeight: '44px', height: '44px', resize: 'vertical' }}
                                value={formData.questionOfDay}
                                onChange={e => setFormData({ ...formData, questionOfDay: e.target.value })}
                                placeholder="e.g. What are you most grateful for this week?"
                            />
                        </div>

                        <div style={{ gridColumn: 'span 12', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1da6d9', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <MapPin size={14} /> Location & Geofencing
                            </span>
                        </div>

                        <div style={{ gridColumn: 'span 8' }} className="form-group-premium">
                            <label>Location Name</label>
                            <input className="modern-input" value={formData.location.name} onChange={e => setFormData({ ...formData, location: { ...formData.location, name: e.target.value } })} placeholder="e.g. Daystar University, Athi River Chapel" required />
                        </div>

                        <div style={{ gridColumn: 'span 4' }} className="form-group-premium">
                            <label>Geofence Radius (meters)</label>
                            <input type="number" className="modern-input" value={formData.location.radius} onChange={e => setFormData({ ...formData, location: { ...formData.location, radius: parseInt(e.target.value) } })} placeholder="200" />
                        </div>

                        <div style={{ gridColumn: 'span 4' }} className="form-group-premium">
                            <label>Latitude</label>
                            <input type="number" step="any" className="modern-input" value={formData.location.latitude || ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, latitude: parseFloat(e.target.value) } })} placeholder="-1.448" />
                        </div>
                        
                        <div style={{ gridColumn: 'span 4' }} className="form-group-premium">
                            <label>Longitude</label>
                            <input type="number" step="any" className="modern-input" value={formData.location.longitude || ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, longitude: parseFloat(e.target.value) } })} placeholder="37.015" />
                        </div>

                        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', paddingBottom: '2px' }}>
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
                                style={{ 
                                    background: 'linear-gradient(135deg, rgba(29, 166, 217, 0.2) 0%, rgba(10, 77, 104, 0.3) 100%)', 
                                    border: '1px solid rgba(29, 166, 217, 0.3)', 
                                    borderRadius: '0.75rem', 
                                    height: '46px',
                                    color: 'white', 
                                    fontWeight: 700, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: '0.5rem', 
                                    transition: 'all 0.2s',
                                    width: '100%'
                                }}
                            >
                                <MapPin size={16} /> Capture GPS
                            </button>
                        </div>

                        {formData.location.latitude && formData.location.longitude && (
                            <div style={{ gridColumn: 'span 12', fontSize: '0.72rem', color: '#1da6d9', fontWeight: 600, marginTop: '-0.25rem', paddingLeft: '0.25rem' }}>
                                ✓ Coordinates captured: {formData.location.latitude.toFixed(5)}, {formData.location.longitude.toFixed(5)}
                            </div>
                        )}

                        <div style={{ gridColumn: 'span 12', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }} disabled={importLoading}>
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
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '0.75rem' }}>
                    <button
                        onClick={() => setMeetingSemesterFilter('Current')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem',
                            background: meetingSemesterFilter === 'Current' ? 'rgba(37, 170, 225, 0.12)' : 'transparent',
                            color: meetingSemesterFilter === 'Current' ? '#25AAE1' : 'rgba(255,255,255,0.4)',
                            border: meetingSemesterFilter === 'Current' ? '1px solid rgba(37, 170, 225, 0.2)' : '1px solid transparent',
                            fontSize: '0.75rem', fontWeight: 750, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >Current</button>
                    {semesters.filter(s => s !== currentSem).map(s => (
                        <button
                            key={s}
                            onClick={() => setMeetingSemesterFilter(s)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                background: meetingSemesterFilter === s ? 'rgba(37, 170, 225, 0.12)' : 'transparent',
                                color: meetingSemesterFilter === s ? '#25AAE1' : 'rgba(255,255,255,0.4)',
                                border: meetingSemesterFilter === s ? '1px solid rgba(37, 170, 225, 0.2)' : '1px solid transparent',
                                fontSize: '0.75rem', fontWeight: 750, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >{s}</button>
                    ))}
                    <button
                        onClick={() => setMeetingSemesterFilter('All')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem',
                            background: meetingSemesterFilter === 'All' ? 'rgba(37, 170, 225, 0.12)' : 'transparent',
                            color: meetingSemesterFilter === 'All' ? '#25AAE1' : 'rgba(255,255,255,0.4)',
                            border: meetingSemesterFilter === 'All' ? '1px solid rgba(37, 170, 225, 0.2)' : '1px solid transparent',
                            fontSize: '0.75rem', fontWeight: 750, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >All Time</button>
                </div>
            </div>

            {filteredHistory.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>No past meetings found in this period.</div>
            ) : (
                <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {filteredHistory.map(m => renderMeetingCard(m))}
                </div>
            )}

            {/* QR Modal for Meeting */}
            {selectedMeeting && (
                <div style={{ 
                    position: 'fixed', inset: 0, 
                    background: 'rgba(2, 6, 12, 0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' 
                }}
                    onClick={() => setSelectedMeeting(null)}>
                    <div className="glass-card-premium" style={{ 
                        padding: '2.5rem 2rem', 
                        textAlign: 'center', 
                        maxWidth: '400px', 
                        width: '100%', 
                        background: '#090d16',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(29, 166, 217, 0.2)',
                        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), 0 0 40px rgba(29, 166, 217, 0.08)',
                        animation: 'popScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Scan Meeting QR</h3>

                        <div className="qr-modal-content" style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <QRCode value={`${window.location.origin}/check-in/${selectedMeeting.code}`} size={220} level="H" />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>MEETING CODE</div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', lineHeight: 1 }}>
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
                                style={{ background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}
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
                                    style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', border: '1px solid rgba(37, 170, 225, 0.2)', padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }} onClick={() => setInsightMeeting(null)}>
                    <div style={{ width: '100%', maxWidth: '1000px' }} onClick={e => e.stopPropagation()}>
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
