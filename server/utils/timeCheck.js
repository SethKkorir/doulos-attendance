/**
 * Validates if the current time in East Africa Time (EAT) 
 * matches the allowed windows for specific campuses AND the meeting date.
 * 
 * @returns { { allowed: boolean, message: string | null } }
 */
export const checkCampusTime = (campus, meetingDate) => {
    const campusName = (campus || '').trim().toLowerCase();

    // Manual UTC+3 for EAT
    const now = new Date();
    const eatTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));

    const eatYear = eatTime.getUTCFullYear();
    const eatMonth = eatTime.getUTCMonth();
    const eatDate = eatTime.getUTCDate();
    const eatDay = eatTime.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

    const eatHour = eatTime.getUTCHours();
    const eatMin = eatTime.getUTCMinutes();
    const timeDecimal = eatHour + (eatMin / 60);

    // 1. DATE CHECK: The meeting must be for TODAY
    if (meetingDate) {
        const mDate = new Date(meetingDate);
        if (
            mDate.getUTCFullYear() !== eatYear ||
            mDate.getUTCMonth() !== eatMonth ||
            mDate.getUTCDate() !== eatDate
        ) {
            return {
                allowed: false,
                message: "This meeting is not scheduled for today. Check the date on your QR code! 📅"
            };
        }
    }

    // 2. CAMPUS + TIME WINDOW CHECK
    // NAIROBI / VALLEY ROAD CHECK: Wed 2 PM - 4 PM
    if (campusName.includes('valley') || campusName.includes('nairobi')) {
        if (eatDay !== 3 || timeDecimal < 14.0 || timeDecimal >= 16.0) {
            const jokes = [
                "Eyy! Nairobi Campus attendance is strictly 2 PM - 4 PM on Wednesdays. Even the stairs aren't this steep! Come back later. 😂",
                "The portal says 'No'! Nairobi Campus attendance is only for the 2-4 PM legends. Go grab some cafeteria food while you wait. 🍟",
                "Wait a minute! Are you trying to beat the system? Nairobi Campus only allows scans from 2 PM to 4 PM on Wednesdays. Stay humble! 🙏",
                "Daystar says: 'Patience is a virtue'. See you on Wednesday between 2 PM and 4 PM! ✨"
            ];
            return {
                allowed: false,
                message: jokes[Math.floor(Math.random() * jokes.length)]
            };
        }
    }

    // ATHI RIVER CHECK: Mon 8:30 PM - 11 PM
    if (campusName.includes('athi')) {
        if (eatDay !== 1 || timeDecimal < 20.5 || timeDecimal >= 23.0) {
            return {
                allowed: false,
                message: "Eyy! Athi River attendance is only for Monday night fellowship (8:30 PM - 11:00 PM). Go get some sleep or study! 📚✨"
            };
        }
    }

    return { allowed: true, message: null };
};
