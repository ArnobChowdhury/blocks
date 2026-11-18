import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Task, ChannelsEnum } from '../types';
import HabitHeatmap from '../widgets/HabitHeatmap';

const centeredStyles = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
  p: 3,
  minHeight: '300px',
};

const SHOW_TASKS_FOR_DAYS = 91;

function Tracker() {
  const { habitId, habitName } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [errorLoadingTasks, setErrorLoadingTasks] = useState<string | null>(
    null,
  );

  const fetchTaskOfHabit = useCallback(
    async (repetitiveTaskTemplateId: string) => {
      setErrorLoadingTasks(null);

      try {
        const fetchedTasks: Task[] = await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_ACTIVE_TASKS_BY_TEMPLATE_ID,
          repetitiveTaskTemplateId,
          SHOW_TASKS_FOR_DAYS,
        );

        setTasks(fetchedTasks);
      } catch (error: any) {
        setErrorLoadingTasks(
          error.message || 'An unknown error occurred while fetching tasks.',
        );
        setTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [],
  );

  const [habit, setHabit] = useState();

  const fetchHabit = useCallback(async () => {
    try {
      const repetitiveTaskTemplate = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_REPETITIVE_TASK_DETAILS,
        habitId,
      );

      setHabit(repetitiveTaskTemplate);
    } catch (error: any) {
      console.error(`[Tracker-${habitId}] Error fetching habit:`, error);
    }
  }, [habitId]);

  const [screenRequestError, setScreenRequestError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    if (habitId) {
      fetchHabit();
    }
  }, [habitId, fetchHabit]);

  useEffect(() => {
    if (habitId) {
      fetchTaskOfHabit(habitId);
    }
  }, [fetchTaskOfHabit, habitId]);

  const handleSnackbarDismiss = () => {
    setShowSnackbar(false);
    setTimeout(() => {
      setScreenRequestError('');
    }, 1000);
  };

  const renderContent = () => {
    if (isLoadingTasks) {
      return (
        <Box sx={centeredStyles}>
          <CircularProgress size={48} />
          <Typography sx={{ mt: 2, fontSize: 16 }}>Loading Tasks...</Typography>
        </Box>
      );
    }

    if (errorLoadingTasks) {
      return (
        <Box sx={centeredStyles}>
          <Typography
            sx={{
              color: 'error.main',
              textAlign: 'center',
              mb: 1,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            Failed to Load Tasks
          </Typography>
          <Typography
            sx={{
              color: 'error.main',
              textAlign: 'center',
              mb: 2,
              fontSize: 14,
            }}
          >
            {errorLoadingTasks}
          </Typography>
          <IconButton
            color="primary"
            onClick={() => {
              if (habitId) fetchTaskOfHabit(habitId);
            }}
            sx={{ width: 48, height: 48 }}
          >
            <RefreshIcon fontSize="large" />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box sx={{ py: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}
        >
          Activity Heatmap
        </Typography>
        <HabitHeatmap
          repetitiveTaskTemplate={habit}
          tasks={tasks}
          numDays={SHOW_TASKS_FOR_DAYS}
        />
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      <Box position="relative">
        <IconButton
          color="primary"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          sx={{ zIndex: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            {habitName}
          </Typography>
        </Box>
      </Box>
      {renderContent()}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleSnackbarDismiss}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ErrorOutlineIcon sx={{ color: 'error.main', mr: 1 }} />
            <Typography variant="body2" sx={{ color: 'common.white' }}>
              {screenRequestError}
            </Typography>
          </Box>
        }
      />
    </Box>
  );
}

Tracker.defaultProps = {
  onBack: undefined,
};

export default Tracker;
