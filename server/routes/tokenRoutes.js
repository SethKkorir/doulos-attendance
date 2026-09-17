import express from 'express';
import { issueToken, stampFallback } from '../controllers/tokenController.js';

const router = express.Router();

router.post('/issue', issueToken);
router.get('/issue/:meetingCode', issueToken);
router.post('/stamp-fallback', stampFallback);

export default router;
