import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name){
  const value = process.env[name];
  if (!value) {
    console.warn(`Missing optional env var: ${name}`);
  }
  return value;
}

const FW_DIR = '/app/firmware';

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  serverName: process.env.SERVER_NAME || 'Server',

  jwtSecret: required('JWT_SECRET'),

  telegram: {
    apiKey: optional('TELEGRAM_API_KEY'),
    chatId: optional('TELEGRAM_CHAT_ID'),
  },

  paths: {
    hwmon: '/sys/class/hwmon',
    firmwareDir: FW_DIR,
    firmwareBin: path.join(FW_DIR, 'latest.bin'),
    firmwareMeta: path.join(FW_DIR, 'meta.json'),
    uptime: '/proc/uptime',
  },
};

export default config;
