import express from 'express';
import { getEquipmentReadiness } from '../controllers/equipmentController.js';

const router = express.Router();

router.get('/readiness', getEquipmentReadiness);

export default router;
