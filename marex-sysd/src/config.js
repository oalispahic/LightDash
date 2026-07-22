function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export default {
  port: parseInt(process.env.PORT, 10) || 4000,
  token: required('SYSD_TOKEN'),

  // All log access is scoped under this root. Any request path — after
  // normalization AND symlink resolution — must stay inside it. This
  // prevents both `../` traversal and symlink escape (e.g. a rogue
  // symlink under /var/log pointing at /etc/shadow).
  logsRoot: '/var/log',

  // Per-request read cap. Prevents someone from sucking the whole
  // syslog through one call.
  maxTailBytes: 1024 * 1024, // 1 MB
  defaultTailBytes: 64 * 1024, // 64 KB
};
