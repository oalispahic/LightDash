import express from 'express';
import config from './config.js';
import { tokenAuth } from './middleware/auth.js';
import logsRouter from './actions/logs.js';

const app = express();
app.use(express.json({ limit: '64kb' }));

// Health is unauthenticated so docker compose healthchecks work.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Every other action is token-gated.
app.use(tokenAuth);
app.use('/logs', logsRouter);

app.use((_req, res) => res.status(404).json({ error: 'not found' }));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('marex-sysd error:', err);
  res.status(status).json({ error: err.message || 'internal' });
});

app.listen(config.port, () => {
  console.log(`marex-sysd listening on ${config.port}`);
});
