import { useState, useRef, useEffect } from 'react';
import { Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AddTask, TodoList } from '../widgets';
import { PageHeader } from '../components';
import { refreshTodayPageTasks } from '../utils';

function Today() {
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

  return (
    <>
      <PageHeader>Today</PageHeader>
      <TodoList />
      {showAddTask && (
        <AddTask ref={addTaskRef} isToday widgetCloseFunc={setShowAddTask} />
      )}
      {!showAddTask && (
        <Fab
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
          color="primary"
          size="small"
          aria-label="add"
        >
          <AddIcon onClick={() => setShowAddTask(true)} />
        </Fab>
      )}
    </>
  );
}

export default Today;
