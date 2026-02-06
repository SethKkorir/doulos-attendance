import Meeting from '../models/Meeting.js';
import crypto from 'crypto';
import { checkCampusTime } from '../utils/timeCheck.js';

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
        // 1. Fetch meetings with attendance count
        let meetings = await Meeting.aggregate([
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

        // 2. Auto-close expired meetings
        const now = new Date();
        const updates = [];

        meetings = meetings.map(m => {
            if (m.isActive && !m.isTestMeeting) {
                // Parse End Time
                const [endH, endM] = m.endTime.split(':').map(Number);
                const meetingEnd = new Date(m.date);
                meetingEnd.setHours(endH, endM, 0, 0);

                // If meeting ended before now (adding buffer of 1 hour just to be safe or strict?) 
                // Let's be strict: if now > meetingEnd, it's closed.
                if (now > meetingEnd) {
                    m.isActive = false;
                    updates.push(Meeting.findByIdAndUpdate(m._id, { isActive: false }));
                }
            }
            return m;
        });

        // Execute updates in background
        if (updates.length > 0) await Promise.all(updates);

        // 3. Sort: Active First, then Date Descending
        meetings.sort((a, b) => {
            if (a.isActive === b.isActive) {
                return new Date(b.date) - new Date(a.date);
            }
            return a.isActive ? -1 : 1;
        });

        res.json(meetings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMeeting = async (req, res) => {
    if (!['developer', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Only developers/superadmins can delete meetings' });
    }
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
        const updates = req.body;
        const meeting = await Meeting.findByIdAndUpdate(id, updates, { new: true });
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getMeetingByCode = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ code: req.params.code });
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

        // Check time restriction
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);

        // Check if meeting is active (Bypass for SuperUser or Test Meetings)
        if (!meeting.isActive && !isSuperUser && !meeting.isTestMeeting) {
            return res.status(403).json({ message: 'This meeting is currently closed by the admin.' });
        }

        if (!meeting.isTestMeeting && !isSuperUser) {
            const timeReview = checkCampusTime(meeting);
            if (!timeReview.allowed) {
                return res.status(403).json({ message: timeReview.message });
            }
        }

        // Fetch the previous meeting recap from the same campus
        const previousRecap = await Meeting.findOne({
            campus: meeting.campus,
            _id: { $ne: meeting._id },
            date: { $lt: meeting.date },
            $or: [{ devotion: { $ne: '' } }, { announcements: { $ne: '' } }]
        }).sort({ date: -1 }).select('name date devotion iceBreaker announcements');

        res.json({ ...meeting.toObject(), previousRecap });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
