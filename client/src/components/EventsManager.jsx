import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Trash2, Tag, Clock } from 'lucide-react';

const typeColors = {
    Meeting:  { color: '#25AAE1', bg: 'rgba(37,170,225,0.12)',  border: 'rgba(37,170,225,0.2)' },
    Training: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.2)' },
    Retreat:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.2)' },
    Outbound: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.2)' },
    Other:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.15)' },
};

const EventsManager = ({ api, setMsg, isGuest }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        title: 'New Event',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        location: 'Athi River',
        type: 'Meeting',
        semester: 'MAY-AUG 2026',
        description: ''
    });

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/events/admin');
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Creation disabled in Guest Mode.' });
        try {
            await api.post('/events', formData);
            setMsg({ type: 'success', text: 'Event created!' });
            setShowCreate(false);
            fetchEvents();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to create event' });
        }
    };

    const handleDelete = async (id) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            setMsg({ type: 'success', text: 'Event deleted' });
            fetchEvents();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to delete' });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s' }}>

            {/* Header Card */}
            <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(37, 170, 225, 0.12)', borderRadius: '1rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                            <Calendar size={28} color="#25AAE1" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>FLOW OF EVENTS</div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>Doulos Events Schedule</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>{events.length} event{events.length !== 1 ? 's' : ''} currently scheduled</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="btn btn-primary"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                            background: showCreate ? 'rgba(239, 68, 68, 0.1) !important' : 'linear-gradient(135deg, #25AAE1 0%, #175e82 100%) !important',
                            color: showCreate ? '#f87171 !important' : 'white',
                            borderColor: showCreate ? 'rgba(239, 68, 68, 0.25) !important' : 'rgba(37, 170, 225, 0.3) !important',
                            boxShadow: showCreate ? 'none !important' : '0 8px 25px rgba(37, 170, 225, 0.15) !important',
                            fontWeight: 800, cursor: 'pointer', borderRadius: '0.6rem', transition: 'all 0.25s'
                        }}
                    >
                        <Plus size={18} style={{ transform: showCreate ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                        {showCreate ? 'Cancel Form' : 'New Event'}
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="glass-card-premium" style={{
                    background: '#0d111b',
                    padding: '2rem',
                    borderLeft: '4px solid #25AAE1',
                    animation: 'fadeIn 0.35s ease-out',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                        <Plus size={20} color="#25AAE1" />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Create New Event</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Publish a new outbound trip, meeting, or training session</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Title</label>
                            <input className="modern-input" style={{ width: '100%' }} placeholder="e.g. Sunday Encounter / Outbound Retreat" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</label>
                            <input className="modern-input" style={{ width: '100%' }} type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</label>
                            <input className="modern-input" style={{ width: '100%' }} type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location / Venue</label>
                            <input className="modern-input" style={{ width: '100%' }} placeholder="e.g. Athi River Guest House" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
                            <select className="modern-input" style={{ width: '100%' }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="Meeting">Meeting</option>
                                <option value="Training">Training</option>
                                <option value="Retreat">Retreat</option>
                                <option value="Outbound">Outbound</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semester Term</label>
                            <input className="modern-input" style={{ width: '100%' }} placeholder="e.g. MAY-AUG 2026" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} required />
                        </div>
                        <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{
                                width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #25AAE1 0%, #175e82 100%) !important',
                                color: 'white', border: '1px solid rgba(37, 170, 225, 0.3) !important', borderRadius: '0.6rem',
                                fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '1px',
                                boxShadow: '0 8px 25px rgba(37, 170, 225, 0.15) !important', transition: 'all 0.2s'
                            }}>
                                PUBLISH NEW EVENT
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Events Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#25AAE1', borderRadius: '50%' }} />
                    <div>Syncing Events Calendar...</div>
                </div>
            ) : events.length === 0 ? (
                <div className="glass-card-premium" style={{
                    background: '#0d111b', border: '1px dashed rgba(255,255,255,0.06)', padding: '5rem 2rem', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem'
                }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '50%', color: 'rgba(255,255,255,0.15)' }}>
                        <Calendar size={40} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>No Scheduled Events</div>
                        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>The fellowship schedule is currently clear of custom events.</div>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', background: 'rgba(37, 170, 225, 0.08)', color: '#25AAE1', border: '1px solid rgba(37, 170, 225, 0.15)' }}>
                        Publish First Event
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {events.map(e => {
                        const tc = typeColors[e.type] || typeColors.Other;
                        const dateObj = new Date(e.date);
                        return (
                            <div key={e._id} className="glass-card-premium" style={{
                                background: '#0d111b',
                                borderLeft: `4px solid ${tc.color}`,
                                padding: '1.5rem',
                                transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', gap: '1rem'
                            }}
                                onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-3px)'; el.currentTarget.style.boxShadow = `0 12px 30px ${tc.bg}`; }}
                                onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; el.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Glowing Radial Background Accent */}
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle, ${tc.bg} 0%, transparent 70%)`, opacity: 0.6, pointerEvents: 'none' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                                    {/* Date badge */}
                                    <div style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: '0.75rem', padding: '0.5rem 0.75rem', textAlign: 'center', minWidth: '55px' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: tc.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {dateObj.toLocaleString('en', { month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'white', lineHeight: 1.1, marginTop: '2px' }}>
                                            {dateObj.getDate()}
                                        </div>
                                    </div>
                                    
                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDelete(e._id)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.05)',
                                            border: '1px solid rgba(239, 68, 68, 0.15)',
                                            borderRadius: '0.5rem',
                                            padding: '0.45rem 0.6rem',
                                            cursor: 'pointer',
                                            color: '#f87171',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={el => { el.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                                        onMouseLeave={el => { el.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                                        title="Delete Event"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'white', lineHeight: 1.35 }}>{e.title}</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                                            <Clock size={14} style={{ color: tc.color, opacity: 0.8 }} />
                                            <span>{e.time}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                                            <MapPin size={14} style={{ color: tc.color, opacity: 0.8 }} />
                                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{e.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                                    <span style={{ padding: '0.25rem 0.65rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {e.type}
                                    </span>
                                    {e.semester && (
                                        <span style={{ padding: '0.25rem 0.65rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 700, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {e.semester}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @media (max-width: 600px) {
                    form[style*='grid-template-columns'] { grid-template-columns: 1fr !important; }
                    form > div[style*='span 2'] { grid-column: span 1 !important; }
                }
            `}</style>
        </div>
    );
};

export default EventsManager;
