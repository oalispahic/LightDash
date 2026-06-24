import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#c9d1d9',
    bgcolor: '#0d1117',
    fontSize: '0.92rem',
    '& fieldset': { borderColor: '#30363d' },
    '&:hover fieldset': { borderColor: '#444c56' },
    '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
  },
  '& .MuiInputLabel-root': { color: '#8b949e' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#58a6ff' },
};

export default function LoginForm({ onLogin, serverName = 'Server' }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.marexdev.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid credentials');
      }

      if (!result.token) {
        throw new Error('No token received');
      }

      onLogin(result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: '#0d1117',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(31,111,235,0.18), transparent 70%)',
      }}
    >
      {/* Header */}
      <Box sx={{ py: 2.5, borderBottom: '1px solid #21262d' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.3px' }}>
              {serverName}
            </Typography>
            <Typography sx={{ color: '#8b949e', fontSize: '0.75rem' }}>
              server control
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Login Form */}
      <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, py: 8 }}>
        <Box
          sx={{
            bgcolor: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 2,
            p: { xs: 3, sm: 4 },
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 1, fontSize: '1.35rem' }}>
            Sign in
          </Typography>
          <Typography sx={{ color: '#8b949e', mb: 3.5, fontSize: '0.88rem' }}>
            Access your system dashboard
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{ bgcolor: '#3d2222', color: '#f85149', border: '1px solid #f85149' }}
                >
                  {error}
                </Alert>
              )}

              <TextField
                label="Username"
                fullWidth
                size="medium"
                placeholder="Enter your username"
                {...register('username', { required: 'Username is required' })}
                error={!!errors.username}
                helperText={errors.username?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: '#6e7681', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                size="medium"
                placeholder="Enter your password"
                {...register('password', { required: 'Password is required' })}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#6e7681', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((v) => !v)}
                        sx={{ color: '#6e7681', '&:hover': { color: '#c9d1d9' } }}
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : null}
                sx={{
                  mt: 0.5,
                  bgcolor: '#238636',
                  '&:hover': { bgcolor: '#2ea043' },
                  fontWeight: 600,
                  py: 1.1,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </Box>
          </form>
        </Box>

        <Typography sx={{ color: '#6e7681', fontSize: '0.72rem', textAlign: 'center', mt: 3 }}>
          {serverName} • self-hosted
        </Typography>
      </Container>
    </Box>
  );
}
