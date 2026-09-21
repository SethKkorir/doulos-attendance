import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Setting from '../models/Settings.js';
import { getCached, setCached, CACHE_TTL } from './checkInCache.js';
import { getKenyanTime } from './kenyanTime.js';

export const isSessionLive = (session, now = getKenyanTime()) => {
    if (!session || !session.date || !session.startTime || !session.endTime) {
        return false;
    }

    const nowKenya = new Date(now);
    const meetingDate = new Date(session.date);
    const sameDay =
        meetingDate.getUTCFullYear() === nowKenya.getUTCFullYear() &&
        meetingDate.getUTCMonth() === nowKenya.getUTCMonth() &&
        meetingDate.getUTCDate() === nowKenya.getUTCDate();

    if (!sameDay) {
        return false;
    }

    const [startHours, startMinutes] = String(session.startTime).split(':').map(Number);
    const [endHours, endMinutes] = String(session.endTime).split(':').map(Number);
    const currentMinutes = nowKenya.getUTCHours() * 60 + nowKenya.getUTCMinutes();
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return currentMinutes >= startTotalMinutes && currentMinutes <= endTotalMinutes;
};

export const pickLiveSession = (sessions, preferredCampus = null) => {
    if (!Array.isArray(sessions) || sessions.length === 0) {
        return null;
    }

    const now = getKenyanTime();
    const liveSessions = sessions.filter((session) => isSessionLive(session, now));
    if (liveSessions.length === 0) {
        return null;
    }

    if (preferredCampus) {
        const match = liveSessions.find((session) => session.campus === preferredCampus || session.campus === 'Both');
        if (match) return match;
    }

    return liveSessions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
};

/**
 * Resolves a meetingCode or semester/master token to the corresponding active Meeting or Training.
 * 
 * Works hand-in-hand with:
 * 1. Specific Meeting Codes (e.g. "2026-SEP-01", "A3F8")
 * 2. Specific Training Codes (e.g. "TRN-001")
 * 3. Campus Aliases ("athi-river", "athi", "valley-road", "valley", "vr")
 * 4. Semester / Master QR Tokens ("semester", "master", "live", "current", "active", "DOULOS-MASTER-...")
 * 
 * If a Semester QR code is scanned, it automatically binds to the current active meeting/training in the semester.
 * If NO meeting is currently active, it returns null so the system rejects check-in.
 * 
 * @param {string} code - The scanned/provided meeting or semester code
 * @param {string} [preferredCampus] - Optional campus preference (e.g. from user profile or request)
 * @returns {Promise<{ meeting: Object|null, isTraining: boolean, resolutionType: string, isSemesterLink: boolean }>}
 */
