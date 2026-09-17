import express from 'express';
import {
    getGraduationQueue,
    graduateRecruit,
    graduateCohort
} from '../controllers/membershipController.js';

const router = express.Router();

router.get('/graduation-queue', getGraduationQueue);
router.post('/graduate-cohort', graduateCohort);
router.post('/:memberId/graduate', graduateRecruit);

export default router;
