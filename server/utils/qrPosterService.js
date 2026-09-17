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
    
    const rawBaseUrl = options.baseUrl || process.env.CLIENT_URL || process.env.APP_URL || 'https://doulos.vercel.app';
    const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
    const semesterCheckInUrl = `${cleanBaseUrl}/check-in/semester`;
    const portalUrl = `${cleanBaseUrl}/portal`;

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
            // Outer fine border
            doc.rect(18, 18, pageWidth - 36, pageHeight - 36)
               .lineWidth(1)
               .strokeColor('#E2E8F0')
               .stroke();

            // Inner primary border
            doc.rect(22, 22, pageWidth - 44, pageHeight - 44)
               .lineWidth(1.5)
               .strokeColor('#BFDBFE')
               .stroke();

            // Top Header Banner
            doc.rect(23, 23, pageWidth - 46, 88)
               .fill('#0F172A');

            // --- LOGO & HEADER ---
            let logoY = 32;
            if (logoPath) {
                try {
                    doc.image(logoPath, 42, logoY, { width: 68, height: 68 });
                } catch (e) {
                    console.warn('Could not render logo in PDF:', e.message);
                }
            }

            const headerLeft = logoPath ? 122 : 42;
            const headerWidth = pageWidth - headerLeft - 42;

            doc.font('Helvetica-Bold')
               .fontSize(16)
               .fillColor('#FFFFFF')
               .text('DAYSTAR UNIVERSITY DOULOS MINISTRY', headerLeft, 38, {
                   width: headerWidth,
                   characterSpacing: 0.8
               });

            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor('#38BDF8')
               .text('OFFICIAL CHECK-IN & MEMBER PORTAL', headerLeft, 60, {
                   width: headerWidth,
                   characterSpacing: 1.2
               });

            doc.font('Helvetica')
               .fontSize(9)
               .fillColor('#94A3B8')
               .text('Athi River Campus • Valley Road Campus', headerLeft, 77, {
                   width: headerWidth
               });

            // --- SEMESTER & THEME PILL ---
            let currentY = 122;

            // Semester Badge
            doc.roundedRect(36, currentY, contentWidth, 32, 6)
               .fill('#1E3A8A');

            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#FFFFFF')
               .text(`SEMESTER CYCLE: ${semester.toUpperCase()}`, 36, currentY + 9, {
                   width: contentWidth,
                   align: 'center',
                   characterSpacing: 1
               });

            currentY += 40;

            // Theme & Scripture Card
            doc.roundedRect(36, currentY, contentWidth, 72, 8)
               .lineWidth(1)
               .fillAndStroke('#F8FAFC', '#CBD5E1');

            doc.font('Helvetica-Bold')
               .fontSize(10)
               .fillColor('#1E3A8A')
               .text(`SPIRITUAL THEME: "${theme.toUpperCase()}"`, 48, currentY + 10, {
                   width: contentWidth - 24,
                   align: 'center'
               });

            doc.font('Helvetica-Oblique')
               .fontSize(8.5)
               .fillColor('#334155')
               .text(`"${verse}"`, 48, currentY + 28, {
                   width: contentWidth - 24,
                   align: 'center',
                   lineGap: 2
               });

            currentY += 82;

            // --- QR CODE CONTAINER ---
            const qrCardWidth = 320;
            const qrCardHeight = 310;
            const qrCardX = (pageWidth - qrCardWidth) / 2;

            // Outer drop-shadow box
            doc.roundedRect(qrCardX, currentY, qrCardWidth, qrCardHeight, 16)
               .fillAndStroke('#FFFFFF', '#1D4ED8');

            // Top banner inside QR card
            doc.roundedRect(qrCardX + 1, currentY + 1, qrCardWidth - 2, 34, 15)
               .fill('#1D4ED8');

            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor('#FFFFFF')
               .text('⚡ SCAN WITH PHONE CAMERA TO CHECK IN', qrCardX, currentY + 11, {
                   width: qrCardWidth,
                   align: 'center',
                   characterSpacing: 0.5
               });

            // Embed QR Code
            const qrSize = 220;
            const qrX = (pageWidth - qrSize) / 2;
            const qrY = currentY + 44;

            doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

            // Badge under QR
            doc.font('Helvetica-Bold')
               .fontSize(8)
               .fillColor('#1E3A8A')
               .text('DOULOS SECURE ATTENDANCE TOKEN VERIFIED', qrCardX, currentY + 282, {
                   width: qrCardWidth,
                   align: 'center',
                   characterSpacing: 0.6
               });

            currentY += qrCardHeight + 14;

            // --- EASY-TO-TYPE DIRECT URL BOX ---
            doc.roundedRect(36, currentY, contentWidth, 54, 8)
               .lineWidth(1)
               .fillAndStroke('#EFF6FF', '#93C5FD');

            doc.font('Helvetica-Bold')
               .fontSize(9)
               .fillColor('#1D4ED8')
               .text('CANNOT SCAN? TYPE THE CHECK-IN LINK DIRECTLY IN YOUR BROWSER:', 48, currentY + 8, {
                   width: contentWidth - 24,
                   align: 'center'
               });

            // Prominent URL display
            const displayUrl = semesterCheckInUrl.replace(/^https?:\/\//i, '');
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor('#0F172A')
               .text(displayUrl, 48, currentY + 24, {
                   width: contentWidth - 24,
                   align: 'center',
                   characterSpacing: 0.5
               });

            currentY += 62;

            // --- 3-STEP INSTRUCTION BOXES ---
            const stepWidth = (contentWidth - 16) / 3;

            const steps = [
                {
                    num: '1',
                    title: 'SCAN OR TYPE',
                    desc: 'Scan the QR above with your camera or go to the link.'
                },
                {
                    num: '2',
                    title: 'ENTER ADMISSION NO',
                    desc: 'Input your Daystar Student Reg (e.g. 24-0000) to login.'
                },
                {
                    num: '3',
                    title: 'CONFIRM CHECK-IN',
                    desc: 'Instant verification, attendance points & Douloid rank.'
                }
            ];

            steps.forEach((st, idx) => {
                const sX = 36 + idx * (stepWidth + 8);
                doc.roundedRect(sX, currentY, stepWidth, 64, 6)
                   .lineWidth(1)
                   .fillAndStroke('#F8FAFC', '#E2E8F0');

                // Step number circle
                doc.circle(sX + 20, currentY + 20, 10)
                   .fill('#1D4ED8');

                doc.font('Helvetica-Bold')
                   .fontSize(9)
                   .fillColor('#FFFFFF')
                   .text(st.num, sX + 10, currentY + 15, {
                       width: 20,
                       align: 'center'
                   });

                doc.font('Helvetica-Bold')
                   .fontSize(8.5)
                   .fillColor('#0F172A')
                   .text(st.title, sX + 36, currentY + 13, {
                       width: stepWidth - 42
                   });

                doc.font('Helvetica')
                   .fontSize(7.5)
                   .fillColor('#64748B')
                   .text(st.desc, sX + 10, currentY + 35, {
                       width: stepWidth - 20,
                       lineGap: 1.5
                   });
            });

            currentY += 72;

            // --- FOOTER VERIFICATION ---
            doc.font('Helvetica')
               .fontSize(7)
               .fillColor('#94A3B8')
               .text(`Daystar University Doulos Ministry • General Directorate Authorization • Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • Valid for ${semester}`, 36, pageHeight - 34, {
                   width: contentWidth,
                   align: 'center'
               });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
