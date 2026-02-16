import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    studentRegNo: { type: String, required: true },
    type: {
        type: String,
        enum: ['Tree Watering', 'High Ropes', 'Low Ropes', 'Other'],
        required: true
    },
    semester: { type: String, required: true },
    pointsEarned: { type: Number, default: 0 },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for quick lookup of student activity in a semester
activityLogSchema.index({ studentRegNo: 1, semester: 1 });
activityLogSchema.index({ studentRegNo: 1, type: 1, timestamp: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
