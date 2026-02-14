import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    studentRegNo: { type: String, required: true },
    studentName: { type: String },
    amount: { type: Number, required: true },
    month: { type: String, required: true },
    year: { type: Number, default: new Date().getFullYear() },
    paymentMode: {
        type: String,
        enum: ['MPESA', 'Cash'],
        default: 'MPESA'
    },
    mpesaCode: {
        type: String,
        uppercase: true,
        trim: true,
        sparse: true, // Allows null/missing for Cash but unique for MPESA
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    fullMessage: { type: String }, // Raw pasted message
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String }
}, { timestamps: true });

// Ensure unique payment per student per month per year (to prevent double submission)
paymentSchema.index({ studentRegNo: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema);
