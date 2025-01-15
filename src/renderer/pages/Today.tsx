import { useState, useEffect } from 'react';
import { Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { TodoList } from '../widgets';
import { PageHeader } from '../components';
import { refreshTodayPageTasks, isPreviousDay } from '../utils';
import { useApp } from '../context/AppProvider';

function Today() {
  const { setShouldRefresh, setAddTaskToday, showAddTask, setShowAddTask } =
    useApp();

  useEffect(() => {
    refreshTodayPageTasks();
  }, []);

  const handleAddTaskToday = () => {
    setAddTaskToday(true);
    setShowAddTask(true);
  };

  const [dateToday, setDateToday] = useState(dayjs());

  useEffect(() => {
    const checkIfDayHasPassed = () => {
      if (isPreviousDay(dateToday)) {
        setShouldRefresh(true);
      }
    };

    const interval = setInterval(checkIfDayHasPassed, 60 * 1000);

    return () => clearInterval(interval);
  }, [dateToday, setShouldRefresh]);

  return (
    <>
      <PageHeader>Today</PageHeader>
      <TodoList dateToday={dateToday} setDateToday={setDateToday} />
      {!showAddTask && (
        <Fab
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
          color="secondary"
          size="small"
          aria-label="add"
        >
          <AddIcon sx={{ color: 'white' }} onClick={handleAddTaskToday} />
        </Fab>
      )}
    </>
  );
}

export default Today;
