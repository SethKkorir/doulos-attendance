import mongoose from 'mongoose';

const semesterRolloverSnapshotSchema = new mongoose.Schema({
    snapshotTimestamp: { type: Date, default: Date.now },
    fromSemester: { type: String, required: true },
    toSemester: { type: String, required: true },
    executedBy: { type: String, default: 'G1 / SuperAdmin' },
    
    // Serialized state of members, sessions, and dues before rollover
    membersCount: { type: Number, default: 0 },
    promotedRecruitsCount: { type: Number, default: 0 },
    backupPayload: { type: mongoose.Schema.Types.Mixed, required: true },
    
    isRollbackAvailable: { type: Boolean, default: true },
    isRolledBack: { type: Boolean, default: false },
    rolledBackAt: { type: Date, default: null },
    rolledBackBy: { type: String, default: '' },
    notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('SemesterRolloverSnapshot', semesterRolloverSnapshotSchema);
