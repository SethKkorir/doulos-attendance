import mongoose from 'mongoose';

const incidentLogSchema = new mongoose.Schema({
    incidentDate: { type: Date, default: Date.now },
    title: { type: String, required: true },
    severity: {
        type: String,
        enum: ['Near-Miss', 'Minor (First Aid)', 'Moderate (Medical Evaluation)', 'Severe / Evacuation Executed'],
        default: 'Near-Miss'
    },
    location: {
        type: String,
        required: true,
        default: 'Freedom Base - High Ropes Hub'
    },
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road', 'Freedom Base', 'Lukenya Trail'],
        default: 'Freedom Base'
    },
    involvedParties: [{
        name: { type: String, required: true },
        roleOrRank: { type: String, default: 'Participant' },
        admissionNumber: { type: String, default: '' }
    }],
    description: { type: String, required: true },
    equipmentInvolved: { type: String, default: '' },
    rootCauseAnalysis: { type: String, required: true },
    correctiveActionPlan: { type: String, required: true },
    investigator: { type: String, default: 'G5 Training & Safety Director' },
    status: {
        type: String,
        enum: ['Under Investigation', 'Action Plan Implemented', 'Reviewed & Closed by G1'],
        default: 'Under Investigation'
    },
    closedAt: { type: Date, default: null },
    closedBy: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('IncidentLog', incidentLogSchema);
