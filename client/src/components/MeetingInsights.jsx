/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import {
    BarChart3, Activity, Users, Search, X, ShieldAlert as Ghost
} from 'lucide-react';

const MeetingInsights = ({ meeting, onClose, api, onQuickCheckIn }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [insightSearch, setInsightSearch] = useState('');

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
        return cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch);
    });

    return (
        <div className="glass-panel" style={{
            padding: '2.5rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(124, 58, 237, 0.5)',
            animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(124, 58, 237, 0.15)', borderRadius: '1rem' }}>
                            <BarChart3 size={32} color="hsl(var(--color-primary))" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 950, letterSpacing: '-1px', color: 'white' }}>Meeting Insights</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                                {meeting.name} • {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="btn"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '1px'
                    }}
                >
                    EXIT ANALYSIS
                </button>
            </div>

            {/* Smart Search Bar */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                        placeholder="Live filter missed members or participants by name or admission number..."
                        value={insightSearch}
                        onChange={e => setInsightSearch(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '1rem 1.5rem 1rem 3.5rem',
                            borderRadius: '1.25rem',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
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
                                color: 'rgba(255,255,255,0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '1rem' }}>PRESENCE</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: '#25AAE1', lineHeight: 1 }}>{stats.presentCount}</div>
                        <div style={{ fontSize: '1rem', opacity: 0.4, fontWeight: 700 }}>/ {stats.totalEligible}</div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(37, 170, 225, 0.8)', marginTop: '0.75rem', fontWeight: 600 }}>{stats.recruitsCount} First Timers (Recruits)</div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                        <Users size={80} />
                    </div>
                </div>

                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '1rem' }}>REACH RATE</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: '#4ade80', lineHeight: 1 }}>{rate}%</div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '1.25rem', overflow: 'hidden' }}>
                        <div style={{ width: `${rate}%`, height: '100%', background: '#4ade80', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                    </div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                        <Activity size={80} />
                    </div>
                </div>

                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '1rem' }}>ATTRITION</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 1000, color: '#f87171', lineHeight: 1 }}>{stats.absentCount}</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(248, 113, 113, 0.8)', marginTop: '0.75rem', fontWeight: 600 }}>Members did not attend</div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                        <Ghost size={80} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Ghost size={20} color="#f87171" />
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>MISSED MEMBERS ({filteredAbsent.length})</h4>
                        </div>
                    </div>
                    <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.75rem' }}>
                        {filteredAbsent.length === 0 ? (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{insightSearch ? '🔍' : '🏆'}</div>
                                <h3 style={{ margin: 0, color: insightSearch ? 'white' : '#4ade80' }}>{insightSearch ? 'No matches found' : '100% Attendance!'}</h3>
                                <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>{insightSearch ? `Nobody matching "${insightSearch}" was found in the missed list.` : 'Every registered member shows up. Outstanding!'}</p>
                            </div>
                        ) : filteredAbsent.map(m => (
                            <div key={m._id} style={{
                                padding: '1.25rem',
                                background: 'rgba(239, 68, 68, 0.04)',
                                border: '1px solid rgba(239, 68, 68, 0.1)',
                                borderRadius: '1.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700 }}>{m.studentRegNo}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        fontSize: '0.65rem',
                                        padding: '0.4rem 0.75rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '2rem',
                                        fontWeight: 900,
                                        color: '#f87171',
                                        border: '1px solid rgba(248, 113, 113, 0.2)'
                                    }}>{m.memberType.toUpperCase()}</div>
                                    <button
                                        onClick={() => onQuickCheckIn && onQuickCheckIn(meeting._id, m.studentRegNo)}
                                        className="btn"
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            background: '#25AAE1',
                                            color: 'white',
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            borderRadius: '0.5rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        CHECK IN
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Users size={20} color="#4ade80" />
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>PARTICIPANTS ({filteredPresent.length})</h4>
                        </div>
                    </div>
                    <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.75rem' }}>
                        {filteredPresent.length === 0 ? (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{insightSearch ? '🔍' : '⏳'}</div>
                                <h3 style={{ margin: 0, color: 'white' }}>{insightSearch ? 'No matches found' : 'No participants yet'}</h3>
                                <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>{insightSearch ? `Nobody matching "${insightSearch}" was found in participants.` : 'Waiting for members to check in...'}</p>
                            </div>
                        ) : filteredPresent.map(a => (
                            <div key={a._id} style={{
                                padding: '1.25rem',
                                background: 'rgba(74, 222, 128, 0.04)',
                                border: '1px solid rgba(74, 222, 128, 0.1)',
                                borderRadius: '1.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white' }}>{a.responses?.studentName || 'Member'}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700 }}>{a.studentRegNo}</div>
                                </div>
                                <div style={{
                                    fontSize: '0.65rem',
                                    padding: '0.4rem 0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '2rem',
                                    fontWeight: 900,
                                    color: '#4ade80',
                                    border: '1px solid rgba(74, 222, 128, 0.2)'
                                }}>{(a.memberType || 'Member').toUpperCase()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div >
        </div >
    );
};
export default MeetingInsights;
