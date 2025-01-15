import { ReactNode } from 'react';
import { IconButton, Box, Container } from '@mui/material';
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
        {isDrawerOpen && (
          <IconButton
            sx={{ position: 'fixed', top: 8, left: 8 }}
            onClick={onRightArrowClick}
          >
            <ArrowRight />
          </IconButton>
        )}
      </div>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100vh',
          alignItems: 'start',
          width: '100%',
        }}
      >
        <Container
          sx={{
            width: '800px',
            padding: 2,
          }}
        >
          {children}
        </Container>
      </Box>
    </div>
  );
}

export default PageWrapper;
