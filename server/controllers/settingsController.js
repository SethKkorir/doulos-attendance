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
        if (!semester_theme || !semester_theme.trim()) {
            return res.status(400).json({ message: 'Semester Theme is required for rollover.' });
        }
        if (!semester_verse || !semester_verse.trim()) {
            return res.status(400).json({ message: 'Scriptural Verse is required for rollover.' });
        }

        // --- ATOMIC BACKUP BEFORE ROLLOVER ---
        // 1. Fetch current settings before update
        const oldSem = await Settings.findOne({ key: 'current_semester' });
        const oldTheme = await Settings.findOne({ key: 'semester_theme' });
        const oldVerse = await Settings.findOne({ key: 'semester_verse' });

        // 2. Fetch currently active meetings and trainings
        const activeMeetings = await Meeting.find({ isActive: true }, '_id');
        const activeTrainings = await Training.find({ isActive: true }, '_id');

        // 3. Fetch current member points mapping for non-test accounts
        const membersWithPoints = await Member.find({ isTestAccount: { $ne: true } }, '_id totalPoints');
        const pointsMap = membersWithPoints.map(m => ({ memberId: m._id, totalPoints: m.totalPoints || 0 }));

        // 4. Save snapshots inside Settings
        const backupMeta = {
            current_semester: oldSem ? oldSem.value : '',
            semester_theme: oldTheme ? oldTheme.value : '',
            semester_verse: oldVerse ? oldVerse.value : '',
            timestamp: Date.now(),
            initiatedBy: req.user?.username || req.user?.email || 'Admin'
        };

        await Promise.all([
            Settings.findOneAndUpdate(
                { key: 'ROLLBACK_BACKUP_METADATA' },
                { value: JSON.stringify(backupMeta) },
                { upsert: true, new: true }
            ),
            Settings.findOneAndUpdate(
                { key: 'ROLLBACK_BACKUP_ACTIVE_MEETINGS' },
                { value: JSON.stringify(activeMeetings.map(m => m._id)) },
                { upsert: true, new: true }
            ),
            Settings.findOneAndUpdate(
                { key: 'ROLLBACK_BACKUP_ACTIVE_TRAININGS' },
                { value: JSON.stringify(activeTrainings.map(t => t._id)) },
                { upsert: true, new: true }
            ),
            Settings.findOneAndUpdate(
                { key: 'ROLLBACK_BACKUP_MEMBER_POINTS' },
                { value: JSON.stringify(pointsMap) },
                { upsert: true, new: true }
            )
        ]);

        // --- EXECUTE ROLLOVER RESET ---
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
            ),
            Settings.findOneAndUpdate(
                { key: 'semester_rollover_date' },
                { value: String(Date.now()) },
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

        // 3.5. Reset all device locks & clear scan errors under the hood
        await Member.updateMany({}, { $set: { linkedDeviceId: null } });
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.collection('scanerrors').deleteMany({});
        }


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

