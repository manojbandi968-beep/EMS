import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/health
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Event API is running',
  });
});

export default router;
