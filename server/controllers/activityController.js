import ActivityLog from '../models/ActivityLog.js';
import Member from '../models/Member.js';
import Settings from '../models/Settings.js';

export const logActivity = async (req, res) => {
    const { studentRegNo, type, notes } = req.body;

    try {
        const regNo = studentRegNo.trim().toUpperCase();
        const member = await Member.findOne({ studentRegNo: regNo });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const currentSemesterSetting = await Settings.findOne({ key: 'current_semester' });
        const currentSemester = currentSemesterSetting ? currentSemesterSetting.value : 'JAN-APR 2026';

        const log = new ActivityLog({
            studentRegNo: regNo,
            type,
            semester: currentSemester,
            pointsEarned: type === 'Tree Watering' ? 5 : 0, // Examples of point awards
            notes
        });

        await log.save();

        // Update member points if applicable
        if (log.pointsEarned > 0) {
            await Member.findOneAndUpdate({ studentRegNo: regNo }, { $inc: { totalPoints: log.pointsEarned } });
        }

        res.status(201).json({ message: 'Activity logged successfully', log });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMemberActivities = async (req, res) => {
    const { regNo } = req.params;
    try {
        const logs = await ActivityLog.find({ studentRegNo: regNo.toUpperCase() }).sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
