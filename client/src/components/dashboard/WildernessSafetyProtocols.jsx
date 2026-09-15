import React, { useState } from 'react';
import { 
    Shield, AlertTriangle, CheckCircle2, Phone, Compass, 
    FileText, Heart, Activity, CheckSquare, Square
} from 'lucide-react';

const WildernessSafetyProtocols = () => {
    const [checkedItems, setCheckedItems] = useState({});

    const toggleCheck = (id) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const CHECKLIST = [
        { id: 'c1', label: 'Dynamic & Static Rope Sheath Audit', desc: 'No core exposure, flat spots, or chemical contamination on any lifeline.' },
        { id: 'c2', label: 'Carabiner Gate Squeeze & Barrel Test', desc: 'All screw-gate and auto-lock carabiners inspected with physical pinch test.' },
        { id: 'c3', label: 'Facilitator & Participant Helmet Inspection', desc: 'Shell integrity intact, chin strap buckle snaps audibly, suspension dialed in.' },
        { id: 'c4', label: 'High Ropes Anchor Backup Verification', desc: 'Redundant anchor points with minimum 2 load-bearing slings per station.' },
        { id: 'c5', label: 'Trauma & Wilderness Medic Kit Stocking', desc: 'Pressure dressings, tourniquet, splints, burn gel, and oral rehydration salts present.' },
        { id: 'c6', label: 'Radio Handset Channel Synchronisation', desc: 'Base HQ, Ropes Hub, East Ridge, and Medic on dedicated VHF Channel 1.' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* CONSTITUTIONAL MANDATE BANNER */}
            <div style={{ 
                background: 'linear-gradient(135deg, #FFFFFF 0%, #021525 100%)', 
                border: '1px solid rgba(37, 170, 225, 0.25)', 
                borderRadius: '16px', 
                padding: '1.75rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ background: 'rgba(37, 170, 225, 0.15)', padding: '0.75rem', borderRadius: '12px', color: '#25AAE1' }}>
                        <Shield size={26} />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#25AAE1' }}>
                            DOULOS FOUNDATIONAL SAFETY CONSTITUTION
                        </span>
                        <h3 style={{ margin: '0.35rem 0 0.5rem 0', color: "#1E1B39", fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.3 }}>
                            "Outdoor ministry is not 'fun with Bible verses.' It is risk management + spiritual leadership. If we say we serve God, then excellence in safety is worship."
                        </h3>
                        <p style={{ margin: 0, color: "#7E7A9B", fontSize: '0.85rem' }}>
                            Spiritual intent does not replace physical competence. A dropped climber because of a sloppy belay is not an "unfortunate trial" — it is negligence in God's service.
                        </p>
                    </div>
                </div>
            </div>

            {/* 4 NON-NEGOTIABLE SAFETY LAWS */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', color: "#1E1B39", fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} style={{ color: '#fbbf24' }} />
                    The 4 Non-Negotiable Field Safety Guardrails
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <span style={{ background: 'rgba(37,170,225,0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>RULE 1</span>
                            2:1 Belay Buddy Mandate
                        </div>
                        <p style={{ margin: 0, color: "#7E7A9B", fontSize: '0.82rem', lineHeight: 1.45 }}>
                            Never belay alone on live high ropes. Every primary belayer MUST have a designated secondary belayer holding brake-hand backup or qualified spotter on station.
                        </p>
                    </div>

                    <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <span style={{ background: 'rgba(16,185,129,0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>RULE 2</span>
                            Double Squeeze Carabiner Test
                        </div>
                        <p style={{ margin: 0, color: "#7E7A9B", fontSize: '0.82rem', lineHeight: 1.45 }}>
                            Visual checks are insufficient in direct sunlight. Facilitators must physically squeeze the carabiner gate and attempt to turn the barrel before any participant leaves the platform.
                        </p>
                    </div>

                    <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ef4444', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <span style={{ background: 'rgba(239,68,68,0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>RULE 3</span>
                            No Solo Shadow Stations
                        </div>
                        <p style={{ margin: 0, color: "#7E7A9B", fontSize: '0.82rem', lineHeight: 1.45 }}>
                            Shadow Douloids are apprentices. They are constitutionally barred from primary belay certification or operating an initiative station without a Lead or Intermediate Douloid present.
                        </p>
                    </div>

                    <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a78bfa', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <span style={{ background: 'rgba(139,92,246,0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>RULE 4</span>
                            5-Min Wilderness Evacuation
                        </div>
                        <p style={{ margin: 0, color: "#7E7A9B", fontSize: '0.82rem', lineHeight: 1.45 }}>
                            If an emergency occurs on the Lukenya Ridge, the primary 4WD evac vehicle is staged at the Base pavilion with keys in ignition, and the rescue litter is deployed within 5 minutes.
                        </p>
                    </div>
                </div>
            </div>

            {/* PRE-CAMP FIELD INSPECTION CHECKLIST */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                            Pre-Deployment Rigging & Hardware Inspection Checklist
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                            Mandatory sign-off before participants step foot on Freedom Base ropes.
                        </p>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                        {Object.values(checkedItems).filter(Boolean).length} of {CHECKLIST.length} Inspected
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {CHECKLIST.map(item => {
                        const isChecked = !!checkedItems[item.id];
                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleCheck(item.id)}
                                style={{
                                    background: isChecked ? 'rgba(16,185,129,0.06)' : '#F8F8FC',
                                    border: isChecked ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '10px',
                                    padding: '0.9rem 1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{ color: isChecked ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
                                    {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: isChecked ? '#34d399' : 'white', fontWeight: 700, fontSize: '0.88rem' }}>
                                        {item.label}
                                    </div>
                                    <div style={{ color: "#7E7A9B", fontSize: '0.78rem', marginTop: '0.15rem' }}>
                                        {item.desc}
                                    </div>
                                </div>
                                {isChecked && (
                                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                                        CLEARED
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* EMERGENCY CONTACT DIRECTORY */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: "#1E1B39", fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={18} style={{ color: '#ef4444' }} />
                    Wilderness Rescue & Crisis Call Tree
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                    <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '10px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#25AAE1', fontWeight: 800, textTransform: 'uppercase' }}>
                            G5 TRAINING & SAFETY DIRECTOR
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: "#1E1B39", marginTop: '0.2rem' }}>
                            Seth Korir
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700, marginTop: '0.3rem' }}>
                            +254 700 000001 (Priority Satellite/Cell)
                        </div>
                    </div>

                    <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '10px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                            FREEDOM BASE MEDICAL OFFICER
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: "#1E1B39", marginTop: '0.2rem' }}>
                            Lukenya Wilderness Medic
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700, marginTop: '0.3rem' }}>
                            +254 700 000002
                        </div>
                    </div>

                    <div style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '10px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase' }}>
                            DAYSTAR ATHI RIVER SECURITY & AMBULANCE
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: "#1E1B39", marginTop: '0.2rem' }}>
                            Campus Emergency Dispatch
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700, marginTop: '0.3rem' }}>
                            +254 700 000003
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WildernessSafetyProtocols;
