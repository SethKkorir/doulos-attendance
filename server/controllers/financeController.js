import Payment from '../models/Payment.js';
import Member from '../models/Member.js';
import Settings from '../models/Settings.js';

export const getContributionsStatus = async (req, res) => {
    try {
        const { month, year, includeInactive, isActiveThisSemester } = req.query;
        const currentMonth = month || new Date().toLocaleString('en-US', { month: 'long' });
        const currentYear = Number(year) || new Date().getFullYear();

        // 1. Fetch approved and pending payments for the month
        const payments = await Payment.find({
            month: currentMonth,
            year: currentYear
        });

        const paidRegMap = new Set();
        let totalCollected = 0;
        let approvedCount = 0;
        let pendingCount = 0;

        payments.forEach(p => {
            if (p.status === 'approved') {
                paidRegMap.add(p.studentRegNo);
                totalCollected += p.amount || 0;
                approvedCount++;
            } else if (p.status === 'pending') {
                pendingCount++;
            }
        });

        // 2. Fetch members to determine who hasn't paid (chase list)
        // Leadership decides whether inactive members owe dues — accepts includeInactive/isActiveThisSemester
        const memberQuery = { status: 'Active' };
        if (isActiveThisSemester !== undefined) {
            memberQuery.isActiveThisSemester = isActiveThisSemester === 'true';
        } else if (includeInactive !== 'true') {
            const semSetting = await Settings.findOne({ key: 'current_semester' });
            const currentSemester = semSetting?.value?.trim() || 'SEP-DEC 2026';
            memberQuery.isActiveThisSemester = true;
            memberQuery.lastConfirmedSemester = currentSemester;
        }

        const activeMembers = await Member.find(memberQuery);
        const chaseList = [];

        activeMembers.forEach(m => {
            const hasPaid = m.studentRegNo && paidRegMap.has(m.studentRegNo);
            if (!hasPaid) {
                chaseList.push({
                    _id: m._id,
                    name: m.name,
                    studentRegNo: m.studentRegNo,
                    campus: m.campus,
                    phone: m.phone,
                    douloidRank: m.douloidRank || 'None',
                    memberType: m.memberType
                });
            }
        });

        const totalActive = activeMembers.length;
        const complianceRate = totalActive > 0 ? Math.round((approvedCount / totalActive) * 100) : 0;

        res.json({
            success: true,
            month: currentMonth,
            year: currentYear,
            summary: {
                totalActive,
                approvedCount,
                pendingCount,
                unpaidCount: chaseList.length,
                complianceRate,
                totalCollected
            },
            chaseList: chaseList.slice(0, 50),
            recentPayments: payments.slice(0, 15)
        });
    } catch (err) {
        console.error('Error fetching contribution status:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
