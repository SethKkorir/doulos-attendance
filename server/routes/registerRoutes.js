import express from 'express';
import { getRegisterHistory, exportRegister } from '../controllers/registerController.js';

const router = express.Router();

router.get('/history', getRegisterHistory);
router.get('/export', exportRegister);

export default router;
