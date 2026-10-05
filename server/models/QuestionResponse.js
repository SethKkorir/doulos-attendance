import mongoose from 'mongoose';

const questionResponseSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
        index: true
    },
    memberId: {
        type: String, // studentRegNo
        required: true,
        index: true
    },
    memberName: {
        type: String,
        default: 'Member'
    },
    campus: {
        type: String,
        default: 'Athi River'
    },
    memberType: {
        type: String,
        enum: ['Douloid', 'Recruit', 'Visitor'],
        default: 'Douloid'
    },
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        default: null,
        index: true
    },
    attendanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
        default: null
    },
    category: {
        type: String,
        enum: ['BANTER', 'SKILLS', 'LIFE'],
        default: 'BANTER',
        index: true
    },
    response: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    isCorrect: {
        type: Boolean,
        default: null
    },
    requestCheckIn: {
        type: Boolean,
        default: false,
        index: true
    },
    checkInReason: {
        type: String,
        default: ''
    },
    visibility: {
        type: String,
        enum: ['PRIVATE', 'MENTOR', 'TRAINER', 'SQUAD', 'COMMUNITY', 'ANONYMOUS_COMMUNITY'],
        default: 'COMMUNITY'
    },
    submittedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Ensure a member has one recorded response per question per meeting
questionResponseSchema.index({ questionId: 1, memberId: 1, meetingId: 1 }, { unique: true });

const QuestionResponse = mongoose.model('QuestionResponse', questionResponseSchema);
export default QuestionResponse;
