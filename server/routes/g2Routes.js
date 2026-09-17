import express from 'express';
import { getG2Stats } from '../controllers/g2Controller.js';

const router = express.Router();

router.get('/stats', getG2Stats);

export default router;
