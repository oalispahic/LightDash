import config from './config.js';
import { initDB, migrateHashPasswords } from './db.js';
import { createApp } from './app.js';

await initDB();
await migrateHashPasswords();

const app = createApp();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
