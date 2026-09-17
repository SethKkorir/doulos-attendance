import React, { useState, useEffect } from 'react';
import { 
    Users, Shield, Award, CheckCircle2, AlertTriangle, 
    Search, Filter, Star, ChevronRight, Check, X, 
    AlertCircle, Sparkles, TrendingUp, History, Lock, Unlock
} from 'lucide-react';

const DOMAINS = [
    { id: 'Team Building', label: '1. Team Building', desc: 'Client handling, initiatives, briefing/debriefing & group dynamics' },
    { id: 'Freedom Base', label: '2. Freedom Base', desc: 'Equipment procedures, camp regulations, set & set down, daily checks' },
    { id: 'High Ropes', label: '3. High Ropes', desc: 'Elements knowledge, belaying techniques, safety procedures & PPE inspection' },
    { id: 'Rescue & Extrication', label: '4. Rescue & Extrication', desc: 'Traversing, suspension trauma, rope rescue systems & pick-off rescues' },
    { id: 'First Aid', label: '5. First Aid', desc: 'Basic first aid skills, emergency response, evacuation & wilderness first aid' },
    { id: 'Safety & Risk Management', label: '6. Safety & Risk Management', desc: 'Dynamic risk assessment, incident prevention & SOP compliance' },
    { id: 'Curriculum & Mentorship', label: '7. Curriculum & Mentorship', desc: 'Facilitator mentoring, program strategy & client protocol' }
];

