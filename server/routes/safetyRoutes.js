import express from 'express';
import { getLopDocs, getIncidents, reportIncident } from '../controllers/safetyController.js';

const router = express.Router();

router.get('/lop-docs', getLopDocs);
router.get('/incidents', getIncidents);
router.post('/incidents', reportIncident);

export default router;
