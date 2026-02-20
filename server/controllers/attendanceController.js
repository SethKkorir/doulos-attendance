import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Member from '../models/Member.js';
import ActivityLog from '../models/ActivityLog.js';
import Settings from '../models/Settings.js';
import mongoose from 'mongoose';
import { checkCampusTime } from '../utils/timeCheck.js';

export const submitAttendance = async (req, res) => {
    const { meetingCode, responses, memberType, secretCode, deviceId, serverStartTime, userLat, userLong } = req.body;

    try {
        // 1. Find the meeting
        const meeting = await Meeting.findOne({ code: { $regex: new RegExp(`^${meetingCode}$`, 'i') } });
        if (!meeting) return res.status(404).json({ message: 'Invalid Meeting Code' });

        // 2. User & Role check
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);

        // 3. Activity Check (Bypass for SuperUser or Test Meetings)
        if (!meeting.isActive && !isSuperUser && !meeting.isTestMeeting) {
            return res.status(400).json({ message: 'Meeting is closed' });
        }

        // 4. Strict Start Time Check (EAT / Nairobi Time)
        // Get current time in Kenya explicitly
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));

        const meetingDate = new Date(meeting.date);

        // Parse Start Time
        const [startHours, startMinutes] = meeting.startTime.split(':').map(Number);

        // Construct Meeting Start Time Object (Assumes meeting is on 'meetingDate')
        // We need to be careful with timezone of 'meetingDate' from DB. 
        // Best approach: Combine meetingDate string YYYY-MM-DDToLocaleString with startTime

        const meetingStart = new Date(meetingDate);
        meetingStart.setHours(startHours, startMinutes, 0, 0);

        // Adjust meetingStart to be comparable to 'now' (Nairobi Time) if server is UTC
        // But since we converted 'now' to resemble local time, we should treat meetingStart similarly.
        // If meetingDate is 2026-02-18T00:00:00Z, setHours(14) makes it T14:00:00Z.
        // If 'now' is T12:00:00 local-fake-UTC, comparison works IF DB date was recorded cleanly.

        // STRICTER APPROACH: Compare "Time of Day" if it's the same day.
        const isSameDay = now.toDateString() === meetingDate.toDateString();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startTotalMinutes = startHours * 60 + startMinutes;

        console.log(`[DEBUG] Time Check (EAT): Now=${now.toLocaleTimeString()} (${currentMinutes}m) vs Start=${meeting.startTime} (${startTotalMinutes}m)`);

        if (!isSuperUser && !meeting.isTestMeeting) {
            // 1. Future Day Block
            const todayReset = new Date(now); todayReset.setHours(0, 0, 0, 0);
            const meetingReset = new Date(meetingDate); meetingReset.setHours(0, 0, 0, 0);

            if (todayReset < meetingReset) {
                return res.status(403).json({ message: `This meeting is scheduled for ${meetingDate.toLocaleDateString()}.` });
            }

            // 2. Same Day Time Block
            if (isSameDay) {
                if (currentMinutes < startTotalMinutes) {
                    return res.status(403).json({ message: `This meeting has not yet started. Starts at ${meeting.startTime} EAT.` });
                }
            }

            // 24-Hour Lockhead (using EAT now)
            const [endH, endM] = meeting.endTime.split(':').map(Number);
            const meetingEnd = new Date(meetingDate);
            meetingEnd.setHours(endH, endM, 0, 0);
            // Since meetingEnd is based on meetingDate (UTC-ish), and now is shifted... 
            // Better to rely on day difference for safety or reimplement robust diff.
            // Keeping existing expiry logic roughly intact but using 'now' EAT.

            const hoursSinceEnd = (now - meetingEnd) / (1000 * 60 * 60);
            if (hoursSinceEnd > 48) {
                return res.status(403).json({ message: 'Attendance window closed.' });
            }
        }

        // 5. Location Check (Geofence)
        if (meeting.location?.latitude && meeting.location?.longitude && !isSuperUser && !meeting.isTestAccount) {
            if (!userLat || !userLong) {
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
                return res.status(403).json({
                    message: `Location Mismatch: You are too far from ${meeting.location.name}. Please ensure you are at the correct venue.`
                });
            }
        }

        // 6. Extract Reg No
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

        // 7. Device Handcuff Logic (Locking student to one phone)
        let member = await Member.findOne({ studentRegNo });
        if (member) {
            if (!member.linkedDeviceId && deviceId) {
                member.linkedDeviceId = deviceId;
                await member.save();
            } else if (member.linkedDeviceId && member.linkedDeviceId !== deviceId && !isSuperUser && !member.isTestAccount) {
                return res.status(403).json({
                    message: "Device Mismatch. This Admission Number is linked to a different phone. Please contact G9s if you have a new phone."
                });
            }
        }

        // 8. Anti-Proxy Check (One check-in per device per meeting)
        if (deviceId && !isSuperUser) {
            const deviceUsed = await Attendance.findOne({ meeting: meeting._id, deviceId });
            if (deviceUsed) {
                return res.status(403).json({ message: 'This device has already been used for a check-in for this meeting.' });
            }
        }

        // 9. Duplicate check (This meeting)
        const existing = await Attendance.findOne({ meeting: meeting._id, studentRegNo });
        if (existing) {
            return res.status(409).json({ message: 'You have already signed in for this meeting.' });
        }

        // 9.5. Weekly Check-In Restriction (One check-in per week across ALL campuses)
        // Exempt 'Training' category from this restriction
        if (!isSuperUser && !meeting.isTestMeeting && meeting.category !== 'Training') {
            const mDate = new Date(meeting.date);
            const startOfWeek = new Date(mDate);
            startOfWeek.setDate(mDate.getDate() - mDate.getDay()); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);

            // Find all meetings this week
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
                    return res.status(403).json({
                        message: `Thank you for attending, but you already checked in to the ${attendedOther.meeting.name} (${attendedOther.meeting.campus}) meeting this week.`
                    });
                }
            }
        }

        // 10. Member Registry Lookup
        if (!member) {
            return res.status(403).json({
                message: "Access Denied: Your Admission Number is not in the Doulos Registry. Please contact G9s to be added."
            });
        }

        // 11. Record Attendance (Skip if Test Account)
        if (!member.isTestAccount) {
            const attendance = new Attendance({
                meeting: meeting._id,
                meetingName: meeting.name,
                campus: meeting.campus,
                studentRegNo,
                memberType: member.memberType,
                responses: responses || { studentName: data.studentName, studentRegNo },
                questionOfDay: responses?.dailyQuestionAnswer || '',
                deviceId
            });
            await attendance.save();
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
        const records = await Attendance.find({ meeting: meetingId }).sort({ timestamp: -1 });
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
            return res.status(404).json({ message: "Access Denied: You must be a registered member to access the Doulos Portal. Please see an admin." });
        }

        // 1.1 Status Block
        if (member.status === 'Archived') {
            return res.status(403).json({
                message: "Access Paused: Your account is currently archived. Please contact your G9 leader for re-activation if you are joining this semester's class.",
                isArchived: true
            });
        }

        // 2. Get student's full attendance history
        const attendanceRecords = await Attendance.find({ studentRegNo }).sort({ timestamp: -1 });

        // 3. Get all meetings of the student's default campus
        const campusMeetings = await Meeting.find({ campus: member.campus }).sort({ date: -1 });

        // 4. Helper to get start of week (Sunday)
        const getWeekStart = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day;
            const start = new Date(d.setDate(diff));
            start.setHours(0, 0, 0, 0);
            return start.getTime();
        };

        // 5. Group by week
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
                attendanceTime: null
            });
        });

        // Overlay with actual attendance (which might be from a different campus/meeting)
        // We fetch meeting details for non-campus meetings if needed
        const attendedMeetingIds = attendanceRecords.map(a => a.meeting);
        const attendedMeetings = await Meeting.find({ _id: { $in: attendedMeetingIds } });

        attendanceRecords.forEach(record => {
            // We use the meeting's date for week grouping, not the check-in time, 
            // to align with the scheduled meeting week.
            const meeting = attendedMeetings.find(m => m._id.toString() === record.meeting.toString());
            if (!meeting) return;

            const weekKey = getWeekStart(meeting.date);

            // If they attended a meeting this week, it overrides the 'ABSENT' record
            // regardless of whether it's the default campus meeting or not.
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
                attendanceTime: record.timestamp
            });
        });

        // Convert Map to sorted array
        const history = Array.from(weeklyData.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Stats calculation
        const totalMeetings = campusMeetings.length; // Baseline is their campus meetings
        const physicalAttended = attendanceRecords.filter(a => !a.isExempted).length;
        const exemptedCount = attendanceRecords.filter(a => a.isExempted).length;
        const trainingAttended = attendedMeetings.filter(m => m.category === 'Training').length;
        const totalValid = physicalAttended + exemptedCount;

        // 6. Doulos Hours & Activity Check
        const activityLogs = await ActivityLog.find({ studentRegNo }).sort({ timestamp: -1 }).limit(10);

        // 7. Finance Check (Mock logic for now - check if paid for current month)
        // In a real app, you'd check a Payments collection
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        const hasPaidThisMonth = await mongoose.model('Payment').findOne({
            studentRegNo,
            month: currentMonthName,
            status: 'approved'
        });

        // 8. Reminder Logic
        const alerts = [];

        // Semester Alert
        const currentSemesterSetting = await mongoose.model('Settings').findOne({ key: 'current_semester' });
        const currentSemester = currentSemesterSetting ? currentSemesterSetting.value : 'JAN-APR 2026';

        if (member.lastActiveSemester !== currentSemester) {
            alerts.push({
                type: 'semester',
                priority: 'high',
                title: `Welcome to ${currentSemester}!`,
                message: "Please click here to enroll in the new semester and activate your tracking.",
                action: 'ENROLL'
            });
        }

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

        res.json({
            studentRegNo,
            memberName: member.name || 'Visitor',
            memberType: member.memberType || 'Visitor',
            status: member.status,
            wateringDays: member.wateringDays,
            totalPoints: member.totalPoints || 0,
            lastActiveSemester: member.lastActiveSemester,
            currentSemester,
            needsGraduationCongrats: member.needsGraduationCongrats || false,
            stats: {
                totalMeetings,
                physicalAttended,
                exemptedCount,
                trainingAttended,
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
    const { meetingId, studentRegNo, name } = req.body;
    try {
        const regNo = studentRegNo.trim().toUpperCase();

        const existing = await Attendance.findOne({ meeting: meetingId, studentRegNo: regNo });
        if (existing) return res.status(409).json({ message: 'Already checked in' });

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

        // Security: Lock manual check-in after 24 hours (Bypass for SuperAdmin)
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);
        if (!isSuperUser) {
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
            member = new Member({
                studentRegNo: regNo,
                name: name || 'Manual Entry',
                memberType: 'Visitor',
                campus: meeting.campus
            });
            await member.save();
        }

        const attendance = new Attendance({
            meeting: meetingId,
            meetingName: meeting.name,
            campus: meeting.campus,
            studentRegNo: regNo,
            memberType: member.memberType,
            responses: { studentName: member.name }
        });

        await attendance.save();

        // Award Points
        await Member.findOneAndUpdate({ studentRegNo: regNo }, { $inc: { totalPoints: 10 } });

        res.status(201).json({ message: 'Admin checked-in student successfully', record: attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteAttendance = async (req, res) => {
    const { id } = req.params;
    try {
        const attendance = await Attendance.findById(id).populate('meeting');
        if (!attendance) return res.status(404).json({ message: 'Record not found' });

        // Security: Only allow deletion if it's a test meeting OR user is developer
        const isTestMeeting = attendance.meeting?.isTestMeeting;
        const isDeveloper = ['developer', 'superadmin'].includes(req.user.role);

        if (isTestMeeting || isDeveloper) {
            await Attendance.findByIdAndDelete(id);
            res.json({ message: 'Attendance record deleted' });
        } else {
            res.status(403).json({ message: 'Only developers can delete live attendance data' });
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
