import { Router } from 'express';

const router = Router();

router.get('/shows', (_req, res) => {
  res.json({ message: 'Shows route working' });
});

export default router;
