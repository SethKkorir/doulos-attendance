import mongoose from 'mongoose';

const gearAssetSchema = new mongoose.Schema({
    serialNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['Dynamic Rope', 'Static Rope', 'Harness', 'Carabiner', 'Helmet', 'Hardware/Belay Device', 'Ladders/Litter', 'First Aid Trauma Kit'],
        required: true
    },
    brand: { type: String, default: 'Petzl / Black Diamond / Beal' },
    purchaseDate: { type: Date, default: () => new Date() },
    lifespanYears: { type: Number, default: 5 }, // 5 years soft goods, 10 years metals
    loadCyclesCount: { type: Number, default: 0 },
    maxLoadCycles: { type: Number, default: 100 }, // e.g. 100 deep-fall or high ropes arrest cycles
    
    status: {
        type: String,
        enum: ['Active Service', 'Inspection Due', 'DECOMMISSION REQUIRED', 'Retired/Scrapped'],
        default: 'Active Service'
    },
    
    assignedLocation: {
        type: String,
        default: 'Freedom Base Ropes Shed'
    },
    
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road', 'Freedom Base'],
        default: 'Freedom Base'
    },
    
    inspectionLogs: [{
        inspectionDate: { type: Date, default: Date.now },
        inspector: { type: String, required: true },
        passed: { type: Boolean, default: true },
        barrelTurnsFreely: { type: Boolean, default: true }, // For carabiners
        sheathIntact: { type: Boolean, default: true }, // For ropes
        webbingIntact: { type: Boolean, default: true }, // For harnesses
        notes: { type: String, default: '' }
    }],
    
    decommissionDetails: {
        date: { type: Date, default: null },
        reason: { type: String, default: '' },
        approvedBy: { type: String, default: '' },
        requisitionRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Requisition', default: null }
    }
}, { timestamps: true });

// Virtual to determine if retirement clock has expired
gearAssetSchema.virtual('isExpiredByAge').get(function() {
    if (!this.purchaseDate) return false;
    const yearsElapsed = (Date.now() - new Date(this.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return yearsElapsed >= this.lifespanYears;
});

// Virtual to determine if load cycles exceeded
gearAssetSchema.virtual('isExpiredByCycles').get(function() {
    return this.loadCyclesCount >= this.maxLoadCycles;
});

export default mongoose.model('GearAsset', gearAssetSchema);
