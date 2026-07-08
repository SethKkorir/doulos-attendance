import Fund from '../models/Fund.js';
import Transaction from '../models/Transaction.js';
import Request from '../models/Request.js';
import Asset from '../models/Asset.js';
import FinanceAuditLog from '../models/FinanceAuditLog.js';
import Member from '../models/Member.js';

// 1. Seed Funds
export const seedFunds = async (req, res) => {
    const defaultFunds = [
        { name: 'Grief Support', description: 'Assistance for members during bereavement' },
        { name: 'Emergency Fund', description: 'Disaster response and emergency assistance' },
        { name: 'CSR/Donations', description: 'Community outreach and donations' },
        { name: 'Petty Cash', description: 'Day-to-day administrative operations' }
    ];

    try {
        const results = [];
        for (const f of defaultFunds) {
            const existing = await Fund.findOne({ name: f.name });
            if (!existing) {
                const created = new Fund(f);
                await created.save();
                results.push(created);
            } else {
                results.push(existing);
            }
        }
        res.json({ message: 'Funds initialized successfully', funds: results });
    } catch (error) {
        res.status(500).json({ message: 'Failed to seed funds', error: error.message });
    }
};

// 2. Get Funds
export const getFunds = async (req, res) => {
    try {
        const funds = await Fund.find({}).sort({ name: 1 });
        res.json(funds);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch funds', error: error.message });
    }
};

// 3. Transactions Ledger
export const getTransactions = async (req, res) => {
    const { status, type, fund, studentRegNo } = req.query;
    try {
        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        if (fund) query.fund = fund;

        if (studentRegNo) {
            const member = await Member.findOne({ studentRegNo: studentRegNo.trim().toUpperCase() });
            if (member) {
                query.member = member._id;
            } else {
                return res.json([]); // No member matching regNo
            }
        }

        const transactions = await Transaction.find(query)
            .populate('member', 'name studentRegNo campus memberType')
            .populate('fund', 'name')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
    }
};

export const getStudentTransactions = async (req, res) => {
    const { regNo } = req.params;
    try {
        const member = await Member.findOne({ studentRegNo: regNo.trim().toUpperCase() });
        if (!member) return res.status(404).json({ message: 'Student not found in registry' });

        const transactions = await Transaction.find({ member: member._id })
            .populate('fund', 'name')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch student transactions', error: error.message });
    }
};

// Log Transaction (Step 1: TC records transaction)
export const logTransaction = async (req, res) => {
    const { studentRegNo, fundId, amount, type, method, notes, date } = req.body;
    const recordedBy = req.user?.username || 'System';

    try {
        const fund = await Fund.findById(fundId);
        if (!fund) return res.status(404).json({ message: 'Fund not found' });

        let memberObj = null;
        if (studentRegNo) {
            memberObj = await Member.findOne({ studentRegNo: studentRegNo.trim().toUpperCase() });
            if (!memberObj) return res.status(404).json({ message: 'Member not found in registry' });
        }

        const tx = new Transaction({
            member: memberObj ? memberObj._id : null,
            fund: fund._id,
            amount: parseFloat(amount),
            type,
            method,
            status: type === 'expense' ? 'consolidated' : 'pending_verification',
            notes,
            recordedBy,
            date: date || new Date()
        });

        await tx.save();

        // If it is an expense, we immediately deduct the amount from cached balance
        if (type === 'expense') {
            fund.currentBalance -= parseFloat(amount);
            await fund.save();

            // Log action to audit trail
            const audit = new FinanceAuditLog({
                actor: recordedBy,
                action: 'LOG_EXPENSE',
                entityType: 'Transaction',
                entityId: tx._id,
                details: `Logged expense of KES ${amount} from ${fund.name} fund.`
            });
            await audit.save();
        }

        res.status(201).json({ message: 'Transaction recorded successfully', transaction: tx });
    } catch (error) {
        res.status(500).json({ message: 'Failed to record transaction', error: error.message });
    }
};

// Consolidate Transaction (Step 2: FC verifies and consolidates)
export const consolidateTransaction = async (req, res) => {
    const { id } = req.params;
    const actor = req.user?.username || 'Finance Coordinator';

    try {
        const tx = await Transaction.findById(id).populate('fund');
        if (!tx) return res.status(404).json({ message: 'Transaction not found' });

        if (tx.status === 'consolidated') {
            return res.status(400).json({ message: 'Transaction is already consolidated' });
        }

        tx.status = 'consolidated';
        await tx.save();

        // Add amount to Fund Balance
        const fund = tx.fund;
        fund.currentBalance += tx.amount;
        await fund.save();

        // Log audit trail
        const audit = new FinanceAuditLog({
            actor,
            action: 'CONSOLIDATE_CONTRIBUTION',
            entityType: 'Transaction',
            entityId: tx._id,
            details: `Consolidated contribution of KES ${tx.amount} to ${fund.name} fund.`
        });
        await audit.save();

        res.json({ message: 'Transaction consolidated and balance updated', transaction: tx });
    } catch (error) {
        res.status(500).json({ message: 'Consolidation failed', error: error.message });
    }
};

