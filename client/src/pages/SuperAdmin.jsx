import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Database, Zap, RefreshCw, AlertTriangle, Key, ArrowRight, Settings, Server, Lock, Globe, Plus, X } from 'lucide-react';
import api from '../api';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';

const SuperAdmin = () => {
    const [status, setStatus] = useState({
        recoveryMode: false,
        manualMaintenance: false,
        targetClusterUri: '',
        currentCluster: 'New (Temporary)'
    });
    const [loading, setLoading] = useState(false);
    const [merging, setMerging] = useState(false);
    const [backingUp, setBackingUp] = useState(false);
    const [unauthorized, setUnauthorized] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStatus = async () => {
            const role = localStorage.getItem('role');
            const token = localStorage.getItem('token');
            
            // If strictly no token or role, mark as unauthorized but don't kick out yet
            if (!token || !['admin', 'superadmin', 'developer', 'SuperAdmin'].includes(role)) {
                console.warn("Unauthorized access attempt:", role);
                setUnauthorized(true);
                return;
            }

            try {
                const res = await api.get('/auth/system-status');
                setStatus(res.data);
                setUnauthorized(false);
            } catch (err) {
                console.error("System Offline");
                // If it's a 401/403 from the server, then we are really unauthorized
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setUnauthorized(true);
                }
            }
        };
        fetchStatus();
    }, []);

    if (unauthorized) {
        return (
            <div style={{
                minHeight: '100vh', background: '#020617', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center'
            }}>
                <BackgroundGallery />
                <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <Shield size={60} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>ACCESS <span style={{ color: '#ef4444' }}>DENIED</span></h1>
                    <p style={{ opacity: 0.6, marginBottom: '2rem', lineHeight: '1.6' }}>
                        The Super Admin Command Center requires a higher level of authorization. Please login with a Super Admin account to continue.
                    </p>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="btn btn-primary"
                        style={{ padding: '1rem 2rem', borderRadius: '1rem', fontWeight: 800, width: '100%' }}
                    >
                        GO TO LOGIN
                    </button>
                </div>
            </div>
        );
    }

    const handleSaveConfig = async () => {
        setLoading(true);
        try {
            await api.post('/auth/system-config', status);
            setMessage({ type: 'success', text: 'Cluster Bridge Configuration Saved' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update configuration' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleRunMerge = async () => {
        if (!status.targetClusterUri) {
            alert("Please provide the Main Cluster URI first.");
            return;
        }

        if (!window.confirm("CRITICAL: You are about to merge the temporary data into the main cluster. This is permanent. Proceed?")) return;

        setMerging(true);
        setMessage({ type: 'info', text: 'Merge initiated. Moving student data...' });

        try {
            const res = await api.post('/auth/merge-clusters', { targetUri: status.targetClusterUri });
            setMessage({ type: 'success', text: res.data.message });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || "Merge process failed" });
        } finally {
            setMerging(false);
        }
    };

    const handleManualBackup = async () => {
        setBackingUp(true);
        setMessage({ type: 'info', text: 'Generating database dump...' });
        
        try {
            const res = await api.post('/auth/manual-backup');
            setMessage({ type: 'success', text: res.data.message });
        } catch (err) {
            setMessage({ type: 'error', text: 'Cloud Backup failed. Try "Download Snapshot" below to save to your PC instead.' });
        } finally {
            setBackingUp(false);
        }
    };

    const handleDownloadBackup = async () => {
        setLoading(true);
        setMessage({ type: 'info', text: 'Preparing registry snapshot...' });
        
        try {
            const res = await api.get('/auth/full-dump');
            
            const backupData = {
                timestamp: new Date().toISOString(),
                ...res.data
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Doulos_Snapshot_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setMessage({ type: 'success', text: 'Registry Snapshot downloaded successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Download failed: ' + (err.response?.data?.message || 'Check connection') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#020617',
            color: 'white',
            padding: '2rem',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            <BackgroundGallery />
            
            {/* Animated Glow Backdrops */}
            <div style={{
                position: 'fixed',
                top: '-10%',
                right: '-5%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(37, 170, 225, 0.15) 0%, transparent 70%)',
                zIndex: 0
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-10%',
                left: '-5%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 10, maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                            background: 'rgba(37, 170, 225, 0.1)', 
                            padding: '10px', 
                            borderRadius: '15px', 
                            border: '1px solid rgba(37, 170, 225, 0.2)' 
                        }}>
                            <Logo size={40} showText={false} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                SUPER <span style={{ color: '#25AAE1' }}>ADMIN</span>
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6, fontSize: '0.75rem' }}>
                                <Globe size={12} />
                                <span>SYSTEM COMMAND CENTER v3.0</span>
                            </div>
                        </div>
                    </div>
                </header>

                {message && (
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderRadius: '1rem',
                        background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        border: `1px solid ${message.type === 'error' ? '#ef4444' : '#22c55e'}`,
                        color: message.type === 'error' ? '#f87171' : '#4ade80',
                        marginBottom: '2rem',
                        animation: 'slideUp 0.3s ease-out',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <Shield size={20} />
                        <span style={{ fontWeight: 600 }}>{message.text}</span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    
                    {/* System Security Panel */}
                    <div className="glass-panel" style={{
                        padding: '2rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '2rem',
                        backdropFilter: 'blur(20px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <Lock size={24} color="#25AAE1" />
                            <h3 style={{ margin: 0, fontWeight: 800 }}>SYSTEM SECURITY</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Maintenance Mode</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Blocks student access with maintenance screen</div>
                                </div>
                                <button 
                                    onClick={() => setStatus({...status, manualMaintenance: !status.manualMaintenance})}
                                    style={{
                                        width: '50px',
                                        height: '26px',
                                        borderRadius: '20px',
                                        background: status.manualMaintenance ? '#ef4444' : '#334155',
                                        border: 'none',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: '0.3s'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: '3px',
                                        left: status.manualMaintenance ? '27px' : '3px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        transition: '0.3s'
                                    }} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recovery Mode</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Pins the recovery banner & hides consistency</div>
                                </div>
                                <button 
                                    onClick={() => setStatus({...status, recoveryMode: !status.recoveryMode})}
                                    style={{
                                        width: '50px',
                                        height: '26px',
                                        borderRadius: '20px',
                                        background: status.recoveryMode ? '#25AAE1' : '#334155',
                                        border: 'none',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: '0.3s'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: '3px',
                                        left: status.recoveryMode ? '27px' : '3px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        transition: '0.3s'
                                    }} />
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveConfig}
                            disabled={loading}
                            style={{
                                width: '100%',
                                marginTop: '2rem',
                                padding: '1rem',
                                background: '#25AAE1',
                                border: 'none',
                                borderRadius: '1rem',
                                color: 'white',
                                fontWeight: 800,
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 10px 20px rgba(37, 170, 225, 0.2)'
                            }}
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Shield size={18} />}
                            DEPLOY SECURITY PATCH
                        </button>
                    </div>

                    {/* Cluster Bridge Panel */}
                    <div className="glass-panel" style={{
                        padding: '2rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '2rem',
                        backdropFilter: 'blur(20px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <Server size={24} color="#8b5cf6" />
                            <h3 style={{ margin: 0, fontWeight: 800 }}>CLUSTER BRIDGE</h3>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.7 }}>Active Cluster</div>
                            <div style={{ 
                                padding: '0.75rem 1rem', 
                                background: 'rgba(34, 197, 94, 0.1)', 
                                border: '1px solid #22c55e', 
                                borderRadius: '10px',
                                color: '#4ade80',
                                fontSize: '0.85rem',
                                fontWeight: 700
                            }}>
                                {status.currentCluster} (Connected)
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.7 }}>Target Main Cluster URI</div>
                            <textarea 
                                value={status.targetClusterUri}
                                onChange={(e) => setStatus({...status, targetClusterUri: e.target.value})}
                                placeholder="mongodb+srv://..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        <div style={{
                            padding: '1rem',
                            background: 'rgba(234, 179, 8, 0.1)',
                            borderRadius: '10px',
                            border: '1px solid rgba(234, 179, 8, 0.3)',
                            fontSize: '0.7rem',
                            color: '#fbbf24',
                            display: 'flex',
                            gap: '0.75rem'
                        }}>
                             <AlertTriangle size={18} />
                             <span>Important: Point this to your main MongoDB Atlas cluster once it recovers. This will be used for the final merge.</span>
                        </div>
                    </div>

                    {/* Data Security Panel */}
                    <div className="glass-panel" style={{
                        padding: '2rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '2rem',
                        backdropFilter: 'blur(20px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <Zap size={24} color="#facc15" />
                            <h3 style={{ margin: 0, fontWeight: 800 }}>DATA SECURITY</h3>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Automated Nightly Backup</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: '1.5' }}>
                                The system is programmed to take a full snapshot of the temporary cluster at **00:00 EAT** every night and upload it to your Google Drive folder.
                            </div>
                        </div>

                        <div style={{ 
                            padding: '1.25rem', 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            borderRadius: '1.25rem',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }}></div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>GITHUB SYNC ENGINE: ACTIVE</span>
                            </div>
                            
                            <button 
                                onClick={handleManualBackup}
                                disabled={backingUp}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    background: 'rgba(250, 204, 21, 0.15)',
                                    border: '1px solid rgba(250, 204, 21, 0.3)',
                                    borderRadius: '0.75rem',
                                    color: '#facc15',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: '0.3s'
                                }}
                            >
                                {backingUp ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                                RUN CLOUD BACKUP
                            </button>

                            <button 
                                onClick={handleDownloadBackup}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    background: 'rgba(37, 170, 225, 0.1)',
                                    border: '1px solid rgba(37, 170, 225, 0.2)',
                                    borderRadius: '0.75rem',
                                    color: '#25AAE1',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: '0.3s'
                                }}
                            >
                                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
                                DOWNLOAD SNAPSHOT (.JSON)
                            </button>
                        </div>
                    </div>

                </div>

                {/* Master Merge Action */}
                <div style={{ marginTop: '2rem' }}>
                    <button 
                        onClick={handleRunMerge}
                        disabled={merging || !status.recoveryMode}
                        style={{
                            width: '100%',
                            padding: '1.5rem',
                            background: status.recoveryMode ? 'linear-gradient(90deg, #25AAE1 0%, #8b5cf6 100%)' : '#334155',
                            border: 'none',
                            borderRadius: '2rem',
                            color: 'white',
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            letterSpacing: '2px',
                            cursor: status.recoveryMode ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem',
                            boxShadow: status.recoveryMode ? '0 20px 40px rgba(37, 170, 225, 0.3)' : 'none',
                            transition: '0.3s'
                        }}
                    >
                        {merging ? (
                            <RefreshCw className="animate-spin" size={24} />
                        ) : (
                            <>
                                <Database size={24} />
                                START MASTER SYNC & MERGE
                                <ArrowRight size={24} />
                            </>
                        )}
                    </button>
                    {!status.recoveryMode && (
                        <p style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.5, marginTop: '1rem' }}>
                            Merge can only be triggered while System Recovery Mode is ACTIVE.
                        </p>
                    )}
                </div>

            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                .glass-panel:hover {
                    border-color: rgba(37, 170, 225, 0.3) !important;
                    transition: 0.3s;
                }
            `}</style>
        </div>
    );
};

export default SuperAdmin;
