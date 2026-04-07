import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

export const getSystemStatus = async (req, res) => {
    try {
        const targetUri = await Settings.findOne({ key: 'TARGET_CLUSTER_URI' });
        res.json({
            recoveryMode: process.env.RECOVERY_MODE === 'true',
            manualMaintenance: process.env.MANUAL_MAINTENANCE === 'true',
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

        // Note: ENV variables can't be updated permanently via process.env in a running app (especially on Vercel)
        // In a real app, these would be in a DB too. 
        // For this project, we'll suggest the user updates Vercel env, 
        // but we'll use these settings for the merge logic.

        res.json({ message: 'System settings updated (Target Cluster Saved)' });
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
        
        // 2. Step 1: Sync Members
        const sourceMembers = await Member.find({});
        for (const member of sourceMembers) {
            const targetMember = await MemberTarget.findOne({ studentRegNo: member.studentRegNo });
            if (targetMember) {
                if (member.totalPoints > 0) {
                    await MemberTarget.updateOne(
                        { studentRegNo: member.studentRegNo },
                        { $inc: { totalPoints: member.totalPoints } }
                    );
                }
            } else {
                const memberData = member.toObject();
                delete memberData._id;
                await MemberTarget.create(memberData);
            }
        }

        // 3. Step 2: Sync Attendance
        const sourceAttendance = await Attendance.find({});
        let importedCount = 0;
        for (const att of sourceAttendance) {
            const exists = await AttendanceTarget.findOne({ 
                studentRegNo: att.studentRegNo, 
                timestamp: att.timestamp 
            });
            if (!exists) {
                const attData = att.toObject();
                delete attData._id;
                await AttendanceTarget.create(attData);
                importedCount++;
            }
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
            res.json({ message: 'Backup successfully uploaded to Google Drive!', id: result.id });
        } else {
            res.status(500).json({ message: 'Backup failed', error: result.error });
        }
    } catch (error) {
        res.status(500).json({ message: 'Backup engine error', error: error.message });
    }
};
