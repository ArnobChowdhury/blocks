import { useEffect, useState } from 'react';
import { Fab, Alert, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import dayjs from 'dayjs';
import { TodoList } from '../widgets';
import { PageHeader } from '../components';
import { refreshTodayPageTasksForDate } from '../utils';
import { useApp } from '../context/AppProvider';
import { useTheme as useAppTheme } from '../context/ThemeProvider';

function Today() {
  const { themeMode } = useAppTheme();
  const isDarkMode = themeMode === 'dark';

  const {
    setAddTaskToday,
    showAddTask,
    setShowAddTask,
    todayPageDisplayDate,
    setTodayPageDisplayDate,
  } = useApp();

  const [newDayBannerVisible, setNewDayBannerVisible] = useState(false);

  useEffect(() => {
    refreshTodayPageTasksForDate(todayPageDisplayDate.toDate());
  }, [todayPageDisplayDate]);

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

  return (
    <>
      <PageHeader>Today</PageHeader>
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
      <TodoList />
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
