import express from 'express';
import { getSetting, updateSetting } from '../controllers/settingsController.js';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:key', getSetting); // Publicly readable for students to see WhatsApp link? Or maybe only for logged in members.
router.patch('/:key', verifyAdmin, updateSetting);

export default router;
