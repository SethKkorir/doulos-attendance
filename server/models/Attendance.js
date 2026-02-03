import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
    studentRegNo: { type: String, required: true }, // Principal identifier for uniqueness
    responses: { type: Map, of: String }, // Flexible dynamic fields
    timestamp: { type: Date, default: Date.now }
});

// Prevent duplicate check-ins for the same meeting based on Reg No
attendanceSchema.index({ meeting: 1, studentRegNo: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
