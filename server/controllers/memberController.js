import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';

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
