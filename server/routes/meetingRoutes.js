import express from 'express';
import { 
    createMeeting, getMeetings, getMeetingByCode, deleteMeeting, updateMeetingStatus, setMeetingLocation,
    archiveMeeting, unarchiveMeeting, bulkArchiveCompletedMeetings
} from '../controllers/meetingController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyAdmin, createMeeting);
router.get('/', verifyAdmin, getMeetings);
router.get('/code/:code', optionalVerify, getMeetingByCode);
router.patch('/:id', verifyAdmin, updateMeetingStatus);
router.post('/bulk-archive', verifyAdmin, bulkArchiveCompletedMeetings);
router.post('/:id/archive', verifyAdmin, archiveMeeting);
router.post('/:id/unarchive', verifyAdmin, unarchiveMeeting);
router.post('/:id/location', verifyAdmin, setMeetingLocation);
router.post('/:id/delete-secure', verifyAdmin, deleteMeeting);
router.delete('/:id', verifyAdmin, deleteMeeting); // Keep legacy for now but use secure one in frontend

export default router;
