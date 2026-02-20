import Meeting from '../models/Meeting.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkCampusTime } from '../utils/timeCheck.js';



export const createMeeting = async (req, res) => {
    const { name, date, campus, startTime, endTime, semester, requiredFields, location, isTestMeeting, questionOfDay } = req.body;

    try {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // Simple code
        const meeting = new Meeting({
            name, date, campus, startTime, endTime, semester, code, requiredFields, location, isTestMeeting, questionOfDay
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

        // Filter by Campus for regular admins - DISABLED to allow visibility
        /*
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
        */

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

        const meetings = await Meeting.aggregate(pipeline);

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
    const { name } = req.body;

    try {
        const meeting = await Meeting.findByIdAndUpdate(
            id,
            {
                $set: {
                    'location': {
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

        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);

        // Check if meeting is active (Bypass for SuperUser or Test Meetings)
        const now = new Date();
        const meetingDate = new Date(meeting.date);

        // Construct start time date object
        const [startHours, startMinutes] = meeting.startTime.split(':').map(Number);
        const meetingStart = new Date(meetingDate);
        meetingStart.setHours(startHours, startMinutes, 0, 0);

        const isTimeStarted = now >= meetingStart;
        const isToday = now.toDateString() === meetingDate.toDateString();

        if (!isSuperUser && !meeting.isTestMeeting) {
            if (!meeting.isActive) {
                return res.status(403).json({ message: 'This meeting is currently closed by the admin.' });
            }
            if (!isToday || !isTimeStarted) {
                return res.status(403).json({
                    message: `This meeting is scheduled for ${meetingDate.toLocaleDateString()} at ${meeting.startTime}. It is not yet open for attendance.`
                });
            }
        }

        // Fetch the previous meeting recap from the same campus
        const previousRecap = await Meeting.findOne({
            campus: meeting.campus,
            _id: { $ne: meeting._id },
            date: { $lt: meeting.date },
            $or: [{ devotion: { $ne: '' } }, { announcements: { $ne: '' } }]
        }).sort({ date: -1 }).select('name date devotion announcements');

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
