import { useState } from 'react';
import {
  Box, Typography, MenuItem, Select, FormControl, InputLabel, Button,
  TextField, IconButton, Chip, CircularProgress, Alert, Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import TerminalIcon from '@mui/icons-material/Terminal';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';

const API_BASE = 'https://api.marexdev.com';

const COMMON_LOGS = [
  { value: '/var/log/syslog', label: 'syslog' },
  { value: '/var/log/auth.log', label: 'auth.log' },
  { value: '/var/log/kern.log', label: 'kern.log' },
  { value: '/var/log/dpkg.log', label: 'dpkg.log' },
  { value: '/var/log/nginx/access.log', label: 'nginx access' },
  { value: '/var/log/nginx/error.log', label: 'nginx error' },
];

const LINE_OPTIONS = [50, 100, 200, 500, 1000];

// Rough over-fetch: assume 300 bytes per line, with a floor and ceiling
// so short logs still fetch enough headroom and huge requests stay under
// the agent's per-request cap (1 MB).
const BYTES_PER_LINE = 300;
const MIN_FETCH_BYTES = 32 * 1024;
const MAX_FETCH_BYTES = 1024 * 1024;

// UI shows absolute /var/log/... paths for familiarity, but the backend
// expects paths relative to /var/log. Strip the prefix here.
function toRelativePath(absPath) {
  return absPath.replace(/^\/var\/log\/?/, '');
}

const PLACEHOLDER_OUTPUT = '# Pick a log file and hit Fetch to load the latest entries.';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#c9d1d9',
    bgcolor: '#0d1117',
    fontSize: '0.85rem',
    '& fieldset': { borderColor: '#30363d' },
    '&:hover fieldset': { borderColor: '#444c56' },
    '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
  },
  '& .MuiInputLabel-root': { color: '#8b949e', fontSize: '0.85rem' },
};

export default function Logs({ token }) {
  const [logPath, setLogPath] = useState('/var/log/syslog');
  const [customPath, setCustomPath] = useState('');
  const [lines, setLines] = useState(200);
  const [filter, setFilter] = useState('');
  const [output, setOutput] = useState(PLACEHOLDER_OUTPUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastLoaded, setLastLoaded] = useState(null);
  const [truncated, setTruncated] = useState(false);

  const effectivePath = customPath.trim() || logPath;

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    setTruncated(false);
    try {
      const relPath = toRelativePath(effectivePath);
      const bytes = Math.min(
        MAX_FETCH_BYTES,
        Math.max(MIN_FETCH_BYTES, lines * BYTES_PER_LINE)
      );
      const url = `${API_BASE}/logs?path=${encodeURIComponent(relPath)}&bytes=${bytes}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        let msg = body;
        try { msg = JSON.parse(body).error || body; } catch { /* keep as text */ }
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        // Path pointed at a directory rather than a file.
        const dir = await res.json();
        const listing = [
          `# ${effectivePath} is a directory — pick a specific file below:`,
          '',
          ...(dir.dirs || []).map((d) => `[dir]  ${d}/`),
          ...(dir.files || []).map((f) => `[file] ${f.name}  (${f.size ?? '?'} bytes)`),
        ].join('\n');
        setOutput(listing);
      } else {
        const text = await res.text();
        // Server tails by bytes; slice the tail again by lines client-side
        // so the "last N lines" dropdown behaves like the user expects.
        const allLines = text.split('\n');
        const tail = allLines.slice(-lines).join('\n');
        setOutput(tail || '# (empty)');
        setTruncated(res.headers.get('x-log-truncated') === '1');
      }
      setLastLoaded(new Date());
    } catch (e) {
      setError(e.message);
      setOutput(PLACEHOLDER_OUTPUT);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${effectivePath.replace(/\//g, '_')}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredOutput = filter
    ? output
        .split('\n')
        .filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
        .join('\n')
    : output;

  return (
    <Box>
      <PageHeader
        title="Logs"
        subtitle="Pull log entries from /var/log on your server, on demand"
        actions={
          <Chip
            size="small"
            icon={<TerminalIcon sx={{ fontSize: 14 }} />}
            label={lastLoaded ? `Loaded ${lastLoaded.toLocaleTimeString()}` : 'Not loaded'}
            sx={{
              bgcolor: '#1f6feb22',
              color: '#58a6ff',
              border: '1px solid #1f6feb',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        }
      />

      <SectionCard
        title="Source"
        subtitle="Choose a file or enter a custom path under /var/log/"
        sx={{ mb: 2.5 }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200, ...inputSx }}>
            <InputLabel>Log file</InputLabel>
            <Select
              label="Log file"
              value={logPath}
              onChange={(e) => { setLogPath(e.target.value); setCustomPath(''); }}
              sx={{ color: '#c9d1d9', '.MuiSvgIcon-root': { color: '#8b949e' } }}
            >
              {COMMON_LOGS.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  {label} <Typography component="span" sx={{ color: '#6e7681', ml: 1, fontSize: '0.75rem' }}>{value}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="or /var/log/custom.log"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            sx={{ flex: 1, minWidth: 220, ...inputSx }}
          />

          <FormControl size="small" sx={{ minWidth: 130, ...inputSx }}>
            <InputLabel>Lines</InputLabel>
            <Select
              label="Lines"
              value={lines}
              onChange={(e) => setLines(e.target.value)}
              sx={{ color: '#c9d1d9', '.MuiSvgIcon-root': { color: '#8b949e' } }}
            >
              {LINE_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>last {n}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <RefreshIcon />}
            onClick={handleLoad}
            disabled={loading}
            sx={{
              bgcolor: '#238636', '&:hover': { bgcolor: '#2ea043' },
              textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap',
            }}
          >
            Fetch
          </Button>
        </Stack>
      </SectionCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, bgcolor: '#3d2222', color: '#f85149', border: '1px solid #f85149' }}>
          {error}
        </Alert>
      )}

      {truncated && !error && (
        <Alert severity="info" sx={{ mb: 2.5, bgcolor: '#0c2d6b', color: '#79c0ff', border: '1px solid #1f6feb' }}>
          Only the tail of the file was fetched. Increase the line count for more history.
        </Alert>
      )}

      <SectionCard
        title={effectivePath}
        subtitle={`Showing ${filteredOutput.split('\n').length} lines`}
        action={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 0.75, color: '#6e7681' }} /> }}
              sx={{ width: { xs: '100%', sm: 200 }, ...inputSx }}
            />
            <IconButton size="small" onClick={handleDownload} sx={{ color: '#8b949e', '&:hover': { color: '#58a6ff' } }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
        contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
      >
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2.5,
            bgcolor: '#010409',
            color: '#c9d1d9',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.78rem',
            lineHeight: 1.55,
            maxHeight: 520,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderTop: 'none',
          }}
        >
          {filteredOutput}
        </Box>
      </SectionCard>
    </Box>
  );
}
