import express from 'express';
import { createMeeting, getMeetings, getMeetingByCode } from '../controllers/meetingController.js';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyAdmin, createMeeting);
router.get('/', verifyAdmin, getMeetings);
router.get('/:code', getMeetingByCode); // Public/Student can fetch to verify? Or protected. Usually student scans code.

export default router;
