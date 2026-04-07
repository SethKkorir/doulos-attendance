import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import Member from '../models/Member.js';
import Meeting from '../models/Meeting.js';
import Attendance from '../models/Attendance.js';
import Training from '../models/Training.js';
import Payment from '../models/Payment.js';
import Settings from '../models/Settings.js';
import Feedback from '../models/Feedback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Performs a full database dump to a private GitHub repository
 */
export const runDatabaseBackup = async () => {
    console.log('[GITHUB-BACKUP] Initiating cloud sync...');
    
    try {
        // 1. Collect Data
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '2.0 (GitHub)',
            data: {
                members: await Member.find({}),
                meetings: await Meeting.find({}),
                attendance: await Attendance.find({}),
                trainings: await Training.find({}),
                payments: await Payment.find({}),
                settings: await Settings.find({}),
                feedback: await Feedback.find({})
            }
        };

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const fileName = `snapshot_${timestamp}.json`;
        const content = Buffer.from(JSON.stringify(backupData, null, 2)).toString('base64');

        // 2. GitHub API Config
        const token = process.env.GITHUB_BACKUP_TOKEN;
        const repo = process.env.GITHUB_BACKUP_REPO; // Format: username/repo-name
        
        if (!token || !repo) {
            throw new Error('GITHUB_BACKUP_TOKEN or GITHUB_BACKUP_REPO missing in .env');
        }

        const url = `https://api.github.com/repos/${repo}/contents/backups/${fileName}`;

        // 3. Upload to GitHub
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Automated Nightly Backup: ${new Date().toLocaleDateString()}`,
                content: content,
                branch: 'main'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'GitHub API Error');
        }

        console.log(`[GITHUB-BACKUP] SUCCESS! Saved as backups/${fileName}`);
        return { success: true, url: result.content.html_url };

    } catch (error) {
        console.error('[GITHUB-BACKUP] FAILED:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Initializes the Nightly Backup Cron Job
 */
export const initBackupScheduler = () => {
    // Run every day at Midnight (00:00)
    cron.schedule('0 0 * * *', () => {
        runDatabaseBackup();
    }, {
        scheduled: true,
        timezone: "Africa/Nairobi"
    });

    console.log('[GITHUB-BACKUP] Nightly Scheduler initialized (Runs at 00:00 EAT)');
};
