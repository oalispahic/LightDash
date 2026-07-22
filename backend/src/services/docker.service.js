import config from '../config.js';

// Talks to docker-socket-proxy which only exposes GET /containers/*.
// Backend has no direct access to /var/run/docker.sock.
export async function listContainers() {
  const res = await fetch(`${config.dockerProxyUrl}/containers/json?all=1`);
  if (!res.ok) {
    throw new Error(`docker-proxy responded ${res.status}`);
  }
  const raw = await res.json();
  return raw.map((c) => ({
    name: c.Names?.[0]?.replace(/^\//, '') || c.Id.slice(0, 12),
    image: c.Image,
    state: c.State,   // "running" | "exited" | "paused" | ...
    status: c.Status, // human-readable, e.g. "Up 4 hours"
  }));
}
