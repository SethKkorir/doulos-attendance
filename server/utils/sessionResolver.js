import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Setting from '../models/Settings.js';

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

    // 1. Direct code lookup in Meeting collection
    let meeting = await Meeting.findOne({ code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } });
    if (meeting) {
        return {
            meeting,
            isTraining: meeting.category === 'Training',
            resolutionType: 'direct_meeting',
            isSemesterLink: false
        };
    }

    // 2. Direct code lookup in Training collection
    let training = await Training.findOne({ code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } });
    if (training) {
        return {
            meeting: training,
            isTraining: true,
            resolutionType: 'direct_training',
            isSemesterLink: false
        };
    }

    // 3. Athi River Campus alias
    if (cleanCode === 'athi-river' || cleanCode === 'athi') {
        meeting = await Meeting.findOne({ campus: 'Athi River', isActive: true, isArchived: { $ne: true } }).sort({ date: -1 });
        if (!meeting) {
            training = await Training.findOne({ campus: { $in: ['Athi River', 'Both'] }, isActive: true }).sort({ date: -1 });
            if (training) return { meeting: training, isTraining: true, resolutionType: 'campus_training', isSemesterLink: false };
        }
        if (meeting) return { meeting, isTraining: meeting.category === 'Training', resolutionType: 'campus_meeting', isSemesterLink: false };
        return { meeting: null, isTraining: false, resolutionType: 'campus_none', isSemesterLink: false };
    }

    // 4. Valley Road Campus alias
    if (cleanCode === 'valley-road' || cleanCode === 'valley' || cleanCode === 'vr') {
        meeting = await Meeting.findOne({ campus: 'Valley Road', isActive: true, isArchived: { $ne: true } }).sort({ date: -1 });
        if (!meeting) {
            training = await Training.findOne({ campus: { $in: ['Valley Road', 'Both'] }, isActive: true }).sort({ date: -1 });
            if (training) return { meeting: training, isTraining: true, resolutionType: 'campus_training', isSemesterLink: false };
        }
        if (meeting) return { meeting, isTraining: meeting.category === 'Training', resolutionType: 'campus_meeting', isSemesterLink: false };
        return { meeting: null, isTraining: false, resolutionType: 'campus_none', isSemesterLink: false };
    }

    // 5. Semester QR Code / Master Token / Live Session (Hand-in-hand resolution)
    const isSemesterOrMaster = [
        'semester', 'master', 'live', 'current', 'active', 'all', 'portal'
    ].includes(cleanCode) || cleanCode.startsWith('doulos-master-');

    if (isSemesterOrMaster) {
        const campusFilter = preferredCampus ? { campus: { $in: [preferredCampus, 'Both'] } } : {};

        // Find currently active meeting in the active semester
        meeting = await Meeting.findOne({
            ...campusFilter,
            isActive: true,
            isArchived: { $ne: true }
        }).sort({ date: -1 });

        if (!meeting) {
            training = await Training.findOne({
                ...campusFilter,
                isActive: true
            }).sort({ date: -1 });

            if (training) {
                return {
                    meeting: training,
                    isTraining: true,
                    resolutionType: 'semester_training',
                    isSemesterLink: true
                };
            }
        }

        if (meeting) {
            return {
                meeting,
                isTraining: meeting.category === 'Training',
                resolutionType: 'semester_meeting',
                isSemesterLink: true
            };
        }

        return {
            meeting: null,
            isTraining: false,
            resolutionType: 'semester_no_active_session',
            isSemesterLink: true
        };
    }

    return { meeting: null, isTraining: false, resolutionType: 'not_found', isSemesterLink: false };
};
