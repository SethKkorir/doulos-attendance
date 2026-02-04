import express from 'express';
import { createMeeting, getMeetings, getMeetingByCode, deleteMeeting, updateMeetingStatus } from '../controllers/meetingController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyAdmin, createMeeting);
router.get('/', verifyAdmin, getMeetings);
router.get('/code/:code', optionalVerify, getMeetingByCode);
router.patch('/:id', verifyAdmin, updateMeetingStatus);
router.delete('/:id', verifyAdmin, deleteMeeting);

export default router;
