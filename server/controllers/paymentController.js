import Payment from '../models/Payment.js';
import Member from '../models/Member.js';

// Helper to extract MPESA details using regex
const extractMpesaDetails = (text) => {
    const codeRegex = /\b([A-Z0-9]{10})\b/;
    const amountRegex = /Ksh\s?([\d,]+(\.\d{2})?)/i;

    const codeMatch = text.match(codeRegex);
    const amountMatch = text.match(amountRegex);

    return {
        code: codeMatch ? codeMatch[1].toUpperCase() : null,
        amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null
    };
};

// Student: Submit MPESA payment
export const submitPayment = async (req, res) => {
    const { studentRegNo, mpesaCode, amount, month, year, fullMessage } = req.body;

    try {
        const student = await Member.findOne({ studentRegNo: studentRegNo.trim().toUpperCase() });
        if (!student) return res.status(404).json({ message: 'Student not found in registry' });

        // If fullMessage is provided, we can auto-fill code/amount if they are missing
        let finalCode = mpesaCode;
        let finalAmount = amount;

        if (fullMessage) {
            const extracted = extractMpesaDetails(fullMessage);
            if (!finalCode) finalCode = extracted.code;
            if (!finalAmount) finalAmount = extracted.amount;
        }

        if (!finalCode || finalCode.length !== 10) {
            return res.status(400).json({ message: 'Invalid or missing MPESA Code (Must be 10 characters)' });
        }

        if (!finalAmount || finalAmount <= 0) {
            return res.status(400).json({ message: 'Invalid or missing Amount' });
        }

        const payment = new Payment({
            studentRegNo: student.studentRegNo,
            studentName: student.name,
            mpesaCode: finalCode.toUpperCase(),
            amount: finalAmount,
            month,
            year: year || new Date().getFullYear(),
            paymentMode: 'MPESA',
            fullMessage,
            status: 'pending'
        });

        await payment.save();
        res.status(201).json({ message: 'Payment submitted for approval', payment });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A payment for this month or with this MPESA code already exists.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Student: Get my payment history/cards
export const getMyPayments = async (req, res) => {
    const { regNo } = req.params;
    try {
        const payments = await Payment.find({ studentRegNo: regNo.trim().toUpperCase() }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get all pending approvals
export const getPendingPayments = async (req, res) => {
    try {
        const pending = await Payment.find({ status: 'pending' }).sort({ createdAt: 1 });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Verify (Approve/Reject)
export const verifyPayment = async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    try {
        const payment = await Payment.findById(id);
        if (!payment) return res.status(404).json({ message: 'Payment record not found' });

        payment.status = status;
        payment.rejectionReason = rejectionReason;
        payment.verifiedBy = req.user.id;
        payment.verifiedAt = new Date();

        await payment.save();
        res.json({ message: `Payment ${status} successfully`, payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Log direct Cash payment
export const logCashPayment = async (req, res) => {
    const { studentRegNo, amount, month, year } = req.body;

    try {
        const student = await Member.findOne({ studentRegNo: studentRegNo.trim().toUpperCase() });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const payment = new Payment({
            studentRegNo: student.studentRegNo,
            studentName: student.name,
            amount,
            month,
            year: year || new Date().getFullYear(),
            paymentMode: 'Cash',
            status: 'approved', // Auto-approved since admin logged it
            verifiedBy: req.user.id,
            verifiedAt: new Date()
        });

        await payment.save();
        res.status(201).json({ message: 'Cash payment recorded successfully', payment });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A payment for this month already exists for this student.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get all payments with filtering
export const getAllPayments = async (req, res) => {
    const { status, month, year, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (month) query.month = month;
    if (year) query.year = parseInt(year);
    if (search) {
        query.$or = [
            { studentName: { $regex: search, $options: 'i' } },
            { studentRegNo: { $regex: search, $options: 'i' } },
            { mpesaCode: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const payments = await Payment.find(query).sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get finance stats for charts
export const getFinanceStats = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // 1. Total Collection by Mode
        const modeStats = await Payment.aggregate([
            { $match: { status: 'approved', year: currentYear } },
            { $group: { _id: '$paymentMode', total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        // 2. Monthly Collection Trend
        const monthlyStats = await Payment.aggregate([
            { $match: { status: 'approved', year: currentYear } },
            { $group: { _id: '$month', total: { $sum: '$amount' } } }
        ]);

        // 3. Overall Totals
        const overall = await Payment.aggregate([
            { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        res.json({ modeStats, monthlyStats, overall });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get defaulters for a specific month
export const getDefaulters = async (req, res) => {
    const { month, year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    try {
        // 1. Get all members who SHOULD pay (Douloids and Recruits)
        const members = await Member.find({
            memberType: { $in: ['Douloid', 'Recruit'] }
        }, 'studentRegNo name campus memberType');

        // 2. Get all APPROVED payments for this month/year
        const paidStudents = await Payment.find({
            month,
            year: targetYear,
            status: 'approved'
        }, 'studentRegNo');

        const paidRegNos = new Set(paidStudents.map(p => p.studentRegNo));

        // 3. Filter members who are NOT in the paid list
        const defaulters = members.filter(m => !paidRegNos.has(m.studentRegNo));

        res.json(defaulters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Admin: Delete a payment record
export const deletePayment = async (req, res) => {
    if (!['developer', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment record not found' });
        res.json({ message: 'Payment record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
