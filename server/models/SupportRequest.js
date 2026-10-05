import mongoose from 'mongoose';

const supportRequestSchema = new mongoose.Schema({
    memberId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    memberName: {
        type: String,
        default: 'Member',
        trim: true
    },
    campus: {
        type: String,
        default: 'Athi River',
        enum: ['Athi River', 'Nairobi', 'All']
    },
    memberType: {
        type: String,
        default: 'Douloid'
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: String,
        default: '',
        trim: true
    },
    preferredContactMethod: {
        type: String,
        enum: ['In Person', 'WhatsApp', 'Phone Call', 'Email'],
        default: 'In Person'
    },
    source: {
        type: String,
        enum: ['QUESTION_CHECK_IN', 'DIRECT_REQUEST', 'DEVOTIONAL_FLAG', 'MANUAL_ENTRY'],
        default: 'DIRECT_REQUEST',
        index: true
    },
    questionResponseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionResponse',
        default: null
    },
    fellowshipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fellowship',
        default: null
    },
    priority: {
        type: String,
        enum: ['NORMAL', 'URGENT'],
        default: 'NORMAL',
        index: true
    },
    status: {
        type: String,
        enum: ['NEEDS_ATTENTION', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'NEEDS_ATTENTION',
        index: true
    },
    assignedTo: {
        type: String,
        default: null,
        trim: true
    },
    notes: [{
        text: {
            type: String,
            required: true,
            trim: true
        },
        author: {
            type: String,
            default: 'Spiritual Coordinator',
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isConfidential: {
        type: Boolean,
        default: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const SupportRequest = mongoose.models.SupportRequest || mongoose.model('SupportRequest', supportRequestSchema);

export default SupportRequest;
