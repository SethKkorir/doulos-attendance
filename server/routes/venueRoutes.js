import express from 'express';
import { getVenues, addVenue } from '../controllers/venueController.js';

const router = express.Router();

router.get('/', getVenues);
router.post('/', addVenue);

export default router;
