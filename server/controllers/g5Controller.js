import Member from '../models/Member.js';
import Meeting from '../models/Meeting.js';
import Attendance from '../models/Attendance.js';
import Training from '../models/Training.js';
import Setting from '../models/Settings.js';
import IncidentLog from '../models/IncidentLog.js';
import CampProgram from '../models/CampProgram.js';

export const getG5Stats = async (req, res) => {
    try {
        const { campus } = req.query;
        const semSetting = await Setting.findOne({ key: 'current_semester' });
        const currentSemester = semSetting?.value || 'MAY-AUG 2026';

        // Base active filter
        const activeFilter = {
            status: 'Active',
            isActiveThisSemester: true,
            lastConfirmedSemester: currentSemester
        };

        if (campus && campus !== 'All') {
            activeFilter.campus = campus;
        }

        const activeMembersCount = await Member.countDocuments(activeFilter);

        // 1. Semester & Overall Attendance
        const totalAttendanceCount = await Attendance.countDocuments();
        const totalMeetingsCount = await Meeting.countDocuments(
            campus && campus !== 'All' ? { campus: { $in: [campus, 'Both', 'All', 'Joint'] } } : {}
        );
        const totalTrainingsCount = await Training.countDocuments(
            campus && campus !== 'All' ? { campus: { $in: [campus, 'Both', 'All', 'Joint'] } } : {}
        );

        const semesterMeetingQuery = {
            semester: currentSemester,
            isArchived: false
        };
        if (campus && campus !== 'All') {
            semesterMeetingQuery.campus = { $in: [campus, 'Both', 'All', 'Joint'] };
        }
        const semesterMeetings = await Meeting.find(semesterMeetingQuery);
        let attendancePercentage = 0;

        if (semesterMeetings.length > 0 && activeMembersCount > 0) {
            const meetingIds = semesterMeetings.map(m => m._id);
            const semAttendanceCount = await Attendance.countDocuments({ meeting: { $in: meetingIds } });
            const totalPossible = semesterMeetings.length * activeMembersCount;
            attendancePercentage = totalPossible > 0 ? Math.min(100, Math.round((semAttendanceCount / totalPossible) * 100)) : 0;
        } else if (totalMeetingsCount > 0 && activeMembersCount > 0) {
            const totalPossible = totalMeetingsCount * activeMembersCount;
            attendancePercentage = totalPossible > 0 ? Math.min(100, Math.round((totalAttendanceCount / totalPossible) * 100)) : 0;
        } else {
            attendancePercentage = 0;
        }

        // 2. Recruits Pipeline
        const recruitsReadyToGraduate = await Member.countDocuments({
            ...activeFilter,
            memberType: 'Recruit',
            $or: [
                { totalPoints: { $gte: 80 } },
                { douloidRank: 'None', totalPoints: { $gte: 80 } }
            ]
        });

        const totalRecruits = await Member.countDocuments({
            ...activeFilter,
            memberType: 'Recruit'
        });

        const archivedRecruitsQuery = { status: 'Archived', memberType: 'Recruit' };
        if (campus && campus !== 'All') archivedRecruitsQuery.campus = campus;
        const archivedRecruitsCount = await Member.countDocuments(archivedRecruitsQuery);

        // 3. Promotions Pending (Shadow & Basic Douloids ready for next rank review)
        const promotionsPending = await Member.countDocuments({
            ...activeFilter,
            douloidRank: { $in: ['Shadow Douloid', 'Basic Douloid'] }
        });

        // 4. Upcoming trainings count
        const now = new Date();
        const upcomingTrainingsQuery = {
            $or: [
                { isActive: true },
                { date: { $gte: now } }
            ]
        };
        if (campus && campus !== 'All') {
            upcomingTrainingsQuery.campus = { $in: [campus, 'Both', 'All', 'Joint'] };
        }
        const upcomingTrainings = await Training.countDocuments(upcomingTrainingsQuery);

        // 5. Absentee flags (consecutiveAbsences >= 3)
        const absenteeFlags = await Member.countDocuments({
            ...activeFilter,
            consecutiveAbsences: { $gte: 3 }
        });

        const flaggedMembers = await Member.find({
            ...activeFilter,
            consecutiveAbsences: { $gte: 3 }
        }).select('name studentRegNo campus consecutiveAbsences douloidRank memberType').limit(8).lean();

        // 6. Safety Flags (open incidents not yet reviewed & closed)
        const incidentQuery = {
            status: { $ne: 'Reviewed & Closed by G1' }
        };
        if (campus && campus !== 'All') {
            incidentQuery.campus = { $in: [campus, 'Freedom Base', 'Lukenya Trail', 'Joint'] };
        }
        const safetyFlagsCount = await IncidentLog.countDocuments(incidentQuery);
        const criticalSafetyCount = await IncidentLog.countDocuments({
            ...incidentQuery,
            severity: { $in: ['Severe / Evacuation Executed', 'Moderate (Medical Evaluation)'] }
        });

        // 7. Real Active Session (only if currently live)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        let activeLiveSession = await Meeting.findOne({
            isActive: true,
            isArchived: false,
            ...(campus && campus !== 'All' ? { campus: { $in: [campus, 'Both', 'All', 'Joint'] } } : {})
        }).lean();

        if (!activeLiveSession) {
            activeLiveSession = await Training.findOne({
                isActive: true,
                ...(campus && campus !== 'All' ? { campus: { $in: [campus, 'Both', 'All', 'Joint'] } } : {})
            }).lean();
        }

        // Next upcoming scheduled session
        let nextUpcomingSession = null;
        if (!activeLiveSession) {
            nextUpcomingSession = await Meeting.findOne({
                date: { $gte: todayStart },
                isArchived: false,
                ...(campus && campus !== 'All' ? { campus: { $in: [campus, 'Both', 'All', 'Joint'] } } : {})
            }).sort({ date: 1 }).lean();

            if (!nextUpcomingSession) {
                nextUpcomingSession = await Training.findOne({
                    date: { $gte: todayStart },
                    ...(campus && campus !== 'All' ? { campus: { $in: [campus, 'Both', 'All', 'Joint'] } } : {})
                }).sort({ date: 1 }).lean();
            }
        }

        let todayCheckedIn = 0;
        let todayExpected = activeMembersCount || 0;

        const currentSession = activeLiveSession || nextUpcomingSession;
        if (currentSession) {
            if (currentSession.roster && currentSession.roster.length > 0) {
                todayExpected = currentSession.roster.length;
            }
            if (activeLiveSession) {
                const attCount = await Attendance.countDocuments({
                    $or: [
                        { meeting: activeLiveSession._id },
                        { meetingCode: activeLiveSession.code }
                    ]
                });
                todayCheckedIn = attCount;
            }
        }

        // 8. Upcoming Camp Program
        const campQuery = { activeStatus: { $ne: 'Archived' } };
        if (campus && campus !== 'All') {
            campQuery.campus = { $in: [campus, 'Both'] };
        }
        const upcomingCamp = await CampProgram.findOne(campQuery).sort({ startDate: 1 }).lean();

        res.json({
            success: true,
            stats: {
                attendancePercentage,
                totalAttended: totalAttendanceCount,
                totalMeetingsCount,
                totalTrainingsCount,
                recruitsReadyToGraduate,
                totalRecruits,
                archivedRecruitsCount,
                promotionsPending,
                upcomingTrainings,
                absenteeFlags,
                flaggedMembers,
                safetyFlags: safetyFlagsCount,
                criticalSafetyCount,
                todayExpected: todayExpected || 0,
                todayCheckedIn,
                activeLiveSession: activeLiveSession || null,
                nextUpcomingSession: nextUpcomingSession || null,
                upcomingCamp: upcomingCamp || null
            }
        });
    } catch (err) {
        console.error('Error in getG5Stats:', err);
        res.status(500).json({ success: false, message: 'Server error computing G5 stats', error: err.message });
    }
};
