import mongoose from 'mongoose';

const handoverDossierSchema = new mongoose.Schema({
    officerName: { type: String, required: true },
    admissionNumber: { type: String, required: true },
    portfolio: {
        type: String,
        enum: ['G1 Coordinator', 'G2 Vice Coordinator', 'G3 Secretary', 'G4 Organizing Secretary', 'G5 Training & Safety', 'G6 Welfare', 'G7 Finance', 'G8 Assets', 'G9 Media'],
        required: true
    },
    tenurePeriod: { type: String, required: true, default: '2025/2026' },
    
    // 4 Compulsory Sections
    milestonesSummary: { type: String, required: true },
    assetAndFileInventory: { type: String, required: true },
    inProgressInitiatives: { type: String, required: true },
    strategicRecommendations: { type: String, required: true },
    
    // 4 Leadership Transition Paths
    transitionPath: {
        type: String,
        enum: ['Alumni / Senior Douloid', 'Retained in Role', 'Reassigned Portfolio', 'Incoming New Leader'],
        default: 'Alumni / Senior Douloid'
    },
    
    status: {
        type: String,
        enum: ['Draft', 'Submitted for Review', 'Sealed in Archives by G1'],
        default: 'Submitted for Review'
    },
    
    sealedAt: { type: Date, default: null },
    sealedBy: { type: String, default: '' },
    endorsementNotes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('HandoverDossier', handoverDossierSchema);
