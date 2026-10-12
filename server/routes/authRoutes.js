import express from 'express';
import { 
    login, register, getSession, logout, promoteToDeveloper, 
    getUsers, updateUser, deleteUser, updateUserStatus,
    createInvitation, getInvitations, revokeInvitation, 
    verifyInvitationToken, acceptInvitation 
} from '../controllers/authController.js';
import { triggerManualBackup } from '../controllers/systemController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', verifyAdmin, register);
router.post('/login', login);
router.get('/session', getSession);
router.post('/logout', logout);
router.post('/promote', promoteToDeveloper);

// Manual Backup compat routes
router.get('/manual-backup', triggerManualBackup);
router.post('/manual-backup', triggerManualBackup);

// User Management & Status
router.get('/users', verifyAdmin, getUsers);
router.patch('/users/:id', verifyAdmin, updateUser);
router.patch('/users/:id/status', verifyAdmin, updateUserStatus);
router.delete('/users/:id', verifyAdmin, deleteUser);

// Account Invitations
router.post('/invitations', verifyAdmin, createInvitation);
router.get('/invitations', verifyAdmin, getInvitations);
router.post('/invitations/:id/revoke', verifyAdmin, revokeInvitation);
router.get('/invitations/:token', verifyInvitationToken);
router.post('/invitations/:token/accept', acceptInvitation);

export default router;
