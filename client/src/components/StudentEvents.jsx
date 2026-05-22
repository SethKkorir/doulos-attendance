import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import api from '../api';

const StudentEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/events');
                setEvents(res.data);
            } catch (err) {
                console.error('Failed to fetch events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading events...</div>;

    if (events.length === 0) return (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Calendar size={40} color="var(--color-text-dim)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ margin: 0, color: 'white' }}>No Upcoming Events</h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Check back later for the new schedule.</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0' }}>Flow of Events</h2>
            <div style={{ position: 'relative', paddingLeft: '1rem' }}>
                <div style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
                
                {events.map((e, idx) => (
                    <div key={e._id} style={{ position: 'relative', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                        <div style={{ 
                            position: 'absolute', left: '-5px', top: '5px', width: '12px', height: '12px', 
                            background: 'hsl(var(--color-primary))', borderRadius: '50%', border: '2px solid var(--color-bg)' 
                        }}></div>
                        
                        <div className="glass-panel" style={{ padding: '1.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{e.title}</h3>
                                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(37,170,225,0.1)', color: '#25AAE1', borderRadius: '1rem', fontWeight: 800 }}>
                                    {e.type.toUpperCase()}
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Calendar size={14} /> {new Date(e.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Clock size={14} /> {e.time}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <MapPin size={14} /> {e.location}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentEvents;
