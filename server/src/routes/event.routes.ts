import { Router } from 'express';
import multer from 'multer';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadEventBanner,
} from '../controllers/event.controller';
import { registerForEvent } from '../controllers/registration.controller';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

// Multer memory storage configured to permit image files only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted (PNG, JPG, WEBP, GIF, SVG)!'));
    }
  },
});

// Public routes
// GET /api/events
router.get('/', getEvents);

// GET /api/events/:id
router.get('/:id', getEventById);

// Authenticated user registration
// POST /api/events/:eventId/register
router.post('/:eventId/register', authenticateUser, registerForEvent);

// Admin-only event banner upload to Supabase Storage
// POST /api/events/upload-banner (admin only)
router.post(
  '/upload-banner',
  authenticateUser,
  requireAdmin,
  upload.single('banner'),
  uploadEventBanner
);

// Admin-only event management
// POST /api/events (admin only)
router.post('/', authenticateUser, requireAdmin, createEvent);

// PATCH /api/events/:id (admin only)
router.patch('/:id', authenticateUser, requireAdmin, updateEvent);

// DELETE /api/events/:id (admin only)
router.delete('/:id', authenticateUser, requireAdmin, deleteEvent);

export default router;
