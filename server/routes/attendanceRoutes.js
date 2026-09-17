import express from 'express';
import {
    submitAttendance,
    preValidateAttendance,
    getAttendance,
    deleteAttendance,
    getStudentPortalData,
    manualCheckIn,
    bulkManualCheckIn,
    toggleExemption,
    getLiveAttendance,
    getAttendanceRollup,
    getAbsenteeRadar
} from '../controllers/attendanceController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

// Live feed, rollup, and absentee radar (Must precede /:meetingId)
router.get('/live', getLiveAttendance);
router.get('/rollup', getAttendanceRollup);
router.get('/absentees', getAbsenteeRadar);

// Pre-validation and submission
router.post('/pre-validate', optionalVerify, preValidateAttendance);
router.post('/submit', optionalVerify, submitAttendance);

// Student Portal data
router.get('/student/:regNo', getStudentPortalData);

import Attendance from '../models/Attendance.js';

// Protected route for admins to view
router.get('/:meetingId', verifyAdmin, getAttendance);
router.post('/manual', verifyAdmin, manualCheckIn);
router.post('/manual/bulk', verifyAdmin, bulkManualCheckIn);


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
router.patch('/:id/exemption', verifyAdmin, toggleExemption);

export default router;
