import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Trash2, Edit } from 'lucide-react';

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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Doulos Flow of Events</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Event
                </button>
            </div>

            {showCreate && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid hsl(var(--color-primary))' }}>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input className="input-field" placeholder="Event Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                        <input className="input-field" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        <input className="input-field" type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                        <input className="input-field" placeholder="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                        <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                            <option value="Meeting">Meeting</option>
                            <option value="Training">Training</option>
                            <option value="Retreat">Retreat</option>
                            <option value="Outbound">Outbound</option>
                            <option value="Other">Other</option>
                        </select>
                        <input className="input-field" placeholder="Semester (e.g. MAY-AUG 2026)" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} required />
                        <button type="submit" className="btn btn-primary" style={{ gridColumn: '1/-1' }}>Create Event</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {loading ? <p>Loading...</p> : events.map(e => (
                    <div key={e._id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ margin: 0 }}>{e.title}</h3>
                        <p style={{ margin: '0.5rem 0', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                            <Calendar size={14} style={{ display: 'inline', marginRight: '0.2rem' }} /> 
                            {new Date(e.date).toLocaleDateString()} at {e.time}
                        </p>
                        <p style={{ margin: 0, color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                            <MapPin size={14} style={{ display: 'inline', marginRight: '0.2rem' }} /> 
                            {e.location}
                        </p>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', fontSize: '0.8rem' }}>{e.type}</span>
                            <div style={{ flex: 1 }}></div>
                            <button className="btn" style={{ padding: '0.3rem', color: '#ef4444' }} onClick={() => handleDelete(e._id)}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventsManager;
