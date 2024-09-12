import { List, Typography, Divider } from '@mui/material';
import { useEffect, Fragment } from 'react';
import {
  TaskScheduleTypeEnum,
  DaysInAWeek,
  TaskCompletionStatusEnum,
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

export default TasksBySchedule;
