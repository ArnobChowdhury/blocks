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
  Collapse,
} from '@mui/material';
import { styled } from '@mui/system';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { PageWrapper } from './layouts';
import { Today, Inbox, Tracker, TaggedTodos } from './pages';
import ArrowLeft from './icons/ArrowLeft';
import ArrowRight from './icons/ArrowRight';
import ArrowDown from './icons/ArrowDown';
import CalendarToday from './icons/CalendarToday';
import InboxIcon from './icons/Inbox';
import TrackerIcon from './icons/Tracker';
import Plus from './icons/Plus';
import { AddTask, EditTask } from './widgets';
import { useApp } from './context/AppProvider';
import { formatErrorMessage } from './utils';
import { useTags } from './hooks';

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
  const {
    showAddTask,
    setShowAddTask,
    taskForEdit,
    setTaskIdForEdit,
    setTaskForEdit,
    repetitiveTaskTemplateForEdit,
    setRepetitiveTaskTemplateIdForEdit,
    setRepetitiveTaskTemplateForEdit,
  } = useApp();

  const handleEditTaskCancel = () => {
    setTaskForEdit(undefined);
    setTaskIdForEdit(undefined);
  };

  const handleEditRepetitiveTaskTemplateCancel = () => {
    setRepetitiveTaskTemplateForEdit(undefined);
    setRepetitiveTaskTemplateIdForEdit(undefined);
  };

  const { allTags, handleLoadingTags } = useTags();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTagsExpand = async () => {
    await handleLoadingTags();
    setIsExpanded(!isExpanded);
  };

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
        <ListItemButton sx={{ mt: 2 }} onClick={handleTagsExpand}>
          <ListItemIcon>
            {isExpanded ? <ArrowDown /> : <ArrowRight />}
          </ListItemIcon>
          <ListItemText
            primary="Tags"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItemButton>
        {/* tags */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {allTags.map((tag) => (
              <ListItemButton
                key={`${tag.name}-${tag.id}`}
                sx={{ py: 0.5, pl: 4 }}
                component={Link}
                to={`/tagged-todos/${tag.id}/${tag.name}`}
                selected={
                  location.pathname === `/tagged-todos/${tag.id}/${tag.name}`
                }
              >
                <ListItemIcon>
                  <LocalOfferOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={tag.name}
                  primaryTypographyProps={{
                    fontSize: theme.typography.body2.fontSize,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </List>
      <Dialog open={showAddTask}>
        <AddTask widgetCloseFunc={setShowAddTask} />
      </Dialog>
      <Dialog open={Boolean(taskForEdit)}>
        {taskForEdit && (
          <EditTask task={taskForEdit} widgetCloseFunc={handleEditTaskCancel} />
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

  const { showSnackbar, notification, clearNotifier } = useApp();

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
                <Route
                  path="/tagged-todos/:tagId/:tagName"
                  element={<TaggedTodos />}
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </PageWrapper>
          </Main>

          <Snackbar
            open={showSnackbar}
            autoHideDuration={6000}
            onClose={clearNotifier}
          >
            <Alert severity={notification?.type} onClose={clearNotifier}>
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
