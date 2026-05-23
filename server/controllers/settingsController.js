import Settings from '../models/Settings.js';
import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Member from '../models/Member.js';
import ActivityLog from '../models/ActivityLog.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';

export const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await Settings.findOne({ key });
        res.json(setting || { key, value: '' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const setting = await Settings.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rolloverSemester = async (req, res) => {
    try {
        const { current_semester, semester_theme, semester_verse } = req.body;
        if (!current_semester) {
            return res.status(400).json({ message: 'New semester name is required' });
        }

        // 1. Update/Create Settings keys
        await Promise.all([
            Settings.findOneAndUpdate(
                { key: 'current_semester' },
                { value: current_semester.trim().toUpperCase() },
                { upsert: true, new: true }
            ),
            Settings.findOneAndUpdate(
                { key: 'semester_theme' },
                { value: (semester_theme || '').trim() },
                { upsert: true, new: true }
            ),
            Settings.findOneAndUpdate(
                { key: 'semester_verse' },
                { value: (semester_verse || '').trim() },
                { upsert: true, new: true }
            )
        ]);

        // 2. Deactivate all active meetings and training sessions
        await Meeting.updateMany({ isActive: true }, { $set: { isActive: false } });
        await Training.updateMany({ isActive: true }, { $set: { isActive: false } });

        // 3. Reset all active member points to 0 (non-test accounts)
        await Member.updateMany(
            { isTestAccount: { $ne: true } },
            { $set: { totalPoints: 0 } }
        );

        // 4. Log the rollover in ActivityLog using a dummy studentRegNo "SYSTEM"
        const log = new ActivityLog({
            studentRegNo: 'SYSTEM',
            type: 'Other',
            semester: current_semester.trim().toUpperCase(),
            pointsEarned: 0,
            notes: `Semester Rollover to ${current_semester} initiated by Admin.`
        });
        await log.save();

        res.json({
            message: `Successfully rolled over to new semester: ${current_semester}!`,
            settings: { current_semester, semester_theme, semester_verse }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getObservabilityTelemetry = async (req, res) => {
    try {
        // 1. System Telemetry
        const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
        const uptime = process.uptime(); // in seconds
        
        // 2. Dashboard Database Stats
        const totalMembers = await Member.countDocuments({ isTestAccount: { $ne: true } });
        const totalAttendance = await Attendance.countDocuments();
        const activeMeetingsList = await Meeting.find({ isActive: true }).select('_id name campus').lean();
        const activeTrainingsList = await Training.find({ isActive: true }).select('_id name campus').lean();
        const activeSessions = activeMeetingsList.length + activeTrainingsList.length;


        // 3. Real Recent Successful Check-Ins (Join Member with Attendance)
        const recentCheckins = await Attendance.aggregate([
            { $sort: { timestamp: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "members",
                    localField: "studentRegNo",
                    foreignField: "studentRegNo",
                    as: "memberInfo"
                }
            },
            {
                $project: {
                    studentRegNo: 1,
                    campus: 1,
                    meetingName: 1,
                    timestamp: 1,
                    isExempted: 1,
                    memberType: 1,
                    studentName: { $arrayElemAt: ["$memberInfo.name", 0] }
                }
            }
        ]);

        // 4. Real Recent Check-In Failures (Join Member with scanerrors)
        let scanErrors = [];
        if (mongoose.connection.readyState === 1) {
            scanErrors = await mongoose.connection.db.collection('scanerrors')
                .aggregate([
                    { $sort: { timestamp: -1 } },
                    { $limit: 10 },
                    {
                        $lookup: {
                            from: "members",
                            localField: "studentRegNo",
                            foreignField: "studentRegNo",
                            as: "memberInfo"
                        }
                    },
                    {
                        $project: {
                            studentRegNo: 1,
                            campus: 1,
                            error: 1,
                            desc: 1,
                            timestamp: 1,
                            studentName: { $arrayElemAt: ["$memberInfo.name", 0] },
                            studentId: { $arrayElemAt: ["$memberInfo._id", 0] }
                        }
                    }
                ]).toArray();
        }

        res.json({
            system: {
                memoryHeap: parseFloat(heapUsed.toFixed(1)),
                uptimeSeconds: Math.floor(uptime),
                dbConnected: mongoose.connection.readyState === 1
            },
            stats: {
                totalMembers,
                totalAttendance,
                activeSessions,
                activeMeetings: activeMeetingsList,
                activeTrainings: activeTrainingsList
            },

            recentCheckins,
            recentErrors: scanErrors
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to aggregate system telemetry.', error: error.message });
    }
};

