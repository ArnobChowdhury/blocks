import { useState, useEffect } from 'react';
import { Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AddTask, TodoList } from '../widgets';
import { PageHeader } from '../components';
import { refreshTodayPageTasks } from '../utils';

function Today() {
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    refreshTodayPageTasks();
  }, []);

  return (
    <>
      <PageHeader>Today</PageHeader>
      <TodoList />
      {showAddTask && <AddTask isToday widgetCloseFunc={setShowAddTask} />}
      {!showAddTask && (
        <Fab
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
          color="primary"
          size="small"
          aria-label="add"
        >
          <AddIcon
            onClick={() => setShowAddTask(true)}
            sx={{ color: 'white' }}
          />
        </Fab>
      )}
    </>
  );
}

export default Today;
