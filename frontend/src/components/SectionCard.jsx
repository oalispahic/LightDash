import { Box, Card, CardContent, Typography } from '@mui/material';

export default function SectionCard({ title, subtitle, action, children, sx = {}, contentSx = {} }) {
  return (
    <Card
      sx={{
        bgcolor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 2,
        height: '100%',
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1.5, sm: 2 },
            flexWrap: 'wrap',
            px: { xs: 2, sm: 2.5 },
            py: 1.75,
            borderBottom: '1px solid #21262d',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title && (
              <Typography sx={{ color: '#fff', fontSize: '0.92rem', fontWeight: 600, wordBreak: 'break-word' }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography sx={{ color: '#8b949e', fontSize: '0.75rem', mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>{action}</Box>}
        </Box>
      )}
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}
