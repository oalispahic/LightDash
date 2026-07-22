import { Router } from 'express';
import path from 'path';
import { realpath, stat, readdir, open } from 'fs/promises';
import config from '../config.js';

const router = Router();

// Resolve the logs root's real path once at startup so we can compare
// against symlink-resolved request paths later.
const ROOT_REAL = await realpath(config.logsRoot).catch(() => config.logsRoot);

// Normalize + validate a client-supplied subpath. Two independent checks:
// 1. Lexical:  path.resolve stops `../foo` from escaping the root.
// 2. Symlink:  realpath resolves any symlinks; we then re-check prefix.
// A missing file returns 404, an out-of-root path returns 400.
async function safeResolve(subpath) {
  const clean = (subpath || '').replace(/^\/+/, '');
  const lexical = path.resolve(config.logsRoot, clean);

  if (lexical !== config.logsRoot && !lexical.startsWith(config.logsRoot + path.sep)) {
    const err = new Error('path escapes logs root');
    err.status = 400;
    throw err;
  }

  let real;
  try {
    real = await realpath(lexical);
  } catch (e) {
    if (e.code === 'ENOENT') {
      const err = new Error('not found');
      err.status = 404;
      throw err;
    }
    throw e;
  }

  if (real !== ROOT_REAL && !real.startsWith(ROOT_REAL + path.sep)) {
    const err = new Error('path escapes logs root after symlink resolution');
    err.status = 400;
    throw err;
  }
  return real;
}

async function listDir(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const dirs = [];
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs.push(entry.name);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      // For symlinks we still expose the name; safeResolve() will vet
      // the target when the user tries to read it.
      let size = null;
      try {
        size = (await stat(path.join(dirPath, entry.name))).size;
      } catch { /* ignore unreadable */ }
      files.push({ name: entry.name, size });
    }
  }
  dirs.sort();
  files.sort((a, b) => a.name.localeCompare(b.name));
  return { dirs, files };
}

async function tailFile(filePath, bytes) {
  const s = await stat(filePath);
  const requested = parseInt(bytes, 10);
  const tail = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, config.maxTailBytes)
    : config.defaultTailBytes;

  const start = Math.max(0, s.size - tail);
  const fh = await open(filePath, 'r');
  try {
    const buf = Buffer.alloc(s.size - start);
    await fh.read(buf, 0, buf.length, start);
    return { text: buf.toString('utf8'), truncated: start > 0, totalSize: s.size };
  } finally {
    await fh.close();
  }
}

// GET /logs?path=<subpath>[&bytes=<n>]
// - path resolves to a directory → JSON { type:'dir', dirs, files }
// - path resolves to a file      → text/plain tail of last N bytes
// - missing / empty path         → root listing
router.get('/', async (req, res, next) => {
  try {
    const target = await safeResolve(req.query.path);
    const s = await stat(target);

    if (s.isDirectory()) {
      const listing = await listDir(target);
      return res.json({
        type: 'dir',
        path: path.relative(config.logsRoot, target) || '.',
        ...listing,
      });
    }

    if (s.isFile()) {
      const { text, truncated, totalSize } = await tailFile(target, req.query.bytes);
      res.set('X-Log-Size', String(totalSize));
      res.set('X-Log-Truncated', truncated ? '1' : '0');
      return res.type('text/plain').send(text);
    }

    const err = new Error('unsupported file type');
    err.status = 400;
    throw err;
  } catch (err) {
    next(err);
  }
});

export default router;
