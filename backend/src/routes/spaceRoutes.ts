import express from 'express';
import { createSpace } from '../controllers/spaceController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Protect space creation with authentication if needed; for now allow unauthenticated creation.
router.post('/', /* authenticate, */ createSpace);

export default router;
