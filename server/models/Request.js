import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    fund: { type: mongoose.Schema.Types.ObjectId, ref: 'Fund', required: true },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    requestedBy: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Request', requestSchema);
