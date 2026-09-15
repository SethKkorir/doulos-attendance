import React, { useState, useEffect } from 'react';
import {
    Compass, MapPin, Users, Calendar, Clock, AlertTriangle, CheckCircle,
    Send, ShieldAlert, Bus, ExternalLink, Copy, Check, Info, Plus, Trash2, ArrowRight
} from 'lucide-react';
import defaultApi from '../../api';

const VENUES = [
    { name: 'Freedom Base Pavilion & Obstacle Field', coords: '-1.4428, 37.0094', radius: '250m', campus: 'Athi River' },
    { name: 'Lukenya Rock Climbing Face', coords: '-1.4395, 37.0180', radius: '150m', campus: 'Athi River' },
    { name: 'Daystar Athi River Amphitheatre', coords: '-1.4485, 37.0125', radius: '200m', campus: 'Athi River' },
    { name: 'Valley Road Chapel / Courtyard', coords: '-1.2921, 36.8073', radius: '180m', campus: 'Valley Road' }
];

const STATION_TYPES = [
    'High Ropes',
    'Rock Face',
    'Rappel',
    'Burma Bridge',
    'Low Ropes & Team Challenge',
    'Base Camp Registration & Welcome',
    'First Aid & Water Station'
];

const STATION_ROLES = [
    'Primary Belayer',
    'Secondary Belayer',
    'Station Lead Facilitator',
    'Assistant Facilitator',
    'Ground Observer'
];

