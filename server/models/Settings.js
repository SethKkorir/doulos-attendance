import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
