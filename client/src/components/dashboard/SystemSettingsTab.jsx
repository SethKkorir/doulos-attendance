import { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Calendar, Link as LinkIcon, 
    ShieldAlert, RotateCcw, CheckCircle, AlertTriangle, 
    BookOpen, CheckSquare, Sparkles, Loader2
} from 'lucide-react';

const SystemSettingsTab = ({ 
    onUpdateSetting, 
    isGuest, 
    setMsg,
    api,
    userRole
}) => {
    const [semester, setSemester] = useState('MAY-AUG 2026');
    const [theme, setTheme] = useState('');
    const [verse, setVerse] = useState('');
    const [guestAccess, setGuestAccess] = useState('true');
    const [waLink, setWaLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [wateringActive, setWateringActive] = useState(false);

    // Rollover Console Wizard state
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1); // 1: Warning, 2: Text Confirmation, 3: Success
    const [confirmText, setConfirmText] = useState('');
    const [rolloverLoading, setRolloverLoading] = useState(false);

    // Rollback backup state
    const [hasBackup, setHasBackup] = useState(false);
    const [backupInfo, setBackupInfo] = useState(null);
    const [rollbackLoading, setRollbackLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const [semRes, guestRes, waRes, themeRes, verseRes, wateringRes, backupRes] = await Promise.all([
                    api.get('/settings/current_semester'),
                    api.get('/settings/guest_features'),
                    api.get('/settings/whatsapp_link'),
                    api.get('/settings/semester_theme'),
                    api.get('/settings/semester_verse'),
                    api.get('/settings/watering_selector_active'),
                    api.get('/settings/ROLLBACK_BACKUP_METADATA').catch(() => ({ data: { value: null } }))
                ]);
                if (semRes.data?.value) setSemester(semRes.data.value);
                if (guestRes.data?.value) setGuestAccess(guestRes.data.value);
                if (waRes.data?.value) setWaLink(waRes.data.value);
                if (themeRes.data?.value) setTheme(themeRes.data.value);
                if (verseRes.data?.value) setVerse(verseRes.data.value);
                if (wateringRes.data?.value) setWateringActive(wateringRes.data.value === 'true');
                
                if (backupRes.data?.value) {
                    setHasBackup(true);
                    try {
                        setBackupInfo(JSON.parse(backupRes.data.value));
                    } catch (e) {
                        console.error("Failed to parse backup metadata", e);
                    }
                } else {
                    setHasBackup(false);
                    setBackupInfo(null);
                }
            } catch (err) {
                console.error("Failed to fetch system settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [api]);

    const handleExecuteRollback = async () => {
        if (isGuest) {
            setMsg({ type: 'error', text: 'Rollback disabled in Guest Mode.' });
            return;
        }
        if (!window.confirm("WARNING: Are you absolutely sure you want to rollback the last semester rollover? This will restore previous member points, reactivate previous meetings/trainings, and revert settings. This action is irreversible!")) {
            return;
        }
        setRollbackLoading(true);
        try {
            const res = await api.post('/settings/rollback');
            setMsg({ type: 'success', text: res.data.message });
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            console.error("Rollback failed:", err);
            alert(err.response?.data?.message || 'Rollback failed. Please try again.');
        } finally {
            setRollbackLoading(false);
        }
    };

    const handleToggleWatering = async () => {
        const newValue = !wateringActive;
        setWateringActive(newValue);
        await handleSave('watering_selector_active', String(newValue));
    };

    const handleSave = async (key, value) => {
        if (isGuest) {
            setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
            return;
        }
        setSaving(prev => ({ ...prev, [key]: true }));
        try {
            await onUpdateSetting(key, value);
            setMsg({ type: 'success', text: 'Setting updated successfully!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update setting.' });
        } finally {
            setTimeout(() => setSaving(prev => ({ ...prev, [key]: false })), 1200);
        }
    };

    const handleStartRollover = () => {
        if (isGuest) {
            setMsg({ type: 'error', text: 'Rollover disabled in Guest Mode.' });
            return;
        }
        if (!semester.trim()) {
            alert('Please specify the new Semester Name first.');
            return;
        }
        setWizardStep(1);
        setConfirmText('');
        setShowWizard(true);
    };

    const handleExecuteRollover = async () => {
        if (isGuest) return;
        setRolloverLoading(true);
        try {
            const res = await api.post('/settings/rollover', {
                current_semester: semester.trim(),
                semester_theme: theme.trim(),
                semester_verse: verse.trim()
            });

            // Set final success step
            setWizardStep(3);
            setMsg({ type: 'success', text: res.data.message });
        } catch (err) {
            console.error("Rollover failed:", err);
            alert(err.response?.data?.message || 'Rollover failed. Please try again.');
            setShowWizard(false);
        } finally {
            setRolloverLoading(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <SettingsIcon size={36} className="animate-spin" style={{ opacity: 0.3 }} />
            <div>Loading System Configurations...</div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s' }}>

            {/* Header */}
            <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(37, 170, 225, 0.12)', borderRadius: '1rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                        <SettingsIcon size={28} color="#25AAE1" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>CONTROL PANEL</div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>Global Settings & Semester Rollover</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Configure system parameters and perform clean academic transitions</p>
                    </div>
                </div>
            </div>

            {/* Settings Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Spiritual Theme Card */}
                <div className="glass-card-premium" style={{ borderLeft: '4px solid #8b5cf6', background: '#0d111b', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.7rem', background: 'rgba(139,92,246,0.08)', borderRadius: '0.75rem', border: '1px solid rgba(139,92,246,0.15)' }}>
                            <BookOpen size={20} color="#8b5cf6" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Spiritual Theme</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>Current Semester Theme title</div>
                        </div>
                    </div>
                    <input
                        className="modern-input"
                        style={{ width: '100%', border: '1px solid rgba(139,92,246,0.2)', marginBottom: '1rem', boxSizing: 'border-box' }}
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="e.g. Trust the designer..."
                    />
                    <button
                        className="btn"
                        style={{ width: '100%', background: 'rgba(139,92,246,0.05)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        onClick={() => handleSave('semester_theme', theme)}
                    >
                        {saving.semester_theme ? <><RotateCcw size={15} className="animate-spin" /> Saving...</> : <><CheckCircle size={15} /> Update Theme</>}
                    </button>
                </div>

                {/* Scriptural Verse Card */}
                <div className="glass-card-premium" style={{ borderLeft: '4px solid #f43f5e', background: '#0d111b', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.7rem', background: 'rgba(244,63,94,0.08)', borderRadius: '0.75rem', border: '1px solid rgba(244,63,94,0.15)' }}>
                            <Sparkles size={20} color="#f43f5e" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Scriptural Verse</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>Reference — Verse text</div>
                        </div>
                    </div>
                    <input
                        className="modern-input"
                        style={{ width: '100%', border: '1px solid rgba(244,63,94,0.2)', marginBottom: '1rem', boxSizing: 'border-box' }}
                        value={verse}
                        onChange={(e) => setVerse(e.target.value)}
                        placeholder="e.g. Proverbs 3:5-6 — 'Trust the Lord...'"
                    />
                    <button
                        className="btn"
                        style={{ width: '100%', background: 'rgba(244,63,94,0.05)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        onClick={() => handleSave('semester_verse', verse)}
                    >
                        {saving.semester_verse ? <><RotateCcw size={15} className="animate-spin" /> Saving...</> : <><CheckCircle size={15} /> Update Verse</>}
                    </button>
                </div>

                {/* Tree Watering Selector Access Card */}
                <div className="glass-card-premium" style={{ borderLeft: '4px solid #10b981', background: '#0d111b', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '0.7rem', background: 'rgba(16,185,129,0.08)', borderRadius: '0.75rem', border: '1px solid rgba(16,185,129,0.15)' }}>
                            <CheckSquare size={20} color="#10b981" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Watering Commitment Access</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>Open student watering selector form</div>
                        </div>
                    </div>
                    
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.45, margin: '0 0 1.25rem 0' }}>
                        When <strong>Live</strong>, students can select their committed watering days directly in their portal. When <strong>Closed</strong>, the form is hidden but their commitments remain visible as read-only.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(2, 21, 37, 0.4)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: wateringActive ? '#10b981' : '#f87171', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: wateringActive ? '#10b981' : '#f87171', display: 'inline-block', boxShadow: wateringActive ? '0 0 10px #10b981' : 'none' }}></span>
                            {wateringActive ? 'STATUS: ACTIVE (LIVE)' : 'STATUS: CLOSED (INACTIVE)'}
                        </span>

                        <button
                            onClick={handleToggleWatering}
                            disabled={saving.watering_selector_active}
                            style={{
                                border: 'none',
                                background: wateringActive ? '#10b981' : 'rgba(255,255,255,0.1)',
                                color: wateringActive ? '#021525' : 'rgba(255,255,255,0.4)',
                                padding: '0.45rem 1rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                            }}
                        >
                            {saving.watering_selector_active ? <Loader2 size={13} className="animate-spin" /> : wateringActive ? 'Close Selector' : 'Make Selector Live'}
                        </button>
                    </div>
                </div>

            </div>

            {/* Semester Rollover Configuration Wizard */}
            <div className="glass-card-premium" style={{ 
                borderLeft: '4px solid #25AAE1', 
                background: '#0d111b',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(37, 170, 225, 0.12)', borderRadius: '0.75rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                        <Calendar size={22} color="#25AAE1" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Semester Rollover Console</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Close past terms, reset points, and set a welcoming new theme for the fellowship</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    
                    <div className="form-group-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-dim)' }}>
                            New Semester Name
                        </label>
                        <input
                            className="modern-input"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            placeholder="e.g. SEP-DEC 2026"
                            style={{ width: '100%', border: '1px solid rgba(37,170,225,0.15)' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>Use standard academic formatting</span>
                    </div>

                    <div className="form-group-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-dim)' }}>
                            Spiritual Theme Title
                        </label>
                        <input
                            className="modern-input"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            placeholder="e.g. Set Apart / Rooted"
                            style={{ width: '100%', border: '1px solid rgba(37,170,225,0.15)' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>Shows up on first student check-in pop-up</span>
                    </div>

                    <div className="form-group-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-dim)' }}>
                            Scriptural Verse
                        </label>
                        <input
                            className="modern-input"
                            value={verse}
                            onChange={(e) => setVerse(e.target.value)}
                            placeholder="e.g. 1 Peter 1:15-16 — 'But just as he who called you is holy, so be holy in all you do...'"
                            style={{ width: '100%', border: '1px solid rgba(37,170,225,0.15)' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>Companion scripture displaying spiritual focus</span>
                    </div>
                </div>

                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                    <button 
                        onClick={handleStartRollover}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #25AAE1 0%, #175e82 100%) !important',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            boxShadow: '0 8px 25px rgba(37, 170, 225, 0.15) !important'
                        }}
                    >
                        <RotateCcw size={18} /> Initiate Semester Rollover Wizard
                    </button>
                </div>
            </div>

            {/* SuperAdmin Rollover Reversion (Rollback) System */}
            {hasBackup && ['superadmin', 'developer'].includes(userRole?.toLowerCase()) && (
                <div className="glass-card-premium" style={{ 
                    borderLeft: '4px solid #f97316', 
                    background: '#0d111b',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    marginTop: '1.5rem',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(249, 115, 22, 0.12)', borderRadius: '0.75rem', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                            <ShieldAlert size={22} color="#f97316" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>SuperAdmin Reversion Control</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Revert and restore pre-rollover active meetings, trainings, settings, and member points</p>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(249, 115, 22, 0.04)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#f97316', letterSpacing: '1px', textTransform: 'uppercase' }}>Available Restore Point</div>
                        <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 800 }}>
                            Last Semester: <span style={{ color: '#f97316' }}>{backupInfo?.current_semester || 'Unknown'}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>
                            Rolled over by: <strong>{backupInfo?.initiatedBy || 'SYSTEM'}</strong>
                            <br />
                            Time: <strong>{backupInfo?.timestamp ? new Date(backupInfo.timestamp).toLocaleString() : 'N/A'}</strong>
                        </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        Restoring this rollback point will instantly overwrite all current student point balances back to their pre-rollover states, reactivate all sessions that were live during the rollover, and set settings back.
                    </p>

                    <div>
                        <button 
                            onClick={handleExecuteRollback}
                            disabled={rollbackLoading}
                            className="btn"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, #f97316 0%, #a83a03 100%)',
                                color: 'white',
                                borderColor: 'rgba(249, 115, 22, 0.3)',
                                fontWeight: 800,
                                letterSpacing: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                cursor: rollbackLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {rollbackLoading ? <Loader2 size={18} className="animate-spin" /> : <><RotateCcw size={18} /> Rollback Last Semester Rollover</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Multi-Step Rollover Wizard Modal overlay */}
            {showWizard && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2500,
                    background: 'rgba(2, 21, 37, 0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: '3rem 1rem',
                    overflowY: 'auto'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '500px',
                        width: '100%',
                        background: '#0d111b',
                        border: '1px solid rgba(37, 170, 225, 0.25)',
                        borderRadius: '1.5rem',
                        padding: '2.5rem 2rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                        position: 'relative'
                    }}>
                        {/* Header step visual */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {[1, 2, 3].map(stepNum => (
                                <div key={stepNum} style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: wizardStep === stepNum 
                                        ? 'rgba(37,170,225,0.2)' 
                                        : wizardStep > stepNum 
                                            ? 'rgba(74,222,128,0.1)' 
                                            : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${wizardStep === stepNum ? '#25AAE1' : wizardStep > stepNum ? '#4ade80' : 'rgba(255,255,255,0.08)'}`,
                                    color: wizardStep === stepNum ? '#25AAE1' : wizardStep > stepNum ? '#4ade80' : 'rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 900
                                }}>
                                    {stepNum}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Warning Card */}
                        {wizardStep === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', padding: '1rem', borderRadius: '0.75rem', color: '#f87171' }}>
                                    <AlertTriangle size={24} />
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>CRITICAL SYSTEM OPERATION WARNING</div>
                                </div>

                                <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                                    You are about to roll over the Doulos system to <strong>{semester.toUpperCase()}</strong>.
                                    <br /><br />
                                    This operation executes the following global changes:
                                </p>
                                
                                <ul style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <li>Closes and finalizes all active meetings & trainings of the past term.</li>
                                    <li>Resets all student point balances back to <strong>0</strong> (exempting test accounts).</li>
                                    <li>Triggers a custom spiritual <strong>Welcome Card</strong> upon the next check-in of all students, presenting the theme: <em>"{theme || 'None'}"</em>.</li>
                                </ul>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button 
                                        onClick={() => setShowWizard(false)}
                                        className="btn"
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.03)', color: 'white', borderColor: 'rgba(255,255,255,0.08)' }}
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        onClick={() => setWizardStep(2)}
                                        className="btn"
                                        style={{ flex: 1, background: 'rgba(239,68,68,0.05)', color: '#f87171', borderColor: 'rgba(239,68,68,0.15)', fontWeight: 800 }}
                                    >
                                        Proceed to Step 2
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Confirm Semester Name */}
                        {wizardStep === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(37,170,225,0.04)', border: '1px solid rgba(37,170,225,0.15)', padding: '1rem', borderRadius: '0.75rem', color: '#25AAE1' }}>
                                    <CheckSquare size={20} />
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Double-Check Confirmation</div>
                                </div>

                                <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                                    To protect against accidental triggers, please type the name of the new semester (<strong>{semester.toUpperCase()}</strong>) below to verify.
                                </p>

                                <input
                                    className="modern-input"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Type semester name here..."
                                    style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '1rem', fontWeight: 900 }}
                                />

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button 
                                        onClick={() => setWizardStep(1)}
                                        className="btn"
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.03)', color: 'white', borderColor: 'rgba(255,255,255,0.08)' }}
                                        disabled={rolloverLoading}
                                    >
                                        Back
                                    </button>
                                    <button 
                                        onClick={handleExecuteRollover}
                                        className="btn btn-primary"
                                        style={{ 
                                            flex: 1, 
                                            background: confirmText.trim().toUpperCase() === semester.trim().toUpperCase() ? 'linear-gradient(135deg, #25AAE1 0%, #175e82 100%) !important' : 'rgba(255,255,255,0.02) !important', 
                                            color: confirmText.trim().toUpperCase() === semester.trim().toUpperCase() ? 'white' : 'rgba(255,255,255,0.15)', 
                                            borderColor: confirmText.trim().toUpperCase() === semester.trim().toUpperCase() ? 'rgba(37,170,225,0.3)' : 'rgba(255,255,255,0.05)', 
                                            fontWeight: 800, 
                                            cursor: confirmText.trim().toUpperCase() === semester.trim().toUpperCase() ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            boxShadow: 'none !important'
                                        }}
                                        disabled={confirmText.trim().toUpperCase() !== semester.trim().toUpperCase() || rolloverLoading}
                                    >
                                        {rolloverLoading ? <Loader2 size={16} className="animate-spin" /> : 'Execute Rollover! 🚀'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Success Card */}
                        {wizardStep === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'rgba(74,222,128,0.05)',
                                    border: '1px solid rgba(74,222,128,0.2)',
                                    color: '#4ade80',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 0.5rem',
                                    boxShadow: '0 0 30px rgba(74,222,128,0.05)',
                                    animation: 'bounce 2.5s infinite'
                                }}>
                                    <Sparkles size={32} />
                                </div>

                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Rollover Completed!</h3>
                                <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
                                    The system was successfully rolled over.
                                    <br /><br />
                                    Active tracking semester is now set to <strong>{semester.toUpperCase()}</strong>.
                                    All student point balances are reset to <strong>0</strong>.
                                    Your custom welcome theme is live.
                                </p>

                                <button 
                                    onClick={() => {
                                        setShowWizard(false);
                                        window.location.reload(); // Reload dashboard to sync new settings
                                    }}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.6rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1rem' }}
                                >
                                    Complete & Refresh 🌟
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettingsTab;
