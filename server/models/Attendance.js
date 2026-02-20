import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' }, // For regular meetings
    trainingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Training' }, // For training sessions
    meetingName: { type: String },
    campus: { type: String },
    studentRegNo: { type: String, required: true },
    memberType: {
        type: String,
        enum: ['Douloid', 'Recruit', 'Visitor'],
        required: true
    },
    responses: { type: Map, of: String },
    questionOfDay: { type: String },
    deviceId: { type: String }, // Fingerprint
    isExempted: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

// Prevent duplicate check-ins for same meeting (regular)
attendanceSchema.index({ meeting: 1, studentRegNo: 1 }, { unique: true, sparse: true });
// Prevent duplicate check-ins for same training
attendanceSchema.index({ trainingId: 1, studentRegNo: 1 }, { unique: true, sparse: true });

export default mongoose.model('Attendance', attendanceSchema);
