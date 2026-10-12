import mongoose from 'mongoose';

const systemAuditLogSchema = new mongoose.Schema({
    actor: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, default: '' },
    details: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    result: { type: String, enum: ['SUCCESS', 'FAILURE', 'WARNING'], default: 'SUCCESS' },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

systemAuditLogSchema.index({ timestamp: -1 });
systemAuditLogSchema.index({ actor: 1, action: 1 });

export default mongoose.model('SystemAuditLog', systemAuditLogSchema);
