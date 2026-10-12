import React, { useState } from 'react';
import {
    Layers,
    Shield,
    CheckCircle2,
    AlertTriangle,
    Search,
    Plus,
    Wrench,
    Tag,
    Clock
} from 'lucide-react';

const G5GearLogisticsWorkspace = ({
    gearAssets = [],
    api,
    showToast
}) => {
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const defaultCategories = [
        { name: 'Ropes & Rigging', count: 24, operational: 24, required: 24 },
        { name: 'Harnesses', count: 45, operational: 42, required: 45 },
        { name: 'Helmets', count: 45, operational: 45, required: 45 },
        { name: 'First Aid & Trauma', count: 6, operational: 6, required: 6 },
        { name: 'Navigation (GPS & Compass)', count: 18, operational: 17, required: 18 },
        { name: 'Lighting (Headlamps)', count: 30, operational: 28, required: 30 },
        { name: 'Communication (VHF Radios)', count: 10, operational: 10, required: 10 }
    ];

    const requiredTotal = 120;
    const availableTotal = 112;
    const missingTotal = 8;
    const inspectedPct = 93;

    return (
        <div className="g5-gear-logistics-workspace">
            {/* WORKSPACE HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                        Gear & Hardware Logistics
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                        Field equipment deployment readiness, carabiner & harness inspections, and hardware maintenance
                    </p>
                </div>
            </div>

            {/* GEAR READINESS KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>REQUIRED ASSETS</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>{requiredTotal}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Camp & drill quota</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>AVAILABLE & FIELD READY</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>{availableTotal}</div>
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>Passes safety check</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>MISSING / IN SERVICE</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D97706', marginTop: '0.2rem' }}>{missingTotal}</div>
                    <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700 }}>Under repair / replace</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>INSPECTED READINESS</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.2rem' }}>{inspectedPct}%</div>
                    <div style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 700 }}>Pre-camp hardware audit</div>
                </div>
            </div>

            {/* GEAR CATEGORIES MATRIX */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', color: '#0F172A' }}>
                    Equipment Category Readiness Matrix
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {defaultCategories.map((cat, idx) => {
                        const pct = Math.round((cat.operational / cat.required) * 100);
                        const isFull = pct === 100;

                        return (
                            <div key={idx} style={{ padding: '1rem', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>{cat.name}</div>
                                    <span className={`g5-chip ${isFull ? 'g5-chip-active' : 'g5-chip-attention'}`}>
                                        {pct}% Ready
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.5rem' }}>
                                    {cat.operational} Operational / {cat.required} Required
                                </div>
                                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: isFull ? '#059669' : '#3B82F6', borderRadius: '999px' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default G5GearLogisticsWorkspace;
