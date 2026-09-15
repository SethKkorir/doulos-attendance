import React, { useState, useEffect } from 'react';
import { 
    Calendar, Clock, MapPin, Users, Shield, AlertTriangle, 
    CheckCircle2, Copy, Printer, Plus, Trash2, Edit3, Save, 
    ChevronRight, Check, AlertCircle, Phone, Compass
} from 'lucide-react';

const CampRunSheetStudio = ({ api, campus, setMsg, isGuest, userRole }) => {
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeDay, setActiveDay] = useState('All');
    const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
    
    // Modal states
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityForm, setActivityForm] = useState({
        day: 'Friday',
        time: '16:00',
        activity: '',
        location: 'Freedom Base HQ',
        leadFacilitator: '',
        notes: ''
    });
    const [editingActivityIndex, setEditingActivityIndex] = useState(null);

    const [showStationModal, setShowStationModal] = useState(false);
    const [stationForm, setStationForm] = useState({
        stationName: '',
        location: 'Lukenya High Ropes',
        stationLead: '',
        stationLeadRank: 'Lead Douloid',
        primaryBelayer: '',
        primaryBelayerRank: 'Intermediate Douloid',
        secondaryBelayer: '',
        secondaryBelayerRank: 'Basic Douloid',
        spotter: '',
        spotterRank: 'Shadow Douloid'
    });
    const [editingStationIndex, setEditingStationIndex] = useState(null);

    const fetchProgram = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/trainings/camp-program?campus=${campus}`);
            setProgram(res.data);
        } catch (err) {
            console.error('Error fetching camp program:', err);
            setMsg({ type: 'error', text: 'Failed to load camp run-sheet' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgram();
    }, [campus]);

    const handleSaveProgram = async (updatedProgram = program) => {
        if (isGuest) {
            return setMsg({ type: 'error', text: 'Changes disabled in Guest Mode' });
        }
        setSaving(true);
        try {
            const res = await api.post('/trainings/camp-program', updatedProgram);
            setProgram(res.data.program);
            if (res.data.hasViolations) {
                setMsg({ type: 'warning', text: res.data.safetyMessage });
            } else {
                setMsg({ type: 'success', text: 'Camp Run-Sheet & Duty Roster saved successfully' });
            }
        } catch (err) {
            console.error('Error saving program:', err);
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save run-sheet' });
        } finally {
            setSaving(false);
        }
    };

    // Activity Handlers
    const openAddActivity = (day = 'Friday') => {
        setActivityForm({
            day,
            time: '08:00',
            activity: '',
            location: 'Freedom Base',
            leadFacilitator: '',
            facilitators: [],
            notes: ''
        });
        setEditingActivityIndex(null);
        setShowActivityModal(true);
    };

    const openEditActivity = (item, index) => {
        const itemFacilitators = Array.isArray(item.facilitators) && item.facilitators.length > 0
            ? item.facilitators
            : (item.leadFacilitator ? [item.leadFacilitator] : []);
        setActivityForm({ 
            ...item, 
            facilitators: itemFacilitators,
            leadFacilitator: itemFacilitators.join(', ')
        });
        setEditingActivityIndex(index);
        setShowActivityModal(true);
    };

    const saveActivity = () => {
        if (!activityForm.activity.trim()) {
            return setMsg({ type: 'error', text: 'Activity name is required' });
        }
        const facilitators = (activityForm.leadFacilitator || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const preparedActivity = {
            ...activityForm,
            facilitators,
            leadFacilitator: facilitators[0] || ''
        };

        const updatedSchedule = [...(program.schedule || [])];
        if (editingActivityIndex !== null) {
            updatedSchedule[editingActivityIndex] = preparedActivity;
        } else {
            updatedSchedule.push(preparedActivity);
        }
        
        // Sort by time
        updatedSchedule.sort((a, b) => a.time.localeCompare(b.time));

        const updated = { ...program, schedule: updatedSchedule };
        setProgram(updated);
        setShowActivityModal(false);
        handleSaveProgram(updated);
    };

    const deleteActivity = (index) => {
        const updatedSchedule = program.schedule.filter((_, i) => i !== index);
        const updated = { ...program, schedule: updatedSchedule };
        setProgram(updated);
        handleSaveProgram(updated);
    };

    // Station Handlers
    const openAddStation = () => {
        setStationForm({
            stationName: '',
            location: 'Lukenya High Ropes Hub',
            stationLead: '',
            stationLeadRank: 'Lead Douloid',
            primaryBelayer: '',
            primaryBelayerRank: 'Intermediate Douloid',
            secondaryBelayer: '',
            secondaryBelayerRank: 'Basic Douloid',
            spotter: '',
            spotterRank: 'Shadow Douloid'
        });
        setEditingStationIndex(null);
        setShowStationModal(true);
    };

    const openEditStation = (station, index) => {
        setStationForm({ ...station });
        setEditingStationIndex(index);
        setShowStationModal(true);
    };

    const saveStation = () => {
        if (!stationForm.stationName.trim() || !stationForm.stationLead.trim()) {
            return setMsg({ type: 'error', text: 'Station Name and Station Lead are required' });
        }

        // Validate Constitutional Guardrails
        if (stationForm.stationLeadRank === 'Shadow Douloid' || stationForm.stationLeadRank === 'None') {
            return setMsg({ 
                type: 'error', 
                text: 'Constitutional Violation: Shadow Douloid or Recruit cannot be Station Lead!' 
            });
        }
        if (stationForm.primaryBelayerRank === 'Shadow Douloid' && !stationForm.primaryBelayer.toLowerCase().includes('ground')) {
            return setMsg({ 
                type: 'error', 
                text: 'Constitutional Violation: Shadow Douloid cannot be Primary Belayer!' 
            });
        }

        const updatedRoster = [...(program.dutyRoster || [])];
        if (editingStationIndex !== null) {
            updatedRoster[editingStationIndex] = stationForm;
        } else {
            updatedRoster.push(stationForm);
        }

        const updated = { ...program, dutyRoster: updatedRoster };
        setProgram(updated);
        setShowStationModal(false);
        handleSaveProgram(updated);
    };

    const deleteStation = (index) => {
        const updatedRoster = program.dutyRoster.filter((_, i) => i !== index);
        const updated = { ...program, dutyRoster: updatedRoster };
        setProgram(updated);
        handleSaveProgram(updated);
    };

    // Export: Copy WhatsApp Run-Sheet
    const handleCopyWhatsApp = () => {
        if (!program) return;

        let text = `🏕️ *DOULOS FREEDOM BASE CAMP RUN-SHEET* 🏕️\n`;
        text += `*Title:* ${program.title}\n`;
        text += `*Semester:* ${program.semester} | *Campus:* ${program.campus}\n`;
        text += `*Spiritual Theme:* "${program.theme}"\n`;
        text += `*Headquarters:* Freedom Base (10 Acres), Lukenya Hills\n`;
        text += `-------------------------------------------\n\n`;

        const days = ['Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
            const dayItems = (program.schedule || []).filter(item => item.day === day);
            if (dayItems.length > 0) {
                text += `📅 *${day.toUpperCase()} SCHEDULE*\n`;
                dayItems.forEach(item => {
                    text += `• *${item.time}* - ${item.activity}\n`;
                    text += `  📍 _Location:_ ${item.location}`;
                    if (item.leadFacilitator) text += ` | _Lead:_ ${item.leadFacilitator}`;
                    if (item.notes) text += `\n  💡 _Notes:_ ${item.notes}`;
                    text += `\n`;
                });
                text += `\n`;
            }
        });

        text += `🧗‍♂️ *STATION DUTY ROSTER & BELAY ASSIGNMENTS*\n`;
        (program.dutyRoster || []).forEach((st, idx) => {
            text += `*Station ${idx + 1}: ${st.stationName}*\n`;
            text += `• Lead: *${st.stationLead}* (${st.stationLeadRank})\n`;
            text += `• Primary Belay: *${st.primaryBelayer || 'N/A'}* (${st.primaryBelayerRank})\n`;
            text += `• Secondary Belay: *${st.secondaryBelayer || 'N/A'}* (${st.secondaryBelayerRank})\n`;
            text += `• Spotter: *${st.spotter || 'N/A'}* (${st.spotterRank})\n`;
            if (st.safetyWarning) {
                text += `⚠️ *ALERT:* ${st.safetyWarning}\n`;
            }
            text += `\n`;
        });

        text += `🛡️ *EMERGENCY CONTACTS*\n`;
        (program.emergencyContacts || []).forEach(c => {
            text += `• ${c.role}: *${c.name}* (${c.phone})\n`;
        });

        text += `\n⚠️ *CONSTITUTIONAL MANDATE:* "Excellence in safety is worship. No Shadow Douloid may belay without qualified primary."`;

        navigator.clipboard.writeText(text).then(() => {
            setCopiedWhatsApp(true);
            setMsg({ type: 'success', text: 'WhatsApp Run-Sheet copied to clipboard!' });
            setTimeout(() => setCopiedWhatsApp(false), 3000);
        }).catch(err => {
            console.error('Failed to copy text:', err);
            setMsg({ type: 'error', text: 'Failed to copy to clipboard' });
        });
    };

    // Export: Print Field Clipboard Sheet
    const handlePrintFieldSheet = () => {
        if (!program) return;
        const printWindow = window.open('', '_blank');
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Field Clipboard - ${program.title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; color: #FFFFFF; line-height: 1.4; font-size: 11pt; }
                    .header { border-bottom: 2px solid #021525; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
                    h1 { margin: 0; font-size: 16pt; color: #021525; text-transform: uppercase; }
                    .meta { font-size: 9pt; color: #475569; }
                    .theme-box { background: #f1f5f9; border-left: 4px solid #25AAE1; padding: 8px 12px; margin-bottom: 15px; font-weight: 600; font-size: 10pt; }
                    h2 { font-size: 12pt; background: #021525; color: white; padding: 4px 8px; margin-top: 15px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 9.5pt; }
                    th { background: #e2e8f0; font-weight: 700; }
                    .checkbox { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; vertical-align: middle; }
                    .footer { font-size: 8pt; color: #64748b; border-top: 1px solid #cbd5e1; margin-top: 20px; padding-top: 8px; text-align: center; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>Doulos Freedom Base Facilitator Run-Sheet</h1>
                        <div class="meta">${program.title} | ${program.semester} | Campus: ${program.campus}</div>
                    </div>
                    <div style="text-align: right; font-size: 9pt;">
                        <strong>HQ:</strong> Freedom Base, Lukenya Hills<br/>
                        <strong>Date Printed:</strong> ${new Date().toLocaleDateString()}
                    </div>
                </div>

                <div class="theme-box">
                    Theme: "${program.theme}" | Safety Protocol: 2:1 Belay Buddy & Double Carabiner Squeeze Required
                </div>

                <h2>1. 3-Day Facilitator Cadence Schedule</h2>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 70px;">Day</th>
                            <th style="width: 55px;">Time</th>
                            <th>Activity Description</th>
                            <th>Station / Location</th>
                            <th>Lead Facilitator</th>
                            <th style="width: 30px;">Done</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(program.schedule || []).map(s => `
                            <tr>
                                <td><strong>${s.day}</strong></td>
                                <td>${s.time}</td>
                                <td>${s.activity}</td>
                                <td>${s.location}</td>
                                <td>${(s.facilitators && s.facilitators.length > 0) ? s.facilitators.join(', ') : (s.leadFacilitator || '—')}</td>
                                <td style="text-align: center;"><div class="checkbox"></div></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2>2. Station Duty Roster & Belay Clearances</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Station Name</th>
                            <th>Station Lead (Rank)</th>
                            <th>Primary Belayer</th>
                            <th>Secondary Belayer</th>
                            <th>Spotter</th>
                            <th>Safety Sign-Off</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(program.dutyRoster || []).map(r => `
                            <tr>
                                <td><strong>${r.stationName}</strong><br/><span style="font-size: 8pt; color: #64748b;">${r.location}</span></td>
                                <td>${r.stationLead} (${r.stationLeadRank})</td>
                                <td>${r.primaryBelayer} (${r.primaryBelayerRank})</td>
                                <td>${r.secondaryBelayer} (${r.secondaryBelayerRank})</td>
                                <td>${r.spotter} (${r.spotterRank})</td>
                                <td style="text-align: center;"><div class="checkbox"></div> Checked</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2>3. Wilderness Emergency Contacts</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Role</th>
                            <th>Contact Person</th>
                            <th>Emergency Phone</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(program.emergencyContacts || []).map(c => `
                            <tr>
                                <td><strong>${c.role}</strong></td>
                                <td>${c.name}</td>
                                <td>${c.phone}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    Constitutional Safety Standard: "Outdoor ministry is not fun with Bible verses. It is risk management + spiritual leadership." — Doulos Facilitator Manual
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '3px solid rgba(37,170,225,0.2)', borderTopColor: '#25AAE1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Loading Freedom Base Camp Run-Sheet...</p>
            </div>
        );
    }

    if (!program) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #EBEBF2' }}>
                <p style={{ color: "#1E1B39" }}>No camp program initialized.</p>
                <button className="btn btn-primary" onClick={fetchProgram} style={{ background: "#4B3F8C", color: "#FFFFFF", fontWeight: 800, marginTop: '1rem' }}>
                    Initialize Default Run-Sheet
                </button>
            </div>
        );
    }

    const filteredSchedule = activeDay === 'All' 
        ? (program.schedule || [])
        : (program.schedule || []).filter(s => s.day === activeDay);

    const hasViolations = (program.dutyRoster || []).some(s => !s.safetyCleared);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Run-Sheet Control Header */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <Compass size={18} style={{ color: '#25AAE1' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#25AAE1' }}>
                            CAMP MASTER RUN-SHEET STUDIO
                        </span>
                        <span style={{ 
                            background: program.campus === 'Both' ? 'rgba(139,92,246,0.15)' : 'rgba(37,170,225,0.15)', 
                            color: program.campus === 'Both' ? '#a78bfa' : '#38bdf8', 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '999px',
                            border: `1px solid ${program.campus === 'Both' ? 'rgba(139,92,246,0.3)' : 'rgba(37,170,225,0.3)'}`
                        }}>
                            {program.campus === 'Both' ? 'JOINT MINISTRY' : program.campus.toUpperCase()}
                        </span>
                    </div>
                    <h3 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.3rem' }}>
                        {program.title}
                    </h3>
                    <p style={{ margin: '0.3rem 0 0 0', color: "#7E7A9B", fontSize: '0.85rem' }}>
                        Theme: <span style={{ color: '#fbbf24', fontStyle: 'italic', fontWeight: 600 }}>"{program.theme}"</span> • Freedom Base HQ (10 Acres, Lukenya Hills)
                    </p>
                </div>

                {/* Export & Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button 
                        onClick={handleCopyWhatsApp}
                        className="btn"
                        style={{ 
                            background: copiedWhatsApp ? '#10b981' : '#128c7e', 
                            color: "#1E1B39", 
                            fontWeight: 800, 
                            fontSize: '0.82rem', 
                            padding: '0.6rem 1.1rem', 
                            borderRadius: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {copiedWhatsApp ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedWhatsApp ? 'Copied WhatsApp!' : 'Copy WhatsApp Run-Sheet'}</span>
                    </button>

                    <button 
                        onClick={handlePrintFieldSheet}
                        className="btn"
                        style={{ 
                            background: '#1e293b', 
                            color: "#1E1B39", 
                            fontWeight: 800, 
                            fontSize: '0.82rem', 
                            padding: '0.6rem 1.1rem', 
                            borderRadius: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            border: '1px solid #EBEBF2',
                            cursor: 'pointer'
                        }}
                    >
                        <Printer size={16} />
                        <span>Print Field Clipboard</span>
                    </button>

                    <button 
                        onClick={() => handleSaveProgram()}
                        disabled={saving}
                        className="btn"
                        style={{ 
                            background: "#4B3F8C", 
                            color: "#FFFFFF", 
                            fontWeight: 900, 
                            fontSize: '0.82rem', 
                            padding: '0.6rem 1.1rem', 
                            borderRadius: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Save size={16} />
                        <span>{saving ? 'Saving...' : 'Save Run-Sheet'}</span>
                    </button>
                </div>
            </div>

            {/* Constitutional Safety Guardrail Warning Banner if Violations Exist */}
            {hasViolations && (
                <div style={{ 
                    background: 'rgba(239, 68, 68, 0.12)', 
                    border: '1px solid #ef4444', 
                    borderRadius: '12px', 
                    padding: '1rem 1.25rem', 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.85rem' 
                }}>
                    <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <h4 style={{ margin: 0, color: '#ef4444', fontWeight: 800, fontSize: '0.95rem' }}>
                            CONSTITUTIONAL SAFETY GUARDRAIL ALERT
                        </h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#fca5a5', fontSize: '0.83rem', lineHeight: 1.4 }}>
                            One or more station assignments violate the Doulos Safety Constitution. Shadow Douloids are strictly prohibited from serving as Primary Belayers or Solo Station Leads! Review the duty roster below to rectify.
                        </p>
                    </div>
                </div>
            )}

            {/* SECTION 1: 3-DAY RUN-SHEET SCHEDULE */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} style={{ color: '#25AAE1' }} />
                            3-Day Friday–Sunday Camp Cadence
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                            Chronological facilitator run-sheet for all 3 days at Freedom Base.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Day Filter Pills */}
                        <div style={{ display: 'flex', background: '#F8F8FC', padding: '3px', borderRadius: '10px', border: '1px solid #EBEBF2' }}>
                            {['All', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <button
                                    key={day}
                                    onClick={() => setActiveDay(day)}
                                    style={{
                                        background: activeDay === day ? '#25AAE1' : 'transparent',
                                        color: activeDay === day ? '#021525' : 'rgba(255,255,255,0.6)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.4rem 0.85rem',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => openAddActivity(activeDay === 'All' ? 'Friday' : activeDay)}
                            className="btn"
                            style={{
                                background: '#10b981',
                                color: "#FFFFFF",
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '8px',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={15} />
                            <span>Add Session</span>
                        </button>
                    </div>
                </div>

                {/* Schedule Table / List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {filteredSchedule.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: "#7E7A9B", fontSize: '0.85rem' }}>
                            No activities scheduled for {activeDay}. Click "Add Session" above.
                        </div>
                    ) : (
                        filteredSchedule.map((item, idx) => (
                            <div 
                                key={idx}
                                style={{
                                    background: '#F8F8FC',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    padding: '0.9rem 1.25rem',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                                    <div style={{ 
                                        background: item.day === 'Friday' ? 'rgba(37,170,225,0.15)' : item.day === 'Saturday' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                        color: item.day === 'Friday' ? '#38bdf8' : item.day === 'Saturday' ? '#fbbf24' : '#34d399',
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '6px',
                                        textTransform: 'uppercase',
                                        minWidth: '65px',
                                        textAlign: 'center'
                                    }}>
                                        {item.day}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 800, fontSize: '0.95rem' }}>
                                        <Clock size={15} />
                                        <span>{item.time}</span>
                                    </div>
                                </div>

                                <div style={{ flex: 1, minWidth: '240px' }}>
                                    <div style={{ color: "#1E1B39", fontWeight: 700, fontSize: '0.92rem' }}>
                                        {item.activity}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem', fontSize: '0.78rem', color: "#7E7A9B" }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <MapPin size={13} style={{ color: '#25AAE1' }} />
                                            {item.location}
                                        </span>
                                        {((item.facilitators && item.facilitators.length > 0) || item.leadFacilitator) && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24' }}>
                                                <Users size={13} />
                                                Facilitators: {(item.facilitators && item.facilitators.length > 0) ? item.facilitators.join(', ') : item.leadFacilitator}
                                            </span>
                                        )}
                                    </div>
                                    {item.notes && (
                                        <div style={{ fontSize: '0.75rem', color: "#7E7A9B", marginTop: '0.25rem', fontStyle: 'italic' }}>
                                            💡 {item.notes}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => openEditActivity(item, program.schedule.indexOf(item))}
                                        style={{ background: '#EBEBF2', border: 'none', color: "#7E7A9B", padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                        title="Edit Activity"
                                    >
                                        <Edit3 size={15} />
                                    </button>
                                    <button
                                        onClick={() => deleteActivity(program.schedule.indexOf(item))}
                                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                        title="Delete Activity"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* SECTION 2: INTERACTIVE STATION DUTY ROSTER & CONSTITUTIONAL SAFETY CHECK */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Shield size={18} style={{ color: '#10b981' }} />
                            <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.1rem' }}>
                                High Ropes & Station Duty Roster
                            </h4>
                            <span style={{ 
                                background: hasViolations ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                                color: hasViolations ? '#ef4444' : '#10b981',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                border: `1px solid ${hasViolations ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`
                            }}>
                                {hasViolations ? 'SAFETY WARNING ACTIVE' : 'CONSTITUTIONALLY VERIFIED'}
                            </span>
                        </div>
                        <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                            Station personnel roster with 2:1 buddy ratio and rank clearance enforcement.
                        </p>
                    </div>

                    <button
                        onClick={openAddStation}
                        className="btn"
                        style={{
                            background: "#4B3F8C",
                            color: "#FFFFFF",
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={15} />
                        <span>Add Station</span>
                    </button>
                </div>

                {/* Stations Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {(program.dutyRoster || []).map((st, idx) => (
                        <div 
                            key={idx}
                            style={{
                                background: '#F8F8FC',
                                border: st.safetyCleared ? '1px solid #EBEBF2' : '1.5px solid #ef4444',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: '#25AAE1', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        STATION {idx + 1} • {st.location}
                                    </span>
                                    <h5 style={{ margin: '0.2rem 0 0 0', color: "#1E1B39", fontWeight: 800, fontSize: '0.98rem' }}>
                                        {st.stationName}
                                    </h5>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <button 
                                        onClick={() => openEditStation(st, idx)}
                                        style={{ background: '#EBEBF2', border: 'none', color: "#7E7A9B", padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => deleteStation(idx)}
                                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Personnel Assignments */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                                    <span style={{ color: "#7E7A9B", fontWeight: 600 }}>Station Lead:</span>
                                    <span style={{ color: "#1E1B39", fontWeight: 700 }}>
                                        {st.stationLead} <span style={{ color: '#fbbf24', fontSize: '0.72rem' }}>({st.stationLeadRank})</span>
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                                    <span style={{ color: "#7E7A9B", fontWeight: 600 }}>Primary Belayer:</span>
                                    <span style={{ color: st.primaryBelayerRank === 'Shadow Douloid' ? '#ef4444' : '#38bdf8', fontWeight: 700 }}>
                                        {st.primaryBelayer || 'None'} <span style={{ fontSize: '0.72rem' }}>({st.primaryBelayerRank})</span>
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                                    <span style={{ color: "#7E7A9B", fontWeight: 600 }}>Secondary Belayer:</span>
                                    <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                                        {st.secondaryBelayer || 'None'} <span style={{ color: '#a78bfa', fontSize: '0.72rem' }}>({st.secondaryBelayerRank})</span>
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                                    <span style={{ color: "#7E7A9B", fontWeight: 600 }}>Safety Spotter:</span>
                                    <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                                        {st.spotter || 'None'} <span style={{ color: '#34d399', fontSize: '0.72rem' }}>({st.spotterRank})</span>
                                    </span>
                                </div>
                            </div>

                            {/* Safety Status Pill */}
                            <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #EBEBF2' }}>
                                {st.safetyCleared ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <CheckCircle2 size={14} />
                                        <span>2:1 Belay Buddy & Station Lead Clearance Verified</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: '#ef4444', fontSize: '0.74rem', fontWeight: 700 }}>
                                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                                        <span>{st.safetyWarning || 'Safety Violation Flagged'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 3: WILDERNESS EMERGENCY COMMUNICATIONS */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.65rem', borderRadius: '10px', color: '#ef4444' }}>
                        <Phone size={20} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '0.95rem' }}>
                            Base Emergency Quick-Dial Tree
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.78rem' }}>
                            Immediate contact for Lukenya Ridge extrication & Daystar campus response.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {(program.emergencyContacts || []).map((c, i) => (
                        <div key={i} style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.78rem' }}>
                            <span style={{ color: "#7E7A9B", fontWeight: 600 }}>{c.role}: </span>
                            <span style={{ color: "#1E1B39", fontWeight: 700 }}>{c.name}</span>{' '}
                            <span style={{ color: '#25AAE1', fontWeight: 800 }}>({c.phone})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL: ADD / EDIT ACTIVITY */}
            {showActivityModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(46, 42, 77, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.75rem' }}>
                        <h3 style={{ margin: '0 0 1.25rem 0', color: "#1E1B39", fontWeight: 800, fontSize: '1.2rem' }}>
                            {editingActivityIndex !== null ? 'Edit Camp Activity' : 'Add Camp Activity'}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        DAY
                                    </label>
                                    <select
                                        value={activityForm.day}
                                        onChange={(e) => setActivityForm({ ...activityForm, day: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', fontWeight: 700 }}
                                    >
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        TIME (24-HR)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="08:30"
                                        value={activityForm.time}
                                        onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                    ACTIVITY TITLE
                                </label>
                                <input
                                    type="text"
                                    placeholder="High Ropes & Dynamic Belay Mastery"
                                    value={activityForm.activity}
                                    onChange={(e) => setActivityForm({ ...activityForm, activity: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        LOCATION
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="High Ropes Hub"
                                        value={activityForm.location}
                                        onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        FACILITATORS (1 OR MANY, COMMA-SEPARATED)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="G5 Training Director, Lead Douloid Alpha"
                                        value={activityForm.leadFacilitator}
                                        onChange={(e) => setActivityForm({ ...activityForm, leadFacilitator: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                    FACILITATOR NOTES / SAFETY INSTRUCTIONS
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Anchor systems double-checked, helmet audit required."
                                    value={activityForm.notes}
                                    onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setShowActivityModal(false)}
                                className="btn"
                                style={{ background: 'transparent', color: "#7E7A9B", border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.55rem 1rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveActivity}
                                className="btn"
                                style={{ background: "#4B3F8C", color: "#FFFFFF", fontWeight: 800, border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem' }}
                            >
                                Save Activity
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADD / EDIT STATION */}
            {showStationModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(46, 42, 77, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', maxWidth: '580px', width: '100%', padding: '1.75rem' }}>
                        <h3 style={{ margin: '0 0 1.25rem 0', color: "#1E1B39", fontWeight: 800, fontSize: '1.2rem' }}>
                            {editingStationIndex !== null ? 'Configure Duty Station' : 'Add Duty Station'}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        STATION NAME
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="High Ropes Tower 1"
                                        value={stationForm.stationName}
                                        onChange={(e) => setStationForm({ ...stationForm, stationName: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        LOCATION
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Lukenya Tower"
                                        value={stationForm.location}
                                        onChange={(e) => setStationForm({ ...stationForm, location: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Station Lead */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        STATION LEAD (NAME)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Cadre Full Name"
                                        value={stationForm.stationLead}
                                        onChange={(e) => setStationForm({ ...stationForm, stationLead: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        LEAD RANK
                                    </label>
                                    <select
                                        value={stationForm.stationLeadRank}
                                        onChange={(e) => setStationForm({ ...stationForm, stationLeadRank: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', fontWeight: 700 }}
                                    >
                                        <option value="Lead Douloid">Lead Douloid (Qualified)</option>
                                        <option value="Intermediate Douloid">Intermediate Douloid</option>
                                        <option value="Basic Douloid">Basic Douloid</option>
                                        <option value="Shadow Douloid" style={{ color: '#ef4444' }}>Shadow Douloid (Prohibited!)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Primary Belayer */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        PRIMARY BELAYER (NAME)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Cadre Name or Ground Station"
                                        value={stationForm.primaryBelayer}
                                        onChange={(e) => setStationForm({ ...stationForm, primaryBelayer: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        BELAYER RANK
                                    </label>
                                    <select
                                        value={stationForm.primaryBelayerRank}
                                        onChange={(e) => setStationForm({ ...stationForm, primaryBelayerRank: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', fontWeight: 700 }}
                                    >
                                        <option value="Lead Douloid">Lead Douloid</option>
                                        <option value="Intermediate Douloid">Intermediate Douloid (Certified)</option>
                                        <option value="Basic Douloid">Basic Douloid (Supervised)</option>
                                        <option value="Shadow Douloid" style={{ color: '#ef4444' }}>Shadow Douloid (Prohibited!)</option>
                                        <option value="None">None (Ground Activity)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Secondary Belayer & Spotter */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        SECONDARY BELAYER
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Backup Belayer Name"
                                        value={stationForm.secondaryBelayer}
                                        onChange={(e) => setStationForm({ ...stationForm, secondaryBelayer: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.3rem', fontWeight: 700 }}>
                                        SAFETY SPOTTER
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Spotter Cadre"
                                        value={stationForm.spotter}
                                        onChange={(e) => setStationForm({ ...stationForm, spotter: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.6rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setShowStationModal(false)}
                                className="btn"
                                style={{ background: 'transparent', color: "#7E7A9B", border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.55rem 1rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveStation}
                                className="btn"
                                style={{ background: "#4B3F8C", color: "#FFFFFF", fontWeight: 800, border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem' }}
                            >
                                Save Station
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampRunSheetStudio;
