import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Damaged', 'Lost'], default: 'Good' },
    location: { type: String, required: true },
    lastUpdatedBy: { type: String, required: true },
    notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Asset', assetSchema);
