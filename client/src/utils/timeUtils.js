export const isAttendanceOpen = (mockDate = null) => {
    const now = mockDate ? new Date(mockDate) : new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Logic: Must be Monday (1)
    // Time must be >= 20:30 AND < 23:00

    if (day !== 1) {
        return { isOpen: false, reason: 'It is not Monday.' };
    }

    const currentTimeInMinutes = hours * 60 + minutes;
    const startTime = 20 * 60 + 30; // 20:30 -> 1230 mins
    const endTime = 23 * 60;        // 23:00 -> 1380 mins

    if (currentTimeInMinutes < startTime) {
        return { isOpen: false, reason: 'Meeting has not started yet (Start: 8:30 PM).' };
    }

    if (currentTimeInMinutes >= endTime) {
        return { isOpen: false, reason: 'Meeting has ended (End: 11:00 PM).' };
    }

    return { isOpen: true, reason: 'Attendance is open.' };
};

export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};
