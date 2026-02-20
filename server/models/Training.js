import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'Doulos Training' },
    date: { type: Date, required: true },
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road'],
        required: true
    },
    startTime: { type: String, required: true }, // e.g., "14:00"
    endTime: { type: String, required: true },   // e.g., "17:00"
    semester: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    code: { type: String, unique: true },
    requiredFields: {
        type: [
            {
                label: { type: String, default: 'Full Name' },
                key: { type: String, default: 'studentName' },
                required: { type: Boolean, default: true }
            }
        ],
        default: [
            { label: 'Full Name', key: 'studentName', required: true },
            { label: 'Admission Number', key: 'studentRegNo', required: true }
        ]
    },
    isTestMeeting: { type: Boolean, default: false },
    questionOfDay: { type: String, default: '' },
    location: {
        name: { type: String, default: '' },
        latitude: { type: Number },
        longitude: { type: Number },
        radius: { type: Number, default: 200 } // meters
    }
}, { timestamps: true });

export default mongoose.model('Training', trainingSchema);
