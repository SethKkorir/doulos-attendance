import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true, default: 'admin' },
    position: { type: String, default: '' }, // G1, G2, G3, etc.
    campus: { type: String, default: 'Athi River' },
    token: { type: String, required: true, unique: true },
    status: { 
        type: String, 
        enum: ['INVITED', 'ACCEPTED', 'REVOKED', 'EXPIRED'], 
        default: 'INVITED' 
    },
    invitedBy: { type: String, default: 'SuperAdmin' },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null }
}, { timestamps: true });

// Auto-expire indexing
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Invitation', invitationSchema);
