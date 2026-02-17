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
    semester: { type: String, default: '' },      // e.g., "JAN-APR 2026"
    isActive: { type: Boolean, default: true },
    code: { type: String, unique: true }, // Unique meeting ID/Token for QR
    requiredFields: [
        {
            label: { type: String, default: 'Full Name' },
            key: { type: String, default: 'studentName' },
            required: { type: Boolean, default: true }
        }
    ],
    isTestMeeting: { type: Boolean, default: false },
    devotion: { type: String, default: '' },
    announcements: { type: String, default: '' },
    questionOfDay: { type: String, default: '' },
    location: {
        name: { type: String, default: '' },
        latitude: { type: Number },
        longitude: { type: Number },
        radius: { type: Number, default: 200 } // in meters
    }
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);
