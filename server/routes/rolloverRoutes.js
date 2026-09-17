import express from 'express';
import {
    getRolloverChecklist,
    startRollover,
    rollbackRollover,
    downloadSemesterQRPoster
} from '../controllers/rolloverController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/checklist', optionalVerify, getRolloverChecklist);
router.post('/start', verifyAdmin, startRollover);
router.post('/rollback', verifyAdmin, rollbackRollover);
router.get('/qr-poster-pdf', downloadSemesterQRPoster);

export default router;
