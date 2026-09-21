import Member from '../models/Member.js';
import Event from '../models/Event.js';
import Meeting from '../models/Meeting.js';
import Setting from '../models/Settings.js';

export const getG2Stats = async (req, res) => {
    try {
        const semSetting = await Setting.findOne({ key: 'current_semester' });
        const currentSemester = semSetting?.value || 'MAY-AUG 2026';

        const endDateSetting = await Setting.findOne({ key: 'semester_end_date' });
        let semesterEndDate = endDateSetting?.value || '';

        // 1. Total Active Douloids (Physically active this semester)
        const totalActiveDouloids = await Member.countDocuments({
            status: 'Active',
            isActiveThisSemester: true,
            lastConfirmedSemester: currentSemester,
            $or: [
                { memberType: 'Douloid' },
                { douloidRank: { $in: ['Shadow Douloid', 'Basic Douloid', 'Intermediate Douloid', 'Lead Douloid'] } }
            ]
        });

        // 1b. Unconfirmed Members Count (needs semester confirmation)
        const unconfirmedMembersCount = await Member.countDocuments({
            status: 'Active',
            $or: [
                { lastConfirmedSemester: { $ne: currentSemester } },
                { lastConfirmedSemester: null },
                { lastConfirmedSemester: { $exists: false } }
            ]
        });

        // 1c. Total Active This Semester (across all cadres)
        const totalActiveThisSemester = await Member.countDocuments({
            status: 'Active',
            isActiveThisSemester: true,
            lastConfirmedSemester: currentSemester
        });

        // 2. Recruits awaiting graduation (read-only pull from G5 qualification threshold)
        const recruitsAwaitingGrad = await Member.countDocuments({
            status: 'Active',
            memberType: 'Recruit',
            totalPoints: { $gte: 80 }
        });

        // 3. Total active recruits
        const totalRecruits = await Member.countDocuments({
            status: 'Active',
            $or: [
                { memberType: 'Recruit' },
                { douloidRank: 'None' },
                { douloidRank: null }
            ]
        });

        // 4. Unplaced members (no groupName / crew)
        const unplacedMembers = await Member.countDocuments({
            status: 'Active',
            $or: [
                { groupName: null },
                { groupName: '' }
            ]
        });

        // 5. Days until semester end (computed server-side)
        const now = new Date();
        let daysUntilSemesterEnd = 0;
        if (semesterEndDate) {
            const targetEnd = new Date(semesterEndDate);
            if (!isNaN(targetEnd.getTime())) {
                const diffTime = targetEnd.getTime() - now.getTime();
                daysUntilSemesterEnd = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
        }

        // Fallback: Check latest meeting or event if setting not present
        if (daysUntilSemesterEnd === 0) {
            const latestMeeting = await Meeting.findOne({ isArchived: false }).sort({ date: -1 });
            if (latestMeeting && new Date(latestMeeting.date) > now) {
                const diffTime = new Date(latestMeeting.date).getTime() - now.getTime();
                daysUntilSemesterEnd = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
        }

        // 6. Upcoming events this week
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingEventsThisWeek = await Event.countDocuments({
            date: { $gte: now, $lte: nextWeek }
        });

        // 7. Total active members
        const totalActiveMembers = await Member.countDocuments({ status: 'Active' });

        // 8. Total Alumni / Archived
        const totalAlumni = await Member.countDocuments({ status: { $in: ['Archived', 'Graduated'] } });

        res.json({
            success: true,
            stats: {
                totalActiveDouloids,
                unconfirmedMembersCount,
                totalActiveThisSemester,
                recruitsAwaitingGrad,
                totalRecruits,
                unplacedMembers,
                daysUntilSemesterEnd,
                upcomingEventsThisWeek,
                currentSemester,
                semesterEndDate,
                totalActiveMembers,
                totalAlumni
            }
        });
    } catch (err) {
        console.error('Error in getG2Stats:', err);
        res.status(500).json({ success: false, message: 'Server error computing G2 stats', error: err.message });
    }
};
