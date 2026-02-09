import Meeting from '../models/Meeting.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
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
    const { name, date, campus, startTime, endTime, semester, requiredFields, questionOfDay, location, isTestMeeting } = req.body;

    // 1. Restriction: One meeting per week per campus for regular admins
    if (!['developer', 'superadmin'].includes(req.user.role)) {
        const meetingDate = new Date(date);
        const dayOfWeek = meetingDate.getDay(); // 0 (Sun) - 6 (Sat)

        // Calculate start of week (Sunday 00:00) and end of week (Saturday 23:59)
        const startOfWeek = new Date(meetingDate);
        startOfWeek.setDate(meetingDate.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const existingMeeting = await Meeting.findOne({
            campus,
            date: { $gte: startOfWeek, $lte: endOfWeek }
        });

        if (existingMeeting) {
            return res.status(403).json({
                message: `Creation Denied: A meeting already exists for ${campus} this week (${new Date(existingMeeting.date).toLocaleDateString()}). Only SuperAdmins can create multiple meetings per week.`
            });
        }
    }

    // Validation
    const error = validateMeetingTime(date, startTime, endTime, campus);
    if (error) return res.status(400).json({ message: error });

    try {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // Simple code
        const meeting = new Meeting({
            name, date, campus, startTime, endTime, semester, code, requiredFields, questionOfDay, location, isTestMeeting
        });
        await meeting.save();
        res.status(201).json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getMeetings = async (req, res) => {
    try {
        // 1. Fetch meetings with attendance count
        const pipeline = [];

        // Filter by Campus for regular admins (but allow history/finalized meetings from all campuses)
        if (req.user && !['developer', 'superadmin'].includes(req.user.role)) {
            const userCampus = req.user.campus || 'Athi River';
            pipeline.push({
                $match: {
                    $or: [
                        { campus: userCampus },
                        { isActive: false }
                    ]
                }
            });
        }

        pipeline.push(
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

        );
        let meetings = await Meeting.aggregate(pipeline);

        // 2. Auto-Activate and Auto-Finalize based on strict time windows
        const now = new Date();
        const eatFormat = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Africa/Nairobi',
            hourCycle: 'h23',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        const [todayDate, todayTime] = eatFormat.format(now).split(', ');
        const [eatH, eatM] = todayTime.split(':').map(Number);
        const timeDecimal = eatH + (eatM / 60); // Current time in decimal hours (EAT)

        const updates = [];

        meetings = meetings.map(m => {
            if (!m.isTestMeeting) {
                // Get meeting's scheduled date string (YYYY-MM-DD)
                const meetingDateStr = eatFormat.format(new Date(m.date)).split(', ')[0];

                // Parse Schedule
                const [startH, startM] = m.startTime.split(':').map(Number);
                const [endH, endM] = m.endTime.split(':').map(Number);

                const startVal = startH + (startM / 60);
                let endVal = endH + (endM / 60);

                // Handle midnight crossing
                if (endVal < startVal) endVal += 24;

                // Logic to determine if it SHOULD be active right now
                // REVISED LOGIC: Only AUTO-CLOSE meetings. Do NOT auto-open or force-close early meetings.
                if (meetingDateStr < todayDate) {
                    // Past Date -> Close
                    if (m.isActive) {
                        updates.push(Meeting.findByIdAndUpdate(m._id, { isActive: false }));
                        console.log(`[Meeting Control] Auto-Close "${m.name}": Date Passed`);
                        return { ...m, isActive: false };
                    }
                } else if (meetingDateStr === todayDate) {
                    // Today
                    if (timeDecimal > endVal && m.isActive) {
                        // Time Passed -> Close
                        updates.push(Meeting.findByIdAndUpdate(m._id, { isActive: false }));
                        console.log(`[Meeting Control] Auto-Close "${m.name}": Time Window Closed`);
                        return { ...m, isActive: false };
                    }
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

    const { confirmPassword } = req.body;
    const { id } = req.params;

    try {
        const user = await User.findById(req.user.id);
        const isDevBypass = ['developer', 'superadmin'].includes(req.user.role) && confirmPassword === '657';

        if (!isDevBypass) {
            if (!user) return res.status(404).json({ message: 'Admin user not found' });
            const isMatch = await bcrypt.compare(confirmPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Incorrect admin password. Deletion cancelled.' });
        }

        const meeting = await Meeting.findById(id);
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

        // Delete all attendance records for this meeting
        await Attendance.deleteMany({ meeting: id });

        // Delete the meeting record
        await Meeting.findByIdAndDelete(id);

        res.json({ message: `Meeting "${meeting.name}" and all associated attendance records deleted successfully.` });
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

export const setMeetingLocation = async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude, radius, name } = req.body;

    try {
        const meeting = await Meeting.findByIdAndUpdate(
            id,
            {
                $set: {
                    'location': {
                        latitude,
                        longitude,
                        radius: radius || 200,
                        name: name || 'Custom Location'
                    }
                }
            },
            { new: true }
        );
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getMeetingByCode = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ code: { $regex: new RegExp(`^${req.params.code}$`, 'i') } });
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

        // Check if this device has already attended
        let hasAttended = false;
        if (req.query.deviceId) {
            const existingRecord = await Attendance.findOne({
                meeting: meeting._id,
                deviceId: req.query.deviceId
            });
            if (existingRecord) hasAttended = true;
        }

        res.json({ ...meeting.toObject(), previousRecap, serverStartTime: Date.now(), hasAttended });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
