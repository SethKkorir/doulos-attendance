/**
 * Validates if the current time in East Africa Time (EAT) 
 * matches the allowed windows for specific campuses AND the meeting date.
 * 
 * @returns { { allowed: boolean, message: string | null } }
 */
export const checkCampusTime = (meeting) => {
    if (!meeting) return { allowed: true };

    const { campus, date: meetingDate, startTime, endTime } = meeting;
    const campusName = (campus || '').trim().toLowerCase();

    // Manual UTC+3 for EAT
    const now = new Date();
    const eatTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));

    const eatYear = eatTime.getUTCFullYear();
    const eatMonth = eatTime.getUTCMonth();
    const eatDate = eatTime.getUTCDate();

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

    // 2. DYNAMIC TIME WINDOW CHECK
    if (startTime && endTime) {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startVal = startH + (startM / 60);
        const endVal = endH + (endM / 60);

        if (timeDecimal < startVal || timeDecimal >= endVal) {
            return {
                allowed: false,
                message: `Attendance for ${campus} is only open between ${startTime} and ${endTime}. You are a bit early or late! ⏰`
            };
        }
    }

    return { allowed: true, message: null };
};
