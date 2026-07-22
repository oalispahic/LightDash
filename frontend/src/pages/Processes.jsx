import { useEffect, useState, useCallback } from 'react';
import {
  Box, Grid, Typography, Chip, LinearProgress, IconButton, TextField, Stack,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButtonGroup, ToggleButton, CircularProgress, Alert,
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/MemoryOutlined';
import StorageIcon from '@mui/icons-material/StorageOutlined';
import SpeedIcon from '@mui/icons-material/SpeedOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import CircleIcon from '@mui/icons-material/Circle';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';

const API_BASE = 'https://api.marexdev.com';

// OS-level processes and resource-usage tiles are still placeholders —
// they need a systems-agent action that isn't built yet. The Docker
// tab, on the other hand, is now live.
const MOCK_PROCESSES = [
  { pid: 1, user: 'root', cmd: '/sbin/init', cpu: 0.0, mem: 0.4 },
  { pid: 412, user: 'root', cmd: 'sshd', cpu: 0.0, mem: 0.2 },
  { pid: 821, user: 'omar', cmd: 'node /app/src/index.js', cpu: 1.6, mem: 2.1 },
  { pid: 922, user: 'root', cmd: 'dockerd', cpu: 0.8, mem: 1.9 },
  { pid: 1133, user: 'omar', cmd: 'nginx: worker process', cpu: 0.1, mem: 0.3 },
  { pid: 1240, user: 'omar', cmd: 'cloudflared tunnel run', cpu: 0.4, mem: 0.7 },
];

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#c9d1d9',
    bgcolor: '#0d1117',
    fontSize: '0.85rem',
    '& fieldset': { borderColor: '#30363d' },
    '&:hover fieldset': { borderColor: '#444c56' },
    '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
  },
};

