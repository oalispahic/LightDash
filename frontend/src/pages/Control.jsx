import { useState } from 'react';
import {
  Box, Grid, Typography, Button, TextField, Stack, Chip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  ToggleButtonGroup, ToggleButton, MenuItem, Select, FormControl, InputLabel, Alert,
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';

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

export default function Control() {
  const [confirm, setConfirm] = useState(null); // 'reboot' | 'shutdown' | null
  const [mode, setMode] = useState('delay'); // 'delay' | 'datetime' | 'cron'
  const [delayMin, setDelayMin] = useState(30);
  const [datetime, setDatetime] = useState('');
  const [cron, setCron] = useState('0 4 * * *');
  const [scheduled, setScheduled] = useState(null);
  const [notice, setNotice] = useState(null);

  const handleAction = (action) => {
    // TODO: wire to POST /api/control/<action>
    setConfirm(null);
    setNotice({ severity: 'info', text: `Mock: ${action} command queued. Wire to backend to execute.` });
  };

  const handleSchedule = () => {
    let summary = '';
    if (mode === 'delay') summary = `In ${delayMin} min`;
    else if (mode === 'datetime') summary = datetime ? new Date(datetime).toLocaleString() : '–';
    else summary = `Cron: ${cron}`;
    setScheduled({ mode, summary, createdAt: new Date() });
    setNotice({ severity: 'success', text: `Mock: schedule saved (${summary}). Wire to backend to persist.` });
  };

  const handleCancelSchedule = () => {
    setScheduled(null);
    setNotice({ severity: 'info', text: 'Mock: scheduled reboot canceled.' });
  };

  return (
    <Box>
      <PageHeader
        title="Control"
        subtitle="Power actions and reboot scheduling for the host machine"
        actions={
          <Chip
            size="small"
            icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
            label="Destructive actions"
            sx={{
              bgcolor: '#d2992222',
              color: '#d29922',
              border: '1px solid #d29922',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        }
      />

      {notice && (
        <Alert
          severity={notice.severity}
          onClose={() => setNotice(null)}
          sx={{ mb: 2.5, bgcolor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' }}
        >
          {notice.text}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Power" subtitle="Immediate actions on the physical server">
            <Stack spacing={2}>
              <PowerAction
                color="#f85149"
                bg="#3d2222"
                icon={<PowerSettingsNewIcon sx={{ fontSize: 22 }} />}
                title="Power off"
                description="Gracefully shut down the host. Requires physical access to power back on."
                onClick={() => setConfirm('shutdown')}
              />
              <PowerAction
                color="#d29922"
                bg="#3d3221"
                icon={<RestartAltIcon sx={{ fontSize: 22 }} />}
                title="Reboot now"
                description="Restart the host immediately. Services will be unavailable for ~1 minute."
                onClick={() => setConfirm('reboot')}
              />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Schedule reboot" subtitle="Pick when the next reboot should happen">
            <Stack spacing={2}>
              <ToggleButtonGroup
                exclusive
                value={mode}
                onChange={(_, v) => v && setMode(v)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    color: '#8b949e',
                    borderColor: '#30363d',
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    px: 1.75,
                  },
                  '& .Mui-selected': {
                    bgcolor: '#1f6feb22 !important',
                    color: '#58a6ff !important',
                    borderColor: '#1f6feb !important',
                  },
                }}
              >
                <ToggleButton value="delay">In N minutes</ToggleButton>
                <ToggleButton value="datetime">At date/time</ToggleButton>
                <ToggleButton value="cron">Recurring (cron)</ToggleButton>
              </ToggleButtonGroup>

              {mode === 'delay' && (
                <FormControl size="small" sx={inputSx} fullWidth>
                  <InputLabel>Delay</InputLabel>
                  <Select
                    label="Delay"
                    value={delayMin}
                    onChange={(e) => setDelayMin(e.target.value)}
                    sx={{ color: '#c9d1d9', '.MuiSvgIcon-root': { color: '#8b949e' } }}
                  >
                    {[5, 10, 15, 30, 60, 120, 240, 480].map((m) => (
                      <MenuItem key={m} value={m}>
                        in {m} minutes
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {mode === 'datetime' && (
                <TextField
                  size="small"
                  type="datetime-local"
                  label="Reboot at"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={inputSx}
                  fullWidth
                />
              )}

              {mode === 'cron' && (
                <TextField
                  size="small"
                  label="Cron expression"
                  value={cron}
                  onChange={(e) => setCron(e.target.value)}
                  helperText="Minute Hour Day Month DOW – e.g. '0 4 * * *' = every day at 04:00"
                  FormHelperTextProps={{ sx: { color: '#6e7681' } }}
                  sx={inputSx}
                  fullWidth
                />
              )}

              <Button
                variant="contained"
                startIcon={<ScheduleIcon />}
                onClick={handleSchedule}
                sx={{
                  bgcolor: '#1f6feb', '&:hover': { bgcolor: '#388bfd' },
                  textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start',
                }}
              >
                Save schedule
              </Button>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard
            title="Active schedule"
            subtitle="The next planned reboot, if one is set"
            action={
              scheduled && (
                <Button
                  size="small"
                  startIcon={<CancelIcon fontSize="small" />}
                  onClick={handleCancelSchedule}
                  sx={{ color: '#f85149', textTransform: 'none', '&:hover': { bgcolor: '#3d2222' } }}
                >
                  Cancel
                </Button>
              )
            }
          >
            {scheduled ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 1.5,
                  bgcolor: '#1f6feb22', color: '#58a6ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <EventAvailableIcon />
                </Box>
                <Box>
                  <Typography sx={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                    {scheduled.summary}
                  </Typography>
                  <Typography sx={{ color: '#8b949e', fontSize: '0.78rem' }}>
                    {scheduled.mode === 'cron' ? 'Recurring' : 'One-time'} • saved {scheduled.createdAt.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography sx={{ color: '#8b949e', fontSize: '0.85rem' }}>
                No reboot is currently scheduled.
              </Typography>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        PaperProps={{ sx: { bgcolor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 600 }}>
          Confirm {confirm === 'shutdown' ? 'shutdown' : 'reboot'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#8b949e' }}>
            {confirm === 'shutdown'
              ? 'The server will be powered off and will not come back until you physically turn it on.'
              : 'The server will restart now. Services will be unavailable for around a minute.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} sx={{ color: '#8b949e', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleAction(confirm)}
            variant="contained"
            sx={{
              bgcolor: confirm === 'shutdown' ? '#da3633' : '#d29922',
              '&:hover': { bgcolor: confirm === 'shutdown' ? '#f85149' : '#e3b341' },
              textTransform: 'none', fontWeight: 600,
            }}
          >
            {confirm === 'shutdown' ? 'Power off' : 'Reboot'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function PowerAction({ color, bg, icon, title, description, onClick }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 1.5,
        border: '1px solid #30363d',
        bgcolor: '#0d1117',
      }}
    >
      <Box sx={{
        width: 42, height: 42, borderRadius: 1.5, bgcolor: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography sx={{ color: '#8b949e', fontSize: '0.78rem' }}>
          {description}
        </Typography>
      </Box>
      <Button
        size="small"
        onClick={onClick}
        variant="outlined"
        sx={{
          textTransform: 'none', fontWeight: 600, borderColor: color, color,
          '&:hover': { borderColor: color, bgcolor: bg },
        }}
      >
        Run
      </Button>
    </Box>
  );
}
