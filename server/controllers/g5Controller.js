import Member from '../models/Member.js';
import Meeting from '../models/Meeting.js';
import Attendance from '../models/Attendance.js';
import Training from '../models/Training.js';
import Setting from '../models/Settings.js';

export const getG5Stats = async (req, res) => {
    try {
        const semSetting = await Setting.findOne({ key: 'current_semester' });
        const currentSemester = semSetting?.value || 'MAY-AUG 2026';

        // 1. Total Attendance & Attendance Percentage
        const totalAttendanceCount = await Attendance.countDocuments();
        
        // Total meetings count
        const totalMeetingsCount = await Meeting.countDocuments();
        const totalTrainingsCount = await Training.countDocuments();
        
        // Active member filter for this semester
        const activeFilter = {
            status: 'Active',
            isActiveThisSemester: true,
            lastConfirmedSemester: currentSemester
        };

        const activeMembersCount = await Member.countDocuments(activeFilter);
        const semesterMeetings = await Meeting.find({
            semester: currentSemester,
            isArchived: false
        });
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

        // 2. Recruits ready to graduate (>= 80 points or >= 8 meetings) — active this semester
        const recruitsReadyToGraduate = await Member.countDocuments({
            ...activeFilter,
            memberType: 'Recruit',
            $or: [
                { totalPoints: { $gte: 80 } },
                { douloidRank: 'None', totalPoints: { $gte: 80 } }
            ]
        });

        // 3. Promotions pending (Shadow or Basic Douloids with points or evaluation activity) — active this semester
        const promotionsPending = await Member.countDocuments({
            ...activeFilter,
            douloidRank: { $in: ['Shadow Douloid', 'Basic Douloid'] }
        });

        // 4. Upcoming trainings/camps
        const now = new Date();
        const upcomingTrainings = await Training.countDocuments({
            $or: [
                { isActive: true },
                { date: { $gte: now } }
            ]
        });

        // 4.5 Recruits in pipeline and in archive
        const totalRecruits = await Member.countDocuments({
            ...activeFilter,
            memberType: 'Recruit'
        });
        const archivedRecruitsCount = await Member.countDocuments({
            status: 'Archived',
            memberType: 'Recruit'
        });

        // 5. Absentee flags (consecutiveAbsences >= 3) — active this semester only
        const absenteeFlags = await Member.countDocuments({
            ...activeFilter,
            consecutiveAbsences: { $gte: 3 }
        });

        // 6. Active live drill check
        const activeMeeting = await Meeting.findOne({ isActive: true, isArchived: false });
        const activeTraining = await Training.findOne({ isActive: true });

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
                activeLiveSession: activeMeeting || activeTraining || null
            }
        });
    } catch (err) {
        console.error('Error in getG5Stats:', err);
        res.status(500).json({ success: false, message: 'Server error computing G5 stats', error: err.message });
    }
};
