import mongoose from 'mongoose';

const checkInTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    meetingCode: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        default: null
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 300 } // TTL index for cleanup
    },
    isUsed: {
        type: Boolean,
        default: false,
        index: true
    },
    usedAt: {
        type: Date,
        default: null
    },
    stampedDeviceId: {
        type: String,
        default: null
    },
    fallbackUsed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CheckInToken = mongoose.model('CheckInToken', checkInTokenSchema);
export default CheckInToken;
