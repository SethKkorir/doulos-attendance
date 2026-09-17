import crypto from 'crypto';
import CheckInToken from '../models/CheckInToken.js';
import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';
import { resolveMeetingOrTraining } from '../utils/sessionResolver.js';

/**
 * Issue a single-use token valid for ~60s
 * POST /api/tokens/issue
 */
export const issueToken = async (req, res) => {
    try {
        const rawCode = req.body.meetingCode || req.query.meetingCode || req.params.meetingCode;
        if (!rawCode) {
            return res.status(400).json({ message: 'Meeting code is required to issue a token.' });
        }

        const preferredCampus = req.body.campus || req.query.campus || null;
        const { meeting, isTraining, resolutionType, isSemesterLink } = await resolveMeetingOrTraining(rawCode, preferredCampus);

        if (!meeting) {
            if (isSemesterLink) {
                return res.status(404).json({
                    message: 'No active meeting or training in session for this semester right now. The Semester QR code requires an active session in progress.'
                });
            }
            return res.status(404).json({ message: 'No active meeting or training found for this QR code.' });
        }

        const resolvedCode = meeting.code || String(rawCode).trim().toLowerCase();

        // 2. Generate single-use cryptographic token
        const token = 'ck_' + crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 65 * 1000); // 65 seconds grace

        const tokenDoc = new CheckInToken({
            token,
            meetingCode: resolvedCode,
            meetingId: meeting._id,
            expiresAt,
            isUsed: false,
            stampedDeviceId: null,
            fallbackUsed: false
        });

        await tokenDoc.save();

        return res.status(201).json({
            success: true,
            token,
            expiresAt,
            validitySeconds: 60,
            meetingCode: resolvedCode,
            meetingName: meeting.name,
            campus: meeting.campus
        });

    } catch (err) {
        console.error('Error issuing check-in token:', err);
        return res.status(500).json({ message: 'Failed to issue check-in token. Please try again.' });
    }
};

/**
 * Stamp token with device fingerprint on GPS denial and extend window to 2 minutes
 * POST /api/tokens/stamp-fallback
 */
export const stampFallback = async (req, res) => {
    try {
        const { token, deviceId } = req.body;

        if (!token || !deviceId) {
            return res.status(400).json({ message: 'Token and device signature are required for fallback check-in.' });
        }

        // Atomic conditional update (Prevents race conditions)
        const updatedToken = await CheckInToken.findOneAndUpdate(
            {
                token,
                isUsed: false,
                stampedDeviceId: null,
                expiresAt: { $gt: new Date() }
            },
            {
                $set: {
                    stampedDeviceId: deviceId,
                    fallbackUsed: true,
                    expiresAt: new Date(Date.now() + 120 * 1000) // Extend to 2 minutes from now
                }
            },
            { new: true }
        );

        if (!updatedToken) {
            // Check why it failed
            const existing = await CheckInToken.findOne({ token });
            if (!existing) {
                return res.status(404).json({ message: 'Invalid or expired check-in token. Please scan the QR code again.' });
            }
            if (existing.isUsed) {
                return res.status(409).json({ message: 'This check-in token has already been used.' });
            }
            if (existing.stampedDeviceId && existing.stampedDeviceId !== deviceId) {
                return res.status(403).json({ message: 'This fallback token is locked to another device signature.' });
            }
            if (existing.expiresAt <= new Date()) {
                return res.status(410).json({ message: 'Check-in token expired. Please scan the QR code again.' });
            }
            return res.status(400).json({ message: 'Unable to process fallback check-in. Please scan the QR again.' });
        }

        return res.json({
            success: true,
            message: 'Fallback verified. Token bound to this device for 2 minutes.',
            expiresAt: updatedToken.expiresAt
        });

    } catch (err) {
        console.error('Error stamping fallback token:', err);
        return res.status(500).json({ message: 'Failed to stamp fallback token.' });
    }
};
