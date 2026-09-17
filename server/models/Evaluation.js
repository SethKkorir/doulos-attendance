import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    evaluatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    evaluatorName: {
        type: String,
        default: 'G5 Training Directorate'
    },
    date: {
        type: Date,
        default: Date.now
    },
    scores: {
        type: Map,
        of: Number,
        default: {}
    },
    averageScore: {
        type: Number,
        default: 0
    },
    recommendation: {
        type: String,
        enum: ['promote', 'hold', 'downgrade'],
        default: 'promote'
    },
    targetRank: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model('Evaluation', evaluationSchema);
