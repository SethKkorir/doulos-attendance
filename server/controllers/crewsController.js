import Crew from '../models/Crew.js';
import Member from '../models/Member.js';

export const getCrews = async (req, res) => {
    try {
        const { campus } = req.query;
        const query = {};
        if (campus && campus !== 'All') query.campus = campus;

        const crews = await Crew.find(query).populate('members leader');

        // Server-computed balance indicator (rank distribution per crew)
        const enriched = crews.map(crew => {
            const members = crew.members || [];
            const rankCounts = {
                'Lead Douloid': 0,
                'Intermediate Douloid': 0,
                'Basic Douloid': 0,
                'Shadow Douloid': 0,
                'Recruit': 0
            };

            members.forEach(m => {
                const r = m.douloidRank || (m.memberType === 'Recruit' ? 'Recruit' : 'Basic Douloid');
                if (rankCounts[r] !== undefined) rankCounts[r]++;
                else rankCounts['Basic Douloid']++;
            });

            // Balance score: has at least 1 certified lead/intermediate and balanced recruit ratio
            const certifiedCount = rankCounts['Lead Douloid'] + rankCounts['Intermediate Douloid'];
            const balanceScore = certifiedCount >= 1 && members.length >= 4 ? 'Optimal' : (certifiedCount >= 1 ? 'Acceptable' : 'Needs Cadre');

            return {
                ...crew.toObject(),
                memberCount: members.length,
                rankCounts,
                balanceScore,
                certifiedCount
            };
        });

        res.json({ success: true, count: enriched.length, crews: enriched });
    } catch (err) {
        console.error('Error fetching crews:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

export const assignCrew = async (req, res) => {
    try {
        const { memberId, crewId, groupName } = req.body;

        if (!memberId) {
            return res.status(400).json({ success: false, message: 'memberId is required' });
        }

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        if (crewId) {
            const crew = await Crew.findById(crewId);
            if (crew) {
                if (!crew.members.includes(memberId)) {
                    crew.members.push(memberId);
                    await crew.save();
                }
                member.groupName = crew.name;
            }
        } else if (groupName) {
            member.groupName = groupName;
        }

        await member.save();

        res.json({
            success: true,
            message: `Assigned ${member.name} to ${member.groupName}`,
            member
        });
    } catch (err) {
        console.error('Error assigning crew:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
