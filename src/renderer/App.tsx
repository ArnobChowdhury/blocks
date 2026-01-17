import '@fontsource/hanken-grotesk';
import '@fontsource/hanken-grotesk/200.css';
import '@fontsource/hanken-grotesk/300.css';
import '@fontsource/hanken-grotesk/500.css';
import './App.css';

import React, { useState, useRef, useEffect } from 'react';

import {
  HashRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Button,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  ListItem,
  Alert,
  Collapse,
} from '@mui/material';
import { styled } from '@mui/system';
import Grid3x3Icon from '@mui/icons-material/Grid3x3';
import HistoryIcon from '@mui/icons-material/History';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PageWrapper } from './layouts';
import {
  Today,
  Active,
  Tracker,
  Space,
  Auth,
  Settings,
  Overdue,
} from './pages';
import ArrowLeft from './icons/ArrowLeft';
import ArrowRight from './icons/ArrowRight';
import ArrowDown from './icons/ArrowDown';
import CalendarToday from './icons/CalendarToday';
import TrackerIcon from './icons/Tracker';
import Plus from './icons/Plus';
import Logo from './icons/Logo';
import LoginIcon from './icons/Login';
import SettingsIcon from './icons/Settings';
import LogoutIcon from './icons/Logout';
import Crown from './icons/Crown';
import { AddTask, EditTask } from './widgets';
import { CustomThemeProvider } from './context/ThemeProvider';
import { useApp } from './context/AppProvider';
import { formatErrorMessage } from './utils';
import {
  ROUTE_ROOT,
  ROUTE_ACTIVE,
  ROUTE_TRACKER,
  ROUTE_TASKS_WITHOUT_A_SPACE,
  ROUTE_AUTH,
  ROUTE_SETTINGS,
  ROUTE_OVERDUE,
} from './constants';
import { ChannelsEnum } from './types';
import { SyncIndicator } from './components';

