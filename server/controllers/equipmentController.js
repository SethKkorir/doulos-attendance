import GearAsset from '../models/GearAsset.js';

export const getEquipmentReadiness = async (req, res) => {
    try {
        const { eventId, campus } = req.query;
        const query = {};
        if (campus && campus !== 'All') query.campus = campus;

        const totalAssets = await GearAsset.countDocuments(query);
        const activeAssets = await GearAsset.countDocuments({ ...query, status: 'Active Service' });
        const inspectionDue = await GearAsset.countDocuments({ ...query, status: 'Inspection Due' });
        const decommissionRequired = await GearAsset.countDocuments({ ...query, status: 'DECOMMISSION REQUIRED' });

        // Category breakdown
        const categories = await GearAsset.aggregate([
            { $match: query },
            { $group: { _id: '$category', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'Active Service'] }, 1, 0] } } } }
        ]);

        const readinessRate = totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 100;
        const status = readinessRate >= 90 ? 'GREEN (All Critical Stations Operational)' : (readinessRate >= 75 ? 'AMBER (Inspection Warning)' : 'RED (Lockout Enforced)');

        res.json({
            success: true,
            eventId: eventId || null,
            readiness: {
                totalAssets,
                activeAssets,
                inspectionDue,
                decommissionRequired,
                readinessRate,
                status,
                categories
            }
        });
    } catch (err) {
        console.error('Error fetching equipment readiness:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
