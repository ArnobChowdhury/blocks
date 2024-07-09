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
import dayjs, { Dayjs } from 'dayjs';

import {
  ITask,
  TaskScheduleTypeEnum,
  ChannelsEnum,
  IEventResponse,
  IPCEventsResponseEnum,
} from '../types';
import { TodoListItem, TaskScoring } from '../components';

interface ITodoListProps {
  refreshTasks: () => void;
}

function TodoList({ refreshTasks }: ITodoListProps) {
  const [tasksToday, setTasksToday] = useState<ITask[]>([]);
  const [tasksOverdue, setTasksOverdue] = useState<ITask[]>([]);
  const [taskForScoring, setTaskIndexForScoring] = useState<ITask>();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    // todo channel names should be enum
    refreshTasks();

    const unsubscribeTasksToday = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_TODAY,
      (response) => {
        // todo need error handling
        setTasksToday(response as ITask[]);
      },
    );
    const unsubscribeTasksOverdue = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_OVERDUE,
      (response) => {
        // todo need error handling
        setTasksOverdue(response as ITask[]);
      },
    );

    return () => {
      unsubscribeTasksToday();
      unsubscribeTasksOverdue();
    };
  }, [refreshTasks]);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASK_FAILURE,
      (response) => {
        if (
          (response as IEventResponse).message ===
          IPCEventsResponseEnum.SUCCESSFUL
        ) {
          refreshTasks();
        }
      },
    );

    return unsubscribe;
  }, [refreshTasks]);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASK_RESCHEDULE,
      (response) => {
        if (
          (response as IEventResponse).message ===
          IPCEventsResponseEnum.SUCCESSFUL
        ) {
          refreshTasks();
        }
      },
    );

    return unsubscribe;
  }, [refreshTasks]);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TOGGLE_TASK_COMPLETION_STATUS,
      (response) => {
        if (
          (response as IEventResponse).message ===
          IPCEventsResponseEnum.SUCCESSFUL
        ) {
          refreshTasks();
        }
      },
    );

    return unsubscribe;
  }, [refreshTasks]);

  const onTaskCompletionChange = (
    id: number,
    checked: boolean,
    taskScore?: number | null,
  ) => {
    window.electron.ipcRenderer.sendMessage(
      ChannelsEnum.REQUEST_TOGGLE_TASK_COMPLETION_STATUS,
      {
        id,
        checked,
        score: taskScore,
      },
    );
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
    window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASK_FAILURE, {
      id: taskId,
    });
  };

  const handleTaskReSchedule = (taskId: number, rescheduledTime: Dayjs) => {
    const dueDate = rescheduledTime.toISOString();

    window.electron.ipcRenderer.sendMessage(
      ChannelsEnum.REQUEST_TASK_RESCHEDULE,
      {
        id: taskId,
        dueDate,
      },
    );
  };

  const todayFormatted = dayjs().format('dddd, MMMM D, YYYY');

  return (
    <>
      {tasksOverdue.length > 0 && (
        <>
          <Typography variant="h6" mt={2}>
            Overdue
          </Typography>
          <List>
            {tasksOverdue.map((task) => (
              <React.Fragment key={task.id}>
                <TodoListItem
                  isCompleted={task.completionStatus === 'COMPLETE'}
                  onChange={(e) => handleTaskToggle(e, task)}
                  taskTitle={task.title}
                  showClock={task.schedule !== TaskScheduleTypeEnum.Daily}
                  onFail={() => handleTaskFailure(task.id)}
                  onReschedule={(rescheduledTime) =>
                    handleTaskReSchedule(task.id, rescheduledTime)
                  }
                  dueDateLabel={task.dueDate}
                />
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </>
      )}
      <Typography variant="h6" mt={2}>
        {todayFormatted}
      </Typography>
      <List>
        {tasksToday.map((task) => (
          <React.Fragment key={task.id}>
            <TodoListItem
              isCompleted={task.completionStatus === 'COMPLETE'}
              onChange={(e) => handleTaskToggle(e, task)}
              taskTitle={task.title}
              showClock={task.schedule !== TaskScheduleTypeEnum.Daily}
              onFail={() => handleTaskFailure(task.id)}
              onReschedule={(rescheduledTime) =>
                handleTaskReSchedule(task.id, rescheduledTime)
              }
            />
            <Divider />
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
