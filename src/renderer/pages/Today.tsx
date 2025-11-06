import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fab, Alert, Button, Box, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import dayjs from 'dayjs';
import { TodoList } from '../widgets';
import { PageHeader, SectionHeader } from '../components';
import { refreshTodayPageForDate, formatDate } from '../utils';
import { useApp } from '../context/AppProvider';
import { useTheme as useAppTheme } from '../context/ThemeProvider';
import {
  ChannelsEnum,
  TaskWithTags,
  TaskCompletionStatusEnum,
  TimeOfDay,
} from '../types';
import { ROUTE_OVERDUE, SectionColors } from '../constants';
import NoTaskToday from '../images/NoTaskToday';

function Today() {
  const { themeMode } = useAppTheme();
  const isDarkMode = themeMode === 'dark';
  const navigate = useNavigate();

  const {
    setAddTaskToday,
    showAddTask,
    setShowAddTask,
    todayPageDisplayDate,
    setTodayPageDisplayDate,
  } = useApp();

  const [newDayBannerVisible, setNewDayBannerVisible] = useState(false);

  useEffect(() => {
    refreshTodayPageForDate(todayPageDisplayDate.toDate());
  }, [todayPageDisplayDate]);

  const [countOfTaskOverdue, setCountOfTaskOverdue] = useState(0);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_COUNT_OF_TASKS_OVERDUE,
      (response) => setCountOfTaskOverdue(response as number),
    );
    return unsubscribe;
  }, []);

  const handleAddTaskToday = () => {
    setAddTaskToday(true);
    setShowAddTask(true);
  };

  useEffect(() => {
    if (newDayBannerVisible) {
      return () => {};
    }

    const intervalId = setInterval(() => {
      const now = dayjs().startOf('day');

      if (now.isAfter(todayPageDisplayDate)) {
        setNewDayBannerVisible(true);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [newDayBannerVisible, todayPageDisplayDate]);

  const handleNewDayPageRefresh = () => {
    setTodayPageDisplayDate(dayjs().startOf('day'));
    setNewDayBannerVisible(false);
  };

  const [tasksMorning, setTasksMorning] = useState<TaskWithTags[]>([]);
  const [tasksAfternoon, setTasksAfternoon] = useState<TaskWithTags[]>([]);
  const [tasksEvening, setTasksEvening] = useState<TaskWithTags[]>([]);
  const [tasksNight, setTasksNight] = useState<TaskWithTags[]>([]);
  const [tasksWithoutTimeOfDay, setTasksWithoutTimeOfDay] = useState<
    TaskWithTags[]
  >([]);
  const [tasksFailed, setTasksFailed] = useState<TaskWithTags[]>([]);
  const [noTasksForToday, setNoTasksForToday] = useState(false);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_FOR_DATE,
      (response) => {
        const tasks = response as TaskWithTags[];
        const morningTasks: TaskWithTags[] = [];
        const afternoonTasks: TaskWithTags[] = [];
        const eveningTasks: TaskWithTags[] = [];
        const nightTasks: TaskWithTags[] = [];
        const tasksWithoutTime: TaskWithTags[] = [];
        const failedTasks: TaskWithTags[] = [];

        if (tasks.length === 0) {
          setNoTasksForToday(true);
        } else {
          setNoTasksForToday(false);
        }

        tasks.forEach((task) => {
          if (task.completionStatus === TaskCompletionStatusEnum.FAILED) {
            failedTasks.push(task);
          } else if (task.timeOfDay === TimeOfDay.Morning) {
            morningTasks.push(task);
          } else if (task.timeOfDay === TimeOfDay.Afternoon) {
            afternoonTasks.push(task);
          } else if (task.timeOfDay === TimeOfDay.Evening) {
            eveningTasks.push(task);
          } else if (task.timeOfDay === TimeOfDay.Night) {
            nightTasks.push(task);
          } else {
            tasksWithoutTime.push(task);
          }
        });
        setTasksMorning(morningTasks);
        setTasksAfternoon(afternoonTasks);
        setTasksEvening(eveningTasks);
        setTasksNight(nightTasks);
        setTasksWithoutTimeOfDay(tasksWithoutTime);
        setTasksFailed(failedTasks);
      },
    );

    return unsubscribe;
  }, []);

  const todayFormatted = formatDate(todayPageDisplayDate);

  return (
    <>
      <PageHeader>Today</PageHeader>
      {countOfTaskOverdue > 0 && (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate(ROUTE_OVERDUE)}
            >
              Review now
            </Button>
          }
          sx={{
            mb: 2,
            bgcolor: isDarkMode ? 'background.paper' : undefined,
          }}
        >
          You have {countOfTaskOverdue} overdue task
          {countOfTaskOverdue > 1 ? 's' : ''}.
        </Alert>
      )}
      {newDayBannerVisible && (
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              variant="text"
              onClick={handleNewDayPageRefresh}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          }
          sx={{
            mb: 2,
            bgcolor: isDarkMode ? 'background.paper' : undefined,
          }}
        >
          A new day has begun! You can continue with yesterday&apos;s tasks or
          refresh to see what&apos;s new for today.
        </Alert>
      )}
      <>
        <Typography variant="h6" mt={2}>
          {todayFormatted}
        </Typography>
        {[
          tasksMorning,
          tasksAfternoon,
          tasksEvening,
          tasksNight,
          tasksWithoutTimeOfDay,
          tasksFailed,
        ].map((tasks) => {
          if (tasks.length === 0) return null;

          const { timeOfDay, completionStatus } = tasks[0];
          let bg: string;
          let header: string;
          if (completionStatus === TaskCompletionStatusEnum.FAILED) {
            bg = SectionColors.failed;
            header = 'Failed';
          } else if (timeOfDay) {
            bg = SectionColors[timeOfDay];
            header = timeOfDay;
          } else {
            bg = SectionColors.anytime;
            header = 'Any Time';
          }

          return (
            <Box
              sx={{
                background: bg,
                borderRadius: '4px',
                px: 2,
                pt: 2,
                mt: 2,
                color: 'text.onLightBackground',
              }}
              key={bg}
            >
              <SectionHeader sx={{ textTransform: 'capitalize' }}>
                {header}
              </SectionHeader>
              <TodoList
                tasks={tasks}
                refreshCallback={refreshTodayPageForDate}
                isLightBG
              />
            </Box>
          );
        })}
      </>

      {noTasksForToday && (
        <Box
          width="100%"
          height="600px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mt={2}
        >
          <Box>
            <Typography sx={{ mb: 3 }} variant="body1" align="center">
              Empty for now. Ready to be filled with something great!
            </Typography>
            <NoTaskToday />
          </Box>
        </Box>
      )}
      {!showAddTask && (
        <Fab
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
          color="secondary"
          size="small"
          aria-label="add"
          onClick={handleAddTaskToday}
        >
          <AddIcon sx={{ color: 'white' }} />
        </Fab>
      )}
    </>
  );
}

export default Today;
