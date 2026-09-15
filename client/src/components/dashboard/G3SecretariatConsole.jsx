import React, { useState, useEffect } from 'react';
import { 
    FileText, Lock, Unlock, Download, Award, Search, 
    Plus, Check, X, Shield, Calendar, Users, Printer
} from 'lucide-react';
import defaultApi from '../../api';

const G3SecretariatConsole = ({ api, setMsg, isGuest, members }) => {
    const client = api || defaultApi;
    const notify = (msg) => {
        if (typeof setMsg === 'function') setMsg(msg);
        else console.log('[G3]', msg);
    };

    const [minutes, setMinutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [transcriptData, setTranscriptData] = useState(null);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    
    // New Minutes Modal
    const [showNewMinutesModal, setShowNewMinutesModal] = useState(false);
    const [minutesForm, setMinutesForm] = useState({
        meetingDate: new Date().toISOString().split('T')[0],
        meetingType: 'Executive G-Council',
        location: 'Freedom Base Council Chamber',
        agendaText: '',
        attendeesText: '',
        resolutions: [
            { topic: '', decision: '', assignedOfficer: '', deadline: '' }
        ]
    });

    const fetchMinutes = async () => {
        setLoading(true);
        try {
            const res = await client.get('/council/minutes');
            setMinutes(res.data);
        } catch (err) {
            console.error('Error fetching minutes:', err);
            notify({ type: 'error', text: 'Failed to load Governance Minutes Vault' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMinutes();
    }, []);

    const handleLockMinutes = async (id) => {
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        if (!confirm('Seal these meeting minutes in the Vault? Once locked, resolutions are tamper-proof.')) return;

        try {
            const res = await client.post(`/council/minutes/${id}/lock`);
            notify({ type: 'success', text: res.data.message });
            fetchMinutes();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to lock minutes' });
        }
    };

    const handleAddResolutionRow = () => {
        setMinutesForm({
            ...minutesForm,
            resolutions: [...minutesForm.resolutions, { topic: '', decision: '', assignedOfficer: '', deadline: '' }]
        });
    };

    const handleSaveMinutes = async (e) => {
        e.preventDefault();
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });

        const agenda = minutesForm.agendaText.split('\n').map(a => a.trim()).filter(Boolean);
        const attendees = minutesForm.attendeesText.split('\n').map(name => ({ name: name.trim(), present: true })).filter(a => a.name);

        try {
            const res = await client.post('/council/minutes', {
                ...minutesForm,
                agenda,
                attendees,
                resolutions: minutesForm.resolutions.filter(r => r.topic.trim())
            });
            notify({ type: 'success', text: res.data.message });
            setShowNewMinutesModal(false);
            fetchMinutes();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to save minutes' });
        }
    };

    const handleGenerateTranscript = async (memberId) => {
        setTranscriptLoading(true);
        try {
            const res = await client.get(`/council/transcripts/${memberId}`);
            setTranscriptData(res.data);
        } catch (err) {
            notify({ type: 'error', text: 'Failed to generate service transcript' });
        } finally {
            setTranscriptLoading(false);
        }
    };

    const handlePrintCertificate = () => {
        if (!transcriptData) return;
        const printWindow = window.open('', '_blank');
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Official Service Certificate - ${transcriptData.officerName}</title>
                <style>
                    body { font-family: "Times New Roman", serif; margin: 40px; text-align: center; color: #021525; }
                    .border { border: 12px double #021525; padding: 40px; }
                    h1 { font-size: 28pt; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
                    h2 { font-size: 14pt; color: #25AAE1; font-weight: normal; margin-top: 0; text-transform: uppercase; letter-spacing: 3px; }
                    p { font-size: 13pt; line-height: 1.6; margin: 20px 0; }
                    .name { font-size: 24pt; font-weight: bold; text-decoration: underline; }
                    .rank-badge { font-size: 16pt; color: #b45309; font-weight: bold; }
                    .details { margin: 30px auto; width: 80%; border-collapse: collapse; text-align: left; }
                    .details td { padding: 8px 12px; border-bottom: 1px solid #cbd5e1; font-size: 11pt; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 40px; }
                    .sign-line { border-top: 1px solid #000; width: 200px; padding-top: 5px; font-size: 10pt; text-align: center; }
                </style>
            </head>
            <body>
                <div class="border">
                    <h2>Doulos Team Builders & Freedom Base Camp</h2>
                    <h1>Certificate of Outdoor Service & Ministry</h1>
                    <p>This is to certify that</p>
                    <div class="name">${transcriptData.officerName}</div>
                    <p>Student Admission Number: <strong>${transcriptData.admissionNumber}</strong> (${transcriptData.campus} Campus)<br />
                    has demonstrated spiritual character and physical competency, attaining the certified rank of:</p>
                    <div class="rank-badge">${transcriptData.douloidRank.toUpperCase()}</div>
                    
                    <table class="details">
                        <tr><td>Belay Qualification:</td><td><strong>${transcriptData.belayStatus}</strong></td></tr>
                        <tr><td>Solo Station Clearance:</td><td><strong>${transcriptData.soloStationAllowed ? 'Authorized' : 'Supervised Only'}</strong></td></tr>
                        <tr><td>Total Stewardship Points:</td><td><strong>${transcriptData.totalPoints} Points</strong></td></tr>
                        <tr><td>Fellowship Meetings Attended:</td><td><strong>${transcriptData.fellowshipMeetingsCount} Sessions</strong></td></tr>
                        <tr><td>Practical Outdoor Camps:</td><td><strong>${transcriptData.trainingsCount} Camps</strong></td></tr>
                    </table>

                    <div class="signatures">
                        <div class="sign-line">G3 Secretary / Records</div>
                        <div class="sign-line">G1 Executive Coordinator</div>
                    </div>
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* G3 HEADER */}
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
                        <FileText size={18} style={{ color: '#25AAE1' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#25AAE1' }}>
                            G3 SECRETARIAT & OFFICIAL RECORDS
                        </span>
                    </div>
                    <h3 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.3rem' }}>
                        Governance Minutes Vault & Service Transcripts
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: "#7E7A9B", fontSize: '0.82rem' }}>
                        Tamper-proof council archives, Douloid service records, and 1-click certificate generator.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setShowNewMinutesModal(true)}
                        className="btn"
                        style={{ background: "#4B3F8C", color: "#FFFFFF", fontWeight: 800, padding: '0.55rem 1rem', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                    >
                        <Plus size={16} />
                        <span>Record Minutes</span>
                    </button>
                </div>
            </div>

            {/* MINUTES VAULT LIST */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={16} style={{ color: '#fbbf24' }} />
                        Official G-Council Minutes Vault ({minutes.length})
                    </h4>
                </div>

                {loading ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: "#7E7A9B" }}>
                        Loading Vault records...
                    </div>
                ) : minutes.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: "#7E7A9B" }}>
                        No council minutes recorded yet. Click "Record Minutes" above.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {minutes.map((m) => (
                            <div
                                key={m._id}
                                style={{
                                    background: '#F8F8FC',
                                    border: m.isLocked ? '1px solid rgba(16,185,129,0.25)' : '1px solid #EBEBF2',
                                    borderRadius: '12px',
                                    padding: '1.25rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#25AAE1', fontWeight: 800, textTransform: 'uppercase' }}>
                                                {m.meetingType} • {new Date(m.meetingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            {m.isLocked ? (
                                                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.65rem', fontWeight: 900, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                                    ✓ SEALED IN VAULT
                                                </span>
                                            ) : (
                                                <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.65rem', fontWeight: 900, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                                    UNLOCKED DRAFT
                                                </span>
                                            )}
                                        </div>
                                        <h5 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1rem' }}>
                                            Presided by: {m.presidedBy} • Recorded by: {m.recordedBy}
                                        </h5>
                                    </div>

                                    {!m.isLocked && (
                                        <button
                                            onClick={() => handleLockMinutes(m._id)}
                                            className="btn"
                                            style={{ background: '#1e293b', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            Lock & Seal Vault
                                        </button>
                                    )}
                                </div>

                                {/* Resolutions */}
                                <div style={{ marginTop: '0.65rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: "#7E7A9B", fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                        Key Resolutions & Action Officers:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {(m.resolutions || []).map((r, i) => (
                                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: "#1E1B39", fontWeight: 600 }}>• {r.topic}: <em>{r.decision}</em></span>
                                                <span style={{ color: '#25AAE1', fontWeight: 700 }}>Officer: {r.assignedOfficer}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* OFFICIAL SERVICE TRANSCRIPTS & CERTIFICATE GENERATOR */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={16} style={{ color: '#10b981' }} />
                            Official Service Transcripts & Certificate Generator
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                            Generate formal ministry transcripts, Douloid rank certificates, and service hours breakdown.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#F8F8FC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #EBEBF2' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", fontWeight: 800, marginBottom: '0.5rem' }}>
                            SELECT DOULOID OR RECRUIT
                        </label>
                        <select
                            onChange={(e) => {
                                const id = e.target.value;
                                if (id) handleGenerateTranscript(id);
                            }}
                            style={{ width: '100%', background: '#FFFFFF', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.65rem', borderRadius: '8px', fontWeight: 700 }}
                        >
                            <option value="">-- Choose Member --</option>
                            {(members || []).map(m => (
                                <option key={m._id} value={m._id}>{m.name} ({m.studentRegNo}) — {m.douloidRank || 'Recruit'}</option>
                            ))}
                        </select>

                        {transcriptLoading && (
                            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#25AAE1' }}>
                                Compiling official transcript...
                            </div>
                        )}
                    </div>

                    {transcriptData && (
                        <div style={{ background: '#F8F8FC', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(37,170,225,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h5 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.1rem' }}>
                                        {transcriptData.officerName}
                                    </h5>
                                    <div style={{ fontSize: '0.78rem', color: '#25AAE1', marginTop: '0.2rem', fontWeight: 700 }}>
                                        {transcriptData.admissionNumber} • {transcriptData.campus}
                                    </div>
                                </div>
                                <button
                                    onClick={handlePrintCertificate}
                                    className="btn"
                                    style={{ background: '#10b981', color: "#FFFFFF", fontWeight: 800, fontSize: '0.75rem', padding: '0.45rem 0.85rem', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                                >
                                    <Printer size={14} />
                                    <span>Print Certificate</span>
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', fontSize: '0.78rem' }}>
                                <div>Rank: <strong style={{ color: '#fbbf24' }}>{transcriptData.douloidRank}</strong></div>
                                <div>Belay: <strong style={{ color: '#38bdf8' }}>{transcriptData.belayStatus}</strong></div>
                                <div>Meetings: <strong style={{ color: "#1E1B39" }}>{transcriptData.fellowshipMeetingsCount}</strong></div>
                                <div>Camps: <strong style={{ color: "#1E1B39" }}>{transcriptData.trainingsCount}</strong></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: NEW MINUTES */}
            {showNewMinutesModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(46, 42, 77, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <h3 style={{ margin: '0 0 1.25rem 0', color: "#1E1B39", fontWeight: 800 }}>Record Official G-Council Minutes</h3>
                        <form onSubmit={handleSaveMinutes} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.3rem' }}>MEETING DATE</label>
                                    <input
                                        type="date"
                                        value={minutesForm.meetingDate}
                                        onChange={(e) => setMinutesForm({ ...minutesForm, meetingDate: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.3rem' }}>MEETING TYPE</label>
                                    <select
                                        value={minutesForm.meetingType}
                                        onChange={(e) => setMinutesForm({ ...minutesForm, meetingType: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px' }}
                                    >
                                        <option value="Executive G-Council">Executive G-Council</option>
                                        <option value="All-Council General">All-Council General</option>
                                        <option value="Safety Review Assembly">Safety Review Assembly</option>
                                        <option value="Handover & Transition Assembly">Handover & Transition Assembly</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.3rem' }}>AGENDA ITEMS (1 per line)</label>
                                <textarea
                                    rows="2"
                                    placeholder="1. High Ropes Carabiner Inspection&#10;2. Freedom Base Camp Roster"
                                    value={minutesForm.agendaText}
                                    onChange={(e) => setMinutesForm({ ...minutesForm, agendaText: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.3rem' }}>ATTENDEES (1 name per line)</label>
                                <textarea
                                    rows="2"
                                    placeholder="G1 Coordinator&#10;G3 Secretary&#10;G5 Training Director"
                                    value={minutesForm.attendeesText}
                                    onChange={(e) => setMinutesForm({ ...minutesForm, attendeesText: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <label style={{ fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700 }}>RESOLUTIONS & ACTION OFFICERS</label>
                                    <button type="button" onClick={handleAddResolutionRow} style={{ background: '#1e293b', border: 'none', color: '#25AAE1', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>+ Add Row</button>
                                </div>
                                {minutesForm.resolutions.map((r, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '0.4rem', marginBottom: '0.4rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Topic"
                                            value={r.topic}
                                            onChange={(e) => {
                                                const updated = [...minutesForm.resolutions];
                                                updated[i].topic = e.target.value;
                                                setMinutesForm({ ...minutesForm, resolutions: updated });
                                            }}
                                            style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Resolution / Decision"
                                            value={r.decision}
                                            onChange={(e) => {
                                                const updated = [...minutesForm.resolutions];
                                                updated[i].decision = e.target.value;
                                                setMinutesForm({ ...minutesForm, resolutions: updated });
                                            }}
                                            style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Officer"
                                            value={r.assignedOfficer}
                                            onChange={(e) => {
                                                const updated = [...minutesForm.resolutions];
                                                updated[i].assignedOfficer = e.target.value;
                                                setMinutesForm({ ...minutesForm, resolutions: updated });
                                            }}
                                            style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem' }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowNewMinutesModal(false)} className="btn" style={{ background: 'transparent', color: "#7E7A9B", border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.5rem 1rem' }}>Cancel</button>
                                <button type="submit" className="btn" style={{ background: "#4B3F8C", color: "#FFFFFF", fontWeight: 800, border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem' }}>Save to Vault</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G3SecretariatConsole;
