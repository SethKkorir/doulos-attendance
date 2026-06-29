import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import Attendance from '../models/Attendance.js';
import Member from '../models/Member.js';
import Settings from '../models/Settings.js';

// Ensure env variables are loaded
const rootEnvPath = path.resolve(process.cwd(), '.env');
const parentEnvPath = path.resolve(process.cwd(), '..', '.env');
dotenv.config({ path: rootEnvPath });
if (!process.env.MONGO_URI) {
    dotenv.config({ path: parentEnvPath });
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'kipzseth@gmail.com',
        pass: process.env.EMAIL_PASS || 'oiav xqvf pffk lbzf'
    }
});

/**
 * Dispatches an intelligent, beautifully formatted HTML system alert.
 */
export const sendSystemAlert = async (type, title, details = {}) => {
    try {
        const toEmail = process.env.REPORT_EMAILS || process.env.EMAIL_USER || 'kipzseth@gmail.com';
        
        let typeColor = '#3b82f6'; // default blue
        let typeLabel = 'INFO';

        if (type === 'CRITICAL') {
            typeColor = '#ef4444'; // bright red
            typeLabel = '🚨 CRITICAL SYSTEM DOWNTIME';
        } else if (type === 'RECOVERY') {
            typeColor = '#22c55e'; // vibrant green
            typeLabel = '✅ SERVICE FULLY RESTORED';
        } else if (type === 'EXCEPTION') {
            typeColor = '#eab308'; // glowing amber
            typeLabel = '⚠️ UNHANDLED SERVER EXCEPTION';
        }

        const detailRows = Object.entries(details)
            .map(([key, val]) => `
                <tr>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 700; width: 140px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${key}</td>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px; font-family: monospace; word-break: break-word;">${val}</td>
                </tr>
            `).join('');

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 30px auto; background-color: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6); overflow: hidden;">
                <tr>
                    <td style="background-color: ${typeColor}; padding: 24px 30px; text-align: left;">
                        <span style="font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #020617; background-color: rgba(255,255,255,0.85); padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">${typeLabel}</span>
                        <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; color: #020617; line-height: 1.2; letter-spacing: -0.5px;">${title}</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 30px;">
                        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                            The Doulos Attendance System Monitor has detected a shift in platform health status. Diagnostic details are mapped below:
                        </p>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                            ${detailRows}
                        </table>
                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                            * Action: If critical, please access your MongoDB Atlas whitelist configurations, inspect the Vercel logs dashboard, or execute quick diagnostics to ensure operations are unblocked.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.04); background-color: #020617; text-align: center; font-size: 11px; color: #475569; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                        Doulos Attendance Monitor System &bull; &copy; ${new Date().getFullYear()}
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"Doulos System Monitor" <${process.env.EMAIL_USER || 'kipzseth@gmail.com'}>`,
            to: toEmail,
            subject: `[SYSTEM ALERT] ${title}`,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ System alert email dispatched successfully: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to dispatch system alert email:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Dispatches a meeting summary email with PDF (Roster) and CSV (Questionnaire responses) attachments.
 */
export const sendMeetingSummaryEmail = async (meetingId, isTraining = false) => {
    try {
        console.log(`[EMAIL-REPORT] Initiating summary report for ${isTraining ? 'Training' : 'Meeting'} ID: ${meetingId}...`);
        
        // 1. Fetch Meeting/Training details
        let session = null;
        if (isTraining) {
            session = await Training.findById(meetingId);
        } else {
            session = await Meeting.findById(meetingId);
        }
        
        if (!session) {
            console.error(`[EMAIL-REPORT] Session not found for ID: ${meetingId}`);
            return { success: false, error: 'Session not found' };
        }
        
        // 2. Fetch all Attendance records for this session
        const query = isTraining 
            ? { trainingId: meetingId, trainingDay: session.activeDay || 1 }
            : { meeting: meetingId };
            
        const attendances = await Attendance.find(query).sort({ timestamp: 1 });
        
        // Fetch registry info to ensure name is correct
        const regNos = attendances.map(a => a.studentRegNo);
        const members = await Member.find({ studentRegNo: { $in: regNos } });
        const memberMap = new Map(members.map(m => [m.studentRegNo.toUpperCase().trim(), m.name]));

        const douloidsCount = attendances.filter(a => a.memberType === 'Douloid').length;
        const recruitsCount = attendances.filter(a => a.memberType === 'Recruit').length;
        const visitorsCount = attendances.filter(a => a.memberType === 'Visitor').length;

        // 3. Generate CSV (Questionnaire Answers)
        // Find all unique custom keys from responses
        const uniqueKeys = new Set();
        attendances.forEach(a => {
            if (a.responses && a.responses instanceof Map) {
                for (const key of a.responses.keys()) {
                    if (key !== 'studentRegNo' && key !== 'studentName' && key !== 'dailyQuestionAnswer') {
                        uniqueKeys.add(key);
                    }
                }
            }
        });
        const customHeaderKeys = Array.from(uniqueKeys);

        const csvHeaders = [
            'No.',
            'Student Name',
            'Registration Number',
            'Category',
            'Campus Location',
            'Check-in Time',
            'Question of Day Answer'
        ];
        customHeaderKeys.forEach(k => csvHeaders.push(k));

        const csvRows = attendances.map((a, idx) => {
            const name = memberMap.get(a.studentRegNo.toUpperCase().trim()) || 'Unknown (Not in Registry)';
            const regNo = a.studentRegNo;
            const category = a.memberType || 'Visitor';
            const campus = a.campus || session.campus || 'Athi River';
            const time = new Date(a.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            const qAnswer = a.questionOfDay || '';
            const customAnswers = customHeaderKeys.map(k => {
                if (a.responses && a.responses instanceof Map) {
                    return a.responses.get(k) || '';
                }
                return '';
            });

            return [
                String(idx + 1),
                `"${name.replace(/"/g, '""')}"`,
                `"${regNo.replace(/"/g, '""')}"`,
                `"${category.replace(/"/g, '""')}"`,
                `"${campus.replace(/"/g, '""')}"`,
                `"${time.replace(/"/g, '""')}"`,
                `"${qAnswer.replace(/"/g, '""')}"`,
                ...customAnswers.map(ans => `"${String(ans).replace(/"/g, '""')}"`)
            ].join(',');
        });

        const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\n'); // Add BOM for Excel UTF-8 support
        const csvBuffer = Buffer.from(csvContent, 'utf-8');

        // 4. Generate PDF (Attendance Roster table)
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        const pdfChunks = [];
        
        doc.on('data', chunk => pdfChunks.push(chunk));
        
        // Wait for PDF generation to end
        const pdfBufferPromise = new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(pdfChunks)));
        });

        // Resolve logo.png path
        let logoPath = path.resolve('../client/public/logo.png');
        if (!fs.existsSync(logoPath)) {
            logoPath = path.resolve('./client/public/logo.png');
        }

        // Draw PDF Content
        doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold');
        doc.moveDown(3); // spacing for header
        doc.text(session.name.toUpperCase(), { align: 'center' });
        doc.fontSize(9).fillColor('#25AAE1').font('Helvetica-Bold').text(isTraining ? 'OFFICIAL TRAINING ROSTER & LEDGER' : 'OFFICIAL MEETING ROSTER & LEDGER', { align: 'center' });
        doc.moveDown(1.5);

        // Stats boxes (Row)
        const startY = doc.y;
        doc.rect(50, startY, 150, 48).fill('#f8fafc').stroke('#e2e8f0');
        doc.rect(222, startY, 150, 48).fill('#f8fafc').stroke('#e2e8f0');
        doc.rect(395, startY, 150, 48).fill('#f8fafc').stroke('#e2e8f0');

        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold');
        doc.text('TOTAL ATTENDANCE', 60, startY + 10);
        doc.text('DOULOIDS PRESENT', 232, startY + 10);
        doc.text('RECRUITS & VISITORS', 405, startY + 10);

        doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold');
        doc.text(String(attendances.length), 60, startY + 22);
        doc.text(String(douloidsCount), 232, startY + 22);
        doc.text(String(recruitsCount + visitorsCount), 405, startY + 22);

        doc.moveDown(3.5);

        // Table Header
        const headerY = doc.y;
        doc.rect(50, headerY, 495, 20).fill('#475569');
        doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('#', 60, headerY + 6, { width: 25 });
        doc.text('STUDENT NAME', 90, headerY + 6, { width: 180 });
        doc.text('ADMISSION NO.', 280, headerY + 6, { width: 100 });
        doc.text('CATEGORY', 390, headerY + 6, { width: 80 });
        doc.text('TIME', 480, headerY + 6, { width: 50 });
        
        doc.moveDown(1.2);
        doc.font('Helvetica').fontSize(8.5).fillColor('#334155');

        // Draw Table Rows
        attendances.forEach((a, idx) => {
            const name = memberMap.get(a.studentRegNo.toUpperCase().trim()) || 'Unknown (Not in Registry)';
            const regNo = a.studentRegNo;
            const category = a.memberType || 'Visitor';
            const time = new Date(a.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            // Check if page needs to break
            if (doc.y > 670) {
                doc.addPage();
                const newHeaderY = doc.y;
                doc.rect(50, newHeaderY, 495, 20).fill('#475569');
                doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
                doc.text('#', 60, newHeaderY + 6, { width: 25 });
                doc.text('STUDENT NAME', 90, newHeaderY + 6, { width: 180 });
                doc.text('ADMISSION NO.', 280, newHeaderY + 6, { width: 100 });
                doc.text('CATEGORY', 390, newHeaderY + 6, { width: 80 });
                doc.text('TIME', 480, newHeaderY + 6, { width: 50 });
                doc.moveDown(1.2);
                doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
            }

            const rowY = doc.y;
            if (idx % 2 === 1) {
                doc.rect(50, rowY - 2, 495, 14).fill('#f8fafc');
                doc.fillColor('#334155');
            }

            doc.text(String(idx + 1), 60, rowY, { width: 25 });
            doc.font('Helvetica-Bold').text(name, 90, rowY, { width: 180 });
            doc.font('Helvetica').text(regNo, 280, rowY, { width: 100 });
            doc.text(category, 390, rowY, { width: 80 });
            doc.text(time, 480, rowY, { width: 50 });

            doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, rowY + 11).lineTo(545, rowY + 11).stroke();
            doc.moveDown(0.85);
        });

        // 5. Draw Watermarks, Headers, and Footers to all buffered pages
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);

            // --- DRAW HEADER ON EVERY PAGE ---
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 40, { width: 45, height: 45 });
            }
            doc.save();
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');
            doc.text('DOULOS TEAM BUILDERS', 105, 46);
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#64748b');
            doc.text('AND FREEDOM BASE CAMP', 105, 56);
            doc.restore();

            doc.save();
            doc.rect(240, 51, 305, 4).fill('#F43F5E');
            doc.restore();

            // --- DRAW WATERMARK ---
            if (fs.existsSync(logoPath)) {
                doc.save();
                doc.opacity(0.02); // subtle logo watermark
                doc.image(logoPath, 172.6, 295.9, { width: 250, height: 250 });
                doc.restore();
            }

            // --- DRAW FOOTER ---
            doc.save();
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#94a3b8');
            doc.text(`Page ${i + 1} of ${range.count}`, 450, 740, { width: 95, align: 'right' });
            doc.restore();

            // Contact Info
            doc.save();
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748b');
            doc.text('📞 +254 795 640 790', 50, 752, { width: 140, align: 'left' });
            doc.text('📍 Freedom Base - Daystar University Athi', 190, 752, { width: 210, align: 'center' });
            doc.text('✉️ doulos@daystar.ac.ke  •  https://www.daystar.ac.ke/doulos.html', 400, 752, { width: 145, align: 'right' });
            doc.restore();

            // Slanted vector bars at the bottom
            // Pink bar
            doc.save();
            doc.fillColor('#F43F5E');
            doc.moveTo(50, 765)
               .lineTo(370, 765)
               .lineTo(350, 783)
               .lineTo(50, 783)
               .closePath()
               .fill();
            doc.restore();

            // Slate bar
            doc.save();
            doc.fillColor('#475569');
            doc.moveTo(380, 765)
               .lineTo(445, 765)
               .lineTo(425, 783)
               .lineTo(360, 783)
               .closePath()
               .fill();
            doc.restore();

            // Light gray bar
            doc.save();
            doc.fillColor('#94a3b8');
            doc.moveTo(455, 765)
               .lineTo(545, 765)
               .lineTo(545, 783)
               .lineTo(475, 783)
               .closePath()
               .fill();
            doc.restore();
        }

        doc.end();
        const pdfBuffer = await pdfBufferPromise;

        // 5. Send email to configured list or fall back
        const toEmail = process.env.REPORT_EMAILS || process.env.EMAIL_USER || 'kipzseth@gmail.com';
        const displayDate = new Date(session.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${session.name} Summary Report</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 30px auto; background-color: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6); overflow: hidden;">
                <!-- Header Banner -->
                <tr>
                    <td style="background-color: #25AAE1; padding: 24px 30px; text-align: left;">
                        <span style="font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #020617; background-color: rgba(255,255,255,0.85); padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">Finalized Session Report</span>
                        <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; color: #020617; line-height: 1.2; letter-spacing: -0.5px;">${session.name}</h1>
                    </td>
                </tr>
                
                <!-- Content Section -->
                <tr>
                    <td style="padding: 30px;">
                        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                            Hello, the attendance check-in session has been finalized. Find below the session summary statistics and the attached reports:
                        </p>
                        
                        <!-- Details Table -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                            <tr>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 700; width: 140px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Campus</td>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px;">${session.campus || 'Athi River'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 700; width: 140px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Date</td>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px;">${displayDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 700; width: 140px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Total Present</td>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #25AAE1; font-size: 13px; font-weight: 800;">${attendances.length} Checked In</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 700; width: 140px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Douloids</td>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #fbbf24; font-size: 13px; font-weight: 800;">${douloidsCount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 700; width: 140px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Recruits</td>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #25AAE1; font-size: 13px; font-weight: 800;">${recruitsCount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-weight: 700; width: 140px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Visitors</td>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #a78bfa; font-size: 13px; font-weight: 800;">${visitorsCount}</td>
                            </tr>
                        </table>
                        
                        <p style="margin: 0 0 10px 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                            Attached you will find:
                        </p>
                        <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
                            <li><strong>Attendance_Roster_${session.code}.pdf:</strong> A clean, printable PDF showing all students categorized.</li>
                            <li><strong>Questionnaire_Responses_${session.code}.csv:</strong> An Excel-compatible spreadsheet containing all questionnaire answers.</li>
                        </ul>
                    </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                    <td style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.04); background-color: #020617; text-align: center; font-size: 11px; color: #475569; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                        DOULOS Team Builders & Freedom Base Camp &bull; Community, Service, Adventure
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"Doulos System Reports" <${process.env.EMAIL_USER || 'kipzseth@gmail.com'}>`,
            to: toEmail,
            subject: `[ATTENDANCE REPORT] ${session.name} (${session.campus || 'Athi River'}) - ${displayDate}`,
            html,
            attachments: [
                {
                    filename: `Attendance_Roster_${session.code}.pdf`,
                    content: pdfBuffer
                },
                {
                    filename: `Questionnaire_Responses_${session.code}.csv`,
                    content: csvBuffer
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL-REPORT] Roster and CSV sent successfully to: ${toEmail}. Message ID: ${info.messageId}`);
        
        // Trigger check-in errors report email
        sendCheckInErrorsEmail(meetingId, isTraining).catch(err => {
            console.error("Failed to send check-in errors email:", err);
        });

        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Failed to generate or send session summary report email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Dispatches a detailed check-in errors audit report email to admins.
 * 
 * @param {string} sessionId - ID of the finalized Meeting/Training
 * @param {boolean} isTraining - True if session is Training, false if Meeting
 */
