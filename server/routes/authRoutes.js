import express from 'express';
import { login, register, promoteToDeveloper } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/promote', promoteToDeveloper);

export default router;
