import { useState } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Stack, TextField, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';

const SEED_USERS = [
  { id: 1, username: 'omar', role: 'admin', createdAt: '2026-01-12T10:32:00Z' },
  { id: 2, username: 'danko', role: 'admin', createdAt: '2026-02-04T08:14:00Z' },
  { id: 3, username: 'test', role: 'viewer', createdAt: '2026-03-21T19:01:00Z' },
];

const ROLES = ['admin', 'editor', 'viewer'];

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

export default function Users() {
  const [users, setUsers] = useState(SEED_USERS);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null); // { mode: 'create'|'edit', user }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notice, setNotice] = useState({ severity: 'info', text: 'UI only — wire actions to backend endpoints.' });

  const filtered = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => setDialog({ mode: 'create', user: { username: '', password: '', role: 'viewer' } });
  const openEdit = (user) => setDialog({ mode: 'edit', user: { ...user, password: '' } });

  const handleSave = () => {
    const { mode, user } = dialog;
    if (!user.username) return;
    if (mode === 'create') {
      setUsers((prev) => [
        ...prev,
        { id: Math.max(0, ...prev.map((p) => p.id)) + 1, username: user.username, role: user.role, createdAt: new Date().toISOString() },
      ]);
      setNotice({ severity: 'success', text: `Mock: created "${user.username}".` });
    } else {
      setUsers((prev) => prev.map((p) => (p.id === user.id ? { ...p, username: user.username, role: user.role } : p)));
      setNotice({ severity: 'success', text: `Mock: updated "${user.username}".` });
    }
    setDialog(null);
  };

  const handleDelete = () => {
    setUsers((prev) => prev.filter((p) => p.id !== confirmDelete.id));
    setNotice({ severity: 'success', text: `Mock: deleted "${confirmDelete.username}".` });
    setConfirmDelete(null);
  };

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage who can sign in to the dashboard"
        actions={
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={openCreate}
            sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2ea043' }, textTransform: 'none', fontWeight: 600 }}
          >
            New user
          </Button>
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

      <SectionCard
        title={`${users.length} user${users.length === 1 ? '' : 's'}`}
        subtitle="Backed by the SQLite users table"
        action={
          <TextField
            size="small"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 0.75, color: '#6e7681' }} /> }}
            sx={{ width: { xs: '100%', sm: 220 }, ...inputSx }}
          />
        }
        contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
      >
        <TableContainer sx={{ bgcolor: 'transparent' }}>
          <Table size="small" sx={{
            '& th, & td': { borderColor: '#21262d', color: '#c9d1d9', fontSize: '0.82rem' },
            '& th': { color: '#8b949e', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' },
          }}>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover sx={{ '&:hover': { bgcolor: '#0d1117 !important' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#1f6feb', fontSize: '0.78rem' }}>
                        {u.username.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                          {u.username}
                        </Typography>
                        <Typography sx={{ color: '#6e7681', fontSize: '0.7rem' }}>
                          id #{u.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <RoleChip role={u.role} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#8b949e', fontSize: '0.78rem' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: '#8b949e', '&:hover': { color: '#58a6ff' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setConfirmDelete(u)} sx={{ color: '#8b949e', '&:hover': { color: '#f85149' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#8b949e' }}>
                    No users match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      {/* Create / Edit dialog */}
      <Dialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        PaperProps={{ sx: { bgcolor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9', minWidth: 380 } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 600 }}>
          {dialog?.mode === 'create' ? 'Create user' : `Edit ${dialog?.user?.username}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              size="small"
              value={dialog?.user?.username || ''}
              onChange={(e) => setDialog({ ...dialog, user: { ...dialog.user, username: e.target.value } })}
              sx={inputSx}
              fullWidth
            />
            <TextField
              label={dialog?.mode === 'edit' ? 'New password (leave blank to keep)' : 'Password'}
              type="password"
              size="small"
              value={dialog?.user?.password || ''}
              onChange={(e) => setDialog({ ...dialog, user: { ...dialog.user, password: e.target.value } })}
              sx={inputSx}
              fullWidth
            />
            <FormControl size="small" sx={inputSx} fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={dialog?.user?.role || 'viewer'}
                onChange={(e) => setDialog({ ...dialog, user: { ...dialog.user, role: e.target.value } })}
                sx={{ color: '#c9d1d9', '.MuiSvgIcon-root': { color: '#8b949e' } }}
              >
                {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} sx={{ color: '#8b949e', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2ea043' }, textTransform: 'none', fontWeight: 600 }}
          >
            {dialog?.mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        PaperProps={{ sx: { bgcolor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 600 }}>Delete user?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#8b949e' }}>
            This will permanently remove <strong style={{ color: '#fff' }}>{confirmDelete?.username}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ color: '#8b949e', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{ bgcolor: '#da3633', '&:hover': { bgcolor: '#f85149' }, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function RoleChip({ role }) {
  const palette = {
    admin: { color: '#f85149', bg: '#3d2222', border: '#da3633' },
    editor: { color: '#d29922', bg: '#3d3221', border: '#bb8009' },
    viewer: { color: '#58a6ff', bg: '#1f6feb22', border: '#1f6feb' },
  };
  const p = palette[role] || palette.viewer;
  return (
    <Chip
      size="small"
      label={role}
      sx={{
        bgcolor: p.bg, color: p.color, border: `1px solid ${p.border}`,
        fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize',
      }}
    />
  );
}
