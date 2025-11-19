import React, { useState } from 'react';
import {
  List,
  Divider,
  Typography,
  IconButton,
  Box,
  Popover,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

import { TaskWithTags, TaskCompletionStatusEnum } from '../types';
import { TodoListItem, TaskScoring } from '../components';
import {
  useToggleTaskCompletionStatus,
  useTaskFailure,
  useTaskReschedule,
} from '../hooks';
import { useApp } from '../context/AppProvider';

interface TodoListProps {
  tasks: TaskWithTags[];
  isLightBG?: boolean;
  refreshCallback: (date: Date) => void;
}

function TodoList({ tasks, refreshCallback, isLightBG }: TodoListProps) {
  const [taskForScoring, setTaskForScoring] = useState<TaskWithTags>();
  const [score, setScore] = useState<number | null>(null);
  const { setTaskIdForEdit } = useApp();

  const { onToggleTaskCompletionStatus } =
    useToggleTaskCompletionStatus(refreshCallback);
  const { onTaskFailure } = useTaskFailure(refreshCallback);
  const {
    onTaskReschedule,
    datePickerEndDate,
    handleDatePickerEndDate,
    resetDatePickerEndDate,
  } = useTaskReschedule(refreshCallback);

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
      score + 1,
    );
    handleScoreDialogClose();
  };

  return (
    <>
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
              datePickerEndDate={datePickerEndDate}
              setDatePickerEndDate={() => handleDatePickerEndDate(task)}
              resetDatePickerEndDate={resetDatePickerEndDate}
            />
            {index !== tasks.length - 1 && (
              <Divider
                sx={{
                  borderColor: isLightBG ? 'rgba(0, 0, 0, 0.12)' : 'divider',
                }}
                component="li"
              />
            )}
          </React.Fragment>
        ))}
      </List>
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

TodoList.defaultProps = {
  isLightBG: false,
};

export default TodoList;