export default function Processes({ token }) {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('cpu');

  const [containers, setContainers] = useState([]);
  const [containersLoading, setContainersLoading] = useState(true);
  const [containersError, setContainersError] = useState(null);

  const cpuPct = 18;
  const memUsed = 4.2;
  const memTotal = 16;
  const diskUsed = 78;
  const memPct = (memUsed / memTotal) * 100;

  const loadContainers = useCallback(async () => {
    setContainersLoading(true);
    setContainersError(null);
    try {
      const res = await fetch(`${API_BASE}/dockerps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        let msg = body;
        try { msg = JSON.parse(body).error || body; } catch { /* keep raw */ }
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setContainers(data.containers || []);
    } catch (e) {
      setContainersError(e.message);
      setContainers([]);
    } finally {
      setContainersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, 30000);
    return () => clearInterval(interval);
  }, [loadContainers]);

  const filteredContainers = containers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.image || '').toLowerCase().includes(search.toLowerCase())
  );
  const processes = [...MOCK_PROCESSES]
    .filter((p) => p.cmd.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <Box>
      <PageHeader
        title="Processes"
        subtitle="Docker containers, OS processes, and resource usage"
        actions={
          <IconButton
            onClick={loadContainers}
            disabled={containersLoading}
            sx={{ bgcolor: '#161b22', border: '1px solid #30363d', color: '#8b949e', '&:hover': { color: '#58a6ff' } }}
          >
            {containersLoading
              ? <CircularProgress size={16} sx={{ color: '#8b949e' }} />
              : <RefreshIcon fontSize="small" />}
          </IconButton>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <ResourceTile
            icon={<SpeedIcon sx={{ fontSize: 18 }} />}
            label="CPU"
            primary={`${cpuPct}%`}
            secondary="across 8 cores"
            value={cpuPct}
            accent="#58a6ff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ResourceTile
            icon={<MemoryIcon sx={{ fontSize: 18 }} />}
            label="Memory"
            primary={`${memUsed.toFixed(1)} / ${memTotal} GB`}
            secondary={`${memPct.toFixed(0)}% used`}
            value={memPct}
            accent="#3fb950"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ResourceTile
            icon={<StorageIcon sx={{ fontSize: 18 }} />}
            label="Disk"
            primary={`${diskUsed}%`}
            secondary="/dev/sda1"
            value={diskUsed}
            accent={diskUsed >= 85 ? '#f85149' : '#d29922'}
          />
        </Grid>
      </Grid>

      {containersError && tab === 0 && (
        <Alert severity="error" sx={{ mb: 2.5, bgcolor: '#3d2222', color: '#f85149', border: '1px solid #f85149' }}>
          {containersError}
        </Alert>
      )}

      <SectionCard
        contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
        sx={{ border: '1px solid #30363d' }}
      >
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, px: { xs: 1.5, sm: 2 }, pt: 1.25, borderBottom: '1px solid #21262d', gap: 1.5, flexWrap: 'wrap' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { color: '#8b949e', textTransform: 'none', fontSize: '0.85rem', minHeight: 40, py: 1, fontWeight: 600 },
              '& .Mui-selected': { color: '#fff !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#58a6ff', height: 2 },
            }}
          >
            <Tab label={`Docker (${containers.length})`} />
            <Tab label={`Processes (${MOCK_PROCESSES.length})`} />
          </Tabs>
          <Stack direction="row" spacing={1} sx={{ pb: 1 }}>
            {tab === 1 && (
              <ToggleButtonGroup
                size="small"
                exclusive
                value={sortBy}
                onChange={(_, v) => v && setSortBy(v)}
                sx={{
                  '& .MuiToggleButton-root': { color: '#8b949e', borderColor: '#30363d', textTransform: 'none', fontSize: '0.72rem', px: 1.25, py: 0.25 },
                  '& .Mui-selected': { bgcolor: '#1f6feb22 !important', color: '#58a6ff !important', borderColor: '#1f6feb !important' },
                }}
              >
                <ToggleButton value="cpu">Sort: CPU</ToggleButton>
                <ToggleButton value="mem">Sort: MEM</ToggleButton>
              </ToggleButtonGroup>
            )}
            <TextField
              size="small"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 0.75, color: '#6e7681' }} /> }}
              sx={{ width: { xs: 160, sm: 220 }, ...inputSx }}
            />
          </Stack>
        </Box>

        {tab === 0 && (
          <TableContainer>
            <Table size="small" sx={{
              '& th, & td': { borderColor: '#21262d', color: '#c9d1d9', fontSize: '0.82rem' },
              '& th': { color: '#8b949e', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' },
            }}>
              <TableHead>
                <TableRow>
                  <TableCell>Container</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {containersLoading && containers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: 'center', color: '#8b949e', py: 3 }}>
                      Loading containers…
                    </TableCell>
                  </TableRow>
                )}
                {!containersLoading && filteredContainers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: 'center', color: '#8b949e', py: 3 }}>
                      {search ? 'No containers match your search.' : 'No containers reported.'}
                    </TableCell>
                  </TableRow>
                )}
                {filteredContainers.map((c) => (
                  <TableRow key={c.name} hover>
                    <TableCell>
                      <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</Typography>
                      <Typography sx={{ color: '#6e7681', fontSize: '0.72rem' }}>{c.image}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip state={c.state} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: '#8b949e', fontSize: '0.78rem' }}>{c.status}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer>
            <Table size="small" sx={{
              '& th, & td': { borderColor: '#21262d', color: '#c9d1d9', fontSize: '0.82rem' },
              '& th': { color: '#8b949e', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' },
            }}>
              <TableHead>
                <TableRow>
                  <TableCell>PID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Command</TableCell>
                  <TableCell align="right">CPU%</TableCell>
                  <TableCell align="right">MEM%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processes.map((p) => (
                  <TableRow key={p.pid} hover>
                    <TableCell>
                      <Typography sx={{ color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.82rem' }}>{p.pid}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={p.user}
                        sx={{
                          bgcolor: '#0d1117', color: '#8b949e', border: '1px solid #30363d',
                          fontWeight: 500, fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {p.cmd}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {p.cpu.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {p.mem.toFixed(1)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>
    </Box>
  );
}

function ResourceTile({ icon, label, primary, secondary, value, accent }) {
  return (
    <SectionCard contentSx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, color: accent }}>
        {icon}
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1 }}>
        {primary}
      </Typography>
      <Typography sx={{ color: '#8b949e', fontSize: '0.75rem', mt: 0.25, mb: 1.5 }}>
        {secondary}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 5,
          borderRadius: 5,
          bgcolor: '#21262d',
          '& .MuiLinearProgress-bar': { bgcolor: accent, borderRadius: 5 },
        }}
      />
    </SectionCard>
  );
}

function StatusChip({ state }) {
  const running = state === 'running';
  return (
    <Chip
      size="small"
      icon={<CircleIcon sx={{ fontSize: '0.55rem !important' }} />}
      label={state || 'unknown'}
      sx={{
        bgcolor: running ? '#23863622' : '#3d2222',
        color: running ? '#3fb950' : '#f85149',
        border: `1px solid ${running ? '#238636' : '#da3633'}`,
        fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize',
        '& .MuiChip-icon': { color: 'inherit', ml: 0.75 },
      }}
    />
  );
}
