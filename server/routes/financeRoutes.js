import express from 'express';
import { getContributionsStatus } from '../controllers/financeController.js';

const router = express.Router();

router.get('/contributions/status', getContributionsStatus);

export default router;
