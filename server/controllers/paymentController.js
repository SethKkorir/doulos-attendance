import Transaction from '../models/Transaction.js';
import Fund from '../models/Fund.js';
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

// Student: Submit MPESA payment (now mapping to Transaction model)
export const submitPayment = async (req, res) => {
    const { studentRegNo, mpesaCode, amount, month, year, fullMessage } = req.body;

    try {
        const student = await Member.findOne({ studentRegNo: studentRegNo.trim().toUpperCase() });
        if (!student) return res.status(404).json({ message: 'Student not found in registry' });

        // Extract code/amount
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

        // Get default fund (Petty Cash is default target for general contributions)
        let fund = await Fund.findOne({ name: 'Petty Cash' });
        if (!fund) {
            // Fallback to first available fund if Petty Cash doesn't exist
            fund = await Fund.findOne({});
        }
        if (!fund) {
            return res.status(500).json({ message: 'Finance funds are not initialized yet.' });
        }

        // Check if transaction with this MPesa code already exists in notes
        const existingTx = await Transaction.findOne({ notes: { $regex: finalCode.toUpperCase() } });
        if (existingTx) {
            return res.status(409).json({ message: 'A transaction with this MPESA code already exists.' });
        }

        const tx = new Transaction({
            member: student._id,
            fund: fund._id,
            amount: parseFloat(finalAmount),
            type: 'contribution',
            method: 'mpesa',
            status: 'pending_verification',
            notes: `MPESA Code: ${finalCode.toUpperCase()} | Month: ${month} | Year: ${year || new Date().getFullYear()} | Raw Msg: ${fullMessage || ''}`,
            recordedBy: student.name
        });

        await tx.save();
        res.status(201).json({ 
            message: 'Payment submitted for approval', 
            payment: {
                _id: tx._id,
                studentRegNo: student.studentRegNo,
                studentName: student.name,
                mpesaCode: finalCode.toUpperCase(),
                amount: finalAmount,
                month,
                year: year || new Date().getFullYear(),
                status: 'pending',
                createdAt: tx.createdAt
            } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Student: Get my payment history/cards
export const getMyPayments = async (req, res) => {
    const { regNo } = req.params;
    try {
        const student = await Member.findOne({ studentRegNo: regNo.trim().toUpperCase() });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const transactions = await Transaction.find({ member: student._id })
            .populate('fund', 'name')
            .sort({ createdAt: -1 });

        // Map transactions into old payment structure for UI compatibility
        const mappedPayments = transactions.map(tx => {
            // Parse month/year from notes if possible
            let month = 'General';
            let year = new Date(tx.createdAt).getFullYear();
            let mpesaCode = 'CASH';

            const mpesaMatch = tx.notes.match(/MPESA Code:\s*([A-Z0-9]+)/i);
            const monthMatch = tx.notes.match(/Month:\s*([a-zA-Z]+)/i);
            const yearMatch = tx.notes.match(/Year:\s*(\d+)/i);

            if (mpesaMatch) mpesaCode = mpesaMatch[1];
            if (monthMatch) month = monthMatch[1];
            if (yearMatch) year = parseInt(yearMatch[1]);

            return {
                _id: tx._id,
                studentRegNo: student.studentRegNo,
                studentName: student.name,
                mpesaCode,
                amount: tx.amount,
                month,
                year,
                paymentMode: tx.method.toUpperCase(),
                status: tx.status === 'consolidated' ? 'verified' : 'pending',
                createdAt: tx.createdAt
            };
        });

        res.json(mappedPayments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get all pending approvals
export const getPendingPayments = async (req, res) => {
    try {
        const pendingTxs = await Transaction.find({ status: 'pending_verification' })
            .populate('member')
            .sort({ createdAt: 1 });

        const mapped = pendingTxs.map(tx => {
            let month = 'General';
            let year = new Date(tx.createdAt).getFullYear();
            let mpesaCode = 'CASH';

            const mpesaMatch = tx.notes.match(/MPESA Code:\s*([A-Z0-9]+)/i);
            const monthMatch = tx.notes.match(/Month:\s*([a-zA-Z]+)/i);
            const yearMatch = tx.notes.match(/Year:\s*(\d+)/i);

            if (mpesaMatch) mpesaCode = mpesaMatch[1];
            if (monthMatch) month = monthMatch[1];
            if (yearMatch) year = parseInt(yearMatch[1]);

            return {
                _id: tx._id,
                studentRegNo: tx.member?.studentRegNo || 'UNKNOWN',
                studentName: tx.member?.name || 'Unknown Member',
                mpesaCode,
                amount: tx.amount,
                month,
                year,
                paymentMode: tx.method.toUpperCase(),
                status: 'pending',
                createdAt: tx.createdAt
            };
        });

        res.json(mapped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Verify (Approve/Reject)
export const verifyPayment = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const tx = await Transaction.findById(id).populate('fund');
        if (!tx) return res.status(404).json({ message: 'Transaction record not found' });

        if (status === 'verified') {
            tx.status = 'consolidated';
            await tx.save();

            // Update fund balance
            const fund = tx.fund;
            fund.currentBalance += tx.amount;
            await fund.save();
        } else if (status === 'rejected') {
            // Delete or mark rejected. Let's delete or update notes
            tx.notes += ' [REJECTED BY FINANCE COORDINATOR]';
            await tx.save();
        }

        res.json({ message: 'Payment verification processed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logCashPayment = async (req, res) => {
    // For backwards compatibility, but we can direct them to use /api/finance routes
    res.status(501).json({ message: 'Depreacated: Please use /api/finance/transactions/log endpoint.' });
};

export const getAllPayments = async (req, res) => {
    res.status(501).json({ message: 'Depreacated: Please use /api/finance/transactions endpoint.' });
};

export const getFinanceStats = async (req, res) => {
    res.status(501).json({ message: 'Depreacated: Please use /api/finance/stats endpoint.' });
};

export const getDefaulters = async (req, res) => {
    res.json([]);
};

export const deletePayment = async (req, res) => {
    const { id } = req.params;
    try {
        await Transaction.findByIdAndDelete(id);
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
