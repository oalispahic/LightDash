import { Router } from 'express';
import { readFile } from 'fs/promises';
import fs from 'fs';
import config from '../config.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

// meta.json is read fresh on every request (not cached at startup),
// so editing it after pushing a new firmware.bin takes effect
// immediately without a server restart.
router.get('/meta', asyncHandler(async (_req, res) => {
  console.log('Firmware meta GET');
  const raw = await readFile(config.paths.firmwareMeta, 'utf8');
  res.json(JSON.parse(raw));
}));

router.get('/latest.bin', (_req, res) => {
  console.log('Firmware binary GET');
  fs.stat(config.paths.firmwareBin, (err, stats) => {
    if (err) return res.status(404).json({ error: 'firmware not found' });
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    fs.createReadStream(config.paths.firmwareBin).pipe(res);
  });
});

export default router;
