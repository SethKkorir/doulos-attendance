export const getKenyanTime = () => {
    // Return a Date object representing the current time in Kenya (EAT, UTC+3)
    const now = new Date();
    // EAT is strictly UTC+3. No DST.
    // Calculate UTC time first, then add 3 hours.
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 3));
};

export const getKenyanDate = () => {
    // Return only the date string YYYY-MM-DD in Kenyan time
    const now = getKenyanTime();
    const Y = now.getFullYear();
    const M = String(now.getMonth() + 1).padStart(2, '0');
    const D = String(now.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
};
