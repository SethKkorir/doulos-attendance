import express from 'express';
import {
    submitPayment,
    getMyPayments,
    getPendingPayments,
    verifyPayment,
    logCashPayment,
    getAllPayments,
    getFinanceStats,
    getDefaulters,
    deletePayment
} from '../controllers/paymentController.js';
import { verifyAdmin, optionalVerify } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student routes
router.post('/submit', optionalVerify, submitPayment);
router.get('/student/:regNo', getMyPayments);

// Admin routes
router.get('/pending', verifyAdmin, getPendingPayments);
router.patch('/verify/:id', verifyAdmin, verifyPayment);
router.post('/log-cash', verifyAdmin, logCashPayment);
router.get('/all', verifyAdmin, getAllPayments);
router.get('/stats', verifyAdmin, getFinanceStats);
router.get('/defaulters', verifyAdmin, getDefaulters);
router.delete('/:id', verifyAdmin, deletePayment);

export default router;
