import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/doulos-attendance');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
    }
};

// Initial connection
connectDB().then(async () => {
    // Auto-seed admin if database is empty
    try {
        const User = (await import('./models/User.js')).default;
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const admin = new User({
                username: 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log('Admin auto-seeded successfully');
        }
    } catch (err) {
        console.error('Auto-seeding failed:', err);
    }
});

// Basic Route
app.get('/', (req, res) => {
    res.send('Doulos Attendance API Running');
});

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
