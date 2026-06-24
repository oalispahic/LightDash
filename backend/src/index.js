import express from 'express';
import cors from 'cors';
import { readFile, readdir } from 'fs/promises';
import os from 'os';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import db, { initDB, migrateHashPasswords } from './db.js';
import { generateToken, authMiddleware } from './auth.js';

dotenv.config();

const HWMON = '/sys/class/hwmon';
const telegramApiKey = process.env.TELEGRAM_API_KEY;
const chatID = process.env.TELEGRAM_CHAT_ID;

async function readSensors() {
  const results = [];
  const dirs = await readdir(HWMON).catch(() => []);
  for (const dir of dirs) {
    const base = `${HWMON}/${dir}`;
    const name = await readFile(`${base}/name`, 'utf8').then(s => s.trim()).catch(() => null);
    if (!name) continue;
    for (let i = 1; i <= 6; i++) {
      const raw = await readFile(`${base}/temp${i}_input`, 'utf8').catch(() => null);
      if (raw === null) break;
      const label = await readFile(`${base}/temp${i}_label`, 'utf8').then(s => s.trim()).catch(() => name);
      results.push({ sensor: name, label, celsius: Math.round(parseInt(raw) / 1000) });
    }
  }
  return results;
}

const app = express();
const PORT = process.env.PORT || 3000;
let tempMessage = 'No message yet';

app.use(cors());
app.use(express.json());

// Initialize database on startup
await initDB();
await migrateHashPasswords();

// Public endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/',(_req,res) =>{
  res.json({message: 'Welcome to ' + process.env.SERVER_NAME});
});

app.get('/config', (_req, res) => {
  res.json({
    serverName: process.env.SERVER_NAME || 'Server',
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/status', authMiddleware, async (_req, res) => {
	console.log("Status GET");
  try {
    const data = await readFile('/proc/uptime', 'utf8');
    const uptime = parseFloat(data.split(' ')[0]);
    res.json({
      status: 'online',
      uptime,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Uptime read error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/temperature', authMiddleware, async (_req, res) => {
  console.log("Temperature GET");
  const sensors = await readSensors();
  res.json({ sensors, timestamp: new Date().toISOString() });
});

app.get('/info', authMiddleware, (_req, res) => {
	console.log("Info GET");
  res.json({
    name: 'marexdev',
    host: 'marexdev.com',
    description: 'Self-hosted server',
    node: process.version,
  });
});


app.post('/telegram', authMiddleware, (_req,res) =>{

console.log("Telegram POST");

const message = '====== \n' + _req.body.message + '\n ====== ';
const url = `https://api.telegram.org/bot${telegramApiKey}/sendMessage`;

fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatID,
        text: message
      })
    })
    .then(r => r.json())
    .then(data => res.json({ status: 'sent', data }))
    .catch(err => res.json({ error: err.message }));
});

app.post('/temp', authMiddleware, (_req, res) => {
  const { message } = _req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }
  db.run('INSERT INTO temp (message) VALUES (?)', [message]);
  res.json({ status: 'saved', message: message });
});

app.get('/temp', authMiddleware, async (_req, res) => {
  const msg = await db.get('SELECT * FROM temp ORDER BY id DESC LIMIT 1');
  res.json({ message: msg?.message || 'No message' });
});

app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