export const resolveMeetingOrTraining = async (code, preferredCampus = null) => {
    if (!code) {
        return { meeting: null, isTraining: false, resolutionType: 'none', isSemesterLink: false };
    }

    const cleanCode = String(code).trim().toLowerCase();
    const cacheKey = `sessionResolver:${cleanCode}:${preferredCampus || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached !== null) {
        return cached;
    }

    let result;

    // 1. Direct code lookup in Meeting collection
    let meeting = await Meeting.findOne({ code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } });
    if (meeting) {
        result = {
            meeting,
            isTraining: meeting.category === 'Training',
            resolutionType: 'direct_meeting',
            isSemesterLink: false
        };
        setCached(cacheKey, result, CACHE_TTL.sessionResolve);
        return result;
    }

    // 2. Direct code lookup in Training collection
    let training = await Training.findOne({ code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } });
    if (training) {
        result = {
            meeting: training,
            isTraining: true,
            resolutionType: 'direct_training',
            isSemesterLink: false
        };
        setCached(cacheKey, result, CACHE_TTL.sessionResolve);
        return result;
    }

    // 3. Athi River Campus alias
    if (cleanCode === 'athi-river' || cleanCode === 'athi') {
        const campusMeetings = await Meeting.find({ campus: 'Athi River', isActive: true, isArchived: { $ne: true } });
        meeting = pickLiveSession(campusMeetings, 'Athi River');
        if (!meeting) {
            const campusTrainings = await Training.find({ campus: { $in: ['Athi River', 'Both'] }, isActive: true });
            training = pickLiveSession(campusTrainings, 'Athi River');
            if (training) {
                result = { meeting: training, isTraining: true, resolutionType: 'campus_training', isSemesterLink: false };
                setCached(cacheKey, result, CACHE_TTL.sessionResolve);
                return result;
            }
        }
        if (meeting) {
            result = { meeting, isTraining: meeting.category === 'Training', resolutionType: 'campus_meeting', isSemesterLink: false };
            setCached(cacheKey, result, CACHE_TTL.sessionResolve);
            return result;
        }
        result = { meeting: null, isTraining: false, resolutionType: 'campus_none', isSemesterLink: false };
        setCached(cacheKey, result, CACHE_TTL.sessionResolve);
        return result;
    }

    // 4. Valley Road Campus alias
    if (cleanCode === 'valley-road' || cleanCode === 'valley' || cleanCode === 'vr') {
        const campusMeetings = await Meeting.find({ campus: 'Valley Road', isActive: true, isArchived: { $ne: true } });
        meeting = pickLiveSession(campusMeetings, 'Valley Road');
        if (!meeting) {
            const campusTrainings = await Training.find({ campus: { $in: ['Valley Road', 'Both'] }, isActive: true });
            training = pickLiveSession(campusTrainings, 'Valley Road');
            if (training) {
                result = { meeting: training, isTraining: true, resolutionType: 'campus_training', isSemesterLink: false };
                setCached(cacheKey, result, CACHE_TTL.sessionResolve);
                return result;
            }
        }
        if (meeting) {
            result = { meeting, isTraining: meeting.category === 'Training', resolutionType: 'campus_meeting', isSemesterLink: false };
            setCached(cacheKey, result, CACHE_TTL.sessionResolve);
            return result;
        }
        result = { meeting: null, isTraining: false, resolutionType: 'campus_none', isSemesterLink: false };
        setCached(cacheKey, result, CACHE_TTL.sessionResolve);
        return result;
    }

    // 5. Semester QR Code / Master Token / Live Session (Hand-in-hand resolution)
    const isSemesterOrMaster = [
        'semester', 'master', 'live', 'current', 'active', 'all', 'portal'
    ].includes(cleanCode) || cleanCode.startsWith('doulos-master-');

    if (isSemesterOrMaster) {
        const campusFilter = preferredCampus ? { campus: { $in: [preferredCampus, 'Both'] } } : {};

        const availableMeetings = await Meeting.find({
            ...campusFilter,
            isActive: true,
            isArchived: { $ne: true }
        });
        meeting = pickLiveSession(availableMeetings, preferredCampus);

        if (!meeting) {
            const availableTrainings = await Training.find({
                ...campusFilter,
                isActive: true
            });
            training = pickLiveSession(availableTrainings, preferredCampus);

            if (training) {
                result = {
                    meeting: training,
                    isTraining: true,
                    resolutionType: 'semester_training',
                    isSemesterLink: true
                };
                setCached(cacheKey, result, CACHE_TTL.sessionResolve);
                return result;
            }
        }

        if (meeting) {
            result = {
                meeting,
                isTraining: meeting.category === 'Training',
                resolutionType: 'semester_meeting',
                isSemesterLink: true
            };
            setCached(cacheKey, result, CACHE_TTL.sessionResolve);
            return result;
        }

        result = {
            meeting: null,
            isTraining: false,
            resolutionType: 'semester_no_active_session',
            isSemesterLink: true
        };
        setCached(cacheKey, result, CACHE_TTL.sessionResolve);
        return result;
    }

    result = { meeting: null, isTraining: false, resolutionType: 'not_found', isSemesterLink: false };
    setCached(cacheKey, result, CACHE_TTL.sessionResolve);
    return result;
};
