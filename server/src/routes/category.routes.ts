import { Router } from 'express';
import { getCategories } from '../controllers/category.controller';

const router = Router();

// GET /api/categories (public)
router.get('/', getCategories);

export default router;
