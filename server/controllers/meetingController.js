import Meeting from '../models/Meeting.js';
import crypto from 'crypto';

// Helper to validate time windows
const validateMeetingTime = (dateStr, startTime, endTime, campus) => {
    // Re-enabling validation after testing phase
    /*
    const date = new Date(dateStr);
    const day = date.getDay(); // 0=Sun, 1=Mon, ..., 3=Wed, ...

    // Parse times (e.g. "20:30" -> 20.5)
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startVal = startH + startM / 60;
    const endVal = endH + endM / 60;

    if (campus === 'Athi River') {
        // Mon 8:30 PM - 11:00 PM (20.5 - 23.0)
        if (day !== 1) return 'Athi River meetings must be on Mondays.';
        if (startVal < 20.5 || endVal > 23.0) return 'Athi River meetings must be between 8:30 PM and 11:00 PM.';
    } else if (campus === 'Valley Road') {
        // Wed 2:00 PM - 4:00 PM (14.0 - 16.0)
        if (day !== 3) return 'Valley Road meetings must be on Wednesdays.';
        if (startVal < 14.0 || endVal > 16.0) return 'Valley Road meetings must be between 2:00 PM and 4:00 PM.';
    }
    */
    return null; // Valid
};

export const createMeeting = async (req, res) => {
    const { name, date, campus, startTime, endTime, requiredFields, questionOfDay } = req.body;

    // Validation
    const error = validateMeetingTime(date, startTime, endTime, campus);
    if (error) return res.status(400).json({ message: error });

    try {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // Simple code
        const meeting = new Meeting({
            name, date, campus, startTime, endTime, code, requiredFields, questionOfDay
        });
        await meeting.save();
        res.status(201).json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import Attendance from '../models/Attendance.js';

export const getMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.aggregate([
            {
                $lookup: {
                    from: 'attendances',
                    localField: '_id',
                    foreignField: 'meeting',
                    as: 'attendance'
                }
            },
            {
                $addFields: {
                    attendanceCount: { $size: '$attendance' }
                }
            },
            { $project: { attendance: 0 } },
            { $sort: { date: -1 } }
        ]);
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        await Meeting.findByIdAndDelete(id);
        // We no longer delete attendance records to preserve historical member data
        res.json({ message: 'Meeting deleted successfully (attendance records preserved)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMeetingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const meeting = await Meeting.findByIdAndUpdate(id, { isActive }, { new: true });
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMeetingByCode = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ code: req.params.code });
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
