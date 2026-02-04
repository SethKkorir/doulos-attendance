import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import { checkCampusTime } from '../utils/timeCheck.js';

export const submitAttendance = async (req, res) => {
    const { meetingCode, responses, memberType } = req.body;

    try {
        // 1. Find the meeting
        const meeting = await Meeting.findOne({ code: meetingCode });
        if (!meeting) return res.status(404).json({ message: 'Invalid Meeting Code' });

        if (!memberType) {
            return res.status(400).json({ message: 'Member category is required' });
        }

        // 2. Check if meeting is active/open
        if (!meeting.isActive) return res.status(400).json({ message: 'Meeting is closed' });

        // Check time restriction (Wednesday 2-4 PM for Nairobi, Monday 8:30-11 PM for Athi)
        // Bypass time restriction for TEST MEETINGS
        if (!meeting.isTestMeeting) {
            const timeReview = checkCampusTime(meeting.campus, meeting.date);
            if (!timeReview.allowed) {
                return res.status(403).json({ message: timeReview.message });
            }
        }

        // 3. Extract uniquely identifying field (Reg No)
        // Compatibility check: StudentScan.jsx sends data in root, CheckIn.jsx sends in 'responses'
        const data = responses || req.body;
        let rawRegNo = data.studentRegNo || data.regNo || data.admNo;

        if (!rawRegNo) {
            const fallbackKey = Object.keys(data).find(k =>
                k.toLowerCase().includes('reg') || k.toLowerCase().includes('adm')
            );
            if (fallbackKey) rawRegNo = data[fallbackKey];
        }

        if (!rawRegNo) {
            return res.status(400).json({ message: 'Admission Number (Reg No) is required' });
        }

        const studentRegNo = String(rawRegNo).trim().toUpperCase();

        // 4. Double check for duplicates
        const existing = await Attendance.findOne({ meeting: meeting._id, studentRegNo });
        if (existing) {
            return res.status(409).json({ message: 'You have already signed in for this meeting.' });
        }

        // 5. Record Attendance
        const attendance = new Attendance({
            meeting: meeting._id,
            meetingName: meeting.name,
            campus: meeting.campus,
            studentRegNo,
            memberType: memberType || 'Student',
            responses: responses || { studentName: req.body.studentName, studentRegNo: req.body.studentRegNo },
            questionOfDay: meeting.questionOfDay
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
