import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

const db = new sqlite3.Database('./data/data.db');

db.run = promisify(db.run.bind(db));
db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));

export async function initDB() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('Database initialized');
}

// One-shot migration: replace any plaintext password with a bcrypt hash.
// Safe to run on every boot — already-hashed rows are skipped.
export async function migrateHashPasswords() {
  const rows = await db.all('SELECT id, password FROM users');
  let upgraded = 0;
  for (const row of rows) {
    const pw = row.password || '';
    const looksHashed = pw.startsWith('$2a$') || pw.startsWith('$2b$') || pw.startsWith('$2y$');
    if (looksHashed) continue;
    const hashed = await bcrypt.hash(pw, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, row.id]);
    upgraded += 1;
  }
  if (upgraded > 0) {
    console.log(`Password migration: hashed ${upgraded} plaintext password(s)`);
  }
}

export default db;
