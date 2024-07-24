import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import Plus from '../icons/Plus';
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
      {showAddTask && <AddTask widgetCloseFunc={setShowAddTask} />}
      {!showAddTask && (
        <Button
          startIcon={<Plus />}
          variant="text"
          onClick={() => setShowAddTask(true)}
        >
          Add Task
        </Button>
      )}
    </>
  );
}

export default Today;
