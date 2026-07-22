// In-memory FIFO of commands the ESP will pick up on its next poll.
// Kept process-local on purpose — commands are ephemeral, and if the
// server restarts the user can just resend from Telegram.
const queue = [];

export function push(cmd) {
  queue.push(cmd);
}

export function pop() {
  return queue.shift() || null;
}
