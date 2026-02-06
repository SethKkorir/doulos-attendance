import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Member from '../models/Member.js';
import { checkCampusTime } from '../utils/timeCheck.js';

export const submitAttendance = async (req, res) => {
    const { meetingCode, responses, memberType, secretCode, deviceId } = req.body;

    try {
        // 1. Find the meeting
        const meeting = await Meeting.findOne({ code: meetingCode });
        if (!meeting) return res.status(404).json({ message: 'Invalid Meeting Code' });

        // 2. Presence Proof (Secret Code)
        if (meeting.secretRoomCode && meeting.secretRoomCode.toUpperCase() !== secretCode?.toUpperCase()) {
            return res.status(403).json({ message: 'Invalid Room Code. Please use the code announced in the meeting.' });
        }

        // 3. User & Role check
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);

        // 4. Activity Check (Bypass for SuperUser or Test Meetings)
        if (!meeting.isActive && !isSuperUser && !meeting.isTestMeeting) {
            return res.status(400).json({ message: 'Meeting is closed' });
        }

        if (!meeting.isTestMeeting && !isSuperUser) {
            const timeReview = checkCampusTime(meeting);
            if (!timeReview.allowed) {
                return res.status(403).json({ message: timeReview.message });
            }
        }

        // 5. Extract Reg No
        const data = responses || req.body;
        let rawRegNo = data.studentRegNo || data.regNo || data.admNo;

        if (!rawRegNo) {
            const fallbackKey = Object.keys(data).find(k =>
                k.toLowerCase().includes('reg') || k.toLowerCase().includes('adm')
            );
            if (fallbackKey) rawRegNo = data[fallbackKey];
        }

        if (!rawRegNo) {
            return res.status(400).json({ message: 'Admission Number is required' });
        }

        const studentRegNo = String(rawRegNo).trim().toUpperCase();

        // 6. Device Fingerprint Check (Anti-Proxy)
        if (deviceId && !isSuperUser) {
            const deviceUsed = await Attendance.findOne({ meeting: meeting._id, deviceId });
            if (deviceUsed) {
                return res.status(403).json({ message: 'This device has already been used for a check-in today.' });
            }
        }

        // 7. Duplicate check
        const existing = await Attendance.findOne({ meeting: meeting._id, studentRegNo });
        if (existing) {
            return res.status(409).json({ message: 'You have already signed in for this meeting.' });
        }

        // 8. Member Registry Lookup & Points
        let member = await Member.findOne({ studentRegNo });
        if (!member) {
            // Auto-track new visitor
            member = new Member({
                studentRegNo,
                name: data.studentName || 'New Visitor',
                memberType: 'Visitor',
                campus: meeting.campus
            });
            await member.save();
        }

        // 9. Record Attendance
        const attendance = new Attendance({
            meeting: meeting._id,
            meetingName: meeting.name,
            campus: meeting.campus,
            studentRegNo,
            memberType: member.memberType,
            responses: responses || { studentName: data.studentName, studentRegNo },
            questionOfDay: meeting.questionOfDay,
            deviceId
        });

        await attendance.save();

        // 10. Award Points (Default +10 for attendance)
        await Member.findOneAndUpdate({ studentRegNo }, { $inc: { totalPoints: 10 } });

        res.status(201).json({
            message: 'Attendance recorded successfully',
            memberName: member.name,
            memberType: member.memberType
        });

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
export const getStudentPortalData = async (req, res) => {
    const { regNo } = req.params;
    try {
        const studentRegNo = regNo.trim().toUpperCase();

        // 1. Get member details from Registry
        const member = await Member.findOne({ studentRegNo });

        // 2. Get student's attendance history
        const attendance = await Attendance.find({ studentRegNo });
        const attendedMeetingIds = attendance.map(a => a.meeting.toString());

        // 3. Get all meetings
        const meetings = await Meeting.find().sort({ date: -1 });

        // 4. Map meetings with attendance status
        const history = meetings.map(m => {
            const record = attendance.find(a => a.meeting.toString() === m._id.toString());
            const attended = !!record;
            return {
                _id: m._id,
                name: m.name,
                date: m.date,
                campus: m.campus,
                devotion: m.devotion,
                iceBreaker: m.iceBreaker,
                announcements: m.announcements,
                attended,
                isExempted: record?.isExempted || false,
                attendanceTime: attended ? record.timestamp : null
            };
        });

        const totalMeetings = meetings.length;
        const totalAttended = attendance.filter(a => !a.isExempted).length;

        res.json({
            studentRegNo,
            memberName: member?.name || 'Visitor',
            memberType: member?.memberType || 'Visitor',
            stats: {
                totalMeetings,
                totalAttended,
                percentage: totalMeetings > 0 ? Math.round((totalAttended / totalMeetings) * 100) : 0
            },
            history
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const manualCheckIn = async (req, res) => {
    const { meetingId, studentRegNo } = req.body;
    try {
        const regNo = studentRegNo.trim().toUpperCase();

        const existing = await Attendance.findOne({ meeting: meetingId, studentRegNo: regNo });
        if (existing) return res.status(409).json({ message: 'Already checked in' });

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

        // Lookup member Registry
        let member = await Member.findOne({ studentRegNo: regNo });
        if (!member) {
            member = new Member({
                studentRegNo: regNo,
                name: 'Manual Entry',
                memberType: 'Visitor',
                campus: meeting.campus
            });
            await member.save();
        }

        const attendance = new Attendance({
            meeting: meetingId,
            meetingName: meeting.name,
            campus: meeting.campus,
            studentRegNo: regNo,
            memberType: member.memberType,
            responses: { studentName: member.name },
            questionOfDay: meeting.questionOfDay
        });

        await attendance.save();

        // Award Points
        await Member.findOneAndUpdate({ studentRegNo: regNo }, { $inc: { totalPoints: 10 } });

        res.status(201).json({ message: 'Admin checked-in student successfully', record: attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteAttendance = async (req, res) => {
    const { id } = req.params;
    try {
        const attendance = await Attendance.findById(id).populate('meeting');
        if (!attendance) return res.status(404).json({ message: 'Record not found' });

        // Security: Only allow deletion if it's a test meeting OR user is developer
        const isTestMeeting = attendance.meeting?.isTestMeeting;
        const isDeveloper = ['developer', 'superadmin'].includes(req.user.role);

        if (isTestMeeting || isDeveloper) {
            await Attendance.findByIdAndDelete(id);
            res.json({ message: 'Attendance record deleted' });
        } else {
            res.status(403).json({ message: 'Only developers can delete live attendance data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleExemption = async (req, res) => {
    const { id } = req.params;
    try {
        const record = await Attendance.findById(id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        record.isExempted = !record.isExempted;
        await record.save();

        res.json({ message: 'Exemption status updated', isExempted: record.isExempted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
