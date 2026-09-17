import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g. "14:00"
    location: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['Meeting', 'Training', 'Retreat', 'Outbound', 'Operations', 'Milestone', 'AGM', 'Orientation', 'Other'], 
        default: 'Meeting' 
    },
    semester: { type: String, required: true },
    createdBy: { type: String, default: 'G2 Operations' },
    isPublished: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Event', EventSchema);
