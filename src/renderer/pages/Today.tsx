import { useState, useRef, useEffect } from 'react';
import { Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { AddTask, TodoList } from '../widgets';
import { PageHeader } from '../components';
import { refreshTodayPageTasks, isPreviousDay } from '../utils';
import { useApp } from '../context/AppProvider';

function Today() {
  const { setShouldRefresh } = useApp();
  const [showAddTask, setShowAddTask] = useState(false);
  const addTaskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshTodayPageTasks();
  }, []);

  const handleFocusAddTask = () => {
    if (addTaskRef.current)
      addTaskRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (showAddTask) handleFocusAddTask();
  }, [showAddTask]);

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
      {showAddTask && (
        <AddTask ref={addTaskRef} isToday widgetCloseFunc={setShowAddTask} />
      )}
      {!showAddTask && (
        <Fab
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
          color="secondary"
          size="small"
          aria-label="add"
        >
          <AddIcon
            sx={{ color: 'white' }}
            onClick={() => setShowAddTask(true)}
          />
        </Fab>
      )}
    </>
  );
}

export default Today;
