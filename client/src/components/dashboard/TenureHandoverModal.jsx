import React, { useState, useEffect } from 'react';
import {
    X, Award, Shield, FileText, CheckCircle, AlertTriangle, Lock,
    ChevronRight, BookOpen, Clock, Send, Archive, RefreshCw, Printer, UserCheck
} from 'lucide-react';
import defaultApi from '../../api';

const PORTFOLIOS = [
    'G1 Coordinator',
    'G2 Vice Coordinator',
    'G3 Secretary',
    'G4 Organizing Secretary',
    'G5 Training & Safety',
    'G6 Welfare',
    'G7 Finance',
    'G8 Assets',
    'G9 Media'
];

const TRANSITION_PATHS = [
    {
        id: 'Alumni / Senior Douloid',
        title: 'Alumni / Senior Douloid',
        badge: 'bg-indigo-950/80 text-indigo-400 border border-indigo-500/30',
        desc: 'Officer steps down with honor, transitions to Alumni network, and retains Facilitator Passport without administrative credentials.'
    },
    {
        id: 'Retained in Role',
        title: 'Retained in Role',
        badge: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
        desc: 'Term is renewed for the upcoming academic cycle. Historic logs are sealed and a fresh annual dashboard opens.'
    },
    {
        id: 'Reassigned Portfolio',
        title: 'Reassigned Portfolio',
        badge: 'bg-amber-950/80 text-amber-400 border border-amber-500/30',
        desc: 'Officer transitions laterally or upward to another G-Council portfolio (e.g., G3 Secretary to G1 Coordinator).'
    },
    {
        id: 'Incoming New Leader',
        title: 'Incoming New Leader',
        badge: 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30',
        desc: 'A newly commissioned Douloid assumes constitutional stewardship of this portfolio with fresh credentials.'
    }
];

