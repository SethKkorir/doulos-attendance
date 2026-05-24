import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

export const getSystemStatus = async (req, res) => {
    try {
        const targetUri = await Settings.findOne({ key: 'TARGET_CLUSTER_URI' });
        const recoverySetting = await Settings.findOne({ key: 'RECOVERY_MODE' });
        const maintenanceSetting = await Settings.findOne({ key: 'MANUAL_MAINTENANCE' });
        
        res.json({
            recoveryMode: recoverySetting?.value === 'true',
            manualMaintenance: maintenanceSetting?.value === 'true',
            targetClusterUri: targetUri?.value || '',
            currentCluster: 'New (Temporary)'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching status' });
    }
};

export const updateSystemStatus = async (req, res) => {
    const { recoveryMode, manualMaintenance, targetClusterUri } = req.body;
    
    try {
        if (targetClusterUri !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'TARGET_CLUSTER_URI' },
                { value: targetClusterUri },
                { upsert: true }
            );
        }

        if (recoveryMode !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'RECOVERY_MODE' },
                { value: recoveryMode ? 'true' : 'false' },
                { upsert: true }
            );
        }

        if (manualMaintenance !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'MANUAL_MAINTENANCE' },
                { value: manualMaintenance ? 'true' : 'false' },
                { upsert: true }
            );
        }

        res.json({ message: 'System settings updated (Target Cluster & Status Saved)' });
    } catch (error) {
        res.status(500).json({ message: 'Update failed' });
    }
};

export const runMasterMerge = async (req, res) => {
    const { targetUri } = req.body;

    if (!targetUri) return res.status(400).json({ message: 'Target Cluster URI is required' });

    try {
        console.log("--- BEHIND THE SCENES: MASTER MERGE INITIATED ---");

        // 1. Connect to Target (The Old Main Cluster)
        const targetConn = await mongoose.createConnection(targetUri).asPromise();
        const MemberTarget = targetConn.model('Member', Member.schema);
        const AttendanceTarget = targetConn.model('Attendance', Attendance.schema);

        // 2. Sync Members in bulk
        const sourceMembers = await Member.find({});
        const existingTargetRegNos = new Set(await MemberTarget.distinct('studentRegNo'));
        const memberBulkOps = [];

        for (const member of sourceMembers) {
            const memberData = member.toObject();
            delete memberData._id;

            const { totalPoints = 0, ...memberUpdateData } = memberData;

            if (existingTargetRegNos.has(member.studentRegNo)) {
                memberBulkOps.push({
                    updateOne: {
                        filter: { studentRegNo: member.studentRegNo },
                        update: {
                            $set: memberUpdateData,
                            $inc: { totalPoints: totalPoints }
                        }
                    }
                });
            } else {
                memberBulkOps.push({
                    insertOne: {
                        document: memberData
                    }
                });
            }
        }

        if (memberBulkOps.length > 0) {
            await MemberTarget.bulkWrite(memberBulkOps);
        }

        // 3. Sync Attendance in bulk
        const sourceAttendance = await Attendance.find({});
        const existingTargetAttendance = await AttendanceTarget.find({}, 'studentRegNo timestamp').lean();
        const existingAttendanceKeys = new Set(
            existingTargetAttendance.map(att => `${att.studentRegNo}|${new Date(att.timestamp).toISOString()}`)
        );
        const attendanceBulkOps = [];
        let importedCount = 0;

        for (const att of sourceAttendance) {
            const attKey = `${att.studentRegNo}|${new Date(att.timestamp).toISOString()}`;
            if (existingAttendanceKeys.has(attKey)) {
                continue;
            }

            const attData = att.toObject();
            delete attData._id;
            attendanceBulkOps.push({ insertOne: { document: attData } });
            importedCount++;
        }

        if (attendanceBulkOps.length > 0) {
            await AttendanceTarget.bulkWrite(attendanceBulkOps);
        }

        targetConn.close();
        res.json({ message: `Successfully merged ${importedCount} attendance records to the main cluster!` });
    } catch (error) {
        console.error("Merge error:", error);
        res.status(500).json({ message: `Merge failed: ${error.message}` });
    }
};
import { runDatabaseBackup } from '../utils/backupService.js';

export const triggerManualBackup = async (req, res) => {
    try {
        const result = await runDatabaseBackup();
        if (result.success) {
            if (result.local) {
                res.json({ message: `Backup snapshot saved locally: ${result.path}. Setup GITHUB_BACKUP_TOKEN in .env for cloud backup.` });
            } else {
                res.json({ message: 'Backup successfully synchronized to GitHub repository!', url: result.url });
            }
        } else {
            res.status(500).json({ message: 'Backup failed', error: result.error });
        }
    } catch (error) {
        res.status(500).json({ message: 'Backup engine error', error: error.message });
    }
};

