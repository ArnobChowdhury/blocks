import React, { useState, useEffect } from 'react';
import {
  List,
  Divider,
  Typography,
  Button,
  IconButton,
  Box,
  Popover,
} from '@mui/material';
import ThumbDownIcon from '@mui/icons-material/ThumbDownOutlined';
import CheckIcon from '@mui/icons-material/Check';
import dayjs, { Dayjs } from 'dayjs';

import {
  TaskScheduleTypeEnum,
  ChannelsEnum,
  TimeOfDay,
  TaskWithTags,
} from '../types';
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

interface TodoListProps {
  dateToday: Dayjs;
  setDateToday: React.Dispatch<React.SetStateAction<Dayjs>>;
}

function TodoList({ dateToday, setDateToday }: TodoListProps) {
  const [tasksMorning, setTasksMorning] = useState<TaskWithTags[]>([]);
  const [tasksAfternoon, setTasksAfternoon] = useState<TaskWithTags[]>([]);
  const [tasksEvening, setTasksEvening] = useState<TaskWithTags[]>([]);
  const [tasksNight, setTasksNight] = useState<TaskWithTags[]>([]);
  const [tasksWithoutTimeOfDay, setTasksWithoutTimeOfDay] = useState<
    TaskWithTags[]
  >([]);

  const [tasksOverdue, setTasksOverdue] = useState<TaskWithTags[]>([]);
  const [sortedTasksOverdue, setSortedTasksOverdue] = useState<{
    [key: string]: TaskWithTags[];
  }>({});
  const [taskForScoring, setTaskForScoring] = useState<TaskWithTags>();
  const [score, setScore] = useState<number | null>(null);
  const { setNotifier, setTaskIdForEdit } = useApp();

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_TODAY,
      (response) => {
        setDateToday(dayjs());
        const tasks = response as TaskWithTags[];
        const morningTasks: TaskWithTags[] = [];
        const afternoonTasks: TaskWithTags[] = [];
        const eveningTasks: TaskWithTags[] = [];
        const nightTasks: TaskWithTags[] = [];
        const tasksWithoutTime: TaskWithTags[] = [];

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
  }, [setDateToday]);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_OVERDUE,
      (response) => {
        // todo need error handling
        setTasksOverdue(response as TaskWithTags[]);
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
    const tasksOverdueByDate: Record<string, TaskWithTags[]> = {};

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

  const [scoreAnchorEl, setScoreAnchorEl] =
    React.useState<HTMLInputElement | null>(null);

  const handleTaskToggle = (
    e: React.ChangeEvent<HTMLInputElement>,
    task: TaskWithTags,
  ) => {
    if (task.shouldBeScored && e.target.checked) {
      setTaskForScoring(task);
      setScoreAnchorEl(e.target);
    } else
      onToggleTaskCompletionStatus(
        task.id,
        e.target.checked,
        task.shouldBeScored ? null : undefined,
      );
  };

  const handleScoreDialogClose = () => {
    setTaskForScoring(undefined);
    setScore(null);
  };

  const todayFormatted = formatDate(dateToday);

  const handleBulkFailure = async (date: string) => {
    const taskIds = sortedTasksOverdue[date].map((task) => task.id);
    await onBulkFailure(taskIds);
  };

  const handleTaskEdit = (taskId: number) => {
    if (taskId) {
      setTaskIdForEdit(taskId);
    }
  };

  const handleScoreSelection = (index: number) => {
    if (score === index) {
      setScore(null);
      return;
    }
    setScore(index);
  };

  const handleScoreSubmission = () => {
    if (score === null || !taskForScoring) return;
    onToggleTaskCompletionStatus(taskForScoring.id, true, score);
    handleScoreDialogClose();
  };

  return (
    <>
      {tasksOverdue.length > 0 && (
        <>
          <Typography variant="h6" mt={2}>
            Overdue
          </Typography>
          {/* todo sorting needed to ensure the dates are in correct order  */}
          {Object.keys(sortedTasksOverdue)
            .sort((a, b) => dayjs(a).diff(dayjs(b)))
            .map((key) => (
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
                    startIcon={<ThumbDownIcon color="error" />}
                    onClick={() => handleBulkFailure(key)}
                    disabled={requestOnGoing}
                    color="error"
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
                        tags={task.tags}
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
            key={bg}
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
                    tags={task.tags}
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
      <Popover
        open={Boolean(taskForScoring)}
        anchorEl={scoreAnchorEl}
        onClose={handleScoreDialogClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box p={2} display="flex" alignItems="center">
          <Typography variant="body2" mr={1}>
            Score:
          </Typography>
          <TaskScoring
            selected={score}
            onScoreSelection={handleScoreSelection}
          />
          <IconButton
            size="small"
            disabled={score === null}
            color="primary"
            onClick={handleScoreSubmission}
          >
            <CheckIcon />
          </IconButton>
        </Box>
      </Popover>
    </>
  );
}

export default TodoList;
