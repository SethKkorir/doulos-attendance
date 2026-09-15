import React, { useState, useEffect } from 'react';
import { 
    Heart, Users, Search, AlertTriangle, Phone, 
    CheckCircle2, Clock, MessageSquare, Plus, Check, RefreshCw
} from 'lucide-react';
import defaultApi from '../../api';

const G6WelfareConsole = ({ api, setMsg, isGuest, members }) => {
    const client = api || defaultApi;
    const notify = (msg) => {
        if (typeof setMsg === 'function') setMsg(msg);
        else console.log('[G6Welfare]', msg);
    };

    const [liveData, setLiveData] = useState(null);
    const [absenceRadar, setAbsenceRadar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [manualRegNo, setManualRegNo] = useState('');
    const [manualReason, setManualReason] = useState('Phone battery depleted');
    const [manualCheckinLoading, setManualCheckinLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tickerRes, radarRes] = await Promise.all([
                client.get('/council/welfare/ticker'),
                client.get('/council/welfare/absence-radar')
            ]);
            setLiveData(tickerRes.data);
            setAbsenceRadar(radarRes.data);
        } catch (err) {
            console.error('Error fetching welfare data:', err);
            notify({ type: 'error', text: 'Failed to load Welfare Cockpit data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // 15s refresh for live stream
        return () => clearInterval(interval);
    }, []);

    const handleManualCheckin = async (e) => {
        e.preventDefault();
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        if (!liveData?.activeMeeting) {
            return notify({ type: 'error', text: 'No active meeting session found for today' });
        }
        if (!manualRegNo.trim()) return;

        setManualCheckinLoading(true);
        try {
            const res = await client.post('/council/welfare/manual-checkin', {
                studentRegNo: manualRegNo.trim(),
                meetingId: liveData.activeMeeting._id,
                reason: manualReason
            });
            notify({ type: 'success', text: res.data.message });
            setManualRegNo('');
            fetchData();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Manual check-in failed' });
        } finally {
            setManualCheckinLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* G6 HEADER */}
            <div style={{ 
                background: '#FFFFFF', 
                border: '1px solid #EBEBF2', 
                borderRadius: '16px', 
                padding: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Heart size={18} style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#ef4444' }}>
                            G6 WELFARE & COMMUNITY PULSE
                        </span>
                    </div>
                    <h3 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.3rem' }}>
                        Live Attendance Cockpit & Pastoral Absence Radar
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: "#7E7A9B", fontSize: '0.82rem' }}>
                        Real-time check-in stream, audited dead-phone check-ins, and 2+ week absence care links.
                    </p>
                </div>

                <button onClick={fetchData} className="btn" style={{ background: '#1e293b', color: "#1E1B39", border: '1px solid #EBEBF2', borderRadius: '10px', padding: '0.55rem 0.9rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <RefreshCw size={14} />
                    <span>Refresh Live Feed</span>
                </button>
            </div>

            {/* LIVE MEETING TICKER & MANUAL CHECK-IN ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Live Stream Cockpit */}
                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: liveData?.activeMeeting ? '#10b981' : '#64748b', animation: liveData?.activeMeeting ? 'pulse 2s infinite' : 'none' }}></div>
                            <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem' }}>
                                Live Check-In Stream
                            </h4>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: "#7E7A9B" }}>
                            {liveData?.activeMeeting ? liveData.activeMeeting.name : 'No meeting active right now'}
                        </span>
                    </div>

                    {(liveData?.recentAttendances || []).length === 0 ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', color: "#7E7A9B", fontSize: '0.85rem' }}>
                            Waiting for check-in scans...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {liveData.recentAttendances.map((att, i) => (
                                <div key={i} style={{ background: '#F8F8FC', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.65rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: "#1E1B39", fontWeight: 700, fontSize: '0.88rem' }}>{att.studentName}</div>
                                        <div style={{ fontSize: '0.72rem', color: "#7E7A9B" }}>{att.studentRegNo} • {att.campus}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                            +10 PTS
                                        </span>
                                        <div style={{ fontSize: '0.7rem', color: "#7E7A9B", marginTop: '0.2rem' }}>
                                            {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dead-Phone Audited Manual Check-In Bar */}
                <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Users size={16} style={{ color: '#25AAE1' }} />
                        <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem' }}>
                            Audited Manual Check-In
                        </h4>
                    </div>
                    <p style={{ margin: '0 0 1.25rem 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                        Execute audited manual check-in for members whose phone batteries depleted.
                    </p>

                    <form onSubmit={handleManualCheckin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.3rem' }}>
                                ADMISSION NUMBER (e.g. 24-0123)
                            </label>
                            <input
                                type="text"
                                placeholder="Student Reg No"
                                value={manualRegNo}
                                onChange={(e) => setManualRegNo(e.target.value)}
                                style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.65rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.3rem' }}>
                                AUDIT JUSTIFICATION
                            </label>
                            <select
                                value={manualReason}
                                onChange={(e) => setManualReason(e.target.value)}
                                style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.65rem', borderRadius: '8px' }}
                            >
                                <option value="Phone battery depleted">Phone battery depleted / Off</option>
                                <option value="Device browser camera malfunction">Device camera / browser malfunction</option>
                                <option value="Lost / Damaged phone (Temporary exemption)">Lost / Damaged phone (Temporary exemption)</option>
                                <option value="Verified manual arrival by Welfare Lead">Verified manual arrival by Welfare Lead</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={manualCheckinLoading}
                            className="btn"
                            style={{ background: "#4B3F8C", color: "#FFFFFF", fontWeight: 800, padding: '0.65rem', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
                        >
                            {manualCheckinLoading ? 'Checking In...' : 'Confirm Manual Check-In (+10 Pts)'}
                        </button>
                    </form>
                </div>
            </div>

            {/* 2+ WEEK ABSENCE RADAR ("MISSING IN ACTION" - US-G6-007) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
                            Pastoral Absence Radar ("Missing in Action" 2+ Weeks)
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                            Members who missed 2+ consecutive fellowship meetings, with 1-tap WhatsApp pastoral outreach.
                        </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 800 }}>
                        {absenceRadar?.flaggedCount || 0} Members Flagged
                    </span>
                </div>

                {(absenceRadar?.members || []).length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: "#7E7A9B", fontSize: '0.85rem' }}>
                        ✓ Excellent attendance! No members currently flagged on the 2+ week absence radar.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                        {absenceRadar.members.map((m) => (
                            <div key={m._id} style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '10px', padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ color: "#1E1B39", fontWeight: 800, fontSize: '0.95rem' }}>{m.name}</div>
                                        <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                            {m.consecutiveAbsences || 2} Weeks Missed
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: "#7E7A9B", marginTop: '0.2rem' }}>
                                        {m.studentRegNo} • {m.campus} • Rank: <strong style={{ color: '#fbbf24' }}>{m.douloidRank || 'Recruit'}</strong>
                                    </div>
                                </div>

                                <a
                                    href={m.whatsappLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn"
                                    style={{ background: '#128c7e', color: "#1E1B39", fontWeight: 800, fontSize: '0.75rem', padding: '0.5rem', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                >
                                    <MessageSquare size={14} />
                                    <span>Send WhatsApp Pastoral Care</span>
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default G6WelfareConsole;
