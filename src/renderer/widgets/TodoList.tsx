import React, { useState, useEffect } from 'react';
import {
  List,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { ITask, TaskScheduleTypeEnum } from '../types';
import { TodoListItem, TaskScoring } from '../components';

function TodoList() {
  const [tasksToday, setTasksToday] = useState<ITask[]>([]);
  const [tasksOverdue, setTasksOverdue] = useState<ITask[]>([]);
  const [taskForScoring, setTaskIndexForScoring] = useState<ITask>();
  const [score, setScore] = useState<number | null>(null);

  const handleTaskRefresh = () => {
    window.electron.ipcRenderer.sendMessage('request-tasks-today');
    window.electron.ipcRenderer.sendMessage('request-tasks-overdue');
  };

  useEffect(() => {
    // todo channel names should be enum
    handleTaskRefresh();

    window.electron.ipcRenderer.on('response-tasks-today', (response) => {
      // todo need error handling
      setTasksToday(response as ITask[]);
    });
    window.electron.ipcRenderer.on('response-tasks-overdue', (response) => {
      // todo need error handling
      setTasksOverdue(response as ITask[]);
    });
  }, []);

  const onTaskCompletionChange = (
    id: number,
    checked: boolean,
    taskScore?: number | null,
  ) => {
    window.electron.ipcRenderer.sendMessage(
      'request-toggle-task-completion-status',
      {
        id,
        checked,
        score: taskScore,
      },
    );
    handleTaskRefresh();
  };

  const handleTaskToggle = (
    e: React.ChangeEvent<HTMLInputElement>,
    task: ITask,
    // index: number,
  ) => {
    if (task.shouldBeScored && e.target.checked) setTaskIndexForScoring(task);
    else
      onTaskCompletionChange(
        task.id,
        e.target.checked,
        task.shouldBeScored ? null : undefined,
      );
  };

  const handleScoreDialogClose = () => {
    setTaskIndexForScoring(undefined);
    setScore(null);
  };

  const handleTaskFailure = (taskId: number) => {
    window.electron.ipcRenderer.sendMessage('request-task-failure', {
      id: taskId,
    });
    handleTaskRefresh();
  };

  return (
    <>
      <Typography variant="h6" mt={2}>
        Overdue
      </Typography>
      <List>
        {tasksOverdue.map((task, index) => (
          <React.Fragment key={task.id}>
            <TodoListItem
              isCompleted={task.completionStatus === 'COMPLETE'}
              onChange={(e) => handleTaskToggle(e, task)}
              taskTitle={task.title}
              showClock={task.schedule !== TaskScheduleTypeEnum.Daily}
              onFail={() => handleTaskFailure(task.id)}
            />
            {index !== tasksToday.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
      <Typography variant="h6" mt={2}>
        Today
      </Typography>
      <List>
        {tasksToday.map((task, index) => (
          <React.Fragment key={task.id}>
            <TodoListItem
              isCompleted={task.completionStatus === 'COMPLETE'}
              onChange={(e) => handleTaskToggle(e, task)}
              taskTitle={task.title}
              showClock={task.schedule !== TaskScheduleTypeEnum.Daily}
              onFail={() => handleTaskFailure(task.id)}
            />
            {index !== tasksToday.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
      <Dialog
        open={Boolean(taskForScoring)}
        onClose={handleScoreDialogClose}
        title="Score dialog"
        sx={{ padding: 2 }}
      >
        <DialogTitle fontSize="16px">Score your task</DialogTitle>
        {taskForScoring && (
          <DialogContent>
            <Typography variant="body1">{taskForScoring.title}</Typography>
          </DialogContent>
        )}
        <Box px={3} minWidth={450}>
          <Typography variant="h6">Score:</Typography>
          <TaskScoring selected={score} onScoreSelection={setScore} />
        </Box>
        <DialogActions>
          <Button
            variant="text"
            disabled={score === null}
            onClick={() => {
              if (score === null || !taskForScoring) return;
              onTaskCompletionChange(taskForScoring.id, true, score);
              handleScoreDialogClose();
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default TodoList;
