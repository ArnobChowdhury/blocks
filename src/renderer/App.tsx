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
  Typography,
  useTheme,
  Dialog,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/system';
import { PageWrapper } from './layouts';
import { Today, Inbox, Tracker } from './pages';
import ArrowLeft from './icons/ArrowLeft';
import CalendarToday from './icons/CalendarToday';
import InboxIcon from './icons/Inbox';
import TrackerIcon from './icons/Tracker';
import Plus from './icons/Plus';
import { AddTask } from './widgets';
import { useApp } from './context/AppProvider';
import { executeAfterASecond, formatErrorMessage } from './utils';

const MyStyledListItemText = styled(ListItemText)({
  color: 'red', // Change this to the color you want
});

const customTheme = createTheme({
  typography: {
    fontFamily: 'M PLUS Rounded 1c, sans-serif',
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
  const theme = useTheme();
  const [showAddTask, setShowAddTask] = useState(false);

  return (
    <>
      <List>
        <ListItemButton onClick={() => setShowAddTask(true)} sx={{ mb: 1 }}>
          <ListItemIcon sx={{ minWidth: theme.spacing(4) }}>
            <Plus />
          </ListItemIcon>
          <MyStyledListItemText
            primary={
              <Typography
                variant="body1"
                sx={{ fontWeight: 500, color: theme.palette.primary.main }}
              >
                Add task
              </Typography>
            }
          />
        </ListItemButton>
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
      <Dialog open={showAddTask}>
        <AddTask widgetCloseFunc={setShowAddTask} />
      </Dialog>
    </>
  );
}

function App() {
  const [openDrawer, setOpenDrawer] = useState(true);

  const handleDrawerOpen = () => {
    setOpenDrawer(true);
  };

  const handleDrawerClose = () => {
    setOpenDrawer(false);
  };

  const {
    showNotification,
    notification,
    setShowNotification,
    setNotification,
  } = useApp();

  const handleNotificationClose = () => {
    setShowNotification(false);
    executeAfterASecond(() => setNotification(undefined));
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
            open={openDrawer}
          >
            <DrawerHeader>
              <IconButton onClick={handleDrawerClose}>
                <ArrowLeft />
              </IconButton>
            </DrawerHeader>
            <Navigation />
          </Drawer>
          <Main open={openDrawer}>
            <PageWrapper
              onRightArrowClick={handleDrawerOpen}
              isDrawerOpen={!openDrawer}
            >
              <Routes>
                <Route path="/" element={<Today />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/tracker" element={<Tracker />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </PageWrapper>
          </Main>

          <Snackbar
            open={showNotification}
            autoHideDuration={6000}
            onClose={handleNotificationClose}
          >
            <Alert
              severity={notification?.type}
              onClose={handleNotificationClose}
            >
              {notification?.type === 'error'
                ? formatErrorMessage(notification?.message)
                : notification?.message}
            </Alert>
          </Snackbar>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
