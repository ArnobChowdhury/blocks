import { useState } from 'react';
import { Button } from '@mui/material';
import Plus from '../icons/Plus';
import { AddTask, TodoList } from '../widgets';
import { PageHeader } from '../components';

// const { ipcRenderer } = require('electron'); // Import ipcRenderer

function Today() {
  const [showAddTask, setShowAddTask] = useState(false);

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