const MyStyledListItemText = styled(ListItemText)({
  color: 'red',
});

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open: boolean;
  drawerWidth: number;
}>(({ theme, open, drawerWidth }) => ({
  position: 'relative',
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
  const {
    showAddTask,
    addTaskToday,
    setAddTaskToday,
    setShowAddTask,
    taskForEdit,
    setTaskIdForEdit,
    setTaskForEdit,
    repetitiveTaskTemplateForEdit,
    setRepetitiveTaskTemplateIdForEdit,
    setRepetitiveTaskTemplateForEdit,
    handlePageRefresh,
    allSpaces,
    handleLoadingSpaces,
    setNotifier,
    user,
    setUser,
    showAnonDataMigrationModal,
    setShowAnonDataMigrationModal,
  } = useApp();

  const navigate = useNavigate();
  const handleEditTaskCancel = () => {
    setTaskForEdit(undefined);
    setTaskIdForEdit(undefined);
  };

  const handleEditRepetitiveTaskTemplateCancel = () => {
    setRepetitiveTaskTemplateForEdit(undefined);
    setRepetitiveTaskTemplateIdForEdit(undefined);
  };

  const handleOpenRepetitiveTaskTemplate = (
    repetitiveTaskTemplateId: string,
  ) => {
    handleEditTaskCancel();
    setRepetitiveTaskTemplateIdForEdit(repetitiveTaskTemplateId);
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSpacesExpand = async () => {
    await handleLoadingSpaces();
    setIsExpanded(!isExpanded);
  };

  const handleAddTaskWidgetClose = () => {
    setShowAddTask(false);
    setAddTaskToday(false);
  };

  const handleSignOut = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_SIGN_OUT,
      );
      if (result.success) {
        setUser(null);
        setNotifier('You have been signed out.', 'success');
        await handleLoadingSpaces();
        handlePageRefresh();
        navigate(ROUTE_ROOT);
      } else {
        setNotifier(result.error, 'error');
      }
    } catch (err: any) {
      setNotifier(formatErrorMessage(err.message), 'error');
    }
  };

  const handleDismissMigration = () => {
    setShowAnonDataMigrationModal(false);
  };

  const handleConfirmMigration = async () => {
    try {
      await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_ASSIGN_ANONYMOUS_DATA,
      );
      setNotifier('Data imported successfully!', 'success');
      setShowAnonDataMigrationModal(false);
      handlePageRefresh();
    } catch (err: any) {
      setNotifier(formatErrorMessage(err.message), 'error');
      setShowAnonDataMigrationModal(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box>
        <Box ml={2}>
          <Logo />
        </Box>
        <List dense>
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
            to={ROUTE_ROOT}
            selected={location.pathname === ROUTE_ROOT}
          >
            <ListItemIcon>
              <CalendarToday date={new Date().getDate()} />
            </ListItemIcon>
            <ListItemText primary="Today" />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to={ROUTE_ACTIVE}
            selected={location.pathname === ROUTE_ACTIVE}
          >
            <ListItemIcon>
              <DirectionsRunIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Active" />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to={ROUTE_TRACKER}
            selected={location.pathname === ROUTE_TRACKER}
          >
            <ListItemIcon>
              <TrackerIcon />
            </ListItemIcon>
            <ListItemText primary="Tracker" />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to={ROUTE_OVERDUE}
            selected={location.pathname === ROUTE_OVERDUE}
          >
            <ListItemIcon>
              <HistoryIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Overdue" />
          </ListItemButton>
          <ListItemButton sx={{ mt: 2 }} onClick={handleSpacesExpand}>
            <ListItemIcon>
              {isExpanded ? <ArrowDown /> : <ArrowRight />}
            </ListItemIcon>
            <ListItemText
              primary="Spaces"
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List dense component="div" disablePadding>
              {allSpaces.map((space) => (
                <ListItemButton
                  key={`${space.name}-${space.id}`}
                  sx={{ py: 0.5, pl: 4 }}
                  component={Link}
                  to={`/space/${space.id}/${space.name}`}
                  selected={
                    location.pathname === `/space/${space.id}/${space.name}`
                  }
                >
                  <ListItemIcon sx={{ minWidth: theme.spacing(5) }}>
                    {/* <LocalOfferOutlinedIcon fontSize="small" /> */}
                    <Grid3x3Icon color="secondary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={space.name}
                    primaryTypographyProps={{
                      fontSize: theme.typography.body2.fontSize,
                    }}
                  />
                </ListItemButton>
              ))}
              <ListItemButton
                key="task-without-a-space-default-space"
                sx={{ py: 0.5, pl: 4 }}
                component={Link}
                to={ROUTE_TASKS_WITHOUT_A_SPACE}
                selected={location.pathname === ROUTE_TASKS_WITHOUT_A_SPACE}
              >
                <ListItemIcon sx={{ minWidth: theme.spacing(5) }}>
                  {/* <LocalOfferOutlinedIcon fontSize="small" /> */}
                  <Grid3x3Icon color="secondary" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Tasks without a space"
                  primaryTypographyProps={{
                    fontSize: theme.typography.body2.fontSize,
                  }}
                />
              </ListItemButton>
            </List>
          </Collapse>
        </List>
      </Box>
      <Box sx={{ marginTop: 'auto' }}>
        <List dense>
          <ListItemButton
            component={Link}
            to={ROUTE_SETTINGS}
            selected={location.pathname === ROUTE_SETTINGS}
          >
            <ListItemIcon sx={{ minWidth: theme.spacing(4) }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </List>
        {user ? (
          <List dense>
            <ListItem sx={{ pl: 2, pt: 0, pb: 0 }}>
              <ListItemText
                primary={user.email}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.secondary',
                  noWrap: true,
                  title: user.email,
                  fontSize: '0.8rem',
                }}
              />
            </ListItem>
            {user.isPremium && (
              <ListItem sx={{ pl: 2, pt: 0, pb: 0 }}>
                <ListItemIcon sx={{ minWidth: theme.spacing(4) }}>
                  <Crown
                    fontSize="small"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Premium Active"
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'primary',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                />
              </ListItem>
            )}
            <ListItemButton onClick={handleSignOut}>
              <ListItemIcon sx={{ minWidth: theme.spacing(4) }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </ListItemButton>
          </List>
        ) : (
          <List dense>
            <ListItemButton
              component={Link}
              to={ROUTE_AUTH}
              selected={location.pathname === ROUTE_AUTH}
            >
              <ListItemIcon sx={{ minWidth: theme.spacing(4) }}>
                <LoginIcon />
              </ListItemIcon>
              <ListItemText primary="Sign in" />
            </ListItemButton>
          </List>
        )}
      </Box>
      <Dialog open={showAddTask}>
        <AddTask
          isToday={addTaskToday}
          widgetCloseFunc={handleAddTaskWidgetClose}
        />
      </Dialog>
      <Dialog open={Boolean(taskForEdit)}>
        {taskForEdit && (
          <EditTask
            task={taskForEdit}
            openRepetitiveTaskTemplate={handleOpenRepetitiveTaskTemplate}
            widgetCloseFunc={handleEditTaskCancel}
          />
        )}
      </Dialog>
      <Dialog open={Boolean(repetitiveTaskTemplateForEdit)}>
        {repetitiveTaskTemplateForEdit && (
          <EditTask
            task={repetitiveTaskTemplateForEdit}
            widgetCloseFunc={handleEditRepetitiveTaskTemplateCancel}
          />
        )}
      </Dialog>
      <Dialog
        open={showAnonDataMigrationModal}
        onClose={handleDismissMigration}
      >
        <DialogTitle>Import Local Data</DialogTitle>
        <DialogContent>
          <DialogContentText>
            We found some data (tasks, spaces, or templates) created while you
            were signed out. Would you like to import them to your account now?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDismissMigration}>No, thanks</Button>
          <Button onClick={handleConfirmMigration} autoFocus>
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
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

  const { showSnackbar, notification, clearNotifier, isSyncing } = useApp();

  const [drawerWidth, setDrawerWidth] = useState(240);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const isResizing = useRef(false);
  const startX = useRef(0);

  const handleMouseDown = (event: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = event.clientX;
    event.stopPropagation();
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = event.clientX;

      if (newWidth < 100) {
        setOpenDrawer(false);
      }

      if (newWidth >= 150 && newWidth <= 340) {
        setDrawerWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drawerWidth]);

  const [resizerHovered, setResizerHovered] = useState(false);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <CustomThemeProvider>
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
              ref={drawerRef}
            >
              <DrawerHeader>
                <IconButton onClick={handleDrawerClose}>
                  <ArrowLeft />
                </IconButton>
              </DrawerHeader>
              <Navigation />
            </Drawer>
            {/* resizing handle  */}
            {openDrawer && (
              <Box
                sx={{
                  backgroundColor: (theme) =>
                    resizerHovered ? theme.palette.primary.main : 'transparent',
                  transition: 'background-color 0.2s ease-in-out',
                  cursor: 'col-resize',
                  width: 4,
                  zIndex: 100,
                  position: 'absolute',
                  top: 0,
                  left: drawerWidth,
                  height: '100%',
                }}
                onMouseDown={handleMouseDown}
                onMouseEnter={() => setResizerHovered(true)}
                onMouseLeave={() => setResizerHovered(false)}
              />
            )}
            <Main open={openDrawer} drawerWidth={drawerWidth}>
              <PageWrapper
                onRightArrowClick={handleDrawerOpen}
                isDrawerOpen={!openDrawer}
              >
                <Routes>
                  <Route path={ROUTE_ROOT} element={<Today />} />
                  <Route path={ROUTE_ACTIVE} element={<Active />} />
                  <Route path={ROUTE_TRACKER} element={<Tracker />} />
                  <Route
                    path="/space/:spaceId/:spaceName"
                    element={<Space />}
                  />
                  <Route
                    path={ROUTE_TASKS_WITHOUT_A_SPACE}
                    element={<Space />}
                  />
                  <Route path={ROUTE_AUTH} element={<Auth />} />
                  <Route path={ROUTE_OVERDUE} element={<Overdue />} />
                  <Route path={ROUTE_SETTINGS} element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </PageWrapper>
              {isSyncing && <SyncIndicator />}
            </Main>

            <Snackbar
              open={showSnackbar}
              autoHideDuration={6000}
              onClose={clearNotifier}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert severity={notification?.type} onClose={clearNotifier}>
                {notification?.type === 'error'
                  ? formatErrorMessage(notification?.message)
                  : notification?.message}
              </Alert>
            </Snackbar>
          </Box>
        </Router>
      </CustomThemeProvider>
    </LocalizationProvider>
  );
}

export default App;
