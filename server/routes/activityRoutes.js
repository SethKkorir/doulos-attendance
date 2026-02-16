import express from 'express';
import { logActivity, getMemberActivities } from '../controllers/activityController.js';

const router = express.Router();

router.post('/log', logActivity);
router.get('/member/:regNo', getMemberActivities);

export default router;
