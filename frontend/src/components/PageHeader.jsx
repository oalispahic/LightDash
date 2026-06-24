import { Box, Typography } from '@mui/material';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 4,
      }}
    >
      <Box>
        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1.4rem', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: '#8b949e', fontSize: '0.85rem', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