export const rollbackSemesterRollover = async (req, res) => {
    // Security check: only superadmin or developer can rollback
    const allowedRoles = ['superadmin', 'developer'];
    if (!allowedRoles.includes(req.user?.role?.toLowerCase())) {
        return res.status(403).json({ message: 'Forbidden: SuperAdmin or Developer permissions required for rollback.' });
    }

    try {
        // 1. Fetch metadata backup setting
        const backupMetaSetting = await Settings.findOne({ key: 'ROLLBACK_BACKUP_METADATA' });
        if (!backupMetaSetting || !backupMetaSetting.value) {
            return res.status(400).json({ message: 'No rollback backup available. Reversion not possible.' });
        }

        const backupMeta = JSON.parse(backupMetaSetting.value);

        // 2. Restore primary settings keys
        await Promise.all([
            Settings.findOneAndUpdate({ key: 'current_semester' }, { value: backupMeta.current_semester }, { upsert: true }),
            Settings.findOneAndUpdate({ key: 'semester_theme' }, { value: backupMeta.semester_theme }, { upsert: true }),
            Settings.findOneAndUpdate({ key: 'semester_verse' }, { value: backupMeta.semester_verse }, { upsert: true })
        ]);

        // 3. Restore meetings active state
        const backupMeetingsSetting = await Settings.findOne({ key: 'ROLLBACK_BACKUP_ACTIVE_MEETINGS' });
        if (backupMeetingsSetting && backupMeetingsSetting.value) {
            const activeIds = JSON.parse(backupMeetingsSetting.value);
            if (activeIds.length > 0) {
                await Meeting.updateMany({ _id: { $in: activeIds } }, { $set: { isActive: true } });
            }
        }

        // 4. Restore trainings active state
        const backupTrainingsSetting = await Settings.findOne({ key: 'ROLLBACK_BACKUP_ACTIVE_TRAININGS' });
        if (backupTrainingsSetting && backupTrainingsSetting.value) {
            const activeIds = JSON.parse(backupTrainingsSetting.value);
            if (activeIds.length > 0) {
                await Training.updateMany({ _id: { $in: activeIds } }, { $set: { isActive: true } });
            }
        }

        // 5. Restore member points
        const backupPointsSetting = await Settings.findOne({ key: 'ROLLBACK_BACKUP_MEMBER_POINTS' });
        if (backupPointsSetting && backupPointsSetting.value) {
            const pointsMap = JSON.parse(backupPointsSetting.value);
            if (pointsMap.length > 0) {
                const bulkOps = pointsMap.map(item => ({
                    updateOne: {
                        filter: { _id: item.memberId },
                        update: { $set: { totalPoints: item.totalPoints } }
                    }
                }));
                await Member.bulkWrite(bulkOps);
            }
        }

        // 6. Log rollback in ActivityLog under student SYSTEM
        const rollbackLog = new ActivityLog({
            studentRegNo: 'SYSTEM',
            type: 'Other',
            semester: backupMeta.current_semester || 'SYSTEM',
            pointsEarned: 0,
            notes: `Semester Rollover to ${backupMeta.current_semester} successfully rolled back by SuperAdmin.`
        });
        await rollbackLog.save();

        // 7. Clean up backup keys to prevent multiple restores
        await Settings.deleteMany({
            key: {
                $in: [
                    'ROLLBACK_BACKUP_METADATA',
                    'ROLLBACK_BACKUP_ACTIVE_MEETINGS',
                    'ROLLBACK_BACKUP_ACTIVE_TRAININGS',
                    'ROLLBACK_BACKUP_MEMBER_POINTS',
                    'semester_rollover_date'
                ]
            }
        });

        res.json({
            message: `Successfully rolled back semester rollover! System restored to ${backupMeta.current_semester}.`,
            settings: {
                current_semester: backupMeta.current_semester,
                semester_theme: backupMeta.semester_theme,
                semester_verse: backupMeta.semester_verse
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Rollback operation failed.', error: error.message });
    }
};

export const getObservabilityTelemetry = async (req, res) => {
    try {
        // 1. Fetch system active semester setting
        const currentSemesterSetting = await Settings.findOne({ key: 'current_semester' });
        const currentSemester = currentSemesterSetting ? currentSemesterSetting.value : 'MAY-AUG 2026';
        const semesterUpdatedTime = currentSemesterSetting ? currentSemesterSetting.updatedAt : new Date(0);

        // 2. Resolve IDs of all meetings and trainings within the current semester
        const semMeetings = await Meeting.find({ semester: currentSemester }, '_id');
        const semMeetingIds = semMeetings.map(m => m._id);
        const semTrainings = await Training.find({ semester: currentSemester }, '_id');
        const semTrainingIds = semTrainings.map(t => t._id);

        // 3. System Telemetry
        const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
        const uptime = process.uptime(); // in seconds
        
        // 4. Dashboard Database Stats scoped to current semester
        const totalMembers = await Member.countDocuments({ isTestAccount: { $ne: true } });
        
        const totalAttendance = await Attendance.countDocuments({
            $or: [
                { meeting: { $in: semMeetingIds } },
                { trainingId: { $in: semTrainingIds } }
            ]
        });

        const activeMeetingsList = await Meeting.find({ isActive: true }).select('_id name campus').lean();
        const activeTrainingsList = await Training.find({ isActive: true }).select('_id name campus').lean();
        const activeSessions = activeMeetingsList.length + activeTrainingsList.length;

        const activeMeetingIds = activeMeetingsList.map(m => m._id);
        const activeTrainingIds = activeTrainingsList.map(t => t._id);
        
        let activeCampuses = [];
        activeMeetingsList.forEach(m => {
            if (m.campus === 'Both') {
                activeCampuses.push('Athi River', 'Valley Road');
            } else {
                activeCampuses.push(m.campus);
            }
        });
        activeTrainingsList.forEach(t => {
            if (t.campus === 'Both') {
                activeCampuses.push('Athi River', 'Valley Road');
            } else {
                activeCampuses.push(t.campus);
            }
        });
        activeCampuses = [...new Set(activeCampuses)];

        let recentCheckins = [];
        let scanErrors = [];

        let targetMeetingIds = [...activeMeetingIds];
        let targetTrainingIds = [...activeTrainingIds];
        let targetCampuses = [...activeCampuses];

        if (targetMeetingIds.length === 0 && targetTrainingIds.length === 0) {
            // Fallback to most recent meeting and training in the current semester
            const lastMeeting = await Meeting.findOne({ semester: currentSemester }).sort({ date: -1, updatedAt: -1 }).select('_id campus').lean();
            const lastTraining = await Training.findOne({ semester: currentSemester }).sort({ date: -1, updatedAt: -1 }).select('_id campus').lean();
            if (lastMeeting) {
                targetMeetingIds.push(lastMeeting._id);
                targetCampuses.push(lastMeeting.campus === 'Both' ? 'Athi River' : lastMeeting.campus);
                if (lastMeeting.campus === 'Both') targetCampuses.push('Valley Road');
            }
            if (lastTraining) {
                targetTrainingIds.push(lastTraining._id);
                targetCampuses.push(lastTraining.campus === 'Both' ? 'Athi River' : lastTraining.campus);
                if (lastTraining.campus === 'Both') targetCampuses.push('Valley Road');
            }
            targetCampuses = [...new Set(targetCampuses)];
        }

        if (targetMeetingIds.length > 0 || targetTrainingIds.length > 0) {
            // 5. Real Recent Successful Check-Ins scoped to target sessions
            recentCheckins = await Attendance.aggregate([
                {
                    $match: {
                        $or: [
                            { meeting: { $in: targetMeetingIds } },
                            { trainingId: { $in: targetTrainingIds } }
                        ]
                    }
                },
                { $sort: { timestamp: -1 } },
                { $limit: 20 },
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

            // Find registration numbers of students who successfully checked in to target sessions
            const checkedInRegNos = await Attendance.distinct('studentRegNo', {
                $or: [
                    { meeting: { $in: targetMeetingIds } },
                    { trainingId: { $in: targetTrainingIds } }
                ]
            });

            // 6. Real Recent Check-In Failures scoped to target session campuses in the last 24 hours
            if (mongoose.connection.readyState === 1) {
                scanErrors = await mongoose.connection.db.collection('scanerrors')
                    .aggregate([
                        { $match: { 
                            campus: { $in: targetCampuses },
                            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                            studentRegNo: { $nin: checkedInRegNos }
                        } },
                        { $sort: { timestamp: -1 } },
                        { $limit: 20 },
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

