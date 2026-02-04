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

        // Nairobi Campus (Valley Road) time restriction (2 PM - 4 PM)
        const isNairobiCampus = meeting.campus === 'Valley Road' || meeting.campus === 'Nairobi Campus';
        if (isNairobiCampus) {
            const now = new Date();
            // Get East Africa Time (EAT) hour (UTC+3)
            const eatHour = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" })).getHours();
            console.log(`Attendance Check: Campus=[${meeting.campus}], EAT Hour=[${eatHour}]`);

            if (eatHour < 14 || eatHour >= 16) {
                const jokes = [
                    "Eyy! Nairobi Campus attendance is strictly 2 PM - 4 PM. Even the stairs aren't this steep! Come back later. 😂",
                    "Slow down! The QR code is currently stuck in Nairobi traffic. Try again between 2 PM and 4 PM. 🚗💨",
                    "The portal says 'No'! Nairobi Campus attendance is only for the 2-4 PM legends. Go grab some cafeteria food while you wait. 🍟",
                    "Wait a minute! Are you trying to beat the system? Nairobi Campus only allows scans from 2 PM to 4 PM. Stay humble! 🙏",
                    "Daystar says: 'Patience is a virtue'. Especially for Nairobi Campus scans between 2 PM and 4 PM. See you then! ✨"
                ];
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                console.log(`Attendance Blocked: Outside hours for Valley Road. Sending joke: "${randomJoke}"`);
                return res.status(403).json({ message: randomJoke });
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
