import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Ensure env variables are loaded
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'kipzseth@gmail.com',
        pass: process.env.EMAIL_PASS || 'oiav xqvf pffk lbzf'
    }
});

/**
 * Dispatches an intelligent, beautifully formatted HTML system alert.
 * 
 * @param {string} type - 'CRITICAL' | 'RECOVERY' | 'EXCEPTION'
 * @param {string} title - Human-readable summary of the alert
 * @param {object} details - Key-value pair details of the issue
 */
export const sendSystemAlert = async (type, title, details = {}) => {
    try {
        const toEmail = 'kipzseth@gmail.com';
        
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

        // Build elegant key-value rows dynamically
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
                <!-- Header Banner -->
                <tr>
                    <td style="background-color: ${typeColor}; padding: 24px 30px; text-align: left;">
                        <span style="font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #020617; background-color: rgba(255,255,255,0.85); padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">${typeLabel}</span>
                        <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; color: #020617; line-height: 1.2; letter-spacing: -0.5px;">${title}</h1>
                    </td>
                </tr>
                
                <!-- Content Section -->
                <tr>
                    <td style="padding: 30px;">
                        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                            The Doulos Attendance System Monitor has detected a shift in platform health status. Diagnostic details are mapped below:
                        </p>
                        
                        <!-- Details Table -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                            ${detailRows}
                        </table>
                        
                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                            * Action: If critical, please access your MongoDB Atlas whitelist configurations, inspect the Vercel logs dashboard, or execute quick diagnostics to ensure operations are unblocked.
                        </p>
                    </td>
                </tr>
                
                <!-- Footer -->
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
