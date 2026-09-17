import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    sub: {
        type: String,
        default: ''
    },
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road', 'Both'],
        required: true
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    radius: {
        type: Number,
        default: 200 // meters
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Venue', venueSchema);
