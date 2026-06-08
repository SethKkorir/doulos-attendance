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
attendanceSchema.index(
    { meeting: 1, studentRegNo: 1 },
    { 
        unique: true, 
        partialFilterExpression: { meeting: { $type: "objectId" } } 
    }
);

// Prevent duplicate check-ins for same training
attendanceSchema.index(
    { trainingId: 1, studentRegNo: 1 },
    { 
        unique: true, 
        partialFilterExpression: { trainingId: { $type: "objectId" } } 
    }
);

attendanceSchema.index({ studentRegNo: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Drop old faulty indexes on startup so mongoose can re-create them with partial filters
Attendance.collection.dropIndex('meeting_1_studentRegNo_1').catch(() => {});
Attendance.collection.dropIndex('trainingId_1_studentRegNo_1').catch(() => {});

export default Attendance;
