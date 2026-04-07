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
import trainingRoutes from './routes/trainingRoutes.js';
import errorHandler from './middleware/errorHandler.js';

import downtimeManager from './middleware/downtimeManager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Essential Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Strategy for Serverless
let cachedConnection = null;

// Register Models Early to prevent MissingSchemaError during health checks
import './models/User.js';
import './models/Settings.js';
import './models/ActivityLog.js';
import './models/Attendance.js';
import './models/Feedback.js';
import './models/Meeting.js';
import './models/Member.js';
import './models/Payment.js';
import './models/Training.js';

const connectDB = async () => {
    if (cachedConnection) return cachedConnection;

    console.log('--- Database Connection Attempt ---');
    console.log('URI Presence:', !!process.env.MONGO_URI);

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/doulos-attendance', {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s or more
            socketTimeoutMS: 120000, // Keep-alive for serverless
        });
        cachedConnection = conn;
        console.log('✅ MongoDB Connected');

        // Auto-seed admin (deferred)
        (async () => {
            const User = mongoose.model('User');
            
            const adminExists = await User.findOne({ role: 'admin' });
            if (!adminExists) {
                console.log('Seeding initial admin user...');
                await new User({ username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin123', role: 'admin' }).save();
            }

            const superAdminExists = await User.findOne({ role: 'superadmin' });
            if (!superAdminExists) {
                const adminExists = await User.findOne({ username: 'supersuperadmin' });
                if (!adminExists) {
                    await new User({ username: 'supersuperadmin', password: '123', role: 'superadmin' }).save();
                    console.log('✅ Premium Super Admin account initialized: supersuperadmin');
                }
            }
        })().catch(err => console.error('Seeding Error:', err.message));

        return conn;
    } catch (err) {
        console.error('❌ MongoDB Error:', err.message);
        throw err;
    }
};

// 1. Connection Initializer (MUST BE FIRST)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        // Let it pass to downtime manager even if it fails
        // This allows the beautiful downtime page to handle it
        console.warn('Deferred connection failure handling to DowntimeManager');
        next();
    }
});

// 2. Unified Downtime & Isolation System (Must be after connection attempt)
app.use(downtimeManager.getDowntimeMiddleware());

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/trainings', trainingRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Doulos Attendance API Running');
});

// Error Handling
app.use(errorHandler);

import { initBackupScheduler } from './utils/backupService.js';

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, async () => {
        console.log(`Server running on port ${PORT}`);
        try {
            await connectDB();
            initBackupScheduler(); // Start the midnight backup clock
        } catch (err) {
            console.error('Failed to connect to database on startup');
        }
    });
} else {
    // For production/serverless, usually cron is triggered via an external ping or platform cron
    initBackupScheduler();
}

export default app;
