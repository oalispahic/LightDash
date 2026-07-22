import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

router.post('/', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }
  db.run('INSERT INTO temp (message) VALUES (?)', [message]);
  res.json({ status: 'saved', message });
});

router.get('/', asyncHandler(async (_req, res) => {
  const msg = await db.get('SELECT * FROM temp ORDER BY id DESC LIMIT 1');
  res.json({ message: msg?.message || 'No message' });
}));

export default router;
