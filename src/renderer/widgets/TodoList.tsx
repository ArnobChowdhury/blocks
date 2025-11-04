import React, { useState, useEffect } from 'react';
import {
  List,
  Divider,
  Typography,
  IconButton,
  Box,
  Popover,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import NoTaskToday from '../images/NoTaskToday';

import {
  ChannelsEnum,
  TimeOfDay,
  TaskWithTags,
  TaskCompletionStatusEnum,
} from '../types';
import { TodoListItem, TaskScoring, SectionHeader } from '../components';
import { formatDate, refreshTodayPageForDate } from '../utils';
import {
  useToggleTaskCompletionStatus,
  useTaskFailure,
  useTaskReschedule,
} from '../hooks';
import { SectionColors } from '../constants';
import { useApp } from '../context/AppProvider';

function TodoList() {
  const [tasksMorning, setTasksMorning] = useState<TaskWithTags[]>([]);
  const [tasksAfternoon, setTasksAfternoon] = useState<TaskWithTags[]>([]);
  const [tasksEvening, setTasksEvening] = useState<TaskWithTags[]>([]);
  const [tasksNight, setTasksNight] = useState<TaskWithTags[]>([]);
  const [tasksWithoutTimeOfDay, setTasksWithoutTimeOfDay] = useState<
    TaskWithTags[]
  >([]);
  const [tasksFailed, setTasksFailed] = useState<TaskWithTags[]>([]);

  const [taskForScoring, setTaskForScoring] = useState<TaskWithTags>();
  const [score, setScore] = useState<number | null>(null);
  const { todayPageDisplayDate, setNotifier, setTaskIdForEdit } = useApp();

  const [noTasksForToday, setNoTasksForToday] = useState(false);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_FOR_DATE,
      (response) => {
        const tasks = response as TaskWithTags[];
        const morningTasks: TaskWithTags[] = [];
        const afternoonTasks: TaskWithTags[] = [];
        const eveningTasks: TaskWithTags[] = [];
        const nightTasks: TaskWithTags[] = [];
        const tasksWithoutTime: TaskWithTags[] = [];
        const failedTasks: TaskWithTags[] = [];

        if (tasks.length === 0) {
          setNoTasksForToday(true);
        } else {
          setNoTasksForToday(false);
        }

        tasks.forEach((task) => {
          if (task.completionStatus === TaskCompletionStatusEnum.FAILED) {
            failedTasks.push(task);
          } else if (task.timeOfDay === TimeOfDay.Morning) {
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
        setTasksFailed(failedTasks);
      },
    );

    return unsubscribe;
  }, []);

  const {
    onToggleTaskCompletionStatus,
    error: toggleTaskCompletionStatusError,
  } = useToggleTaskCompletionStatus(refreshTodayPageForDate);

  // todo: in future, we can call the set notifier from the hooks itself to get rid of lots of duplication
  useEffect(() => {
    if (toggleTaskCompletionStatusError) {
      setNotifier(toggleTaskCompletionStatusError, 'error');
    }
  }, [toggleTaskCompletionStatusError, setNotifier]);

  const { onTaskFailure, error: taskFailureError } = useTaskFailure(
    refreshTodayPageForDate,
  );

  // todo: in future, we can call the set notifier from the hooks itself to get rid of lots of duplication
  useEffect(() => {
    if (taskFailureError) {
      setNotifier(taskFailureError, 'error');
    }
  }, [taskFailureError, setNotifier]);

  const { onTaskReschedule, error: taskRescheduleError } = useTaskReschedule(
    refreshTodayPageForDate,
  );

  useEffect(() => {
    if (taskRescheduleError) {
      setNotifier(taskRescheduleError, 'error');
    }
  }, [taskRescheduleError, setNotifier]);

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
        e.target.checked
          ? TaskCompletionStatusEnum.COMPLETE
          : TaskCompletionStatusEnum.INCOMPLETE,
        task.shouldBeScored ? null : undefined,
      );
  };

  const handleScoreDialogClose = () => {
    setTaskForScoring(undefined);
    setScore(null);
  };

  const todayFormatted = formatDate(todayPageDisplayDate);

  const handleTaskEdit = (taskId: string) => {
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
    onToggleTaskCompletionStatus(
      taskForScoring.id,
      TaskCompletionStatusEnum.COMPLETE,
      score,
    );
    handleScoreDialogClose();
  };

  return (
    <>
      <Typography variant="h6" mt={2}>
        {todayFormatted}
      </Typography>
      {[
        tasksMorning,
        tasksAfternoon,
        tasksEvening,
        tasksNight,
        tasksWithoutTimeOfDay,
        tasksFailed,
      ].map((tasks) => {
        if (tasks.length === 0) return null;

        const { timeOfDay, completionStatus } = tasks[0];
        let bg: string;
        let header: string;
        if (completionStatus === TaskCompletionStatusEnum.FAILED) {
          bg = SectionColors.failed;
          header = 'Failed';
        } else if (timeOfDay) {
          bg = SectionColors[timeOfDay];
          header = timeOfDay;
        } else {
          bg = SectionColors.anytime;
          header = 'Any Time';
        }

        return (
          <Box
            sx={{
              background: bg,
              borderRadius: '4px',
              px: 2,
              pt: 2,
              mt: 2,
              color: 'text.onLightBackground',
            }}
            key={bg}
          >
            <SectionHeader sx={{ textTransform: 'capitalize' }}>
              {header}
            </SectionHeader>
            <List>
              {tasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <TodoListItem
                    task={task}
                    onChange={(e) => handleTaskToggle(e, task)}
                    onFail={() => onTaskFailure(task.id)}
                    onRecover={() =>
                      onToggleTaskCompletionStatus(
                        task.id,
                        TaskCompletionStatusEnum.INCOMPLETE,
                      )
                    }
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
      {noTasksForToday && (
        <Box
          width="100%"
          height="600px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mt={2}
        >
          <Box>
            <Typography sx={{ mb: 3 }} variant="body1" align="center">
              Empty for now. Ready to be filled with something great!
            </Typography>
            <NoTaskToday />
          </Box>
        </Box>
      )}
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