// 4. Fund Requests
export const getFundRequests = async (req, res) => {
    try {
        const requests = await Request.find({})
            .populate('fund', 'name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
};

export const submitFundRequest = async (req, res) => {
    const { fundId, amount, purpose } = req.body;
    const requestedBy = req.user?.username || req.body.requestedBy || 'Member';

    try {
        const fund = await Fund.findById(fundId);
        if (!fund) return res.status(404).json({ message: 'Fund not found' });

        const request = new Request({
            fund: fund._id,
            amount: parseFloat(amount),
            purpose,
            requestedBy
        });

        await request.save();
        res.status(201).json({ message: 'Fund request submitted successfully', request });
    } catch (error) {
        res.status(500).json({ message: 'Failed to submit request', error: error.message });
    }
};

export const resolveFundRequest = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const resolvedBy = req.user?.username || 'Finance Coordinator';

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const request = await Request.findById(id).populate('fund');
        if (!request) return res.status(404).json({ message: 'Fund request not found' });

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request is already resolved' });
        }

        request.status = status;
        request.resolvedBy = resolvedBy;
        request.resolvedAt = new Date();
        await request.save();

        if (status === 'approved') {
            // Check if fund has enough balance
            const fund = request.fund;
            if (fund.currentBalance < request.amount) {
                // We still approve it but might go to negative or warning. Standard allows it or throws error.
                // Let's allow it but log a warning, or keep it strict. Let's allow it for emergency and flexibility.
            }

            // Create matching Expense Transaction
            const tx = new Transaction({
                fund: fund._id,
                amount: request.amount,
                type: 'expense',
                method: 'cash',
                status: 'consolidated',
                date: new Date(),
                recordedBy: resolvedBy,
                linkedRequest: request._id,
                notes: `Approved Request: ${request.purpose}`
            });
            await tx.save();

            // Deduct from fund balance
            fund.currentBalance -= request.amount;
            await fund.save();

            // Audit
            const audit = new FinanceAuditLog({
                actor: resolvedBy,
                action: 'APPROVE_REQUEST',
                entityType: 'Request',
                entityId: request._id,
                details: `Approved fund request of KES ${request.amount} from ${fund.name} fund.`
            });
            await audit.save();
        } else {
            // Reject
            const audit = new FinanceAuditLog({
                actor: resolvedBy,
                action: 'REJECT_REQUEST',
                entityType: 'Request',
                entityId: request._id,
                details: `Rejected fund request of KES ${request.amount} from ${request.fund.name} fund.`
            });
            await audit.save();
        }

        res.json({ message: `Request ${status} successfully`, request });
    } catch (error) {
        res.status(500).json({ message: 'Failed to resolve request', error: error.message });
    }
};

// 5. Asset Management
export const getAssets = async (req, res) => {
    try {
        const assets = await Asset.find({}).sort({ name: 1 });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assets', error: error.message });
    }
};

export const createOrUpdateAsset = async (req, res) => {
    const { id, name, condition, location, notes } = req.body;
    const lastUpdatedBy = req.user?.username || 'Finance Coordinator';

    try {
        let asset;
        let action = 'CREATE_ASSET';

        if (id) {
            asset = await Asset.findById(id);
            if (!asset) return res.status(404).json({ message: 'Asset not found' });
            
            asset.name = name || asset.name;
            asset.condition = condition || asset.condition;
            asset.location = location || asset.location;
            asset.notes = notes !== undefined ? notes : asset.notes;
            asset.lastUpdatedBy = lastUpdatedBy;
            
            action = 'UPDATE_ASSET';
            await asset.save();
        } else {
            asset = new Asset({ name, condition, location, notes, lastUpdatedBy });
            await asset.save();
        }

        // Log audit
        const audit = new FinanceAuditLog({
            actor: lastUpdatedBy,
            action,
            entityType: 'Asset',
            entityId: asset._id,
            details: `${action === 'CREATE_ASSET' ? 'Created' : 'Updated'} asset: ${asset.name} (Location: ${asset.location}, Condition: ${asset.condition})`
        });
        await audit.save();

        res.json({ message: 'Asset saved successfully', asset });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save asset', error: error.message });
    }
};

// 6. Audit Trail
export const getAuditLogs = async (req, res) => {
    try {
        const logs = await FinanceAuditLog.find({}).sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
    }
};

// 7. General Stats
export const getFinanceStats = async (req, res) => {
    try {
        const funds = await Fund.find({});
        const totalFunds = funds.reduce((acc, curr) => acc + curr.currentBalance, 0);

        const pendingCount = await Transaction.countDocuments({ status: 'pending_verification' });
        const recentTransactions = await Transaction.find({})
            .populate('member', 'name')
            .populate('fund', 'name')
            .sort({ date: -1 })
            .limit(5);

        res.json({
            totalFunds,
            fundBalances: funds.map(f => ({ name: f.name, balance: f.currentBalance })),
            pendingCount,
            recentTransactions
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch finance stats', error: error.message });
    }
};
