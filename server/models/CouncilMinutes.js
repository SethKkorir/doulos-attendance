import mongoose from 'mongoose';

const councilMinutesSchema = new mongoose.Schema({
    meetingDate: { type: Date, required: true, default: Date.now },
    meetingType: {
        type: String,
        enum: ['Executive G-Council', 'All-Council General', 'Safety Review Assembly', 'Handover & Transition Assembly'],
        default: 'Executive G-Council'
    },
    location: { type: String, default: 'Freedom Base Council Chamber' },
    presidedBy: { type: String, default: 'G1 Coordinator' },
    recordedBy: { type: String, default: 'G3 Secretary' },
    
    agenda: [{ type: String, required: true }],
    attendees: [{
        name: { type: String, required: true },
        portfolio: { type: String, default: 'G-Council Member' },
        present: { type: Boolean, default: true }
    }],
    
    resolutions: [{
        topic: { type: String, required: true },
        decision: { type: String, required: true },
        assignedOfficer: { type: String, required: true },
        deadline: { type: String, default: '' },
        status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' }
    }],
    
    isLocked: { type: Boolean, default: false }, // Immutable post-hoc once locked
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: '' },
    notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('CouncilMinutes', councilMinutesSchema);
