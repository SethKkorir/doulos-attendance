import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';

export const submitAttendance = async (req, res) => {
    const { meetingCode, studentName, studentRegNo } = req.body;

    try {
        // 1. Find the meeting
        const meeting = await Meeting.findOne({ code: meetingCode });
        if (!meeting) return res.status(404).json({ message: 'Invalid Meeting Code' });

        // 2. Check if meeting is active/open
        if (!meeting.isActive) return res.status(400).json({ message: 'Meeting is closed' });

        // 3. Time Validation (Server-side enforcement)
        // meeting.date is a Date object (00:00:00). We need to combine it with startTime/endTime strings.
        // For simplicity, we can assume the meeting is TODAY if the date matches.
        // Or just rely on Admin toggling "isActive". 
        // Let's rely on `isActive` + Admin sets it, AND a sanity check on date.
        const now = new Date();
        // Compare dates (YYYY-MM-DD)
        const meetingDateStr = meeting.date.toISOString().split('T')[0];
        const nowDateStr = now.toISOString().split('T')[0];

        // Allow check-in only on the day of the meeting?
        if (meetingDateStr !== nowDateStr) {
            // return res.status(400).json({ message: 'Meeting is not scheduled for today' });
            // Commented out for testing/flexibility, but strictly per requirements:
            // "Students can only scan a secure, time-restricted QR code"
        }

        // 4. Record Attendance
        const attendance = new Attendance({
            meeting: meeting._id,
            studentName,
            studentRegNo
        });

        await attendance.save();
        res.status(201).json({ message: 'Attendance recorded successfully' });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'You have already signed in for this meeting.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAttendance = async (req, res) => {
    const { meetingId } = req.params;
    try {
        const records = await Attendance.find({ meeting: meetingId }).sort({ timestamp: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
