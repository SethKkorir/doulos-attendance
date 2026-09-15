import React, { useState, useEffect } from 'react';
import { 
    Calendar, Clock, MapPin, Users, Plus, Trash2, Edit3, 
    Download, Printer, Share2, Check, X, AlertCircle, 
    Sparkles, Compass, Shield, CheckCircle2, RefreshCw, Settings
} from 'lucide-react';

const CampScheduleStudio = ({ api, campus = 'Both', cadres = [], meetings = [], showToast = () => {} }) => {
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeDay, setActiveDay] = useState('All'); // 'All' | 'Friday' | 'Saturday' | 'Sunday'
    
    // Modal states for adding/editing activity
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [modalForm, setModalForm] = useState({
        day: 'Friday',
        startTime: '08:30',
        endTime: '10:00',
        activity: '',
        location: '',
        facilitators: [],
        notes: ''
    });

    // Temp input for facilitator chip
    const [facilitatorInput, setFacilitatorInput] = useState('');

    // Modal state for editing Camp Metadata (Title, Theme, Semester, Dates)
    const [showMetaModal, setShowMetaModal] = useState(false);
    const [metaForm, setMetaForm] = useState({
        title: '',
        theme: '',
        semester: '',
        campus: 'Both',
        startDate: '',
        endDate: ''
    });

    const fetchProgram = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/trainings/camp-program?campus=${campus}`);
            setProgram(res.data);
        } catch (err) {
            console.error('Error fetching camp program:', err);
            showToast('Failed to load camp schedule from database', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgram();
    }, [campus]);

    // Locations dynamically aggregated from the database
    const dbLocations = Array.from(new Set([
        ...(program?.schedule || []).map(s => s.location),
        ...(program?.dutyRoster || []).map(d => d.location),
        ...meetings.map(m => m.location?.name || m.venue)
    ].map(l => (l || '').trim()).filter(Boolean)));

    // Facilitators dynamically aggregated from database cadres & past assignments
    const dbFacilitators = Array.from(new Set([
        ...cadres.map(c => c.name).filter(Boolean),
        ...(program?.schedule || []).flatMap(s => Array.isArray(s.facilitators) ? s.facilitators : [s.leadFacilitator]).filter(Boolean)
    ].map(f => (f || '').trim()).filter(Boolean)));

    const handleSaveProgram = async (updatedProgram) => {
        setSaving(true);
        try {
            const res = await api.post('/trainings/camp-program', updatedProgram);
            setProgram(res.data.program);
            showToast('Camp schedule saved to database', 'success');
        } catch (err) {
            console.error('Error saving program:', err);
            showToast(err.response?.data?.message || 'Failed to save to database', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Open Modal for Add Activity
    const handleOpenAdd = (defaultDay = 'Friday') => {
        setModalForm({
            day: activeDay === 'All' ? defaultDay : activeDay,
            startTime: '08:00',
            endTime: '09:30',
            activity: '',
            location: dbLocations[0] || '',
            facilitators: [],
            notes: ''
        });
        setFacilitatorInput('');
        setEditingIndex(null);
        setShowModal(true);
    };

    // Open Modal for Edit Activity
    const handleOpenEdit = (item, index) => {
        const itemFacilitators = Array.isArray(item.facilitators) && item.facilitators.length > 0
            ? [...item.facilitators]
            : (item.leadFacilitator ? [item.leadFacilitator] : []);

        const timeParts = (item.time || '').split('-').map(t => t.trim());
        const startTime = timeParts[0] || '08:00';
        const endTime = timeParts[1] || '';

        setModalForm({
            day: item.day || 'Friday',
            startTime,
            endTime,
            activity: item.activity || '',
            location: item.location || '',
            facilitators: itemFacilitators,
            notes: item.notes || ''
        });
        setFacilitatorInput('');
        setEditingIndex(index);
        setShowModal(true);
    };

    // Open Modal for Editing Camp Details
    const handleOpenMetaModal = () => {
        if (!program) return;
        setMetaForm({
            title: program.title || '',
            theme: program.theme || '',
            semester: program.semester || '',
            campus: program.campus || campus,
            startDate: program.startDate ? new Date(program.startDate).toISOString().split('T')[0] : '',
            endDate: program.endDate ? new Date(program.endDate).toISOString().split('T')[0] : ''
        });
        setShowMetaModal(true);
    };

    // Save Camp Metadata
    const handleSaveMeta = (e) => {
        if (e) e.preventDefault();
        if (!metaForm.title.trim()) {
            return showToast('Camp title is required', 'error');
        }
        const updated = {
            ...program,
            title: metaForm.title.trim(),
            theme: metaForm.theme.trim(),
            semester: metaForm.semester.trim(),
            campus: metaForm.campus,
            startDate: metaForm.startDate ? new Date(metaForm.startDate) : program.startDate,
            endDate: metaForm.endDate ? new Date(metaForm.endDate) : program.endDate
        };
        setProgram(updated);
        setShowMetaModal(false);
        handleSaveProgram(updated);
    };

    // Add facilitator to chip list
    const handleAddFacilitator = (name) => {
        const trimmed = (name || facilitatorInput).trim();
        if (!trimmed) return;
        if (modalForm.facilitators.includes(trimmed)) {
            showToast(`${trimmed} is already assigned`, 'warning');
            return;
        }
        setModalForm(prev => ({
            ...prev,
            facilitators: [...prev.facilitators, trimmed]
        }));
        setFacilitatorInput('');
    };

    // Remove facilitator from chip list
    const handleRemoveFacilitator = (index) => {
        setModalForm(prev => ({
            ...prev,
            facilitators: prev.facilitators.filter((_, i) => i !== index)
        }));
    };

    // Submit Activity Modal Form
    const handleSaveModal = (e) => {
        if (e) e.preventDefault();
        if (!modalForm.activity.trim()) {
            return showToast('Please enter what is happening (Activity title)', 'error');
        }
        if (!modalForm.startTime.trim()) {
            return showToast('Please enter start time for this session', 'error');
        }

        // Format formatted time string: "08:00 - 09:30" or "08:00"
        const formattedTime = modalForm.endTime.trim() 
            ? `${modalForm.startTime.trim()} - ${modalForm.endTime.trim()}`
            : modalForm.startTime.trim();

        let currentFacilitators = [...modalForm.facilitators];
        if (facilitatorInput.trim() && !currentFacilitators.includes(facilitatorInput.trim())) {
            currentFacilitators.push(facilitatorInput.trim());
        }

        const newActivity = {
            day: modalForm.day,
            time: formattedTime,
            activity: modalForm.activity.trim(),
            location: modalForm.location.trim() || 'Campsite',
            facilitators: currentFacilitators,
            leadFacilitator: currentFacilitators[0] || '',
            notes: modalForm.notes.trim()
        };

        const currentSchedule = [...(program?.schedule || [])];
        if (editingIndex !== null) {
            currentSchedule[editingIndex] = newActivity;
        } else {
            currentSchedule.push(newActivity);
        }

        // Keep sorted by day and time
        const dayOrder = { 'Friday': 1, 'Saturday': 2, 'Sunday': 3 };
        currentSchedule.sort((a, b) => {
            if (dayOrder[a.day] !== dayOrder[b.day]) {
                return (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
            }
            return String(a.time).localeCompare(String(b.time));
        });

        const updated = { ...program, schedule: currentSchedule };
        setProgram(updated);
        setShowModal(false);
        handleSaveProgram(updated);
    };

    // Delete an Activity
    const handleDeleteActivity = (index) => {
        const item = program?.schedule?.[index];
        if (!item) return;
        if (!window.confirm(`Delete "${item.activity}" from ${item.day} schedule?`)) {
            return;
        }
        const updatedSchedule = program.schedule.filter((_, i) => i !== index);
        const updated = { ...program, schedule: updatedSchedule };
        setProgram(updated);
        handleSaveProgram(updated);
    };

    // Filter schedule by activeDay
    const scheduleItems = (program?.schedule || []).map((item, originalIndex) => ({
        ...item,
        originalIndex,
        facilitatorList: Array.isArray(item.facilitators) && item.facilitators.length > 0
            ? item.facilitators
            : (item.leadFacilitator ? [item.leadFacilitator] : [])
    }));

    const filteredItems = activeDay === 'All' 
        ? scheduleItems 
        : scheduleItems.filter(item => item.day === activeDay);

    const fridayCount = scheduleItems.filter(i => i.day === 'Friday').length;
    const saturdayCount = scheduleItems.filter(i => i.day === 'Saturday').length;
    const sundayCount = scheduleItems.filter(i => i.day === 'Sunday').length;

    // 1-Tap PDF Download / Print
    const handleDownloadPDF = () => {
        if (!program) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            return showToast('Pop-up blocked. Please allow pop-ups to download PDF', 'error');
        }

        const renderDayTable = (dayName, dayLabel) => {
            const dayItems = scheduleItems.filter(i => i.day === dayName);
            if (dayItems.length === 0) {
                return `
                    <div style="margin-bottom: 24px;">
                        <h3 style="color: #6B5FA8; margin-bottom: 8px; border-bottom: 2px solid #EAE6F4; padding-bottom: 4px;">${dayLabel}</h3>
                        <p style="color: #888; font-style: italic;">No activities scheduled for this day in the database.</p>
                    </div>
                `;
            }
            return `
                <div style="margin-bottom: 28px;">
                    <div style="background: #EFEBFA; padding: 8px 14px; border-left: 5px solid #6B5FA8; border-radius: 6px; margin-bottom: 12px;">
                        <h3 style="margin: 0; color: #2E2A4D; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">${dayLabel} (${dayItems.length} Sessions)</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
                        <thead>
                            <tr style="background: #FAF9FC; border-bottom: 2px solid #EAE6F4;">
                                <th style="padding: 10px; text-align: left; width: 110px; color: #6B5FA8;">Time</th>
                                <th style="padding: 10px; text-align: left; color: #2E2A4D;">What is Happening</th>
                                <th style="padding: 10px; text-align: left; width: 140px; color: #555;">Location</th>
                                <th style="padding: 10px; text-align: left; width: 180px; color: #E8A33D;">Facilitator(s)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dayItems.map((item, idx) => `
                                <tr style="border-bottom: 1px solid #EAE6F4; background: ${idx % 2 === 0 ? '#FFFFFF' : '#FAF9FC'};">
                                    <td style="padding: 10px; font-weight: bold; color: #6B5FA8; vertical-align: top;">${item.time}</td>
                                    <td style="padding: 10px; vertical-align: top;">
                                        <div style="font-weight: 700; color: #2E2A4D; font-size: 13.5px;">${item.activity}</div>
                                        ${item.notes ? `<div style="font-size: 11.5px; color: #666; margin-top: 3px; font-style: italic;">Note: ${item.notes}</div>` : ''}
                                    </td>
                                    <td style="padding: 10px; color: #444; vertical-align: top;">${item.location || '—'}</td>
                                    <td style="padding: 10px; vertical-align: top;">
                                        ${item.facilitatorList.length > 0 
                                            ? item.facilitatorList.map(f => `<span style="display: inline-block; background: #FDF4E7; border: 1px solid #F5D3A0; color: #8A5300; padding: 2px 7px; border-radius: 999px; font-size: 11px; margin: 2px 2px; font-weight: 600;">👤 ${f}</span>`).join('') 
                                            : '<span style="color: #999; font-style: italic;">Unassigned</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        };

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${program.title || 'Doulos Training Camp Run-Sheet'} — PDF Export</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 15mm 15mm 18mm 15mm;
                    }
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color: #2E2A4D;
                        margin: 0;
                        padding: 10px;
                        background: #FFFFFF;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #6B5FA8;
                        padding-bottom: 16px;
                        margin-bottom: 22px;
                    }
                    .badge {
                        display: inline-block;
                        background: #6B5FA8;
                        color: #FFFFFF;
                        font-size: 11px;
                        font-weight: 800;
                        padding: 3px 10px;
                        border-radius: 999px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 6px;
                    }
                    .title {
                        font-size: 24px;
                        font-weight: 800;
                        color: #2E2A4D;
                        margin: 4px 0;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                        background: #FAF9FC;
                        border: 1px solid #EAE6F4;
                        border-radius: 8px;
                        padding: 10px 14px;
                        margin-bottom: 24px;
                        font-size: 12px;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 12px;
                        border-top: 1px solid #EAE6F4;
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #7E7A9B;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <span class="badge">Daystar University Doulos Ministry</span>
                    <h1 class="title">${program.title || 'Wilderness Training Camp'}</h1>
                    ${program.theme ? `<div style="font-size: 13px; color: #6B5FA8; font-weight: 600; margin-top: 4px;">Theme: "${program.theme}"</div>` : ''}
                </div>

                <div class="meta-grid">
                    <div><strong>Semester:</strong> ${program.semester || 'Active'}</div>
                    <div><strong>Campus:</strong> ${program.campus || 'All Campuses'}</div>
                    <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>

                ${renderDayTable('Friday', 'Day 1: Friday')}
                ${renderDayTable('Saturday', 'Day 2: Saturday')}
                ${renderDayTable('Sunday', 'Day 3: Sunday')}

                <div class="footer">
                    <div><strong>Doulos Safety Standard:</strong> Risk management + spiritual leadership.</div>
                    <div>Official Training Camp Run-Sheet</div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    // Share to WhatsApp Formatter
    const handleShareWhatsApp = () => {
        if (!program || scheduleItems.length === 0) return;
        
        let text = `⛺ *${(program.title || 'DOULOS TRAINING CAMP').toUpperCase()}*\n`;
        if (program.theme) text += `📜 _"${program.theme}"_\n\n`;

        ['Friday', 'Saturday', 'Sunday'].forEach(day => {
            const dayItems = scheduleItems.filter(i => i.day === day);
            if (dayItems.length > 0) {
                text += `🗓️ *${day.toUpperCase()} SCHEDULE:*\n`;
                dayItems.forEach(i => {
                    const facilitators = i.facilitatorList.length > 0 ? ` [${i.facilitatorList.join(', ')}]` : '';
                    text += `• *${i.time}* - ${i.activity}${facilitators}${i.location ? ` (@ ${i.location})` : ''}\n`;
                });
                text += `\n`;
            }
        });

        text += `_Daystar Doulos Training Directorate_ 🙏`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* TOP HEADER & ACTION BANNER */}
            <div className="g5-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span className="g5-pill g5-pill-active" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                🏕️ Camp Run-Sheet
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                {program?.semester ? `${program.semester} • ` : ''}{program?.campus || campus}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                                {program?.title || 'Training Camp Schedule'}
                            </h2>
                            <button
                                onClick={handleOpenMetaModal}
                                style={{
                                    background: 'var(--color-border-subtle)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.72rem',
                                    color: 'var(--color-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontWeight: 700
                                }}
                                title="Edit Camp Title, Theme, Semester and Dates in Database"
                            >
                                <Edit3 size={12} /> Edit Details
                            </button>
                        </div>
                        {program?.theme && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                                Theme: "{program.theme}"
                            </div>
                        )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <button 
                            className="g5-btn-secondary" 
                            onClick={handleShareWhatsApp}
                            title="Format and share timetable to WhatsApp leaders group"
                        >
                            <Share2 size={16} /> Share WhatsApp
                        </button>
                        
                        <button 
                            className="g5-btn-secondary" 
                            onClick={handleDownloadPDF}
                            style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', border: '1px solid rgba(107,95,168,0.2)' }}
                            title="1-Tap Download or Print official PDF run-sheet"
                        >
                            <Download size={16} /> Download as PDF
                        </button>

                        <button 
                            className="g5-btn-warm" 
                            onClick={() => handleOpenAdd('Friday')}
                            title="Add a new activity to Friday, Saturday, or Sunday"
                        >
                            <Plus size={16} /> + Add Camp Session
                        </button>
                    </div>
                </div>

                {/* DAY SELECTOR PILLS */}
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                    <button
                        onClick={() => setActiveDay('All')}
                        style={{
                            padding: '0.55rem 1.1rem',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: activeDay === 'All' ? 'var(--color-primary)' : 'var(--color-border)',
                            background: activeDay === 'All' ? 'var(--color-primary)' : '#FFFFFF',
                            color: activeDay === 'All' ? '#FFFFFF' : 'var(--color-text-main)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <span>All 3 Days</span>
                        <span style={{ 
                            background: activeDay === 'All' ? 'rgba(255,255,255,0.25)' : 'var(--color-border-subtle)', 
                            padding: '0.1rem 0.5rem', 
                            borderRadius: '999px',
                            fontSize: '0.72rem'
                        }}>
                            {scheduleItems.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveDay('Friday')}
                        style={{
                            padding: '0.55rem 1.1rem',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: activeDay === 'Friday' ? 'var(--color-primary)' : 'var(--color-border)',
                            background: activeDay === 'Friday' ? 'var(--color-primary)' : '#FFFFFF',
                            color: activeDay === 'Friday' ? '#FFFFFF' : 'var(--color-text-main)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <span>Friday (Day 1)</span>
                        <span style={{ 
                            background: activeDay === 'Friday' ? 'rgba(255,255,255,0.25)' : 'var(--color-border-subtle)', 
                            padding: '0.1rem 0.5rem', 
                            borderRadius: '999px',
                            fontSize: '0.72rem'
                        }}>
                            {fridayCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveDay('Saturday')}
                        style={{
                            padding: '0.55rem 1.1rem',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: activeDay === 'Saturday' ? 'var(--color-primary)' : 'var(--color-border)',
                            background: activeDay === 'Saturday' ? 'var(--color-primary)' : '#FFFFFF',
                            color: activeDay === 'Saturday' ? '#FFFFFF' : 'var(--color-text-main)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <span>Saturday (Day 2)</span>
                        <span style={{ 
                            background: activeDay === 'Saturday' ? 'rgba(255,255,255,0.25)' : 'var(--color-border-subtle)', 
                            padding: '0.1rem 0.5rem', 
                            borderRadius: '999px',
                            fontSize: '0.72rem'
                        }}>
                            {saturdayCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveDay('Sunday')}
                        style={{
                            padding: '0.55rem 1.1rem',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: activeDay === 'Sunday' ? 'var(--color-primary)' : 'var(--color-border)',
                            background: activeDay === 'Sunday' ? 'var(--color-primary)' : '#FFFFFF',
                            color: activeDay === 'Sunday' ? '#FFFFFF' : 'var(--color-text-main)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <span>Sunday (Day 3)</span>
                        <span style={{ 
                            background: activeDay === 'Sunday' ? 'rgba(255,255,255,0.25)' : 'var(--color-border-subtle)', 
                            padding: '0.1rem 0.5rem', 
                            borderRadius: '999px',
                            fontSize: '0.72rem'
                        }}>
                            {sundayCount}
                        </span>
                    </button>
                </div>
            </div>

            {/* TIMELINE LIST OF SESSIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                        <RefreshCw size={24} className="g5-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 0.5rem' }} />
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading Camp Schedule from Database...</div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
                        <Compass size={36} style={{ color: 'var(--color-primary)', opacity: 0.4, margin: '0 auto 0.75rem' }} />
                        <h4 style={{ fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
                            No activities scheduled for {activeDay === 'All' ? 'this camp' : activeDay}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                            Add your first activity session with custom timing and facilitator assignments.
                        </p>
                        <button className="g5-btn-warm" onClick={() => handleOpenAdd(activeDay === 'All' ? 'Friday' : activeDay)}>
                            <Plus size={16} /> Add First {activeDay === 'All' ? 'Friday' : activeDay} Session
                        </button>
                    </div>
                ) : (
                    filteredItems.map((item) => {
                        const dayColor = item.day === 'Friday' ? '#6B5FA8' : item.day === 'Saturday' ? '#E8A33D' : '#4CAF7D';
                        return (
                            <div 
                                key={`${item.day}-${item.time}-${item.originalIndex}`}
                                className="g5-card"
                                style={{
                                    padding: '1.15rem 1.35rem',
                                    borderLeft: `5px solid ${dayColor}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '1rem',
                                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    {/* DAY & TIME PILLS */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <span 
                                            style={{ 
                                                fontSize: '0.72rem', 
                                                fontWeight: 800, 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.5px',
                                                padding: '0.2rem 0.65rem',
                                                borderRadius: '999px',
                                                background: item.day === 'Friday' ? 'var(--color-primary-soft)' : item.day === 'Saturday' ? 'var(--color-accent-warm-soft)' : 'var(--color-status-active-soft)',
                                                color: dayColor
                                            }}
                                        >
                                            {item.day}
                                        </span>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-main)', fontWeight: 800, fontSize: '0.9rem' }}>
                                            <Clock size={15} style={{ color: 'var(--color-primary)' }} />
                                            <span>{item.time}</span>
                                        </div>

                                        {item.location && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                                                <MapPin size={14} />
                                                <span>{item.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ACTIVITY TITLE ("WHAT IS HAPPENING") */}
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
                                        {item.activity}
                                    </h3>

                                    {/* NOTES IF PRESENT */}
                                    {item.notes && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '0.65rem' }}>
                                            "{item.notes}"
                                        </p>
                                    )}

                                    {/* FACILITATOR CHIPS (1 OR MANY!) */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Users size={13} /> Facilitators ({item.facilitatorList.length}):
                                        </span>

                                        {item.facilitatorList.length === 0 ? (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                None assigned yet
                                            </span>
                                        ) : (
                                            item.facilitatorList.map((fac, fIdx) => (
                                                <span 
                                                    key={fIdx}
                                                    style={{
                                                        background: 'var(--color-page-bg)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '999px',
                                                        padding: '0.2rem 0.65rem',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 700,
                                                        color: 'var(--color-text-main)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem'
                                                    }}
                                                >
                                                    <span style={{ 
                                                        width: '18px', 
                                                        height: '18px', 
                                                        borderRadius: '50%', 
                                                        background: 'var(--color-accent-warm)', 
                                                        color: '#FFFFFF',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {fac.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span>{fac}</span>
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* EDIT / DELETE ACTION BUTTONS */}
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button 
                                        onClick={() => handleOpenEdit(item, item.originalIndex)}
                                        style={{
                                            background: 'var(--color-page-bg)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            padding: '0.4rem 0.55rem',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'background 0.15s ease'
                                        }}
                                        title="Edit this activity"
                                    >
                                        <Edit3 size={15} />
                                    </button>

                                    <button 
                                        onClick={() => handleDeleteActivity(item.originalIndex)}
                                        style={{
                                            background: 'var(--color-status-inactive-soft)',
                                            border: '1px solid rgba(224,122,109,0.2)',
                                            borderRadius: '8px',
                                            padding: '0.4rem 0.55rem',
                                            color: 'var(--color-status-inactive)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'background 0.15s ease'
                                        }}
                                        title="Delete activity"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ========================================================= */}
            {/* EASY-TO-MAKE ADD / EDIT ACTIVITY MODAL */}
            {/* ========================================================= */}
            {showModal && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(46, 42, 77, 0.45)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1.25rem'
                    }}
                >
                    <div 
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '24px',
                            boxShadow: '0 20px 48px rgba(107, 95, 168, 0.2)',
                            width: '100%',
                            maxWidth: '640px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '2rem'
                        }}
                    >
                        {/* MODAL HEADER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                            <div>
                                <span className="g5-pill g5-pill-recruit" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                    {editingIndex !== null ? 'Modify Activity' : 'New Camp Session'}
                                </span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.35rem' }}>
                                    {editingIndex !== null ? 'Edit Schedule Activity' : 'Schedule a Camp Activity'}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'var(--color-border-subtle)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* 1. SELECT DAY: FRIDAY, SATURDAY, SUNDAY */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                    1. Select Camp Day *
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    {[
                                        { day: 'Friday', label: 'Friday', sub: 'Day 1' },
                                        { day: 'Saturday', label: 'Saturday', sub: 'Day 2' },
                                        { day: 'Sunday', label: 'Sunday', sub: 'Day 3' }
                                    ].map(d => {
                                        const isSelected = modalForm.day === d.day;
                                        return (
                                            <div
                                                key={d.day}
                                                onClick={() => setModalForm(prev => ({ ...prev, day: d.day }))}
                                                style={{
                                                    padding: '0.85rem',
                                                    borderRadius: '14px',
                                                    border: '2px solid',
                                                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                                                    background: isSelected ? 'var(--color-primary-soft)' : '#FFFFFF',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                                                    {d.label}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                    {d.sub}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. TIME INPUTS */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
                                    2. Time Interval *
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Start Time</span>
                                        <input
                                            type="time"
                                            className="g5-input"
                                            value={modalForm.startTime}
                                            onChange={(e) => setModalForm(prev => ({ ...prev, startTime: e.target.value }))}
                                            required
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>End Time (Optional)</span>
                                        <input
                                            type="time"
                                            className="g5-input"
                                            value={modalForm.endTime}
                                            onChange={(e) => setModalForm(prev => ({ ...prev, endTime: e.target.value }))}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. WHAT IS HAPPENING (ACTIVITY) */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
                                    3. What is happening? (Activity Title) *
                                </label>
                                <input
                                    type="text"
                                    className="g5-input"
                                    value={modalForm.activity}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, activity: e.target.value }))}
                                    placeholder="e.g. High Ropes Mastery, Campfire & Devotionals, Drill Practice"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* 4. FACILITATORS: CAN BE 1 OR MANY! */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                                        4. Facilitator Names (Can be 1 or many)
                                    </label>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                        {modalForm.facilitators.length} assigned
                                    </span>
                                </div>

                                {/* CHIPS DISPLAY */}
                                <div 
                                    style={{
                                        minHeight: '44px',
                                        padding: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '12px',
                                        background: 'var(--color-page-bg)',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.45rem',
                                        alignItems: 'center',
                                        marginBottom: '0.5rem'
                                    }}
                                >
                                    {modalForm.facilitators.length === 0 ? (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                                            No facilitators added yet. Type a name or tap database members below.
                                        </span>
                                    ) : (
                                        modalForm.facilitators.map((fac, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    background: '#FFFFFF',
                                                    border: '1px solid var(--color-primary)',
                                                    borderRadius: '999px',
                                                    padding: '0.25rem 0.75rem',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 700,
                                                    color: 'var(--color-primary)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    boxShadow: '0 2px 6px rgba(107, 95, 168, 0.08)'
                                                }}
                                            >
                                                <span>👤 {fac}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFacilitator(idx)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--color-status-inactive)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: 0
                                                    }}
                                                >
                                                    <X size={13} />
                                                </button>
                                            </span>
                                        ))
                                    )}
                                </div>

                                {/* TYPE AND ADD INPUT */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                                    <input
                                        type="text"
                                        className="g5-input"
                                        value={facilitatorInput}
                                        onChange={(e) => setFacilitatorInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddFacilitator();
                                            }
                                        }}
                                        placeholder="Type facilitator name and press Enter..."
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        className="g5-btn-secondary"
                                        onClick={() => handleAddFacilitator()}
                                        style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                                    >
                                        + Add Name
                                    </button>
                                </div>

                                {/* DATABASE CADRES / MEMBERS SUGGESTIONS */}
                                {dbFacilitators.length > 0 && (
                                    <div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                            ⚡ Select from Database Cadres & Leaders:
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
                                            {dbFacilitators.map((sug, sIdx) => {
                                                const isAdded = modalForm.facilitators.includes(sug);
                                                return (
                                                    <button
                                                        key={sIdx}
                                                        type="button"
                                                        disabled={isAdded}
                                                        onClick={() => handleAddFacilitator(sug)}
                                                        style={{
                                                            background: isAdded ? 'var(--color-border-subtle)' : '#FFFFFF',
                                                            color: isAdded ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: '999px',
                                                            padding: '0.2rem 0.6rem',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 600,
                                                            cursor: isAdded ? 'default' : 'pointer',
                                                            opacity: isAdded ? 0.6 : 1
                                                        }}
                                                    >
                                                        {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 5. LOCATION & SPECIAL NOTES */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
                                        5. Location / Venue
                                    </label>
                                    <input
                                        type="text"
                                        className="g5-input"
                                        value={modalForm.location}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="Enter location or choose below"
                                        style={{ width: '100%', marginBottom: '0.4rem' }}
                                    />
                                    {dbLocations.length > 0 && (
                                        <select
                                            className="g5-input"
                                            onChange={(e) => {
                                                if (e.target.value) setModalForm(prev => ({ ...prev, location: e.target.value }));
                                            }}
                                            defaultValue=""
                                            style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                                        >
                                            <option value="" disabled>-- Recent Database Locations --</option>
                                            {dbLocations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
                                        6. Special Instructions / Notes
                                    </label>
                                    <textarea
                                        className="g5-input"
                                        rows={3}
                                        value={modalForm.notes}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Special briefing, safety checks, or notes"
                                        style={{ width: '100%', resize: 'none', fontSize: '0.82rem' }}
                                    />
                                </div>
                            </div>

                            {/* MODAL FOOTER BUTTONS */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                                <button
                                    type="button"
                                    className="g5-btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="g5-btn-warm"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : editingIndex !== null ? 'Update Session' : 'Add to Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* EDIT CAMP METADATA MODAL (SAVED TO DB) */}
            {/* ========================================================= */}
            {showMetaModal && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(46, 42, 77, 0.45)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1.25rem'
                    }}
                >
                    <div 
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '24px',
                            boxShadow: '0 20px 48px rgba(107, 95, 168, 0.2)',
                            width: '100%',
                            maxWidth: '560px',
                            padding: '2rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                            <div>
                                <span className="g5-pill g5-pill-active" style={{ fontSize: '0.72rem' }}>Database Configuration</span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.35rem' }}>
                                    Edit Camp Program Details
                                </h3>
                            </div>
                            <button 
                                onClick={() => setShowMetaModal(false)}
                                style={{
                                    background: 'var(--color-border-subtle)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMeta} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                    Camp Title *
                                </label>
                                <input
                                    type="text"
                                    className="g5-input"
                                    value={metaForm.title}
                                    onChange={(e) => setMetaForm(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                    Camp Spiritual Theme
                                </label>
                                <input
                                    type="text"
                                    className="g5-input"
                                    value={metaForm.theme}
                                    onChange={(e) => setMetaForm(prev => ({ ...prev, theme: e.target.value }))}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                        Semester
                                    </label>
                                    <input
                                        type="text"
                                        className="g5-input"
                                        value={metaForm.semester}
                                        onChange={(e) => setMetaForm(prev => ({ ...prev, semester: e.target.value }))}
                                        placeholder="e.g. MAY-AUG 2026"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                        Campus Scope
                                    </label>
                                    <select
                                        className="g5-input"
                                        value={metaForm.campus}
                                        onChange={(e) => setMetaForm(prev => ({ ...prev, campus: e.target.value }))}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Both">Joint (Both Campuses)</option>
                                        <option value="Athi River">Athi River Only</option>
                                        <option value="Valley Road">Valley Road Only</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                        Start Date (Friday)
                                    </label>
                                    <input
                                        type="date"
                                        className="g5-input"
                                        value={metaForm.startDate}
                                        onChange={(e) => setMetaForm(prev => ({ ...prev, startDate: e.target.value }))}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                        End Date (Sunday)
                                    </label>
                                    <input
                                        type="date"
                                        className="g5-input"
                                        value={metaForm.endDate}
                                        onChange={(e) => setMetaForm(prev => ({ ...prev, endDate: e.target.value }))}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                                <button
                                    type="button"
                                    className="g5-btn-secondary"
                                    onClick={() => setShowMetaModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="g5-btn-warm"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save to Database'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampScheduleStudio;
