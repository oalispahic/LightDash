import { useState, useEffect } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography,
  IconButton, useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Control from './pages/Control';
import Users from './pages/Users';
import Processes from './pages/Processes';
import SideNav from './components/SideNav';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
    primary: { main: '#58a6ff' },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shape: { borderRadius: 8 },
});

const VIEWS = {
  dashboard: { Component: Dashboard, label: 'Dashboard' },
  logs: { Component: Logs, label: 'Logs' },
  control: { Component: Control, label: 'Control' },
  users: { Component: Users, label: 'Users' },
  processes: { Component: Processes, label: 'Processes' },
};

function decodeUsername(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload?.username || 'admin';
  } catch {
    return 'admin';
  }
}

function AuthedShell({ token, username, view, setView, onLogout, serverName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const ActiveView = (VIEWS[view] || VIEWS.dashboard).Component;
  const activeLabel = (VIEWS[view] || VIEWS.dashboard).label;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0d1117' }}>
      <SideNav
        active={view}
        onSelect={setView}
        onLogout={onLogout}
        username={username}
        serverName={serverName}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {!isDesktop && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: '#0a0d12',
              borderBottom: '1px solid #21262d',
              backgroundImage: 'none',
            }}
          >
            <Toolbar variant="dense" sx={{ minHeight: 52, px: 1.5 }}>
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ color: '#c9d1d9', mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                {serverName}
              </Typography>
              <Typography sx={{ color: '#8b949e', fontSize: '0.8rem', ml: 1.5 }}>
                / {activeLabel}
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 }, overflowX: 'hidden' }}>
          <ActiveView token={token} />
        </Box>
      </Box>
    </Box>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [view, setView] = useState('dashboard');
  const [serverName, setServerName] = useState('Server');

  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    fetch('https://api.marexdev.com/config')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg?.serverName) {
          setServerName(cfg.serverName);
          document.title = cfg.serverName;
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = (jwtToken) => {
    localStorage.setItem('jwt_token', jwtToken);
    setToken(jwtToken);
    setIsAuthenticated(true);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  const username = token ? decodeUsername(token) : 'admin';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated ? (
        <AuthedShell
          token={token}
          username={username}
          view={view}
          setView={setView}
          onLogout={handleLogout}
          serverName={serverName}
        />
      ) : (
        <Login onLogin={handleLogin} serverName={serverName} />
      )}
    </ThemeProvider>
  );
}
