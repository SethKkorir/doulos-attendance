import express from 'express';
import { getG5Stats } from '../controllers/g5Controller.js';

const router = express.Router();

router.get('/stats', getG5Stats);

export default router;
