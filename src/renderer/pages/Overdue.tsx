/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react';
import { Button, Box, CircularProgress, Typography } from '@mui/material';
import ThumbDownIcon from '@mui/icons-material/ThumbDownOutlined';
import dayjs from 'dayjs';
import { PageHeader, SectionHeader } from '../components';
import { TodoList } from '../widgets';
import { ChannelsEnum, TaskWithTags } from '../types';
import { formatDate } from '../utils';
import { useBulkFailure } from '../hooks';

function Overdue() {
  const [tasksOverdue, setTasksOverdue] = useState<TaskWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortedTasksOverdue, setSortedTasksOverdue] = useState<{
    [key: string]: TaskWithTags[];
  }>({});

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

  const { onBulkFailure, requestOnGoing } = useBulkFailure(refreshOverduePage);

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
              <TodoList
                tasks={sortedTasksOverdue[key]}
                refreshCallback={refreshOverduePage}
              />
            </Box>
          ))
      )}
    </>
  );
}

export default Overdue;
