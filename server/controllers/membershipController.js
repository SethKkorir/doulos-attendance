import Member from '../models/Member.js';

// 1. Graduation Queue (Server determines eligibility)
export const getGraduationQueue = async (req, res) => {
    try {
        const { campus } = req.query;
        const query = {
            status: 'Active',
            $or: [
                { memberType: 'Recruit' },
                { douloidRank: 'None' },
                { douloidRank: null }
            ]
        };

        if (campus && campus !== 'All') {
            query.campus = campus;
        }

        const recruits = await Member.find(query).sort({ totalPoints: -1 });

        // Server determines graduation qualification (80+ points or >= 8 drills)
        const queue = recruits.map(recruit => {
            const points = recruit.totalPoints || 0;
            const completedMilestones = recruit.completedMilestones || Math.floor(points / 10);
            const isQualified = points >= 80 || completedMilestones >= 8;

            return {
                ...recruit.toObject(),
                completedMilestones,
                isQualified,
                targetRank: 'Shadow Douloid',
                progressPercentage: Math.min(100, Math.round((points / 80) * 100))
            };
        });

        const readyCount = queue.filter(r => r.isQualified).length;

        res.json({
            success: true,
            totalRecruits: queue.length,
            readyCount,
            queue
        });
    } catch (err) {
        console.error('Error in getGraduationQueue:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 2. Graduate One Recruit
export const graduateRecruit = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { notes } = req.body;

        const recruit = await Member.findById(memberId);
        if (!recruit) {
            return res.status(404).json({ success: false, message: 'Recruit not found' });
        }

        recruit.memberType = 'Douloid';
        recruit.douloidRank = 'Shadow Douloid';
        recruit.belayStatus = 'Not Permitted';
        recruit.soloStationAllowed = false;
        recruit.status = 'Active';

        if (!recruit.rankHistory) recruit.rankHistory = [];
        recruit.rankHistory.push({
            fromRank: 'Recruit',
            toRank: 'Shadow Douloid',
            date: new Date(),
            promotedBy: req.user?.username || 'G5 Training Directorate',
            notes: notes || 'Recruit graduated to Shadow Douloid cadre'
        });

        await recruit.save();

        res.json({
            success: true,
            message: `Congratulations! ${recruit.name} graduated to Shadow Douloid.`,
            member: recruit
        });
    } catch (err) {
        console.error('Error graduating recruit:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 3. Graduate Cohort (Bulk)
export const graduateCohort = async (req, res) => {
    try {
        const { memberIds, notes } = req.body;

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Array of memberIds required' });
        }

        const updateResult = await Member.updateMany(
            { _id: { $in: memberIds } },
            {
                $set: {
                    memberType: 'Douloid',
                    douloidRank: 'Shadow Douloid',
                    belayStatus: 'Not Permitted',
                    soloStationAllowed: false,
                    status: 'Active'
                },
                $push: {
                    rankHistory: {
                        fromRank: 'Recruit',
                        toRank: 'Shadow Douloid',
                        date: new Date(),
                        promotedBy: req.user?.username || 'G5 Training Directorate',
                        notes: notes || 'Cohort graduation to Shadow Douloid cadre'
                    }
                }
            }
        );

        res.json({
            success: true,
            message: `Successfully commissioned ${updateResult.modifiedCount} recruits to Shadow Douloid!`,
            graduatedCount: updateResult.modifiedCount
        });
    } catch (err) {
        console.error('Error in graduateCohort:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