export default function TenureHandoverModal({ isOpen, onClose, api, setMsg, isGuest, userRole }) {
    const client = api || defaultApi;
    const [activeView, setActiveView] = useState('archives'); // 'archives' or 'compose'
    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDossier, setSelectedDossier] = useState(null);
    const [sealingNotes, setSealingNotes] = useState('');
    const [sealingId, setSealingId] = useState(null);

    // Form state for composing
    const [formData, setFormData] = useState({
        officerName: '',
        admissionNumber: '',
        portfolio: 'G1 Coordinator',
        tenurePeriod: '2025/2026',
        milestonesSummary: '',
        assetAndFileInventory: '',
        inProgressInitiatives: '',
        strategicRecommendations: '',
        transitionPath: 'Alumni / Senior Douloid'
    });

    useEffect(() => {
        if (isOpen) {
            fetchDossiers();
        }
    }, [isOpen]);

    const fetchDossiers = async () => {
        try {
            setLoading(true);
            const res = await client.get('/council/dossiers');
            setDossiers(res.data || []);
        } catch (err) {
            console.error('Failed to load dossiers', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitDossier = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await client.post('/council/dossiers', formData);
            alert('End-of-Tenure Handover Dossier successfully submitted for G1 Executive Sealing.');
            setActiveView('archives');
            fetchDossiers();
            setFormData({
                officerName: '',
                admissionNumber: '',
                portfolio: 'G1 Coordinator',
                tenurePeriod: '2025/2026',
                milestonesSummary: '',
                assetAndFileInventory: '',
                inProgressInitiatives: '',
                strategicRecommendations: '',
                transitionPath: 'Alumni / Senior Douloid'
            });
        } catch (err) {
            alert('Error submitting handover dossier: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSealDossier = async (id) => {
        if (!confirm('Seal this Handover Dossier permanently into the Doulos Ministry Historical Archives? Once sealed, records cannot be modified.')) return;
        try {
            await client.post(`/council/dossiers/${id}/seal`, {
                endorsementNotes: sealingNotes || 'Executive endorsement and constitutional seal applied.'
            });
            alert('Handover Dossier sealed into Ministry Historical Archives.');
            setSealingId(null);
            setSealingNotes('');
            fetchDossiers();
        } catch (err) {
            alert('Error sealing dossier: ' + (err.response?.data?.message || err.message));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#0b101d] border border-slate-700/60 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
                
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-slate-800 bg-[#070b14] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white tracking-wide">1-Year Leadership Tenure & Handover Dossier</h2>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">US-TEN-011</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Constitutional changing of guard, institutional wisdom preservation, and ministry archives.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Tab Switcher */}
                        <div className="flex items-center bg-[#111928] p-1 rounded-xl border border-slate-700/50">
                            <button
                                onClick={() => setActiveView('archives')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    activeView === 'archives'
                                        ? 'bg-[#1e293b] text-white shadow-sm border border-slate-600/40'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Archive className="w-3.5 h-3.5 text-amber-400" />
                                Historical Archives ({dossiers.length})
                            </button>
                            <button
                                onClick={() => setActiveView('compose')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    activeView === 'compose'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                File Handover Dossier
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeView === 'compose' ? (
                        /* COMPOSE FORM */
                        <form onSubmit={handleSubmitDossier} className="space-y-6 max-w-4xl mx-auto">
                            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
                                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-amber-300">Constitutional Handover Requirement:</span>
                                    {" \"Without structure, knowledge is lost when leaders leave and mistakes repeat. Training institutionalizes wisdom.\" "}
                                    Every outgoing G-Council member must complete all 4 compulsory sections before credentials rotate.
                                </div>
                            </div>

                            {/* Officer Profile & Portfolio */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0e1526] border border-slate-800">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Officer Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Grace Wanjiku"
                                        value={formData.officerName}
                                        onChange={(e) => setFormData({ ...formData, officerName: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Admission Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 23-1452"
                                        value={formData.admissionNumber}
                                        onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">G-Council Portfolio</label>
                                    <select
                                        value={formData.portfolio}
                                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                                    >
                                        {PORTFOLIOS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Tenure Period</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.tenurePeriod}
                                        onChange={(e) => setFormData({ ...formData, tenurePeriod: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Transition Path Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4 text-cyan-400" />
                                    Select Officer Transition Path
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {TRANSITION_PATHS.map((path) => (
                                        <label
                                            key={path.id}
                                            onClick={() => setFormData({ ...formData, transitionPath: path.id })}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                                                formData.transitionPath === path.id
                                                    ? 'bg-[#152033] border-amber-500/60 shadow-md'
                                                    : 'bg-[#FFFFFF] border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-bold text-white">{path.title}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${path.badge}`}>
                                                    {formData.transitionPath === path.id ? 'SELECTED' : 'PATH'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">{path.desc}</p>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* The 4 Compulsory Sections */}
                            <div className="space-y-4">
                                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-amber-400" />
                                        The 4 Compulsory Dossier Sections
                                    </h3>
                                    <span className="text-[11px] text-slate-400">All fields required for G1 review</span>
                                </div>

                                {/* Section 1 */}
                                <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-amber-300">
                                            1. Major Milestones & Portfolio Overview
                                        </label>
                                        <span className="text-[10px] text-slate-500 font-mono">SECTION 01</span>
                                    </div>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Detail key achievements, numbers of events delivered, members onboarded, systems modernized, or certifications achieved during your term..."
                                        value={formData.milestonesSummary}
                                        onChange={(e) => setFormData({ ...formData, milestonesSummary: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/70 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                {/* Section 2 */}
                                <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-emerald-300">
                                            2. Portfolio Physical Asset & Digital File Inventory
                                        </label>
                                        <span className="text-[10px] text-slate-500 font-mono">SECTION 02</span>
                                    </div>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="List all physical gear handed over (e.g. keys, banners, first aid kit, hard drives) and Google Drive/cloud links handed to incoming leader..."
                                        value={formData.assetAndFileInventory}
                                        onChange={(e) => setFormData({ ...formData, assetAndFileInventory: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/70 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                {/* Section 3 */}
                                <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-cyan-300">
                                            3. In-Progress Initiatives & Urgent Follow-ups
                                        </label>
                                        <span className="text-[10px] text-slate-500 font-mono">SECTION 03</span>
                                    </div>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="What projects are pending completion? What relationships, supplier follow-ups, or unverified dues require the incoming officer's first 30-day focus?"
                                        value={formData.inProgressInitiatives}
                                        onChange={(e) => setFormData({ ...formData, inProgressInitiatives: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/70 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                {/* Section 4 */}
                                <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-violet-300">
                                            4. Strategic Recommendations & Hard-Learned Wisdom
                                        </label>
                                        <span className="text-[10px] text-slate-500 font-mono">SECTION 04</span>
                                    </div>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="What worked exceptionally well? What mistakes must never be repeated? Confidential tactical advice and prayer encouragement for the successor..."
                                        value={formData.strategicRecommendations}
                                        onChange={(e) => setFormData({ ...formData, strategicRecommendations: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/70 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Submit CTA */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setActiveView('archives')}
                                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {submitting ? 'Submitting...' : 'Submit Dossier for G1 Sealing'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* ARCHIVES VIEW */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Archive className="w-4 h-4 text-amber-400" />
                                        Ministry Historical Archives & Sealed Dossiers
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Permanent institutional repository of leadership handovers across academic years.
                                    </p>
                                </div>
                                <button
                                    onClick={fetchDossiers}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1a2840] text-xs text-slate-300 border border-slate-700 transition"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center text-xs text-slate-500">
                                    Loading archived dossiers...
                                </div>
                            ) : dossiers.length === 0 ? (
                                <div className="p-12 rounded-2xl bg-[#F8F8FC] border border-slate-800/80 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-500">
                                        <Archive className="w-6 h-6" />
                                    </div>
                                    <div className="text-sm font-semibold text-slate-300">No Handover Dossiers Filed Yet</div>
                                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                                        Outgoing G-Council members submit their end-of-year dossiers here. Tap "File Handover Dossier" to submit your handover report.
                                    </p>
                                    <button
                                        onClick={() => setActiveView('compose')}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        File First Dossier
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {dossiers.map((d) => (
                                        <div
                                            key={d._id}
                                            className="p-5 rounded-xl bg-[#0e1526] border border-slate-800 hover:border-slate-700/80 transition space-y-4"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-amber-400 font-bold text-xs">
                                                        {d.portfolio.split(' ')[0]}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-bold text-white">{d.officerName}</h4>
                                                            <span className="text-xs text-slate-400">({d.admissionNumber})</span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                                                {d.tenurePeriod}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-amber-400/90 font-medium mt-0.5">
                                                            {d.portfolio}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                                                        d.status.includes('Sealed')
                                                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30 flex items-center gap-1.5'
                                                            : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                                                    }`}>
                                                        {d.status.includes('Sealed') && <Lock className="w-3 h-3 text-emerald-400" />}
                                                        {d.status}
                                                    </span>

                                                    <span className="text-[10px] px-2 py-1 rounded bg-[#162032] text-cyan-300 border border-slate-700">
                                                        {d.transitionPath}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Summary previews */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800/80">
                                                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Key Milestones</div>
                                                    <p className="text-slate-300 line-clamp-2">{d.milestonesSummary}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800/80">
                                                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Urgent Next Steps</div>
                                                    <p className="text-slate-300 line-clamp-2">{d.inProgressInitiatives}</p>
                                                </div>
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Submitted: {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {d.sealedBy && (
                                                        <span className="ml-2 text-emerald-400/90 font-medium">
                                                            • Sealed by {d.sealedBy} on {new Date(d.sealedAt).toLocaleDateString('en-GB')}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedDossier(d)}
                                                        className="px-3 py-1.5 rounded-lg bg-[#162032] hover:bg-[#1e2c45] text-slate-200 border border-slate-700 text-xs font-medium transition"
                                                    >
                                                        Read Full Dossier
                                                    </button>

                                                    {!d.status.includes('Sealed') && (
                                                        <button
                                                            onClick={() => setSealingId(sealingId === d._id ? null : d._id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                                                        >
                                                            <Lock className="w-3 h-3" />
                                                            Apply G1 Executive Seal
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* G1 Sealing Endorsement Box */}
                                            {sealingId === d._id && (
                                                <div className="p-4 rounded-xl bg-[#09101f] border border-emerald-500/30 space-y-3 mt-3 animate-fadeIn">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                                            <Lock className="w-3.5 h-3.5" />
                                                            Official G1 Executive Archive Seal
                                                        </span>
                                                        <button onClick={() => setSealingId(null)} className="text-slate-500 hover:text-white">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Endorsement notes, commendation for service, and archive verification..."
                                                        value={sealingNotes}
                                                        onChange={(e) => setSealingNotes(e.target.value)}
                                                        className="w-full bg-[#141e30] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setSealingId(null)}
                                                            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSealDossier(d._id)}
                                                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                                                        >
                                                            Seal Permanently in Archives
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* READ-ONLY MODAL FOR INSPECTING FULL DOSSIER */}
                {selectedDossier && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-[#0b101d] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto">
                            <div className="p-5 border-b border-slate-800 bg-[#070b14] flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-white">
                                            {selectedDossier.portfolio} End-of-Tenure Dossier
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                                            {selectedDossier.tenurePeriod}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Submitted by {selectedDossier.officerName} ({selectedDossier.admissionNumber}) • {selectedDossier.transitionPath}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                                        title="Print Dossier"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedDossier(null)}
                                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed">
                                {selectedDossier.sealedBy && (
                                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3">
                                        <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <div>
                                            <div className="font-bold text-emerald-300">Constitutional Seal of Permanent Archives</div>
                                            <div className="text-slate-300 mt-0.5">{selectedDossier.endorsementNotes}</div>
                                            <div className="text-[10px] text-emerald-400/80 mt-1">
                                                Sealed by {selectedDossier.sealedBy} on {new Date(selectedDossier.sealedAt).toLocaleString('en-GB')}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                                        1. Major Milestones & Portfolio Overview
                                    </h4>
                                    <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 text-slate-200 whitespace-pre-wrap">
                                        {selectedDossier.milestonesSummary}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                                        2. Physical Asset & Digital File Inventory
                                    </h4>
                                    <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 text-slate-200 whitespace-pre-wrap">
                                        {selectedDossier.assetAndFileInventory}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
                                        3. In-Progress Initiatives & Urgent Follow-ups
                                    </h4>
                                    <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 text-slate-200 whitespace-pre-wrap">
                                        {selectedDossier.inProgressInitiatives}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-violet-400 uppercase tracking-wider text-[11px]">
                                        4. Strategic Recommendations & Hard-Learned Wisdom
                                    </h4>
                                    <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 text-slate-200 whitespace-pre-wrap">
                                        {selectedDossier.strategicRecommendations}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
