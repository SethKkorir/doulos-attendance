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
