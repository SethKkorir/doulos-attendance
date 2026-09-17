import Member from '../models/Member.js';
import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Setting from '../models/Settings.js';
import SemesterRolloverSnapshot from '../models/SemesterRolloverSnapshot.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { generateSemesterQRPosterPDF } from '../utils/qrPosterService.js';

// 1. Pre-Rollover Checklist (Server-Aggregated)
export const getRolloverChecklist = async (req, res) => {
    try {
        const semSetting = await Setting.findOne({ key: 'current_semester' });
        const currentSemester = semSetting?.value || 'MAY-AUG 2026';

        // 1. Outstanding graduations (recruits with 80+ points not yet graduated)
        const outstandingGraduations = await Member.countDocuments({
            memberType: 'Recruit',
            status: 'Active',
            totalPoints: { $gte: 80 }
        });

        // 2. Open evaluations (cadres with evaluations pending promotion decision)
        const openEvaluations = await Member.countDocuments({
            status: 'Active',
            douloidRank: { $in: ['Shadow Douloid', 'Basic Douloid'] },
            'evaluations.0': { $exists: true }
        });

        // 3. Unsettled attendance / active meetings
        const activeMeetingsCount = await Meeting.countDocuments({
            isActive: true,
            isArchived: false
        });

        // Total active members to be preserved
        const totalActiveMembers = await Member.countDocuments({ status: 'Active' });

        // Check if a previous rollover snapshot exists for rollback
        const lastSnapshot = await SemesterRolloverSnapshot.findOne({ isRollbackAvailable: true, isRolledBack: false }).sort({ createdAt: -1 });
        const snapshotAvailable = !!lastSnapshot;

        const canProceedWithoutOverride = outstandingGraduations === 0 && activeMeetingsCount === 0;

        res.json({
            success: true,
            currentSemester,
            snapshotAvailable,
            checklist: {
                outstandingGraduations,
                openEvaluations,
                unsettledAttendanceCounters: activeMeetingsCount,
                totalActiveMembers,
                canProceedWithoutOverride
            }
        });
    } catch (err) {
        console.error('Error fetching rollover checklist:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 2. Start Rollover
export const startRollover = async (req, res) => {
    try {
        const { semesterName, startDate, endDate, theme, verse, overrideChecklist } = req.body;

        if (!semesterName?.trim()) {
            return res.status(400).json({ success: false, message: 'Incoming Semester Code is required.' });
        }
        if (!startDate) {
            return res.status(400).json({ success: false, message: 'Semester Start Date is required.' });
        }
        if (!endDate) {
            return res.status(400).json({ success: false, message: 'Semester End Date is required.' });
        }
        if (!theme?.trim()) {
            return res.status(400).json({ success: false, message: 'Spiritual Theme is required.' });
        }
        if (!verse?.trim()) {
            return res.status(400).json({ success: false, message: 'Anchor Scripture / Memory Verse is required.' });
        }

        const semSetting = await Setting.findOne({ key: 'current_semester' });
        const fromSemester = semSetting?.value || 'MAY-AUG 2026';

        // Fetch checklist
        const outstandingGrads = await Member.countDocuments({
            memberType: 'Recruit',
            status: 'Active',
            totalPoints: { $gte: 80 }
        });

        const activeMeetings = await Meeting.countDocuments({ isActive: true, isArchived: false });

        if ((outstandingGrads > 0 || activeMeetings > 0) && !overrideChecklist) {
            return res.status(400).json({
                success: false,
                message: 'Checklist requirements not met. Please resolve outstanding graduations and active meetings, or provide overrideChecklist: true.'
            });
        }

        // 1. Snapshot all active members before resetting points/semesters
        const activeMembers = await Member.find({ status: 'Active' });
        const memberBackup = activeMembers.map(m => ({
            id: m._id,
            points: m.totalPoints,
            rank: m.douloidRank,
            type: m.memberType,
            consecutiveAbsences: m.consecutiveAbsences || 0
        }));

        const snapshot = new SemesterRolloverSnapshot({
            fromSemester,
            toSemester: semesterName,
            executedBy: req.user?.username || req.user?.name || req.user?.role || 'G2 Operations',
            membersCount: activeMembers.length,
            backupPayload: {
                members: memberBackup,
                startDate,
                endDate,
                theme,
                verse
            },
            isRollbackAvailable: true
        });
        await snapshot.save();

        // 2. Batch promote any eligible recruits (>= 80 points)
        const eligibleRecruits = await Member.find({
            memberType: 'Recruit',
            status: 'Active',
            totalPoints: { $gte: 80 }
        });

        for (const recruit of eligibleRecruits) {
            recruit.memberType = 'Douloid';
            recruit.douloidRank = 'Shadow Douloid';
            recruit.rankHistory = recruit.rankHistory || [];
            recruit.rankHistory.push({
                fromRank: 'Recruit',
                toRank: 'Shadow Douloid',
                date: new Date(),
                promotedBy: `Semester Rollover to ${semesterName}`,
                notes: 'Commissioned at Recruit Cohort Graduation'
            });
            await recruit.save();
        }

        // 3. Conclude all current active meetings and trainings (keep in history, do not archive)
        await Meeting.updateMany(
            { isActive: true },
            { $set: { isActive: false } }
        );
        await Training.updateMany(
            { isActive: true },
            { $set: { isActive: false } }
        );

        // 4. Update Settings for new semester
        const newQrToken = 'DOULOS-MASTER-' + semesterName.replace(/\s+/g, '-') + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        await Setting.findOneAndUpdate({ key: 'current_semester' }, { value: semesterName }, { upsert: true });
        if (startDate) await Setting.findOneAndUpdate({ key: 'semester_start_date' }, { value: startDate }, { upsert: true });
        if (endDate) await Setting.findOneAndUpdate({ key: 'semester_end_date' }, { value: endDate }, { upsert: true });
        if (theme) await Setting.findOneAndUpdate({ key: 'semester_theme' }, { value: theme }, { upsert: true });
        if (verse) await Setting.findOneAndUpdate({ key: 'semester_verse' }, { value: verse }, { upsert: true });
        await Setting.findOneAndUpdate({ key: 'master_semester_qr_token' }, { value: newQrToken }, { upsert: true });
        await Setting.findOneAndUpdate({ key: 'semester_rollover_date' }, { value: Date.now().toString() }, { upsert: true });

        // 5. Reset member session points for fresh semester cycle
        await Member.updateMany(
            { status: 'Active' },
            { 
                $set: { 
                    totalPoints: 0, 
                    consecutiveAbsences: 0,
                    lastActiveSemester: semesterName 
                } 
            }
        );

        // 6. Universal Device Link Reset: Clears hardware device locks for ALL members (Active, Inactive, Alumni, etc.) so everyone starts fresh
        await Member.updateMany(
            {},
            { 
                $set: { 
                    linkedDeviceId: null 
                } 
            }
        );

        // 7. Purge stale scan errors / device conflict records
        if (mongoose.connection?.readyState === 1) {
            try {
                await mongoose.connection.db.collection('scanerrors').deleteMany({});
            } catch (err) {
                console.warn('Note: scanerrors collection purge skipped:', err.message);
            }
        }

        res.json({
            success: true,
            message: `Successfully rolled over to ${semesterName}! All member device links and attendance points reset fresh for the new term. Snapshot preserved with 72-hour rollback guarantee.`,
            snapshotId: snapshot._id,
            newSemester: semesterName,
            masterQrToken: newQrToken,
            promotedRecruitsCount: eligibleRecruits.length,
            deviceLinksReset: true,
            posterDownloadUrl: `/api/rollover/qr-poster-pdf?semester=${encodeURIComponent(semesterName)}`
        });
    } catch (err) {
        console.error('Error starting rollover:', err);
        res.status(500).json({ success: false, message: 'Server error executing rollover', error: err.message });
    }
};

// 3. Rollback Rollover (Enforced Window with fast bulkWrite)
export const rollbackRollover = async (req, res) => {
    try {
        // Find most recent snapshot
        const snapshot = await SemesterRolloverSnapshot.findOne({
            isRollbackAvailable: true,
            isRolledBack: false
        }).sort({ createdAt: -1 });

        if (!snapshot) {
            return res.status(400).json({
                success: false,
                message: 'No active rollover snapshot available for rollback.'
            });
        }

        // Check rollback window (72 hours)
        const snapshotTime = new Date(snapshot.createdAt).getTime();
        const now = Date.now();
        const maxWindow = 72 * 60 * 60 * 1000; // 72 hours

        if (now - snapshotTime > maxWindow) {
            snapshot.isRollbackAvailable = false;
            await snapshot.save();
            return res.status(400).json({
                success: false,
                message: 'Rollback window has expired (72-hour threshold exceeded). Manual intervention required.'
            });
        }

        // Fast batch restore member state using bulkWrite
        if (snapshot.backupPayload?.members && snapshot.backupPayload.members.length > 0) {
            const bulkOps = snapshot.backupPayload.members.map(item => ({
                updateOne: {
                    filter: { _id: item.id || item._id },
                    update: {
                        $set: {
                            totalPoints: item.points ?? item.totalPoints ?? 0,
                            douloidRank: item.rank || item.douloidRank,
                            memberType: item.type || item.memberType,
                            consecutiveAbsences: item.consecutiveAbsences || 0,
                            lastActiveSemester: snapshot.fromSemester
                        }
                    }
                }
            }));
            await Member.bulkWrite(bulkOps);
        }

        // Restore Settings
        await Setting.findOneAndUpdate({ key: 'current_semester' }, { value: snapshot.fromSemester });

        // Mark snapshot rolled back
        snapshot.isRolledBack = true;
        snapshot.isRollbackAvailable = false;
        snapshot.rolledBackAt = new Date();
        snapshot.rolledBackBy = req.user?.username || 'SuperAdmin';
        await snapshot.save();

        res.json({
            success: true,
            message: `Rollover safely rolled back. Restored to ${snapshot.fromSemester}.`,
            restoredSemester: snapshot.fromSemester
        });
    } catch (err) {
        console.error('Error in rollbackRollover:', err);
        res.status(500).json({ success: false, message: 'Server error during rollback', error: err.message });
    }
};

// 4. Download Permanent Printable QR Code Poster (PDF)
export const downloadSemesterQRPoster = async (req, res) => {
    try {
        const { semester, theme, verse } = req.query;
        const origin = req.headers.origin || req.headers.host ? `${req.protocol}://${req.get('host')}` : undefined;

        const pdfBuffer = await generateSemesterQRPosterPDF({
            semester,
            theme,
            verse,
            baseUrl: origin
        });

        const semSetting = await Setting.findOne({ key: 'current_semester' });
        const semName = semester || semSetting?.value || 'SEMESTER';
        const cleanName = semName.replace(/[^a-zA-Z0-9_-]/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Doulos_QR_Poster_${cleanName}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error('Error generating QR poster PDF:', err);
        res.status(500).json({ success: false, message: 'Failed to generate QR poster PDF', error: err.message });
    }
};
