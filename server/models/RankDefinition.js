import mongoose from 'mongoose';

const rankDefinitionSchema = new mongoose.Schema({
    rank: {
        type: String,
        enum: ['shadow', 'basic', 'intermediate', 'lead'],
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    belayPermission: {
        type: String,
        enum: ['none', 'secondary', 'primary'],
        required: true
    },
    canRunGroupAlone: {
        type: Boolean,
        default: false
    },
    characteristics: [{
        type: String
    }],
    order: {
        type: Number,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('RankDefinition', rankDefinitionSchema);
