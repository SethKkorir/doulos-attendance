import express from 'express';
import {
    getDelegationStatus,
    activateDelegation,
    deactivateDelegation
} from '../controllers/delegationController.js';

const router = express.Router();

router.get('/status', getDelegationStatus);
router.post('/activate', activateDelegation);
router.post('/deactivate', deactivateDelegation);

export default router;
