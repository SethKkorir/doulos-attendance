import express from 'express';
import {
    getExecutiveRadar,
    getRequisitions,
    createRequisition,
    advanceRequisition,
    getCouncilMinutes,
    createCouncilMinutes,
    lockCouncilMinutes,
    getMemberServiceTranscript,
    validateStationAssignment,
    getIncidentLogs,
    createIncidentLog,
    closeIncidentLog,
    getWelfareLiveTicker,
    getAbsenceRadar,
    executeManualCheckin,
    getMpesaQueue,
    verifyMpesaPayment,
    getGearAssets,
    createGearAsset,
    logGearInspection,
    getBirthdayQueue,
    updateBirthdayPosterStatus,
    resetDeviceLock,
    mintMasterSemesterQr,
    getHandoverDossiers,
    submitHandoverDossier,
    sealHandoverDossier,
    executeSemesterRollover,
    rollbackSemesterRollover,
    getRolloverSnapshots
} from '../controllers/councilController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Executive (G1 / G2)
router.get('/executive-radar', verifyAdmin, getExecutiveRadar);
router.get('/rollover/snapshots', verifyAdmin, getRolloverSnapshots);
router.post('/rollover/execute', verifyAdmin, executeSemesterRollover);
router.post('/rollover/rollback', verifyAdmin, rollbackSemesterRollover);

// Requisitions (G8 -> G5 -> G7 -> G1)
router.get('/requisitions', verifyAdmin, getRequisitions);
router.post('/requisitions', verifyAdmin, createRequisition);
router.post('/requisitions/:id/advance', verifyAdmin, advanceRequisition);

// Secretariat & Transcripts (G3)
router.get('/minutes', verifyAdmin, getCouncilMinutes);
router.post('/minutes', verifyAdmin, createCouncilMinutes);
router.post('/minutes/:id/lock', verifyAdmin, lockCouncilMinutes);
router.get('/transcripts/:memberId', verifyAdmin, getMemberServiceTranscript);

// Logistics & Expeditions (G4)
router.post('/expeditions/validate-station', verifyAdmin, validateStationAssignment);

// Safety Incidents (G5)
router.get('/incidents', verifyAdmin, getIncidentLogs);
router.post('/incidents', verifyAdmin, createIncidentLog);
router.patch('/incidents/:id/close', verifyAdmin, closeIncidentLog);

// Welfare & Live Cockpit (G6)
router.get('/welfare/ticker', verifyAdmin, getWelfareLiveTicker);
router.get('/welfare/absence-radar', verifyAdmin, getAbsenceRadar);
router.post('/welfare/manual-checkin', verifyAdmin, executeManualCheckin);

// Treasury & MPESA (G7)
router.get('/finance/queue', verifyAdmin, getMpesaQueue);
router.post('/finance/verify-mpesa/:id', verifyAdmin, verifyMpesaPayment);

// Assets & Land (G8)
router.get('/assets', verifyAdmin, getGearAssets);
router.post('/assets', verifyAdmin, createGearAsset);
router.post('/assets/:id/inspect', verifyAdmin, logGearInspection);

// Media, Birthday Studio & Observability (G9)
router.get('/media/birthday-queue', verifyAdmin, getBirthdayQueue);
router.patch('/media/birthday-status/:memberId', verifyAdmin, updateBirthdayPosterStatus);
router.post('/media/reset-device-lock', verifyAdmin, resetDeviceLock);
router.post('/media/mint-master-qr', verifyAdmin, mintMasterSemesterQr);

// 1-Year Leadership Tenure Handover (US-TEN-011)
router.get('/dossiers', verifyAdmin, getHandoverDossiers);
router.post('/dossiers', verifyAdmin, submitHandoverDossier);
router.post('/dossiers/:id/seal', verifyAdmin, sealHandoverDossier);

export default router;
