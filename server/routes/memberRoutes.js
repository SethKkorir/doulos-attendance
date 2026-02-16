import express from 'express';
import {
    getMembers, importMembers, updateMember, createMember, addPoints,
    syncMembersFromAttendance, graduateAllRecruits, setupTestAccount,
    resetAllMemberPoints, deleteMemberWithPassword, resetDeviceLock,
    graduateMember, resetMemberPoints, bulkGraduateMembers, clearGraduationCongrats,
    enrollMember, archiveMember, updateWateringDays
} from '../controllers/memberController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyAdmin, getMembers);
router.post('/', verifyAdmin, createMember);
router.post('/import', verifyAdmin, importMembers);
router.post('/sync', verifyAdmin, syncMembersFromAttendance);
router.post('/graduate-all', verifyAdmin, graduateAllRecruits);
router.post('/reset-all-points', verifyAdmin, resetAllMemberPoints);
router.post('/setup-test-account', verifyAdmin, setupTestAccount);
router.post('/enroll', enrollMember);
router.post('/:id/delete-secure', verifyAdmin, deleteMemberWithPassword);
router.patch('/:id', verifyAdmin, updateMember);
router.post('/:id/points', verifyAdmin, addPoints);
router.post('/:id/reset-device', verifyAdmin, resetDeviceLock);
router.post('/:id/graduate', verifyAdmin, graduateMember);
router.post('/:id/archive', verifyAdmin, archiveMember);
router.post('/:id/watering', verifyAdmin, updateWateringDays);
router.post('/bulk-graduate', verifyAdmin, bulkGraduateMembers);
router.post('/:id/reset-points', verifyAdmin, resetMemberPoints);
router.post('/clear-congrats/:studentRegNo', clearGraduationCongrats);

export default router;
