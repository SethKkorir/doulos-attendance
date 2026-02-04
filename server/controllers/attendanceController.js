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

        // DEBUG: Log meeting details to see why time check might be skipped
        console.log(`[DEBUG] Meeting Code: ${meetingCode}, Campus Found: "${meeting.campus}", Time: ${new Date().toLocaleTimeString()}`);

        // Nairobi Campus (Valley Road) time restriction (2 PM - 4 PM)
        const isNairobiCampus = meeting.campus.trim() === 'Valley Road' || meeting.campus.trim() === 'Nairobi Campus';

        if (isNairobiCampus) {
            const now = new Date();
            // Get East Africa Time (EAT) hour (UTC+3)
            const eatTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
            const eatHour = eatTime.getHours();
            const eatDay = eatTime.getDay(); // 3 is Wednesday

            console.log(`[TIME CHECK] Nairobi: Day=${eatDay}, Hour=${eatHour}`);

            // Validation: Only Wednesday between 2 PM (14) and 4 PM (16)
            if (eatDay !== 3 || eatHour < 14 || eatHour >= 16) {
                const jokes = [
                    "Eyy! Nairobi Campus attendance is strictly 2 PM - 4 PM on Wednesdays. Even the stairs aren't this steep! Come back later. 😂",
                    "Slow down! The QR code is currently stuck in Nairobi traffic. Try again Wednesday between 2 PM and 4 PM. 🚗💨",
                    "The portal says 'No'! Nairobi Campus attendance is only for the 2-4 PM legends. Go grab some cafeteria food while you wait. 🍟",
                    "Wait a minute! Are you trying to beat the system? Nairobi Campus only allows scans from 2 PM to 4 PM on Wednesdays. Stay humble! 🙏",
                    "Daystar says: 'Patience is a virtue'. Especially for Nairobi Campus scans between 2 PM and 4 PM. See you on Wednesday! ✨"
                ];
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                return res.status(403).json({ message: randomJoke });
            }
        }

        // Athi River Campus time restriction (Monday 8:30 PM - 11 PM)
        if (meeting.campus.trim() === 'Athi River') {
            const now = new Date();
            const eatTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
            const eatHour = eatTime.getHours();
            const eatMin = eatTime.getMinutes();
            const eatDay = eatTime.getDay(); // 1 is Monday

            const currentTimeDecimal = eatHour + (eatMin / 60);

            console.log(`[TIME CHECK] Athi River: Day=${eatDay}, Hour=${currentTimeDecimal}`);

            // Validation: Only Monday between 8:30 PM (20.5) and 11 PM (23.0)
            if (eatDay !== 1 || currentTimeDecimal < 20.5 || currentTimeDecimal >= 23.0) {
                return res.status(403).json({
                    message: "Eyy! Athi River attendance is only for Monday night fellowship (8:30 PM - 11:00 PM). Go get some sleep or study! 📚✨"
                });
            }
        }

        // 3. Extract uniquely identifying field (Reg No)
        // Check standard keys first, then look for any key containing "reg" or "adm"
        let rawRegNo = responses.studentRegNo || responses.regNo || responses.admNo;

        if (!rawRegNo) {
            const fallbackKey = Object.keys(responses).find(k =>
                k.toLowerCase().includes('reg') || k.toLowerCase().includes('adm')
            );
            if (fallbackKey) rawRegNo = responses[fallbackKey];
        }

        if (!rawRegNo) {
            return res.status(400).json({ message: 'Admission Number is required' });
        }

        const studentRegNo = rawRegNo.trim().toUpperCase();

        // 4. Double check for duplicates explicitly for better error handling
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
            memberType,
            responses
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
