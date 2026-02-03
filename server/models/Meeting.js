import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'Weekly Meeting' },
    date: { type: Date, required: true },
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road'],
        required: true
    },
    startTime: { type: String, required: true }, // e.g., "20:30"
    endTime: { type: String, required: true },   // e.g., "23:00"
    isActive: { type: Boolean, default: true },
    code: { type: String, unique: true } // Unique meeting ID/Token for QR
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);
