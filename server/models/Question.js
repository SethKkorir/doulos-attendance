import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['BANTER', 'SKILLS', 'LIFE'],
        required: true,
        default: 'BANTER',
        index: true
    },
    responseType: {
        type: String,
        enum: ['text', 'yes_no', 'multiple_choice', 'checkboxes', 'rating'],
        required: true,
        default: 'text'
    },
    options: {
        type: [String],
        default: []
    },
    visibility: {
        type: String,
        enum: ['PRIVATE', 'MENTOR', 'TRAINER', 'SQUAD', 'COMMUNITY', 'ANONYMOUS_COMMUNITY'],
        default: 'COMMUNITY',
        index: true
    },
    required: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
        default: 'ACTIVE',
        index: true
    },
    // Skills-specific evaluation attributes
    skill: {
        type: String,
        default: '',
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', ''],
        default: ''
    },
    correctAnswer: {
        type: String,
        default: '',
        trim: true
    },
    explanation: {
        type: String,
        default: '',
        trim: true
    },
    // Associated meeting (if created for a specific session)
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        default: null
    },
    responseCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        default: 'Spiritual Coordinator'
    }
}, {
    timestamps: true
});

questionSchema.index({ category: 1, status: 1 });
questionSchema.index({ meetingId: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;
