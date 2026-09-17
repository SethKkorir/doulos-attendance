import express from 'express';
import { getCrews, assignCrew } from '../controllers/crewsController.js';

const router = express.Router();

router.get('/', getCrews);
router.post('/assign', assignCrew);

export default router;
