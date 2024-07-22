import { useState } from 'react';
import { Button } from '@mui/material';
import Plus from '../icons/Plus';
import { AddTask, TodoList } from '../widgets';
import { PageHeader } from '../components';
import { handleTaskRefresh } from '../utils';

function Today() {
  const [showAddTask, setShowAddTask] = useState(false);

  return (
    <>
      <PageHeader>Today</PageHeader>
      <TodoList refreshTasks={handleTaskRefresh} />
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
