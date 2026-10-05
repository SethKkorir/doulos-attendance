import express from 'express';
import {
    getFellowships,
    getTodayFellowship,
    getFellowshipById,
    createFellowship,
    updateFellowship,
    deleteFellowship,
    publishFellowship,
    scheduleFellowship,
    archiveFellowship,
    recordInteraction,
    getMinistryDashboardStats
} from '../controllers/fellowshipController.js';
import { verifySpiritualCoordinator, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

// Member-accessible routes
router.get('/today', optionalVerify, getTodayFellowship);
router.post('/:id/interaction', recordInteraction);

// Coordinator & Management routes
router.get('/stats/dashboard', verifySpiritualCoordinator, getMinistryDashboardStats);
router.get('/', verifySpiritualCoordinator, getFellowships);
router.get('/:id', optionalVerify, getFellowshipById);

router.post('/', verifySpiritualCoordinator, createFellowship);
router.put('/:id', verifySpiritualCoordinator, updateFellowship);
router.delete('/:id', verifySpiritualCoordinator, deleteFellowship);

router.post('/:id/publish', verifySpiritualCoordinator, publishFellowship);
router.post('/:id/schedule', verifySpiritualCoordinator, scheduleFellowship);
router.post('/:id/archive', verifySpiritualCoordinator, archiveFellowship);

export default router;
