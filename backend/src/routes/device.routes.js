import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as deviceQueue from '../services/deviceQueue.service.js';
import { sendText, fmtDuration } from '../services/telegram.service.js';

const router = Router();

router.use(authMiddleware);

// ESP polls this every 2s. Returns one queued command (FIFO) or null.
router.get('/command', (_req, res) => {
  const cmd = deviceQueue.pop();
  if (cmd) console.log(`Handed off command: ${cmd}`);
  res.json({ cmd });
});

// ESP posts stats here in response to /stats. Backend formats and relays
// to Telegram — the ESP never talks to Telegram directly.
router.post('/info', asyncHandler(async (req, res) => {
  console.log('Device info POST');
  const {
    armed, tempC, pressureHpa, voltageV,
    uptimeSeconds, hadEvent, lastEventSecondsAgo, firmware,
  } = req.body || {};

  const uH = Math.floor((uptimeSeconds || 0) / 3600);
  const uM = Math.floor(((uptimeSeconds || 0) % 3600) / 60);

  const lines = [
    `Mode: ${armed ? 'ARMED' : 'DISARMED'}`,
    `Temp: ${Number.isFinite(tempC) ? tempC.toFixed(1) + ' C' : 'n/a'}`,
    `Pressure: ${pressureHpa ? pressureHpa.toFixed(1) + ' hPa' : 'n/a'}`,
    `Voltage: ${voltageV ? voltageV.toFixed(2) + ' V' : 'n/a'}`,
    `Last event: ${hadEvent ? fmtDuration(lastEventSecondsAgo) + ' ago' : 'none'}`,
    `Uptime: ${uH}h ${uM}m`,
    `FW: ${firmware || '?'}`,
  ];
  await sendText(lines.join('\n'));
  res.json({ status: 'sent' });
}));

export default router;
