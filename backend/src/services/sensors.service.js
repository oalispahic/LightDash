import { readFile, readdir } from 'fs/promises';
import config from '../config.js';

export async function readSensors() {
  const results = [];
  const base = config.paths.hwmon;
  const dirs = await readdir(base).catch(() => []);
  for (const dir of dirs) {
    const dirPath = `${base}/${dir}`;
    const name = await readFile(`${dirPath}/name`, 'utf8').then(s => s.trim()).catch(() => null);
    if (!name) continue;
    for (let i = 1; i <= 6; i++) {
      const raw = await readFile(`${dirPath}/temp${i}_input`, 'utf8').catch(() => null);
      if (raw === null) break;
      const label = await readFile(`${dirPath}/temp${i}_label`, 'utf8').then(s => s.trim()).catch(() => name);
      results.push({ sensor: name, label, celsius: Math.round(parseInt(raw) / 1000) });
    }
  }
  return results;
}
