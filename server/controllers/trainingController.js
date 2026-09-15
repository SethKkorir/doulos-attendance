import Training from '../models/Training.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import CampProgram from '../models/CampProgram.js';
import Member from '../models/Member.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getKenyanTime, getKenyanDate } from '../utils/kenyanTime.js';

export const createTraining = async (req, res) => {
    const { name, date, campus, startTime, endTime, semester, requiredFields, location, isTestMeeting, questionOfDay, questionType, questionOptions } = req.body;
    try {
        const code = 'T-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const training = new Training({
            name, date, campus, startTime, endTime, semester, code, requiredFields, location, isTestMeeting, questionOfDay, questionType, questionOptions
        });
        await training.save();
        res.status(201).json(training);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTrainings = async (req, res) => {
    try {
        // --- AUTO-CLOSE EXPIRED TRAININGS ---
        const now = getKenyanTime();
        const todayStr = getKenyanDate();

        const activeTrainings = await Training.find({ isActive: true });
        for (const t of activeTrainings) {
            const tDate = new Date(t.date);
            const tStr = `${tDate.getUTCFullYear()}-${String(tDate.getUTCMonth() + 1).padStart(2, '0')}-${String(tDate.getUTCDate()).padStart(2, '0')}`;
            if (tStr > todayStr) continue;

            const [endH, endM] = t.endTime.split(':').map(Number);
            const endTotalMinutes = endH * 60 + endM;
            const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

            // Trainings span multiple days (Fri–Sun).
            // Only auto-close if the training started more than 3 days ago.
            // Admins are expected to manually close trainings when done.
            const isPastDay = (now - new Date(t.date)) > (3 * 24 * 60 * 60 * 1000); // 3 days in ms

            if (isPastDay) {
                await Training.findByIdAndUpdate(t._id, { isActive: false });
                console.log(`[AUTO-CLOSE] Training "${t.name}" auto-closed after 3+ days.`);
                
                // Trigger summary email
                try {
                    const { sendMeetingSummaryEmail } = await import('../utils/emailService.js');
                    await sendMeetingSummaryEmail(t._id, true);
                } catch (emailError) {
                    console.error('[AUTO-CLOSE] Failed to send training email:', emailError);
                }
            }
        }

        // Fetch trainings with attendance count
        const pipeline = [
            {
                $lookup: {
                    from: 'attendances', // We reuse attendance records, using trainingId field
                    localField: '_id',
                    foreignField: 'trainingId',
                    as: 'attendance'
                }
            },
            { $addFields: { attendanceCount: { $size: '$attendance' } } },
            { $project: { attendance: 0 } },
            { $sort: { date: -1 } }
        ];

        const trainings = await Training.aggregate(pipeline);

        trainings.sort((a, b) => {
            if (a.isActive === b.isActive) return new Date(b.date) - new Date(a.date);
            return a.isActive ? -1 : 1;
        });

        res.json(trainings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTrainingByCode = async (req, res) => {
    try {
        const training = await Training.findOne({ code: { $regex: new RegExp(`^${req.params.code}$`, 'i') } });
        if (!training) return res.status(404).json({ message: 'Training not found' });

        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);
        const now = getKenyanTime();
        const tDate = new Date(training.date);
        const todayStr = getKenyanDate();
        
        const activeDay = training.activeDay || 1;
        const targetDate = new Date(tDate.getTime() + (activeDay - 1) * 24 * 60 * 60 * 1000);
        const tStr = `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`;

        const [startH, startM] = training.startTime.split(':').map(Number);
        const [endH, endM] = training.endTime.split(':').map(Number);
        const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

        if (!isSuperUser && !training.isTestMeeting) {
            if (!training.isActive) return res.status(403).json({ message: 'This training session is closed.' });
            if (todayStr !== tStr) return res.status(403).json({ message: `This training is scheduled for ${targetDate.toLocaleDateString()}.` });
            if (currentMinutes < (startH * 60 + startM - 60)) return res.status(403).json({ message: `Training starts at ${training.startTime} EAT.` });
            if (currentMinutes > (endH * 60 + endM + 30)) return res.status(403).json({ message: `This training ended at ${training.endTime} EAT.` });
        }

        let hasAttended = false;
        if (req.query.deviceId && !isSuperUser && !training.isTestMeeting) {
            const existingRecord = await Attendance.findOne({ trainingId: training._id, deviceId: req.query.deviceId, trainingDay: activeDay });
            if (existingRecord) hasAttended = true;
        }

        res.json({ ...training.toObject(), isTraining: true, serverStartTime: Date.now(), hasAttended });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTrainingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const original = await Training.findById(id);
        if (!original) return res.status(404).json({ message: 'Training not found' });

        const training = await Training.findByIdAndUpdate(id, updates, { new: true });

        // Trigger email reports if training transitions from active -> closed
        if (original.isActive && !training.isActive) {
            try {
                const { sendMeetingSummaryEmail } = await import('../utils/emailService.js');
                await sendMeetingSummaryEmail(training._id, true);
            } catch (emailError) {
                console.error('[MANUAL-CLOSE] Failed to send training email:', emailError);
            }
        }

        res.json(training);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setTrainingLocation = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const training = await Training.findByIdAndUpdate(
            id,
            { $set: { 'location': { name: name || 'Custom Location' } } },
            { new: true }
        );
        res.json(training);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTraining = async (req, res) => {
    if (!['developer', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Only developers/superadmins can delete trainings' });
    }
    const { confirmPassword } = req.body;
    const { id } = req.params;
    try {
        const user = await User.findById(req.user.id);
        const isDevBypass = ['developer', 'superadmin'].includes(req.user.role) && confirmPassword === '657';
        if (!isDevBypass) {
            if (!user) return res.status(404).json({ message: 'Admin user not found' });
            const isMatch = await bcrypt.compare(confirmPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Incorrect admin password. Deletion cancelled.' });
        }
        const training = await Training.findById(id);
        if (!training) return res.status(404).json({ message: 'Training not found' });
        // Delete related attendance
        await Attendance.deleteMany({ trainingId: id });
        await Training.findByIdAndDelete(id);
        res.json({ message: `Training "${training.name}" deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// G5 TRAINING & SAFETY DIRECTORATE CONTROLLERS
// ==========================================

const DEFAULT_SCHEDULE = [
    // Friday
    { day: 'Friday', time: '16:00', activity: 'Cadre Arrival, Gear Staging & Kit Issue', location: 'Freedom Base HQ', leadFacilitator: 'G5 Director', facilitators: ['G5 Director', 'Quartermaster Team'], notes: 'Mandatory gear inventory & helmet inspections' },
    { day: 'Friday', time: '17:30', activity: 'Facilitator Briefing & Safety Constitution Reading', location: 'Base Briefing Tent', leadFacilitator: 'Safety Director', facilitators: ['Safety Director', 'G5 Director'], notes: 'Review double-check belay rules & zero-tolerance protocols' },
    { day: 'Friday', time: '19:00', activity: 'Campfire Formation & Spiritual Theme Unveiling', location: 'Council Fire Circle', leadFacilitator: 'G1 Coordinator', facilitators: ['G1 Coordinator', 'Chaplaincy'], notes: 'Opening charge: Anchored in Competence, Formed in Faith' },
    { day: 'Friday', time: '21:30', activity: 'Night Sentinel Watch & Camp Lights Out', location: 'Perimeter Posts', leadFacilitator: 'Lead Douloids', facilitators: ['Lead Douloid Alpha', 'Security Cadres'], notes: 'Camp security rotation begins' },
    // Saturday
    { day: 'Saturday', time: '06:00', activity: 'Dawn Physical Conditioning & Team Trail Run', location: 'Lukenya Ridge Trail', leadFacilitator: 'Lead Douloid Alpha', facilitators: ['Lead Douloid Alpha', 'Trail Guides'], notes: 'Formation conditioning & hydration check' },
    { day: 'Saturday', time: '07:30', activity: 'Cadre Breakfast & Ropes Course Pre-Rigging', location: 'Mess Hall & Ropes Hub', leadFacilitator: 'Station Leads', facilitators: ['Station Leads', 'Rigging Crew'], notes: 'Hardware torque and anchor system checks' },
    { day: 'Saturday', time: '08:30', activity: 'High Ropes & Dynamic Belay Mastery', location: 'High Ropes Hub', leadFacilitator: 'G5 Training Director', facilitators: ['G5 Training Director', 'Lead Douloid Alpha', 'Belay Inspectors'], notes: 'Command and secondary backup belayers live rotations' },
    { day: 'Saturday', time: '12:30', activity: 'Trail Lunch & Field Risk Debrief', location: 'Freedom Base Pavilion', leadFacilitator: 'Directorate Staff', facilitators: ['Directorate Staff'], notes: 'Mid-day safety audit and hydration check' },
    { day: 'Saturday', time: '14:00', activity: 'Wilderness Rescue & Extrication Simulation', location: 'East Lukenya Ridge', leadFacilitator: 'Rescue Lead', facilitators: ['Rescue Lead', 'Medical Cadre'], notes: 'Full litter extraction drill across rough terrain' },
    { day: 'Saturday', time: '17:00', activity: 'Low Ropes & Team Challenge Initiatives', location: 'Initiative Field', leadFacilitator: 'Intermediate Douloids', facilitators: ['Intermediate Douloids', 'Spotters Team'], notes: 'Trust-fall safety spotter protocols' },
    { day: 'Saturday', time: '19:30', activity: 'Dinner & Facilitator Council Debrief', location: 'Mess Hall', leadFacilitator: 'G5 Director', facilitators: ['G5 Director', 'G1 Coordinator'], notes: 'Review incident reports and commendations' },
    // Sunday
    { day: 'Sunday', time: '06:30', activity: 'Sunrise Solitude & Scripture Reflection', location: 'Lookout Rock', leadFacilitator: 'G-Council Chaplains', facilitators: ['G-Council Chaplains'], notes: 'Personal prayer and discipleship journal' },
    { day: 'Sunday', time: '08:00', activity: 'Breakfast & Rigging Breakdown Drill', location: 'Freedom Base', leadFacilitator: 'Equipment Quartermaster', facilitators: ['Equipment Quartermaster', 'G8 Logistics'], notes: 'Full carabiner & rope log inspections' },
    { day: 'Sunday', time: '09:30', activity: 'Sunday Outdoor Worship & Commissioning', location: 'Freedom Base Sanctuary', leadFacilitator: 'Chaplaincy & G1', facilitators: ['Chaplaincy', 'G1 Coordinator'], notes: 'Charge to the outdoor leaders' },
    { day: 'Sunday', time: '11:30', activity: 'Douloid Rank Pinning & Certification Awards', location: 'Freedom Base HQ', leadFacilitator: 'G5 Directorate', facilitators: ['G5 Directorate', 'G1 Coordinator'], notes: 'Pinning of Shadow, Basic, Intermediate & Lead ranks' },
    { day: 'Sunday', time: '13:00', activity: 'Camp Strike, Final Inspection & Departure', location: 'Bus Staging Point', leadFacilitator: 'G1 Coordinator', facilitators: ['G1 Coordinator', 'Transport Leads'], notes: 'Transport back to Athi River & Valley Road' }
];

const DEFAULT_DUTY_ROSTER = [
    { 
        stationName: 'High Ropes Course Alpha (Zip & Burma Bridge)', 
        location: 'Lukenya Tower 1', 
        stationLead: 'Lead Douloid Alpha', 
        stationLeadRank: 'Lead Douloid', 
        primaryBelayer: 'Intermediate Douloid Bravo', 
        primaryBelayerRank: 'Intermediate Douloid', 
        secondaryBelayer: 'Basic Douloid Charlie', 
        secondaryBelayerRank: 'Basic Douloid', 
        spotter: 'Shadow Douloid Delta', 
        spotterRank: 'Shadow Douloid', 
        safetyCleared: true, 
        safetyWarning: '' 
    },
    { 
        stationName: 'Rock Face & Rappel Station', 
        location: 'East Ridge Wall', 
        stationLead: 'Lead Douloid Grace', 
        stationLeadRank: 'Lead Douloid', 
        primaryBelayer: 'Intermediate Douloid Kevin', 
        primaryBelayerRank: 'Intermediate Douloid', 
        secondaryBelayer: 'Basic Douloid Sarah', 
        secondaryBelayerRank: 'Basic Douloid', 
        spotter: 'Shadow Douloid Esther', 
        spotterRank: 'Shadow Douloid', 
        safetyCleared: true, 
        safetyWarning: '' 
    },
    { 
        stationName: 'Low Ropes & Team Initiatives', 
        location: 'Freedom Clearing', 
        stationLead: 'Intermediate Douloid Amos', 
        stationLeadRank: 'Intermediate Douloid', 
        primaryBelayer: 'Ground Station (No Belay Required)', 
        primaryBelayerRank: 'None', 
        secondaryBelayer: 'Basic Douloid Cynthia', 
        secondaryBelayerRank: 'Basic Douloid', 
        spotter: 'Shadow Douloid Mark', 
        spotterRank: 'Shadow Douloid', 
        safetyCleared: true, 
        safetyWarning: '' 
    },
    { 
        stationName: 'First Aid & Emergency Command Post', 
        location: 'Medic Tent HQ', 
        stationLead: 'Wilderness Medic Officer', 
        stationLeadRank: 'Lead Douloid', 
        primaryBelayer: 'Medical Station', 
        primaryBelayerRank: 'None', 
        secondaryBelayer: 'N/A', 
        secondaryBelayerRank: 'None', 
        spotter: 'Shadow Douloid James', 
        spotterRank: 'Shadow Douloid', 
        safetyCleared: true, 
        safetyWarning: '' 
    }
];

const DEFAULT_EMERGENCY_CONTACTS = [
    { role: 'G5 Training Director', name: 'Seth Korir', phone: '+254 700 000001' },
    { role: 'Base Medical Officer', name: 'Freedom Base Medic', phone: '+254 700 000002' },
    { role: 'Daystar Athi River Security Dispatch', name: 'Campus Security', phone: '+254 700 000003' }
];

// Helper to audit roster safety guardrails
const auditDutyRoster = (dutyRoster) => {
    return dutyRoster.map(station => {
        let warnings = [];
        const leadIsShadow = station.stationLeadRank === 'Shadow Douloid' || station.stationLeadRank === 'None';
        const primaryIsShadow = station.primaryBelayerRank === 'Shadow Douloid' || station.primaryBelayerRank === 'None';
        const isHighStation = station.stationName.toLowerCase().includes('rope') || 
                              station.stationName.toLowerCase().includes('rock') || 
                              station.stationName.toLowerCase().includes('rappel') || 
                              station.stationName.toLowerCase().includes('tower');

        if (leadIsShadow) {
            warnings.push('CRITICAL: Shadow Douloid cannot serve as Station Lead!');
        }
        if (isHighStation && primaryIsShadow && !station.primaryBelayer.toLowerCase().includes('ground')) {
            warnings.push('CRITICAL: Primary Belayer cannot be a Shadow Douloid or Unranked recruit!');
        }

        const safetyCleared = warnings.length === 0;
        return {
            ...station,
            safetyCleared,
            safetyWarning: warnings.join(' | ')
        };
    });
};

const normalizeSchedule = (rawSchedule) => {
    if (!Array.isArray(rawSchedule)) return [];
    return rawSchedule.map(item => {
        let facilitators = Array.isArray(item.facilitators) 
            ? item.facilitators.map(f => String(f).trim()).filter(Boolean)
            : [];
        if (facilitators.length === 0 && item.leadFacilitator) {
            facilitators = [String(item.leadFacilitator).trim()];
        }
        return {
            ...item,
            facilitators,
            leadFacilitator: facilitators[0] || item.leadFacilitator || ''
        };
    });
};

export const getCampProgram = async (req, res) => {
    try {
        const { campus } = req.query;
        let query = {};
        if (campus && campus !== 'Both' && campus !== 'Joint') {
            query = { campus: { $in: [campus, 'Both'] } };
        }

        let program = await CampProgram.findOne(query).sort({ updatedAt: -1 });
        if (!program) {
            // Sourced dynamically from actual database cadres and leaders
            const dbCadres = await Member.find({ memberType: 'Douloid' }).select('name').limit(8);
            const cadreNames = dbCadres.map(m => m.name).filter(Boolean);
            const fallbackLeaders = cadreNames.length > 0 ? cadreNames : ['G5 Training Director', 'Field Coordinator'];

            const dynamicSchedule = DEFAULT_SCHEDULE.map((item, idx) => {
                const assignedFacilitator = cadreNames[idx % cadreNames.length] || fallbackLeaders[0];
                return {
                    ...item,
                    facilitators: [assignedFacilitator],
                    leadFacilitator: assignedFacilitator
                };
            });

            program = new CampProgram({
                title: 'Freedom Base 3-Day Leadership & Ropes Camp',
                semester: 'MAY-AUG 2026',
                campus: campus && campus !== 'Joint' ? campus : 'Both',
                theme: 'Anchored in Competence, Formed in Faith',
                schedule: dynamicSchedule,
                dutyRoster: auditDutyRoster(DEFAULT_DUTY_ROSTER),
                emergencyContacts: DEFAULT_EMERGENCY_CONTACTS,
                activeStatus: 'Published'
            });
            await program.save();
        } else if (program.schedule && program.schedule.length > 0) {
            // Ensure backwards compatibility by normalizing any schedule items lacking facilitators array
            const normalized = normalizeSchedule(program.schedule);
            const needsUpdate = program.schedule.some(s => !s.facilitators || s.facilitators.length === 0);
            if (needsUpdate) {
                program.schedule = normalized;
                await program.save();
            }
        }

        res.json(program);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveCampProgram = async (req, res) => {
    try {
        const { _id, title, semester, campus, theme, schedule, dutyRoster, emergencyContacts, activeStatus } = req.body;

        const auditedRoster = dutyRoster ? auditDutyRoster(dutyRoster) : [];
        const hasViolations = auditedRoster.some(s => !s.safetyCleared);
        const cleanSchedule = normalizeSchedule(schedule || DEFAULT_SCHEDULE);

        let program;
        if (_id) {
            program = await CampProgram.findByIdAndUpdate(_id, {
                title,
                semester,
                campus: campus || 'Both',
                theme,
                schedule: cleanSchedule,
                dutyRoster: auditedRoster,
                emergencyContacts: emergencyContacts || [],
                activeStatus: activeStatus || 'Published'
            }, { new: true });
        } else {
            program = new CampProgram({
                title: title || 'Freedom Base 3-Day Leadership & Ropes Camp',
                semester: semester || 'MAY-AUG 2026',
                campus: campus || 'Both',
                theme: theme || 'Anchored in Competence, Formed in Faith',
                schedule: cleanSchedule,
                dutyRoster: auditedRoster,
                emergencyContacts: emergencyContacts || DEFAULT_EMERGENCY_CONTACTS,
                activeStatus: activeStatus || 'Published'
            });
            await program.save();
        }

        res.json({
            program,
            hasViolations,
            safetyMessage: hasViolations 
                ? 'Constitutional safety guardrails flagged one or more assignments. Review warnings on duty roster.' 
                : 'Camp Run-Sheet & Duty Roster verified and safety-compliant.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCadresAndRecruits = async (req, res) => {
    try {
        const { campus, rank, search } = req.query;
        const query = { isActive: true };

        if (campus && campus !== 'Both' && campus !== 'Joint') {
            query.campus = campus;
        }

        if (rank && rank !== 'All') {
            if (rank === 'Recruits') {
                query.douloidRank = 'None';
            } else {
                query.douloidRank = rank;
            }
        }

        if (search && search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { studentRegNo: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        const members = await Member.find(query).sort({ totalPoints: -1, douloidRank: 1, name: 1 });

        // Calculate Directorate metrics
        const allCadresQuery = { isActive: true };
        if (campus && campus !== 'Both' && campus !== 'Joint') {
            allCadresQuery.campus = campus;
        }
        const allMembers = await Member.find(allCadresQuery);

        const metrics = {
            totalCadres: allMembers.filter(m => m.douloidRank && m.douloidRank !== 'None').length,
            recruitsInPipeline: allMembers.filter(m => !m.douloidRank || m.douloidRank === 'None').length,
            shadowDouloids: allMembers.filter(m => m.douloidRank === 'Shadow Douloid').length,
            basicDouloids: allMembers.filter(m => m.douloidRank === 'Basic Douloid').length,
            intermediateDouloids: allMembers.filter(m => m.douloidRank === 'Intermediate Douloid').length,
            leadDouloids: allMembers.filter(m => m.douloidRank === 'Lead Douloid').length,
            primaryBelayers: allMembers.filter(m => m.belayStatus === 'Primary Belayer Certified').length,
            soloClearanceCount: allMembers.filter(m => m.soloStationAllowed).length
        };

        res.json({ members, metrics });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMemberRank = async (req, res) => {
    try {
        const { id } = req.params;
        const { douloidRank, belayStatus, soloStationAllowed, notes, promotedBy } = req.body;

        const member = await Member.findById(id);
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Constitutional Guardrails (Blueprint Section 6)
        if (douloidRank === 'Shadow Douloid' || douloidRank === 'None') {
            if (belayStatus === 'Primary Belayer Certified') {
                return res.status(400).json({ 
                    message: 'Constitutional Safety Violation: Shadow Douloids and Recruits cannot hold Primary Belayer Certification!' 
                });
            }
            if (soloStationAllowed) {
                return res.status(400).json({ 
                    message: 'Constitutional Safety Violation: Shadow Douloids and Recruits cannot hold Solo Station Clearance!' 
                });
            }
        }

        // Track rank history if rank changed
        if (douloidRank && douloidRank !== member.douloidRank) {
            member.rankHistory.push({
                fromRank: member.douloidRank || 'None',
                toRank: douloidRank,
                date: new Date(),
                promotedBy: promotedBy || req.user?.username || 'G5 Directorate',
                notes: notes || 'Promoted via G5 Training Command'
            });
            member.douloidRank = douloidRank;
        }

        if (belayStatus) member.belayStatus = belayStatus;
        if (typeof soloStationAllowed === 'boolean') member.soloStationAllowed = soloStationAllowed;

        await member.save();
        res.json({ message: `Rank & clearances updated for ${member.name}`, member });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const evaluateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { domain, score, notes, passed, evaluator } = req.body;

        const validDomains = ['Team Building', 'Freedom Base Operations', 'High Ropes', 'Rescue & Extrication', 'First Aid & Wellbeing'];
        if (!validDomains.includes(domain)) {
            return res.status(400).json({ message: `Invalid domain. Must be one of: ${validDomains.join(', ')}` });
        }

        const member = await Member.findById(id);
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const evaluation = {
            date: new Date(),
            evaluator: evaluator || req.user?.username || 'G5 Directorate',
            domain,
            score: Number(score) || 3,
            notes: notes || '',
            passed: passed !== undefined ? passed : true
        };

        member.evaluations.push(evaluation);

        // Check if member qualifies for next tier
        const evaluatedDomains = new Set(member.evaluations.filter(e => e.passed && e.score >= 3).map(e => e.domain));
        const allDomainsPassed = validDomains.every(d => evaluatedDomains.has(d));

        await member.save();
        res.json({ 
            message: `Evaluation in ${domain} recorded for ${member.name}`, 
            member, 
            allDomainsPassed,
            passedDomainCount: evaluatedDomains.size
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

