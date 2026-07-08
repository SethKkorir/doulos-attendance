import mongoose from 'mongoose';

const financeAuditLogSchema = new mongoose.Schema({
    actor: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('FinanceAuditLog', financeAuditLogSchema);
