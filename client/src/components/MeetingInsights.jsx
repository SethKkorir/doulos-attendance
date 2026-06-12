/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import {
    BarChart3, Activity, Users, Search, X, ShieldAlert as Ghost, Trash2,
    MessageSquare, UserX, Clock, HelpCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const MeetingInsights = ({ meeting, onClose, api, onQuickCheckIn, isTraining }) => {
    const [currentMeeting, setCurrentMeeting] = useState(meeting);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [insightSearch, setInsightSearch] = useState('');
    const [activeTab, setActiveTab] = useState(isTraining ? 'ticker' : 'manual_checkin'); // Default to checklist first!
    const [selectedDay, setSelectedDay] = useState(meeting.activeDay || 1);
    const [togglingRegDay, setTogglingRegDay] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setCurrentMeeting(meeting);
        setSelectedDay(meeting.activeDay || 1);
    }, [meeting]);

    useEffect(() => {
        let isFirstLoad = true;
        const fetchInsights = async () => {
            if (isFirstLoad) setLoading(true);
            try {
                // Fetch attendance for this meeting
                const attRes = await api.get(`/attendance/${meeting._id}`);
                setAttendanceRecords(attRes.data);

                // Fetch all members for this campus
                if (isFirstLoad) {
                    const memRes = await api.get(`/members?campus=${meeting.campus === 'Both' ? 'All' : meeting.campus}`);
                    setAllMembers(memRes.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isFirstLoad) {
                    setLoading(false);
                    isFirstLoad = false;
                }
            }
        };
        fetchInsights();

        const interval = setInterval(fetchInsights, 3000);
        return () => clearInterval(interval);
    }, [meeting, api]);

    const handleActiveDayChange = async (day) => {
        try {
            const res = await api.patch(`/trainings/${currentMeeting._id}`, { activeDay: day });
            setCurrentMeeting(res.data);
            setSelectedDay(day);
        } catch (err) {
            console.error("Failed to update active day", err);
            alert(err.response?.data?.message || "Failed to update active day");
        }
    };

    const handleToggleDay = async (member, day) => {
        const key = `${member.studentRegNo}_${day}`;
        setTogglingRegDay(key);
        try {
            const record = attendanceRecords.find(a => 
                String(a.studentRegNo).trim().toUpperCase() === String(member.studentRegNo).trim().toUpperCase() &&
                (a.trainingDay || 1) === day
            );

            if (record) {
                await api.delete(`/attendance/${record._id}`);
                setAttendanceRecords(prev => prev.filter(a => a._id !== record._id));
            } else {
                const res = await api.post('/attendance/manual', {
                    meetingId: currentMeeting._id,
                    studentRegNo: member.studentRegNo,
                    name: member.name,
                    trainingDay: day
                });
                setAttendanceRecords(prev => [res.data, ...prev]);
            }
        } catch (err) {
            console.error("Failed to toggle attendance", err);
            alert(err.response?.data?.message || "Operation failed");
        } finally {
            setTogglingRegDay(null);
        }
    };

    const handleToggleRegular = async (member) => {
        const key = `${member.studentRegNo}_regular`;
        setTogglingRegDay(key);
        try {
            const record = attendanceRecords.find(a => 
                String(a.studentRegNo).trim().toUpperCase() === String(member.studentRegNo).trim().toUpperCase()
            );

            if (record) {
                await api.delete(`/attendance/${record._id}`);
                setAttendanceRecords(prev => prev.filter(a => a._id !== record._id));
            } else {
                const res = await api.post('/attendance/manual', {
                    meetingId: currentMeeting._id,
                    studentRegNo: member.studentRegNo,
                    name: member.name
                });
                setAttendanceRecords(prev => [res.data, ...prev]);
            }
        } catch (err) {
            console.error("Failed to toggle attendance", err);
            alert(err.response?.data?.message || "Operation failed");
        } finally {
            setTogglingRegDay(null);
        }
    };

    const handleSingleCheckIn = async (regNo, name) => {
        try {
            const res = await api.post('/attendance/manual', {
                meetingId: currentMeeting._id,
                studentRegNo: regNo,
                name: name,
                trainingDay: isTraining ? selectedDay : undefined
            });
            setAttendanceRecords(prev => [res.data, ...prev]);
        } catch (err) {
            console.error("Check-in failed", err);
            alert(err.response?.data?.message || 'Check-in failed');
        }
    };

    const handleRemoveCheckIn = async (recordId, regNo, memberName) => {
        if (!window.confirm(`⚠️ DANGER: Remove check-in for ${memberName || regNo}?\n\nThis will also automatically decrement 10 points from their profile.`)) {
            return;
        }
        try {
            await api.delete(`/attendance/${recordId}`);
            setAttendanceRecords(prev => prev.filter(a => a._id !== recordId));
        } catch (err) {
            console.error("Failed to delete check-in", err);
            alert(err.response?.data?.message || 'Failed to remove check-in record.');
        }
    };

    // Derived stats
    const presentList = isTraining 
        ? attendanceRecords.filter(a => (a.trainingDay || 1) === selectedDay)
        : attendanceRecords;

    const presentRegNos = new Set(presentList.map(a => String(a.studentRegNo).trim().toUpperCase()));

    const absentList = allMembers.filter(m => !presentRegNos.has(String(m.studentRegNo).trim().toUpperCase()));

    const presentCount = presentList.length;
    const absentCount = absentList.length;
    const totalEligible = allMembers.length;

    const recruitsCount = presentList.filter(a => a.memberType === 'Recruit').length;

    const breakdown = presentList.reduce((acc, curr) => {
        acc[curr.memberType] = (acc[curr.memberType] || 0) + 1;
        return acc;
    }, { 'Douloid': 0, 'Recruit': 0, 'Visitor': 0 });

    const stats = {
        presentCount,
        absentCount,
        absentList,
        presentList,
        breakdown,
        recruitsCount,
        totalEligible
    };

    const getPollData = () => {
        if (!stats || !meeting?.questionOfDay) return { data: [], totalVotes: 0, averageRating: 0 };
        
        const qType = meeting.questionType || 'text';
        const options = meeting.questionOptions || [];
        
        let totalVotes = 0;
        
        if (qType === 'yes_no') {
            const counts = { 'Yes': 0, 'No': 0 };
            presentList.forEach(a => {
                const answer = a.questionOfDay || a.responses?.dailyQuestionAnswer || a.responses?.['dailyQuestionAnswer'] || '';
                const cleanAns = String(answer).trim().toLowerCase();
                if (cleanAns === 'yes') counts['Yes']++;
                else if (cleanAns === 'no') counts['No']++;
            });
            totalVotes = counts['Yes'] + counts['No'];
            return {
                totalVotes,
                data: [
                    { name: 'Yes', value: counts['Yes'] },
                    { name: 'No', value: counts['No'] }
                ]
            };
        }
        
        if (qType === 'multiple_choice') {
            const counts = {};
            options.forEach(opt => { counts[opt] = 0; });
            presentList.forEach(a => {
                const answer = a.questionOfDay || a.responses?.dailyQuestionAnswer || a.responses?.['dailyQuestionAnswer'] || '';
                const cleanAns = String(answer).trim();
                if (counts[cleanAns] !== undefined) {
                    counts[cleanAns]++;
                    totalVotes++;
                }
            });
            return {
                totalVotes,
                data: Object.keys(counts).map(opt => ({ name: opt, value: counts[opt] }))
            };
        }
        
        if (qType === 'checkboxes') {
            const counts = {};
            options.forEach(opt => { counts[opt] = 0; });
            presentList.forEach(a => {
                const answer = a.questionOfDay || a.responses?.dailyQuestionAnswer || a.responses?.['dailyQuestionAnswer'] || '';
                const selections = String(answer).split(', ').map(s => s.trim());
                selections.forEach(sel => {
                    if (counts[sel] !== undefined) {
                        counts[sel]++;
                        totalVotes++;
                    }
                });
            });
            return {
                totalVotes,
                data: Object.keys(counts).map(opt => ({ name: opt, value: counts[opt] }))
            };
        }
        
        if (qType === 'rating') {
            const counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
            let sum = 0;
            let count = 0;
            presentList.forEach(a => {
                const answer = a.questionOfDay || a.responses?.dailyQuestionAnswer || a.responses?.['dailyQuestionAnswer'] || '';
                const score = parseInt(answer);
                if (score >= 1 && score <= 5) {
                    counts[String(score)]++;
                    sum += score;
                    count++;
                }
            });
            const averageRating = count > 0 ? (sum / count).toFixed(1) : '0.0';
            return {
                totalVotes: count,
                averageRating,
                data: Object.keys(counts).map(star => ({ name: `${star} Star`, value: counts[star] }))
            };
        }
        
        return { data: [], totalVotes: 0, averageRating: 0 };
    };

    if (loading) return (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="loading-spinner-small" style={{ margin: '0 auto 1.5rem', width: '50px', height: '50px', borderTopColor: 'hsl(var(--color-primary))' }}></div>
            <p style={{ fontWeight: 800, letterSpacing: '2px', color: 'hsl(var(--color-primary))', fontSize: '0.8rem' }}>DECODING ATTENDANCE PATTERNS...</p>
        </div>
    );

    if (!stats) return null;

    const rate = Math.round((stats.presentCount / stats.totalEligible) * 100) || 0;

    const filteredAbsent = stats.absentList.filter(m => {
        const cleanSearch = (insightSearch || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = (m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = (m.studentRegNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch);
    });

    const filteredPresent = stats.presentList.filter(a => {
        const cleanSearch = (insightSearch || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = (a.responses?.studentName || a.name || 'Member').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = (a.studentRegNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const answerText = (a.questionOfDay || a.responses?.dailyQuestionAnswer || a.responses?.['dailyQuestionAnswer'] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch) || answerText.includes(cleanSearch);
    });

    const filteredMembers = allMembers.filter(m => {
        const cleanSearch = (insightSearch || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = (m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = (m.studentRegNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch);
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
        <div className="glass-card-premium" style={{
            padding: isMobile ? '1.15rem' : '2rem',
            background: '#0d111b',
            borderRadius: isMobile ? '1.25rem' : '2rem',
            animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none !important;
                }
                .no-scrollbar {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
            `}</style>
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'nowrap', gap: '1rem', marginBottom: isMobile ? '1.25rem' : '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem', flex: 1 }}>
                    <div style={{ padding: isMobile ? '0.6rem' : '0.85rem', background: 'rgba(37, 170, 225, 0.12)', borderRadius: isMobile ? '0.75rem' : '1rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                        <BarChart3 size={isMobile ? 22 : 28} color="#25AAE1" style={{ filter: 'drop-shadow(0 0 6px rgba(37, 170, 225, 0.4))' }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.65rem', fontWeight: 950, letterSpacing: '-0.75px', color: 'white' }}>Meeting Insights</h2>
                        <p style={{ color: 'rgba(255,255,255,0.45)', margin: '0.25rem 0 0 0', fontWeight: 700, fontSize: isMobile ? '0.75rem' : '0.88rem' }}>
                            {currentMeeting.name} • {new Date(currentMeeting.date).toLocaleDateString(undefined, { weekday: isMobile ? 'short' : 'long', year: isMobile ? undefined : 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="btn"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white',
                        padding: isMobile ? '0.55rem 1rem' : '0.75rem 1.5rem',
                        borderRadius: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        letterSpacing: '0.5px',
                        transition: 'all 0.3s',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                >
                    {isMobile ? 'EXIT' : 'EXIT ANALYSIS'}
                </button>
            </div>

            {isTraining && (
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem',
                    borderRadius: '1.25rem',
                    marginBottom: '1.25rem',
                    gap: isMobile ? '0.85rem' : '1rem'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#34d399', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            Live Check-in Control
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
                            Select which day is active/live for QR scans.
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', width: isMobile ? '100%' : 'auto' }}>
                        {[1, 2, 3].map(day => {
                            const isActiveDay = currentMeeting.activeDay === day;
                            return (
                                <button
                                    key={day}
                                    onClick={() => handleActiveDayChange(day)}
                                    style={{
                                        flex: isMobile ? 1 : 'none',
                                        padding: isMobile ? '0.5rem 0.25rem' : '0.55rem 1.25rem',
                                        background: isActiveDay ? 'linear-gradient(135deg, #34d399, #059669)' : 'rgba(255, 255, 255, 0.03)',
                                        border: isActiveDay ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '0.65rem',
                                        color: isActiveDay ? 'black' : 'white',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.3rem'
                                    }}
                                >
                                    {isActiveDay && <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: 'black', animation: 'pulse 1.5s infinite' }} />}
                                    Day {day} {isActiveDay && !isMobile ? ' (LIVE)' : ''}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Glowing Question of the Day Callout Header */}
            {meeting.questionOfDay && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(37, 170, 225, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                    border: '1px solid rgba(37, 170, 225, 0.2)',
                    padding: isMobile ? '1rem 1.15rem' : '1.5rem 1.75rem',
                    borderRadius: '1.25rem',
                    marginBottom: '1.25rem',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.62rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        <HelpCircle size={10} /> ACTIVE QUESTION OF THE DAY
                    </div>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '0.95rem' : '1.18rem', fontWeight: 800, color: 'white', lineHeight: '1.45', fontStyle: 'italic', opacity: 0.95 }}>
                        "{meeting.questionOfDay}"
                    </h3>
                </div>
            )}

            {/* Smart Keyword & Registry Search */}
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.85rem', alignItems: isMobile ? 'stretch' : 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '1.15rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255,255,255,0.3)'
                        }}
                    />
                    <input
                        type="text"
                        placeholder={isMobile ? "Search name, reg no, or answers..." : "Search by student name, admission number, or answer keywords (e.g. faith, grace)..."}
                        value={insightSearch}
                        onChange={e => setInsightSearch(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: isMobile ? '0.75rem 1rem 0.75rem 2.8rem' : '1rem 1.5rem 1rem 3.5rem',
                            borderRadius: '1rem',
                            color: 'white',
                            fontSize: isMobile ? '0.85rem' : '0.95rem',
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(37, 170, 225, 0.4)'; e.target.style.background = 'rgba(0,0,0,0.45)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.05)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }}
                    />
                    {insightSearch && (
                        <button
                            onClick={() => setInsightSearch('')}
                            style={{
                                position: 'absolute',
                                right: '1.15rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {isTraining && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: '0.3rem 0.4rem', 
                        borderRadius: '0.85rem', 
                        border: '1px solid rgba(255,255,255,0.06)',
                        justifyContent: isMobile ? 'space-between' : 'flex-start'
                    }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', padding: '0 0.45rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Viewing:</span>
                        <div style={{ display: 'flex', gap: '0.2rem', flex: isMobile ? 1 : 'none', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                            {[1, 2, 3].map(day => {
                                const isSelected = selectedDay === day;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        style={{
                                            padding: isMobile ? '0.35rem 0.75rem' : '0.45rem 1rem',
                                            background: isSelected ? 'rgba(37, 170, 225, 0.15)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '0.55rem',
                                            color: isSelected ? '#25AAE1' : 'rgba(255,255,255,0.5)',
                                            fontWeight: 800,
                                            fontSize: '0.72rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Day {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Tab Navigation Switcher Bar */}
            <div 
                className="no-scrollbar"
                style={{ 
                    display: 'flex', 
                    gap: '0.4rem', 
                    borderBottom: '1px solid rgba(255,255,255,0.06)', 
                    paddingBottom: '0.6rem', 
                    marginBottom: '1.25rem', 
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {[
                    ...(isTraining 
                        ? [{ id: 'ticker', label: '3-Day Ticker', icon: Activity }]
                        : [{ id: 'manual_checkin', label: 'Manual Ticker', icon: Activity }]),
                    { id: 'answers', label: 'Answers Board', icon: MessageSquare, badge: filteredPresent.length },
                    { id: 'present', label: 'Participants List', icon: Users, badge: filteredPresent.length },
                    { id: 'absent', label: 'Missed Registry', icon: UserX, badge: filteredAbsent.length }
                ].map(tab => {
                    const ActiveIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: isMobile ? '0.5rem 0.85rem' : '0.65rem 1.25rem',
                                background: isActive ? 'rgba(37, 170, 225, 0.1)' : 'transparent',
                                border: '1px solid',
                                borderColor: isActive ? 'rgba(37, 170, 225, 0.25)' : 'transparent',
                                color: isActive ? '#25AAE1' : 'rgba(255,255,255,0.5)',
                                borderRadius: '0.65rem',
                                fontWeight: 800,
                                fontSize: isMobile ? '0.72rem' : '0.78rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                        >
                            <ActiveIcon size={isMobile ? 12 : 14} />
                            <span>{tab.label}</span>
                            {tab.badge !== undefined && (
                                <span style={{
                                    fontSize: '0.58rem',
                                    fontWeight: 900,
                                    background: isActive ? '#25AAE1' : 'rgba(255,255,255,0.1)',
                                    color: isActive ? '#0d111b' : 'rgba(255,255,255,0.6)',
                                    padding: '0.08rem 0.4rem',
                                    borderRadius: '0.4rem',
                                    marginLeft: '2px'
                                }}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* TAB PANELS RENDERING */}

            {/* 1. Answers Board Tab */}
            {activeTab === 'answers' && (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {filteredPresent.length === 0 ? (
                        <div style={{ 
                            padding: '5rem 2rem', 
                            textAlign: 'center', 
                            background: 'rgba(255,255,255,0.01)', 
                            borderRadius: '1.5rem', 
                            border: '1px dashed rgba(255,255,255,0.06)' 
                        }}>
                            <MessageSquare size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
                            <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>No responses match search criteria</h4>
                            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', opacity: 0.5 }}>
                                {insightSearch ? 'Try clearing your live filter text.' : 'Nobody has checked in and answered this question yet.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {filteredPresent.map(a => {
                                const answer = a.questionOfDay || a.responses?.dailyQuestionAnswer || a.responses?.['dailyQuestionAnswer'] || '';
                                return (
                                    <div key={a._id} className="glass-panel" style={{
                                        padding: '1.5rem',
                                        background: 'rgba(15, 23, 42, 0.4)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        borderRadius: '1.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37, 170, 225, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        {/* Respondent details */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>
                                                    {a.responses?.studentName || 'Member'}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: '0.15rem' }}>
                                                    {a.studentRegNo} • {a.campus}
                                                </div>
                                            </div>
                                            <span style={{
                                                background: a.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.08)' : a.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(37, 170, 225, 0.08)',
                                                color: a.memberType === 'Recruit' ? '#a78bfa' : a.memberType === 'Visitor' ? '#facc15' : '#25AAE1',
                                                border: `1px solid ${a.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.15)' : a.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(37, 170, 225, 0.15)'}`,
                                                fontSize: '0.62rem',
                                                fontWeight: 900,
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '0.5rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {a.memberType}
                                            </span>
                                        </div>

                                        {/* Answer quote bubble */}
                                        <div style={{
                                            background: 'rgba(2, 10, 20, 0.35)',
                                            border: '1px solid rgba(255,255,255,0.02)',
                                            padding: '1.15rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.85rem',
                                            color: '#e2e8f0',
                                            lineHeight: '1.6',
                                            fontStyle: 'italic',
                                            fontWeight: 500,
                                            flex: 1,
                                            wordBreak: 'break-word'
                                        }}>
                                            {answer ? `"${answer}"` : <span style={{ opacity: 0.3 }}>No response submitted for the custom question.</span>}
                                        </div>

                                        {/* Metadata footer */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> CHECKED IN</span>
                                            <span>{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 2. Manual Checklist Tab (For Regular Meetings) */}
            {!isTraining && activeTab === 'manual_checkin' && (() => {
                const toCheckIn = filteredMembers.filter(m => 
                    !attendanceRecords.some(a => String(a.studentRegNo).trim().toUpperCase() === String(m.studentRegNo).trim().toUpperCase())
                );
                const checkedIn = filteredMembers.filter(m => 
                    attendanceRecords.some(a => String(a.studentRegNo).trim().toUpperCase() === String(m.studentRegNo).trim().toUpperCase())
                );
                
                const renderMemberCard = (m, isPresent) => {
                    const record = attendanceRecords.find(a => String(a.studentRegNo).trim().toUpperCase() === String(m.studentRegNo).trim().toUpperCase());
                    const isToggling = togglingRegDay === `${m.studentRegNo}_regular`;
                    return (
                        <div key={m._id || m.studentRegNo} style={{
                            padding: isMobile ? '0.9rem 1rem' : '0.85rem 1.25rem',
                            background: isPresent ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255,255,255,0.01)',
                            border: `1px solid ${isPresent ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.04)'}`,
                            borderRadius: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                    background: isPresent ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isPresent ? '#34d399' : 'rgba(255,255,255,0.3)',
                                    fontSize: '0.85rem', fontWeight: 900
                                }}>
                                    {isPresent ? '✓' : (m.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {m.name || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                                        {m.studentRegNo}
                                        {isPresent && record && (
                                            <span style={{ marginLeft: '0.5rem', color: '#34d399', fontSize: '0.62rem' }}>
                                                • {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <span style={{
                                    background: m.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.08)' : m.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(37, 170, 225, 0.08)',
                                    color: m.memberType === 'Recruit' ? '#a78bfa' : m.memberType === 'Visitor' ? '#facc15' : '#25AAE1',
                                    border: `1px solid ${m.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.15)' : m.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(37, 170, 225, 0.15)'}`,
                                    fontSize: '0.58rem', fontWeight: 900, padding: '0.15rem 0.4rem',
                                    borderRadius: '0.35rem', textTransform: 'uppercase'
                                }}>{m.memberType}</span>
                                <button
                                    onClick={() => handleToggleRegular(m)}
                                    disabled={isToggling}
                                    style={{
                                        padding: '0.45rem 0.85rem',
                                        background: isPresent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 170, 225, 0.15)',
                                        border: isPresent ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(37, 170, 225, 0.3)',
                                        borderRadius: '0.6rem',
                                        color: isPresent ? '#f87171' : '#25AAE1',
                                        fontWeight: 800, fontSize: '0.72rem',
                                        cursor: isToggling ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        transition: 'all 0.2s', whiteSpace: 'nowrap'
                                    }}
                                >
                                    {isToggling ? (
                                        <div className="loading-spinner-small" style={{ width: '12px', height: '12px', borderTopColor: 'currentColor' }} />
                                    ) : isPresent ? (
                                        <><span>✕</span> Remove</>
                                    ) : (
                                        <><span>✓</span> Check In</>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                };
                
                return (
                    <div style={{ animation: 'fadeIn 0.4s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {filteredMembers.length === 0 ? (
                            <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '1.5rem', border: '1px dashed rgba(255,255,255,0.06)' }}>
                                <Search size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>No members found</h4>
                                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', opacity: 0.5 }}>Try adjusting your search.</p>
                            </div>
                        ) : (
                            <>
                                {/* TO CHECK IN */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>To Check In</div>
                                        <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{toCheckIn.length}</span>
                                    </div>
                                    {toCheckIn.length === 0 ? (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(52, 211, 153, 0.03)', border: '1px dashed rgba(52, 211, 153, 0.15)', borderRadius: '1rem' }}>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>✓ All members accounted for!</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {toCheckIn.map(m => renderMemberCard(m, false))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* CHECKED IN */}
                                {checkedIn.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Checked In</div>
                                            <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{checkedIn.length}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {checkedIn.map(m => renderMemberCard(m, true))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            })()}



            {/* 3. Participants Registry List */}
            {activeTab === 'present' && (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {filteredPresent.length === 0 ? (
                        <div style={{ 
                            padding: '5rem 2rem', 
                            textAlign: 'center', 
                            background: 'rgba(255,255,255,0.01)', 
                            borderRadius: '1.5rem', 
                            border: '1px dashed rgba(255,255,255,0.06)' 
                        }}>
                            <Search size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
                            <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>No present participants matching your search</h4>
                            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', opacity: 0.5 }}>Try adjusting your live filter search input.</p>
                        </div>
                    ) : isMobile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {filteredPresent.map((a, idx) => (
                                <div key={idx} className="glass-panel" style={{
                                    padding: '1rem',
                                    background: 'rgba(15, 23, 42, 0.4)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    borderRadius: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>
                                                {a.responses?.studentName || 'Member'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: '0.15rem' }}>
                                                {a.studentRegNo}
                                            </div>
                                        </div>
                                        <span style={{
                                            background: a.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.08)' : a.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(37, 170, 225, 0.08)',
                                            color: a.memberType === 'Recruit' ? '#a78bfa' : a.memberType === 'Visitor' ? '#facc15' : '#25AAE1',
                                            border: `1px solid ${a.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.15)' : a.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(37, 170, 225, 0.15)'}`,
                                            fontSize: '0.6rem',
                                            fontWeight: 900,
                                            padding: '0.2rem 0.45rem',
                                            borderRadius: '0.4rem',
                                            textTransform: 'uppercase'
                                        }}>
                                            {a.memberType}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} /> {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveCheckIn(a._id, a.studentRegNo, a.responses?.studentName)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.12)',
                                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                                borderRadius: '8px',
                                                color: '#f87171',
                                                padding: '0.45rem 0.75rem',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <Trash2 size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }} className="glass-panel">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 800, opacity: 0.5, width: '30%' }}>MEMBER NAME</th>
                                        <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 800, opacity: 0.5, width: '25%' }}>ADMISSION NUMBER</th>
                                        <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 800, opacity: 0.5, width: '15%' }}>REGISTRY ROLE</th>
                                        <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 800, opacity: 0.5, width: '20%' }}>SCAN TIME</th>
                                        <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 800, opacity: 0.5, width: '10%', textAlign: 'right' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPresent.map((a, idx) => (
                                        <tr key={idx} style={{ 
                                            borderBottom: '1px solid rgba(255,255,255,0.03)', 
                                            transition: '0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '1.15rem 1rem', fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>
                                                {a.responses?.studentName || 'Member'}
                                            </td>
                                            <td style={{ padding: '1.15rem 1rem', fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                {a.studentRegNo}
                                            </td>
                                            <td style={{ padding: '1.15rem 1rem', fontSize: '0.8rem' }}>
                                                <span style={{ 
                                                    background: a.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.08)' : a.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(37, 170, 225, 0.08)', 
                                                    color: a.memberType === 'Recruit' ? '#a78bfa' : a.memberType === 'Visitor' ? '#facc15' : '#25AAE1', 
                                                    border: `1px solid ${a.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.15)' : a.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(37, 170, 225, 0.15)'}`,
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 900, 
                                                    padding: '0.25rem 0.5rem', 
                                                    borderRadius: '6px',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {a.memberType}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.15rem 1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                                                {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </td>
                                            <td style={{ padding: '1.15rem 1rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleRemoveCheckIn(a._id, a.studentRegNo, a.responses?.studentName)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.12)',
                                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                                        borderRadius: '8px',
                                                        color: '#f87171',
                                                        padding: '0.45rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.color = '#f87171'; }}
                                                    title="Remove Attendance Record"
                                                >
                                                    <Trash2 size={13} />
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

            {/* 4. Missed Registry List */}
            {activeTab === 'absent' && (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {filteredAbsent.length === 0 ? (
                        <div style={{ 
                            padding: '5rem 2rem', 
                            textAlign: 'center', 
                            background: 'rgba(255,255,255,0.01)', 
                            borderRadius: '1.5rem', 
                            border: '1px dashed rgba(255,255,255,0.06)' 
                        }}>
                            <Users size={40} color="#4ade80" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 6px rgba(74, 222, 128, 0.3))' }} />
                            <h4 style={{ margin: 0, color: '#4ade80', fontSize: '1.1rem', fontWeight: 700 }}>100% Attendance Achieved!</h4>
                            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', opacity: 0.5 }}>
                                {insightSearch ? 'Nobody matching your search was found in the missed list.' : 'Every registered campus member shows up. Absolutely outstanding!'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '0.75rem' : '1.25rem' }}>
                            {filteredAbsent.map(m => (
                                <div key={m._id} className="glass-panel" style={{
                                    padding: isMobile ? '1rem' : '1.25rem',
                                    background: 'rgba(239, 68, 68, 0.01)',
                                    border: '1px solid rgba(239, 68, 68, 0.06)',
                                    borderRadius: '1.25rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.06)'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{m.name}</div>
                                        <div style={{ fontSize: '0.72rem', opacity: 0.5, fontWeight: 700, marginTop: '0.15rem' }}>{m.studentRegNo}</div>
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <span style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                color: '#f87171',
                                                border: '1px solid rgba(248, 113, 113, 0.15)',
                                                fontSize: '0.6rem',
                                                fontWeight: 900,
                                                padding: '0.2rem 0.45rem',
                                                borderRadius: '0.4rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {m.memberType}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSingleCheckIn(m.studentRegNo, m.name)}
                                        className="btn btn-primary"
                                        style={{
                                            padding: '0.5rem 0.85rem',
                                            background: '#25AAE1',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            borderRadius: '0.65rem',
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 10px rgba(37, 170, 225, 0.2)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1d93c4'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(29, 147, 196, 0.35)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#25AAE1'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(37, 170, 225, 0.2)'; }}
                                    >
                                        CHECK IN
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 5. 3-Day Ticker Tab */}
            {isTraining && activeTab === 'ticker' && (() => {
                const toCheckIn = filteredMembers.filter(m =>
                    !attendanceRecords.some(a =>
                        String(a.studentRegNo).trim().toUpperCase() === String(m.studentRegNo).trim().toUpperCase() &&
                        (a.trainingDay || 1) === selectedDay
                    )
                );
                const checkedIn = filteredMembers.filter(m =>
                    attendanceRecords.some(a =>
                        String(a.studentRegNo).trim().toUpperCase() === String(m.studentRegNo).trim().toUpperCase() &&
                        (a.trainingDay || 1) === selectedDay
                    )
                );

                const renderTrainingCard = (m, isPresent) => {
                    const record = attendanceRecords.find(a =>
                        String(a.studentRegNo).trim().toUpperCase() === String(m.studentRegNo).trim().toUpperCase() &&
                        (a.trainingDay || 1) === selectedDay
                    );
                    const isToggling = togglingRegDay === `${m.studentRegNo}_${selectedDay}`;
                    return (
                        <div key={m._id || m.studentRegNo} style={{
                            padding: isMobile ? '0.9rem 1rem' : '0.85rem 1.25rem',
                            background: isPresent ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255,255,255,0.01)',
                            border: `1px solid ${isPresent ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.04)'}`,
                            borderRadius: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                    background: isPresent ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isPresent ? '#34d399' : 'rgba(255,255,255,0.3)',
                                    fontSize: '0.85rem', fontWeight: 900
                                }}>
                                    {isPresent ? '✓' : (m.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {m.name || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                                        {m.studentRegNo}
                                        {isPresent && record && (
                                            <span style={{ marginLeft: '0.5rem', color: '#34d399', fontSize: '0.62rem' }}>
                                                • {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <span style={{
                                    background: m.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.08)' : m.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(37, 170, 225, 0.08)',
                                    color: m.memberType === 'Recruit' ? '#a78bfa' : m.memberType === 'Visitor' ? '#facc15' : '#25AAE1',
                                    border: `1px solid ${m.memberType === 'Recruit' ? 'rgba(139, 92, 246, 0.15)' : m.memberType === 'Visitor' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(37, 170, 225, 0.15)'}`,
                                    fontSize: '0.58rem', fontWeight: 900, padding: '0.15rem 0.4rem',
                                    borderRadius: '0.35rem', textTransform: 'uppercase'
                                }}>{m.memberType}</span>
                                <button
                                    onClick={() => handleToggleDay(m, selectedDay)}
                                    disabled={isToggling}
                                    style={{
                                        padding: '0.45rem 0.85rem',
                                        background: isPresent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 170, 225, 0.15)',
                                        border: isPresent ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(37, 170, 225, 0.3)',
                                        borderRadius: '0.6rem',
                                        color: isPresent ? '#f87171' : '#25AAE1',
                                        fontWeight: 800, fontSize: '0.72rem',
                                        cursor: isToggling ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        transition: 'all 0.2s', whiteSpace: 'nowrap'
                                    }}
                                >
                                    {isToggling ? (
                                        <div className="loading-spinner-small" style={{ width: '12px', height: '12px', borderTopColor: 'currentColor' }} />
                                    ) : isPresent ? (
                                        <><span>✕</span> Remove</>
                                    ) : (
                                        <><span>+</span> Day {selectedDay}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                };

                return (
                    <div style={{ animation: 'fadeIn 0.4s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {filteredMembers.length === 0 ? (
                            <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '1.5rem', border: '1px dashed rgba(255,255,255,0.06)' }}>
                                <Search size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>No members found</h4>
                                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', opacity: 0.5 }}>Try adjusting your search.</p>
                            </div>
                        ) : (
                            <>
                                {/* TO CHECK IN - Day N */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>To Check In — Day {selectedDay}</div>
                                        <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{toCheckIn.length}</span>
                                    </div>
                                    {toCheckIn.length === 0 ? (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(52, 211, 153, 0.03)', border: '1px dashed rgba(52, 211, 153, 0.15)', borderRadius: '1rem' }}>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>✓ All members checked in for Day {selectedDay}!</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {toCheckIn.map(m => renderTrainingCard(m, false))}
                                        </div>
                                    )}
                                </div>

                                {/* CHECKED IN - Day N */}
                                {checkedIn.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Checked In — Day {selectedDay}</div>
                                            <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{checkedIn.length}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {checkedIn.map(m => renderTrainingCard(m, true))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

export default MeetingInsights;

