import '@fontsource/m-plus-rounded-1c/400.css';
import '@fontsource/m-plus-rounded-1c/500.css';
import '@fontsource/m-plus-rounded-1c/700.css';
import '@fontsource/m-plus-rounded-1c/800.css';
import './App.css';

import { useState } from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
} from 'react-router-dom';
import {
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { styled } from '@mui/system';
import { PageWrapper } from './layouts';
import { Today, Inbox, Tracker } from './pages';
import ArrowLeft from './icons/ArrowLeft';
import CalendarToday from './icons/CalendarToday';
import InboxIcon from './icons/Inbox';
import TrackerIcon from './icons/Tracker';

// Create a custom theme
const customTheme = createTheme({
  typography: {
    // fontFamily: 'M PLUS Rounded 1c, sans-serif',
    fontFamily: 'M PLUS Rounded 1c',
    //  "M PLUS Rounded 1c";
    allVariants: {
      color: '#333333',
    },
  },
  palette: {
    primary: {
      main: '#01877E', // Change this to your desired color background: #01877E;
    },
    secondary: {
      main: '#FFA17A', // Change this to your desired colorbackground: #F0EED9;
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase transformation
        },
      },
    },
  },
});

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(1),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    marginLeft: 0,
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(1),
}));

function Navigation() {
  const location = useLocation();

  return (
    <List>
      <ListItemButton
        component={Link}
        to="/"
        selected={location.pathname === '/'}
      >
        <ListItemIcon>
          <CalendarToday date={new Date().getDate()} />
        </ListItemIcon>
        <ListItemText primary="Today" />
      </ListItemButton>
      <ListItemButton
        component={Link}
        to="/inbox"
        selected={location.pathname === '/inbox'}
      >
        <ListItemIcon>
          <InboxIcon />
        </ListItemIcon>
        <ListItemText primary="Inbox" />
      </ListItemButton>
      <ListItemButton
        component={Link}
        to="/tracker"
        selected={location.pathname === '/tracker'}
      >
        <ListItemIcon>
          <TrackerIcon />
        </ListItemIcon>
        <ListItemText primary="Tracker" />
      </ListItemButton>
    </List>
  );
}

function App() {
  // const theme = useTheme();
  const [open, setOpen] = useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
            variant="persistent"
            anchor="left"
            open={open}
          >
            <DrawerHeader>
              <IconButton onClick={handleDrawerClose}>
                {/* {theme.direction === 'ltr' ? <ChevronLeft /> : <ChevronRight />} */}
                <ArrowLeft />
              </IconButton>
            </DrawerHeader>
            <Navigation />
          </Drawer>
          <Main open={open}>
            <PageWrapper
              onRightArrowClick={handleDrawerOpen}
              isDrawerOpen={!open}
            >
              <Routes>
                <Route path="/" element={<Today />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/tracker" element={<Tracker />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </PageWrapper>
          </Main>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
