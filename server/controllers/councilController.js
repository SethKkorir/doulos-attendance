import Requisition from '../models/Requisition.js';
import GearAsset from '../models/GearAsset.js';
import IncidentLog from '../models/IncidentLog.js';
import CouncilMinutes from '../models/CouncilMinutes.js';
import HandoverDossier from '../models/HandoverDossier.js';
import SemesterRolloverSnapshot from '../models/SemesterRolloverSnapshot.js';
import Member from '../models/Member.js';
import Payment from '../models/Payment.js';
import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Attendance from '../models/Attendance.js';
import Settings from '../models/Settings.js';
import crypto from 'crypto';
import { getKenyanTime, getKenyanDate } from '../utils/kenyanTime.js';

// ========================================================
// G1 & G2: EXECUTIVE COMMAND RADAR & CROSS-CAMPUS HEALTH
// ========================================================

export const getExecutiveRadar = async (req, res) => {
    try {
        const [
            athiMembersCount,
            vrMembersCount,
            athiRecruitsCount,
            vrRecruitsCount,
            gearAlertsCount,
            unverifiedMpesaCount,
            openIncidentsCount,
            pendingG1Requisitions,
            recentSnapshots
        ] = await Promise.all([
            Member.countDocuments({ campus: 'Athi River', isActive: true }),
            Member.countDocuments({ campus: 'Valley Road', isActive: true }),
            Member.countDocuments({ campus: 'Athi River', isActive: true, douloidRank: { $in: ['None', null] } }),
            Member.countDocuments({ campus: 'Valley Road', isActive: true, douloidRank: { $in: ['None', null] } }),
            GearAsset.countDocuments({ status: { $in: ['Inspection Due', 'DECOMMISSION REQUIRED'] } }),
            Payment.countDocuments({ status: 'pending' }),
            IncidentLog.countDocuments({ status: 'Under Investigation' }),
            Requisition.find({ status: 'Pending G1 Approval' }).sort({ urgency: -1, createdAt: -1 }),
            SemesterRolloverSnapshot.findOne({ isRollbackAvailable: true }).sort({ createdAt: -1 })
        ]);

        const recentMeetings = await Meeting.find().sort({ date: -1 }).limit(5);

        res.json({
            campuses: {
                athiRiver: { activeMembers: athiMembersCount, recruitsInPipeline: athiRecruitsCount },
                valleyRoad: { activeMembers: vrMembersCount, recruitsInPipeline: vrRecruitsCount }
            },
            gearLoad: { alertsCount: gearAlertsCount },
            treasury: { unverifiedMpesaCount },
            safety: { openIncidentsCount },
            pendingRequisitions: pendingG1Requisitions,
            rollbackAvailable: !!recentSnapshots,
            recentMeetings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// US-REQ-015: 4-TIER REQUISITION PIPELINE (G8 -> G5 -> G7 -> G1)
// ========================================================

export const getRequisitions = async (req, res) => {
    try {
        const { status, urgency } = req.query;
        const query = {};
        if (status && status !== 'All') query.status = status;
        if (urgency && urgency !== 'All') query.urgency = urgency;

        const requisitions = await Requisition.find(query).sort({ createdAt: -1 });
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createRequisition = async (req, res) => {
    try {
        const { title, description, itemType, urgency, estimatedCost, affectedGearSerial, damagePhotoUrls, campus } = req.body;
        const loggedUser = req.user?.username || 'G8 Assets Steward';

        const requisition = new Requisition({
            title,
            description,
            itemType: itemType || 'Gear Replacement',
            urgency: urgency || 'Medium',
            estimatedCost: Number(estimatedCost) || 0,
            affectedGearSerial: affectedGearSerial || null,
            damagePhotoUrls: damagePhotoUrls || [],
            campus: campus || 'Freedom Base',
            status: 'Pending G5 Safety',
            initiatedBy: {
                officer: loggedUser,
                date: new Date(),
                notes: req.body.notes || 'Initiated via G8 Assets Console'
            }
        });

        await requisition.save();
        res.status(201).json({ message: 'Requisition initiated and forwarded to G5 Safety Director', requisition });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const advanceRequisition = async (req, res) => {
    try {
        const { id } = req.params;
        const { stage, action, notes, disbursementCode, sourceFund, mandatoryDecommission, rejectionReason } = req.body;
        const loggedUser = req.user?.username || 'G-Council Officer';

        const reqDoc = await Requisition.findById(id);
        if (!reqDoc) return res.status(404).json({ message: 'Requisition not found' });

        if (action === 'reject') {
            reqDoc.status = 'Rejected';
            reqDoc.executiveApproval = {
                approved: false,
                officer: loggedUser,
                date: new Date(),
                rejectionReason: rejectionReason || 'Rejected during council review',
                notes: notes || ''
            };
            await reqDoc.save();
            return res.json({ message: 'Requisition rejected and returned with notes', requisition: reqDoc });
        }

        // Advance based on stage
        if (stage === 'g5_safety') {
            reqDoc.safetyVerification = {
                verified: true,
                officer: loggedUser,
                date: new Date(),
                mandatoryDecommission: !!mandatoryDecommission,
                fallHistoryAssessed: true,
                notes: notes || 'Life-safety verified'
            };
            reqDoc.status = 'Pending G7 Budget';
        } else if (stage === 'g7_budget') {
            reqDoc.budgetClearance = {
                cleared: true,
                officer: loggedUser,
                date: new Date(),
                disbursementCode: disbursementCode || `DISB-${Date.now().toString().slice(-6)}`,
                sourceFund: sourceFund || 'Gear Maintenance Reserve',
                notes: notes || 'Budget cleared'
            };
            reqDoc.status = 'Pending G1 Approval';
        } else if (stage === 'g1_executive') {
            reqDoc.executiveApproval = {
                approved: true,
                officer: loggedUser,
                date: new Date(),
                rejectionReason: '',
                notes: notes || 'Executive final sign-off granted'
            };
            reqDoc.status = 'Approved';

            // Automated Inventory Decommissioning (US-REQ-015)
            if (reqDoc.affectedGearSerial) {
                const asset = await GearAsset.findOne({ serialNumber: reqDoc.affectedGearSerial });
                if (asset) {
                    asset.status = 'Retired/Scrapped';
                    asset.decommissionDetails = {
                        date: new Date(),
                        reason: `Decommissioned via approved Requisition: ${reqDoc.title}`,
                        approvedBy: loggedUser,
                        requisitionRef: reqDoc._id
                    };
                    await asset.save();
                    reqDoc.status = 'Decommissioned & Replaced';
                }
            }
        }

        await reqDoc.save();
        res.json({ message: `Requisition advanced to ${reqDoc.status}`, requisition: reqDoc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// G3: MINUTES VAULT & OFFICIAL TRANSCRIPTS (US-G3-004)
// ========================================================

export const getCouncilMinutes = async (req, res) => {
    try {
        const minutes = await CouncilMinutes.find().sort({ meetingDate: -1 });
        res.json(minutes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCouncilMinutes = async (req, res) => {
    try {
        const { meetingDate, meetingType, location, presidedBy, recordedBy, agenda, attendees, resolutions, notes } = req.body;
        const minutes = new CouncilMinutes({
            meetingDate: meetingDate || new Date(),
            meetingType: meetingType || 'Executive G-Council',
            location: location || 'Freedom Base Council Chamber',
            presidedBy: presidedBy || 'G1 Coordinator',
            recordedBy: recordedBy || req.user?.username || 'G3 Secretary',
            agenda: agenda || [],
            attendees: attendees || [],
            resolutions: resolutions || [],
            notes: notes || ''
        });
        await minutes.save();
        res.status(201).json({ message: 'Meeting minutes entered into Vault', minutes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const lockCouncilMinutes = async (req, res) => {
    try {
        const { id } = req.params;
        const loggedUser = req.user?.username || 'G3 Secretary';
        const minutes = await CouncilMinutes.findByIdAndUpdate(id, {
            isLocked: true,
            lockedAt: new Date(),
            lockedBy: loggedUser
        }, { new: true });
        res.json({ message: 'Minutes permanently locked in Vault (Tamper-Proof)', minutes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMemberServiceTranscript = async (req, res) => {
    try {
        const { memberId } = req.params;
        const member = await Member.findById(memberId);
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const [attendanceCount, trainingsAttended] = await Promise.all([
            Attendance.countDocuments({ studentRegNo: member.studentRegNo }),
            Training.find({ 'roster.studentRegNo': member.studentRegNo })
        ]);

        const transcript = {
            officerName: member.name,
            admissionNumber: member.studentRegNo,
            campus: member.campus,
            douloidRank: member.douloidRank || 'Recruit',
            belayStatus: member.belayStatus || 'Not Permitted',
            soloStationAllowed: member.soloStationAllowed || false,
            totalPoints: member.totalPoints || 0,
            fellowshipMeetingsCount: attendanceCount,
            trainingsCount: trainingsAttended.length,
            evaluations: member.evaluations || [],
            rankHistory: member.rankHistory || [],
            certifiedDate: new Date(),
            certifiedBy: 'G3 Secretariat & G1 Executive Coordinator'
        };

        res.json(transcript);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// G4: LOGISTICS, EXPEDITIONS & SAFETY ALLOCATIONS (US-G4-005)
// ========================================================

export const validateStationAssignment = async (req, res) => {
    try {
        const { candidateRegNo, stationType, requestedRole } = req.body;
        const member = await Member.findOne({ studentRegNo: candidateRegNo });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const rank = member.douloidRank || 'None';
        const isBelayStation = ['High Ropes', 'Rock Face', 'Rappel', 'Burma Bridge'].includes(stationType);

        // Safety Guardrail: Shadow Douloids cannot belay
        if (isBelayStation && requestedRole.toLowerCase().includes('belay') && (rank === 'Shadow Douloid' || rank === 'None')) {
            return res.json({
                allowed: false,
                reason: 'CRITICAL CONSTITUTIONAL VIOLATION: Shadow Douloids and Recruits are strictly forbidden from Belay Stations!'
            });
        }

        // Safety Guardrail: Basic Douloids cannot be Primary Belayer
        if (isBelayStation && requestedRole.toLowerCase().includes('primary') && rank === 'Basic Douloid') {
            return res.json({
                allowed: false,
                reason: 'CONSTITUTIONAL VIOLATION: Basic Douloids can only serve as Secondary Backup Belayers!'
            });
        }

        res.json({
            allowed: true,
            message: `Cleared for ${requestedRole} at ${stationType}`,
            member: { name: member.name, rank: member.douloidRank, belayStatus: member.belayStatus }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// G5: INCIDENT & NEAR-MISS INVESTIGATIONS (US-G5-006)
// ========================================================

export const getIncidentLogs = async (req, res) => {
    try {
        const incidents = await IncidentLog.find().sort({ incidentDate: -1 });
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createIncidentLog = async (req, res) => {
    try {
        const { title, severity, location, campus, involvedParties, description, equipmentInvolved, rootCauseAnalysis, correctiveActionPlan } = req.body;
        const incident = new IncidentLog({
            title,
            severity: severity || 'Near-Miss',
            location: location || 'Freedom Base',
            campus: campus || 'Freedom Base',
            involvedParties: involvedParties || [],
            description,
            equipmentInvolved: equipmentInvolved || '',
            rootCauseAnalysis,
            correctiveActionPlan,
            investigator: req.user?.username || 'G5 Training & Safety Director'
        });
        await incident.save();
        res.status(201).json({ message: 'Incident & Near-Miss Log filed with Action Plan', incident });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const closeIncidentLog = async (req, res) => {
    try {
        const { id } = req.params;
        const loggedUser = req.user?.username || 'G1 Executive Coordinator';
        const incident = await IncidentLog.findByIdAndUpdate(id, {
            status: 'Reviewed & Closed by G1',
            closedAt: new Date(),
            closedBy: loggedUser
        }, { new: true });
        res.json({ message: 'Incident investigation officially reviewed and closed', incident });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// G6: WELFARE LIVE COCKPIT & ABSENCE RADAR (US-G6-007)
// ========================================================

export const getWelfareLiveTicker = async (req, res) => {
    try {
        const { campus } = req.query;
        const todayStr = getKenyanDate();

        // Fetch today's active meeting
        const query = { date: { $regex: new RegExp(`^${todayStr}`) } };
        if (campus && campus !== 'Both') query.campus = { $in: [campus, 'Both'] };

        const activeMeeting = await Meeting.findOne(query);
        let recentAttendances = [];
        if (activeMeeting) {
            recentAttendances = await Attendance.find({ meetingId: activeMeeting._id })
                .sort({ timestamp: -1 })
                .limit(20);
        }

        res.json({ activeMeeting, recentAttendances });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAbsenceRadar = async (req, res) => {
    try {
        const { campus } = req.query;
        const query = { isActive: true, consecutiveAbsences: { $gte: 2 } };
        if (campus && campus !== 'Both') query.campus = campus;

        const flaggedMembers = await Member.find(query).sort({ consecutiveAbsences: -1, name: 1 });

        // Generate 1-tap WhatsApp deep-links with personalized pastoral text
        const membersWithCareLinks = flaggedMembers.map(m => {
            const firstName = m.name.split(' ')[0] || m.name;
            const message = encodeURIComponent(
                `Habari ${firstName}! Greetings from the Doulos Family at ${m.campus}. We noticed you've missed fellowship recently and wanted to check in on you. Hope you're well! Reach out if you need prayer or support. 🙏⛺`
            );
            const whatsappLink = m.squadLeaderPhone 
                ? `https://wa.me/${m.squadLeaderPhone.replace(/[^0-9]/g, '')}?text=${message}`
                : `https://wa.me/?text=${message}`;

            return {
                ...m.toObject(),
                whatsappLink
            };
        });

        res.json({ flaggedCount: flaggedMembers.length, members: membersWithCareLinks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const executeManualCheckin = async (req, res) => {
    try {
        const { studentRegNo, meetingId, reason } = req.body;
        const member = await Member.findOne({ studentRegNo });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return res.status(404).json({ message: 'Meeting session not found' });

        const existing = await Attendance.findOne({ meetingId, studentRegNo });
        if (existing) return res.status(400).json({ message: 'Student already checked into this session' });

        const attendance = new Attendance({
            meetingId,
            studentRegNo,
            studentName: member.name,
            campus: member.campus,
            timestamp: new Date(),
            deviceId: 'MANUAL-CHECKIN-G6',
            manualCheckinJustification: reason || 'Phone battery depleted / Manual G6 check-in'
        });
        await attendance.save();

        // Award +10 points & reset absence counter
        member.totalPoints = (member.totalPoints || 0) + 10;
        member.consecutiveAbsences = 0;
        await member.save();

        res.json({ message: `Manual check-in recorded for ${member.name} (+10 points)`, attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// G7: TREASURY, MPESA MATCHING & DEFAULTERS (US-G7-008)
// ========================================================

export const getMpesaQueue = async (req, res) => {
    try {
        const pendingPayments = await Payment.find({ status: 'pending' }).sort({ createdAt: -1 });
        const approvedCount = await Payment.countDocuments({ status: 'approved' });
        const totalCollected = await Payment.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            pendingPayments,
            approvedCount,
            totalCollectedAmount: totalCollected[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyMpesaPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, notes, matchedBankStatementRef } = req.body;
        const loggedUser = req.user?.id;

        const payment = await Payment.findById(id);
        if (!payment) return res.status(404).json({ message: 'Payment record not found' });

        if (action === 'approve') {
            payment.status = 'approved';
            payment.verifiedBy = loggedUser;
            payment.verifiedAt = new Date();
            payment.verificationNotes = notes || 'Verified against organization bank/till statement';
            payment.matchedBankStatementRef = matchedBankStatementRef || `BANK-MATCH-${Date.now()}`;
            await payment.save();

            // Award financial points or mark dues cleared on Member profile
            await Member.findOneAndUpdate(
                { studentRegNo: payment.studentRegNo },
                { $inc: { totalPoints: 5 } } // stewardship bonus
            );

            return res.json({ message: `MPESA Code ${payment.mpesaCode} successfully verified! Dues cleared.`, payment });
        } else {
            payment.status = 'rejected';
            payment.rejectionReason = notes || 'Transaction code not found on bank statement';
            await payment.save();
            return res.json({ message: `Payment marked as rejected`, payment });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// G8: GEAR ASSETS & FREEDOM BASE STEWARDSHIP (US-G8-009)
// ========================================================

export const getGearAssets = async (req, res) => {
    try {
        const { category, status } = req.query;
        const query = {};
        if (category && category !== 'All') query.category = category;
        if (status && status !== 'All') query.status = status;

        const assets = await GearAsset.find(query).sort({ status: 1, createdAt: -1 });

        // Update any asset that exceeded its retirement clock
        const now = Date.now();
        const assetsWithAudit = assets.map(a => {
            const ageYears = (now - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const isAgeExceeded = ageYears >= a.lifespanYears;
            const isCyclesExceeded = a.loadCyclesCount >= a.maxLoadCycles;
            const requiresDecommission = (isAgeExceeded || isCyclesExceeded) && a.status !== 'Retired/Scrapped';

            return {
                ...a.toObject(),
                ageYears: Math.round(ageYears * 10) / 10,
                isAgeExceeded,
                isCyclesExceeded,
                requiresDecommission
            };
        });

        res.json(assetsWithAudit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createGearAsset = async (req, res) => {
    try {
        const { serialNumber, name, category, brand, purchaseDate, lifespanYears, maxLoadCycles, assignedLocation, campus } = req.body;
        const asset = new GearAsset({
            serialNumber,
            name,
            category,
            brand: brand || 'Petzl / Black Diamond',
            purchaseDate: purchaseDate || new Date(),
            lifespanYears: Number(lifespanYears) || 5,
            maxLoadCycles: Number(maxLoadCycles) || 100,
            assignedLocation: assignedLocation || 'Freedom Base Ropes Shed',
            campus: campus || 'Freedom Base'
        });
        await asset.save();
        res.status(201).json({ message: 'Gear registered with retirement clock', asset });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logGearInspection = async (req, res) => {
    try {
        const { id } = req.params;
        const { passed, barrelTurnsFreely, sheathIntact, webbingIntact, notes, cycleIncrement } = req.body;
        const loggedUser = req.user?.username || 'G8 Equipment Steward';

        const asset = await GearAsset.findById(id);
        if (!asset) return res.status(404).json({ message: 'Gear asset not found' });

        asset.inspectionLogs.push({
            inspectionDate: new Date(),
            inspector: loggedUser,
            passed: !!passed,
            barrelTurnsFreely: barrelTurnsFreely !== undefined ? barrelTurnsFreely : true,
            sheathIntact: sheathIntact !== undefined ? sheathIntact : true,
            webbingIntact: webbingIntact !== undefined ? webbingIntact : true,
            notes: notes || ''
        });

        if (cycleIncrement) {
            asset.loadCyclesCount += Number(cycleIncrement);
        }

        if (!passed) {
            asset.status = 'Inspection Due';
        } else if (asset.status === 'Inspection Due') {
            asset.status = 'Active Service';
        }

        await asset.save();
        res.json({ message: `Inspection logged for ${asset.name}`, asset });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// G9: MEDIA, BIRTHDAY STUDIO & TELEMETRY (US-G9-010)
// ========================================================

export const getBirthdayQueue = async (req, res) => {
    try {
        // Members celebrating birthdays in the upcoming 14 days
        const members = await Member.find({ dateOfBirth: { $ne: null }, isActive: true });
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        const upcoming = members.filter(m => {
            const bday = new Date(m.dateOfBirth);
            const bMonth = bday.getMonth();
            const bDay = bday.getDate();

            // Simple within-14-days check
            const thisYearBday = new Date(today.getFullYear(), bMonth, bDay);
            const diffDays = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
            return diffDays >= -1 && diffDays <= 14;
        });

        res.json(upcoming);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateBirthdayPosterStatus = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { status } = req.body;
        const member = await Member.findByIdAndUpdate(memberId, { birthdayPosterStatus: status }, { new: true });
        res.json({ message: `Birthday poster status updated to ${status}`, member });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetDeviceLock = async (req, res) => {
    try {
        const { studentRegNo, reason } = req.body;
        const member = await Member.findOneAndUpdate(
            { studentRegNo },
            { linkedDeviceId: null },
            { new: true }
        );
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json({ message: `Device lock released for ${member.name}. They can now bind their new phone on next scan.`, member });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const mintMasterSemesterQr = async (req, res) => {
    try {
        const { semesterCode } = req.body;
        const token = 'DOULOS-MASTER-' + (semesterCode || '2026') + '-' + crypto.randomBytes(6).toString('hex').toUpperCase();
        
        await Settings.findOneAndUpdate(
            { key: 'master_semester_qr_token' },
            { key: 'master_semester_qr_token', value: token },
            { upsert: true }
        );

        res.json({
            message: 'Master Single Semester QR minted for entrance canvas',
            token,
            semesterCode
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// US-TEN-011: 1-YEAR LEADERSHIP HANDOVER DOSSIER
// ========================================================

export const getHandoverDossiers = async (req, res) => {
    try {
        const dossiers = await HandoverDossier.find().sort({ createdAt: -1 });
        res.json(dossiers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const submitHandoverDossier = async (req, res) => {
    try {
        const { officerName, admissionNumber, portfolio, tenurePeriod, milestonesSummary, assetAndFileInventory, inProgressInitiatives, strategicRecommendations, transitionPath } = req.body;
        const dossier = new HandoverDossier({
            officerName,
            admissionNumber,
            portfolio,
            tenurePeriod: tenurePeriod || '2025/2026',
            milestonesSummary,
            assetAndFileInventory,
            inProgressInitiatives,
            strategicRecommendations,
            transitionPath: transitionPath || 'Alumni / Senior Douloid',
            status: 'Submitted for Review'
        });
        await dossier.save();
        res.status(201).json({ message: 'Handover Dossier submitted for G1 Executive Sealing', dossier });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const sealHandoverDossier = async (req, res) => {
    try {
        const { id } = req.params;
        const { endorsementNotes } = req.body;
        const loggedUser = req.user?.username || 'G1 Executive Coordinator';

        const dossier = await HandoverDossier.findByIdAndUpdate(id, {
            status: 'Sealed in Archives by G1',
            sealedAt: new Date(),
            sealedBy: loggedUser,
            endorsementNotes: endorsementNotes || 'Sealed into permanent ministry archives'
        }, { new: true });

        res.json({ message: 'Dossier permanently sealed in Ministry Historical Archives', dossier });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========================================================
// US-ROL-012: 5-STEP SEMESTER ROLLOVER & 1-CLICK ROLLBACK
// ========================================================

export const executeSemesterRollover = async (req, res) => {
    try {
        const { fromSemester, toSemester, spiritualTheme, anchorScripture } = req.body;
        const loggedUser = req.user?.username || 'G1 Coordinator';

        // 1. Capture atomic pre-rollover snapshot
        const allMembers = await Member.find();
        const activeMeetings = await Meeting.find({ isActive: true });
        const activeTrainings = await Training.find({ isActive: true });

        const snapshot = new SemesterRolloverSnapshot({
            fromSemester: fromSemester || 'CURRENT',
            toSemester: toSemester || 'NEXT',
            executedBy: loggedUser,
            membersCount: allMembers.length,
            backupPayload: {
                members: allMembers.map(m => ({
                    _id: m._id,
                    douloidRank: m.douloidRank,
                    totalPoints: m.totalPoints,
                    consecutiveAbsences: m.consecutiveAbsences,
                    lastActiveSemester: m.lastActiveSemester
                })),
                activeMeetingIds: activeMeetings.map(m => m._id),
                activeTrainingIds: activeTrainings.map(t => t._id)
            }
        });
        await snapshot.save();

        // 2. Batch promote eligible recruits (8+ meetings) to Shadow Douloid
        const eligibleRecruits = await Member.find({
            isActive: true,
            douloidRank: { $in: ['None', null] },
            totalPoints: { $gte: 80 } // Equivalent to 8 meetings * 10 pts
        });

        for (const recruit of eligibleRecruits) {
            recruit.douloidRank = 'Shadow Douloid';
            recruit.rankHistory.push({
                fromRank: 'Recruit',
                toRank: 'Shadow Douloid',
                date: new Date(),
                promotedBy: `Semester Rollover to ${toSemester}`,
                notes: 'Commissioned at Recruit Cohort Graduation'
            });
            await recruit.save();
        }

        // 3. Deactivate completed semester sessions
        await Meeting.updateMany({ isActive: true }, { isActive: false });
        await Training.updateMany({ isActive: true }, { isActive: false });

        // 4. Update semester settings
        if (toSemester) {
            await Settings.findOneAndUpdate({ key: 'current_semester' }, { key: 'current_semester', value: toSemester }, { upsert: true });
        }
        if (spiritualTheme) {
            await Settings.findOneAndUpdate({ key: 'semester_theme' }, { key: 'semester_theme', value: spiritualTheme }, { upsert: true });
        }
        if (anchorScripture) {
            await Settings.findOneAndUpdate({ key: 'semester_verse' }, { key: 'semester_verse', value: anchorScripture }, { upsert: true });
        }

        // 5. Mint new entrance token
        const newQrToken = 'DOULOS-MASTER-' + toSemester + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        await Settings.findOneAndUpdate({ key: 'master_semester_qr_token' }, { key: 'master_semester_qr_token', value: newQrToken }, { upsert: true });

        res.json({
            message: `Semester Rollover to ${toSemester} executed successfully!`,
            promotedRecruitsCount: eligibleRecruits.length,
            snapshotId: snapshot._id,
            newMasterQrToken: newQrToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rollbackSemesterRollover = async (req, res) => {
    try {
        const latestSnapshot = await SemesterRolloverSnapshot.findOne({ isRollbackAvailable: true, isRolledBack: false }).sort({ createdAt: -1 });
        if (!latestSnapshot) {
            return res.status(404).json({ message: 'No available rollover snapshot found for rollback' });
        }

        const loggedUser = req.user?.username || 'SuperAdmin';
        const payload = latestSnapshot.backupPayload;

        // Restore member ranks
        if (payload?.members) {
            for (const mData of payload.members) {
                await Member.findByIdAndUpdate(mData._id, {
                    douloidRank: mData.douloidRank,
                    totalPoints: mData.totalPoints,
                    consecutiveAbsences: mData.consecutiveAbsences
                });
            }
        }

        // Re-activate sessions
        if (payload?.activeMeetingIds?.length) {
            await Meeting.updateMany({ _id: { $in: payload.activeMeetingIds } }, { isActive: true });
        }
        if (payload?.activeTrainingIds?.length) {
            await Training.updateMany({ _id: { $in: payload.activeTrainingIds } }, { isActive: true });
        }

        // Restore semester
        await Settings.findOneAndUpdate({ key: 'current_semester' }, { value: latestSnapshot.fromSemester });

        latestSnapshot.isRolledBack = true;
        latestSnapshot.rolledBackAt = new Date();
        latestSnapshot.rolledBackBy = loggedUser;
        await latestSnapshot.save();

        res.json({
            message: `Rollback completed! Restored to ${latestSnapshot.fromSemester} state without data loss.`,
            restoredFromSnapshot: latestSnapshot._id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
