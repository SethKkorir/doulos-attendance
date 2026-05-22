import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g. "14:00"
    location: { type: String, required: true },
    type: { type: String, enum: ['Meeting', 'Training', 'Retreat', 'Outbound', 'Other'], default: 'Meeting' },
    semester: { type: String, required: true },
    isPublished: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Event', EventSchema);