const DouloidCadresDirectorate = ({ api, campus, setMsg, isGuest, userRole }) => {
    const [cadres, setCadres] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [rankFilter, setRankFilter] = useState('All');

    // Evaluation Modal State
    const [evaluatingMember, setEvaluatingMember] = useState(null);
    const [evaluationForm, setEvaluationForm] = useState({
        domain: 'High Ropes',
        score: 4,
        notes: '',
        passed: true,
        evaluator: 'G5 Directorate'
    });
    const [evaluatingLoading, setEvaluatingLoading] = useState(false);

    // Rank & Clearances Modal State
    const [rankingMember, setRankingMember] = useState(null);
    const [rankForm, setRankForm] = useState({
        douloidRank: 'Basic Douloid',
        belayStatus: 'Secondary Belayer',
        soloStationAllowed: false,
        notes: '',
        promotedBy: 'G5 Training Directorate'
    });
    const [rankingLoading, setRankingLoading] = useState(false);

    const fetchCadres = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/trainings/cadres?campus=${campus}&rank=${rankFilter}&search=${encodeURIComponent(search)}`);
            setCadres(res.data.members || []);
            setMetrics(res.data.metrics || null);
        } catch (err) {
            console.error('Error fetching cadres:', err);
            setMsg({ type: 'error', text: 'Failed to load Douloid cadres' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCadres();
    }, [campus, rankFilter]);

    // Handle search on submit or debounce
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchCadres();
    };

    // Open Evaluation Modal
    const openEvaluationModal = (member) => {
        const loggedUser = localStorage.getItem('username') || 'G5 Directorate';
        setEvaluatingMember(member);
        setEvaluationForm({
            domain: 'High Ropes',
            score: 4,
            notes: '',
            passed: true,
            evaluator: loggedUser
        });
    };

    const handleSaveEvaluation = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Evaluations disabled in Guest Mode' });
        if (!evaluatingMember) return;

        setEvaluatingLoading(true);
        try {
            const res = await api.post(`/trainings/members/${evaluatingMember._id}/evaluate`, evaluationForm);
            setMsg({ 
                type: 'success', 
                text: res.data.message || `Evaluation saved for ${evaluatingMember.name}` 
            });
            setEvaluatingMember(null);
            fetchCadres();
        } catch (err) {
            console.error('Evaluation error:', err);
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit evaluation' });
        } finally {
            setEvaluatingLoading(false);
        }
    };

    // Open Rank & Clearance Modal
    const openRankModal = (member) => {
        const loggedUser = localStorage.getItem('username') || 'G5 Directorate';
        setRankingMember(member);
        setRankForm({
            douloidRank: member.douloidRank && member.douloidRank !== 'None' ? member.douloidRank : 'Shadow Douloid',
            belayStatus: member.belayStatus || 'Not Permitted',
            soloStationAllowed: !!member.soloStationAllowed,
            notes: `Promoted via G5 Training Directorate`,
            promotedBy: loggedUser
        });
    };

    // Check if form currently violates constitutional safety
    const isConstitutionalViolation = () => {
        if (!rankForm) return false;
        const isShadowOrNone = rankForm.douloidRank === 'Shadow Douloid' || rankForm.douloidRank === 'None';
        if (isShadowOrNone && rankForm.belayStatus === 'Primary Belayer Certified') return true;
        if (isShadowOrNone && rankForm.soloStationAllowed) return true;
        return false;
    };

    const handleSaveRank = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Modifications disabled in Guest Mode' });
        if (!rankingMember) return;

        if (isConstitutionalViolation()) {
            return setMsg({ 
                type: 'error', 
                text: 'Constitutional Safety Violation: Shadow Douloids cannot hold Primary Belay Certification or Solo Station Clearance!' 
            });
        }

        setRankingLoading(true);
        try {
            const res = await api.put(`/trainings/members/${rankingMember._id}/rank`, rankForm);
            setMsg({ 
                type: 'success', 
                text: res.data.message || `Rank updated for ${rankingMember.name}` 
            });
            setRankingMember(null);
            fetchCadres();
        } catch (err) {
            console.error('Rank error:', err);
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update rank' });
        } finally {
            setRankingLoading(false);
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 'Lead Douloid': return { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' };
            case 'Intermediate Douloid': return { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' };
            case 'Basic Douloid': return { bg: 'rgba(37,170,225,0.15)', text: '#38bdf8', border: 'rgba(37,170,225,0.3)' };
            case 'Shadow Douloid': return { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' };
            default: return { bg: '#EBEBF2', text: 'rgba(255,255,255,0.5)', border: '#EBEBF2' };
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* TACTICAL METRICS CARDS */}
            {metrics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: "#7E7A9B", textTransform: 'uppercase', letterSpacing: '1px' }}>
                                ACTIVE DOULOID CADRES
                            </span>
                            <Award size={18} style={{ color: '#25AAE1' }} />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: "#1E1B39", lineHeight: 1.1 }}>
                            {metrics.totalCadres}
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>{metrics.leadDouloids} Lead</span> •
                            <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700 }}>{metrics.intermediateDouloids} Interm.</span> •
                            <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>{metrics.basicDouloids} Basic</span> •
                            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>{metrics.shadowDouloids} Shadow</span>
                        </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: "#7E7A9B", textTransform: 'uppercase', letterSpacing: '1px' }}>
                                CERTIFIED BELAYERS
                            </span>
                            <Shield size={18} style={{ color: '#10b981' }} />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', lineHeight: 1.1 }}>
                            {metrics.primaryBelayers}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: metrics.primaryBelayers >= 2 ? 'rgba(255,255,255,0.5)' : '#ef4444', marginTop: '0.5rem', fontWeight: 600 }}>
                            {metrics.primaryBelayers >= 2 ? '✓ Minimum camp safety ratio met' : '⚠️ Warning: Belayers below camp minimum'}
                        </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: "#7E7A9B", textTransform: 'uppercase', letterSpacing: '1px' }}>
                                RECRUITS IN PIPELINE
                            </span>
                            <Users size={18} style={{ color: '#fbbf24' }} />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1.1 }}>
                            {metrics.recruitsInPipeline}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: "#7E7A9B", marginTop: '0.5rem', fontWeight: 600 }}>
                            Undergoing foundation drills
                        </div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '14px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: "#7E7A9B", textTransform: 'uppercase', letterSpacing: '1px' }}>
                                SOLO STATION CLEARED
                            </span>
                            <Unlock size={18} style={{ color: '#a78bfa' }} />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a78bfa', lineHeight: 1.1 }}>
                            {metrics.soloClearanceCount}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: "#7E7A9B", marginTop: '0.5rem', fontWeight: 600 }}>
                            Intermediate & Lead Douloids
                        </div>
                    </div>
                </div>
            )}

            {/* SEARCH & RANK FILTER BAR */}
            <div style={{ 
                background: '#FFFFFF', 
                border: '1px solid #EBEBF2', 
                borderRadius: '16px', 
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
            }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: "#7E7A9B" }} />
                        <input
                            type="text"
                            placeholder="Search cadre by name or student admission number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                background: '#F8F8FC',
                                border: '1px solid #EBEBF2',
                                borderRadius: '10px',
                                padding: '0.65rem 1rem 0.65rem 2.4rem',
                                color: "#1E1B39",
                                fontSize: '0.85rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <button type="submit" className="btn" style={{ background: "#4B3F8C", color: "#FFFFFF", fontWeight: 800, padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                        Search
                    </button>
                </form>

                {/* 4-Tier Rank Filter Buttons */}
                <div style={{ display: 'flex', background: '#F8F8FC', padding: '3px', borderRadius: '10px', border: '1px solid #EBEBF2', flexWrap: 'wrap' }}>
                    {[
                        { id: 'All', label: 'All Cadres' },
                        { id: 'Lead Douloid', label: 'Lead' },
                        { id: 'Intermediate Douloid', label: 'Intermediate' },
                        { id: 'Basic Douloid', label: 'Basic' },
                        { id: 'Shadow Douloid', label: 'Shadow' },
                        { id: 'Recruits', label: 'Recruits' }
                    ].map(r => (
                        <button
                            key={r.id}
                            onClick={() => setRankFilter(r.id)}
                            style={{
                                background: rankFilter === r.id ? '#25AAE1' : 'transparent',
                                color: rankFilter === r.id ? '#021525' : 'rgba(255,255,255,0.6)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.45rem 0.75rem',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CADRES DIRECTORY LIST */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={18} style={{ color: '#25AAE1' }} />
                        Douloid Cadre Progression & Competency Roster ({cadres.length})
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: "#7E7A9B" }}>
                        Showing campus: <strong style={{ color: '#25AAE1' }}>{campus}</strong>
                    </span>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: "#7E7A9B" }}>
                        <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '3px solid rgba(37,170,225,0.2)', borderTopColor: '#25AAE1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <p style={{ marginTop: '1rem', fontWeight: 600 }}>Loading Douloid Cadres...</p>
                    </div>
                ) : cadres.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: "#7E7A9B", fontSize: '0.9rem' }}>
                        No Douloids found matching current criteria.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1rem' }}>
                        {cadres.map(c => {
                            const rankStyle = getRankColor(c.douloidRank);
                            const evalCount = (c.evaluations || []).length;
                            const passedCount = (c.evaluations || []).filter(e => e.passed).length;

                            return (
                                <div 
                                    key={c._id}
                                    style={{
                                        background: '#F8F8FC',
                                        border: '1px solid #EBEBF2',
                                        borderRadius: '12px',
                                        padding: '1.25rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '0.9rem'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div>
                                                <h5 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem' }}>
                                                    {c.name}
                                                </h5>
                                                <div style={{ fontSize: '0.78rem', color: "#7E7A9B", marginTop: '0.15rem' }}>
                                                    {c.studentRegNo ? `${c.studentRegNo} • ` : ''}<span style={{ color: '#25AAE1' }}>{c.campus}</span>
                                                </div>
                                            </div>

                                            {/* Rank Badge */}
                                            <span style={{
                                                background: rankStyle.bg,
                                                color: rankStyle.text,
                                                border: `1px solid ${rankStyle.border}`,
                                                fontSize: '0.72rem',
                                                fontWeight: 800,
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '999px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {c.douloidRank || 'Recruit'}
                                            </span>
                                        </div>

                                        {/* Status Clearances Grid */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                                            {/* Belay Badge */}
                                            <span style={{
                                                background: c.belayStatus === 'Primary Belayer Certified' 
                                                    ? 'rgba(16,185,129,0.15)' 
                                                    : c.belayStatus === 'Secondary Belayer' 
                                                    ? 'rgba(245,158,11,0.15)' 
                                                    : 'rgba(239,68,68,0.1)',
                                                color: c.belayStatus === 'Primary Belayer Certified' 
                                                    ? '#10b981' 
                                                    : c.belayStatus === 'Secondary Belayer' 
                                                    ? '#fbbf24' 
                                                    : 'rgba(255,255,255,0.45)',
                                                border: `1px solid ${c.belayStatus === 'Primary Belayer Certified' ? 'rgba(16,185,129,0.3)' : '#EBEBF2'}`,
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}>
                                                <Shield size={11} />
                                                {c.belayStatus || 'Belay: Not Permitted'}
                                            </span>

                                            {/* Solo Clearance */}
                                            <span style={{
                                                background: c.soloStationAllowed ? 'rgba(139,92,246,0.15)' : '#EBEBF2',
                                                color: c.soloStationAllowed ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                                                border: `1px solid ${c.soloStationAllowed ? 'rgba(139,92,246,0.3)' : '#EBEBF2'}`,
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}>
                                                {c.soloStationAllowed ? <Unlock size={11} /> : <Lock size={11} />}
                                                {c.soloStationAllowed ? 'Solo Station Cleared' : 'Supervised Station'}
                                            </span>
                                        </div>

                                        {/* 5-Domain Assessments Status */}
                                        <div style={{ marginTop: '0.85rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: "#7E7A9B", marginBottom: '0.25rem' }}>
                                                <span>7 Evaluation Areas:</span>
                                                <span style={{ color: "#1E1B39", fontWeight: 700 }}>
                                                    {passedCount} Passed ({evalCount} Total)
                                                </span>
                                            </div>
                                            {/* Domain dots */}
                                            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                                                {DOMAINS.map(d => {
                                                    const hasPassed = (c.evaluations || []).some(e => e.domain === d.id && e.passed);
                                                    return (
                                                        <div 
                                                            key={d.id} 
                                                            title={`${d.label}: ${hasPassed ? 'Passed' : 'Pending Evaluation'}`}
                                                            style={{
                                                                flex: 1,
                                                                height: '4px',
                                                                borderRadius: '2px',
                                                                background: hasPassed ? '#10b981' : '#EBEBF2'
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid #EBEBF2' }}>
                                        <button
                                            onClick={() => openEvaluationModal(c)}
                                            className="btn"
                                            style={{
                                                flex: 1,
                                                background: '#1e293b',
                                                color: "#1E1B39",
                                                border: '1px solid #EBEBF2',
                                                borderRadius: '8px',
                                                padding: '0.5rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            <Star size={13} style={{ color: '#fbbf24' }} />
                                            <span>Evaluate (5 Domains)</span>
                                        </button>

                                        <button
                                            onClick={() => openRankModal(c)}
                                            className="btn"
                                            style={{
                                                flex: 1,
                                                background: 'rgba(37,170,225,0.15)',
                                                color: '#38bdf8',
                                                border: '1px solid rgba(37,170,225,0.3)',
                                                borderRadius: '8px',
                                                padding: '0.5rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            <Award size={13} />
                                            <span>Rank & Clearances</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL: 5-DOMAIN EVALUATION */}
            {evaluatingMember && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(46, 42, 77, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                                <span style={{ fontSize: '0.72rem', color: '#25AAE1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    7-DOMAIN ASSESSMENT RECORD
                                </span>
                                <h3 style={{ margin: '0.2rem 0 0 0', color: "#1E1B39", fontWeight: 800, fontSize: '1.2rem' }}>
                                    Evaluate: {evaluatingMember.name}
                                </h3>
                                <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                                    {evaluatingMember.studentRegNo ? `Reg: ${evaluatingMember.studentRegNo} • ` : ''}Rank: {evaluatingMember.douloidRank || 'Recruit'}
                                </p>
                            </div>
                            <button onClick={() => setEvaluatingMember(null)} style={{ background: 'transparent', border: 'none', color: "#7E7A9B", cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.35rem', fontWeight: 700 }}>
                                    ASSESSMENT DOMAIN
                                </label>
                                <select
                                    value={evaluationForm.domain}
                                    onChange={(e) => setEvaluationForm({ ...evaluationForm, domain: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.65rem', borderRadius: '8px', fontWeight: 700 }}
                                >
                                    {DOMAINS.map(d => (
                                        <option key={d.id} value={d.id}>{d.label} — ({d.desc})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Score Selector (1-5 Stars) */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: "#7E7A9B", fontWeight: 700 }}>
                                        PROFICIENCY SCORE (1-5)
                                    </label>
                                    <span style={{ color: '#D97706', fontWeight: 800, fontSize: '0.95rem', background: '#FEF3C7', padding: '0.15rem 0.55rem', borderRadius: '999px' }}>
                                        {evaluationForm.score}★ {evaluationForm.score >= 4 ? '• Proficient' : evaluationForm.score === 3 ? '• Competent' : '• Developing'}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setEvaluationForm({ ...evaluationForm, score: s })}
                                                style={{
                                                    padding: '0.35rem 0.65rem',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                    border: evaluationForm.score === s ? '1.5px solid #E8A33D' : '1px solid #E2E8F0',
                                                    background: evaluationForm.score === s ? '#FFFBEB' : '#F8FAFC',
                                                    color: evaluationForm.score === s ? '#B45309' : '#64748B',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                {s}★
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={evaluationForm.score}
                                        onChange={(e) => setEvaluationForm({ ...evaluationForm, score: Number(e.target.value) })}
                                        style={{ width: '90px', accentColor: '#E8A33D', cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: "#7E7A9B", marginTop: '0.35rem' }}>
                                    <span>1: Novice / Guidance</span>
                                    <span>3: Competent</span>
                                    <span>5: Mastery</span>
                                </div>
                            </div>

                            {/* Passed Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F8FC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #EBEBF2' }}>
                                <div>
                                    <div style={{ color: "#1E1B39", fontWeight: 700, fontSize: '0.85rem' }}>Domain Clearance Pass</div>
                                    <div style={{ color: "#7E7A9B", fontSize: '0.72rem' }}>Meets constitutional safety & competency threshold</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={evaluationForm.passed}
                                    onChange={(e) => setEvaluationForm({ ...evaluationForm, passed: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Observation Notes */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.35rem', fontWeight: 700 }}>
                                    OBSERVATION NOTES & FIELD COMMENDATIONS
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Observed flawless double-check squeeze and calm voice control during high ropes drill..."
                                    value={evaluationForm.notes}
                                    onChange={(e) => setEvaluationForm({ ...evaluationForm, notes: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.65rem', borderRadius: '8px', boxSizing: 'border-box', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setEvaluatingMember(null)}
                                    className="btn"
                                    style={{ background: 'transparent', color: "#7E7A9B", border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.55rem 1rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={evaluatingLoading}
                                    className="btn"
                                    style={{ background: '#10b981', color: "#FFFFFF", fontWeight: 800, border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem' }}
                                >
                                    {evaluatingLoading ? 'Saving...' : 'Record Evaluation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: RANK & CLEARANCES */}
            {rankingMember && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(46, 42, 77, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '1.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                                <span style={{ fontSize: '0.72rem', color: '#25AAE1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    CONSTITUTIONAL RANK & CLEARANCES
                                </span>
                                <h3 style={{ margin: '0.2rem 0 0 0', color: "#1E1B39", fontWeight: 800, fontSize: '1.2rem' }}>
                                    Promotion Suite: {rankingMember.name}
                                </h3>
                                <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                                    Current: <strong style={{ color: '#fbbf24' }}>{rankingMember.douloidRank || 'Recruit'}</strong> • Campus: {rankingMember.campus}
                                </p>
                            </div>
                            <button onClick={() => setRankingMember(null)} style={{ background: 'transparent', border: 'none', color: "#7E7A9B", cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Constitutional Guardrail Warning in Modal */}
                        {isConstitutionalViolation() && (
                            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '1rem' }}>
                                <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ fontSize: '0.78rem', color: '#fca5a5', lineHeight: 1.35 }}>
                                    <strong>Constitutional Guardrail Violation:</strong> Shadow Douloids and Recruits cannot be granted Primary Belay Certification or Solo Station Clearance. Change rank or downgrade clearance to proceed.
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveRank} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Douloid Rank Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.35rem', fontWeight: 700 }}>
                                    ASSIGN DOULOID RANK (TIER 1 - 4)
                                </label>
                                <select
                                    value={rankForm.douloidRank}
                                    onChange={(e) => setRankForm({ ...rankForm, douloidRank: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.65rem', borderRadius: '8px', fontWeight: 800 }}
                                >
                                    <option value="Shadow Douloid">Tier 1: Shadow Douloid (Entry level - Under Study)</option>
                                    <option value="Basic Douloid">Tier 2: Basic Douloid (Core Facilitator)</option>
                                    <option value="Intermediate Douloid">Tier 3: Intermediate Douloid (Certified Belayer & Rescue)</option>
                                    <option value="Lead Douloid">Tier 4: Lead Douloid (Directorate & Station Commander)</option>
                                    <option value="None">None (Recruit Pipeline)</option>
                                </select>
                            </div>

                            {/* Belay Clearance Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.35rem', fontWeight: 700 }}>
                                    BELAY CLEARANCE STATUS
                                </label>
                                <select
                                    value={rankForm.belayStatus}
                                    onChange={(e) => setRankForm({ ...rankForm, belayStatus: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.65rem', borderRadius: '8px', fontWeight: 700 }}
                                >
                                    <option value="Not Permitted">Not Permitted (Recruit / Ground Only)</option>
                                    <option value="Secondary Belayer">Secondary Belayer (Backup / Supervised)</option>
                                    <option value="Primary Belayer Certified">Primary Belayer Certified (Live Ropes Clearance)</option>
                                </select>
                            </div>

                            {/* Solo Station Clearance Switch */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F8FC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #EBEBF2' }}>
                                <div>
                                    <div style={{ color: "#1E1B39", fontWeight: 700, fontSize: '0.85rem' }}>Solo Station Clearance</div>
                                    <div style={{ color: "#7E7A9B", fontSize: '0.72rem' }}>Permitted to operate an isolated station without direct directorate oversight</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={rankForm.soloStationAllowed}
                                    onChange={(e) => setRankForm({ ...rankForm, soloStationAllowed: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: '#25AAE1', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Promotion Justification Notes */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: "#7E7A9B", marginBottom: '0.35rem', fontWeight: 700 }}>
                                    PROMOTION NOTES & CITATION
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Approved based on completion of 5-domain evaluations and Lukenya field drills..."
                                    value={rankForm.notes}
                                    onChange={(e) => setRankForm({ ...rankForm, notes: e.target.value })}
                                    style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.65rem', borderRadius: '8px', boxSizing: 'border-box', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setRankingMember(null)}
                                    className="btn"
                                    style={{ background: 'transparent', color: "#7E7A9B", border: '1px solid #EBEBF2', borderRadius: '8px', padding: '0.55rem 1rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={rankingLoading || isConstitutionalViolation()}
                                    className="btn"
                                    style={{ 
                                        background: isConstitutionalViolation() ? '#64748b' : '#25AAE1', 
                                        color: "#FFFFFF", 
                                        fontWeight: 800, 
                                        border: 'none', 
                                        borderRadius: '8px', 
                                        padding: '0.55rem 1.25rem',
                                        cursor: isConstitutionalViolation() ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {rankingLoading ? 'Updating...' : 'Commit Promotion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DouloidCadresDirectorate;
