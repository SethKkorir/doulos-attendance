import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'Doulos Training' },
    date: { type: Date, required: true },
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road', 'Both'],
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
    questionType: {
        type: String,
        enum: ['text', 'yes_no', 'multiple_choice', 'checkboxes', 'rating'],
        default: 'text'
    },
    questionOptions: { type: [String], default: [] },
    location: {
        name: { type: String, default: '' },
        latitude: { type: Number },
        longitude: { type: Number },
        radius: { type: Number, default: 200 } // meters
    },
    activeDay: { type: Number, default: 1, min: 1, max: 3 },
    roster: {
        type: [
            {
                studentRegNo: { type: String, required: true },
                name: { type: String },
                memberType: { type: String, default: 'Recruit' },
                campus: { type: String }
            }
        ],
        default: []
    }

}, { timestamps: true });

export default mongoose.model('Training', trainingSchema);
