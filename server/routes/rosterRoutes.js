import express from 'express';
import {
    getRosterMembers,
    addRecruit,
    editMember,
    deleteMember,
    archiveMember,
    getMemberPortalView
} from '../controllers/rosterController.js';
import { confirmSemester } from '../controllers/memberController.js';

const router = express.Router();

router.get('/members', getRosterMembers);
router.post('/members/:id/confirm-semester', confirmSemester);
router.post('/recruits', addRecruit);
router.patch('/members/:id', editMember);
router.delete('/members/:id', deleteMember);
router.post('/members/:id/archive', archiveMember);
router.get('/members/:id/portal-view', getMemberPortalView);

export default router;
