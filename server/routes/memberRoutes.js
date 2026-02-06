import express from 'express';
import { getMembers, importMembers, updateMember, createMember, addPoints, syncMembersFromAttendance } from '../controllers/memberController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyAdmin, getMembers);
router.post('/', verifyAdmin, createMember);
router.post('/import', verifyAdmin, importMembers);
router.post('/sync', verifyAdmin, syncMembersFromAttendance);
router.patch('/:id', verifyAdmin, updateMember);
router.post('/:id/points', verifyAdmin, addPoints);

export default router;
