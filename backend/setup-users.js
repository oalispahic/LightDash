import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

const db = new sqlite3.Database('./data/data.db');
db.run = promisify(db.run.bind(db));

async function initDB() {
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

  console.log('✓ Database initialized');
}

async function addUser(username, password) {
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
    console.log(`✓ User "${username}" added successfully`);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      console.log(`✗ User "${username}" already exists`);
    } else {
      console.log(`✗ Error: ${err.message}`);
    }
  }
}

await initDB();
await addUser('omar', 'password123');
await addUser('danko', 'dankovaSifra123!');
await addUser('test', 'test123');
await addUser('newTest', 'pw');

console.log('\nTo add more users, modify this script and run: node setup-users.js');
process.exit(0);
