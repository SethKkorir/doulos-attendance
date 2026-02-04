import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';

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

        // Normalizing campus name for strict matching
        const campusName = (meeting.campus || '').trim().toLowerCase();

        // DEBUG: Vital logs for troubleshooting
        const now = new Date();
        const eatTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // Manual UTC+3 for EAT
        const eatHour = eatTime.getUTCHours();
        const eatMin = eatTime.getUTCMinutes();
        const eatDay = eatTime.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        const timeDecimal = eatHour + (eatMin / 60);

        console.log(`[STRICT CHECK] Campus: "${campusName}", Day: ${eatDay}, Time: ${timeDecimal.toFixed(2)}`);

        // NAIROBI / VALLEY ROAD CHECK: Wed 2 PM - 4 PM
        if (campusName.includes('valley') || campusName.includes('nairobi')) {
            // Must be Wednesday (3) AND between 14.0 and 16.0
            if (eatDay !== 3 || timeDecimal < 14.0 || timeDecimal >= 16.0) {
                const jokes = [
                    "Eyy! Nairobi Campus attendance is strictly 2 PM - 4 PM on Wednesdays. Even the stairs aren't this steep! Come back later. 😂",
                    "The portal says 'No'! Nairobi Campus attendance is only for the 2-4 PM legends. Go grab some cafeteria food while you wait. 🍟",
                    "Wait a minute! Are you trying to beat the system? Nairobi Campus only allows scans from 2 PM to 4 PM on Wednesdays. Stay humble! 🙏",
                    "Daystar says: 'Patience is a virtue'. See you on Wednesday between 2 PM and 4 PM! ✨"
                ];
                return res.status(403).json({ message: jokes[Math.floor(Math.random() * jokes.length)] });
            }
        }

        // ATHI RIVER CHECK: Mon 8:30 PM - 11 PM
        if (campusName.includes('athi')) {
            // Must be Monday (1) AND between 20.5 and 23.0
            if (eatDay !== 1 || timeDecimal < 20.5 || timeDecimal >= 23.0) {
                return res.status(403).json({
                    message: "Eyy! Athi River attendance is only for Monday night fellowship (8:30 PM - 11:00 PM). Go get some sleep or study! 📚✨"
                });
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
            responses: responses || { studentName: req.body.studentName, studentRegNo: req.body.studentRegNo }
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
