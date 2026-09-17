import mongoose from 'mongoose';

const evaluationDomainSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    label: {
        type: String,
        required: true
    },
    tag: {
        type: String,
        default: 'Competency'
    },
    description: {
        type: String,
        default: ''
    },
    subCriteria: [{
        type: String
    }],
    order: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('EvaluationDomain', evaluationDomainSchema);
