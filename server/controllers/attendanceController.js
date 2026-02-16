import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Member from '../models/Member.js';
import ActivityLog from '../models/ActivityLog.js';
import Settings from '../models/Settings.js';
import mongoose from 'mongoose';
import { checkCampusTime } from '../utils/timeCheck.js';

export const submitAttendance = async (req, res) => {
    const { meetingCode, responses, memberType, secretCode, deviceId, serverStartTime } = req.body;

    try {
        // 1. Find the meeting
        const meeting = await Meeting.findOne({ code: { $regex: new RegExp(`^${meetingCode}$`, 'i') } });
        if (!meeting) return res.status(404).json({ message: 'Invalid Meeting Code' });

        // 2. User & Role check
        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);

        // EXTRA SECURITY: 20-Second Freshness Timer (Proximity Timing)
        if (serverStartTime && !isSuperUser && !meeting.isTestMeeting) {
            const timeElapsed = Date.now() - serverStartTime;
            if (timeElapsed > 65000) { // 60 seconds (+5s buffer)
                return res.status(403).json({
                    message: "Scan Session Expired (60s limit). Please scan again at the physical banner. Shared QR codes are not allowed."
                });
            }
        }

        // 3. Activity Check (Bypass for SuperUser or Test Meetings)
        if (!meeting.isActive && !isSuperUser && !meeting.isTestMeeting) {
            return res.status(400).json({ message: 'Meeting is closed' });
        }

        if (!meeting.isTestMeeting && !isSuperUser) {
            // RECURRING MEETING WINDOW CHECK
            if (meeting.isRecurring) {
                const now = new Date();
                const eatFormat = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Africa/Nairobi',
                    weekday: 'long',
                    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
                });
                const parts = eatFormat.formatToParts(now);
                const currentDay = parts.find(p => p.type === 'weekday').value;
                const hh = parts.find(p => p.type === 'hour').value;
                const mm = parts.find(p => p.type === 'minute').value;
                const currentTimeVal = parseInt(hh) + parseInt(mm) / 60;

                const [startH, startM] = meeting.startTime.split(':').map(Number);
                const [endH, endM] = meeting.endTime.split(':').map(Number);
                const startVal = startH + startM / 60;
                let endVal = endH + endM / 60;
                if (endVal < startVal) endVal += 24;

                if (currentDay !== meeting.dayOfWeek) {
                    return res.status(403).json({ message: `This QR code is only active on ${meeting.dayOfWeek}s.` });
                }

                if (currentTimeVal < startVal || currentTimeVal > endVal) {
                    return res.status(403).json({ message: `Check-in for this session is only allowed between ${meeting.startTime} and ${meeting.endTime}.` });
                }
            } else {
                const timeReview = checkCampusTime(meeting);
                if (!timeReview.allowed) {
                    return res.status(403).json({ message: timeReview.message });
                }
            }

            // GEO-FENCE CHECK
            // If the meeting has a set location OR a campus preset, we must validate student's location
            let geoLat = meeting.location?.latitude;
            let geoLong = meeting.location?.longitude;
            let geoRadius = meeting.location?.radius || 200;

            // If it's a recurring meeting OR no custom coords provided, pull from SuperAdmin campus presets
            if (meeting.isRecurring || (!geoLat && meeting.campus)) {
                const settingKey = `geo_${meeting.campus.toLowerCase().replace(/ /g, '_')}`;
                const geoSetting = await Settings.findOne({ key: settingKey });
                if (geoSetting) {
                    try {
                        const coords = JSON.parse(geoSetting.value);
                        geoLat = coords.lat;
                        geoLong = coords.lng;
                        geoRadius = coords.radius || geoRadius;
                    } catch (e) {
                        console.error("Failed to parse geo setting", e);
                    }
                }
            }

            if (geoLat && geoLong) {
                const { userLat, userLong } = req.body; // Expecting coordinates from frontend

                if (!userLat || !userLong) {
                    return res.status(403).json({ message: "Location Access Denied. You must enable GPS to check in." });
                }

                // Haversine Formula for distance in meters
                const R = 6371e3; // Earth radius in meters
                const φ1 = geoLat * Math.PI / 180;
                const φ2 = userLat * Math.PI / 180;
                const Δφ = (userLat - geoLat) * Math.PI / 180;
                const Δλ = (userLong - geoLong) * Math.PI / 180;

                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                const distance = R * c; // Distance in meters

                console.log(`[GeoFence] User Distance: ${distance.toFixed(1)}m | Allowed Radius: ${geoRadius}m`);

                if (distance > geoRadius) {
                    return res.status(403).json({
                        message: `You are too far from the venue (${distance.toFixed(0)}m away). You must be strictly within ${geoRadius}m to check in.`
                    });
                }
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

        // 6. Device Handcuff Logic (Locking student to one phone)
        let member = await Member.findOne({ studentRegNo });
        if (member) {
            if (!member.linkedDeviceId && deviceId) {
                // Link the device on first use
                member.linkedDeviceId = deviceId;
                await member.save();
            } else if (member.linkedDeviceId && member.linkedDeviceId !== deviceId && !isSuperUser && !member.isTestAccount) {
                return res.status(403).json({
                    message: "Device Mismatch. This Admission Number is linked to a different phone. Please contact G9s if you have a new phone."
                });
            }
        }

        // 7. Anti-Proxy Check (One check-in per device per meeting/session)
        if (deviceId && !isSuperUser) {
            let proxyQuery = { meeting: meeting._id, deviceId };
            if (meeting.isRecurring) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                proxyQuery.timestamp = { $gte: today, $lt: tomorrow };
            }
            const deviceUsed = await Attendance.findOne(proxyQuery);
            if (deviceUsed) {
                return res.status(403).json({ message: 'This device has already been used for a check-in for this session.' });
            }
        }

        // 8. One Meeting Per Week Check
        // Calculate the week range for the current meeting
        const refDate = meeting.isRecurring ? new Date() : new Date(meeting.date);
        const dayOfWeekIdx = refDate.getDay(); // 0 (Sun) - 6 (Sat)

        // Assume week starts on Sunday
        const startOfWeek = new Date(refDate);
        startOfWeek.setDate(refDate.getDate() - dayOfWeekIdx);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Find any OTHER attendance by this student in this week range
        const weeklyAttendance = await Attendance.findOne({
            studentRegNo,
            timestamp: { $gte: startOfWeek, $lte: endOfWeek },
            meeting: { $ne: meeting._id } // Not this specific meeting
        });

        if (weeklyAttendance && !isSuperUser && !meeting.isTestMeeting) {
            return res.status(409).json({
                message: `You already checked in for ${weeklyAttendance.meetingName || 'another meeting'} this week. You can only attend one meeting per week!`
            });
        }

        // 9. Duplicate check (This meeting/session)
        let duplicateQuery = { meeting: meeting._id, studentRegNo };
        if (meeting.isRecurring) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            duplicateQuery.timestamp = { $gte: today, $lt: tomorrow };
        }
        const existing = await Attendance.findOne(duplicateQuery);
        if (existing) {
            return res.status(409).json({ message: meeting.isRecurring ? "You have already signed in for today's session." : 'You have already signed in for this meeting.' });
        }

        // 8. Member Registry Lookup
        if (!member) {
            return res.status(403).json({
                message: "Access Denied: Your Admission Number is not in the Doulos Registry. Please contact G9s to be added."
            });
        }

        // 9. Record Attendance (Skip if Test Account)
        if (!member.isTestAccount) {
            const attendance = new Attendance({
                meeting: meeting._id,
                meetingName: meeting.name,
                campus: meeting.campus,
                studentRegNo,
                memberType: member.memberType,
                responses: responses || { studentName: data.studentName, studentRegNo },
                questionOfDay: meeting.questionOfDay,
                deviceId
            });
            await attendance.save();
        }

        // 10. Award Points
        const showGraduationCongrats = member.needsGraduationCongrats;

        if (!member.isTestAccount) {
            // Only non-test accounts get points incremented
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
            responses: { studentName: member.name },
            questionOfDay: meeting.questionOfDay
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
        const record = await Attendance.findById(id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        record.isExempted = !record.isExempted;
        await record.save();

        res.json({ message: 'Exemption status updated', isExempted: record.isExempted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