export const sendCheckInErrorsEmail = async (sessionId, isTraining = false) => {
    try {
        let session;
        if (isTraining) {
            session = await Training.findById(sessionId);
        } else {
            session = await Meeting.findById(sessionId);
        }

        if (!session) {
            console.error(`[ERROR-EMAIL] Session not found for ID: ${sessionId}`);
            return { success: false, error: 'Session not found' };
        }

        // Calculate time window (from session creation/activation to now)
        const openedAt = session.createdAt ? new Date(session.createdAt) : new Date(Date.now() - 12 * 60 * 60 * 1000);
        
        let errors = [];
        if (mongoose.connection.readyState === 1) {
            errors = await mongoose.connection.db.collection('scanerrors').find({
                campus: session.campus,
                timestamp: { $gte: openedAt }
            }).sort({ timestamp: 1 }).toArray();
        }

        // Resolve student names from registry
        const regNos = errors.map(e => e.studentRegNo).filter(Boolean);
        const members = await Member.find({ studentRegNo: { $in: regNos } });
        const memberMap = new Map(members.map(m => [m.studentRegNo.toUpperCase().trim(), m.name]));

        const toEmail = process.env.REPORT_EMAILS || process.env.EMAIL_USER || 'kipzseth@gmail.com';
        const displayDate = new Date(session.date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        let html = '';
        let subject = '';

        if (errors.length === 0) {
            // "say less everything went well"
            subject = `[CHECK-IN STATUS] \&nbsp;${session.name} (${session.campus || 'Athi River'}) - All Successful`;
            subject = subject.replace('&nbsp;', '');
            html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Check-in Status Report</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 30px auto; background-color: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6); overflow: hidden;">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #22c55e; padding: 24px 30px; text-align: left;">
                            <span style="font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #020617; background-color: rgba(255,255,255,0.85); padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">Session Check-in Status</span>
                            <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; color: #020617; line-height: 1.2; letter-spacing: -0.5px;">${session.name}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                                Hello, the check-in session for <strong>${session.name}</strong> has been audited.
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 20px; text-align: center; color: #22c55e; font-size: 16px; font-weight: 800;">
                                        🟢 Everything went well! No check-in errors were recorded.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.04); background-color: #020617; text-align: center; font-size: 11px; color: #475569; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                            DOULOS Team Builders & Freedom Base Camp
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `;
        } else {
            subject = `[CHECK-IN ERRORS] ${session.name} (\&nbsp;${session.campus || 'Athi River'}) - Issues Flagged`;
            subject = subject.replace('&nbsp;', '');

            const errorRows = errors.map(e => {
                const studentName = memberMap.get(e.studentRegNo.toUpperCase().trim()) || 'Unknown (Not in Registry)';
                const formattedTime = e.timestamp 
                    ? new Date(e.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'N/A';
                return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 12px; font-weight: bold;">
                        ${studentName}<br/>
                        <span style="font-family: monospace; font-size: 10px; color: #94a3b8;">${e.studentRegNo}</span>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #f43f5e; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${e.error || 'Check-in Error'}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #cbd5e1; font-size: 12px;">
                        ${e.desc || 'No description provided.'}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 11px; font-family: monospace; text-align: right;">
                        ${formattedTime}
                    </td>
                </tr>
                `;
            }).join('');

            html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Check-in Errors Report</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 30px auto; background-color: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6); overflow: hidden;">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #f43f5e; padding: 24px 30px; text-align: left;">
                            <span style="font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #020617; background-color: rgba(255,255,255,0.85); padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">Check-in Errors Logged</span>
                            <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; color: #020617; line-height: 1.2; letter-spacing: -0.5px;">${session.name}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                                Hello, the check-in session for <strong>${session.name}</strong> on <strong>${displayDate}</strong> has concluded. The system logged the following check-in exceptions or failures:
                            </p>
                            
                            <!-- Errors Table -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                                <thead>
                                    <tr style="background-color: #1e293b;">
                                        <th style="padding: 10px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Student</th>
                                        <th style="padding: 10px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Issue Type</th>
                                        <th style="padding: 10px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Description</th>
                                        <th style="padding: 10px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${errorRows}
                                </tbody>
                            </table>
                            
                            <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                                💡 Note: If a student successfully checked in later, their previous errors were cleared from the active queue, but the remaining records above represent unsolved check-in issues for this session.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.04); background-color: #020617; text-align: center; font-size: 11px; color: #475569; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                            DOULOS Team Builders & Freedom Base Camp
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `;
        }

        const mailOptions = {
            from: `"Doulos System Reports" <${process.env.EMAIL_USER || 'kipzseth@gmail.com'}>`,
            to: toEmail,
            subject: subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[ERROR-EMAIL] Errors report sent successfully to: ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send check-in errors email:', error);
        return { success: false, error: error.message };
    }
};
