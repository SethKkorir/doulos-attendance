import express from 'express';
import { getEvents, getAllEventsAdmin, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/admin', verifyToken, verifyAdmin, getAllEventsAdmin);
router.post('/', verifyToken, verifyAdmin, createEvent);
router.put('/:id', verifyToken, verifyAdmin, updateEvent);
router.delete('/:id', verifyToken, verifyAdmin, deleteEvent);

export default router;
