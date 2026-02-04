import express from 'express';
import { submitAttendance, getAttendance, deleteAttendance } from '../controllers/attendanceController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for students to submit
router.post('/submit', optionalVerify, submitAttendance);

import Attendance from '../models/Attendance.js';

// Protected route for admins to view
router.get('/:meetingId', verifyAdmin, getAttendance);

// Member Insights (Unique members, total attendance, last seen)
router.get('/insights/members', verifyAdmin, async (req, res) => {
    try {
        const insights = await Attendance.aggregate([
            {
                $group: {
                    _id: "$studentRegNo",
                    totalAttended: { $sum: 1 },
                    lastSeen: { $max: "$timestamp" },
                    memberType: { $last: "$memberType" },
                    details: { $last: "$responses" }
                }
            },
            { $sort: { lastSeen: -1 } }
        ]);
        res.json(insights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', verifyAdmin, deleteAttendance);

export default router;
