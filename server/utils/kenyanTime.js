export const getKenyanTime = () => {
    // Return a Date object representing the current time in Kenya (EAT, UTC+3)
    const now = new Date();
    // Date.getTime() is always UTC. Adding 3 hours gives us the EAT timestamp.
    const eatTimestamp = now.getTime() + (3 * 60 * 60 * 1000);
    return new Date(eatTimestamp);
};

export const getKenyanDate = () => {
    // Return only the date string YYYY-MM-DD in Kenyan time
    const now = getKenyanTime();
    const Y = now.getUTCFullYear();
    const M = String(now.getUTCMonth() + 1).padStart(2, '0');
    const D = String(now.getUTCDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
};

export const getWeekRange = (inputDate) => {
    // Calculates Monday 00:00:00.000 to Sunday 23:59:59.999 for the week containing inputDate
    const d = new Date(inputDate);
    const day = d.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diffToMonday = (day === 0 ? -6 : 1 - day);

    const startOfWeek = new Date(d);
    startOfWeek.setUTCDate(d.getUTCDate() + diffToMonday);
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
};

