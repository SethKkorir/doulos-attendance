import express from 'express';
import { login, register, promoteToDeveloper, getUsers, updateUser, deleteUser } from '../controllers/authController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', verifyAdmin, register);
router.post('/login', login);
router.post('/promote', promoteToDeveloper);

// User Management
router.get('/users', verifyAdmin, getUsers);
router.patch('/users/:id', verifyAdmin, updateUser);
router.delete('/users/:id', verifyAdmin, deleteUser);

import { getSystemStatus, updateSystemStatus, runMasterMerge, triggerManualBackup } from '../controllers/systemController.js';

// ... existing code ...

// System Status & Recovery (Super Admin)
router.get('/system-status', getSystemStatus);
router.post('/system-config', verifyAdmin, updateSystemStatus);
router.post('/merge-clusters', verifyAdmin, runMasterMerge);
router.post('/manual-backup', verifyAdmin, triggerManualBackup);
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
