import express from 'express';
import {
    createTraining, getTrainings, getTrainingByCode,
    updateTrainingStatus, setTrainingLocation, deleteTraining,
    getCampProgram, saveCampProgram, getCadresAndRecruits,
    updateMemberRank, evaluateMember
} from '../controllers/trainingController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

// Camp Run-Sheet & Facilitator Studio
router.get('/camp-program', verifyAdmin, getCampProgram);
router.post('/camp-program', verifyAdmin, saveCampProgram);

// Cadres, Recruits & Competency Evaluation
router.get('/cadres', verifyAdmin, getCadresAndRecruits);
router.put('/members/:id/rank', verifyAdmin, updateMemberRank);
router.post('/members/:id/evaluate', verifyAdmin, evaluateMember);

// Existing Training Drills & Sessions
router.post('/', verifyAdmin, createTraining);
router.get('/', verifyAdmin, getTrainings);
router.get('/code/:code', optionalVerify, getTrainingByCode);
router.patch('/:id', verifyAdmin, updateTrainingStatus);
router.post('/:id/location', verifyAdmin, setTrainingLocation);
router.post('/:id/delete-secure', verifyAdmin, deleteTraining);

export default router;
