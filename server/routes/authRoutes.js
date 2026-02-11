import express from 'express';
import { login, register, promoteToDeveloper, getUsers, updateUser, deleteUser } from '../controllers/authController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', verifyAdmin, register);
router.post('/login', login);
router.post('/promote', promoteToDeveloper);

// User Management
router.get('/users', verifyAdmin, getUsers);
router.patch('/users/:id', verifyAdmin, updateUser);
router.delete('/users/:id', verifyAdmin, deleteUser);

export default router;
