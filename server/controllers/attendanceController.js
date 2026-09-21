import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Member from '../models/Member.js';
import ActivityLog from '../models/ActivityLog.js';
import Settings from '../models/Settings.js';
import CheckInToken from '../models/CheckInToken.js';
import mongoose from 'mongoose';
import { getKenyanTime, getKenyanDate, getWeekRange } from '../utils/kenyanTime.js';
import { resolveMeetingOrTraining } from '../utils/sessionResolver.js';
import { getCached, setCached, CACHE_TTL } from '../utils/checkInCache.js';

const logScanError = async (studentRegNo, errorType, desc, campus) => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.collection('scanerrors').insertOne({
                studentRegNo: studentRegNo ? String(studentRegNo).trim().toUpperCase() : 'UNKNOWN',
                error: errorType,
                desc: desc,
                campus: campus || 'Athi River',
                timestamp: new Date()
            });
        }
    } catch (err) {
        console.error("Failed to log scan error in MongoDB:", err);
    }
};

export const submitAttendance = async (req, res) => {
    const { meetingCode, responses, memberType, secretCode, deviceId, serverStartTime, userLat, userLong, token, accuracy, campus } = req.body;

    try {
        const prelimRegNo = responses?.studentRegNo || responses?.regNo || responses?.admNo || req.body.studentRegNo || 'UNKNOWN';
        const preferredCampus = campus || responses?.campus || null;

        const { meeting, isTraining, resolutionType, isSemesterLink } = await resolveMeetingOrTraining(meetingCode, preferredCampus);

        if (!meeting) {
            const errorCampus = preferredCampus || 'Athi River';
            if (isSemesterLink) {
                await logScanError(prelimRegNo, 'No Active Session', `Semester QR check-in attempted with no active meeting`, errorCampus);
                return res.status(404).json({
                    message: 'No active meeting or training in session for this semester right now. The Semester QR code only activates during live fellowship meetings and training sessions.'
                });
            }
            if (resolutionType === 'campus_none') {
                await logScanError(prelimRegNo, 'No Active Session', `Attempted check-in to ${meetingCode} but no active session found`, errorCampus);
                return res.status(404).json({ message: `No active meeting or training found for ${meetingCode} campus.` });
            }
            await logScanError(prelimRegNo, 'Invalid Code', `Attempted check-in with invalid meeting code: ${meetingCode}`, errorCampus);
            return res.status(404).json({ message: 'Invalid or expired Meeting/Training Code' });
        }

        const isTrainingModel = isTraining;
        const isTrainingSession = isTraining || meeting.category === 'Training';

        // 2. User & Role check
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);

        // 2.5. Stage 0: Token Validation only. Do not burn a token on a failed attempt.
        let tokenDoc = null;
        if (token) {
            tokenDoc = await CheckInToken.findOne({
                token,
                isUsed: false,
                expiresAt: { $gt: new Date() }
            });

            if (!tokenDoc && !isSuperUser && !meeting.isTestMeeting) {
                const existing = await CheckInToken.findOne({ token });
                if (existing && existing.isUsed) {
                    await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Token Reused', `Attempted re-use of burned check-in token`, meeting.campus);
                    return res.status(403).json({ message: 'This check-in link/token has already been used. Please scan the QR code again.' });
                }
                if (existing && existing.expiresAt <= new Date()) {
                    await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Token Expired', `Attempted submission with expired token`, meeting.campus);
                    return res.status(410).json({ message: 'Check-in token expired. Please scan the QR code again.' });
                }
                await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Invalid Token', `Attempted submission with invalid token: ${token}`, meeting.campus);
                return res.status(403).json({ message: 'Invalid or expired check-in token. Please scan the QR code again.' });
            }
        } else if (!isSuperUser && !meeting.isTestMeeting) {
            await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Missing Token', `Direct check-in attempted without QR token`, meeting.campus);
            return res.status(403).json({ message: 'Security verification required: Please scan the official venue QR code to check in.' });
        }

        // 3. Activity Check (Bypass for SuperUser or Test Meetings)
        if (!meeting.isActive && !isSuperUser && !meeting.isTestMeeting) {
            await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Session Closed', `Attempted check-in to closed session: ${meeting.name}`, meeting.campus);
            return res.status(400).json({ message: 'Meeting is closed' });
        }

        // 4. Strict Start Time Check (EAT / Nairobi Time)
        const now = getKenyanTime();
        const meetingDate = new Date(meeting.date);

        // Normalize both to date strings for day comparison (YYYY-MM-DD)
        const Y = meetingDate.getUTCFullYear();
        const M = String(meetingDate.getUTCMonth() + 1).padStart(2, '0');
        const D = String(meetingDate.getUTCDate()).padStart(2, '0');
        const meetingStr = `${Y}-${M}-${D}`;
        const todayStr = getKenyanDate();

        const [startHours, startMinutes] = meeting.startTime.split(':').map(Number);
        const [endHours, endMinutes] = meeting.endTime.split(':').map(Number);

        const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        console.log(`[DEBUG] Time Check (EAT): Today=${todayStr} Meeting=${meetingStr} Now=${now.getUTCHours()}:${now.getUTCMinutes()} vs Start=${meeting.startTime} End=${meeting.endTime}`);

        if (!isSuperUser && !meeting.isTestMeeting) {
            // 1. Future Day Block
            if (todayStr < meetingStr) {
                await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Timing Violation', `Early scan attempted for scheduled meeting: ${meeting.name}`, meeting.campus);
                return res.status(403).json({ message: `This meeting is scheduled for ${meetingDate.toLocaleDateString()}.` });
            }

            // 2. Same Day Timing
            if (todayStr === meetingStr) {
                // Strict check: Scan before start time is blocked
                if (currentMinutes < startTotalMinutes) {
                    await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Timing Violation', `Early scan window locked for meeting: ${meeting.name}`, meeting.campus);
                    return res.status(403).json({ message: `ACCESS DENIED: This meeting has not yet started. It starts at ${meeting.startTime} EAT.` });
                }

                // Strict check: Scan after end time is blocked
                if (currentMinutes > endTotalMinutes) {
                    await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Timing Violation', `Late scan attempted. Session closed for meeting: ${meeting.name}`, meeting.campus);
                    return res.status(403).json({ message: `ACCESS DENIED: This meeting ended at ${meeting.endTime} EAT.` });
                }
            }

            // 3. Past Day Block (Lock immediately if date is past)
            if (todayStr > meetingStr) {
                await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Timing Violation', `Stale scan attempted after date of ${meeting.name}`, meeting.campus);
                return res.status(403).json({ message: 'ACCESS DENIED: Attendance window closed.' });
            }
        }

        // 5. Extract Reg No
        const data = responses || req.body;
        let rawRegNo = data.studentRegNo || data.regNo || data.admNo;

        if (!rawRegNo) {
            const fallbackKey = Object.keys(data).find(k =>
                k.toLowerCase().includes('reg') || k.toLowerCase().includes('adm')
            );
            if (fallbackKey) rawRegNo = data[fallbackKey];
        }

        if (!rawRegNo) {
            return res.status(400).json({ message: 'Admission Number is required' });
        }

        const studentRegNo = String(rawRegNo).trim().toUpperCase();
        const digits = String(rawRegNo).replace(/\D/g, '');

        // 6. Member Registry Lookup (supports 24-1033, 241033, 24/1033)
        let member = await Member.findOne({ studentRegNo });
        if (!member) {
            member = await Member.findOne({ studentRegNo: { $regex: new RegExp(`^${studentRegNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        }
        if (!member && digits.length >= 4) {
            const prefix = digits.slice(0, 2);
            const suffix = digits.slice(2);
            member = await Member.findOne({ studentRegNo: { $regex: new RegExp(`^${prefix}[-/\\s]*${suffix}$`, 'i') } });
        }

        if (member && member.isActive === false) {
            await logScanError(studentRegNo, 'Account Blocked', `Attempted check-in by blocked student: ${member.name}`, meeting.campus);
            return res.status(403).json({ message: 'ACCESS DENIED: Your account is suspended/blocked. Please contact the administrator.' });
        }

        // 7. Stage 3: Geofencing / Device checks are only needed for non-QR flows or suspicious cases.
        // For a valid QR token, skip the expensive secondary validation set to keep check-in fast.
        const fastQrPath = !!tokenDoc && !isSuperUser && !meeting.isTestMeeting;
        const isFallbackPath = tokenDoc?.fallbackUsed && tokenDoc?.stampedDeviceId;

        if (isFallbackPath) {
            if (tokenDoc.stampedDeviceId !== deviceId && !isSuperUser && !meeting.isTestMeeting) {
                await logScanError(studentRegNo, 'Device Signature Mismatch', `Fallback token device mismatch: stamped=${tokenDoc.stampedDeviceId}, current=${deviceId}`, meeting.campus);
                return res.status(403).json({ message: 'Device signature mismatch: This fallback check-in can only be redeemed on the device that requested it.' });
            }
        } else if (!fastQrPath && meeting.location?.latitude && meeting.location?.longitude && !isSuperUser && !member?.isTestAccount && !isTrainingSession) {
            if (!userLat || !userLong) {
                await logScanError(req.body.studentRegNo || 'UNKNOWN', 'GPS Required', `Location disabled for geofenced meeting: ${meeting.name}`, meeting.campus);
                return res.status(400).json({ message: 'GPS data is required for this meeting. Please enable location.' });
            }

            const uLat = Number(userLat);
            const uLong = Number(userLong);
            const mLat = Number(meeting.location.latitude);
            const mLong = Number(meeting.location.longitude);
            const reportedAccuracy = Math.max(0, Number(accuracy) || 0);

            if (isNaN(uLat) || isNaN(uLong)) {
                return res.status(400).json({ message: 'Invalid GPS coordinates sent. Please enable location and try again.' });
            }

            const R = 6371e3;
            const φ1 = (mLat * Math.PI) / 180;
            const φ2 = (uLat * Math.PI) / 180;
            const Δφ = ((uLat - mLat) * Math.PI) / 180;
            const Δλ = ((uLong - mLong) * Math.PI) / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            const baseRadius = meeting.location.radius || 200;
            const effectiveDistance = Math.max(0, distance - reportedAccuracy);

            if (effectiveDistance > (baseRadius + 100)) {
                await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Geofence Violation', `Outside range for ${meeting.location.name} (dist=${Math.round(distance)}m, acc=${Math.round(reportedAccuracy)}m, eff=${Math.round(effectiveDistance)}m). Required: <${baseRadius + 100}m`, meeting.campus);
                return res.status(403).json({
                    message: `Location Mismatch: You are too far from ${meeting.location.name}. Please ensure you are at the correct venue.`
                });
            }
        }

        // 8. Device Handcuff Logic (Locking student to one phone)
        let isBypassed = false;
        let shouldLinkDevice = false;
        if (member) {
            if (!fastQrPath) {
                const bypassSetting = await Settings.findOne({ key: 'bypass_device_lock' });
                isBypassed = bypassSetting?.value === 'true';
            }

            if (!isBypassed && member.memberType !== 'Visitor') {
                if (!deviceId && !isSuperUser && !meeting.isTestMeeting && !member.isTestAccount) {
                    return res.status(400).json({ message: 'Device Lock Error: Device signature is missing. Please ensure your browser supports local storage and cookies.' });
                }
                if (!member.linkedDeviceId && deviceId) {
                    shouldLinkDevice = true;
                } else if (member.linkedDeviceId && deviceId && member.linkedDeviceId !== deviceId && !isSuperUser && !meeting.isTestMeeting && !member.isTestAccount) {
                    await logScanError(studentRegNo, 'Device Signature Mismatch', `Attempted check-in on a second phone without resetting device link lock. Device ID: ${deviceId}`, meeting.campus);
                    return res.status(403).json({ message: 'Device Lock Error: This account is linked to another device. Please request a device reset from a G9 administrator.' });
                }
            }
        }

        // 8.5. Anti-Proxy Check (One check-in per device per session)
        if (!fastQrPath && !isBypassed && deviceId && !isSuperUser && !meeting.isTestMeeting && !member?.isTestAccount && member?.memberType !== 'Visitor') {
            const deviceQuery = isTrainingModel
                ? { trainingId: meeting._id, deviceId, trainingDay: meeting.activeDay || 1 }
                : { meeting: meeting._id, deviceId };

            const deviceCacheKey = `attendance:device:${meeting._id}:${deviceId}`;
            let deviceUsed = getCached(deviceCacheKey);
            if (deviceUsed === null) {
                deviceUsed = await Attendance.findOne(deviceQuery);
                setCached(deviceCacheKey, deviceUsed || false, CACHE_TTL.deviceCheck);
            }
            if (deviceUsed) {
                await logScanError(studentRegNo, 'Anti-Proxy Block', `Device already used to scan another attendee in this session (${meeting.name})`, meeting.campus);
                return res.status(403).json({ message: 'This device has already been used for a check-in for this session.' });
            }
        }

        // 9. Duplicate check (This session)
        const dupQuery = isTrainingModel
            ? { trainingId: meeting._id, studentRegNo, trainingDay: meeting.activeDay || 1 }
            : { meeting: meeting._id, studentRegNo };

        const duplicateCacheKey = `attendance:dupe:${meeting._id}:${studentRegNo}`;
        let existing = getCached(duplicateCacheKey);
        if (existing === null) {
            existing = await Attendance.findOne(dupQuery);
            setCached(duplicateCacheKey, existing || false, CACHE_TTL.duplicateCheck);
        }

        if (existing && !member?.isTestAccount) {
            await logScanError(studentRegNo, 'Duplicate Check-In', `Attempted duplicate scan for session: ${meeting.name}`, meeting.campus);
            return res.status(409).json({ message: 'You have already signed in for this session.' });
        }

        // 9.5. Weekly Check-In Restriction — keep this only for non-QR/manual edge cases to preserve fast QR flow.
        if (!fastQrPath && !isSuperUser && !meeting.isTestMeeting && !isTrainingSession && !member?.isTestAccount) {
            const { startOfWeek, endOfWeek } = getWeekRange(meeting.date);

            const meetingsThisWeek = await Meeting.find({
                date: { $gte: startOfWeek, $lte: endOfWeek },
                _id: { $ne: meeting._id }
            }).select('_id name campus');

            const otherMeetingIds = meetingsThisWeek.map(m => m._id);

            if (otherMeetingIds.length > 0) {
                const attendedOther = await Attendance.findOne({
                    studentRegNo,
                    meeting: { $in: otherMeetingIds }
                }).populate('meeting');

                if (attendedOther) {
                    await logScanError(studentRegNo, 'Weekly Restriction', `Duplicate weekly attendance: Already signed in to ${attendedOther.meeting.name} (${attendedOther.meeting.campus})`, meeting.campus);
                    const campusName = attendedOther.meeting.campus === 'Valley Road' ? 'Nairobi' : attendedOther.meeting.campus;
                    return res.status(403).json({
                        message: `ACCESS DENIED: A member can only attend one meeting per week. You have already attended "${attendedOther.meeting.name}" (${campusName}) this week.`
                    });
                }
            }
        }

        // 10. Member Registry Lookup & Auto-Registration
        if (!member) {
            const { isNewMember, registrationData } = req.body;

            if (isNewMember && registrationData?.name) {
                member = new Member({
                    studentRegNo,
                    name: registrationData.name,
                    campus: registrationData.campus || meeting.campus,
                    memberType: registrationData.memberType || 'Douloid',
                    status: 'Active'
                });
                await member.save();
                console.log(`[AUTO-REGISTER] New student created: ${studentRegNo} (${registrationData.name})`);
            } else {
                const recoverySetting = await Settings.findOne({ key: 'RECOVERY_MODE' });
                const isRecovery = recoverySetting?.value === 'true';
                await logScanError(studentRegNo, 'Registry Mismatch', `Admission Number not found in MongoDB registry. Recovery: ${isRecovery}`, meeting.campus);
                return res.status(403).json({
                    message: "Access Denied: Your Admission Number is not in the Doulos Registry. Please check details or register."
                });
            }
        }

        // 11. Record Attendance (Skip if Test Account)
        if (!member.isTestAccount) {
            if (token && !isSuperUser && !meeting.isTestMeeting) {
                const consumedToken = await CheckInToken.findOneAndUpdate(
                    {
                        token,
                        isUsed: false,
                        expiresAt: { $gt: new Date() }
                    },
                    {
                        $set: {
                            isUsed: true,
                            usedAt: new Date()
                        }
                    },
                    { new: true }
                );

                if (!consumedToken) {
                    await logScanError(studentRegNo, 'Token Reused', `Concurrent token use detected at final submission: ${token}`, meeting.campus);
                    return res.status(403).json({ message: 'This check-in link/token has already been used. Please scan the QR code again.' });
                }
                tokenDoc = consumedToken;
            }

            if (shouldLinkDevice && deviceId) {
                await Member.findOneAndUpdate({ studentRegNo }, { $set: { linkedDeviceId: deviceId } });
            }

            const attendance = new Attendance({
                meeting: isTrainingModel ? undefined : meeting._id,
                trainingId: isTrainingModel ? meeting._id : undefined,
                meetingName: meeting.name,
                campus: meeting.campus,
                studentRegNo,
                memberType: member.memberType,
                responses: responses || { studentName: data.studentName, studentRegNo },
                questionOfDay: responses?.dailyQuestionAnswer || '',
                deviceId,
                trainingDay: isTrainingModel ? (meeting.activeDay || 1) : undefined
            });
            await attendance.save();

            setCached(`attendance:dupe:${meeting._id}:${studentRegNo}`, attendance, CACHE_TTL.duplicateCheck);
            if (deviceId) {
                setCached(`attendance:device:${meeting._id}:${deviceId}`, attendance, CACHE_TTL.deviceCheck);
            }

            // Clear database scan errors for this student since check-in was successful
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.db.collection('scanerrors').deleteMany({
                    studentRegNo: studentRegNo.trim().toUpperCase()
                });
            }
        }

        // 12. Award Points
        const showGraduationCongrats = member.needsGraduationCongrats;

        if (!member.isTestAccount) {
            await Member.findOneAndUpdate({ studentRegNo }, {
                $inc: { totalPoints: 10 }
            });
        }

        res.status(201).json({
            message: 'Attendance recorded successfully',
            memberName: member.name,
            memberType: member.memberType,
            showGraduationCongrats
        });

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
        // Find records where either meeting or trainingId matches
        const records = await Attendance.find({
            $or: [{ meeting: meetingId }, { trainingId: meetingId }]
        }).sort({ timestamp: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getStudentPortalData = async (req, res) => {
    const { regNo } = req.params;
    try {
        const rawReg = (regNo || '').trim();
        const studentRegNo = rawReg.toUpperCase();
        const digits = rawReg.replace(/\D/g, '');

        // 1. Get member details from Registry (supports 24-1033, 241033, 24/1033)
        let member = await Member.findOne({ studentRegNo });
        if (!member) {
            member = await Member.findOne({ studentRegNo: { $regex: new RegExp(`^${studentRegNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        }
        if (!member && digits.length >= 4) {
            const prefix = digits.slice(0, 2);
            const suffix = digits.slice(2);
            member = await Member.findOne({ studentRegNo: { $regex: new RegExp(`^${prefix}[-/\\s]*${suffix}$`, 'i') } });
        }

        if (!member) {
            return res.status(200).json({ 
                registrationRequired: true, 
                message: "We couldn't find your Admission Number in our registry. Please complete your registration below to create your Doulos Portal account.",
                studentRegNo
            });
        }

        // 1.1 Status Block
        if (member.status === 'Archived') {
            return res.status(403).json({
                message: "Access Paused: Your account is currently archived. Please contact your G9 leader for re-activation if you are joining this semester's class.",
                isArchived: true
            });
        }

        // 2. Fetch the active semester setting & available semesters
        const currentSemesterSetting = await mongoose.model('Settings').findOne({ key: 'current_semester' });
        const currentSemester = currentSemesterSetting ? currentSemesterSetting.value : 'SEP-DEC 2026';

        // Find all distinct semesters present in the database for selection
        const distinctMeetingSemesters = await Meeting.distinct('semester');
        const distinctTrainingSemesters = await Training.distinct('semester');
        const availableSemesters = Array.from(new Set([
            currentSemester,
            ...distinctMeetingSemesters,
            ...distinctTrainingSemesters,
            'MAY-AUG 2026'
        ])).filter(s => s && typeof s === 'string' && s.trim());

        // 3. Target semester resolution
        let targetSemester = (req.query.semester || currentSemester).trim();
        const isAllSemesters = targetSemester.toLowerCase() === 'all';
        const semRegex = isAllSemesters ? null : new RegExp(`^${targetSemester.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        // 4. Query student's attendance records matching sessions
        const attendanceRecords = await Attendance.find({
            studentRegNo
        }).sort({ timestamp: -1 });

        // 5. Get all meetings of the student's default campus for the selected semester
        const memberCampusRegex = new RegExp(`^${(member.campus || 'Athi River').trim()}$`, 'i');
        const campusFilter = { $in: [memberCampusRegex, 'Both', 'All'] };
        const meetingSemesterQuery = isAllSemesters ? {} : { semester: semRegex };

        let semMeetings = await Meeting.find({ 
            ...meetingSemesterQuery
        }, '_id');
        let semMeetingIds = semMeetings.map(m => m._id);

        let semTrainings = await Training.find({ 
            campus: { $in: [member.campus, 'Both', 'All'] },
            ...(isAllSemesters ? {} : { semester: semRegex })
        });
        let semTrainingIds = semTrainings.map(t => t._id);

        const campusMeetings = await Meeting.find({ 
            campus: campusFilter,
            category: { $ne: 'Training' },
            ...meetingSemesterQuery
        }).sort({ date: -1 });

        // 6. Helper to get start of week (Sunday)
        const getWeekStart = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day;
            const start = new Date(d.setDate(diff));
            start.setHours(0, 0, 0, 0);
            return start.getTime();
        };

        // 7. Group by week (Mainly for Weekly Meetings)
        const weeklyData = new Map();

        // Initialize with campus meetings as 'ABSENT'
        campusMeetings.forEach(m => {
            const weekKey = getWeekStart(m.date);
            weeklyData.set(weekKey, {
                _id: m._id,
                name: m.name,
                date: m.date,
                campus: m.campus,
                devotion: m.devotion,
                iceBreaker: m.iceBreaker,
                announcements: m.announcements,
                attended: false,
                isExempted: false,
                attendanceTime: null,
                isTraining: false
            });
        });

        // Initialize all semester trainings as 'ABSENT' for each of the 3 days
        const trainingMap = new Map();
        semTrainings.forEach(t => {
            const tDate = new Date(t.date);
            
            const friDate = new Date(tDate);
            
            const satDate = new Date(tDate);
            satDate.setDate(tDate.getDate() + 1);
            
            const sunDate = new Date(tDate);
            sunDate.setDate(tDate.getDate() + 2);

            trainingMap.set(t._id.toString() + '_1', {
                _id: t._id,
                name: `${t.name} (Day 1)`,
                date: friDate,
                campus: t.campus,
                attended: false,
                isTraining: true,
                trainingDay: 1,
                attendanceTime: null
            });
            trainingMap.set(t._id.toString() + '_2', {
                _id: t._id,
                name: `${t.name} (Day 2)`,
                date: satDate,
                campus: t.campus,
                attended: false,
                isTraining: true,
                trainingDay: 2,
                attendanceTime: null
            });
            trainingMap.set(t._id.toString() + '_3', {
                _id: t._id,
                name: `${t.name} (Day 3)`,
                date: sunDate,
                campus: t.campus,
                attended: false,
                isTraining: true,
                trainingDay: 3,
                attendanceTime: null
            });
        });

        // Helper to match target semester
        const matchesTargetSemester = (itemSemester, recordTimestamp) => {
            if (isAllSemesters) return true;
            if (itemSemester) {
                return itemSemester.trim().toLowerCase() === targetSemester.toLowerCase();
            }
            if (recordTimestamp) {
                const d = new Date(recordTimestamp);
                const month = d.getUTCMonth();
                if (month >= 8 && targetSemester.includes('SEP-DEC')) return true;
                if (month >= 4 && month <= 7 && targetSemester.includes('MAY-AUG')) return true;
                if (month >= 0 && month <= 3 && targetSemester.includes('JAN-APR')) return true;
            }
            return false;
        };

        // Overlay with actual attendance
        const attendedMeetingIds = attendanceRecords.filter(a => a.meeting).map(a => a.meeting);
        const attendedMeetings = await Meeting.find({ _id: { $in: attendedMeetingIds } });
        const attendedTrainingIds = attendanceRecords.filter(a => a.trainingId).map(a => a.trainingId);
        const attendedTrainings = await Training.find({ _id: { $in: attendedTrainingIds } });

        attendanceRecords.forEach(record => {
            if (record.trainingId) {
                const training = attendedTrainings.find(t => t._id.toString() === record.trainingId.toString());
                if (!matchesTargetSemester(training?.semester || record.semester, record.timestamp)) return;

                const dayNum = record.trainingDay || 1;
                const mapKey = record.trainingId.toString() + '_' + dayNum;
                const existingEntry = trainingMap.get(mapKey);
                if (existingEntry) {
                    existingEntry.attended = true;
                    existingEntry.attendanceTime = record.timestamp;
                }
                return;
            }

            const meeting = attendedMeetings.find(m => m._id.toString() === record.meeting?.toString());
            if (!meeting) return;

            const isTrainingMeeting = meeting.category === 'Training';

            if (isTrainingMeeting) {
                if (!matchesTargetSemester(meeting.semester || record.semester, record.timestamp)) return;

                const mapKey = meeting._id.toString() + '_1';
                const existingEntry = trainingMap.get(mapKey);
                if (existingEntry) {
                    existingEntry.attended = true;
                    existingEntry.attendanceTime = record.timestamp;
                } else {
                    trainingMap.set(meeting._id.toString(), {
                        _id: meeting._id,
                        name: meeting.name,
                        date: meeting.date,
                        campus: meeting.campus,
                        attended: true,
                        isTraining: true,
                        attendanceTime: record.timestamp
                    });
                }
                return;
            }

            if (!matchesTargetSemester(meeting.semester || record.semester, record.timestamp)) return;

            const weekKey = getWeekStart(meeting.date || record.timestamp);
            weeklyData.set(weekKey, {
                _id: meeting._id,
                name: meeting.name,
                date: meeting.date || record.timestamp,
                campus: meeting.campus,
                devotion: meeting.devotion,
                iceBreaker: meeting.iceBreaker,
                announcements: meeting.announcements,
                attended: true,
                isExempted: record.isExempted || false,
                attendanceTime: record.timestamp,
                isTraining: false
            });
        });

        // Convert Map to sorted array and merge with trainings
        const meetingHistory = Array.from(weeklyData.values());
        const trainingHistory = Array.from(trainingMap.values());
        const history = [...meetingHistory, ...trainingHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Stats calculation (strictly scoped to the target semester)
        const relevantMeetingRecords = attendanceRecords.filter(a => {
            if (a.meeting) {
                const meeting = attendedMeetings.find(m => m._id.toString() === a.meeting.toString());
                if (!meeting || meeting.category === 'Training') return false;
                return matchesTargetSemester(meeting.semester || a.semester, a.timestamp);
            }
            return false;
        });

        const relevantTrainingRecords = attendanceRecords.filter(a => {
            if (a.trainingId) {
                const training = attendedTrainings.find(t => t._id.toString() === a.trainingId.toString());
                return matchesTargetSemester(training?.semester || a.semester, a.timestamp);
            }
            if (a.meeting) {
                const meeting = attendedMeetings.find(m => m._id.toString() === a.meeting.toString());
                if (meeting && meeting.category === 'Training') {
                    return matchesTargetSemester(meeting.semester || a.semester, a.timestamp);
                }
            }
            return false;
        });

        const physicalAttended = relevantMeetingRecords.filter(a => !a.isExempted).length;
        const exemptedCount = relevantMeetingRecords.filter(a => a.isExempted).length;
        const totalTrainingAttended = relevantTrainingRecords.length;
        const totalValid = physicalAttended + exemptedCount;

        // Total fellowship meetings held for this semester:
        // Number of campus meetings held so far, or at least the number of meetings attended by the student
        const totalMeetings = Math.max(campusMeetings.length, totalValid);
        const percentage = totalMeetings > 0 ? Math.min(100, Math.round((totalValid / totalMeetings) * 100)) : 0;

        // 8. Doulos Hours & Activity Check (filtered by current semester)
        const activityLogs = await ActivityLog.find({ studentRegNo, semester: currentSemester }).sort({ timestamp: -1 }).limit(10);

        // 9. Finance Check (Mock logic for now - check if paid for current month)
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        const hasPaidThisMonth = await mongoose.model('Payment').findOne({
            studentRegNo,
            month: currentMonthName,
            status: 'approved'
        });

        // 10. Reminder Logic
        const alerts = [];

        // Semester Alert Settings Fetch
        const themeSetting = await mongoose.model('Settings').findOne({ key: 'semester_theme' });
        const verseSetting = await mongoose.model('Settings').findOne({ key: 'semester_verse' });
        const semesterTheme = themeSetting ? themeSetting.value : '';
        const semesterVerse = verseSetting ? verseSetting.value : '';

        // Legacy enrollment alerts are removed as per requirements since we use a warm pop-up wizard instead

        // Watering Alert
        const todayDay = new Date().toLocaleString('default', { weekday: 'long' });
        if (member.wateringDays.includes(todayDay)) {
            const wateredToday = activityLogs.find(log =>
                log.type === 'Tree Watering' &&
                new Date(log.timestamp).toDateString() === new Date().toDateString()
            );

            if (!wateredToday) {
                alerts.push({
                    type: 'watering',
                    priority: 'medium',
                    title: "Tree Watering Day",
                    message: `Reminder: Today is your day to water at Freedom Base. Don't forget to scan the QR!`,
                    action: 'SCAN_QR'
                });
            }
        }

        // Missed Watering Check (Last Week)
        const lastWeekWateringDay = new Date();
        lastWeekWateringDay.setDate(lastWeekWateringDay.getDate() - 7);
        // ... more complex logic could go here, but keeping it simple for now

        // Finance Alert
        if (!hasPaidThisMonth && member.memberType !== 'Visitor') {
            alerts.push({
                type: 'finance',
                priority: 'medium',
                title: "Monthly Contribution",
                message: `Your contribution for ${currentMonthName} is currently pending.`,
                action: 'PAY'
            });
        }

        // Fetch other group members
        let groupMembers = [];
        if (member.groupName) {
            groupMembers = await Member.find({
                groupName: member.groupName,
                status: 'Active',
                studentRegNo: { $ne: studentRegNo }
            }).select('name studentRegNo campus memberType').lean();
        }

        // Fetch watering selector active setting
        const wateringActiveSetting = await mongoose.model('Settings').findOne({ key: 'watering_selector_active' });
        const wateringSelectorActive = wateringActiveSetting ? wateringActiveSetting.value === 'true' : false;

        // Set persistent HTTP session cookie for student portal
        const studentCookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        res.cookie('doulos_student_session', JSON.stringify({
            studentRegNo,
            memberName: member.name || 'Visitor',
            memberType: member.memberType || 'Douloid'
        }), studentCookieOptions);

        res.json({
            studentRegNo,
            memberName: member.name || 'Visitor',
            memberType: member.memberType || 'Visitor',
            douloidRank: member.douloidRank || 'None',
            belayStatus: member.belayStatus || 'Not Permitted',
            soloStationAllowed: member.soloStationAllowed || false,
            rankHistory: member.rankHistory || [],
            evaluations: member.evaluations || [],
            status: member.status,
            wateringDays: member.wateringDays,
            groupName: member.groupName || null,
            groupMembers,
            wateringSelectorActive,
            totalPoints: member.totalPoints || 0,
            lastActiveSemester: member.lastActiveSemester,
            isActiveThisSemester: member.isActiveThisSemester !== undefined ? member.isActiveThisSemester : true,
            lastConfirmedSemester: member.lastConfirmedSemester || null,
            needsSemesterConfirmation: (member.lastConfirmedSemester || '') !== currentSemester,
            currentSemester,
            availableSemesters,
            selectedSemester: targetSemester,
            semesterTheme,
            semesterVerse,
            needsGraduationCongrats: member.needsGraduationCongrats || false,
            stats: {
                totalMeetings,
                physicalAttended,
                exemptedCount,
                trainingAttended: totalTrainingAttended,
                totalTrainings: semTrainings.length * 3,
                totalAttended: totalValid,
                percentage
            },
            isMember: !!member,
            history,
            activityLogs,
            alerts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const manualCheckIn = async (req, res) => {
    const { meetingId, studentRegNo, name, memberId, trainingDay } = req.body;
    try {
        const regNo = (studentRegNo || '').trim().toUpperCase();
        const memberName = (name || '').trim();

        let meeting = await Meeting.findById(meetingId);
        let isTraining = false;

        if (!meeting) {
            meeting = await Training.findById(meetingId);
            if (!meeting) return res.status(404).json({ message: 'Meeting/Training not found' });
            isTraining = true;
        }

        // Lookup member Registry first by regNo, name, or memberId
        let member = null;
        if (regNo) {
            member = await Member.findOne({ studentRegNo: regNo });
        }
        if (!member && memberName) {
            member = await Member.findOne({ name: { $regex: new RegExp(`^${memberName}$`, 'i') } });
        }
        if (!member && memberId) {
            member = await Member.findById(memberId).catch(() => null);
        }

        const effectiveReg = member ? (member.studentRegNo || member.name) : (regNo || memberName || 'MANUAL-ENTRY');

        const targetDay = isTraining ? (Number(trainingDay) || meeting.activeDay || 1) : undefined;

        const dupQuery = isTraining
            ? { trainingId: meetingId, studentRegNo: effectiveReg, trainingDay: targetDay }
            : { meeting: meetingId, studentRegNo: effectiveReg };

        const existing = await Attendance.findOne(dupQuery);
        if (existing) return res.status(409).json({ message: 'Already checked in for this session' });

        // --- ENFORCE STRICT RULE: 1 MEETING ATTENDANCE PER WEEK PER MEMBER ---
        if (!isTraining && !meeting.isTestMeeting) {
            const { startOfWeek, endOfWeek } = getWeekRange(meeting.date);
            const otherMeetings = await Meeting.find({
                date: { $gte: startOfWeek, $lte: endOfWeek },
                _id: { $ne: meeting._id }
            }).select('_id name campus date');

            const otherIds = otherMeetings.map(m => m._id);
            if (otherIds.length > 0) {
                const attendedOther = await Attendance.findOne({
                    studentRegNo: effectiveReg,
                    meeting: { $in: otherIds }
                }).populate('meeting');

                if (attendedOther) {
                    const campusName = attendedOther.meeting.campus === 'Valley Road' ? 'Nairobi' : attendedOther.meeting.campus;
                    return res.status(400).json({
                        message: `Policy Restriction: ${member?.name || effectiveReg} has already attended "${attendedOther.meeting.name}" (${campusName}) this week. A member can only attend one meeting per week.`
                    });
                }
            }
        }

        // Security: Lock manual check-in after 24-48 hours (Bypass for SuperAdmin)
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);
        if (!isSuperUser && !isTraining) {
            const now = new Date();
            const meetingDate = new Date(meeting.date);
            const [endH, endM] = meeting.endTime.split(':').map(Number);
            const meetingEnd = new Date(meetingDate);
            meetingEnd.setUTCHours(endH, endM, 0, 0);
            const hoursSinceEnd = (now - meetingEnd) / (1000 * 60 * 60);

            if (hoursSinceEnd > 48) {
                return res.status(403).json({ message: 'Manual check-in locked. 48 hours have passed since this meeting ended.' });
            }
        }

        if (!member) {
            const { registrationData } = req.body;
            member = new Member({
                studentRegNo: regNo,
                name: registrationData?.name || name || 'Manual Entry',
                memberType: registrationData?.memberType || 'Visitor',
                campus: registrationData?.campus || meeting.campus,
                status: 'Active'
            });
            await member.save();
            console.log(`[ADMIN-AUTO-REGISTER] New student created: ${regNo || member.name} (${member.name})`);
        }

        const attendance = new Attendance({
            meeting: isTraining ? undefined : meetingId,
            trainingId: isTraining ? meetingId : undefined,
            meetingName: meeting.name,
            campus: meeting.campus,
            studentRegNo: effectiveReg,
            memberType: member.memberType,
            responses: { studentName: member.name, studentRegNo: member.studentRegNo || '' },
            trainingDay: isTraining ? targetDay : undefined
        });

        await attendance.save();

        // Award Points and reset device lock on manual override
        await Member.findByIdAndUpdate(member._id, { 
            $inc: { totalPoints: 10 },
            $set: { linkedDeviceId: null }
        });

        // Clear database scan errors for this student since check-in was successful
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.collection('scanerrors').deleteMany({
                studentRegNo: regNo
            });
        }

        res.status(201).json({ message: 'Admin checked-in student successfully', record: attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const bulkManualCheckIn = async (req, res) => {
    const { meetingId, trainingDay } = req.body;
    const memberList = req.body.members || req.body.studentRegNos || [];
    try {
        if (!meetingId || !Array.isArray(memberList) || memberList.length === 0) {
            return res.status(400).json({ message: 'Invalid request: meetingId and members array are required' });
        }

        let meeting = await Meeting.findById(meetingId);
        let isTraining = false;

        if (!meeting) {
            meeting = await Training.findById(meetingId);
            if (!meeting) return res.status(404).json({ message: 'Meeting/Training not found' });
            isTraining = true;
        }

        const targetDay = isTraining ? (Number(trainingDay) || meeting.activeDay || 1) : undefined;

        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);
        if (!isSuperUser && !isTraining) {
            const now = new Date();
            const meetingDate = new Date(meeting.date);
            const [endH, endM] = meeting.endTime.split(':').map(Number);
            const meetingEnd = new Date(meetingDate);
            meetingEnd.setUTCHours(endH, endM, 0, 0);
            const hoursSinceEnd = (now - meetingEnd) / (1000 * 60 * 60);

            if (hoursSinceEnd > 48) {
                return res.status(403).json({ message: 'Manual check-in locked. 48 hours have passed since this meeting ended.' });
            }
        }

        // Find other meetings this week to enforce 1 meeting attendance per week
        const weeklyAttendedMap = new Map();
        if (!isTraining && !meeting.isTestMeeting) {
            const { startOfWeek, endOfWeek } = getWeekRange(meeting.date);
            const otherMeetings = await Meeting.find({
                date: { $gte: startOfWeek, $lte: endOfWeek },
                _id: { $ne: meeting._id }
            }).select('_id name campus');

            const otherIds = otherMeetings.map(m => m._id);
            if (otherIds.length > 0) {
                const weeklyRecords = await Attendance.find({
                    meeting: { $in: otherIds }
                }).populate('meeting');

                for (const rec of weeklyRecords) {
                    const reg = String(rec.studentRegNo).trim().toUpperCase();
                    const cName = rec.meeting?.campus === 'Valley Road' ? 'Nairobi' : (rec.meeting?.campus || '');
                    weeklyAttendedMap.set(reg, `${rec.meeting?.name || 'Meeting'} (${cName})`);
                }
            }
        }

        const records = [];
        const skipped = [];

        for (const item of memberList) {
            const rawReg = typeof item === 'string' ? item : (item.studentRegNo || item.regNo);
            if (!rawReg) continue;
            const regNo = String(rawReg).trim().toUpperCase();
            const studentName = typeof item === 'object' ? item.name : undefined;

            let dbMember = null;
            if (regNo && regNo.length > 0) {
                dbMember = await Member.findOne({ studentRegNo: regNo });
            }
            if (!dbMember && studentName) {
                dbMember = await Member.findOne({ name: { $regex: new RegExp(`^${studentName.trim()}$`, 'i') } });
            }
            if (!dbMember && typeof item === 'object' && item._id) {
                dbMember = await Member.findById(item._id).catch(() => null);
            }

            const effectiveReg = dbMember ? (dbMember.studentRegNo || dbMember.name) : (regNo || studentName || 'BULK-ENTRY');

            const dupQuery = isTraining
                ? { trainingId: meetingId, studentRegNo: effectiveReg, trainingDay: targetDay }
                : { meeting: meetingId, studentRegNo: effectiveReg };

            const existing = await Attendance.findOne(dupQuery);
            if (existing) {
                skipped.push({ regNo: effectiveReg, reason: 'Already checked in for this session' });
                continue;
            }

            if (weeklyAttendedMap.has(effectiveReg)) {
                skipped.push({ regNo: effectiveReg, reason: `Already attended ${weeklyAttendedMap.get(effectiveReg)} this week` });
                continue;
            }

            if (!dbMember) {
                dbMember = new Member({
                    studentRegNo: regNo,
                    name: studentName || 'Manual Bulk Entry',
                    memberType: 'Visitor',
                    campus: meeting.campus,
                    status: 'Active'
                });
                await dbMember.save();
            }

            const attendance = new Attendance({
                meeting: isTraining ? undefined : meetingId,
                trainingId: isTraining ? meetingId : undefined,
                meetingName: meeting.name,
                campus: meeting.campus,
                studentRegNo: effectiveReg,
                memberType: dbMember.memberType,
                responses: { studentName: dbMember.name, studentRegNo: dbMember.studentRegNo || '' },
                trainingDay: isTraining ? targetDay : undefined
            });

            await attendance.save();

            await Member.findByIdAndUpdate(dbMember._id, { 
                $inc: { totalPoints: 10 },
                $set: { linkedDeviceId: null }
            });

            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.db.collection('scanerrors').deleteMany({
                    studentRegNo: regNo
                });
            }

            records.push(attendance);
        }

        res.status(201).json({
            message: `Successfully checked in ${records.length} students.`,
            checkedCount: records.length,
            skippedCount: skipped.length,
            records
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const deleteAttendance = async (req, res) => {
    const { id } = req.params;
    try {
        const attendance = await Attendance.findById(id).populate('meeting');
        if (!attendance) return res.status(404).json({ message: 'Record not found' });

        // Allowed: test meeting OR developer/superadmin OR G5 Training / Trainers / G-Council
        const userRole = (req.user?.role || '').toLowerCase();
        const isTestMeeting = attendance.meeting?.isTestMeeting;
        const isAuthorized = ['developer', 'superadmin', 'trainer', 'g5_training', 'g5', 'g2_vice', 'g2_operations', 'g2', 'admin'].includes(userRole) || userRole.startsWith('g');

        if (isTestMeeting || isAuthorized) {
            await Attendance.findByIdAndDelete(id);

            // Deduct 10 points from the member's profile, clamping to minimum of 0
            if (attendance.studentRegNo) {
                const member = await Member.findOne({ studentRegNo: attendance.studentRegNo });
                if (member) {
                    member.totalPoints = Math.max(0, (member.totalPoints || 0) - 10);
                    await member.save();
                }
            }

            res.json({ message: 'Attendance record deleted' });
        } else {
            res.status(403).json({ message: 'Only G5 coordinators and admins can delete attendance data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleExemption = async (req, res) => {
    const { id } = req.params;
    try {
        const record = await Attendance.findById(id).populate('meeting');
        if (!record) return res.status(404).json({ message: 'Record not found' });

        // Security: Lock exemption toggle after 24 hours (Bypass for SuperAdmin)
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);
        const meeting = record.meeting;
        if (!isSuperUser && meeting) {
            const now = new Date();
            const meetingDate = new Date(meeting.date);
            const [endH, endM] = meeting.endTime.split(':').map(Number);
            const meetingEnd = new Date(meetingDate);
            meetingEnd.setHours(endH, endM, 0, 0);
            const hoursSinceEnd = (now - meetingEnd) / (1000 * 60 * 60);

            if (hoursSinceEnd > 48) {
                return res.status(403).json({ message: 'Modification locked. 48 hours have passed since this meeting ended.' });
            }
        }

        record.isExempted = !record.isExempted;
        await record.save();

        res.json({ message: 'Exemption status updated', isExempted: record.isExempted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 1. Live Check-In Feed (Polling or WebSocket feed)
export const getLiveAttendance = async (req, res) => {
    try {
        const { meetingId } = req.query;
        let meetingQuery = { isActive: true, isArchived: false };
        if (meetingId) {
            meetingQuery = { _id: meetingId };
        }

        const meeting = await Meeting.findOne(meetingQuery);
        if (!meeting) {
            return res.json({
                success: true,
                hasActiveMeeting: false,
                meeting: null,
                count: 0,
                attendees: []
            });
        }

        const attendees = await Attendance.find({ meeting: meeting._id })
            .sort({ timestamp: -1 })
            .limit(100);

        res.json({
            success: true,
            hasActiveMeeting: true,
            meeting: {
                id: meeting._id,
                name: meeting.name,
                campus: meeting.campus,
                code: meeting.code,
                date: meeting.date,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                location: meeting.location
            },
            count: attendees.length,
            lastScanned: attendees[0] || null,
            attendees
        });
    } catch (error) {
        console.error('Error in getLiveAttendance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Server-computed Weekly/Semester Attendance Rollup
export const getAttendanceRollup = async (req, res) => {
    try {
        const { semester, campus } = req.query;
        const semSetting = await Settings.findOne({ key: 'current_semester' });
        let targetSemester = semester || semSetting?.value || 'MAY-AUG 2026';

        const meetingQuery = {};
        if (targetSemester && targetSemester !== 'All') meetingQuery.semester = targetSemester;
        if (campus && campus !== 'All') meetingQuery.campus = campus;

        let meetings = await Meeting.find(meetingQuery).sort({ date: 1 });
        
        // If target semester has no meetings yet and was not explicitly queried, check latest semester with meetings
        if (meetings.length === 0 && !semester) {
            const latestSession = await Meeting.findOne({}).sort({ date: -1 });
            if (latestSession && latestSession.semester) {
                targetSemester = latestSession.semester;
                const fallbackQuery = { semester: targetSemester };
                if (campus && campus !== 'All') fallbackQuery.campus = campus;
                meetings = await Meeting.find(fallbackQuery).sort({ date: 1 });
            }
        }

        const meetingIds = meetings.map(m => m._id);

        const attendanceQuery = { meeting: { $in: meetingIds } };
        const records = await Attendance.find(attendanceQuery);

        const memberQuery = { status: 'Active' };
        if (campus && campus !== 'All') memberQuery.campus = campus;
        if (req.query.includeInactive !== 'true') {
            memberQuery.isActiveThisSemester = true;
            memberQuery.lastConfirmedSemester = targetSemester;
        }
        const totalActiveMembers = await Member.countDocuments(memberQuery);

        const totalMeetings = meetings.length;
        const totalAttended = records.length;
        const totalPossible = totalMeetings * totalActiveMembers;
        const overallRate = totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0;

        // Breakdown per meeting
        const meetingBreakdown = meetings.map(m => {
            const count = records.filter(r => r.meeting?.toString() === m._id.toString()).length;
            const rate = totalActiveMembers > 0 ? Math.round((count / totalActiveMembers) * 100) : 0;
            return {
                meetingId: m._id,
                title: m.title || m.name,
                category: m.category,
                date: m.date,
                campus: m.campus,
                attendedCount: count,
                attendanceRate: rate
            };
        });

        res.json({
            success: true,
            semester: targetSemester,
            campus: campus || 'All',
            includeInactive: req.query.includeInactive === 'true',
            summary: {
                totalMeetings,
                totalActiveMembers,
                totalAttended,
                totalPossible,
                overallRate
            },
            meetingBreakdown
        });
    } catch (error) {
        console.error('Error in getAttendanceRollup:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Absentee Flags (Configurable consecutive threshold)
export const getAbsenteeRadar = async (req, res) => {
    try {
        const threshold = Number(req.query.consecutiveThreshold) || 3;
        const { campus } = req.query;

        const query = {
            status: 'Active',
            consecutiveAbsences: { $gte: threshold }
        };

        if (campus && campus !== 'All') query.campus = campus;

        if (req.query.includeInactive !== 'true') {
            const semSetting = await Settings.findOne({ key: 'current_semester' });
            const currentSemester = semSetting?.value?.trim() || 'SEP-DEC 2026';
            query.isActiveThisSemester = true;
            query.lastConfirmedSemester = currentSemester;
        }

        const absentees = await Member.find(query).sort({ consecutiveAbsences: -1 });

        res.json({
            success: true,
            threshold,
            count: absentees.length,
            absentees
        });
    } catch (error) {
        console.error('Error in getAbsenteeRadar:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Pre-Validation Check (Validates all rules before prompting user for question)
export const preValidateAttendance = async (req, res) => {
    try {
        const { meetingCode, deviceId, studentRegNo, userLat, userLong, accuracy, campus } = req.body;

        if (!meetingCode) {
            return res.status(400).json({ message: 'Meeting code is required' });
        }

        const rawRegNo = studentRegNo || req.body?.responses?.studentRegNo;
        if (!rawRegNo) {
            return res.status(400).json({ message: 'Admission Number is required' });
        }
        const cleanRegNo = String(rawRegNo).trim().toUpperCase();

        const rawCode = String(meetingCode).trim();
        const preferredCampus = campus || null;

        // 1. Resolve meeting / training session
        const { meeting, isTraining, resolutionType, isSemesterLink } = await resolveMeetingOrTraining(rawCode, preferredCampus);

        if (!meeting) {
            if (isSemesterLink) {
                return res.status(404).json({
                    message: 'No active meeting or training in session for this semester right now. The Semester QR code only activates during live fellowship meetings and training sessions.'
                });
            }
            if (resolutionType === 'campus_none') {
                return res.status(404).json({
                    message: `No active meeting or training found for ${rawCode} campus.`
                });
            }
            return res.status(404).json({ message: 'Meeting/Training session not found or has expired.' });
        }

        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);

        // 2. Time Window Check
        const now = getKenyanTime();
        const meetingDate = new Date(meeting.date);

        const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
        const meetingStr = `${meetingDate.getUTCFullYear()}-${String(meetingDate.getUTCMonth() + 1).padStart(2, '0')}-${String(meetingDate.getUTCDate()).padStart(2, '0')}`;

        const [startHours, startMinutes] = (meeting.startTime || '00:00').split(':').map(Number);
        const [endHours, endMinutes] = (meeting.endTime || '23:59').split(':').map(Number);
        const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        const isTimeStarted = currentMinutes >= (startTotalMinutes - 60); // 1hr grace
        const isTimeEnded = currentMinutes > (endTotalMinutes + 30); // 30min buffer
        const isToday = todayStr === meetingStr;

        if (!isSuperUser && !meeting.isTestMeeting) {
            if (!meeting.isActive) {
                return res.status(403).json({ message: isTraining ? 'This training has been closed by the admin.' : 'This meeting has been manually closed by the admin.' });
            }
            if (!isTraining) {
                if (!isToday) {
                    return res.status(403).json({ message: `This meeting is scheduled for ${meetingDate.toLocaleDateString()}. It is not open today.` });
                }
                if (!isTimeStarted) {
                    return res.status(403).json({
                        message: `This meeting starts at ${meeting.startTime} EAT. Please wait until then.`
                    });
                }
                if (isTimeEnded) {
                    return res.status(403).json({
                        message: `This meeting ended at ${meeting.endTime} EAT. Attendance is no longer being accepted.`
                    });
                }
            }
        }

        // 3. Member Registry Lookup
        let member = await Member.findOne({ studentRegNo: cleanRegNo });
        if (!member) {
            return res.status(403).json({
                message: `Access Denied: Admission Number "${cleanRegNo}" is not in the Doulos Registry. Please verify or register.`
            });
        }

        if (member.isActive === false) {
            return res.status(403).json({
                message: 'ACCESS DENIED: Your account is suspended/blocked. Please contact the administrator.'
            });
        }

        if (member.status === 'Archived' && !isSuperUser) {
            return res.status(403).json({
                message: "Access Paused: Your account is currently archived. Please contact your leader for re-activation."
            });
        }

        // 4. Geofencing Proximity Check
        if (meeting.location?.latitude && meeting.location?.longitude && !isSuperUser && !member?.isTestAccount && !isTraining) {
            if (!userLat || !userLong) {
                return res.status(400).json({ message: 'GPS data is required for this venue. Please enable location permissions.' });
            }
            const uLat = Number(userLat);
            const uLong = Number(userLong);
            const mLat = Number(meeting.location.latitude);
            const mLong = Number(meeting.location.longitude);
            const reportedAccuracy = Math.max(0, Number(accuracy) || 0);

            if (isNaN(uLat) || isNaN(uLong)) {
                return res.status(400).json({ message: 'Invalid GPS coordinates received. Please enable location.' });
            }

            const R = 6371e3;
            const φ1 = (mLat * Math.PI) / 180;
            const φ2 = (uLat * Math.PI) / 180;
            const Δφ = ((uLat - mLat) * Math.PI) / 180;
            const Δλ = ((uLong - mLong) * Math.PI) / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            const baseRadius = meeting.location.radius || 200;
            const effectiveDistance = Math.max(0, distance - reportedAccuracy);

            if (effectiveDistance > (baseRadius + 100)) {
                return res.status(403).json({
                    message: `Location Mismatch: You are too far from ${meeting.location.name}. Please ensure you are at the correct venue.`
                });
            }
        }

        // 5. Device Lock Check
        const bypassSetting = await Settings.findOne({ key: 'bypass_device_lock' });
        const isBypassed = bypassSetting?.value === 'true';

        if (!isBypassed && member.memberType !== 'Visitor') {
            if (!deviceId && !isSuperUser && !meeting.isTestMeeting && !member.isTestAccount) {
                return res.status(400).json({ message: 'Device Lock Error: Device signature is missing. Please ensure your browser supports storage and cookies.' });
            }
            if (member.linkedDeviceId && deviceId && member.linkedDeviceId !== deviceId && !isSuperUser && !meeting.isTestMeeting && !member.isTestAccount) {
                return res.status(403).json({ message: 'Device Lock Error: This account is linked to another device. Please request a device reset from a G9 administrator.' });
            }
        }

        // 6. Anti-Proxy Check
        if (!isBypassed && deviceId && !isSuperUser && !meeting.isTestMeeting && !member?.isTestAccount && member?.memberType !== 'Visitor') {
            const deviceQuery = isTraining
                ? { trainingId: meeting._id, deviceId, trainingDay: meeting.activeDay || 1, studentRegNo: { $ne: cleanRegNo } }
                : { meeting: meeting._id, deviceId, studentRegNo: { $ne: cleanRegNo } };
            const deviceUsed = await Attendance.findOne(deviceQuery);
            if (deviceUsed) {
                return res.status(403).json({ message: 'This device has already been used for a check-in for this session.' });
            }
        }

        // 7. Session Duplicate Check
        const dupQuery = isTraining
            ? { trainingId: meeting._id, studentRegNo: cleanRegNo, trainingDay: meeting.activeDay || 1 }
            : { meeting: meeting._id, studentRegNo: cleanRegNo };
        const existing = await Attendance.findOne(dupQuery);
        if (existing && !member?.isTestAccount) {
            return res.status(409).json({ message: 'You have already signed in for this session.' });
        }

        // 8. Weekly Check-In Restriction
        if (!isSuperUser && !meeting.isTestMeeting && !isTraining && !member?.isTestAccount) {
            const { startOfWeek, endOfWeek } = getWeekRange(meeting.date);
            const meetingsThisWeek = await Meeting.find({
                date: { $gte: startOfWeek, $lte: endOfWeek },
                _id: { $ne: meeting._id }
            }).select('_id name campus');

            const otherMeetingIds = meetingsThisWeek.map(m => m._id);
            if (otherMeetingIds.length > 0) {
                const attendedOther = await Attendance.findOne({
                    studentRegNo: cleanRegNo,
                    meeting: { $in: otherMeetingIds }
                }).populate('meeting');

                if (attendedOther) {
                    const campusName = attendedOther.meeting.campus === 'Valley Road' ? 'Nairobi' : attendedOther.meeting.campus;
                    return res.status(403).json({
                        message: `ACCESS DENIED: A member can only attend one meeting per week. You have already attended "${attendedOther.meeting.name}" (${campusName}) this week.`
                    });
                }
            }
        }

        // All Pre-Validation Rules Passed!
        res.json({
            valid: true,
            meeting: {
                _id: meeting._id,
                name: meeting.name,
                campus: meeting.campus,
                category: isTraining ? 'Training' : (meeting.category || 'Meeting'),
                questionOfDay: meeting.questionOfDay || '',
                questionType: meeting.questionType || 'text',
                questionOptions: meeting.questionOptions || []
            },
            hasQuestion: Boolean(meeting.questionOfDay && meeting.questionOfDay.trim() !== '')
        });

    } catch (error) {
        console.error('Error in preValidateAttendance:', error);
        res.status(500).json({ message: error.message });
    }
};

