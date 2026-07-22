import { useEffect, useState } from 'react';
import { Box, Grid, Typography, Chip, Alert, LinearProgress, CircularProgress, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import DnsIcon from '@mui/icons-material/DnsOutlined';
import ThermostatIcon from '@mui/icons-material/ThermostatOutlined';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';

const API_BASE = 'https://api.marexdev.com';

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return '–';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m`;
}

const tempColor = (c) => (c >= 80 ? 'error' : c >= 60 ? 'warning' : 'success');

export default function Dashboard({ token }) {
  const [status, setStatus] = useState(null);
  const [info, setInfo] = useState(null);
  const [temps, setTemps] = useState(null);
  const [tempMessage, setTempMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Viewport fix
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no');
    }
  }, []);


 useEffect(() => {
   const headers = { Authorization: `Bearer ${token}` };
   const fetchData = async () => {
     try {
       setError(null);
       const [statusRes, infoRes, tempRes, tempMsgRes] = await Promise.all([
         fetch(`${API_BASE}/status`, { headers }),
         fetch(`${API_BASE}/info`, { headers }),
         fetch(`${API_BASE}/temperature`, { headers }),
         fetch(`${API_BASE}/temp`, { headers }),
       ]);
       if (!statusRes.ok || !infoRes.ok || !tempRes.ok || !tempMsgRes.ok) {
         throw new Error(
           `API error: ${statusRes.status} ${infoRes.status} ${tempRes.status} ${tempMsgRes.status}`
         );
       }
       const [statusData, infoData, tempData, tempMsgData] = await Promise.all([
         statusRes.json(),
         infoRes.json(),
         tempRes.json(),
         tempMsgRes.json(),
       ]);
       setStatus(statusData);
       setInfo(infoData);
       setTemps(tempData.sensors || []);
       setTempMessage(tempMsgData.message);
     } catch (err) {
       console.error('Error fetching data:', err);
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };
 
   fetchData();
   const interval = setInterval(fetchData, 30000);
 
   // Touch listener for pull-to-refresh
   let lastY = 0;
   const handleTouchStart = (e) => {
     lastY = e.touches[0].clientY;
   };
   const handleTouchEnd = (e) => {
     if (e.changedTouches[0].clientY > lastY + 100 && window.scrollY === 0) {
       window.location.reload();
     }
   };
   window.addEventListener('touchstart', handleTouchStart);
   window.addEventListener('touchend', handleTouchEnd);
 
   // Single cleanup function for both
   return () => {
     clearInterval(interval);
     window.removeEventListener('touchstart', handleTouchStart);
     window.removeEventListener('touchend', handleTouchEnd);
   };
 }, [token]);

  const online = status?.status === 'online';
  const maxTemp = temps?.length ? Math.max(...temps.map((s) => s.celsius)) : null;

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of your server health and telemetry"
        actions={
          <Chip
            size="small"
            icon={online ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <ErrorOutlineIcon sx={{ fontSize: 14 }} />}
            label={loading ? 'Loading…' : online ? 'All systems operational' : 'Offline'}
            sx={{
              bgcolor: online ? '#23863622' : '#da363322',
              color: online ? '#3fb950' : '#f85149',
              border: `1px solid ${online ? '#238636' : '#da3633'}`,
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        }
      />

      <IconButton 
        size="small" 
        onClick={() => window.location.reload()}
        sx={{ color: '#58a6ff' }}
      >
        <RefreshIcon sx={{ fontSize: 18 }} />
      </IconButton>

      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: '#3d2222', color: '#f85149', border: '1px solid #f85149' }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={24} sx={{ color: '#58a6ff' }} />
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {/* Stat tiles */}
          <Grid item xs={12} sm={6} md={3}>
            <StatTile
              icon={<TimerIcon sx={{ fontSize: 18 }} />}
              label="Uptime"
              value={formatUptime(status?.uptime)}
              accent="#58a6ff"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatTile
              icon={<DnsIcon sx={{ fontSize: 18 }} />}
              label="Host"
              value={info?.host || '–'}
              accent="#3fb950"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatTile
              icon={<ThermostatIcon sx={{ fontSize: 18 }} />}
              label="Max temp"
              value={maxTemp !== null ? `${maxTemp}°C` : '–'}
              accent={maxTemp >= 80 ? '#f85149' : maxTemp >= 60 ? '#d29922' : '#3fb950'}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatTile
              icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
              label="Node"
              value={info?.node || '–'}
              accent="#a371f7"
            />
          </Grid>

          {/* Sensors */}
          <Grid item xs={12} md={8}>
            <SectionCard title="Temperature sensors" subtitle="Live hardware monitor (hwmon)">
              {temps && temps.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {temps.map((s, idx) => {
                    const pct = Math.min(100, (s.celsius / 100) * 100);
                    const color = tempColor(s.celsius);
                    const hex = color === 'error' ? '#f85149' : color === 'warning' ? '#d29922' : '#3fb950';
                    return (
                      <Box key={idx}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ color: '#c9d1d9', fontSize: '0.85rem', fontWeight: 500 }}>
                              {s.label}
                            </Typography>
                            <Typography sx={{ color: '#6e7681', fontSize: '0.7rem' }}>
                              {s.sensor}
                            </Typography>
                          </Box>
                          <Typography sx={{ color: hex, fontSize: '0.9rem', fontWeight: 700 }}>
                            {s.celsius}°C
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 5,
                            borderRadius: 5,
                            bgcolor: '#21262d',
                            '& .MuiLinearProgress-bar': { bgcolor: hex, borderRadius: 5 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography sx={{ color: '#8b949e', fontSize: '0.85rem' }}>
                  No sensor data available.
                </Typography>
              )}
            </SectionCard>
          </Grid>

          {/* System info & temp message */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <SectionCard title="System">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <InfoRow label="Name" value={info?.name} />
                  <InfoRow label="Host" value={info?.host} />
                  <InfoRow label="Node" value={info?.node} />
                  <InfoRow label="Status" value={status?.status} />
                </Box>
              </SectionCard>

              {tempMessage && (
                <SectionCard title="Latest temp note">
                  <Typography sx={{ color: '#c9d1d9', fontSize: '0.85rem', wordBreak: 'break-word' }}>
                    {tempMessage}
                  </Typography>
                </SectionCard>
              )}
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

function StatTile({ icon, label, value, accent }) {
  return (
    <SectionCard sx={{ height: '100%' }} contentSx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: accent }}>
        {icon}
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ color: '#fff', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </SectionCard>
  );
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ color: '#8b949e', fontSize: '0.78rem' }}>{label}</Typography>
      <Typography sx={{ color: '#c9d1d9', fontSize: '0.78rem', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>
        {value ?? '–'}
      </Typography>
    </Box>
  );
}
