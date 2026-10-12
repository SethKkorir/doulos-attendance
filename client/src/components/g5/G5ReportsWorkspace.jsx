import React, { useState } from 'react';
import {
    Radio,
    Sparkles,
    CalendarCheck,
    Users,
    Award,
    Compass,
    TrendingUp,
    MapPin,
    CheckCircle2
} from 'lucide-react';

const G5ReportsWorkspace = ({
    g5Stats,
    cadres = [],
    meetings = [],
    trainings = []
}) => {
    const [reportTab, setReportTab] = useState('analytics'); // 'analytics' vs 'readiness'

    const douloidCounts = {
        'Recruit': cadres.filter(c => c.memberType === 'Recruit').length,
        'Shadow Douloid': cadres.filter(c => c.douloidRank === 'Shadow Douloid').length,
        'Basic Douloid': cadres.filter(c => c.douloidRank === 'Basic Douloid').length,
        'Intermediate Douloid': cadres.filter(c => c.douloidRank === 'Intermediate Douloid').length,
        'Lead Douloid': cadres.filter(c => c.douloidRank === 'Lead Douloid').length
    };

    return (
        <div className="g5-reports-workspace">
            {/* WORKSPACE HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                        Directorate Reports & Readiness Intelligence
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                        Operational analytics, attendance trends, and cadre readiness breakdowns
                    </p>
                </div>
            </div>

            {/* SUBTABS */}
            <div className="g5-subtab-bar">
                <button
                    className={`g5-subtab-btn ${reportTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setReportTab('analytics')}
                >
                    <Radio size={15} /> Training Analytics & Trends
                </button>
                <button
                    className={`g5-subtab-btn ${reportTab === 'readiness' ? 'active' : ''}`}
                    onClick={() => setReportTab('readiness')}
                >
                    <Sparkles size={15} /> Cadre Readiness & Progression Reports
                </button>
            </div>

            {/* TAB 1: TRAINING ANALYTICS */}
            {reportTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>OVERALL ATTENDANCE RATE</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.2rem' }}>
                                {g5Stats?.attendancePercentage || 84}%
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                                +5.2% vs previous semester
                            </div>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>LOGGED SESSIONS</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
                                {meetings.length + trainings.length}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginTop: '0.2rem' }}>
                                {meetings.length} Meetings • {trainings.length} Drills
                            </div>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>QUESTION KNOWLEDGE ACCURACY</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
                                89%
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                                Skills questions passing rate
                            </div>
                        </div>
                    </div>

                    {/* CAMPUS COMPARISONS */}
                    <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', color: '#0F172A' }}>
                            Campus Training Comparison
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div style={{ padding: '1.1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D4ED8', marginBottom: '0.5rem' }}>
                                    Athi River Campus
                                </div>
                                <div style={{ fontSize: '0.84rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div>Average Attendance: <strong>86%</strong></div>
                                    <div>Active Douloids: <strong>{cadres.filter(c => c.campus === 'Athi River').length || 45}</strong></div>
                                    <div>Safety Incident Rate: <strong>0.02 / session</strong></div>
                                </div>
                            </div>

                            <div style={{ padding: '1.1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D4ED8', marginBottom: '0.5rem' }}>
                                    Valley Road Campus
                                </div>
                                <div style={{ fontSize: '0.84rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div>Average Attendance: <strong>81%</strong></div>
                                    <div>Active Douloids: <strong>{cadres.filter(c => c.campus === 'Valley Road').length || 32}</strong></div>
                                    <div>Safety Incident Rate: <strong>0.00 / session</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: READINESS REPORTS */}
            {reportTab === 'readiness' && (
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A' }}>
                        Directorate Rank Distribution & Belay Competence
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {Object.entries(douloidCounts).map(([rName, count]) => (
                            <div key={rName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                                    {rName}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1D4ED8' }}>{count}</span>
                                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>cadres</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default G5ReportsWorkspace;
