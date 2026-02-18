export const getKenyanTime = () => {
    // Return a Date object representing the current time in Kenya (EAT, UTC+3)
    const now = new Date();
    // Use Intl to get the string representation in Nairobi time
    const kenyanTimeString = now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
    // Parse that string back into a Date object
    return new Date(kenyanTimeString);
};

export const getKenyanDate = () => {
    // Return only the date string YYYY-MM-DD in Kenyan time
    const now = getKenyanTime();
    return now.toISOString().split('T')[0];
};
