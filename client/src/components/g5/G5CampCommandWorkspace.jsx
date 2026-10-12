import React, { useState } from 'react';
import {
    Tent,
    Calendar,
    Clock,
    MapPin,
    Shield,
    Users,
    CheckCircle2,
    Layers,
    CreditCard,
    Plus,
    AlertTriangle,
    FileText,
    ChevronRight,
    Award
} from 'lucide-react';
import CampScheduleStudio from '../dashboard/CampScheduleStudio';

const G5CampCommandWorkspace = ({
    campProgram,
    cadres = [],
    meetings = [],
    gearAssets = [],
    campusFilter = 'All',
    api,
    showToast
}) => {
    const [campTab, setCampTab] = useState('overview'); // 'overview', 'schedule', 'people', 'stations', 'gear', 'safety', 'contributions'
    
    const camp = campProgram || {
        title: 'Freedom Base 3-Day Leadership & Wilderness Ropes Camp',
        semester: 'MAY-AUG 2026',
        campus: 'Both',
        startDate: new Date('2026-10-20'),
        endDate: new Date('2026-10-23'),
        theme: 'Anchored in Competence, Formed in Faith'
    };

    const dutyStations = campProgram?.dutyRoster || [
        {
            stationName: 'Station 1: High Ropes Belay Course',
            location: 'Freedom Base Rigging Hub',
            stationLead: 'Seth Kipchumba',
            stationLeadRank: 'Lead Douloid',
            primaryBelayer: 'Brian Kibet',
            primaryBelayerRank: 'Intermediate Douloid',
            secondaryBelayer: 'Kelvin Mwangi',
            secondaryBelayerRank: 'Basic Douloid',
            spotter: 'Alex Tanui',
            spotterRank: 'Shadow Douloid',
            safetyCleared: true
        },
        {
            stationName: 'Station 2: Wilderness Navigation & Orienteering',
            location: 'Lukenya Ridge Trail',
            stationLead: 'Faith Jepkorir',
            stationLeadRank: 'Lead Douloid',
            primaryBelayer: 'Emmanuel Mutua',
            primaryBelayerRank: 'Intermediate Douloid',
            secondaryBelayer: 'Mercy Achieng',
            secondaryBelayerRank: 'Basic Douloid',
            spotter: 'David Omondi',
            spotterRank: 'Shadow Douloid',
            safetyCleared: true
        },
        {
            stationName: 'Station 3: Pamper Pole & Leap of Faith',
            location: 'Freedom Base Solo Rig',
            stationLead: 'Joshua Ndirangu',
            stationLeadRank: 'Lead Douloid',
            primaryBelayer: 'Dennis Korir',
            primaryBelayerRank: 'Intermediate Douloid',
            secondaryBelayer: 'Grace Wanjiku',
            secondaryBelayerRank: 'Basic Douloid',
            spotter: 'Sarah Chebet',
            spotterRank: 'Shadow Douloid',
            safetyCleared: true
        }
    ];

    const emergencyContacts = campProgram?.emergencyContacts || [
        { role: 'Incident Commander', name: 'Seth Kipchumba (G5 Director)', phone: '+254 712 345 678' },
        { role: 'Field Paramedic / First Aid Lead', name: 'Daystar University Health Clinic', phone: '+254 700 000 112' },
        { role: 'Machakos County Wilderness Dispatch', name: 'Emergency Services Line', phone: '999 / 112' }
    ];

    const gearOperationalCount = gearAssets.filter(a => a.status === 'Operational').length;
    const gearPct = gearAssets.length > 0 ? Math.round((gearOperationalCount / gearAssets.length) * 100) : 84;

    return (
        <div className="g5-camp-command-workspace">
            {/* CAMP HEADER BANNER */}
            <div style={{ background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: '18px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <span className="g5-chip g5-chip-upcoming">CAMP COMMAND CENTRE</span>
                            <span style={{ fontSize: '0.8rem', color: '#1D4ED8', fontWeight: 700 }}>
                                {camp.semester || 'Active Semester'} • Oct 20–23, 2026
                            </span>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                            {camp.title}
                        </h2>
                        <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                            Theme: "{camp.theme}"
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>OVERALL READINESS</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1D4ED8' }}>91%</div>
                        </div>
                        <span className="g5-chip g5-chip-ready" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                            ✓ FIELD READY
                        </span>
                    </div>
                </div>

                {/* 7 COMMAND SUBTABS */}
                <div className="g5-subtab-bar" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                    {[
                        { key: 'overview', label: 'Overview', icon: Tent },
                        { key: 'schedule', label: 'Schedule Studio', icon: Calendar },
                        { key: 'people', label: 'People (68)', icon: Users },
                        { key: 'stations', label: 'Stations (3)', icon: Award },
                        { key: 'gear', label: 'Gear Readiness', icon: Layers },
                        { key: 'safety', label: 'Safety Protocols', icon: Shield },
                        { key: 'contributions', label: 'Contributions (73%)', icon: CreditCard }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = campTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                className={`g5-subtab-btn ${isActive ? 'active' : ''}`}
                                onClick={() => setCampTab(tab.key)}
                            >
                                <Icon size={15} /> {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB 1: OVERVIEW */}
            {campTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>TOTAL REGISTERED</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', marginTop: '0.3rem' }}>68</div>
                            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>61 Confirmed Payments</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>DUTY STATIONS</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.3rem' }}>{dutyStations.length} Stations</div>
                            <div style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 700, marginTop: '0.2rem' }}>All Stations Staffed</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>GEAR READINESS</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.3rem' }}>{gearPct}%</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginTop: '0.2rem' }}>112 / 120 Assets Inspected</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>SAFETY CLEARANCE</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.3rem' }}>CLEAR</div>
                            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>LOP Protocols Active</div>
                        </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', color: '#0F172A' }}>
                            Operational Camp Readiness Index
                        </h3>
                        <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                            <div style={{ width: '91%', height: '100%', background: 'linear-gradient(90deg, #1D4ED8, #059669)', borderRadius: '999px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.84rem' }}>
                            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 800, color: '#0F172A' }}>✓ Safety Protocols & Medical Tree</div>
                                <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.78rem' }}>100% Certified & Approved</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 800, color: '#0F172A' }}>✓ 3-Day Schedule Studio</div>
                                <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.78rem' }}>Published & Synchronized</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 800, color: '#0F172A' }}>Gear Logistics Audit</div>
                                <div style={{ color: '#1D4ED8', fontWeight: 700, fontSize: '0.78rem' }}>84% Complete (8 Assets Due)</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 800, color: '#0F172A' }}>Camp Contributions Ledger</div>
                                <div style={{ color: '#D97706', fontWeight: 700, fontSize: '0.78rem' }}>73% Collected (KSh 87,500)</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: SCHEDULE STUDIO */}
            {campTab === 'schedule' && (
                <div>
                    <CampScheduleStudio
                        api={api}
                        campus={campusFilter === 'All' ? 'Both' : campusFilter}
                        cadres={cadres}
                        meetings={meetings}
                        showToast={showToast}
                    />
                </div>
            )}

            {/* TAB 3: PEOPLE */}
            {campTab === 'people' && (
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Registered Camp Personnel (68)</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                                Filter participants by rank, clearance and payment confirmation
                            </p>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>Participant</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Rank / Role</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Campus</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Safety Clearance</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Contribution Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadres.slice(0, 10).map((c, idx) => (
                                    <tr key={c._id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                                            {c.name}
                                            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>{c.studentRegNo}</div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <span className="g5-chip g5-chip-upcoming">{c.douloidRank || 'Recruit'}</span>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                                            {c.campus || 'Athi River'}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <span className="g5-chip g5-chip-active">✓ Cleared</span>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <span className="g5-chip g5-chip-paid">Paid (KSh 1,500)</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: STATIONS */}
            {campTab === 'stations' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {dutyStations.map((st, idx) => (
                        <div key={idx} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #BFDBFE', padding: '1.25rem', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                                    {st.stationName}
                                </h4>
                                <span className="g5-chip g5-chip-active">✓ Safety Cleared</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                                <MapPin size={14} color="#1D4ED8" />
                                <span>{st.location}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <div><strong>Station Lead:</strong> {st.stationLead} ({st.stationLeadRank})</div>
                                <div><strong>Primary Belayer:</strong> {st.primaryBelayer} ({st.primaryBelayerRank})</div>
                                <div><strong>Secondary Belayer:</strong> {st.secondaryBelayer} ({st.secondaryBelayerRank})</div>
                                <div><strong>Spotter:</strong> {st.spotter} ({st.spotterRank})</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 5: GEAR */}
            {campTab === 'gear' && (
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem' }}>Camp Hardware Inventory Audit</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        {[
                            { name: 'Dynamic Ropes (10.2mm)', required: 12, available: 12, status: 'Ready' },
                            { name: 'Static Rigging Ropes (11mm)', required: 8, available: 8, status: 'Ready' },
                            { name: 'High Ropes Sit Harnesses', required: 45, available: 42, status: 'Needs 3' },
                            { name: 'Climbing Helmets', required: 45, available: 45, status: 'Ready' },
                            { name: 'Locking Carabiners (Triact)', required: 60, available: 58, status: 'Needs 2' },
                            { name: 'Wilderness Trauma First Aid Kit', required: 3, available: 3, status: 'Ready' }
                        ].map((g, i) => (
                            <div key={i} style={{ padding: '0.85rem', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#F8FAFC' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>{g.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                                    Required: {g.required} • Available: {g.available}
                                </div>
                                <span className={`g5-chip ${g.status === 'Ready' ? 'g5-chip-active' : 'g5-chip-attention'}`} style={{ marginTop: '0.45rem' }}>
                                    {g.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 6: SAFETY */}
            {campTab === 'safety' && (
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', color: '#0F172A' }}>
                        Camp Safety Protocols & Emergency Contacts
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {emergencyContacts.map((c, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{c.role}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>{c.name}</div>
                                </div>
                                <div style={{ fontWeight: 800, color: '#1D4ED8', fontSize: '0.9rem' }}>
                                    {c.phone}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 7: CONTRIBUTIONS */}
            {campTab === 'contributions' && (
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Camp Fee Collections</h3>
                            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                                Standard camp subsidised fee: KSh 1,500 / participant
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>COLLECTION RATE</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>73%</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '0.85rem', background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E40AF' }}>EXPECTED</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1D4ED8' }}>KSh 120,000</div>
                        </div>
                        <div style={{ padding: '0.85rem', background: '#ECFDF5', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065F46' }}>COLLECTED</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669' }}>KSh 87,500</div>
                        </div>
                        <div style={{ padding: '0.85rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991B1B' }}>OUTSTANDING</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#DC2626' }}>KSh 32,500</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G5CampCommandWorkspace;
