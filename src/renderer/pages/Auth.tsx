import { useState } from 'react';
import { Button, Typography, CircularProgress, Box } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { ChannelsEnum } from '../types';
import { PageHeader } from '../components';
import { useApp } from '../context/AppProvider';

function Auth() {
  const { setNotifier } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_GOOGLE_AUTH_START,
      );

      if (result.success) {
        setNotifier('Sign in successful!', 'success');
        // TODO: Store tokens (result.data) and manage user state/redirect
        console.log('Received tokens:', result.data);
      } else {
        setNotifier(result.error || 'An unknown error occurred.', 'error');
      }
    } catch (error: any) {
      setNotifier(
        error.message || 'An unexpected error occurred during sign-in.',
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader>Sign in or Sign up</PageHeader>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Having an account is optional and is mainly for enabling premium
        features like data sync. By default, all your data is stored locally on
        this device.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        startIcon={
          isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <GoogleIcon />
          )
        }
      >
        {isLoading ? 'Signing In...' : 'Continue with Google'}
      </Button>
    </Box>
  );
}

export default Auth;
