/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import {
    BarChart3, Activity, Users, Search, X, ShieldAlert as Ghost, Trash2,
    MessageSquare, UserX, Clock, HelpCircle
} from 'lucide-react';

const MeetingInsights = ({ meeting, onClose, api, onQuickCheckIn }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [insightSearch, setInsightSearch] = useState('');
    const [activeTab, setActiveTab] = useState('answers'); // Default to answers first!

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

    const handleRemoveCheckIn = async (recordId, regNo, memberName) => {
        if (!window.confirm(`⚠️ DANGER: Remove check-in for ${memberName || regNo}?\n\nThis will also automatically decrement 10 points from their profile.`)) {
            return;
        }
        try {
            await api.delete(`/attendance/${recordId}`);
            // Update stats state locally
            setStats(prev => {
                if (!prev) return prev;
                // Find the removed participant from the presentList
                const removed = prev.presentList.find(a => a._id === recordId);
                const updatedPresentList = prev.presentList.filter(a => a._id !== recordId);
                
                // Add back to absentList
                let updatedAbsentList = [...prev.absentList];
                if (removed) {
                    const alreadyAbsent = prev.absentList.some(m => String(m.studentRegNo).trim().toUpperCase() === String(regNo).trim().toUpperCase());
                    if (!alreadyAbsent) {
                        const restoredMember = {
                            _id: removed._id || Math.random().toString(),
                            studentRegNo: regNo,
                            name: memberName || 'Member',
                            memberType: removed.memberType || 'Douloid',
                            campus: meeting.campus
                        };
                        updatedAbsentList.push(restoredMember);
                        // Sort alphabetically
                        updatedAbsentList.sort((a, b) => a.name.localeCompare(b.name));
                    }
                }

                // Recalculate recruits count
                const recruitsCount = updatedPresentList.filter(a => a.memberType === 'Recruit').length;

                return {
                    ...prev,
                    presentCount: updatedPresentList.length,
                    absentCount: updatedAbsentList.length,
                    presentList: updatedPresentList,
                    absentList: updatedAbsentList,
                    recruitsCount
                };
            });
        } catch (err) {
            console.error("Failed to delete check-in", err);
            alert(err.response?.data?.message || 'Failed to remove check-in record.');
        }
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
        const cleanSearch = insightSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = m.studentRegNo.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch);
    });

    const filteredPresent = stats.presentList.filter(a => {
        const cleanSearch = insightSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = (a.responses?.studentName || 'Member').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = a.studentRegNo.toLowerCase().replace(/[^a-z0-9]/g, '');
        const answerText = (a.questionOfDay || a.responses?.dailyQuestionAnswer || a.responses?.['dailyQuestionAnswer'] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch) || answerText.includes(cleanSearch);
    });

    return (
        <div className="glass-card-premium" style={{
            padding: '2rem',
            background: '#0d111b',
            borderRadius: '2rem',
            animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.85rem', background: 'rgba(37, 170, 225, 0.12)', borderRadius: '1rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                        <BarChart3 size={28} color="#25AAE1" style={{ filter: 'drop-shadow(0 0 6px rgba(37, 170, 225, 0.4))' }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 950, letterSpacing: '-0.75px', color: 'white' }}>Meeting Insights</h2>
                        <p style={{ color: 'rgba(255,255,255,0.45)', margin: '0.25rem 0 0 0', fontWeight: 700, fontSize: '0.88rem' }}>
                            {meeting.name} • {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                        padding: '0.75rem 1.5rem',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '1px',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                >
                    EXIT ANALYSIS
                </button>
            </div>

            {/* Glowing Question of the Day Callout Header */}
            {meeting.questionOfDay && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(37, 170, 225, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                    border: '1px solid rgba(37, 170, 225, 0.2)',
                    padding: '1.5rem 1.75rem',
                    borderRadius: '1.5rem',
                    marginBottom: '1.75rem',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.68rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        <HelpCircle size={12} /> ACTIVE QUESTION OF THE DAY
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: 'white', lineHeight: '1.55', fontStyle: 'italic', opacity: 0.95 }}>
                        "{meeting.questionOfDay}"
                    </h3>
                </div>
            )}

            {/* Smart Keyword & Registry Search */}
            <div style={{ marginBottom: '1.75rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                        placeholder="Search by student name, admission number, or answer keywords (e.g. faith, grace)..."
                        value={insightSearch}
                        onChange={e => setInsightSearch(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '1rem 1.5rem 1rem 3.5rem',
                            borderRadius: '1.25rem',
                            color: 'white',
                            fontSize: '0.95rem',
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
                                right: '1.25rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Tab Navigation Switcher Bar */}
            <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                borderBottom: '1px solid rgba(255,255,255,0.06)', 
                paddingBottom: '0.75rem', 
                marginBottom: '1.75rem', 
                overflowX: 'auto',
                scrollbarWidth: 'none'
            }}>
                {[
                    { id: 'answers', label: 'Answers Board', icon: MessageSquare, badge: filteredPresent.length },
                    { id: 'analytics', label: 'Analytics & Stats', icon: BarChart3 },
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
                                gap: '0.5rem',
                                padding: '0.65rem 1.25rem',
                                background: isActive ? 'rgba(37, 170, 225, 0.1)' : 'transparent',
                                border: '1px solid',
                                borderColor: isActive ? 'rgba(37, 170, 225, 0.25)' : 'transparent',
                                color: isActive ? '#25AAE1' : 'rgba(255,255,255,0.5)',
                                borderRadius: '0.75rem',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                        >
                            <ActiveIcon size={14} />
                            <span>{tab.label}</span>
                            {tab.badge !== undefined && (
                                <span style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 900,
                                    background: isActive ? '#25AAE1' : 'rgba(255,255,255,0.1)',
                                    color: isActive ? '#0d111b' : 'rgba(255,255,255,0.6)',
                                    padding: '0.1rem 0.45rem',
                                    borderRadius: '0.5rem',
                                    marginLeft: '3px'
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

            {/* 2. Analytics & Stats Tab */}
            {activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.4s ease-out' }}>
                    
                    {/* Visual Stats Widgets Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        
                        {/* Attendance Count Card */}
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Presence Summary</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 1000, color: '#25AAE1', lineHeight: 1 }}>{stats.presentCount}</div>
                                <div style={{ fontSize: '1rem', opacity: 0.4, fontWeight: 700 }}>/ {stats.totalEligible} members</div>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'rgba(37, 170, 225, 0.8)', marginTop: '0.75rem', fontWeight: 700 }}>
                                {stats.recruitsCount} Recruits (First Timers) in session
                            </div>
                            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.04 }}>
                                <Users size={75} color="#25AAE1" />
                            </div>
                        </div>

                        {/* Reach Rate Card */}
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Reach Percent</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 1000, color: '#4ade80', lineHeight: 1 }}>{rate}%</div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
                                <div style={{ width: `${rate}%`, height: '100%', background: 'linear-gradient(90deg, #25AAE1 0%, #4ade80 100%)', borderRadius: '3px', transition: 'width 1s ease-out' }}></div>
                            </div>
                            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.04 }}>
                                <Activity size={75} color="#4ade80" />
                            </div>
                        </div>

                        {/* Absent Count Card */}
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Absent Attrition</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 1000, color: '#f87171', lineHeight: 1 }}>{stats.absentCount}</div>
                            <div style={{ fontSize: '0.82rem', color: 'rgba(248, 113, 113, 0.8)', marginTop: '0.75rem', fontWeight: 700 }}>
                                Members did not scan check-in
                            </div>
                            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.04 }}>
                                <Ghost size={75} color="#f87171" />
                            </div>
                        </div>

                    </div>

                    {/* Member Type Breakdown Summary */}
                    <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', fontWeight: 900, color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Participation Distribution</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                            {['Douloid', 'Recruit', 'Visitor'].map(type => {
                                const count = stats.breakdown[type] || 0;
                                const percent = stats.presentCount ? Math.round((count / stats.presentCount) * 100) : 0;
                                const barColor = type === 'Recruit' ? '#a78bfa' : type === 'Visitor' ? '#facc15' : '#25AAE1';
                                return (
                                    <div key={type} style={{ flex: 1, minWidth: '150px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                                            <span>{type.toUpperCase()}S</span>
                                            <span style={{ color: 'white' }}>{count} ({percent}%)</span>
                                        </div>
                                        <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: barColor, borderRadius: '3px' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {filteredAbsent.map(m => (
                                <div key={m._id} className="glass-panel" style={{
                                    padding: '1.25rem',
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
                                        onClick={() => onQuickCheckIn && onQuickCheckIn(meeting._id, m.studentRegNo)}
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
        </div>
    );
};

export default MeetingInsights;
