import mongoose from 'mongoose';

const lopDocSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['High Ropes', 'Freedom Base', 'First Aid', 'Emergency Protocol', 'Risk Assessment', 'Watering & Spiritual', 'General'],
        default: 'General'
    },
    fileUrl: {
        type: String,
        default: '#'
    },
    description: {
        type: String,
        default: ''
    },
    version: {
        type: String,
        default: 'v1.0'
    },
    approvedBy: {
        type: String,
        default: 'G5 Training Directorate'
    },
    lastReviewed: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('LopDoc', lopDocSchema);
