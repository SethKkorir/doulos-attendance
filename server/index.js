import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Essential Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Strategy for Serverless
let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) return cachedConnection;

    console.log('--- Database Connection Attempt ---');
    console.log('URI Presence:', !!process.env.MONGO_URI);

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/doulos-attendance', {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s or more
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        cachedConnection = conn;
        console.log('✅ MongoDB Connected');

        // Auto-seed admin
        const User = (await import('./models/User.js')).default;
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            console.log('Seeding initial admin user...');
            const admin = new User({
                username: 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Admin auto-seeded successfully');
        } else {
            console.log('Admin user verified');
        }

        return conn;
    } catch (err) {
        console.error('❌ MongoDB Error:', err.message);
        throw err;
    }
};

// Middleware to ensure DB connection before every request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/activities', activityRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Doulos Attendance API Running');
});

// Error Handling
app.use(errorHandler);

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
