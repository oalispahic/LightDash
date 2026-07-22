import crypto from 'crypto';
import config from '../config.js';

const expected = Buffer.from(config.token);

export function tokenAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const providedBuf = Buffer.from(provided);

  if (
    providedBuf.length !== expected.length ||
    !crypto.timingSafeEqual(providedBuf, expected)
  ) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}
