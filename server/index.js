import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/authRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import councilRoutes from './routes/councilRoutes.js';
import g5Routes from './routes/g5Routes.js';
import g2Routes from './routes/g2Routes.js';
import rankingRoutes from './routes/rankingRoutes.js';
import rosterRoutes from './routes/rosterRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import rolloverRoutes from './routes/rolloverRoutes.js';
import safetyRoutes from './routes/safetyRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import delegationRoutes from './routes/delegationRoutes.js';
import crewsRoutes from './routes/crewsRoutes.js';
import registerRoutes from './routes/registerRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { seedReferenceData } from './utils/seedReferenceData.js';

import downtimeManager from './middleware/downtimeManager.js';

const envPathLocal = path.resolve(process.cwd(), '.env');
const envPathParent = path.resolve(process.cwd(), '..', '.env');
console.log('Loading env from:', envPathLocal);
dotenv.config({ path: envPathLocal });
if (!process.env.MONGO_URI) {
    console.log('MONGO_URI not found in local env, trying parent env:', envPathParent);
    dotenv.config({ path: envPathParent });
}

const app = express();
app.set('trust proxy', true);
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
import './models/CampProgram.js';
import './models/Requisition.js';
import './models/GearAsset.js';
import './models/IncidentLog.js';
import './models/CouncilMinutes.js';
import './models/HandoverDossier.js';
import './models/SemesterRolloverSnapshot.js';
import './models/RankDefinition.js';
import './models/EvaluationDomain.js';
import './models/Evaluation.js';
import './models/Venue.js';
import './models/LopDoc.js';
import './models/Crew.js';
import './models/CheckInToken.js';

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    if (cachedConnection && mongoose.connection.readyState !== 1) {
        console.log('🔄 Stale MongoDB connection detected. Clearing cache and reconnecting...');
        cachedConnection = null;
    }

    console.log('--- Database Connection Attempt ---');
    const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doulos-attendance';
    const fallbackUri = process.env.MONGO_URI_FALLBACK || null;
    console.log('URI Presence:', !!process.env.MONGO_URI);
    console.log('Connecting to MongoDB URI type:', primaryUri.startsWith('mongodb+srv://') ? 'srv' : 'standard');

    try {
        const conn = await mongoose.connect(primaryUri, {
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

            const superAdminExists = await User.findOne({ username: 'superadmin' });
            if (!superAdminExists) {
                await new User({ username: 'superadmin', password: process.env.SUPERADMIN_PASSWORD || 'superadmin123', role: 'superadmin' }).save();
                console.log('✅ Premium Super Admin account initialized: superadmin');
            }

            const superSuperAdminExists = await User.findOne({ username: 'supersuperadmin' });
            if (!superSuperAdminExists) {
                await new User({ username: 'supersuperadmin', password: '123', role: 'superadmin' }).save();
                console.log('✅ Premium Super Admin account initialized: supersuperadmin');
            }

            // G5 Training Directorate & G2 Operations Accounts
            const activeRolesToSeed = [
                { username: 'G5', password: '123', role: 'trainer', campus: 'Both' },
                { username: 'G2', password: '123', role: 'g2_vice', campus: 'Both' }
            ];

            for (const a of activeRolesToSeed) {
                const existing = await User.findOne({ username: { $regex: new RegExp(`^${a.username}$`, 'i') } });
                if (!existing) {
                    await new User({
                        username: a.username,
                        password: a.password,
                        role: a.role,
                        campus: a.campus
                    }).save();
                    console.log(`✅ Account seeded: ${a.username} (${a.role})`);
                }
            }

            // Seed reference data (Ranks, Domains, Venues, LOP Docs)
            await seedReferenceData();
        })().catch(err => console.error('Seeding Error:', err.message));

        return conn;
    } catch (err) {
        console.error('❌ MongoDB Error:', err.message);

        if (fallbackUri && primaryUri.startsWith('mongodb+srv://')) {
            console.log('Trying fallback MongoDB URI due to SRV lookup failure...');
            try {
                const conn = await mongoose.connect(fallbackUri, {
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 120000,
                });
                cachedConnection = conn;
                console.log('✅ MongoDB Connected with fallback URI');
                return conn;
            } catch (fallbackErr) {
                console.error('❌ MongoDB Fallback Error:', fallbackErr.message);
            }
        }

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
app.use('/api/system', systemRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/council', councilRoutes);
app.use('/api/g5', g5Routes);
app.use('/api/g2', g2Routes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/roster', rosterRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/rollover', rolloverRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/delegation', delegationRoutes);
app.use('/api/crews', crewsRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tokens', tokenRoutes);

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
