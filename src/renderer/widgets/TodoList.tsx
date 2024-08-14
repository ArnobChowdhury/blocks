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
import ThumbDownIcon from '@mui/icons-material/ThumbDownOutlined';
import dayjs from 'dayjs';

// eslint-disable-next-line import/no-relative-packages
import { Task } from '../../generated/client';
import { TaskScheduleTypeEnum, ChannelsEnum, TimeOfDay } from '../types';
import { TodoListItem, TaskScoring, SectionHeader } from '../components';
import { formatDate, refreshTodayPageTasks } from '../utils';
import {
  useBulkFailure,
  useToggleTaskCompletionStatus,
  useTaskFailure,
  useTaskReschedule,
} from '../hooks';
import { TimeColors } from '../constants';
import { useApp } from '../context/AppProvider';

function TodoList() {
  const [tasksMorning, setTasksMorning] = useState<Task[]>([]);
  const [tasksAfternoon, setTasksAfternoon] = useState<Task[]>([]);
  const [tasksEvening, setTasksEvening] = useState<Task[]>([]);
  const [tasksNight, setTasksNight] = useState<Task[]>([]);
  const [tasksWithoutTimeOfDay, setTasksWithoutTimeOfDay] = useState<Task[]>(
    [],
  );

  const [tasksOverdue, setTasksOverdue] = useState<Task[]>([]);
  const [sortedTasksOverdue, setSortedTasksOverdue] = useState<{
    [key: string]: Task[];
  }>({});
  const [taskForScoring, setTaskIndexForScoring] = useState<Task>();
  const [score, setScore] = useState<number | null>(null);
  const { setNotifier, setTaskIdForEdit } = useApp();

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_TODAY,
      (response) => {
        const tasks = response as Task[];
        const morningTasks: Task[] = [];
        const afternoonTasks: Task[] = [];
        const eveningTasks: Task[] = [];
        const nightTasks: Task[] = [];
        const tasksWithoutTime: Task[] = [];

        tasks.forEach((task) => {
          if (task.timeOfDay === TimeOfDay.Morning) {
            morningTasks.push(task);
          } else if (task.timeOfDay === TimeOfDay.Afternoon) {
            afternoonTasks.push(task);
          } else if (task.timeOfDay === TimeOfDay.Evening) {
            eveningTasks.push(task);
          } else if (task.timeOfDay === TimeOfDay.Night) {
            nightTasks.push(task);
          } else {
            tasksWithoutTime.push(task);
          }
        });
        setTasksMorning(morningTasks);
        setTasksAfternoon(afternoonTasks);
        setTasksEvening(eveningTasks);
        setTasksNight(nightTasks);
        setTasksWithoutTimeOfDay(tasksWithoutTime);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_OVERDUE,
      (response) => {
        // todo need error handling
        setTasksOverdue(response as Task[]);
      },
    );

    return unsubscribe;
  }, []);

  const {
    onToggleTaskCompletionStatus,
    error: toggleTaskCompletionStatusError,
  } = useToggleTaskCompletionStatus(refreshTodayPageTasks);

  useEffect(() => {
    if (toggleTaskCompletionStatusError) {
      setNotifier(toggleTaskCompletionStatusError, 'error');
    }
  }, [toggleTaskCompletionStatusError, setNotifier]);

  const { onTaskFailure, error: taskFailureError } = useTaskFailure(
    refreshTodayPageTasks,
  );

  useEffect(() => {
    if (taskFailureError) {
      setNotifier(taskFailureError, 'error');
    }
  }, [taskFailureError, setNotifier]);

  const {
    onBulkFailure,
    error: bulkFailureError,
    requestOnGoing,
  } = useBulkFailure(refreshTodayPageTasks);

  useEffect(() => {
    if (bulkFailureError) {
      setNotifier(bulkFailureError, 'error');
    }
  }, [bulkFailureError, setNotifier]);

  const { onTaskReschedule, error: taskRescheduleError } = useTaskReschedule(
    refreshTodayPageTasks,
  );

  useEffect(() => {
    if (taskRescheduleError) {
      setNotifier(taskRescheduleError, 'error');
    }
  }, [taskRescheduleError, setNotifier]);

  useEffect(() => {
    const tasksOverdueByDate: { [key: string]: Task[] } = {};

    tasksOverdue.forEach((task) => {
      const taskDueDate = formatDate(dayjs(task.dueDate!));

      if (tasksOverdueByDate[taskDueDate]) {
        tasksOverdueByDate[taskDueDate].push(task);
      } else {
        tasksOverdueByDate[taskDueDate] = [task];
      }
    });

    setSortedTasksOverdue(tasksOverdueByDate);
  }, [tasksOverdue]);

  const handleTaskToggle = (
    e: React.ChangeEvent<HTMLInputElement>,
    task: Task,
  ) => {
    if (task.shouldBeScored && e.target.checked) setTaskIndexForScoring(task);
    else
      onToggleTaskCompletionStatus(
        task.id,
        e.target.checked,
        task.shouldBeScored ? null : undefined,
      );
  };

  const handleScoreDialogClose = () => {
    setTaskIndexForScoring(undefined);
    setScore(null);
  };

  const todayFormatted = formatDate(dayjs());

  const handleBulkFailure = async (date: string) => {
    const taskIds = sortedTasksOverdue[date].map((task) => task.id);
    await onBulkFailure(taskIds);
  };

  const handleTaskEdit = (taskId: number) => {
    if (taskId) {
      setTaskIdForEdit(taskId);
    }
  };

  return (
    <>
      {tasksOverdue.length > 0 && (
        <>
          <Typography variant="h6" mt={2}>
            Overdue
          </Typography>
          {/* todo sorting needed to ensure the dates are in correct order  */}
          {Object.keys(sortedTasksOverdue).map((key) => (
            <Box ml={2} key={key}>
              <Box
                display="flex"
                justifyContent="space-between"
                width="100%"
                alignItems="center"
              >
                <SectionHeader mt={2}>{key}</SectionHeader>
                <Button
                  size="small"
                  startIcon={<ThumbDownIcon />}
                  onClick={() => handleBulkFailure(key)}
                  disabled={requestOnGoing}
                >
                  Fail all
                </Button>
              </Box>
              <List>
                {sortedTasksOverdue[key].map((task) => (
                  <React.Fragment key={task.id}>
                    <TodoListItem
                      isCompleted={task.completionStatus === 'COMPLETE'}
                      onChange={(e) => handleTaskToggle(e, task)}
                      taskTitle={task.title}
                      showClock={task.schedule !== TaskScheduleTypeEnum.Daily}
                      onFail={() => onTaskFailure(task.id)}
                      onReschedule={(rescheduledTime) =>
                        onTaskReschedule(task.id, rescheduledTime)
                      }
                      onTaskEdit={() => handleTaskEdit(task.id)}
                    />
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ))}
        </>
      )}
      <Typography variant="h6" mt={2}>
        {todayFormatted}
      </Typography>
      {[
        tasksMorning,
        tasksAfternoon,
        tasksEvening,
        tasksNight,
        tasksWithoutTimeOfDay,
      ].map((tasks) => {
        if (tasks.length === 0) return null;

        const { timeOfDay } = tasks[0];
        const bg = timeOfDay ? TimeColors[timeOfDay] : 'none';
        const header = tasks[0].timeOfDay;
        return (
          <Box
            sx={{
              background: bg,
              borderRadius: '4px',
              px: 2,
              pt: timeOfDay ? 2 : 0,
              mt: timeOfDay ? 2 : 0,
            }}
          >
            {timeOfDay && (
              <SectionHeader sx={{ textTransform: 'capitalize' }}>
                {header}
              </SectionHeader>
            )}
            <List>
              {tasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <TodoListItem
                    isCompleted={task.completionStatus === 'COMPLETE'}
                    onChange={(e) => handleTaskToggle(e, task)}
                    taskTitle={task.title}
                    showClock={task.schedule !== TaskScheduleTypeEnum.Daily}
                    onFail={() => onTaskFailure(task.id)}
                    onReschedule={(rescheduledTime) =>
                      onTaskReschedule(task.id, rescheduledTime)
                    }
                    onTaskEdit={() => handleTaskEdit(task.id)}
                  />
                  {index !== tasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        );
      })}

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
              onToggleTaskCompletionStatus(taskForScoring.id, true, score);
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
