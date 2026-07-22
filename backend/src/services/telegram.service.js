import config from '../config.js';

const { apiKey, chatId } = config.telegram;

export function fmtDuration(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  if (sec < 60)    return `${sec}s`;
  if (sec < 3600)  return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

export async function sendText(text) {
  const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error('Telegram send failed:', err.message);
  }
}

export async function sendWrappedText(text) {
  const message = '====== \n' + text + '\n ====== ';
  const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
  return res.json();
}

export async function sendPhoto(imageBuffer, caption = '') {
  const form = new FormData();
  form.append('chat_id', chatId);
  if (caption) form.append('caption', String(caption));
  form.append('photo', new Blob([imageBuffer], { type: 'image/jpeg' }), 'photo.jpg');

  const url = `https://api.telegram.org/bot${apiKey}/sendPhoto`;
  const res = await fetch(url, { method: 'POST', body: form });
  const data = await res.json();
  return { ok: res.ok && data.ok !== false, data };
}

export function isAuthorizedChat(incomingChatId) {
  return String(incomingChatId) === String(chatId);
}
