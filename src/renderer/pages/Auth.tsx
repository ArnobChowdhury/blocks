import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, CircularProgress, Box } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { ChannelsEnum } from '../types';
import { PageHeader } from '../components';
import { useApp } from '../context/AppProvider';

function Auth() {
  const {
    setNotifier,
    setUser,
    handleLoadingSpaces,
    setShouldCheckAnonDataExistence,
  } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_GOOGLE_AUTH_START,
      );

      if (result.success) {
        setNotifier('Sign in successful!', 'success');
        setUser(result.data.user);
        await handleLoadingSpaces();
        setShouldCheckAnonDataExistence(true);
        navigate('/');
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
      <Box display="flex" justifyContent="center" mt={5}>
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
          sx={{
            px: 5,
            minWidth: '480px',
          }}
        >
          {isLoading ? 'Signing In...' : 'Continue with Google'}
        </Button>
      </Box>
    </Box>
  );
}

export default Auth;
