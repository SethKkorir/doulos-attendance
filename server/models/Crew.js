import mongoose from 'mongoose';

const crewSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road', 'Both'],
        default: 'Athi River'
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        default: null
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }]
}, { timestamps: true });

export default mongoose.model('Crew', crewSchema);
