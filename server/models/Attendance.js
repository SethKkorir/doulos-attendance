import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
    studentName: { type: String, required: true },
    studentRegNo: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Prevent duplicate check-ins for the same meeting
attendanceSchema.index({ meeting: 1, studentRegNo: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
