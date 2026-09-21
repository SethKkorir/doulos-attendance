import RankDefinition from '../models/RankDefinition.js';
import EvaluationDomain from '../models/EvaluationDomain.js';
import Evaluation from '../models/Evaluation.js';
import Member from '../models/Member.js';
import Settings from '../models/Settings.js';

// Map Rank strings to next rank
const NEXT_RANK_MAP = {
    'None': 'Shadow Douloid',
    'Recruit': 'Shadow Douloid',
    'Shadow Douloid': 'Basic Douloid',
    'Basic Douloid': 'Intermediate Douloid',
    'Intermediate Douloid': 'Lead Douloid',
    'Lead Douloid': 'Lead Douloid'
};

const PREV_RANK_MAP = {
    'Lead Douloid': 'Intermediate Douloid',
    'Intermediate Douloid': 'Basic Douloid',
    'Basic Douloid': 'Shadow Douloid',
    'Shadow Douloid': 'None'
};

// 1. Get Rank Definitions
export const getRankDefinitions = async (req, res) => {
    try {
        const ranks = await RankDefinition.find().sort({ order: 1 });
        res.json({ success: true, ranks });
    } catch (err) {
        console.error('Error fetching rank definitions:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 2. Get Dynamic Evaluation Domains
export const getEvaluationDomains = async (req, res) => {
    try {
        const domains = await EvaluationDomain.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, domains });
    } catch (err) {
        console.error('Error fetching evaluation domains:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 3. Get Promotion Candidates (Server-Computed)
export const getPromotionCandidates = async (req, res) => {
    try {
        const { rank, campus } = req.query;
        const query = { status: 'Active' };

        if (campus && campus !== 'All') {
            query.campus = campus;
        }

        if (rank && rank !== 'All') {
            query.douloidRank = rank;
        } else {
            // Exclude Lead Douloid (already highest rank) and None (handled in graduation queue)
            query.douloidRank = { $in: ['Shadow Douloid', 'Basic Douloid', 'Intermediate Douloid'] };
        }

        if (req.query.includeInactive !== 'true') {
            const semSetting = await Settings.findOne({ key: 'current_semester' });
            const currentSemester = semSetting?.value?.trim() || 'SEP-DEC 2026';
            query.isActiveThisSemester = true;
            query.lastConfirmedSemester = currentSemester;
        }

        const candidates = await Member.find(query).sort({ totalPoints: -1 });

        // Add server-computed recommendations and next ranks
        const enriched = candidates.map(member => {
            const currentRank = member.douloidRank || 'Shadow Douloid';
            const nextRank = NEXT_RANK_MAP[currentRank] || currentRank;
            
            // Server threshold evaluation
            let isEligible = false;
            if (currentRank === 'Shadow Douloid' && member.totalPoints >= 40) isEligible = true;
            if (currentRank === 'Basic Douloid' && member.totalPoints >= 70) isEligible = true;
            if (currentRank === 'Intermediate Douloid' && member.totalPoints >= 100) isEligible = true;

            return {
                ...member.toObject(),
                nextRank,
                isEligible,
                evaluationsCount: member.evaluations?.length || 0
            };
        });

        res.json({ success: true, candidates: enriched });
    } catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 4. Submit Evaluation
export const submitEvaluation = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { scores, notes, recommendation, evaluatorName } = req.body;

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const scoreValues = Object.values(scores || {});
        const averageScore = scoreValues.length > 0 
            ? Number((scoreValues.reduce((a, b) => a + Number(b), 0) / scoreValues.length).toFixed(2))
            : 0;

        const currentRank = member.douloidRank || 'None';
        const targetRank = NEXT_RANK_MAP[currentRank] || currentRank;

        const evaluation = new Evaluation({
            memberId,
            evaluatorId: req.user?._id || null,
            evaluatorName: evaluatorName || req.user?.username || 'G5 Training Directorate',
            date: new Date(),
            scores,
            averageScore,
            recommendation: recommendation || 'promote',
            targetRank,
            notes: notes || ''
        });

        await evaluation.save();

        // Push summary into member's embedded evaluations array
        if (!member.evaluations) member.evaluations = [];
        member.evaluations.push({
            date: new Date(),
            evaluator: evaluatorName || 'G5 Training Directorate',
            domain: 'Comprehensive 7-Area Evaluation',
            score: Math.round(averageScore) || 4,
            notes: notes || `Avg Score: ${averageScore}★ (${recommendation})`,
            passed: recommendation === 'promote'
        });

        await member.save();

        res.json({
            success: true,
            message: `Evaluation submitted successfully for ${member.name}`,
            evaluation
        });
    } catch (err) {
        console.error('Error submitting evaluation:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 5. Confirm Promotion
export const promoteMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { targetRank, notes } = req.body;

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const fromRank = member.douloidRank || 'None';
        const toRank = targetRank || NEXT_RANK_MAP[fromRank] || 'Basic Douloid';

        // Lookup rank definition permissions
        const rankDefKey = toRank.toLowerCase().split(' ')[0]; // 'shadow', 'basic', 'intermediate', 'lead'
        const rankDef = await RankDefinition.findOne({ rank: rankDefKey });

        const belayStatus = rankDef 
            ? (rankDef.belayPermission === 'primary' ? 'Primary Belayer Certified' : (rankDef.belayPermission === 'secondary' ? 'Secondary Belayer' : 'Not Permitted'))
            : (toRank.includes('Lead') || toRank.includes('Intermediate') ? 'Primary Belayer Certified' : (toRank.includes('Basic') ? 'Secondary Belayer' : 'Not Permitted'));

        const soloStationAllowed = rankDef ? rankDef.canRunGroupAlone : (toRank.includes('Lead') || toRank.includes('Intermediate'));

        member.douloidRank = toRank;
        member.belayStatus = belayStatus;
        member.soloStationAllowed = soloStationAllowed;
        member.memberType = 'Douloid';

        if (!member.rankHistory) member.rankHistory = [];
        member.rankHistory.push({
            fromRank,
            toRank,
            date: new Date(),
            promotedBy: req.user?.username || 'G5 Training Directorate',
            notes: notes || `Promoted to ${toRank}`
        });

        await member.save();

        res.json({
            success: true,
            message: `Successfully promoted ${member.name} to ${toRank}`,
            member
        });
    } catch (err) {
        console.error('Error promoting member:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 6. Downgrade Member (Requires Reason)
export const downgradeMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { reason, targetRank } = req.body;

        // Non-negotiable rule: require reason field
        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Downgrade rejected: A detailed reason is strictly required by the Council Governance protocol.'
            });
        }

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const fromRank = member.douloidRank || 'Basic Douloid';
        const toRank = targetRank || PREV_RANK_MAP[fromRank] || 'Shadow Douloid';

        const rankDefKey = toRank.toLowerCase().split(' ')[0];
        const rankDef = await RankDefinition.findOne({ rank: rankDefKey });

        const belayStatus = rankDef 
            ? (rankDef.belayPermission === 'primary' ? 'Primary Belayer Certified' : (rankDef.belayPermission === 'secondary' ? 'Secondary Belayer' : 'Not Permitted'))
            : 'Not Permitted';

        const soloStationAllowed = rankDef ? rankDef.canRunGroupAlone : false;

        member.douloidRank = toRank;
        member.belayStatus = belayStatus;
        member.soloStationAllowed = soloStationAllowed;

        if (!member.rankHistory) member.rankHistory = [];
        member.rankHistory.push({
            fromRank,
            toRank,
            date: new Date(),
            promotedBy: req.user?.username || 'G5 Training Directorate',
            notes: `Downgrade executed: ${reason.trim()}`
        });

        await member.save();

        res.json({
            success: true,
            message: `Member ${member.name} adjusted to ${toRank}`,
            member
        });
    } catch (err) {
        console.error('Error downgrading member:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 7. Cadre Roster with Belay Clearances
export const getCadreRoster = async (req, res) => {
    try {
        const { rank, campus } = req.query;
        const query = {
            status: 'Active',
            douloidRank: { $in: ['Shadow Douloid', 'Basic Douloid', 'Intermediate Douloid', 'Lead Douloid'] }
        };

        if (rank && rank !== 'All') {
            query.douloidRank = rank;
        }
        if (campus && campus !== 'All') {
            query.campus = campus;
        }

        const cadres = await Member.find(query).sort({ totalPoints: -1 });

        // Lookup rank definitions for accurate clearance attributes
        const rankDefs = await RankDefinition.find();
        const defMap = {};
        rankDefs.forEach(rd => {
            defMap[rd.rank] = rd;
        });

        const enrichedCadres = cadres.map(cadre => {
            const rankKey = (cadre.douloidRank || '').toLowerCase().split(' ')[0];
            const def = defMap[rankKey];

            return {
                ...cadre.toObject(),
                belayPermissionDisplay: def 
                    ? (def.belayPermission === 'primary' ? 'Primary Belayer Certified' : (def.belayPermission === 'secondary' ? 'Secondary Belayer' : 'Not Permitted'))
                    : (cadre.belayStatus || 'Not Permitted'),
                canRunGroupAlone: def ? def.canRunGroupAlone : cadre.soloStationAllowed
            };
        });

        res.json({ success: true, cadres: enrichedCadres });
    } catch (err) {
        console.error('Error fetching cadre roster:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
