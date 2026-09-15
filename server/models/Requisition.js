import mongoose from 'mongoose';

const requisitionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    itemType: {
        type: String,
        enum: ['Gear Replacement', 'Base Maintenance', 'Safety Hardware', 'Medical Supplies', 'Facility Upgrade'],
        default: 'Gear Replacement'
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Life-Safety Critical'],
        default: 'Medium'
    },
    estimatedCost: { type: Number, required: true, default: 0 },
    affectedGearSerial: { type: String, default: null },
    damagePhotoUrls: [{ type: String }],
    
    // 4-Tier Approval Lifecycle (US-REQ-015: G8 -> G5 -> G7 -> G1)
    status: {
        type: String,
        enum: ['Draft', 'Pending G5 Safety', 'Pending G7 Budget', 'Pending G1 Approval', 'Approved', 'Rejected', 'Decommissioned & Replaced'],
        default: 'Pending G5 Safety'
    },
    
    // Stage 1: G8 Initiation
    initiatedBy: {
        officer: { type: String, default: 'G8 Assets Steward' },
        date: { type: Date, default: Date.now },
        notes: { type: String, default: '' }
    },
    
    // Stage 2: G5 Life-Safety Verification
    safetyVerification: {
        verified: { type: Boolean, default: false },
        officer: { type: String, default: '' },
        date: { type: Date, default: null },
        mandatoryDecommission: { type: Boolean, default: false },
        fallHistoryAssessed: { type: Boolean, default: false },
        notes: { type: String, default: '' }
    },
    
    // Stage 3: G7 Budget Clearance
    budgetClearance: {
        cleared: { type: Boolean, default: false },
        officer: { type: String, default: '' },
        date: { type: Date, default: null },
        disbursementCode: { type: String, default: '' },
        sourceFund: { type: String, default: 'Gear Maintenance Reserve' },
        notes: { type: String, default: '' }
    },
    
    // Stage 4: G1/G2 Executive Approval
    executiveApproval: {
        approved: { type: Boolean, default: false },
        officer: { type: String, default: '' },
        date: { type: Date, default: null },
        rejectionReason: { type: String, default: '' },
        notes: { type: String, default: '' }
    },

    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road', 'Freedom Base', 'Both'],
        default: 'Freedom Base'
    }
}, { timestamps: true });

export default mongoose.model('Requisition', requisitionSchema);
