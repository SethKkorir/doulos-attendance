import React, { useState, useEffect } from 'react';
import { 
    Layers, AlertTriangle, ShieldCheck, Plus, CheckCircle2, 
    Clock, Droplet, Wrench, RefreshCw, X, ShieldAlert
} from 'lucide-react';
import defaultApi from '../../api';

const G8AssetsConsole = ({ api, setMsg, isGuest, onOpenRequisitionModal }) => {
    const client = api || defaultApi;
    const notify = (msg) => {
        if (typeof setMsg === 'function') setMsg(msg);
        else console.log('[G8Assets]', msg);
    };

    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewAssetModal, setShowNewAssetModal] = useState(false);
    const [inspectingAsset, setInspectingAsset] = useState(null);
    
    const [newAssetForm, setNewAssetForm] = useState({
        serialNumber: '',
        name: '',
        category: 'Dynamic Rope',
        brand: 'Beal / Petzl',
        lifespanYears: 5,
        maxLoadCycles: 100,
        assignedLocation: 'Freedom Base Ropes Shed',
        campus: 'Freedom Base'
    });

    const [inspectionForm, setInspectionForm] = useState({
        passed: true,
        barrelTurnsFreely: true,
        sheathIntact: true,
        webbingIntact: true,
        notes: '',
        cycleIncrement: 1
    });

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await client.get('/council/assets');
            setAssets(res.data);
        } catch (err) {
            console.error('Error fetching gear assets:', err);
            notify({ type: 'error', text: 'Failed to load equipment assets' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleCreateAsset = async (e) => {
        e.preventDefault();
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        try {
            const res = await client.post('/council/assets', newAssetForm);
            notify({ type: 'success', text: res.data.message });
            setShowNewAssetModal(false);
            fetchAssets();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to register gear' });
        }
    };

    const handleSaveInspection = async (e) => {
        e.preventDefault();
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        if (!inspectingAsset) return;

        try {
            const res = await client.post(`/council/assets/${inspectingAsset._id}/inspect`, inspectionForm);
            notify({ type: 'success', text: res.data.message });
            setInspectingAsset(null);
            fetchAssets();
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to log inspection' });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* G8 HEADER */}
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
                        <Layers size={18} style={{ color: '#fbbf24' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#fbbf24' }}>
                            G8 ASSETS & FREEDOM BASE STEWARDSHIP
                        </span>
                    </div>
                    <h3 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.3rem' }}>
                        Climbing Gear Retirement Clocks & 10-Acre Tree Care
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: "#7E7A9B", fontSize: '0.82rem' }}>
                        Life-safety asset cycles (5-yr / 100-drop limits), inspection logs, and tree watering rotas.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setShowNewAssetModal(true)}
                        className="btn"
                        style={{ background: "#4B3F8C", color: "#1E1B39", fontWeight: 800, padding: '0.55rem 1rem', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                    >
                        <Plus size={16} />
                        <span>Register Gear</span>
                    </button>
                </div>
            </div>

            {/* GEAR RETIREMENT RADAR GRID (US-G8-009) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem' }}>
                        Active Life-Safety Inventory & Retirement Clocks ({assets.length})
                    </h4>
                </div>

                {loading ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: "#7E7A9B" }}>
                        Loading Gear Assets...
                    </div>
                ) : assets.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: "#7E7A9B" }}>
                        No gear registered yet. Click "Register Gear" above.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                        {assets.map((asset) => (
                            <div
                                key={asset._id}
                                style={{
                                    background: '#F8F8FC',
                                    border: asset.requiresDecommission ? '1.5px solid #ef4444' : '1px solid #EBEBF2',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '1rem'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                        <code style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(37,170,225,0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                            {asset.serialNumber}
                                        </code>
                                        <span style={{ 
                                            background: asset.requiresDecommission ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                                            color: asset.requiresDecommission ? '#ef4444' : '#10b981',
                                            fontSize: '0.68rem',
                                            fontWeight: 900,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {asset.requiresDecommission ? 'DECOMMISSION REQUIRED' : asset.status}
                                        </span>
                                    </div>

                                    <h5 style={{ margin: '0.35rem 0 0 0', color: "#1E1B39", fontWeight: 800, fontSize: '1rem' }}>
                                        {asset.name}
                                    </h5>
                                    <div style={{ fontSize: '0.75rem', color: "#7E7A9B", marginTop: '0.15rem' }}>
                                        {asset.category} • Brand: {asset.brand}
                                    </div>

                                    {/* Retirement Clocks (Age & Cycles) */}
                                    <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: "#7E7A9B", marginBottom: '0.2rem' }}>
                                                <span>Chronological Lifespan ({asset.lifespanYears} Yrs Max):</span>
                                                <span style={{ color: asset.isAgeExceeded ? '#ef4444' : 'white', fontWeight: 700 }}>
                                                    {asset.ageYears} Yrs Elapsed
                                                </span>
                                            </div>
                                            <div style={{ width: '100%', height: '4px', background: '#EBEBF2', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(100, (asset.ageYears / asset.lifespanYears) * 100)}%`, height: '100%', background: asset.isAgeExceeded ? '#ef4444' : '#25AAE1' }} />
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: "#7E7A9B", marginBottom: '0.2rem' }}>
                                                <span>Load Cycles Count ({asset.maxLoadCycles} Max):</span>
                                                <span style={{ color: asset.isCyclesExceeded ? '#ef4444' : 'white', fontWeight: 700 }}>
                                                    {asset.loadCyclesCount} / {asset.maxLoadCycles} Cycles
                                                </span>
                                            </div>
                                            <div style={{ width: '100%', height: '4px', background: '#EBEBF2', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(100, (asset.loadCyclesCount / asset.maxLoadCycles) * 100)}%`, height: '100%', background: asset.isCyclesExceeded ? '#ef4444' : '#fbbf24' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #EBEBF2' }}>
                                    <button
                                        onClick={() => {
                                            setInspectingAsset(asset);
                                            setInspectionForm({ passed: true, barrelTurnsFreely: true, sheathIntact: true, webbingIntact: true, notes: '', cycleIncrement: 1 });
                                        }}
                                        className="btn"
                                        style={{ flex: 1, background: '#1e293b', color: "#1E1B39", border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.45rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                                    >
                                        <Wrench size={13} style={{ color: '#25AAE1' }} />
                                        <span>Log Inspection</span>
                                    </button>

                                    {asset.requiresDecommission && (
                                        <button
                                            onClick={() => onOpenRequisitionModal && onOpenRequisitionModal(asset.serialNumber)}
                                            className="btn"
                                            style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.45rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                                        >
                                            <ShieldAlert size={13} />
                                            <span>Retire & Requisition</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FREEDOM BASE 10-ACRE TREE WATERING SQUAD ROTA */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Droplet size={16} style={{ color: '#38bdf8' }} />
                            Freedom Base 10-Acre Tree Watering Rotational Calendar
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                            Weekly environmental stewardship assignments by squads.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>{day}</div>
                            <div style={{ fontSize: '0.7rem', color: "#7E7A9B", marginTop: '0.3rem' }}>
                                Squad {day.slice(0, 3)} Rotation
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: '0.4rem', fontWeight: 700 }}>
                                Active Shift
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL: LOG INSPECTION */}
            {inspectingAsset && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(46, 42, 77, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0, color: "#1E1B39", fontWeight: 800 }}>Gear Inspection Sign-Off</h3>
                                <p style={{ margin: '0.2rem 0 0 0', color: '#38bdf8', fontSize: '0.8rem' }}>{inspectingAsset.name} ({inspectingAsset.serialNumber})</p>
                            </div>
                            <button onClick={() => setInspectingAsset(null)} style={{ background: 'transparent', border: 'none', color: "#7E7A9B", cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveInspection} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F8FC', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.82rem', color: "#1E1B39", fontWeight: 600 }}>Mechanical Integrity Check</span>
                                <input
                                    type="checkbox"
                                    checked={inspectionForm.passed}
                                    onChange={(e) => setInspectionForm({ ...inspectionForm, passed: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.3rem' }}>INCREMENT LOAD CYCLES</label>
                                <input
                                    type="number"
                                    value={inspectionForm.cycleIncrement}
                                    onChange={(e) => setInspectionForm({ ...inspectionForm, cycleIncrement: Number(e.target.value) })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.3rem' }}>INSPECTION NOTES</label>
                                <textarea
                                    rows="2"
                                    placeholder="Barrel turns freely, no sheath fuzz or core damage..."
                                    value={inspectionForm.notes}
                                    onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setInspectingAsset(null)} className="btn" style={{ background: 'transparent', color: "#7E7A9B", border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.5rem 1rem' }}>Cancel</button>
                                <button type="submit" className="btn" style={{ background: '#10b981', color: "#1E1B39", fontWeight: 800, border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem' }}>Save Sign-Off</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: REGISTER NEW ASSET */}
            {showNewAssetModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(46, 42, 77, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '1.75rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: "#1E1B39", fontWeight: 800 }}>Register Gear Asset</h3>
                        <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.2rem' }}>SERIAL NUMBER / BARCODE</label>
                                <input
                                    type="text"
                                    placeholder="ROPE-2026-001"
                                    value={newAssetForm.serialNumber}
                                    onChange={(e) => setNewAssetForm({ ...newAssetForm, serialNumber: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.2rem' }}>GEAR NAME</label>
                                <input
                                    type="text"
                                    placeholder="Beal Top Gun 10.5mm Dynamic Rope"
                                    value={newAssetForm.name}
                                    onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.2rem' }}>CATEGORY</label>
                                    <select
                                        value={newAssetForm.category}
                                        onChange={(e) => setNewAssetForm({ ...newAssetForm, category: e.target.value })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px' }}
                                    >
                                        <option value="Dynamic Rope">Dynamic Rope</option>
                                        <option value="Static Rope">Static Rope</option>
                                        <option value="Harness">Harness</option>
                                        <option value="Carabiner">Carabiner</option>
                                        <option value="Helmet">Helmet</option>
                                        <option value="Hardware/Belay Device">Hardware/Belay Device</option>
                                        <option value="Ladders/Litter">Ladders/Litter</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.2rem' }}>LIFESPAN (YEARS)</label>
                                    <input
                                        type="number"
                                        value={newAssetForm.lifespanYears}
                                        onChange={(e) => setNewAssetForm({ ...newAssetForm, lifespanYears: Number(e.target.value) })}
                                        style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowNewAssetModal(false)} className="btn" style={{ background: 'transparent', color: "#7E7A9B", border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.5rem 1rem' }}>Cancel</button>
                                <button type="submit" className="btn" style={{ background: "#4B3F8C", color: "#1E1B39", fontWeight: 800, border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem' }}>Register Asset</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G8AssetsConsole;
