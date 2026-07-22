import { Router } from 'express';
import { readFile } from 'fs/promises';
import config from '../config.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { readSensors } from '../services/sensors.service.js';
import { listContainers } from '../services/docker.service.js';

const router = Router();

router.use(authMiddleware);

router.get('/status', asyncHandler(async (_req, res) => {
  console.log('Status GET');
  const data = await readFile(config.paths.uptime, 'utf8');
  const uptime = parseFloat(data.split(' ')[0]);
  res.json({
    status: 'online',
    uptime,
    timestamp: new Date().toISOString(),
  });
}));

router.get('/dockerps', asyncHandler(async (_req, res) => {
  console.log('Docker PS GET');
  const containers = await listContainers();
  res.json({ containers, timestamp: new Date().toISOString() });
}));

router.get('/temperature', asyncHandler(async (_req, res) => {
  console.log('Temperature GET');
  const sensors = await readSensors();
  res.json({ sensors, timestamp: new Date().toISOString() });
}));

router.get('/info', (_req, res) => {
  console.log('Info GET');
  res.json({
    name: 'marexdev',
    host: 'marexdev.com',
    description: 'Self-hosted server',
    node: process.version,
  });
});

export default router;
