import express from 'express';
import { createFeedback, getFeedbacks, updateFeedbackStatus, deleteFeedback } from '../controllers/feedbackController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Route
router.post('/', createFeedback);

// Protected Admin Routes
router.get('/', verifyAdmin, getFeedbacks);
router.patch('/:id/status', verifyAdmin, updateFeedbackStatus);
router.delete('/:id', verifyAdmin, deleteFeedback);

export default router;
