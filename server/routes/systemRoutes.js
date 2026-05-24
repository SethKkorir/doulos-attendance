import express from 'express';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import { getSystemStatus, updateSystemStatus, runMasterMerge, triggerManualBackup } from '../controllers/systemController.js';

const router = express.Router();

router.get('/system-status', getSystemStatus);
router.post('/system-config', verifyAdmin, updateSystemStatus);
router.post('/merge-clusters', verifyAdmin, runMasterMerge);
router.post('/manual-backup', verifyAdmin, triggerManualBackup);
router.get('/manual-backup', triggerManualBackup);
router.get('/full-dump', verifyAdmin, async (req, res) => {
    try {
        const [Member, Meeting, Attendance, Training, Payment, Feedback, Settings] = await Promise.all([
            import('../models/Member.js').then(m => m.default),
            import('../models/Meeting.js').then(m => m.default),
            import('../models/Attendance.js').then(m => m.default),
            import('../models/Training.js').then(m => m.default),
            import('../models/Payment.js').then(m => m.default),
            import('../models/Feedback.js').then(m => m.default),
            import('../models/Settings.js').then(m => m.default)
        ]);

        const data = {
            members: await Member.find({}),
            meetings: await Meeting.find({}),
            attendance: await Attendance.find({}),
            trainings: await Training.find({}),
            payments: await Payment.find({}),
            feedback: await Feedback.find({}),
            settings: await Settings.find({})
        };

        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Dump failed', error: err.message });
    }
});

export default router;
