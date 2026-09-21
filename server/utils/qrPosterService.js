import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import Setting from '../models/Settings.js';

/**
 * Generate a high-resolution, printable A4 PDF poster for the semester check-in QR code.
 * @param {Object} options - Poster configuration options
 * @param {string} [options.semester] - Semester code (e.g., 'SEP-DEC 2026')
 * @param {string} [options.theme] - Spiritual theme
 * @param {string} [options.verse] - Anchor Scripture / memory verse
 * @param {string} [options.baseUrl] - Base URL of the application
 * @param {string} [options.customQrText] - Custom URL or token to encode in QR
 * @returns {Promise<Buffer>} PDF Buffer
 */
export const generateSemesterQRPosterPDF = async (options = {}) => {
    // 1. Resolve settings from DB if not passed
    const currentSemSetting = await Setting.findOne({ key: 'current_semester' });
    const themeSetting = await Setting.findOne({ key: 'semester_theme' });
    const verseSetting = await Setting.findOne({ key: 'semester_verse' });
    const masterQrTokenSetting = await Setting.findOne({ key: 'master_semester_qr_token' });

    const semester = options.semester || currentSemSetting?.value || 'SEP-DEC 2026';
    const theme = options.theme || themeSetting?.value || 'Rooted & Built Up In Him';
    const verse = options.verse || verseSetting?.value || 'Colossians 2:6-7 — As you received Christ Jesus the Lord, so walk in Him, rooted and built up in Him and established in the faith.';
    const slogan = options.slogan || 'Bondservant';

    const rawBaseUrl = options.baseUrl || process.env.CLIENT_URL || process.env.APP_URL || process.env.VITE_APP_URL || 'https://doulos-attendance.vercel.app';
    const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
    const semesterCheckInUrl = `${cleanBaseUrl}/check-in/semester`;
    const portalUrl = `${cleanBaseUrl}/portal`;
    const displayUrl = `${cleanBaseUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '')}/portal`;

    // What the QR code scans to: Direct semester check-in URL that synchronizes with the active meeting
    const qrPayload = options.customQrText || semesterCheckInUrl;

    // 2. Generate QR code image buffer
    const qrBuffer = await QRCode.toBuffer(qrPayload, {
        errorCorrectionLevel: 'H',
        type: 'png',
        margin: 1,
        width: 650,
        color: {
            dark: '#0F172A',
            light: '#FFFFFF'
        }
    });

    // 3. Locate Doulos logo
    const logoPaths = [
        path.resolve(process.cwd(), 'assets', 'logo.png'),
        path.resolve(process.cwd(), 'server', 'assets', 'logo.png'),
        path.resolve(process.cwd(), '..', 'client', 'public', 'logo.png'),
        path.resolve(process.cwd(), 'client', 'public', 'logo.png')
    ];
    let logoPath = null;
    for (const p of logoPaths) {
        if (fs.existsSync(p)) {
            logoPath = p;
            break;
        }
    }

    return new Promise((resolve, reject) => {
        try {
            // A4 dimensions: 595.28 x 841.89 points
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 28, bottom: 28, left: 36, right: 36 },
                info: {
                    Title: `Doulos Official Check-In Poster - ${semester}`,
                    Author: 'Daystar University Doulos Ministry',
                    Subject: 'Official Semester QR Check-In Poster'
                }
            });

            const buffers = [];
            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', err => reject(err));

            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const contentWidth = pageWidth - 72; // 523.28 pt

            // --- DECORATIVE BORDER & BACKGROUND ACCENTS ---
            doc.rect(18, 18, pageWidth - 36, pageHeight - 36)
               .lineWidth(1)
               .strokeColor('#E2E8F0')
               .stroke();

            doc.rect(22, 22, pageWidth - 44, pageHeight - 44)
               .lineWidth(1.5)
               .strokeColor('#BFDBFE')
               .stroke();

            // Soft blue top glow
            doc.rect(32, 32, pageWidth - 64, 120)
               .fill('#F8FAFC');

            // --- CENTRAL LOGO / BRAND ---
            let currentY = 42;
            const logoCenterX = pageWidth / 2 - 54;

            if (logoPath) {
                try {
                    doc.image(logoPath, logoCenterX, currentY, { width: 108, height: 108 });
                } catch (e) {
                    console.warn('Could not render logo in PDF:', e.message);
                }
            }

            currentY += 118;
            currentY += 10;

            // Semester title badge
            doc.roundedRect(38, currentY, contentWidth - 4, 28, 8)
               .fill('#0F172A');

            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#FFFFFF')
               .text(`${semester.toUpperCase()} MEETING CHECK QR CODE`, 38, currentY + 7, {
                   width: contentWidth - 4,
                   align: 'center',
                   characterSpacing: 1.1
               });

            currentY += 40;

            // Theme card
            doc.roundedRect(38, currentY, contentWidth - 4, 48, 8)
               .fill('#E0F2FE');

            doc.font('Helvetica-Bold')
               .fontSize(9.5)
               .fillColor('#0F172A')
               .text('SEMESTER THEME', 48, currentY + 6, {
                   width: contentWidth - 28,
                   align: 'center',
                   characterSpacing: 1.2
               });

            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor('#1E3A8A')
               .text(theme.toUpperCase(), 48, currentY + 20, {
                   width: contentWidth - 28,
                   align: 'center'
               });

            currentY += 62;

            // --- LARGE QR CODE BLOCK ---
            const qrCardWidth = 290;
            const qrCardHeight = 230;
            const qrCardX = (pageWidth - qrCardWidth) / 2;

            doc.roundedRect(qrCardX, currentY, qrCardWidth, qrCardHeight, 18)
               .fillAndStroke('#FFFFFF', '#0F172A');

            doc.roundedRect(qrCardX + 10, currentY + 10, qrCardWidth - 20, 28, 10)
               .fill('#0F172A');

            doc.font('Helvetica-Bold')
               .fontSize(9)
               .fillColor('#FFFFFF')
               .text('SCAN TO CHECK IN', qrCardX, currentY + 18, {
                   width: qrCardWidth,
                   align: 'center',
                   characterSpacing: 1.1
               });

            const qrSize = 165;
            const qrX = (pageWidth - qrSize) / 2;
            const qrY = currentY + 42;
            doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

            doc.font('Helvetica-Bold')
               .fontSize(7.1)
               .fillColor('#0F172A')
               .text('SECURE CHECK-IN • LIVE SESSION • CAMPUS VERIFIED', qrCardX, currentY + qrCardHeight - 16, {
                   width: qrCardWidth,
                   align: 'center',
                   characterSpacing: 0.8
               });

            currentY += qrCardHeight + 8;

            // Instruction block
            doc.roundedRect(38, currentY, contentWidth - 4, 52, 8)
               .fill('#F8FAFC');

            doc.font('Helvetica-Bold')
               .fontSize(9)
               .fillColor('#1D4ED8')
               .text('INSTRUCTIONS', 48, currentY + 7, {
                   width: contentWidth - 28,
                   align: 'center'
               });

            doc.font('Helvetica')
               .fontSize(8)
               .fillColor('#334155')
               .text('1. Open the portal or scan with your phone camera.', 48, currentY + 22, {
                   width: contentWidth - 28
               });
            doc.font('Helvetica')
               .fontSize(8)
               .fillColor('#334155')
               .text('2. Enter your admission number and confirm your check-in.', 48, currentY + 34, {
                   width: contentWidth - 28
               });
            doc.font('Helvetica')
               .fontSize(8)
               .fillColor('#334155')
               .text('3. Stay within the active venue window and geofence.', 48, currentY + 46, {
                   width: contentWidth - 28
               });

            currentY += 66;

            // Direct URL display box
            doc.roundedRect(38, currentY, contentWidth - 4, 30, 8)
               .fill('#EFF6FF');

            doc.font('Helvetica-Bold')
               .fontSize(8)
               .fillColor('#1E3A8A')
               .text('PORTAL', 48, currentY + 7, {
                   width: 60,
                   align: 'left'
               });

            doc.font('Helvetica-Bold')
               .fontSize(11.2)
               .fillColor('#0F172A')
               .text(displayUrl, 110, currentY + 7, {
                   width: contentWidth - 130,
                   align: 'left'
               });

            currentY += 42;

            // --- FOOTER VERIFICATION ---
            const footerText = `Daystar University Doulos Ministry • ${semester.toUpperCase()} • Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
            doc.font('Helvetica')
               .fontSize(6.25)
               .fillColor('#94A3B8')
               .text(footerText, 36, pageHeight - 26, {
                   width: contentWidth,
                   align: 'center'
               });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
