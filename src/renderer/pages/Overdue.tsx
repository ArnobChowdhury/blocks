/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react';
import {
  List,
  Divider,
  Button,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import ThumbDownIcon from '@mui/icons-material/ThumbDownOutlined';
import dayjs from 'dayjs';
import { PageHeader, SectionHeader, TodoListItem } from '../components';
import { TaskScheduleTypeEnum, ChannelsEnum, TaskWithTags } from '../types';
import { formatDate } from '../utils';
import {
  useBulkFailure,
  useToggleTaskCompletionStatus,
  useTaskFailure,
  useTaskReschedule,
} from '../hooks';
import { useApp } from '../context/AppProvider';

function Overdue() {
  const [tasksOverdue, setTasksOverdue] = useState<TaskWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortedTasksOverdue, setSortedTasksOverdue] = useState<{
    [key: string]: TaskWithTags[];
  }>({});
  const { setNotifier, setTaskIdForEdit } = useApp();

  const refreshOverduePage = () => {
    window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASKS_OVERDUE);
  };

  useEffect(() => {
    refreshOverduePage();

    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_OVERDUE,
      (response) => {
        setIsLoading(false);
        setTasksOverdue(response as TaskWithTags[]);
      },
    );

    return unsubscribe;
  }, []);

  const {
    onToggleTaskCompletionStatus,
    error: toggleTaskCompletionStatusError,
  } = useToggleTaskCompletionStatus(refreshOverduePage);

  useEffect(() => {
    if (toggleTaskCompletionStatusError) {
      setNotifier(toggleTaskCompletionStatusError, 'error');
    }
  }, [toggleTaskCompletionStatusError, setNotifier]);

  const { onTaskFailure, error: taskFailureError } =
    useTaskFailure(refreshOverduePage);

  useEffect(() => {
    if (taskFailureError) {
      setNotifier(taskFailureError, 'error');
    }
  }, [taskFailureError, setNotifier]);

  const {
    onBulkFailure,
    error: bulkFailureError,
    requestOnGoing,
  } = useBulkFailure(refreshOverduePage);

  useEffect(() => {
    if (bulkFailureError) {
      setNotifier(bulkFailureError, 'error');
    }
  }, [bulkFailureError, setNotifier]);

  const { onTaskReschedule, error: taskRescheduleError } =
    useTaskReschedule(refreshOverduePage);

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

  const handleBulkFailure = async (date: string) => {
    const taskIds = sortedTasksOverdue[date].map((task) => task.id);
    await onBulkFailure(taskIds);
  };

  const handleTaskEdit = (taskId: string) => {
    if (taskId) {
      setTaskIdForEdit(taskId);
    }
  };

  return (
    <>
      <PageHeader>Overdue</PageHeader>
      {isLoading ? (
        <CircularProgress />
      ) : tasksOverdue.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 5 }}>
          No overdue tasks. Great job staying on top of things!
        </Typography>
      ) : (
        Object.keys(sortedTasksOverdue)
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
                  startIcon={
                    requestOnGoing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <ThumbDownIcon color="error" />
                    )
                  }
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
                      onChange={(e) =>
                        onToggleTaskCompletionStatus(task.id, e.target.checked)
                      }
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
          ))
      )}
    </>
  );
}

export default Overdue;