export default function G4LogisticsConsole({ api, setMsg, isGuest }) {
    const client = api || defaultApi;
    const [activeSubTab, setActiveSubTab] = useState('stations'); // 'stations', 'expeditions', 'manifest'
    const [candidateRegNo, setCandidateRegNo] = useState('');
    const [stationType, setStationType] = useState('High Ropes');
    const [requestedRole, setRequestedRole] = useState('Primary Belayer');
    const [validationResult, setValidationResult] = useState(null);
    const [validating, setValidating] = useState(false);

    // Station Roster assignments
    const [stationRoster, setStationRoster] = useState([
        { id: '1', station: 'High Ropes', lead: 'Brian Kimani (Lead Douloid)', role: 'Primary Belayer', status: 'Approved' },
        { id: '2', station: 'Low Ropes & Team Challenge', lead: 'Faith Mwende (Intermediate Douloid)', role: 'Station Lead Facilitator', status: 'Approved' }
    ]);

    // Expedition / Event planner
    const [eventDetails, setEventDetails] = useState({
        title: 'Lukenya Hills 3-Day Leadership Training Camp',
        date: '2026-10-16',
        departureTimeAR: '06:45 EAT',
        departureTimeVR: '06:30 EAT',
        busCapacity: 45,
        packingList: 'Sturdy boots, 2L water bottle, personal harness/gloves, notebook & pen, warm jacket, whistle',
        safetyLead: 'G5 Training Director'
    });

    const [copied, setCopied] = useState(false);

    const handleValidateStationAssignment = async (e) => {
        e.preventDefault();
        if (!candidateRegNo.trim()) return;

        try {
            setValidating(true);
            setValidationResult(null);
            const res = await client.post('/council/expeditions/validate-station', {
                candidateRegNo: candidateRegNo.trim(),
                stationType,
                requestedRole
            });

            setValidationResult(res.data);
            if (res.data.allowed) {
                // Add to roster
                setStationRoster(prev => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        station: stationType,
                        lead: `${res.data.member?.name || candidateRegNo} (${res.data.member?.rank || 'Douloid'})`,
                        role: requestedRole,
                        status: 'Approved'
                    }
                ]);
            }
        } catch (err) {
            setValidationResult({
                allowed: false,
                reason: err.response?.data?.message || 'Failed to validate facilitator rank with server'
            });
        } finally {
            setValidating(false);
        }
    };

    const handleRemoveFromRoster = (id) => {
        setStationRoster(prev => prev.filter(item => item.id !== id));
    };

    // Generate WhatsApp Transport & Logistics Message
    const generateWhatsAppMessage = () => {
        return `⛺ *DOULOS LOGISTICS & TRANSPORT BRIEFING* ⛺\n\n` +
            `*Event:* ${eventDetails.title}\n` +
            `*Date:* ${eventDetails.date}\n\n` +
            `🚌 *DEPARTURE TIMES (STRICT EAT):*\n` +
            `• Valley Road Campus: *${eventDetails.departureTimeVR}* (Chapel Courtyard)\n` +
            `• Athi River Campus: *${eventDetails.departureTimeAR}* (Amphitheatre Gate)\n` +
            `• Bus Capacity: ${eventDetails.busCapacity} Seats (Roll call closes 10 min prior)\n\n` +
            `🎒 *MANDATORY PACKING LIST:*\n${eventDetails.packingList}\n\n` +
            `⚠️ *SAFETY & DRESS CODE:*\n` +
            `Closed-toe outdoor boots required. No jewelry, no loose hoodies near belay ropes.\n\n` +
            `_\"If we say we serve God, then excellence in safety is worship.\"_`;
    };

    const handleCopyWhatsApp = () => {
        navigator.clipboard.writeText(generateWhatsAppMessage());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenWhatsApp = () => {
        const text = encodeURIComponent(generateWhatsAppMessage());
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-2xl bg-[#0b101d] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Compass className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white tracking-wide">G4 Organizing Secretary & Logistics Console</h2>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20">US-G4-005</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Expedition manifests, station facilitator allocations, and constitutional belay qualification enforcement.
                        </p>
                    </div>
                </div>

                {/* Sub-tab navigation */}
                <div className="flex items-center bg-[#070b14] p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveSubTab('stations')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            activeSubTab === 'stations'
                                ? 'bg-cyan-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Station Allocation Guard
                    </button>
                    <button
                        onClick={() => setActiveSubTab('expeditions')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            activeSubTab === 'expeditions'
                                ? 'bg-cyan-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Bus className="w-3.5 h-3.5" />
                        Logistics & Transport
                    </button>
                    <button
                        onClick={() => setActiveSubTab('venues')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            activeSubTab === 'venues'
                                ? 'bg-cyan-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <MapPin className="w-3.5 h-3.5" />
                        Venue Geofences
                    </button>
                </div>
            </div>

            {/* TAB 1: STATION ALLOCATION MATRIX WITH RANK VALIDATION */}
            {activeSubTab === 'stations' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Allocation Validator Panel */}
                    <div className="p-5 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-amber-400" />
                                Station Duty Validator
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Constitutional check: System strictly forbids Shadow Douloids from belaying, and restricts Basic Douloids to Secondary Belayers.
                            </p>
                        </div>

                        <form onSubmit={handleValidateStationAssignment} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">
                                    Facilitator Admission / Reg No
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 23-1452 or 24-0012"
                                    value={candidateRegNo}
                                    onChange={(e) => setCandidateRegNo(e.target.value)}
                                    className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Station Activity</label>
                                <select
                                    value={stationType}
                                    onChange={(e) => setStationType(e.target.value)}
                                    className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                >
                                    {STATION_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Requested Duty Role</label>
                                <select
                                    value={requestedRole}
                                    onChange={(e) => setRequestedRole(e.target.value)}
                                    className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                >
                                    {STATION_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={validating}
                                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
                            >
                                <ShieldAlert className="w-4 h-4" />
                                {validating ? 'Auditing Member Rank...' : 'Validate & Allocate Station'}
                            </button>
                        </form>

                        {/* Validation Result Box */}
                        {validationResult && (
                            <div className={`p-4 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                                validationResult.allowed
                                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                            }`}>
                                <div className="flex items-start gap-2.5">
                                    {validationResult.allowed ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <div className="font-bold text-sm mb-1">
                                            {validationResult.allowed ? 'Assignment Cleared ✅' : 'Assignment Blocked 🛑'}
                                        </div>
                                        <p>{validationResult.allowed ? validationResult.message : validationResult.reason}</p>
                                        {validationResult.member && (
                                            <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300">
                                                Officer: <strong>{validationResult.member.name}</strong> • Rank: <strong>{validationResult.member.rank}</strong> • Belay: <strong>{validationResult.member.belayStatus}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active Station Duty Roster */}
                    <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-cyan-400" />
                                    Active Station Assignment Roster
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Current facilitators deployed across high ropes, rock face, and challenge elements.
                                </p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded bg-[#162032] text-cyan-300 border border-slate-700">
                                {stationRoster.length} Active Stations
                            </span>
                        </div>

                        <div className="space-y-3">
                            {stationRoster.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-xs">
                                            {item.station.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">{item.station}</div>
                                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                <span className="text-cyan-300 font-medium">{item.lead}</span>
                                                <span>•</span>
                                                <span className="text-slate-300">{item.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                                            {item.status}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveFromRoster(item.id)}
                                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                                            title="Remove facilitator from station"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Constitutional Note */}
                        <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <strong>Safety Rule:</strong> Every High Ropes or Rock Face station requires at least one Lead or Intermediate Douloid as Primary Belayer. Solo facilitation by a Shadow Douloid is prohibited.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: LOGISTICS & TRANSPORT MANIFEST */}
            {activeSubTab === 'expeditions' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Event Configuration */}
                    <div className="p-5 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-4">
                        <div className="flex items-center gap-2">
                            <Bus className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-sm font-bold text-white">Expedition & Bus Manifest Builder</h3>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Expedition Title</label>
                                <input
                                    type="text"
                                    value={eventDetails.title}
                                    onChange={(e) => setEventDetails({ ...eventDetails, title: e.target.value })}
                                    className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={eventDetails.date}
                                        onChange={(e) => setEventDetails({ ...eventDetails, date: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Bus Capacity</label>
                                    <input
                                        type="number"
                                        value={eventDetails.busCapacity}
                                        onChange={(e) => setEventDetails({ ...eventDetails, busCapacity: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Valley Road Departure</label>
                                    <input
                                        type="text"
                                        value={eventDetails.departureTimeVR}
                                        onChange={(e) => setEventDetails({ ...eventDetails, departureTimeVR: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Athi River Departure</label>
                                    <input
                                        type="text"
                                        value={eventDetails.departureTimeAR}
                                        onChange={(e) => setEventDetails({ ...eventDetails, departureTimeAR: e.target.value })}
                                        className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Mandatory Packing Items</label>
                                <textarea
                                    rows={3}
                                    value={eventDetails.packingList}
                                    onChange={(e) => setEventDetails({ ...eventDetails, packingList: e.target.value })}
                                    className="w-full bg-[#162032] border border-slate-700/80 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Preview & 1-Tap Broadcast */}
                    <div className="p-5 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Send className="w-4 h-4 text-emerald-400" />
                                    WhatsApp Broadcast Dispatch
                                </h3>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                    Zero-SMS Architecture
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Per section 2.1 of the Master Blueprint: Direct pre-filled WhatsApp deep-links replace costly SMS gateways.
                            </p>

                            <div className="mt-4 p-4 rounded-xl bg-[#070b14] border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {generateWhatsAppMessage()}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3">
                            <button
                                onClick={handleCopyWhatsApp}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#162032] hover:bg-[#1f2d45] text-white text-xs font-semibold border border-slate-700 transition"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}
                            </button>

                            <button
                                onClick={handleOpenWhatsApp}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: VENUE GEOFENCES */}
            {activeSubTab === 'venues' && (
                <div className="p-5 rounded-2xl bg-[#0e1526] border border-slate-800 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-400" />
                            Registered Doulos Operational Venues & GPS Bounds
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Attendance scanner strictly verifies Haversine GPS radius + 100m drift buffer against these coordinates.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {VENUES.map((v, i) => (
                            <div
                                key={i}
                                className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 hover:border-slate-700 transition space-y-2"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-white">{v.name}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">Campus: {v.campus}</div>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
                                        ±{v.radius}
                                    </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-300 bg-[#060a14] p-2 rounded border border-slate-800 flex items-center justify-between">
                                    <span>GPS: {v.coords}</span>
                                    <span className="text-[10px] text-emerald-400">Strict EAT Active</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
