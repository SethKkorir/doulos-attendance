import express from 'express';
import {
    getQuestions,
    getActiveDailyQuestion,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    submitQuestionResponse,
    getQuestionAnalytics,
    getQuestionResponses
} from '../controllers/questionController.js';
import { verifySpiritualCoordinator, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

// Member and Check-In routes
router.get('/active', optionalVerify, getActiveDailyQuestion);
router.post('/response', optionalVerify, submitQuestionResponse);

// Coordinator routes
router.get('/', verifySpiritualCoordinator, getQuestions);
router.get('/:id', optionalVerify, getQuestionById);
router.post('/', verifySpiritualCoordinator, createQuestion);
router.put('/:id', verifySpiritualCoordinator, updateQuestion);
router.delete('/:id', verifySpiritualCoordinator, deleteQuestion);

router.get('/:id/analytics', verifySpiritualCoordinator, getQuestionAnalytics);
router.get('/:id/responses', verifySpiritualCoordinator, getQuestionResponses);

export default router;
