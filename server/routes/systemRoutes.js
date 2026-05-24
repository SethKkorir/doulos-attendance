import express from 'express';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import { getSystemStatus, updateSystemStatus, runMasterMerge, triggerManualBackup, getCloudBackups, restoreCloudBackup } from '../controllers/systemController.js';

const router = express.Router();

router.get('/system-status', getSystemStatus);
router.post('/system-config', verifyAdmin, updateSystemStatus);
router.post('/merge-clusters', verifyAdmin, runMasterMerge);
router.post('/manual-backup', verifyAdmin, triggerManualBackup);
router.get('/manual-backup', triggerManualBackup);
router.get('/full-dump', verifyAdmin, async (req, res) => {
    try {
        const [Member, Meeting, Attendance, Training, Payment, Feedback, Settings, ActivityLog] = await Promise.all([
            import('../models/Member.js').then(m => m.default),
            import('../models/Meeting.js').then(m => m.default),
            import('../models/Attendance.js').then(m => m.default),
            import('../models/Training.js').then(m => m.default),
            import('../models/Payment.js').then(m => m.default),
            import('../models/Feedback.js').then(m => m.default),
            import('../models/Settings.js').then(m => m.default),
            import('../models/ActivityLog.js').then(m => m.default)
        ]);

        const data = {
            members: await Member.find({}),
            meetings: await Meeting.find({}),
            attendance: await Attendance.find({}),
            trainings: await Training.find({}),
            payments: await Payment.find({}),
            feedback: await Feedback.find({}),
            settings: await Settings.find({}),
            activitylogs: await ActivityLog.find({})
        };

        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Dump failed', error: err.message });
    }
});

router.post('/restore-db', verifyAdmin, async (req, res) => {
    // Role check: strictly only superadmin and developer allowed to run database restore
    const allowedRoles = ['superadmin', 'developer'];
    if (!allowedRoles.includes(req.user?.role?.toLowerCase())) {
        return res.status(403).json({ message: 'Forbidden: SuperAdmin or Developer permissions required to restore the database.' });
    }

    try {
        const { members, meetings, attendance, trainings, payments, feedback, settings, activitylogs } = req.body;
        
        // Basic structure validation
        if (!members || !meetings || !attendance) {
            return res.status(400).json({ message: 'Restore failed: Invalid backup snapshot structure.' });
        }

        const [Member, Meeting, Attendance, Training, Payment, Feedback, Settings, ActivityLog] = await Promise.all([
            import('../models/Member.js').then(m => m.default),
            import('../models/Meeting.js').then(m => m.default),
            import('../models/Attendance.js').then(m => m.default),
            import('../models/Training.js').then(m => m.default),
            import('../models/Payment.js').then(m => m.default),
            import('../models/Feedback.js').then(m => m.default),
            import('../models/Settings.js').then(m => m.default),
            import('../models/ActivityLog.js').then(m => m.default)
        ]);

        // Wipe existing collections
        await Promise.all([
            Member.deleteMany({}),
            Meeting.deleteMany({}),
            Attendance.deleteMany({}),
            Training.deleteMany({}),
            Payment.deleteMany({}),
            Feedback.deleteMany({}),
            Settings.deleteMany({}),
            ActivityLog.deleteMany({})
        ]);

        // Re-populate database
        await Promise.all([
            members && members.length ? Member.insertMany(members) : Promise.resolve(),
            meetings && meetings.length ? Meeting.insertMany(meetings) : Promise.resolve(),
            attendance && attendance.length ? Attendance.insertMany(attendance) : Promise.resolve(),
            trainings && trainings.length ? Training.insertMany(trainings) : Promise.resolve(),
            payments && payments.length ? Payment.insertMany(payments) : Promise.resolve(),
            feedback && feedback.length ? Feedback.insertMany(feedback) : Promise.resolve(),
            settings && settings.length ? Settings.insertMany(settings) : Promise.resolve(),
            activitylogs && activitylogs.length ? ActivityLog.insertMany(activitylogs) : Promise.resolve()
        ]);

        // Create an Activity Log recording this manual restore operation
        const restoreLog = new ActivityLog({
            studentRegNo: 'SYSTEM',
            type: 'Other',
            semester: settings?.find(s => s.key === 'current_semester')?.value || 'SYSTEM',
            pointsEarned: 0,
            notes: `Full system database recovery restored by SuperAdmin: ${req.user?.username || 'Admin'}.`
        });
        await restoreLog.save();

        res.json({
            message: 'Database snapshot successfully restored!',
            counts: {
                members: members.length,
                meetings: meetings.length,
                attendance: attendance.length,
                trainings: trainings ? trainings.length : 0,
                payments: payments ? payments.length : 0,
                activitylogs: activitylogs ? activitylogs.length : 0
            }
        });
    } catch (err) {
        console.error("Database restore failed:", err);
        res.status(500).json({ message: 'Database recovery failed.', error: err.message });
    }
});

router.get('/cloud-backups', verifyAdmin, getCloudBackups);
router.post('/restore-cloud-backup', verifyAdmin, restoreCloudBackup);

export default router;
