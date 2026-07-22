import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import config from '../config.js';
import { generateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/', (_req, res) => {
  res.json({ message: 'Welcome to ' + config.serverName });
});

router.get('/config', (_req, res) => {
  res.json({ serverName: config.serverName });
});

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const stored = user.password || '';
  const looksHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
  const ok = looksHashed
    ? await bcrypt.compare(password, stored)
    : stored === password;

  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // If we matched a legacy plaintext password, upgrade it on the fly.
  if (!looksHashed) {
    const hashed = await bcrypt.hash(password, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
  }

  const token = generateToken(user.id);
  res.json({ token });
}));

export default router;
