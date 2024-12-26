import { useEffect, SyntheticEvent, Fragment, useState } from 'react';
import { List, Typography, Divider, Tab, Box } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
  TaskScheduleTypeEnum,
  DaysInAWeek,
  TaskCompletionStatusEnum,
  TaskWithTags,
  RepetitiveTaskWithTags,
} from '../types';
import { TodoListItem, TabHeader } from '../components';
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
}

function TasksBySchedule({
  unscheduledTasks,
  oneOffTasks,
  dailyTasks,
  specificDaysInAWeekTasks,
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

  const handleTaskEdit = (taskId: number) => {
    setTaskIdForEdit(taskId);
  };

  const handleRepetitiveTaskEdit = (taskId: number) => {
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
                      schedule={task.schedule as TaskScheduleTypeEnum}
                      taskTitle={task.title}
                      tags={task.tags}
                      isCompleted={
                        task.completionStatus ===
                        TaskCompletionStatusEnum.COMPLETE
                      }
                      onChange={(e) =>
                        onToggleTaskCompletionStatus(
                          task.id,
                          e.target.checked,
                          undefined,
                        )
                      }
                      onFail={() => onTaskFailure(task.id)}
                      onReschedule={(rescheduledTime) =>
                        onTaskReschedule(task.id, rescheduledTime)
                      }
                      onTaskEdit={() => handleTaskEdit(task.id)}
                      showClock
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
                      schedule={task.schedule as TaskScheduleTypeEnum}
                      taskTitle={task.title}
                      tags={task.tags}
                      isCompleted={
                        task.completionStatus ===
                        TaskCompletionStatusEnum.COMPLETE
                      }
                      onChange={(e) =>
                        onToggleTaskCompletionStatus(
                          task.id,
                          e.target.checked,
                          undefined,
                        )
                      }
                      onFail={() => onTaskFailure(task.id)}
                      onReschedule={(rescheduledTime) =>
                        onTaskReschedule(task.id, rescheduledTime)
                      }
                      onTaskEdit={() => handleTaskEdit(task.id)}
                      showClock
                      key={task.id}
                      dueDateLabel={task.dueDate}
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
                    <TodoListItem
                      schedule={task.schedule as TaskScheduleTypeEnum}
                      taskTitle={task.title}
                      tags={task.tags}
                      onChange={() => {}}
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
                const days = Object.values(DaysInAWeek).filter(
                  (day) => task[day],
                );

                return (
                  <Fragment key={task.id}>
                    <TodoListItem
                      schedule={task.schedule as TaskScheduleTypeEnum}
                      taskTitle={task.title}
                      tags={task.tags}
                      onChange={() => {}}
                      onTaskEdit={() => handleRepetitiveTaskEdit(task.id)}
                      showClock
                      key={task.id}
                      dayLabels={days}
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

export default TasksBySchedule;
