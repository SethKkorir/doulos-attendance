import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
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
    timestamp: { type: Date, default: Date.now }
});

// Prevent duplicate check-ins for the same meeting based on Reg No
attendanceSchema.index({ meeting: 1, studentRegNo: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
