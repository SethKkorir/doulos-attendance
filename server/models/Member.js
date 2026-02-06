import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    studentRegNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    memberType: {
        type: String,
        enum: ['Douloid', 'Recruit', 'Visitor', 'Exempted'],
        default: 'Visitor'
    },
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road'],
        required: true
    },
    totalPoints: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isTestAccount: { type: Boolean, default: false },
    needsGraduationCongrats: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Member', memberSchema);
