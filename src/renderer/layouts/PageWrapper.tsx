import { ReactNode } from 'react';
import { IconButton, Box, Fade, Container } from '@mui/material';
import ArrowRight from '../icons/ArrowRight';

interface IPageWrapperProps {
  children: ReactNode;
  onRightArrowClick: () => void;
  isDrawerOpen: boolean;
}
function PageWrapper({
  children,
  onRightArrowClick,
  isDrawerOpen,
}: IPageWrapperProps) {
  return (
    <div style={{ display: 'flex' }}>
      <div>
        <Fade in={isDrawerOpen} timeout={100}>
          <IconButton onClick={onRightArrowClick}>
            <ArrowRight />
          </IconButton>
        </Fade>
      </div>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center', // Horizontally center the container
          minHeight: '100vh', // Ensure it takes at least the full viewport height
          alignItems: 'start', // Align items to the start of the flex container
          width: '100%',
        }}
      >
        <Container
          sx={{
            // maxWidth: '600px', // Limit the container width
            width: '800px', // Make sure it takes full width within the maxWidth
            padding: 2, // Add some padding
          }}
        >
          {children}
        </Container>
      </Box>
    </div>
  );
}

export default PageWrapper;
