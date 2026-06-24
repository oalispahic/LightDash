import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider, Avatar, Tooltip, Drawer, useMediaQuery, useTheme } from '@mui/material';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import LogsIcon from '@mui/icons-material/ArticleOutlined';
import ControlIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import UsersIcon from '@mui/icons-material/GroupOutlined';
import ProcessesIcon from '@mui/icons-material/MemoryOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';

export const SIDENAV_WIDTH = 240;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { id: 'logs', label: 'Logs', icon: <LogsIcon fontSize="small" /> },
  { id: 'control', label: 'Control', icon: <ControlIcon fontSize="small" /> },
  { id: 'users', label: 'Users', icon: <UsersIcon fontSize="small" /> },
  { id: 'processes', label: 'Processes', icon: <ProcessesIcon fontSize="small" /> },
];

function NavContent({ active, onSelect, onLogout, username, serverName }) {
  return (
    <Box
      sx={{
        width: SIDENAV_WIDTH,
        bgcolor: '#0a0d12',
        borderRight: { md: '1px solid #21262d' },
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: '1px solid #21262d' }}>
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1 }}>
          {serverName}
        </Typography>
        <Typography sx={{ color: '#8b949e', fontSize: '0.7rem' }}>
          server console
        </Typography>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
        <Typography sx={{ color: '#6e7681', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', px: 2.5, mb: 0.75 }}>
          Workspace
        </Typography>
        <List dense sx={{ p: 0 }}>
          {NAV_ITEMS.map(item => {
            const selected = item.id === active;
            return (
              <ListItemButton
                key={item.id}
                onClick={() => onSelect(item.id)}
                selected={selected}
                sx={{
                  mx: 1.25, my: 0.25, borderRadius: 1.25, py: 0.85, px: 1.5,
                  color: selected ? '#fff' : '#c9d1d9',
                  borderLeft: selected ? '2px solid #3fb950' : '2px solid transparent',
                  pl: 1.25,
                  '&.Mui-selected': {
                    bgcolor: 'transparent',
                    '&:hover': { bgcolor: '#161b22' },
                  },
                  '&:hover': { bgcolor: '#161b22' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30, color: selected ? '#c9d1d9' : '#8b949e' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: selected ? 600 : 500 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: '#21262d' }} />

      {/* User block */}
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Avatar sx={{ width: 30, height: 30, bgcolor: '#238636', fontSize: '0.8rem' }}>
          {username.slice(0, 1).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {username}
          </Typography>
          <Typography sx={{ color: '#8b949e', fontSize: '0.7rem' }}>
            signed in
          </Typography>
        </Box>
        <Tooltip title="Sign out">
          <ListItemButton
            onClick={onLogout}
            sx={{
              p: 0.75, borderRadius: 1, flex: '0 0 auto',
              color: '#8b949e',
              '&:hover': { bgcolor: '#161b22', color: '#f85149' },
            }}
          >
            <LogoutIcon fontSize="small" />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default function SideNav({ active, onSelect, onLogout, username = 'admin', serverName = 'Server', mobileOpen = false, onMobileClose }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const content = (
    <NavContent
      active={active}
      onSelect={(id) => { onSelect(id); if (!isDesktop) onMobileClose?.(); }}
      onLogout={onLogout}
      username={username}
      serverName={serverName}
    />
  );

  if (isDesktop) {
    return (
      <Box sx={{ position: 'sticky', top: 0, flexShrink: 0 }}>
        {content}
      </Box>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{ sx: { bgcolor: '#0a0d12', borderRight: '1px solid #21262d' } }}
    >
      {content}
    </Drawer>
  );
}
