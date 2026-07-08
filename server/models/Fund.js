import mongoose from 'mongoose';

const fundSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        enum: ['Grief Support', 'Emergency Fund', 'CSR/Donations', 'Petty Cash'] 
    },
    description: { type: String, default: '' },
    currentBalance: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Fund', fundSchema);
