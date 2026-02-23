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

