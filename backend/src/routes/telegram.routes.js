import { Router } from 'express';
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  sendWrappedText,
  sendPhoto,
  sendText,
  isAuthorizedChat,
} from '../services/telegram.service.js';
import * as deviceQueue from '../services/deviceQueue.service.js';

const router = Router();

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  console.log('Telegram POST');
  try {
    const data = await sendWrappedText(req.body.message);
    res.json({ status: 'sent', data });
  } catch (err) {
    res.json({ error: err.message });
  }
}));

router.post(
  '/photo',
  authMiddleware,
  express.raw({ type: ['image/*', 'application/octet-stream'], limit: '10mb' }),
  asyncHandler(async (req, res) => {
    console.log('Telegram Photo POST', req.body?.length, 'bytes');
    if (!req.body || !req.body.length) {
      return res.status(400).json({ error: 'No image data' });
    }
    const caption = req.query.caption || req.headers['x-caption'] || '';
    const { ok, data } = await sendPhoto(req.body, caption);
    if (!ok) {
      return res.status(502).json({ error: 'Telegram rejected', data });
    }
    res.json({ status: 'sent', data });
  })
);

// Telegram webhook — public (Telegram doesn't do auth headers).
// Chat-id whitelist is the actual gate: unknown chats are silently dropped.
router.post('/webhook', (req, res) => {
  console.log('Telegram webhook POST');
  const msg = req.body?.message || req.body?.edited_message;
  if (!msg) return res.json({ ok: true });

  if (!isAuthorizedChat(msg.chat?.id)) {
    console.log(`Ignoring message from unauthorized chat ${msg.chat?.id}`);
    return res.json({ ok: true });
  }

  const raw  = (msg.text || '').trim().toLowerCase();
  const text = raw.replace(/^\//, '').split(/[\s@]/)[0]; // strip "/" and "@botname"

  let cmd = null;
  if (text === 'pic' || text === 'photo') cmd = 'pic';
  else if (text === 'arm')                cmd = 'arm';
  else if (text === 'stats' || text === 'info') cmd = 'stats';

  if (cmd) {
    deviceQueue.push(cmd);
    console.log(`Queued device command: ${cmd}`);
  } else {
    sendText('Commands: /pic /arm /stats');
  }
  res.json({ ok: true });
});

export default router;
