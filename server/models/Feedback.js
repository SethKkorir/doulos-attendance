import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'Anonymous'
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'general'
    },
    status: {
        type: String,
        enum: ['new', 'read', 'actioned'],
        default: 'new'
    }
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);
