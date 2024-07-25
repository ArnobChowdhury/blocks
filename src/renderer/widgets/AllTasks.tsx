import { useState, useEffect, Fragment } from 'react';
import { List, Typography, Divider } from '@mui/material';
import {
  TaskScheduleTypeEnum,
  DaysInAWeek,
  TaskCompletionStatusEnum,
  ChannelsEnum,
} from '../types';
import { TodoListItem } from '../components';
import { handlePageTaskRefresh } from '../utils';
import {
  useToggleTaskCompletionStatus,
  useTaskFailure,
  useTaskReschedule,
} from '../hooks';
import { useApp } from '../context/AppProvider';

// eslint-disable-next-line import/no-relative-packages
import { Task, RepetitiveTaskTemplate } from '../../generated/client';

function AllTasks() {
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
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

  const { setNotifier } = useApp();

  useEffect(() => {
    const unsubscribeUnscheduledActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_UNSCHEDULED_ACTIVE_TASKS,
      (response) => {
        setUnscheduledTasks(response as Task[]);
      },
    );

    return unsubscribeUnscheduledActiveTasks;
  }, []);

  const [oneOffTasks, setOneOffTasks] = useState<Task[]>([]);

  useEffect(() => {
    const unsubscribeOneOffActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_ONE_OFF_ACTIVE_TASKS,
      (response) => {
        setOneOffTasks(response as Task[]);
      },
    );

    return unsubscribeOneOffActiveTasks;
  }, []);

  const [dailyTasks, setDailyTasks] = useState<RepetitiveTaskTemplate[]>([]);

  useEffect(() => {
    const unsubscribeDailyActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_DAILY_ACTIVE_TASKS,
      (response) => {
        setDailyTasks(response as RepetitiveTaskTemplate[]);
      },
    );

    return unsubscribeDailyActiveTasks;
  }, []);

  const [specificDaysInAWeekTasks, setSpecificDaysInAWeekTasks] = useState<
    RepetitiveTaskTemplate[]
  >([]);

  useEffect(() => {
    const unsubscribeSpecificDaysInAWeek = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
      (response) => {
        setSpecificDaysInAWeekTasks(response as RepetitiveTaskTemplate[]);
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
                  onChange={() => {}}
                  key={task.id}
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
                  onChange={() => {}}
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
