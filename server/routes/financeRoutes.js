import express from 'express';
import {
    seedFunds,
    getFunds,
    getTransactions,
    getStudentTransactions,
    logTransaction,
    consolidateTransaction,
    getFundRequests,
    submitFundRequest,
    resolveFundRequest,
    getAssets,
    createOrUpdateAsset,
    getAuditLogs,
    getFinanceStats
} from '../controllers/financeController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// General & Seed
router.post('/funds/seed', verifyAdmin, seedFunds);
router.get('/funds', getFunds);
router.get('/stats', getFinanceStats);

// Transactions
router.get('/transactions', verifyAdmin, getTransactions);
router.get('/transactions/student/:regNo', getStudentTransactions);
router.post('/transactions/log', verifyAdmin, logTransaction);
router.patch('/transactions/consolidate/:id', verifyAdmin, consolidateTransaction);

// Fund Requests
router.get('/requests', getFundRequests);
router.post('/requests/submit', submitFundRequest);
router.patch('/requests/resolve/:id', verifyAdmin, resolveFundRequest);

// Asset Inventory
router.get('/assets', getAssets);
router.post('/assets', verifyAdmin, createOrUpdateAsset);

// Audit logs
router.get('/logs', verifyAdmin, getAuditLogs);

export default router;
