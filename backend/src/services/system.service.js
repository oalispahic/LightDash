import config from '../config.js';

const { url, token } = config.sysd;

async function callSysd(path, { query } = {}) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const res = await fetch(`${url}${path}${qs}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`marex-sysd ${res.status}: ${body || res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res;
}

// Returns either a JSON directory listing or a text log tail, depending
// on what `path` resolves to on the agent side. The route hands the
// response body straight through so the frontend sees the same shape.
export async function readLogs({ path = '', bytes } = {}) {
  const query = { path };
  if (bytes) query.bytes = bytes;
  const res = await callSysd('/logs', { query });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { kind: 'dir', body: await res.json() };
  }
  return {
    kind: 'file',
    body: await res.text(),
    totalSize: res.headers.get('x-log-size'),
    truncated: res.headers.get('x-log-truncated') === '1',
  };
}
