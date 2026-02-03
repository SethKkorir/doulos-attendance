import express from 'express';
import { submitAttendance, getAttendance } from '../controllers/attendanceController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for students to submit
router.post('/submit', submitAttendance);

// Protected route for admins to view
router.get('/:meetingId', verifyAdmin, getAttendance);

export default router;
