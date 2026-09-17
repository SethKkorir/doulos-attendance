import Setting from '../models/Settings.js';
import ActivityLog from '../models/ActivityLog.js';

export const getDelegationStatus = async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: 'g2_acting_status' });
        let status = { active: false, officer: 'G2 Operations', since: '', reason: '' };

        if (setting?.value) {
            try {
                status = JSON.parse(setting.value);
            } catch (e) {}
        }

        res.json({ success: true, status });
    } catch (err) {
        console.error('Error getting delegation status:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

export const activateDelegation = async (req, res) => {
    try {
        const { reason, officer } = req.body;
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const statusPayload = {
            active: true,
            since: dateStr,
            officer: officer || req.user?.username || 'G2 Assistant Student Coordinator',
            reason: reason || 'Documented Delegation / Field Leave'
        };

        await Setting.findOneAndUpdate(
            { key: 'g2_acting_status' },
            { value: JSON.stringify(statusPayload) },
            { upsert: true }
        );

        // Record official audit log
        await ActivityLog.create({
            action: 'DELEGATION_ACTIVATED',
            details: `G2 (${statusPayload.officer}) activated Acting as G1 elevation. Reason: ${statusPayload.reason}`,
            performedBy: statusPayload.officer,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Acting as G1 mode activated and logged in official Council audit ledger.',
            status: statusPayload
        });
    } catch (err) {
        console.error('Error activating delegation:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

export const deactivateDelegation = async (req, res) => {
    try {
        const officer = req.user?.username || 'G2 Operations';
        const statusPayload = { active: false, officer, since: '', reason: '' };

        await Setting.findOneAndUpdate(
            { key: 'g2_acting_status' },
            { value: JSON.stringify(statusPayload) },
            { upsert: true }
        );

        await ActivityLog.create({
            action: 'DELEGATION_DEACTIVATED',
            details: `G2 exited Acting as G1 elevation. Normal operations restored.`,
            performedBy: officer,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Exited Acting as G1 mode. Normal G2 operations restored.',
            status: statusPayload
        });
    } catch (err) {
        console.error('Error deactivating delegation:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
