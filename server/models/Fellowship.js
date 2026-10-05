import mongoose from 'mongoose';

const fellowshipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Fellowship title is required'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Fellowship date is required']
    },
    theme: {
        type: String,
        default: '',
        trim: true
    },
    scriptureReference: {
        type: String,
        required: [true, 'Scripture reference is required'],
        trim: true
    },
    scriptureText: {
        type: String,
        required: [true, 'Scripture text is required'],
        trim: true
    },
    devotional: {
        type: String,
        required: [true, 'Devotional body is required']
    },
    reflectionQuestion: {
        type: String,
        default: '',
        trim: true
    },
    prayer: {
        type: String,
        default: '',
        trim: true
    },
    communityPrompt: {
        type: String,
        default: '',
        trim: true
    },
    coverImage: {
        type: String,
        default: ''
    },
    campus: {
        type: String,
        default: 'All'
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
        default: 'DRAFT',
        index: true
    },
    publishedAt: {
        type: Date,
        default: null
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    completionPercent: {
        type: Number,
        default: 0
    },
    openedCount: {
        type: Number,
        default: 0
    },
    reflectionsCount: {
        type: Number,
        default: 0
    },
    prayerInteractionsCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        default: 'G3/G4 Spiritual Coordinator'
    },
    updatedBy: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

fellowshipSchema.index({ status: 1, date: -1 });
fellowshipSchema.index({ scheduledAt: 1, status: 1 });

// Method to recalculate completion percentage
fellowshipSchema.methods.calculateCompletion = function() {
    let score = 0;
    if (this.title?.trim()) score += 15;
    if (this.theme?.trim()) score += 10;
    if (this.scriptureReference?.trim() && this.scriptureText?.trim()) score += 25;
    if (this.devotional?.trim()) score += 25;
    if (this.reflectionQuestion?.trim()) score += 10;
    if (this.prayer?.trim()) score += 10;
    if (this.coverImage?.trim()) score += 5;
    this.completionPercent = Math.min(score, 100);
    return this.completionPercent;
};

const Fellowship = mongoose.model('Fellowship', fellowshipSchema);
export default Fellowship;
