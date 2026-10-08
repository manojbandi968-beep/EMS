import { Router } from 'express';
import {
  getMyRegistrations,
  cancelRegistration,
} from '../controllers/registration.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// GET /api/registrations/me (authenticated user)
router.get('/me', authenticateUser, getMyRegistrations);

// PATCH /api/registrations/:id/cancel (authenticated user or admin)
router.patch('/:id/cancel', authenticateUser, cancelRegistration);

export default router;
