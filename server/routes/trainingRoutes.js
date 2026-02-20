import express from 'express';
import {
    createTraining, getTrainings, getTrainingByCode,
    updateTrainingStatus, setTrainingLocation, deleteTraining
} from '../controllers/trainingController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyAdmin, createTraining);
router.get('/', verifyAdmin, getTrainings);
router.get('/code/:code', optionalVerify, getTrainingByCode);
router.patch('/:id', verifyAdmin, updateTrainingStatus);
router.post('/:id/location', verifyAdmin, setTrainingLocation);
router.post('/:id/delete-secure', verifyAdmin, deleteTraining);

export default router;
