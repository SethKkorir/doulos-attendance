import Member from '../models/Member.js';
import SemesterRolloverSnapshot from '../models/SemesterRolloverSnapshot.js';

export const getRegisterHistory = async (req, res) => {
    try {
        const { memberId } = req.query;
        const entries = [];

        if (memberId) {
            const member = await Member.findById(memberId);
            if (member) {
                (member.rankHistory || []).forEach((rh, idx) => {
                    entries.push({
                        id: `rh-${member._id}-${idx}`,
                        date: rh.date,
                        title: `Rank Progression: ${rh.fromRank || 'Recruit'} → ${rh.toRank}`,
                        officer: rh.promotedBy || 'G5 Training Directorate',
                        notes: rh.notes || '',
                        type: 'rank_change'
                    });
                });
                if (member.archivedAt) {
                    entries.push({
                        id: `arch-${member._id}`,
                        date: member.archivedAt,
                        title: `Archived Status Applied`,
                        officer: 'Operations Officer',
                        notes: member.archiveReason || 'Moved to grace archive',
                        type: 'archive'
                    });
                }
            }
        } else {
            // Full register history from snapshots and recent member rank progressions
            const snapshots = await SemesterRolloverSnapshot.find().sort({ createdAt: -1 }).limit(10);
            snapshots.forEach(s => {
                entries.push({
                    id: `snap-${s._id}`,
                    date: s.createdAt || s.snapshotTimestamp,
                    title: `Semester Transition: ${s.fromSemester} → ${s.toSemester}`,
                    officer: s.executedBy || 'G1 Coordinator',
                    notes: `Official term change. ${s.membersCount || 0} members snapshotted.`,
                    type: 'rollover'
                });
            });

            // Promotion logs from members
            const promotedMembers = await Member.find({ 'rankHistory.0': { $exists: true } })
                .sort({ updatedAt: -1 })
                .limit(20);

            promotedMembers.forEach(m => {
                (m.rankHistory || []).slice(-2).forEach((rh, idx) => {
                    entries.push({
                        id: `promo-${m._id}-${idx}`,
                        date: rh.date,
                        title: `Cadre Promotion: ${m.name} → ${rh.toRank}`,
                        officer: rh.promotedBy || 'G5 Training Directorate',
                        notes: `${m.studentRegNo || m.campus} - ${rh.notes || 'Competency verified.'}`,
                        type: 'promotion'
                    });
                });
            });
        }

        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, count: entries.length, entries });
    } catch (err) {
        console.error('Error fetching register history:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

export const exportRegister = async (req, res) => {
    try {
        const { format } = req.query;
        const members = await Member.find().sort({ douloidRank: 1, name: 1 });

        const header = ['Name', 'Admission No', 'Campus', 'Member Type', 'Rank', 'Status', 'Phone', 'Email', 'Total Points'];
        const rows = [header];

        members.forEach(m => {
            rows.push([
                m.name || '',
                m.studentRegNo || '',
                m.campus || '',
                m.memberType || '',
                m.douloidRank || 'None',
                m.status || 'Active',
                m.phone || '',
                m.email || '',
                m.totalPoints || 0
            ]);
        });

        const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Doulos_Official_Register_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csvContent);
    } catch (err) {
        console.error('Error exporting register:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
