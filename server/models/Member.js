import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    studentRegNo: { type: String, default: '', trim: true },
    name: { type: String, required: true },
    memberType: {
        type: String,
        enum: ['Douloid', 'Recruit', 'Visitor', 'Exempted'],
        default: 'Visitor'
    },
    campus: {
        type: String,
        enum: ['Athi River', 'Valley Road'],
        required: true
    },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    totalPoints: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Active', 'Archived', 'Archived-Concluded', 'Graduated'],
        default: 'Active'
    },
    archivedAt: { type: Date, default: null },
    archivedUntil: { type: Date, default: null },
    archiveDays: { type: Number, default: 20 },
    archiveReason: { type: String, default: null },
    lastActiveSemester: { type: String, default: null },
    wateringDays: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    groupName: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isActiveThisSemester: { type: Boolean, default: true },
    lastConfirmedSemester: { type: String, default: null },
    isTestAccount: { type: Boolean, default: false },
    needsGraduationCongrats: { type: Boolean, default: false },
    linkedDeviceId: { type: String, default: null },
    
    // G5 Training & Competency Specification (4 Levels of Facilitator Ranking)
    douloidRank: {
        type: String,
        enum: ['None', 'Shadow Douloid', 'Basic Douloid', 'Intermediate Douloid', 'Lead Douloid'],
        default: 'None'
    },
    belayStatus: {
        type: String,
        enum: ['Not Permitted', 'Secondary Belayer', 'Primary Belayer Certified'],
        default: 'Not Permitted'
    },
    soloStationAllowed: {
        type: Boolean,
        default: false
    },
    evaluations: [{
        date: { type: Date, default: Date.now },
        evaluator: { type: String, default: 'G5 Directorate' },
        domain: {
            type: String,
            enum: [
                'Team Building',
                'Freedom Base',
                'High Ropes',
                'Rescue & Extrication',
                'First Aid',
                'Safety & Risk Management',
                'Curriculum & Mentorship'
            ]
        },
        score: { type: Number, min: 1, max: 5, default: 3 },
        notes: { type: String, default: '' },
        passed: { type: Boolean, default: true }
    }],
    rankHistory: [{
        fromRank: { type: String },
        toRank: { type: String },
        date: { type: Date, default: Date.now },
        promotedBy: { type: String, default: 'G5 Training Directorate' },
        notes: { type: String, default: '' }
    }],
    
    // G9 Photo Vault & Birthday System (US-BIR-014)
    photoVault: [{ type: String }],
    dateOfBirth: { type: Date, default: null },
    birthdayPosterStatus: {
        type: String,
        enum: ['Pending Design', 'Poster Created', 'Published to Socials', 'Archived'],
        default: 'Pending Design'
    },
    
    // G6 Welfare & Community Pulse (US-G6-007)
    consecutiveAbsences: { type: Number, default: 0 },
    squadLeader: { type: String, default: null },
    squadLeaderPhone: { type: String, default: null },
    
    // G8 Freedom Base Land Stewardship (US-G8-009)
    environmentalStreak: { type: Number, default: 0 }
}, { timestamps: true });

memberSchema.index(
    { studentRegNo: 1 },
    { 
        unique: true, 
        partialFilterExpression: { studentRegNo: { $type: "string", $gt: "" } } 
    }
);
memberSchema.index({ linkedDeviceId: 1 });

const Member = mongoose.model('Member', memberSchema);
Member.collection.dropIndex('studentRegNo_1').catch(() => {});

export default Member;
