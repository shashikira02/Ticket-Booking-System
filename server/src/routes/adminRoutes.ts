import { Router } from 'express';
import { createShow, createShowRules, getShows, getShow } from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/admin/shows', requireAdmin, createShowRules, validate, createShow);
router.get('/admin/shows', requireAdmin, getShows);
router.get('/admin/shows/:id', requireAdmin, getShow);

export default router;
