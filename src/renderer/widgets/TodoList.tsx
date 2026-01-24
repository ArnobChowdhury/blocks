import React, { useState } from 'react';
import {
  List,
  Divider,
  Typography,
  IconButton,
  Box,
  Popover,
  Fade,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Droppable,
  Draggable,
  DroppableProvided,
  DroppableStateSnapshot,
} from '@hello-pangea/dnd';

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
  droppableBlockName?: string;
  refreshCallback: (date: Date) => void;
}

function TodoList({
  tasks,
  refreshCallback,
  isLightBG,
  droppableBlockName,
}: TodoListProps) {
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

  const renderTodoListItem = (task: TaskWithTags) => (
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
  );

  const scorePopover = (
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
        <TaskScoring selected={score} onScoreSelection={handleScoreSelection} />
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
  );

  if (!droppableBlockName) {
    return (
      <>
        <List sx={{ py: 0 }}>
          {tasks.map((task, index) => (
            <div key={task.id}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {renderTodoListItem(task)}
              </Box>
              {index !== tasks.length - 1 && (
                <Divider
                  sx={{
                    borderColor: isLightBG ? 'rgba(0, 0, 0, 0.12)' : 'divider',
                  }}
                  component="li"
                />
              )}
            </div>
          ))}
        </List>
        {scorePopover}
      </>
    );
  }

  return (
    <>
      <List sx={{ py: 0 }}>
        <Droppable droppableId={droppableBlockName}>
          {(
            provided: DroppableProvided,
            droppableSnapshot: DroppableStateSnapshot,
          ) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(draggableProvided, draggableSnapshot) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      {...draggableProvided.dragHandleProps}
                      style={{
                        userSelect: 'none',
                        ...draggableProvided.draggableProps.style,
                        ...(draggableSnapshot.isDragging &&
                          index === tasks.length - 1 && {
                            borderBottom: isLightBG
                              ? '1px solid rgba(0, 0, 0, 0.12)'
                              : 'divider',
                          }),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DragIndicatorIcon fontSize="small" />
                        {renderTodoListItem(task)}
                      </Box>
                      <Fade
                        in={
                          index !== tasks.length - 1 ||
                          droppableSnapshot.isDraggingOver
                        }
                        appear
                        timeout={200}
                      >
                        <Divider
                          sx={{
                            borderColor: isLightBG
                              ? 'rgba(0, 0, 0, 0.12)'
                              : 'divider',
                          }}
                          component="li"
                        />
                      </Fade>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </List>
      {scorePopover}
    </>
  );
}

TodoList.defaultProps = {
  isLightBG: false,
  droppableBlockName: undefined,
};

export default TodoList;
