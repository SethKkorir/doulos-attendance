import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Trash2, Tag, Clock } from 'lucide-react';

const typeColors = {
    Meeting:  { color: '#25AAE1', bg: 'rgba(37,170,225,0.12)',  border: 'rgba(37,170,225,0.25)' },
    Training: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
    Retreat:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.25)' },
    Outbound: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)' },
    Other:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)' },
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

    const inputStyle = {
        width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(29,166,217,0.15)', borderRadius: '0.6rem',
        color: 'white', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box',
        transition: 'border-color 0.2s'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s' }}>

            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(29,166,217,0.08) 0%, rgba(2,21,37,0.9) 100%)',
                backdropFilter: 'blur(20px)', borderRadius: '1.25rem',
                border: '1px solid rgba(29,166,217,0.18)', padding: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(29,166,217,0.15)', borderRadius: '1rem', border: '1px solid rgba(29,166,217,0.25)' }}>
                            <Calendar size={26} color="#1da6d9" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1da6d9', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>FLOW OF EVENTS</div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>Doulos Events</h2>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>{events.length} event{events.length !== 1 ? 's' : ''} scheduled</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                            background: showCreate ? 'rgba(248,113,113,0.15)' : 'linear-gradient(135deg, #1da6d9 0%, #0a4d68 100%)',
                            color: showCreate ? '#f87171' : 'white',
                            border: showCreate ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(29,166,217,0.4)',
                            borderRadius: '0.6rem', fontWeight: 700, cursor: 'pointer',
                            boxShadow: showCreate ? 'none' : '0 4px 15px rgba(29,166,217,0.25)',
                            transition: 'all 0.25s'
                        }}
                    >
                        <Plus size={18} style={{ transform: showCreate ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                        {showCreate ? 'Cancel' : 'New Event'}
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(9,29,46,0.85) 0%, rgba(2,21,37,0.95) 100%)',
                    backdropFilter: 'blur(20px)', borderRadius: '1.25rem',
                    border: '1px solid rgba(29,166,217,0.2)', padding: '2rem',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1da6d9', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                        — NEW EVENT DETAILS
                    </div>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Event Title</label>
                            <input style={inputStyle} placeholder="e.g. Sunday Encounter" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</label>
                            <input style={inputStyle} type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</label>
                            <input style={inputStyle} type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Location</label>
                            <input style={inputStyle} placeholder="e.g. Athi River" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Type</label>
                            <select style={inputStyle} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="Meeting">Meeting</option>
                                <option value="Training">Training</option>
                                <option value="Retreat">Retreat</option>
                                <option value="Outbound">Outbound</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Semester</label>
                            <input style={inputStyle} placeholder="e.g. MAY-AUG 2026" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} required />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <button type="submit" style={{
                                width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #1da6d9 0%, #0a4d68 100%)',
                                color: 'white', border: '1px solid rgba(29,166,217,0.4)', borderRadius: '0.6rem',
                                fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.5px',
                                boxShadow: '0 4px 15px rgba(29,166,217,0.2)', transition: 'all 0.2s'
                            }}>
                                CREATE EVENT
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Events Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>Loading events...</div>
            ) : events.length === 0 ? (
                <div style={{
                    background: 'rgba(9,29,46,0.5)', backdropFilter: 'blur(16px)', borderRadius: '1.25rem',
                    border: '1px dashed rgba(29,166,217,0.2)', padding: '4rem', textAlign: 'center'
                }}>
                    <Calendar size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.5 }}>No events scheduled yet</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.35, marginTop: '0.5rem' }}>Click "New Event" to add one</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {events.map(e => {
                        const tc = typeColors[e.type] || typeColors.Other;
                        const dateObj = new Date(e.date);
                        return (
                            <div key={e._id} style={{
                                background: 'linear-gradient(135deg, rgba(9,29,46,0.75) 0%, rgba(2,21,37,0.85) 100%)',
                                backdropFilter: 'blur(16px)', borderRadius: '1.25rem',
                                border: `1px solid ${tc.border}`, padding: '1.5rem',
                                transition: 'all 0.25s', position: 'relative', overflow: 'hidden'
                            }}
                                onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-3px)'; el.currentTarget.style.boxShadow = `0 12px 30px ${tc.bg}`; }}
                                onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; el.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Glow accent */}
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: tc.bg, borderRadius: '50%', filter: 'blur(20px)', opacity: 0.6 }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', position: 'relative' }}>
                                    {/* Date badge */}
                                    <div style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: '0.75rem', padding: '0.5rem 0.75rem', textAlign: 'center', minWidth: '52px' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: tc.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {dateObj.toLocaleString('en', { month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                                            {dateObj.getDate()}
                                        </div>
                                    </div>
                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(e._id)}
                                        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '0.5rem', padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#f87171', transition: 'all 0.2s' }}
                                        onMouseEnter={el => el.currentTarget.style.background = 'rgba(248,113,113,0.18)'}
                                        onMouseLeave={el => el.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800, lineHeight: 1.3 }}>{e.title}</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                                        <Clock size={13} color={tc.color} /> {e.time}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                                        <MapPin size={13} color={tc.color} /> {e.location}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <span style={{ padding: '0.25rem 0.7rem', borderRadius: '2rem', fontSize: '0.68rem', fontWeight: 800, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {e.type}
                                    </span>
                                    {e.semester && (
                                        <span style={{ padding: '0.25rem 0.7rem', borderRadius: '2rem', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
