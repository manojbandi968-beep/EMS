import { Router } from 'express';
import {
  getAllRegistrations,
  getAdminDashboard,
} from '../controllers/admin.controller';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

// Enforce both authentication and administrator privileges for all /api/admin routes
router.use(authenticateUser, requireAdmin);

// GET /api/admin/registrations (admin only)
router.get('/registrations', getAllRegistrations);

// GET /api/admin/dashboard (admin only)
router.get('/dashboard', getAdminDashboard);

export default router;
