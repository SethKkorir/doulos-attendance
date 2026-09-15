import mongoose from 'mongoose';

const campProgramSchema = new mongoose.Schema({
    title: { type: String, required: true, default: 'Freedom Base 3-Day Leadership & Ropes Camp' },
    semester: { type: String, required: true, default: 'MAY-AUG 2026' },
    campus: { type: String, enum: ['Athi River', 'Valley Road', 'Both'], default: 'Both' },
    startDate: { type: Date, default: () => new Date() },
    endDate: { type: Date, default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    theme: { type: String, default: 'Anchored in Competence, Formed in Faith' },
    schedule: [{
        day: { type: String, enum: ['Friday', 'Saturday', 'Sunday'], required: true },
        time: { type: String, required: true },
        activity: { type: String, required: true },
        location: { type: String, default: 'Freedom Base' },
        leadFacilitator: { type: String, default: '' },
        facilitators: [{ type: String }],
        notes: { type: String, default: '' }
    }],
    dutyRoster: [{
        stationName: { type: String, required: true },
        location: { type: String, default: 'Lukenya High Ropes' },
        stationLead: { type: String, required: true },
        stationLeadRank: { type: String, default: 'Lead Douloid' },
        primaryBelayer: { type: String, default: '' },
        primaryBelayerRank: { type: String, default: 'Intermediate Douloid' },
        secondaryBelayer: { type: String, default: '' },
        secondaryBelayerRank: { type: String, default: 'Basic Douloid' },
        spotter: { type: String, default: '' },
        spotterRank: { type: String, default: 'Shadow Douloid' },
        safetyCleared: { type: Boolean, default: true },
        safetyWarning: { type: String, default: '' }
    }],
    emergencyContacts: [{
        role: { type: String },
        name: { type: String },
        phone: { type: String }
    }],
    activeStatus: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Published' }
}, { timestamps: true });

export default mongoose.model('CampProgram', campProgramSchema);
