import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const importMembers = async (req, res) => {
    const { members } = req.body; // Expecting array of { studentRegNo, name, memberType, campus }

    try {
        const operations = members.map(m => ({
            updateOne: {
                filter: { studentRegNo: m.studentRegNo.trim().toUpperCase() },
                update: {
                    $set: {
                        name: m.name,
                        memberType: m.memberType || 'Visitor',
                        campus: m.campus || 'Athi River'
                    }
                },
                upsert: true
            }
        }));

        await Member.bulkWrite(operations);
        res.json({ message: `Successfully processed ${members.length} members` });
    } catch (error) {
        res.status(500).json({ message: 'Error importing members', error: error.message });
    }
};

export const getMembers = async (req, res) => {
    try {
        const { search, campus, memberType } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { studentRegNo: { $regex: search, $options: 'i' } }
            ];
        }
        if (campus && campus !== 'All') query.campus = campus;
        if (memberType && memberType !== 'All') query.memberType = memberType;

        // Never show test accounts in the main registry
        query.isTestAccount = { $ne: true };

        const members = await Member.find(query).sort({ name: 1 }).lean();

        // Enrich with attendance stats
        const attendanceStats = await Attendance.aggregate([
            {
                $group: {
                    _id: "$studentRegNo",
                    totalAttended: { $sum: 1 },
                    lastSeen: { $max: "$timestamp" }
                }
            }
        ]);

        const statsMap = attendanceStats.reduce((acc, curr) => {
            acc[curr._id] = curr;
            return acc;
        }, {});

        const enrichedMembers = members.map(m => ({
            ...m,
            totalAttended: statsMap[m.studentRegNo]?.totalAttended || 0,
            lastSeen: statsMap[m.studentRegNo]?.lastSeen || null
        }));

        res.json(enrichedMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMember = async (req, res) => {
    try {
        const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createMember = async (req, res) => {
    try {
        const { studentRegNo, name, campus, memberType } = req.body;
        const exists = await Member.findOne({ studentRegNo: studentRegNo.trim().toUpperCase() });
        if (exists) return res.status(400).json({ message: 'Member with this admission number already exists' });

        const member = new Member({
            studentRegNo: studentRegNo.trim().toUpperCase(),
            name,
            campus: campus || 'Athi River',
            memberType: memberType || 'Visitor'
        });
        await member.save();
        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addPoints = async (req, res) => {
    const { points } = req.body;
    try {
        const member = await Member.findByIdAndUpdate(
            req.params.id,
            { $inc: { totalPoints: points } },
            { new: true }
        );
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const syncMembersFromAttendance = async (req, res) => {
    try {
        const uniqueAttendees = await Attendance.aggregate([
            {
                $group: {
                    _id: "$studentRegNo",
                    name: { $last: "$responses.studentName" },
                    memberType: { $last: "$memberType" },
                    campus: { $last: "$campus" }
                }
            }
        ]);

        const operations = uniqueAttendees.map(a => ({
            updateOne: {
                filter: { studentRegNo: a._id },
                update: {
                    $set: {
                        name: a.name || 'Legacy Student',
                        memberType: a.memberType || 'Visitor',
                        campus: a.campus || 'Athi River'
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Member.bulkWrite(operations);
        }

        res.json({ message: `Synced ${uniqueAttendees.length} members from attendance history.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const graduateAllRecruits = async (req, res) => {
    const { confirmPassword } = req.body;

    try {
        // Verify Password for this sensitive operation
        const user = await User.findById(req.user.id);

        // Developer bypass for convenience during dev
        const isDevBypass = req.user.role === 'developer' && confirmPassword === '657';

        if (!isDevBypass) {
            if (!user) return res.status(404).json({ message: 'Admin user not found' });
            const isMatch = await bcrypt.compare(confirmPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Incorrect admin password. Action cancelled.' });
        }

        const result = await Member.updateMany(
            { memberType: 'Recruit' },
            {
                $set: {
                    memberType: 'Douloid',
                    needsGraduationCongrats: true
                }
            }
        );

        res.json({
            message: `Successfully graduated ${result.modifiedCount} recruits to Douloids!`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setupTestAccount = async (req, res) => {
    if (req.user.role !== 'developer') return res.status(403).json({ message: 'Forbidden' });
    const { regNo = '00-0000' } = req.body;

    try {
        const member = await Member.findOneAndUpdate(
            { studentRegNo: regNo.toUpperCase().trim() },
            {
                $set: {
                    name: 'SYSTEM TESTER',
                    campus: 'Athi River',
                    isTestAccount: true,
                    memberType: 'Recruit',
                    needsGraduationCongrats: false,
                    totalPoints: 10
                }
            },
            { new: true, upsert: true }
        );
        res.json({ message: `Success: ${regNo} is now a dedicated Test Account. They won't appear in reports and their points won't increase beyond check-ins.`, member });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetAllMemberPoints = async (req, res) => {
    if (req.user.role !== 'developer') return res.status(403).json({ message: 'Forbidden' });
    try {
        const result = await Member.updateMany(
            { isTestAccount: false },
            { $set: { totalPoints: 0 } }
        );
        res.json({ message: `Points reset successful: ${result.modifiedCount} members now have 0 points.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMemberWithPassword = async (req, res) => {
    const { confirmPassword } = req.body;
    const { id } = req.params;

    try {
        const user = await User.findById(req.user.id);
        const isDevBypass = req.user.role === 'developer' && confirmPassword === '657';

        if (!isDevBypass) {
            if (!user) return res.status(404).json({ message: 'Admin user not found' });
            const isMatch = await bcrypt.compare(confirmPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Incorrect admin password. Deletion cancelled.' });
        }

        const member = await Member.findById(id);
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Delete all attendance records for this student to prevent them coming back on sync
        await Attendance.deleteMany({ studentRegNo: member.studentRegNo });

        // Delete the member record
        await Member.findByIdAndDelete(id);

        res.json({ message: `Member ${member.name} and all their attendance records deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetDeviceLock = async (req, res) => {
    try {
        await Member.findByIdAndUpdate(req.params.id, { linkedDeviceId: null });
        res.json({ message: 'Device link reset successfully. The student can now use a new phone.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
