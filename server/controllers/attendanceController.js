import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Member from '../models/Member.js';
import ActivityLog from '../models/ActivityLog.js';
import Settings from '../models/Settings.js';
import mongoose from 'mongoose';
import { checkCampusTime } from '../utils/timeCheck.js';
import { getKenyanTime, getKenyanDate } from '../utils/kenyanTime.js';

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
    const { meetingCode, responses, memberType, secretCode, deviceId, serverStartTime, userLat, userLong } = req.body;

    try {
        let meeting;
        let isTrainingModel = false;
        let isTrainingSession = false;

        if (meetingCode.toLowerCase() === 'athi-river') {
            meeting = await Meeting.findOne({ campus: 'Athi River', isActive: true }).sort({ date: -1 });
            if (!meeting) {
                meeting = await Training.findOne({ campus: { $in: ['Athi River', 'Both'] }, isActive: true }).sort({ date: -1 });
                if (meeting) {
                    isTrainingModel = true;
                    isTrainingSession = true;
                }
            }
            if (!meeting) {
                await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Invalid Code', `Attempted check-in to Athi River but no active session found`, 'Athi River');
                return res.status(404).json({ message: 'No active meeting or training found for Athi River campus.' });
            }
        } else {
            // Find in Meeting collection first, then Training collection
            meeting = await Meeting.findOne({ code: { $regex: new RegExp(`^${meetingCode}$`, 'i') } });

            if (!meeting) {
                // Check Training collection
                const training = await Training.findOne({ code: { $regex: new RegExp(`^${meetingCode}$`, 'i') } });
                if (!training) {
                    await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Invalid Code', `Attempted check-in with invalid meeting code: ${meetingCode}`, 'Athi River');
                    return res.status(404).json({ message: 'Invalid Meeting/Training Code' });
                }
                // Wrap training as a meeting-like object so downstream logic works
                meeting = training;
                isTrainingModel = true;
                isTrainingSession = true;
            }
        }

        if (meeting && meeting.category === 'Training') {
            isTrainingSession = true;
        }

        // 2. User & Role check
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);

        // 3. Activity Check (Bypass for SuperUser or Test Meetings)
        if (!meeting.isActive && !isSuperUser && !meeting.isTestMeeting) {
            await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Session Closed', `Attempted check-in to closed session: ${meeting.name}`, meeting.campus);
            return res.status(400).json({ message: 'Meeting is closed' });
        }

        // 4. Strict Start Time Check (EAT / Nairobi Time)
        const now = getKenyanTime();
        const meetingDate = new Date(meeting.date);

        // Normalize both to date strings for day comparison (YYYY-MM-DD)
        const Y = meetingDate.getFullYear();
        const M = String(meetingDate.getMonth() + 1).padStart(2, '0');
        const D = String(meetingDate.getDate()).padStart(2, '0');
        const meetingStr = `${Y}-${M}-${D}`;
        const todayStr = getKenyanDate();

        const [startHours, startMinutes] = meeting.startTime.split(':').map(Number);
        const [endHours, endMinutes] = meeting.endTime.split(':').map(Number);

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        console.log(`[DEBUG] Time Check (EAT): Today=${todayStr} Meeting=${meetingStr} Now=${now.getHours()}:${now.getMinutes()} vs Start=${meeting.startTime} End=${meeting.endTime}`);

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

        // 6. Member Registry Lookup
        let member = await Member.findOne({ studentRegNo });

        if (member && member.isActive === false) {
            await logScanError(studentRegNo, 'Account Blocked', `Attempted check-in by blocked student: ${member.name}`, meeting.campus);
            return res.status(403).json({ message: 'ACCESS DENIED: Your account is suspended/blocked. Please contact the administrator.' });
        }

        // 7. Location Check (Geofence)
        if (meeting.location?.latitude && meeting.location?.longitude && !isSuperUser && !member?.isTestAccount && !isTrainingSession) {
            if (!userLat || !userLong) {
                await logScanError(req.body.studentRegNo || 'UNKNOWN', 'GPS Required', `Location disabled for geofenced meeting: ${meeting.name}`, meeting.campus);
                return res.status(400).json({ message: 'GPS data is required for this meeting. Please enable location.' });
            }

            const R = 6371e3; // meters
            const φ1 = (meeting.location.latitude * Math.PI) / 180;
            const φ2 = (userLat * Math.PI) / 180;
            const Δφ = ((userLat - meeting.location.latitude) * Math.PI) / 180;
            const Δλ = ((userLong - meeting.location.longitude) * Math.PI) / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance > (meeting.location.radius || 200)) {
                await logScanError(req.body.studentRegNo || 'UNKNOWN', 'Geofence Violation', `Outside range for ${meeting.location.name} (${Math.round(distance)}m). Required: <${meeting.location.radius || 200}m`, meeting.campus);
                return res.status(403).json({
                    message: `Location Mismatch: You are too far from ${meeting.location.name}. Please ensure you are at the correct venue.`
                });
            }
        }

        // 8. Device Handcuff Logic (Locking student to one phone)
        if (member) {
            const bypassSetting = await Settings.findOne({ key: 'bypass_device_lock' });
            const isBypassed = bypassSetting?.value === 'true';

            if (!isBypassed) {
                if (!member.linkedDeviceId && deviceId) {
                    member.linkedDeviceId = deviceId;
                    await member.save();
                } else if (member.linkedDeviceId && deviceId && member.linkedDeviceId !== deviceId && !isSuperUser && !meeting.isTestMeeting && !member.isTestAccount) {
                    await logScanError(studentRegNo, 'Device Signature Mismatch', `Attempted check-in on a second phone without resetting device link lock. Device ID: ${deviceId}`, meeting.campus);
                    return res.status(403).json({ message: 'Device Lock Error: This account is linked to another device. Please request a device reset from a G9 administrator.' });
                }
            }
        }


        // 8. Anti-Proxy Check (One check-in per device per session)
        if (deviceId && !isSuperUser && !meeting.isTestMeeting && !member?.isTestAccount) {
            const deviceQuery = isTrainingModel
                ? { trainingId: meeting._id, deviceId, trainingDay: meeting.activeDay || 1 }
                : { meeting: meeting._id, deviceId };
            const deviceUsed = await Attendance.findOne(deviceQuery);
            if (deviceUsed) {
                await logScanError(studentRegNo, 'Anti-Proxy Block', `Device already used to scan another attendee in this session (${meeting.name})`, meeting.campus);
                return res.status(403).json({ message: 'This device has already been used for a check-in for this session.' });
            }
        }

        // 9. Duplicate check (This session)
        const dupQuery = isTrainingModel
            ? { trainingId: meeting._id, studentRegNo, trainingDay: meeting.activeDay || 1 }
            : { meeting: meeting._id, studentRegNo };
        const existing = await Attendance.findOne(dupQuery);
        if (existing && !member?.isTestAccount) {
            await logScanError(studentRegNo, 'Duplicate Check-In', `Attempted duplicate scan for session: ${meeting.name}`, meeting.campus);
            return res.status(409).json({ message: 'You have already signed in for this session.' });
        }

        // 9.5. Weekly Check-In Restriction — MEETINGS ONLY (Trainings are exempt)
        if (!isSuperUser && !meeting.isTestMeeting && !isTrainingSession && !member?.isTestAccount) {
            const mDate = new Date(meeting.date);
            const startOfWeek = new Date(mDate);
            startOfWeek.setDate(mDate.getDate() - mDate.getDay()); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);

            // Find all meetings this week globally (all campuses)
            const meetingsThisWeek = await Meeting.find({
                date: { $gte: startOfWeek, $lte: endOfWeek },
                _id: { $ne: meeting._id } // Exclude current meeting
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
                        message: `ACCESS DENIED: You have already attended ${campusName} this week.`
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
        const studentRegNo = regNo.trim().toUpperCase();

        // 1. Get member details from Registry
        const member = await Member.findOne({ studentRegNo });

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

        // 2. Fetch the active semester setting
        const currentSemesterSetting = await mongoose.model('Settings').findOne({ key: 'current_semester' });
        const currentSemester = currentSemesterSetting ? currentSemesterSetting.value : 'MAY-AUG 2026';

        // 3. Find IDs of all meetings and trainings within the current semester
        const semMeetings = await Meeting.find({ semester: currentSemester }, '_id');
        const semMeetingIds = semMeetings.map(m => m._id);
        const semTrainings = await Training.find({ semester: currentSemester, campus: { $in: [member.campus, 'Both'] } });
        const semTrainingIds = semTrainings.map(t => t._id);

        // 4. Query student's attendance records matching only this semester's sessions
        const attendanceRecords = await Attendance.find({
            studentRegNo,
            $or: [
                { meeting: { $in: semMeetingIds } },
                { trainingId: { $in: semTrainingIds } }
            ]
        }).sort({ timestamp: -1 });

        // 5. Get all meetings of the student's default campus for the current semester
        const campusMeetings = await Meeting.find({ campus: member.campus, semester: currentSemester }).sort({ date: -1 });

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

        // Overlay with actual attendance
        const attendedMeetingIds = attendanceRecords.filter(a => a.meeting).map(a => a.meeting);
        const attendedMeetings = await Meeting.find({ _id: { $in: attendedMeetingIds } });

        attendanceRecords.forEach(record => {
            if (record.trainingId) {
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

            const weekKey = getWeekStart(meeting.date);
            weeklyData.set(weekKey, {
                _id: meeting._id,
                name: meeting.name,
                date: meeting.date,
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

        // Stats calculation (separate meetings from trainings)
        const meetingRecords = attendanceRecords.filter(a => {
            if (a.meeting) {
                const meeting = attendedMeetings.find(m => m._id.toString() === a.meeting.toString());
                return meeting && meeting.category !== 'Training';
            }
            return false;
        });

        const trainingRecords = attendanceRecords.filter(a => {
            if (a.trainingId) return true;
            if (a.meeting) {
                const meeting = attendedMeetings.find(m => m._id.toString() === a.meeting.toString());
                return meeting && meeting.category === 'Training';
            }
            return false;
        });

        const totalMeetings = campusMeetings.length;
        const physicalAttended = meetingRecords.filter(a => !a.isExempted).length;
        const exemptedCount = meetingRecords.filter(a => a.isExempted).length;
        const totalTrainingAttended = trainingRecords.length;
        const totalValid = physicalAttended + exemptedCount;

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

        res.json({
            studentRegNo,
            memberName: member.name || 'Visitor',
            memberType: member.memberType || 'Visitor',
            status: member.status,
            wateringDays: member.wateringDays,
            groupName: member.groupName || null,
            groupMembers,
            wateringSelectorActive,
            totalPoints: member.totalPoints || 0,
            lastActiveSemester: member.lastActiveSemester,
            currentSemester,
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
                percentage: totalMeetings > 0 ? Math.round((totalValid / totalMeetings) * 100) : 0
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
    const { meetingId, studentRegNo, name, trainingDay } = req.body;
    try {
        const regNo = studentRegNo.trim().toUpperCase();

        let meeting = await Meeting.findById(meetingId);
        let isTraining = false;

        if (!meeting) {
            meeting = await Training.findById(meetingId);
            if (!meeting) return res.status(404).json({ message: 'Meeting/Training not found' });
            isTraining = true;
        }

        const targetDay = isTraining ? (Number(trainingDay) || meeting.activeDay || 1) : undefined;

        const dupQuery = isTraining
            ? { trainingId: meetingId, studentRegNo: regNo, trainingDay: targetDay }
            : { meeting: meetingId, studentRegNo: regNo };

        const existing = await Attendance.findOne(dupQuery);
        if (existing) return res.status(409).json({ message: 'Already checked in' });

        // Security: Lock manual check-in after 24-48 hours (Bypass for SuperAdmin)
        // Exempt training from strict lock for flexibility
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);
        if (!isSuperUser && !isTraining) {
            const now = new Date();
            const meetingDate = new Date(meeting.date);
            const [endH, endM] = meeting.endTime.split(':').map(Number);
            const meetingEnd = new Date(meetingDate);
            meetingEnd.setHours(endH, endM, 0, 0);
            const hoursSinceEnd = (now - meetingEnd) / (1000 * 60 * 60);

            if (hoursSinceEnd > 48) {
                return res.status(403).json({ message: 'Manual check-in locked. 48 hours have passed since this meeting ended.' });
            }
        }

        // Lookup member Registry
        let member = await Member.findOne({ studentRegNo: regNo });
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
            console.log(`[ADMIN-AUTO-REGISTER] New student created: ${regNo} (${member.name})`);
        }

        const attendance = new Attendance({
            meeting: isTraining ? undefined : meetingId,
            trainingId: isTraining ? meetingId : undefined,
            meetingName: meeting.name,
            campus: meeting.campus,
            studentRegNo: regNo,
            memberType: member.memberType,
            responses: { studentName: member.name },
            trainingDay: isTraining ? targetDay : undefined
        });

        await attendance.save();

        // Award Points and reset device lock on manual override
        await Member.findOneAndUpdate({ studentRegNo: regNo }, { 
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
    const { meetingId, members, trainingDay } = req.body;
    try {
        if (!meetingId || !Array.isArray(members) || members.length === 0) {
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
            meetingEnd.setHours(endH, endM, 0, 0);
            const hoursSinceEnd = (now - meetingEnd) / (1000 * 60 * 60);

            if (hoursSinceEnd > 48) {
                return res.status(403).json({ message: 'Manual check-in locked. 48 hours have passed since this meeting ended.' });
            }
        }

        const records = [];
        const skipped = [];

        for (const m of members) {
            if (!m.studentRegNo) continue;
            const regNo = String(m.studentRegNo).trim().toUpperCase();

            const dupQuery = isTraining
                ? { trainingId: meetingId, studentRegNo: regNo, trainingDay: targetDay }
                : { meeting: meetingId, studentRegNo: regNo };

            const existing = await Attendance.findOne(dupQuery);
            if (existing) {
                skipped.push(regNo);
                continue;
            }

            let dbMember = await Member.findOne({ studentRegNo: regNo });
            if (!dbMember) {
                dbMember = new Member({
                    studentRegNo: regNo,
                    name: m.name || 'Manual Bulk Entry',
                    memberType: m.memberType || 'Visitor',
                    campus: m.campus || meeting.campus,
                    status: 'Active'
                });
                await dbMember.save();
            }

            const attendance = new Attendance({
                meeting: isTraining ? undefined : meetingId,
                trainingId: isTraining ? meetingId : undefined,
                meetingName: meeting.name,
                campus: meeting.campus,
                studentRegNo: regNo,
                memberType: dbMember.memberType,
                responses: { studentName: dbMember.name },
                trainingDay: isTraining ? targetDay : undefined
            });

            await attendance.save();

            await Member.findOneAndUpdate({ studentRegNo: regNo }, { 
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

        // Security: Only allow deletion if it's a test meeting OR user is developer/superadmin
        const isTestMeeting = attendance.meeting?.isTestMeeting;
        const isDeveloper = req.user && ['developer', 'superadmin'].includes(req.user.role);

        if (isTestMeeting || isDeveloper) {
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
            res.status(403).json({ message: 'Only developers and superadmins can delete live attendance data' });
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
