import { useState, useEffect, Fragment } from 'react';
import { List, Typography, Divider } from '@mui/material';
import {
  TaskScheduleTypeEnum,
  DaysInAWeek,
  TaskCompletionStatusEnum,
  ChannelsEnum,
  TaskWithTags,
  RepetitiveTaskWithTags,
} from '../types';
import { TodoListItem } from '../components';
import { handlePageTaskRefresh } from '../utils';
import {
  useToggleTaskCompletionStatus,
  useTaskFailure,
  useTaskReschedule,
} from '../hooks';
import { useApp } from '../context/AppProvider';

function AllTasks() {
  const [unscheduledTasks, setUnscheduledTasks] = useState<TaskWithTags[]>([]);
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

  const { setNotifier, setTaskIdForEdit, setRepetitiveTaskTemplateIdForEdit } =
    useApp();

  useEffect(() => {
    const unsubscribeUnscheduledActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_UNSCHEDULED_ACTIVE_TASKS,
      (response) => {
        setUnscheduledTasks(response as TaskWithTags[]);
      },
    );

    return unsubscribeUnscheduledActiveTasks;
  }, []);

  const [oneOffTasks, setOneOffTasks] = useState<TaskWithTags[]>([]);

  useEffect(() => {
    const unsubscribeOneOffActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_ONE_OFF_ACTIVE_TASKS,
      (response) => {
        setOneOffTasks(response as TaskWithTags[]);
      },
    );

    return unsubscribeOneOffActiveTasks;
  }, []);

  const [dailyTasks, setDailyTasks] = useState<RepetitiveTaskWithTags[]>([]);

  useEffect(() => {
    const unsubscribeDailyActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_DAILY_ACTIVE_TASKS,
      (response) => {
        setDailyTasks(response as RepetitiveTaskWithTags[]);
      },
    );

    return unsubscribeDailyActiveTasks;
  }, []);

  const [specificDaysInAWeekTasks, setSpecificDaysInAWeekTasks] = useState<
    RepetitiveTaskWithTags[]
  >([]);

  useEffect(() => {
    const unsubscribeSpecificDaysInAWeek = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
      (response) => {
        setSpecificDaysInAWeekTasks(response as RepetitiveTaskWithTags[]);
      },
    );

    return unsubscribeSpecificDaysInAWeek;
  }, []);

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

  const handleTaskEdit = (taskId: number) => {
    setTaskIdForEdit(taskId);
  };

  const handleRepetitiveTaskEdit = (taskId: number) => {
    setRepetitiveTaskTemplateIdForEdit(taskId);
  };

  return (
    <div>
      <Typography mt={2} mb={1} variant="h6">
        {TaskScheduleTypeEnum.Unscheduled}
      </Typography>
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
                    task.completionStatus === TaskCompletionStatusEnum.COMPLETE
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

      <Typography mt={5} mb={1} variant="h6">
        {TaskScheduleTypeEnum.Once}
      </Typography>
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
                    task.completionStatus === TaskCompletionStatusEnum.COMPLETE
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

      <Typography mt={5} mb={1} variant="h6">
        {TaskScheduleTypeEnum.Daily}
      </Typography>
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

      <Typography mt={5} mb={1} variant="h6">
        {TaskScheduleTypeEnum.SpecificDaysInAWeek}
      </Typography>
      {specificDaysInAWeekTasks.length === 0 && (
        <Typography variant="body2">No tasks.</Typography>
      )}
      {specificDaysInAWeekTasks.length > 0 && (
        <List>
          {specificDaysInAWeekTasks.map((task) => {
            const days = Object.values(DaysInAWeek).filter((day) => task[day]);

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
    </div>
  );
}

export default AllTasks;
