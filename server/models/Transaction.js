import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    fund: { type: mongoose.Schema.Types.ObjectId, ref: 'Fund', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['contribution', 'expense'], required: true },
    method: { type: String, required: true, default: 'mpesa' },
    status: { type: String, enum: ['pending_verification', 'consolidated'], default: 'pending_verification' },
    date: { type: Date, default: Date.now },
    recordedBy: { type: String, required: true },
    linkedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', default: null },
    notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
