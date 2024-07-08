import { useState } from 'react';
import { Button } from '@mui/material';
import Plus from '../icons/Plus';
import { AddTask, TodoList } from '../widgets';
import { PageHeader } from '../components';
import { ChannelsEnum } from '../types';

// const { ipcRenderer } = require('electron'); // Import ipcRenderer

function Today() {
  const [showAddTask, setShowAddTask] = useState(false);

  const handleTaskRefresh = () => {
    window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASKS_TODAY);
    window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASKS_OVERDUE);
  };

  return (
    <>
      <PageHeader>Today</PageHeader>
      <TodoList refreshTasks={handleTaskRefresh} />
      {showAddTask && (
        <AddTask
          refreshTasks={handleTaskRefresh}
          widgetCloseFunc={setShowAddTask}
        />
      )}
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
