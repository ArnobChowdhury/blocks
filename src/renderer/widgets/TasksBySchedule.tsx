import { useEffect, SyntheticEvent, Fragment, useState, useRef } from 'react';
import {
  List,
  Typography,
  Divider,
  Tab,
  Box,
  CircularProgress,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
  TaskScheduleTypeEnum,
  TaskCompletionStatusEnum,
  TaskWithTags,
  RepetitiveTaskWithTags,
} from '../types';
import { TodoListItem, TabHeader, RepetitiveTaskListItem } from '../components';
import { handlePageTaskRefresh } from '../utils';
import {
  useToggleTaskCompletionStatus,
  useTaskFailure,
  useTaskReschedule,
} from '../hooks';
import { useApp } from '../context/AppProvider';

interface TasksByScheduleProps {
  unscheduledTasks: TaskWithTags[];
  oneOffTasks: TaskWithTags[];
  dailyTasks: RepetitiveTaskWithTags[];
  specificDaysInAWeekTasks: RepetitiveTaskWithTags[];
  isLoading: boolean;
  spaceId?: string;
}

function TasksBySchedule({
  unscheduledTasks,
  oneOffTasks,
  dailyTasks,
  specificDaysInAWeekTasks,
  isLoading,
  spaceId,
}: TasksByScheduleProps) {
  const { setNotifier, setTaskIdForEdit, setRepetitiveTaskTemplateIdForEdit } =
    useApp();

  const {
    onToggleTaskCompletionStatus,
    error: toggleTaskCompletionStatusError,
  } = useToggleTaskCompletionStatus(handlePageTaskRefresh);

  const { onTaskFailure, error: taskFailureError } = useTaskFailure(
    handlePageTaskRefresh,
  );

  const { onTaskReschedule, error: taskRescheduleError } = useTaskReschedule(
    handlePageTaskRefresh,
  );

  const handleTaskEdit = (taskId: string) => {
    setTaskIdForEdit(taskId);
  };

  const handleRepetitiveTaskEdit = (taskId: string) => {
    setRepetitiveTaskTemplateIdForEdit(taskId);
  };

  useEffect(() => {
    if (toggleTaskCompletionStatusError) {
      setNotifier(toggleTaskCompletionStatusError, 'error');
    }
  }, [setNotifier, toggleTaskCompletionStatusError]);

  useEffect(() => {
    if (taskFailureError) {
      setNotifier(taskFailureError, 'error');
    }
  }, [setNotifier, taskFailureError]);

  useEffect(() => {
    if (taskRescheduleError) {
      setNotifier(taskRescheduleError, 'error');
    }
  }, [setNotifier, taskRescheduleError]);

  const [tabValue, setTabValue] = useState<TaskScheduleTypeEnum>(
    TaskScheduleTypeEnum.Unscheduled,
  );
  const handleTabChange = (
    event: SyntheticEvent,
    newValue: TaskScheduleTypeEnum,
  ) => {
    setTabValue(newValue);
  };

  const hasReordered = useRef(false);

  useEffect(() => {
    hasReordered.current = false;
  }, [spaceId]);

  useEffect(() => {
    if (!hasReordered.current && !isLoading) {
      const order = [
        {
          tabValue: TaskScheduleTypeEnum.Unscheduled,
          count: unscheduledTasks.length,
        },
        {
          tabValue: TaskScheduleTypeEnum.Once,
          count: oneOffTasks.length,
        },
        {
          tabValue: TaskScheduleTypeEnum.Daily,
          count: dailyTasks.length,
        },
        {
          tabValue: TaskScheduleTypeEnum.SpecificDaysInAWeek,
          count: specificDaysInAWeekTasks.length,
        },
      ];

      const firstTabWithContent = order.find((tab) => tab.count > 0);
      if (firstTabWithContent) {
        setTabValue(firstTabWithContent.tabValue);
      }
      hasReordered.current = true;
    }
  }, [
    isLoading,
    dailyTasks,
    oneOffTasks,
    specificDaysInAWeekTasks,
    unscheduledTasks,
  ]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label="lab API tabs example">
            <Tab
              label={
                <TabHeader
                  digit={unscheduledTasks.length}
                  label={TaskScheduleTypeEnum.Unscheduled}
                />
              }
              value={TaskScheduleTypeEnum.Unscheduled}
            />
            <Tab
              label={
                <TabHeader
                  digit={oneOffTasks.length}
                  label={TaskScheduleTypeEnum.Once}
                />
              }
              value={TaskScheduleTypeEnum.Once}
            />
            <Tab
              label={
                <TabHeader
                  digit={dailyTasks.length}
                  label={TaskScheduleTypeEnum.Daily}
                />
              }
              value={TaskScheduleTypeEnum.Daily}
            />
            <Tab
              label={
                <TabHeader
                  digit={specificDaysInAWeekTasks.length}
                  label={TaskScheduleTypeEnum.SpecificDaysInAWeek}
                />
              }
              value={TaskScheduleTypeEnum.SpecificDaysInAWeek}
            />
          </TabList>
        </Box>

        <TabPanel value={TaskScheduleTypeEnum.Unscheduled}>
          {unscheduledTasks.length === 0 && (
            <Typography variant="body2">No tasks unscheduled</Typography>
          )}
          {unscheduledTasks.length > 0 && (
            <List>
              {unscheduledTasks.map((task) => {
                return (
                  <Fragment key={task.id}>
                    <TodoListItem
                      task={task}
                      onChange={(e) =>
                        onToggleTaskCompletionStatus(
                          task.id,
                          e.target.checked
                            ? TaskCompletionStatusEnum.COMPLETE
                            : TaskCompletionStatusEnum.INCOMPLETE,
                          undefined,
                        )
                      }
                      onFail={() => onTaskFailure(task.id)}
                      onReschedule={(rescheduledTime) =>
                        onTaskReschedule(task.id, rescheduledTime)
                      }
                      onTaskEdit={() => handleTaskEdit(task.id)}
                      key={task.id}
                    />
                    <Divider />
                  </Fragment>
                );
              })}
            </List>
          )}
        </TabPanel>
        <TabPanel value={TaskScheduleTypeEnum.Once}>
          {oneOffTasks.length === 0 && (
            <Typography variant="body2">No one-off tasks scheduled.</Typography>
          )}
          {oneOffTasks.length > 0 && (
            <List>
              {oneOffTasks.map((task) => {
                return (
                  <Fragment key={task.id}>
                    <TodoListItem
                      task={task}
                      onChange={(e) =>
                        onToggleTaskCompletionStatus(
                          task.id,
                          e.target.checked
                            ? TaskCompletionStatusEnum.COMPLETE
                            : TaskCompletionStatusEnum.INCOMPLETE,
                          undefined,
                        )
                      }
                      onFail={() => onTaskFailure(task.id)}
                      onReschedule={(rescheduledTime) =>
                        onTaskReschedule(task.id, rescheduledTime)
                      }
                      onTaskEdit={() => handleTaskEdit(task.id)}
                      key={task.id}
                    />
                    <Divider />
                  </Fragment>
                );
              })}
            </List>
          )}
        </TabPanel>
        <TabPanel value={TaskScheduleTypeEnum.Daily}>
          {dailyTasks.length === 0 && (
            <Typography variant="body2">No daily tasks.</Typography>
          )}
          {dailyTasks.length > 0 && (
            <List>
              {dailyTasks.map((task) => {
                return (
                  <Fragment key={task.id}>
                    <RepetitiveTaskListItem
                      task={task}
                      key={task.id}
                      onTaskEdit={() => handleRepetitiveTaskEdit(task.id)}
                    />
                    <Divider />
                  </Fragment>
                );
              })}
            </List>
          )}
        </TabPanel>
        <TabPanel value={TaskScheduleTypeEnum.SpecificDaysInAWeek}>
          {specificDaysInAWeekTasks.length === 0 && (
            <Typography variant="body2">No tasks.</Typography>
          )}
          {specificDaysInAWeekTasks.length > 0 && (
            <List>
              {specificDaysInAWeekTasks.map((task) => {
                return (
                  <Fragment key={task.id}>
                    <RepetitiveTaskListItem
                      task={task}
                      onTaskEdit={() => handleRepetitiveTaskEdit(task.id)}
                      key={task.id}
                    />
                    <Divider />
                  </Fragment>
                );
              })}
            </List>
          )}
        </TabPanel>
      </TabContext>
    </div>
  );
}

TasksBySchedule.defaultProps = {
  spaceId: undefined,
};
export default TasksBySchedule;
