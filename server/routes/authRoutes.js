import express from 'express';
import { login, register, promoteToDeveloper } from '../controllers/authController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', verifyAdmin, register);
router.post('/login', login);
router.post('/promote', promoteToDeveloper);

export default router;
