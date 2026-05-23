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
    api 
}) => {
    const [semester, setSemester] = useState('MAY-AUG 2026');
    const [theme, setTheme] = useState('');
    const [verse, setVerse] = useState('');
    const [guestAccess, setGuestAccess] = useState('true');
    const [waLink, setWaLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});

    // Rollover Console Wizard state
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1); // 1: Warning, 2: Text Confirmation, 3: Success
    const [confirmText, setConfirmText] = useState('');
    const [rolloverLoading, setRolloverLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const [semRes, guestRes, waRes, themeRes, verseRes] = await Promise.all([
                    api.get('/settings/current_semester'),
                    api.get('/settings/guest_features'),
                    api.get('/settings/whatsapp_link'),
                    api.get('/settings/semester_theme'),
                    api.get('/settings/semester_verse')
                ]);
                if (semRes.data?.value) setSemester(semRes.data.value);
                if (guestRes.data?.value) setGuestAccess(guestRes.data.value);
                if (waRes.data?.value) setWaLink(waRes.data.value);
                if (themeRes.data?.value) setTheme(themeRes.data.value);
                if (verseRes.data?.value) setVerse(verseRes.data.value);
            } catch (err) {
                console.error("Failed to fetch system settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [api]);

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
            <div className="glass-card-premium" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(29,166,217,0.08) 0%, rgba(2,21,37,0.92) 100%)', border: '1px solid rgba(29,166,217,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(29,166,217,0.15)', borderRadius: '1rem', border: '1px solid rgba(29,166,217,0.25)' }}>
                        <SettingsIcon size={28} color="#1da6d9" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1da6d9', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>CONTROL PANEL</div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>Global Settings & Semester Rollover</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Configure system parameters and perform clean academic transitions</p>
                    </div>
                </div>
            </div>

            {/* Settings Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* WhatsApp Link Card */}
                <div className="setting-card" style={{ borderLeft: '4px solid #4ade80', background: 'rgba(9, 29, 46, 0.4)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.7rem', background: 'rgba(74,222,128,0.1)', borderRadius: '0.75rem' }}>
                            <LinkIcon size={20} color="#4ade80" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>G9 Group / Support Link</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>WhatsApp community or support URL</div>
                        </div>
                    </div>
                    <input
                        style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '0.6rem', color: 'white', outline: 'none', fontSize: '0.85rem', marginBottom: '1rem', boxSizing: 'border-box' }}
                        value={waLink}
                        onChange={(e) => setWaLink(e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                    />
                    <button
                        className="btn"
                        style={{ width: '100%', padding: '0.7rem', background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        onClick={() => handleSave('whatsapp_link', waLink)}
                    >
                        {saving.whatsapp_link ? <><RotateCcw size={15} className="animate-spin" /> Saving...</> : <><CheckCircle size={15} /> Update Link</>}
                    </button>
                </div>

                {/* Guest Access Card */}
                <div className="setting-card" style={{ borderLeft: `4px solid ${guestAccess === 'true' ? '#4ade80' : '#f87171'}`, background: 'rgba(9, 29, 46, 0.4)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.7rem', background: guestAccess === 'true' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', borderRadius: '0.75rem' }}>
                            <ShieldAlert size={20} color={guestAccess === 'true' ? '#4ade80' : '#f87171'} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Public Guest Access</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>Show guest login link on public pages</div>
                        </div>
                    </div>
                    <select
                        style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: `1px solid ${guestAccess === 'true' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: '0.6rem', color: 'white', outline: 'none', fontSize: '0.88rem', marginBottom: '1rem' }}
                        value={guestAccess}
                        onChange={(e) => setGuestAccess(e.target.value)}
                    >
                        <option value="true">Enabled (Allow Guest Link on Login)</option>
                        <option value="false">Disabled (Private Only)</option>
                    </select>
                    <button
                        className="btn"
                        style={{ width: '100%', padding: '0.7rem', background: guestAccess === 'true' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.1)', color: guestAccess === 'true' ? '#4ade80' : '#f87171', border: `1px solid ${guestAccess === 'true' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.2)'}`, borderRadius: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        onClick={() => handleSave('guest_features', guestAccess)}
                    >
                        {saving.guest_features ? <><RotateCcw size={15} className="animate-spin" /> Saving...</> : <><CheckCircle size={15} /> Update Policy</>}
                    </button>
                </div>
            </div>

            {/* Semester Rollover Configuration Wizard */}
            <div className="glass-card-premium" style={{ 
                borderLeft: '4px solid #3b82f6', 
                background: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(9,29,46,0.6) 100%)',
                padding: '2rem',
                borderRadius: '1.25rem',
                border: '1px solid rgba(59,130,246,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.15)', borderRadius: '0.75rem' }}>
                        <Calendar size={22} color="#3b82f6" />
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
                            style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.6rem', color: 'white', outline: 'none' }}
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
                            style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.6rem', color: 'white', outline: 'none' }}
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
                            style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.6rem', color: 'white', outline: 'none' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>Companion scripture displaying spiritual focus</span>
                    </div>
                </div>

                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                    <button 
                        onClick={handleStartRollover}
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: '1px solid rgba(37,99,235,0.4)',
                            borderRadius: '0.75rem',
                            fontWeight: 900,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            boxShadow: '0 8px 25px rgba(37,99,235,0.2)'
                        }}
                    >
                        <RotateCcw size={18} /> Initiate Semester Rollover Wizard
                    </button>
                </div>
            </div>

            {/* Multi-Step Rollover Wizard Modal overlay */}
            {showWizard && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2500,
                    background: 'rgba(2, 21, 37, 0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '500px',
                        width: '100%',
                        background: 'linear-gradient(135deg, rgba(9, 29, 46, 0.96) 0%, rgba(2, 21, 37, 0.98) 100%)',
                        border: '2px solid rgba(59, 130, 246, 0.35)',
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
                                        ? 'rgba(59,130,246,0.8)' 
                                        : wizardStep > stepNum 
                                            ? 'rgba(74,222,128,0.2)' 
                                            : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${wizardStep === stepNum ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                                    color: wizardStep >= stepNum ? 'white' : 'rgba(255,255,255,0.3)',
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', padding: '1rem', borderRadius: '0.75rem', color: '#f87171' }}>
                                    <AlertTriangle size={24} />
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>CRITICAL SYSTEM OPERATION WARNING</div>
                                </div>

                                <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                                    You are about to roll over the Doulos system to <strong>{semester.toUpperCase()}</strong>.
                                    <br /><br />
                                    This operation executes the following global changes:
                                </p>
                                
                                <ul style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <li>Closes and finalizes all active meetings & trainings of the past term.</li>
                                    <li>Resets all student point balances back to <strong>0</strong> (exempting test accounts).</li>
                                    <li>Triggers a custom spiritual <strong>Welcome Card</strong> upon the next check-in of all students, presenting the theme: <em>"{theme || 'None'}"</em>.</li>
                                </ul>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button 
                                        onClick={() => setShowWizard(false)}
                                        style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        onClick={() => setWizardStep(2)}
                                        style={{ flex: 1, padding: '0.75rem', background: '#dc2626', color: 'white', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '0.6rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Proceed to Step 2
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Confirm Semester Name */}
                        {wizardStep === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', padding: '1rem', borderRadius: '0.75rem', color: '#60a5fa' }}>
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
                                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.6rem', color: 'white', outline: 'none', textAlign: 'center', fontSize: '1rem', fontWeight: 900 }}
                                />

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button 
                                        onClick={() => setWizardStep(1)}
                                        style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem', fontWeight: 700, cursor: 'pointer' }}
                                        disabled={rolloverLoading}
                                    >
                                        Back
                                    </button>
                                    <button 
                                        onClick={handleExecuteRollover}
                                        style={{ 
                                            flex: 1, 
                                            padding: '0.75rem', 
                                            background: confirmText.trim().toUpperCase() === semester.trim().toUpperCase() ? '#2563eb' : 'rgba(59,130,246,0.1)', 
                                            color: confirmText.trim().toUpperCase() === semester.trim().toUpperCase() ? 'white' : 'rgba(255,255,255,0.2)', 
                                            border: '1px solid rgba(37,99,235,0.3)', 
                                            borderRadius: '0.6rem', 
                                            fontWeight: 800, 
                                            cursor: confirmText.trim().toUpperCase() === semester.trim().toUpperCase() ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItem: 'center', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'rgba(74,222,128,0.15)',
                                    border: '2px solid rgba(74,222,128,0.3)',
                                    color: '#4ade80',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 0.5rem',
                                    boxShadow: '0 0 30px rgba(74,222,128,0.15)',
                                    animation: 'bounce 2.5s infinite'
                                }}>
                                    <Sparkles size={32} />
                                </div>

                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Rollover Completed!</h3>
                                <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0 }}>
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
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.6rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1rem', cursor: 'pointer' }}
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
