import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';
import Setting from '../models/Settings.js';

// 1. Get Members Table (unified for Douloids, Recruits, Alumni, All)
export const getRosterMembers = async (req, res) => {
    try {
        const { status, campus, rank, search, memberType } = req.query;
        const query = {};

        // Status filter
        if (status && status !== 'All' && status !== 'all') {
            if (status === 'alumni' || status === 'Archived') {
                query.status = { $in: ['Archived', 'Archived-Concluded', 'Graduated'] };
            } else {
                query.status = status;
            }
        }

        // Campus filter (support 'Nairobi' alias for 'Valley Road')
        if (campus && campus !== 'All' && campus !== 'all') {
            if (campus === 'Nairobi' || campus === 'Valley Road') {
                query.campus = { $in: ['Valley Road', 'Nairobi'] };
            } else {
                query.campus = campus;
            }
        }

        // Rank filter
        if (rank && rank !== 'All' && rank !== 'all') {
            query.douloidRank = rank;
        }

        // Member Type tab filter (all / douloids / recruits / alumni)
        if (memberType === 'douloids') {
            query.status = { $nin: ['Archived', 'Archived-Concluded'] };
            query.$or = [
                { memberType: 'Douloid' },
                { douloidRank: { $in: ['Shadow Douloid', 'Basic Douloid', 'Intermediate Douloid', 'Lead Douloid'] } }
            ];
        } else if (memberType === 'recruits') {
            query.status = { $nin: ['Archived', 'Archived-Concluded'] };
            query.memberType = 'Recruit';
        } else if (memberType === 'alumni') {
            query.status = { $in: ['Archived', 'Archived-Concluded', 'Graduated'] };
        } else if (memberType === 'all' || !memberType) {
            // All active members unless status explicitly filters otherwise
            if (!status || status === 'All' || status === 'all') {
                query.status = { $nin: ['Archived', 'Archived-Concluded'] };
            }
        }

        // Search filter
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: regex },
                { studentRegNo: regex },
                { phone: regex },
                { email: regex }
            ];
        }

        const members = await Member.find(query).sort({ updatedAt: -1, createdAt: -1 });

        res.json({
            success: true,
            count: members.length,
            members
        });
    } catch (err) {
        console.error('Error fetching roster members:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 2. Add Recruit (Exact 4-field intake form)
export const addRecruit = async (req, res) => {
    try {
        const { fullName, name, admissionNumber, studentRegNo, regNo, campus, phone } = req.body;
        const recruitName = (fullName || name || '').trim();

        if (!recruitName) {
            return res.status(400).json({ success: false, message: 'Full name is required' });
        }

        const semSetting = await Setting.findOne({ key: 'current_semester' });
        const currentSemester = semSetting?.value || 'MAY-AUG 2026';

        // Check if member with reg number already exists
        const cleanReg = (admissionNumber || studentRegNo || regNo || '').trim().toUpperCase();
        if (cleanReg) {
            const existing = await Member.findOne({ studentRegNo: cleanReg });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: `Member with admission number ${cleanReg} already exists (${existing.name}).`
                });
            }
        }

        let cleanCampus = (campus || 'Athi River').trim();
        if (cleanCampus === 'Nairobi') cleanCampus = 'Valley Road';

        const newRecruit = new Member({
            name: recruitName,
            studentRegNo: cleanReg,
            campus: cleanCampus,
            phone: (phone || '').trim(),
            memberType: 'Recruit',
            status: 'Active',
            douloidRank: 'None',
            belayStatus: 'Not Permitted',
            soloStationAllowed: false,
            totalPoints: 10, // Enrolment orientation bonus
            lastActiveSemester: currentSemester,
            isActive: true
        });

        await newRecruit.save();

        res.status(201).json({
            success: true,
            message: `Recruit ${newRecruit.name} enrolled successfully!`,
            member: newRecruit
        });
    } catch (err) {
        console.error('Error adding recruit:', err);
        res.status(500).json({ success: false, message: 'Server error adding recruit', error: err.message });
    }
};