export const getCloudBackups = async (req, res) => {
    // Role check: strictly only superadmin and developer allowed to view cloud backups
    const allowedRoles = ['superadmin', 'developer'];
    if (!allowedRoles.includes(req.user?.role?.toLowerCase())) {
        return res.status(403).json({ message: 'Forbidden: SuperAdmin or Developer permissions required.' });
    }

    const token = process.env.GITHUB_BACKUP_TOKEN;
    const repo = process.env.GITHUB_BACKUP_REPO;

    if (!token || !repo) {
        return res.status(400).json({ message: 'GitHub backups not configured in .env.' });
    }

    try {
        const url = `https://api.github.com/repos/${repo}/contents/backups`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            }
        });

        if (!response.ok) {
            const err = await response.json();
            return res.status(response.status).json({ message: 'GitHub API Error: ' + err.message });
        }

        const files = await response.json();
        
        if (!Array.isArray(files)) {
            return res.json([]);
        }

        // Filter for .json backup files and sort by date descending
        const backups = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => ({
                name: f.name,
                path: f.path,
                sha: f.sha,
                size: f.size,
                downloadUrl: f.download_url,
                htmlUrl: f.html_url
            }))
            .reverse();

        res.json(backups);
    } catch (error) {
        console.error("Failed to fetch cloud backups:", error);
        res.status(500).json({ message: 'Failed to fetch cloud backups', error: error.message });
    }
};

export const restoreCloudBackup = async (req, res) => {
    // Role check: strictly only superadmin and developer allowed to run database restore
    const allowedRoles = ['superadmin', 'developer'];
    if (!allowedRoles.includes(req.user?.role?.toLowerCase())) {
        return res.status(403).json({ message: 'Forbidden: SuperAdmin or Developer permissions required.' });
    }

    const { fileName } = req.body;
    if (!fileName) {
        return res.status(400).json({ message: 'Missing backup fileName in request body.' });
    }

    const token = process.env.GITHUB_BACKUP_TOKEN;
    const repo = process.env.GITHUB_BACKUP_REPO;

    if (!token || !repo) {
        return res.status(400).json({ message: 'GitHub backups not configured in .env.' });
    }

    try {
        const url = `https://api.github.com/repos/${repo}/contents/backups/${fileName}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            }
        });

        if (!response.ok) {
            const err = await response.json();
            return res.status(response.status).json({ message: 'Failed to fetch file from GitHub: ' + err.message });
        }

        const fileData = await response.json();
        
        if (!fileData.content) {
            return res.status(500).json({ message: 'No content in the backup file fetched from GitHub.' });
        }

        const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const backupPayload = JSON.parse(decodedContent);

        // Backup payload nests items in `.data` key (see backupData structure in runDatabaseBackup)
        const dbData = backupPayload.data || backupPayload;

        const { members, meetings, attendance, trainings, payments, feedback, settings, activitylogs } = dbData;
        
        // Basic structure validation
        if (!members || !meetings || !attendance) {
            return res.status(400).json({ message: 'Restore failed: Invalid cloud backup snapshot structure.' });
        }

        const [Member, Meeting, Attendance, Training, Payment, Feedback, Settings, ActivityLog] = await Promise.all([
            import('../models/Member.js').then(m => m.default),
            import('../models/Meeting.js').then(m => m.default),
            import('../models/Attendance.js').then(m => m.default),
            import('../models/Training.js').then(m => m.default),
            import('../models/Payment.js').then(m => m.default),
            import('../models/Feedback.js').then(m => m.default),
            import('../models/Settings.js').then(m => m.default),
            import('../models/ActivityLog.js').then(m => m.default)
        ]);

        // Wipe existing collections
        await Promise.all([
            Member.deleteMany({}),
            Meeting.deleteMany({}),
            Attendance.deleteMany({}),
            Training.deleteMany({}),
            Payment.deleteMany({}),
            Feedback.deleteMany({}),
            Settings.deleteMany({}),
            ActivityLog.deleteMany({})
        ]);

        // Re-populate database
        await Promise.all([
            members && members.length ? Member.insertMany(members) : Promise.resolve(),
            meetings && meetings.length ? Meeting.insertMany(meetings) : Promise.resolve(),
            attendance && attendance.length ? Attendance.insertMany(attendance) : Promise.resolve(),
            trainings && trainings.length ? Training.insertMany(trainings) : Promise.resolve(),
            payments && payments.length ? Payment.insertMany(payments) : Promise.resolve(),
            feedback && feedback.length ? Feedback.insertMany(feedback) : Promise.resolve(),
            settings && settings.length ? Settings.insertMany(settings) : Promise.resolve(),
            activitylogs && activitylogs.length ? ActivityLog.insertMany(activitylogs) : Promise.resolve()
        ]);

        // Create an Activity Log recording this manual restore operation
        const restoreLog = new ActivityLog({
            studentRegNo: 'SYSTEM',
            type: 'Other',
            semester: settings?.find(s => s.key === 'current_semester')?.value || 'SYSTEM',
            pointsEarned: 0,
            notes: `Full system database recovery restored from cloud backup (${fileName}) by SuperAdmin: ${req.user?.username || 'Admin'}.`
        });
        await restoreLog.save();

        res.json({
            message: `Cloud database snapshot (${fileName}) successfully restored!`,
            counts: {
                members: members.length,
                meetings: meetings.length,
                attendance: attendance.length,
                trainings: trainings ? trainings.length : 0,
                payments: payments ? payments.length : 0,
                activitylogs: activitylogs ? activitylogs.length : 0
            }
        });
    } catch (err) {
        console.error("Cloud database restore failed:", err);
        res.status(500).json({ message: 'Cloud database recovery failed.', error: err.message });
    }
};

