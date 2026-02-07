import express from 'express';
import { createMeeting, getMeetings, getMeetingByCode, deleteMeeting, updateMeetingStatus, setMeetingLocation } from '../controllers/meetingController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyAdmin, createMeeting);
router.get('/', verifyAdmin, getMeetings);
router.get('/code/:code', optionalVerify, getMeetingByCode);
router.patch('/:id', verifyAdmin, updateMeetingStatus);
router.post('/:id/location', verifyAdmin, setMeetingLocation);
router.post('/:id/delete-secure', verifyAdmin, deleteMeeting);
router.delete('/:id', verifyAdmin, deleteMeeting); // Keep legacy for now but use secure one in frontend

export default router;