// 3. Edit Member Profile
export const editMember = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = ['name', 'campus', 'phone', 'email', 'status', 'groupName', 'studentRegNo', 'douloidRank', 'memberType', 'belayStatus', 'totalPoints'];
        const sanitizedUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) sanitizedUpdates[key] = updates[key];
        }

        // Support aliases for studentRegNo
        const targetReg = updates.studentRegNo !== undefined ? updates.studentRegNo : (updates.admissionNumber !== undefined ? updates.admissionNumber : updates.regNo);
        if (targetReg !== undefined) {
            const cleanReg = targetReg ? targetReg.trim().toUpperCase() : '';
            if (cleanReg) {
                const existing = await Member.findOne({ studentRegNo: cleanReg, _id: { $ne: id } });
                if (existing) {
                    return res.status(400).json({
                        success: false,
                        message: `Admission number ${cleanReg} is already used by ${existing.name}.`
                    });
                }
            }
            // Cascade regNo change to attendance
            const oldMember = await Member.findById(id);
            if (oldMember && oldMember.studentRegNo && oldMember.studentRegNo !== cleanReg) {
                await Attendance.updateMany(
                    { studentRegNo: oldMember.studentRegNo },
                    { $set: { studentRegNo: cleanReg } }
                );
            }
            sanitizedUpdates.studentRegNo = cleanReg;
        }

        if (sanitizedUpdates.campus && sanitizedUpdates.campus === 'Nairobi') {
            sanitizedUpdates.campus = 'Valley Road';
        }

        const updated = await Member.findByIdAndUpdate(
            id,
            { $set: sanitizedUpdates },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({
            success: true,
            message: `Member ${updated.name} updated successfully`,
            member: updated
        });
    } catch (err) {
        console.error('Error editing member:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 3.5 Delete Member Permanently
export const deleteMember = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await Member.findById(id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Delete attendance history
        await Attendance.deleteMany({ studentRegNo: member.studentRegNo });
        await Member.findByIdAndDelete(id);

        res.json({
            success: true,
            message: `Member ${member.name} (${member.studentRegNo}) was permanently deleted from the database.`
        });
    } catch (err) {
        console.error('Error deleting member:', err);
        res.status(500).json({ success: false, message: 'Server error deleting member', error: err.message });
    }
};

// 4. Archive Member (Soft Archive with 20-Day Grace)
export const archiveMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { archiveReason, archiveDays } = req.body;

        const days = Number(archiveDays) || 20;
        const archivedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const member = await Member.findByIdAndUpdate(
            id,
            {
                $set: {
                    status: 'Archived',
                    archivedAt: new Date(),
                    archivedUntil,
                    archiveDays: days,
                    archiveReason: archiveReason || 'Archived by G2 Operations'
                }
            },
            { new: true }
        );

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({
            success: true,
            message: `Member ${member.name} safely moved to archives with ${days}-day recovery grace.`,
            member
        });
    } catch (err) {
        console.error('Error archiving member:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 5. Member Portal View (Exact shape Student Portal renders)
export const getMemberPortalView = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await Member.findById(id);

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Fetch attendance records for this student
        const attendanceRecords = await Attendance.find({
            studentRegNo: member.studentRegNo
        }).sort({ timestamp: -1 }).limit(20);

        res.json({
            success: true,
            portalView: {
                profile: {
                    id: member._id,
                    name: member.name,
                    studentRegNo: member.studentRegNo,
                    campus: member.campus,
                    phone: member.phone,
                    email: member.email,
                    memberType: member.memberType,
                    status: member.status,
                    douloidRank: member.douloidRank || 'None',
                    belayStatus: member.belayStatus || 'Not Permitted',
                    soloStationAllowed: member.soloStationAllowed || false,
                    totalPoints: member.totalPoints || 0
                },
                rankDetails: {
                    rank: member.douloidRank || 'None',
                    belayClearance: member.belayStatus || 'Not Permitted',
                    soloPermitted: member.soloStationAllowed || false,
                    evaluations: member.evaluations || [],
                    rankHistory: member.rankHistory || []
                },
                attendanceHistory: attendanceRecords,
                totalAttendanceCount: attendanceRecords.length
            }
        });
    } catch (err) {
        console.error('Error getting portal view:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
