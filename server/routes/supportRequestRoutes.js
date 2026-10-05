import express from 'express';
import {
    createSupportRequest,
    getSupportRequests,
    getSupportRequestStats,
    getSupportRequestById,
    updateSupportRequest,
    addSupportRequestNote
} from '../controllers/supportRequestController.js';
import { verifySpiritualCoordinator } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / member endpoint: submit a direct pastoral care request
router.post('/', createSupportRequest);

// Coordinator routes
router.get('/stats', verifySpiritualCoordinator, getSupportRequestStats);
router.get('/', verifySpiritualCoordinator, getSupportRequests);
router.get('/:id', verifySpiritualCoordinator, getSupportRequestById);
router.put('/:id', verifySpiritualCoordinator, updateSupportRequest);
router.post('/:id/notes', verifySpiritualCoordinator, addSupportRequestNote);

export default router;
