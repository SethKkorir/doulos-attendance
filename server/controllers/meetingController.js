import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Venue from '../models/Venue.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getKenyanTime, getWeekRange } from '../utils/kenyanTime.js';
import { resolveMeetingOrTraining } from '../utils/sessionResolver.js';

export const createMeeting = async (req, res) => {
    const { name, date, campus, startTime, endTime, semester, requiredFields, location, venueId, isTestMeeting, questionOfDay, questionType, questionOptions } = req.body;

    try {
        let venueLocation = location;
        let selectedCampus = campus;

        // If venueId is provided, pull preset directly from DB
        if (venueId) {
            const venue = await Venue.findById(venueId);
            if (venue) {
                selectedCampus = venue.campus === 'Both' ? campus : venue.campus;
                venueLocation = {
                    name: venue.name,
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                    radius: venue.radius || 200
                };
            }
        }
        if (!date || !campus) {
            return res.status(400).json({ message: 'Date and Campus are required to schedule a meeting' });
        }

        // --- MANDATORY INTERACTIVE QUESTION ---
        const trimmedQuestion = (questionOfDay || '').trim();
        if (!trimmedQuestion) {
            return res.status(400).json({ message: 'Mandatory Requirement: An interactive roll-call question is required to create a meeting.' });
        }

        // If multiple choice or checkboxes, at least 2 choices required
        if (['multiple_choice', 'checkboxes'].includes(questionType)) {
            const validOptions = (questionOptions || []).filter(o => o && o.trim());
            if (validOptions.length < 2) {
                return res.status(400).json({ message: 'At least 2 choices are required for multiple choice / checkbox questions.' });
            }
        }

        // --- MANDATORY GPS DEVICE LOCATION ---
        const lat = venueLocation?.latitude;
        const lng = venueLocation?.longitude;
        if (lat === undefined || lat === null || isNaN(Number(lat)) ||
            lng === undefined || lng === null || isNaN(Number(lng)) ||
            Number(lat) === 0 || Number(lng) === 0) {
            return res.status(400).json({ message: 'Mandatory Requirement: Capturing valid device GPS coordinates (latitude & longitude) is required to create a meeting.' });
        }

        // --- ENFORCE STRICT RULE: 1 ACTIVE MEETING PER WEEK PER CAMPUS ---
        if (!isTestMeeting && !req.body.allowMultiple) {
            const { startOfWeek, endOfWeek } = getWeekRange(date);
            const existingMeeting = await Meeting.findOne({
                campus: selectedCampus,
                isArchived: { $ne: true },
                date: { $gte: startOfWeek, $lte: endOfWeek }
            });

            if (existingMeeting) {
                const existingDateStr = new Date(existingMeeting.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' });
                return res.status(400).json({
                    message: `Policy Violation: Only one active meeting per week is allowed for ${selectedCampus}. "${existingMeeting.name}" is already scheduled for ${existingDateStr} (${existingMeeting.startTime} - ${existingMeeting.endTime}).`
                });
            }
        }

        const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // Simple code
        const meeting = new Meeting({
            name,
            date,
            campus: selectedCampus,
            startTime,
            endTime,
            semester,
            code,
            requiredFields,
            location: {
                name: venueLocation?.name || (selectedCampus === 'Valley Road' ? 'DAC 506' : 'Doulos Store'),
                latitude: Number(lat),
                longitude: Number(lng),
                radius: Number(venueLocation?.radius) || 200
            },
            isTestMeeting,
            questionOfDay: trimmedQuestion,
            questionType: questionType || 'text',
            questionOptions: (questionOptions || []).filter(o => o && o.trim())
        });
        await meeting.save();
        res.status(201).json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getMeetings = async (req, res) => {
    try {
        // --- AUTO-CLOSE EXPIRED MEETINGS ---
        // Get current Kenyan time
        const now = getKenyanTime();
        const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

        // Find all meetings that are still marked active
        const activeMeetings = await Meeting.find({ isActive: true });

        for (const m of activeMeetings) {
            const meetingDate = new Date(m.date);
            const meetingStr = `${meetingDate.getUTCFullYear()}-${String(meetingDate.getUTCMonth() + 1).padStart(2, '0')}-${String(meetingDate.getUTCDate()).padStart(2, '0')}`;

            if (meetingStr > todayStr) continue; // Future meeting, skip

            const [endH, endM] = m.endTime.split(':').map(Number);
            const endTotalMinutes = endH * 60 + endM;
            const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

            // If it's a past day OR same day but past end time (+30min buffer) → close it
            const isPastDay = meetingStr < todayStr;
            const isPastEndTime = meetingStr === todayStr && currentMinutes > (endTotalMinutes + 30);

            if (isPastDay || isPastEndTime) {
                await Meeting.findByIdAndUpdate(m._id, { isActive: false });
                console.log(`[AUTO-CLOSE] Meeting "${m.name}" (${meetingStr}) has been automatically closed.`);
                
                // Trigger summary email
                try {
                    const { sendMeetingSummaryEmail } = await import('../utils/emailService.js');
                    await sendMeetingSummaryEmail(m._id, false);
                } catch (emailError) {
                    console.error('[AUTO-CLOSE] Failed to send email:', emailError);
                }
            }
        }
        // --- END AUTO-CLOSE ---

        const { includeArchived, range } = req.query;

        // 1. Fetch meetings with attendance count
        const pipeline = [];

        if (includeArchived !== 'true') {
            pipeline.push({
                $match: { isArchived: { $ne: true } }
            });
        }

        // Support range=upcoming|past filter
        if (range === 'upcoming') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            pipeline.push({
                $match: { date: { $gte: startOfToday } }
            });
        } else if (range === 'past') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            pipeline.push({
                $match: { date: { $lt: startOfToday } }
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'attendances',
                    localField: '_id',
                    foreignField: 'meeting',
                    as: 'attendance'
                }
            },
            {
                $addFields: {
                    attendanceCount: { $size: '$attendance' }
                }
            },
            { $project: { attendance: 0 } },
            { $sort: { date: -1 } }
        );

        let meetings = await Meeting.aggregate(pipeline);

        // Enrich with server-computed noticeComplianceStatus (14-day rule)
        meetings = meetings.map(m => {
            const createdTime = new Date(m.createdAt || m.date).getTime();
            const meetingTime = new Date(m.date).getTime();
            const noticeDays = Math.round((meetingTime - createdTime) / (1000 * 60 * 60 * 24));
            let noticeComplianceStatus = 'Compliant (14+ Days Notice)';
            let isCompliant = true;

            if (noticeDays < 7) {
                noticeComplianceStatus = 'Urgent Notice (<7 Days Notice)';
                isCompliant = false;
            } else if (noticeDays < 14) {
                noticeComplianceStatus = 'Notice Warning (7-13 Days Notice)';
                isCompliant = false;
            }

            return {
                ...m,
                noticeComplianceStatus,
                isNoticeCompliant: isCompliant,
                noticeDaysLeadTime: noticeDays
            };
        });

        // Sort: Active First, then Date Descending
        meetings.sort((a, b) => {
            if (a.isArchived !== b.isArchived) {
                return a.isArchived ? 1 : -1;
            }
            if (a.isActive === b.isActive) {
                return new Date(b.date) - new Date(a.date);
            }
            return a.isActive ? -1 : 1;
        });

        res.json(meetings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMeeting = async (req, res) => {
    const { id } = req.params;
    const { confirmPassword } = req.body || {};

    try {
        // If confirmPassword is provided (legacy secure modal), verify password or dev bypass '657'
        if (confirmPassword && confirmPassword !== '657') {
            const user = await User.findById(req.user?.id);
            if (user && user.password) {
                const isMatch = await bcrypt.compare(confirmPassword, user.password);
                if (!isMatch) return res.status(401).json({ message: 'Incorrect admin password. Deletion cancelled.' });
            }
        }

        const meeting = await Meeting.findById(id);
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

        // Delete all attendance records for this meeting
        await Attendance.deleteMany({ meeting: id });

        // Delete the meeting record
        await Meeting.findByIdAndDelete(id);

        res.json({ message: `Meeting "${meeting.name}" and all associated attendance records deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, date, campus, startTime, endTime, semester, category,
            location, venueId, isTestMeeting, allowMultiple,
            questionOfDay, questionType, questionOptions,
            devotion, announcements
        } = req.body;

        // Role check: G5 Training Directorate or SuperAdmin/Developer
        const userRole = (req.user?.role || '').toLowerCase();
        const username = (req.user?.username || '').toLowerCase();
        const isG5 = ['trainer', 'g5', 'g5_training', 'g5_director'].includes(userRole) ||
                     username.startsWith('trainer') ||
                     username === 'g5_director' ||
                     username === 'g5_training' ||
                     ['superadmin', 'developer', 'admin'].includes(userRole);

        if (!isG5) {
            return res.status(403).json({
                message: 'Access Denied: Only G5 Training Directorate is authorized to edit meeting details.'
            });
        }

        const meeting = await Meeting.findById(id);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        let selectedCampus = campus || meeting.campus;
        let venueLocation = location || meeting.location;

        if (venueId) {
            const venue = await Venue.findById(venueId);
            if (venue) {
                selectedCampus = venue.campus === 'Both' ? selectedCampus : venue.campus;
                venueLocation = {
                    name: venue.name,
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                    radius: venue.radius || 200
                };
            }
        }

        // Validate Question of the Day if provided
        if (questionOfDay !== undefined) {
            const trimmedQuestion = (questionOfDay || '').trim();
            if (!trimmedQuestion) {
                return res.status(400).json({
                    message: 'Mandatory Requirement: An interactive roll-call question is required.'
                });
            }
            meeting.questionOfDay = trimmedQuestion;
        }

        if (questionType) {
            meeting.questionType = questionType;
            if (['multiple_choice', 'checkboxes'].includes(questionType)) {
                const validOptions = (questionOptions || meeting.questionOptions || []).filter(o => o && o.trim());
                if (validOptions.length < 2) {
                    return res.status(400).json({
                        message: 'At least 2 choices are required for multiple choice / checkbox questions.'
                    });
                }
                meeting.questionOptions = validOptions;
            } else {
                meeting.questionOptions = [];
            }
        } else if (questionOptions) {
            meeting.questionOptions = (questionOptions || []).filter(o => o && o.trim());
        }

        // Location GPS validation
        if (location) {
            const lat = venueLocation?.latitude ?? meeting.location?.latitude;
            const lng = venueLocation?.longitude ?? meeting.location?.longitude;
            if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng)) && Number(lat) !== 0 && Number(lng) !== 0) {
                meeting.location = {
                    name: venueLocation?.name || meeting.location?.name || 'Venue',
                    latitude: Number(lat),
                    longitude: Number(lng),
                    radius: Number(venueLocation?.radius) || Number(meeting.location?.radius) || 200
                };
            } else {
                return res.status(400).json({
                    message: 'Valid GPS coordinates (latitude & longitude) are required for meeting location.'
                });
            }
        }

        // Conflict check if date or campus is changing
        const targetDate = date || meeting.date;
        const targetCampus = selectedCampus;
        const dateChanged = date && new Date(date).toISOString().split('T')[0] !== new Date(meeting.date).toISOString().split('T')[0];
        const campusChanged = campus && campus !== meeting.campus;

        if ((dateChanged || campusChanged) && !isTestMeeting && !meeting.isTestMeeting && !allowMultiple) {
            const { startOfWeek, endOfWeek } = getWeekRange(targetDate);
            const conflict = await Meeting.findOne({
                _id: { $ne: meeting._id },
                campus: targetCampus,
                isArchived: { $ne: true },
                date: { $gte: startOfWeek, $lte: endOfWeek }
            });

            if (conflict) {
                const conflictDateStr = new Date(conflict.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' });
                return res.status(400).json({
                    message: `Policy Violation: Only one active meeting per week is allowed for ${targetCampus}. "${conflict.name}" is already scheduled for ${conflictDateStr} (${conflict.startTime} - ${conflict.endTime}).`
                });
            }
        }

        if (name) meeting.name = name.trim();
        if (date) meeting.date = new Date(date);
        if (campus) meeting.campus = selectedCampus;
        if (startTime) meeting.startTime = startTime;
        if (endTime) meeting.endTime = endTime;
        if (semester) meeting.semester = semester;
        if (category) meeting.category = category;
        if (isTestMeeting !== undefined) meeting.isTestMeeting = Boolean(isTestMeeting);
        if (devotion !== undefined) meeting.devotion = devotion;
        if (announcements !== undefined) meeting.announcements = announcements;

        await meeting.save();
        res.json({ message: `Meeting "${meeting.name}" updated successfully!`, meeting });
    } catch (error) {
        console.error('Error in updateMeeting:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateMeetingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const original = await Meeting.findById(id);
        if (!original) return res.status(404).json({ message: 'Meeting not found' });

        const meeting = await Meeting.findByIdAndUpdate(id, updates, { new: true });

        // Trigger email reports if meeting transitions from active -> closed
        if (original.isActive && !meeting.isActive) {
            try {
                const { sendMeetingSummaryEmail } = await import('../utils/emailService.js');
                await sendMeetingSummaryEmail(meeting._id, false);
            } catch (emailError) {
                console.error('[MANUAL-CLOSE] Failed to send email:', emailError);
            }
        }

        res.json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setMeetingLocation = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const meeting = await Meeting.findByIdAndUpdate(
            id,
            {
                $set: {
                    'location': {
                        name: name || 'Custom Location'
                    }
                }
            },
            { new: true }
        );
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getMeetingByCode = async (req, res) => {
    try {
        const rawCode = req.params.code;
        const preferredCampus = req.query.campus || null;
        
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

        // Check if meeting is active (Bypass for SuperUser or Test Meetings)
        const now = getKenyanTime();
        const meetingDate = new Date(meeting.date);

        // Date comparison markers
        const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
        const meetingStr = `${meetingDate.getUTCFullYear()}-${String(meetingDate.getUTCMonth() + 1).padStart(2, '0')}-${String(meetingDate.getUTCDate()).padStart(2, '0')}`;

        const [startHours, startMinutes] = meeting.startTime.split(':').map(Number);
        const [endHours, endMinutes] = meeting.endTime.split(':').map(Number);
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
            // Trainings span multiple days — skip date/time window checks entirely
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

        // Fetch the previous meeting recap from the same campus (Meetings only)
        let previousRecap = null;
        if (!isTraining) {
            previousRecap = await Meeting.findOne({
                campus: meeting.campus,
                _id: { $ne: meeting._id },
                date: { $lt: meeting.date },
                $or: [{ devotion: { $ne: '' } }, { announcements: { $ne: '' } }]
            }).sort({ date: -1 }).select('name date devotion announcements');
        }

        // Check if this device has already attended
        // For trainings: scope the check to the CURRENT activeDay so Day 1 check-in doesn't block Day 2/3
        let hasAttended = false;
        if (req.query.deviceId && !isSuperUser && !meeting.isTestMeeting) {
            let query;
            if (isTraining) {
                const activeDay = meeting.activeDay || 1;
                query = { trainingId: meeting._id, deviceId: req.query.deviceId, trainingDay: activeDay };
            } else {
                query = { meeting: meeting._id, deviceId: req.query.deviceId };
            }
            const existingRecord = await Attendance.findOne(query);
            if (existingRecord) hasAttended = true;
        }

        res.json({
            ...meeting.toObject(),
            previousRecap,
            serverStartTime: Date.now(),
            hasAttended,
            isTraining,
            category: isTraining ? 'Training' : (meeting.category || 'Meeting')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const archiveMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};
        const meeting = await Meeting.findByIdAndUpdate(
            id,
            {
                $set: {
                    isArchived: true,
                    archivedAt: new Date(),
                    archiveReason: reason || 'Archived meeting session',
                    isActive: false
                }
            },
            { new: true }
        );
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
        res.json({ message: `Meeting "${meeting.name}" archived successfully (attendance records retained safely in database).`, meeting });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const unarchiveMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting.findByIdAndUpdate(
            id,
            {
                $set: {
                    isArchived: false,
                    archivedAt: null,
                    archiveReason: null
                }
            },
            { new: true }
        );
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
        res.json({ message: `Meeting "${meeting.name}" restored from archive.`, meeting });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const bulkArchiveCompletedMeetings = async (req, res) => {
    try {
        const { meetingIds, reason = 'Batch archived past completed meetings' } = req.body || {};
        let filter = { isActive: false, isArchived: { $ne: true } };

        if (Array.isArray(meetingIds) && meetingIds.length > 0) {
            filter = { _id: { $in: meetingIds } };
        }

        const now = new Date();
        const result = await Meeting.updateMany(
            filter,
            {
                $set: {
                    isArchived: true,
                    archivedAt: now,
                    archiveReason: reason,
                    isActive: false
                }
            }
        );

        res.json({
            message: `Successfully archived ${result.modifiedCount} completed meeting(s). All attendance records are fully preserved in the database.`,
            count: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

