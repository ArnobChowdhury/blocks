import { Box, CircularProgress, Typography } from '@mui/material';

function SyncIndicator() {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'background.paper',
        padding: '4px 12px',
        borderRadius: '16px',
        boxShadow: 3,
        zIndex: (theme) => theme.zIndex.snackbar + 1, // Ensure it's on top
      }}
    >
      <CircularProgress size={16} sx={{ mr: 1 }} />
      <Typography variant="body2" color="text.secondary">
        Syncing...
      </Typography>
    </Box>
  );
}

export default SyncIndicator;
