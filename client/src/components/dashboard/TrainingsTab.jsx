import { useState, useEffect } from 'react';
import { 
    Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, 
    BarChart3, Trash2, Link as LinkIcon, 
    ExternalLink, RotateCcw, X, Settings as SettingsIcon, Lightbulb, 
    GraduationCap, Users 
} from 'lucide-react';
import QRCode from 'react-qr-code';
import MeetingInsights from '../MeetingInsights';

const TrainingsTab = ({ 
    trainings, 
    userRole, 
    isGuest, 
    fetchTrainings, 
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
    const [showCreateTraining, setShowCreateTraining] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [insightMeeting, setInsightMeeting] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [trainingSemesterFilter, setTrainingSemesterFilter] = useState('Current');

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

    const [trainingFormData, setTrainingFormData] = useState({
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
        if (!showCreateTraining) return;
        setTrainingFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
            semester: currentSemester || 'MAY-AUG 2026'
        }));
    }, [showCreateTraining, currentSemester]);

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

    const handleDeleteTraining = async (id, name) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        const password = window.prompt(`SECURITY CHECK: Enter admin password to DELETE "${name}":`);
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

    const handlePrintQR = () => {
        const meeting = selectedTraining;
        if (!meeting) return;

        const qrSvg = document.querySelector('.training-qr-container svg');
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
                            color: #0f172a;
                        }
                        .page {
                            width: 210mm; height: 297mm; position: relative;
                            background: #ffffff; overflow: hidden;
                            display: flex; flex-direction: column; align-items: center; justify-content: center;
                            box-sizing: border-box;
                            border: 12px solid #0f172a;
                        }
                        .page-inner-border {
                            position: absolute;
                            inset: 8px;
                            border: 2px solid rgba(15, 23, 42, 0.1);
                            pointer-events: none;
                        }
                        .content {
                            position: relative; z-index: 10; width: 100%; height: 100%;
                            display: flex; flex-direction: column; align-items: center; justify-content: space-between;
                            padding: 22mm 20mm; box-sizing: border-box;
                        }
                        .header { display: flex; flex-direction: column; align-items: center; gap: 10px; }
                        .logo-img { width: 95px; height: 95px; object-fit: contain; margin-bottom: 0.2rem; }
                        .meeting-title { font-size: 2.5rem; font-weight: 900; line-height: 1.1; color: #0f172a; margin: 5px 0; max-width: 90%; text-align: center; font-family: 'Outfit', sans-serif; letter-spacing: -0.5px; }
                        .meeting-meta { font-size: 1.25rem; color: #25AAE1; margin-top: 5px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 10px; }
                        .meeting-meta-dot { color: rgba(15, 23, 42, 0.2); }
                        .qr-outer-container { position: relative; padding: 12px; background: white; border-radius: 36px; border: 4px solid #0f172a; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
                        .qr-inner-wrapper { padding: 25px; background: white; border-radius: 28px; }
                        .scan-badge { position: absolute; top: -18px; right: -22px; background: #ef4444; color: white; font-weight: 900; padding: 10px 22px; border-radius: 50px; transform: rotate(10deg); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.25); font-size: 1.1rem; border: 3px solid white; text-transform: uppercase; letter-spacing: 1px; }
                        .footer { width: 100%; border-top: 2px solid #f1f5f9; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .instruction { text-align: left; }
                        .instruction h3 { font-size: 1.35rem; color: #25AAE1; margin: 0 0 4px 0; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; }
                        .instruction p { font-size: 0.95rem; color: #64748b; margin: 0; max-width: 380px; font-weight: 500; }
                        .theme-section { 
                            margin: 15px 0; 
                            padding: 24px 30px; 
                            background: linear-gradient(135deg, rgba(37, 170, 225, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
                            border: 1px solid rgba(37, 170, 225, 0.15); 
                            border-radius: 24px; 
                            max-width: 90%; 
                            width: 100%;
                            box-sizing: border-box;
                            text-align: center;
                            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
                        }
                        .theme-title { font-size: 0.9rem; font-weight: 900; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
                        .theme-text { font-size: 1.8rem; font-weight: 800; color: #0f172a; font-style: italic; margin: 10px 0; font-family: 'Outfit', sans-serif; letter-spacing: -0.3px; line-height: 1.25; }
                        .theme-verse { font-size: 1.05rem; color: #475569; font-weight: 600; line-height: 1.5; margin-top: 10px; border-top: 1px solid rgba(15, 23, 42, 0.05); padding-top: 10px; }
                        .theme-verse strong { color: #0f172a; font-weight: 800; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; }
                        .meta { text-align: right; font-size: 0.95rem; color: #64748b; font-weight: 700; line-height: 1.4; }
                        .meta-system { font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
                        @media print { body { background: none; } .page { box-shadow: none; margin: 0; width: 100%; height: 100%; } }
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="page-inner-border"></div>
                        <div class="content">
                            <div class="header">
                                <img src="/logo.png" class="logo-img" alt="Logo" />
                                <h1 class="meeting-title">${meeting.name}</h1>
                                <div class="meeting-meta">
                                    <span>${meeting.campus.toUpperCase()} CAMPUS</span>
                                    <span class="meeting-meta-dot">•</span>
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
                                <div class="theme-text">"${semesterTheme || 'Trust the designer He knows the journey'}"</div>
                                <div class="theme-verse">
                                    <strong>${splitVerse(semesterVerse).ref}</strong><br/>
                                    "${splitVerse(semesterVerse).text}"
                                </div>
                            </div>
                            <div class="footer">
                                <div class="instruction">
                                    <h3>Quick Check-In</h3>
                                    <p>Open your camera or QR scanner to mark your attendance instantly.</p>
                                </div>
                                <div class="meta">
                                    ${new Date(meeting.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                                    <span class="meta-system">Leaders In Service System</span>
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

        const monthStr = tDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const dayStr = tDate.getDate();
        const weekdayStr = tDate.toLocaleDateString('en-US', { weekday: 'short' });

        return (
            <div
                key={t._id}
                className="glass-card-premium metric-card-glow"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    border: isActuallyLive ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(29, 166, 217, 0.15)',
                    boxShadow: isActuallyLive ? '0 0 25px rgba(52, 211, 153, 0.15)' : '0 10px 30px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    padding: '1.5rem',
                    position: 'relative'
                }}
                onClick={() => setInsightMeeting(t)}
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
                            background: isActuallyLive ? 'linear-gradient(135deg, #34d399, #059669)' : 'linear-gradient(135deg, #1da6d9, #0a4d68)',
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
                                {t.name}
                            </h3>
                            <span style={{
                                fontSize: '0.55rem',
                                padding: '0.15rem 0.4rem',
                                background: 'rgba(52, 211, 153, 0.2)',
                                color: '#34d399',
                                borderRadius: '0.35rem',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                border: '1px solid rgba(52, 211, 153, 0.3)'
                            }}>Training</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 600 }}>
                            <MapPin size={12} color="#1da6d9" />
                            <span>{t.campus}</span>
                            <span style={{ opacity: 0.3 }}>•</span>
                            <span>{weekdayStr}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.85rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={12} color="rgba(255,255,255,0.4)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                            {t.startTime} - {t.endTime}
                        </span>
                    </div>

                    {(() => {
                        if (!t.isActive) return (
                            <span className="status-pill-modern completed">
                                Archived
                            </span>
                        );
                        if (isOver) return (
                            <span className="status-pill-modern completed">
                                Completed
                            </span>
                        );
                        if (isActuallyLive) return (
                            <span className="status-pill-modern live" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.25)' }}>
                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s infinite' }}></span>
                                Live Now
                            </span>
                        );
                        return (
                            <span className="status-pill-modern standby" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.15)' }}>
                                Scheduled
                            </span>
                        );
                    })()}
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Attendance</span>
                        <span style={{ color: '#34d399' }}>{t.attendanceCount || 0} checked-in</span>
                    </div>
                    <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(100, ((t.attendanceCount || 0) / 100) * 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #34d399, #059669)',
                            borderRadius: '10px',
                            transition: 'width 1s ease-in-out'
                        }} />
                    </div>
                </div>

                <div 
                    style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {((t.isActive && !isOver) || ['developer', 'superadmin'].includes(userRole)) && (
                        <button
                            className="btn"
                            style={{
                                flex: 1,
                                background: 'rgba(52, 211, 153, 0.1)',
                                color: '#34d399',
                                border: '1px solid rgba(52, 211, 153, 0.2)',
                                padding: '0.55rem',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem'
                            }}
                            onClick={() => setSelectedTraining(t)}
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
                        onClick={() => setInsightMeeting(t)}
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
                        onClick={() => handleToggleTrainingStatus(t._id, t.isActive)}
                    >
                        {t.isActive ? <X size={14} title="Close Training" /> : <RotateCcw size={14} title="Reopen Training" />}
                    </button>

                    {['developer', 'superadmin'].includes(userRole) && (
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
                            onClick={() => handleDeleteTraining(t._id, t.name)}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

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
        <>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowCreateTraining(!showCreateTraining)}
                    style={{ background: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'black', fontWeight: 800 }}>
                    <Plus size={20} /> New Training Session
                </button>
            </div>

            {showCreateTraining && (
                <div className="glass-card-premium" style={{ marginBottom: '2rem', maxWidth: '800px', position: 'relative', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399', fontWeight: 800 }}>
                            <GraduationCap size={22} style={{ color: '#34d399' }} /> Create Training Session
                        </h3>
                        <button 
                            onClick={() => setShowCreateTraining(false)} 
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-text-dim)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', transition: 'background-color 0.2s' }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleCreateTraining} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                        
                        <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <SettingsIcon size={14} /> Training Setup
                            </span>
                        </div>
                        
                        <div style={{ gridColumn: '1 / -1' }} className="form-group-premium">
                            <label>Training Name</label>
                            <input className="modern-input" value={trainingFormData.name} onChange={e => setTrainingFormData({ ...trainingFormData, name: e.target.value })} placeholder="e.g. Leadership Foundations" required />
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> Date</label>
                            <input type="date" className="modern-input" value={trainingFormData.date} onChange={e => setTrainingFormData({ ...trainingFormData, date: e.target.value })} required />
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={14} /> Campus</label>
                            <select className="modern-input" value={trainingFormData.campus} onChange={e => setTrainingFormData({ ...trainingFormData, campus: e.target.value })}>
                                <option value="Both">Both Campuses</option>
                                <option value="Athi River">Athi River Only</option>
                                <option value="Valley Road">Valley Road Only</option>
                            </select>
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> Start Time</label>
                            <input type="time" className="modern-input" value={trainingFormData.startTime} onChange={e => setTrainingFormData({ ...trainingFormData, startTime: e.target.value })} required />
                        </div>
                        
                        <div className="form-group-premium">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> End Time</label>
                            <input type="time" className="modern-input" value={trainingFormData.endTime} onChange={e => setTrainingFormData({ ...trainingFormData, endTime: e.target.value })} required />
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }} className="form-group-premium">
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Lightbulb size={14} /> Question Type</label>
                                <select 
                                    className="modern-input"
                                    value={trainingFormData.questionType || 'text'}
                                    onChange={e => {
                                        const type = e.target.value;
                                        setTrainingFormData(prev => ({
                                            ...prev,
                                            questionType: type,
                                            questionOptions: (type === 'multiple_choice' || type === 'checkboxes') ? ['', ''] : []
                                        }));
                                    }}
                                >
                                    <option value="text">Open Ended (Text)</option>
                                    <option value="yes_no">Yes / No</option>
                                    <option value="multiple_choice">Multiple Choice (Single Select)</option>
                                    <option value="checkboxes">Select Multiple (Checkboxes)</option>
                                    <option value="rating">Rating Scale (1-5 Stars)</option>
                                </select>
                            </div>
                            <div>
                                <label>Question Wording</label>
                                <input 
                                    type="text"
                                    className="modern-input"
                                    value={trainingFormData.questionOfDay}
                                    onChange={e => setTrainingFormData({ ...trainingFormData, questionOfDay: e.target.value })}
                                    placeholder="e.g. Rate your week / Choose an option"
                                />
                            </div>
                        </div>

                        {(trainingFormData.questionType === 'multiple_choice' || trainingFormData.questionType === 'checkboxes') && (
                            <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Poll Choices / Options</span>
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)', cursor: 'pointer', borderRadius: '0.5rem', fontWeight: 800 }}
                                        onClick={() => {
                                            setTrainingFormData(prev => ({
                                                ...prev,
                                                questionOptions: [...prev.questionOptions, '']
                                            }));
                                        }}
                                    >
                                        + Add Option
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {trainingFormData.questionOptions.map((opt, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.5, minWidth: '20px' }}>{idx + 1}.</span>
                                            <input
                                                type="text"
                                                className="modern-input"
                                                style={{ flex: 1, height: '38px', minHeight: '38px', padding: '0.5rem 0.75rem' }}
                                                value={opt}
                                                placeholder={`Option ${idx + 1}`}
                                                required
                                                onChange={e => {
                                                    const newOpts = [...trainingFormData.questionOptions];
                                                    newOpts[idx] = e.target.value;
                                                    setTrainingFormData({ ...trainingFormData, questionOptions: newOpts });
                                                }}
                                            />
                                            {trainingFormData.questionOptions.length > 2 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={() => {
                                                        const newOpts = trainingFormData.questionOptions.filter((_, i) => i !== idx);
                                                        setTrainingFormData({ ...trainingFormData, questionOptions: newOpts });
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <MapPin size={14} /> Venue & Geofencing
                            </span>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }} className="form-group-premium">
                            <label>Venue Name *</label>
                            <input className="modern-input" placeholder="e.g. AR Guest House" value={trainingFormData.location.name}
                                onChange={e => setTrainingFormData({ ...trainingFormData, location: { ...trainingFormData.location, name: e.target.value } })} required />
                        </div>
                        
                        <div className="form-group-premium">
                            <label>Geofence Radius (meters)</label>
                            <input type="number" className="modern-input" value={trainingFormData.location.radius}
                                onChange={e => setTrainingFormData({ ...trainingFormData, location: { ...trainingFormData.location, radius: Number(e.target.value) } })} placeholder="200" />
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.15)', borderRadius: '1rem', padding: '1.25rem', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <MapPin size={16} /> GPS Geofence Link
                                </span>
                                {trainingFormData.location.latitude && trainingFormData.location.longitude ? (
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                        ✓ Coordinates captured: {trainingFormData.location.latitude.toFixed(5)}, {trainingFormData.location.longitude.toFixed(5)}
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
                                style={{ background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(10, 77, 104, 0.3) 100%)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: 700 }}
                                onClick={() => {
                                    navigator.geolocation.getCurrentPosition(pos => {
                                        setTrainingFormData(prev => ({ ...prev, location: { ...prev.location, latitude: pos.coords.latitude, longitude: pos.coords.longitude } }));
                                        setMsg({ type: 'success', text: `GPS captured!` });
                                    }, () => setMsg({ type: 'error', text: 'GPS permission denied or unavailable.' }));
                                }}
                            >
                                <MapPin size={16} /> Capture GPS
                            </button>
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={importLoading} 
                                style={{ background: '#34d399', padding: '1rem 2.5rem', color: 'black', fontWeight: 800, borderRadius: '0.75rem', width: '100%', letterSpacing: '0.5px' }}
                            >
                                {importLoading ? 'CREATING...' : 'CREATE TRAINING SESSION'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '0.75rem' }}>
                    <button onClick={() => setTrainingSemesterFilter('Current')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem',
                            background: trainingSemesterFilter === 'Current' ? 'rgba(52, 211, 153, 0.12)' : 'transparent',
                            color: trainingSemesterFilter === 'Current' ? '#34d399' : 'rgba(255,255,255,0.4)',
                            border: trainingSemesterFilter === 'Current' ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid transparent',
                            fontSize: '0.75rem', fontWeight: 750, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >Current</button>
                    {semesters.filter(s => s !== currentSem).map(s => (
                        <button key={s} onClick={() => setTrainingSemesterFilter(s)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                background: trainingSemesterFilter === s ? 'rgba(52, 211, 153, 0.12)' : 'transparent',
                                color: trainingSemesterFilter === s ? '#34d399' : 'rgba(255,255,255,0.4)',
                                border: trainingSemesterFilter === s ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid transparent',
                                fontSize: '0.75rem', fontWeight: 750, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >{s}</button>
                    ))}
                    <button onClick={() => setTrainingSemesterFilter('All')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem',
                            background: trainingSemesterFilter === 'All' ? 'rgba(52, 211, 153, 0.12)' : 'transparent',
                            color: trainingSemesterFilter === 'All' ? '#34d399' : 'rgba(255,255,255,0.4)',
                            border: trainingSemesterFilter === 'All' ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid transparent',
                            fontSize: '0.75rem', fontWeight: 750, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >All Time</button>
                </div>
            </div>

            {filteredHistory.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>No archived trainings.</div>
            ) : (
                <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {filteredHistory.map(t => renderTrainingCard(t))}
                </div>
            )}

            {/* QR Modal for Training */}
            {selectedTraining && (
                <div style={{ 
                    position: 'fixed', inset: 0, 
                    background: 'rgba(2, 6, 12, 0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' 
                }}
                    onClick={() => setSelectedTraining(null)}>
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
                                style={{ background: '#34d399', padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'black' }}
                                onClick={() => handlePrintQR()}
                            >
                                <Download size={14} style={{ marginRight: '0.4rem' }} /> Print QR
                            </button>
                            <button
                                className="btn"
                                style={{ background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}
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

            {/* Insights Modal */}
            {insightMeeting && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }} onClick={() => setInsightMeeting(null)}>
                    <div style={{ width: '100%', maxWidth: '1000px' }} onClick={e => e.stopPropagation()}>
                        <MeetingInsights 
                            meeting={insightMeeting} 
                            onClose={() => setInsightMeeting(null)} 
                            api={api} 
                            onQuickCheckIn={async (meetingId, regNo) => {
                                setQuickCheckInLoading(true);
                                try {
                                    await api.post('/attendance/manual', {
                                        meetingId,
                                        studentRegNo: regNo
                                    });
                                    setMsg({ type: 'success', text: `Success! Checked in ${regNo}` });
                                    fetchTrainings();
                                    fetchMembers();
                                } catch (err) {
                                    setMsg({ type: 'error', text: err.response?.data?.message || 'Check-in failed' });
                                } finally {
                                    setQuickCheckInLoading(false);
                                }
                            }} 
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default TrainingsTab;
