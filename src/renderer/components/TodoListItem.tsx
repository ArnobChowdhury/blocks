/* eslint-disable react/require-default-props */
import React, { useState } from 'react';
import {
  ListItem,
  FormControlLabel,
  Typography,
  Box,
  IconButton,
  Fade,
  Tooltip,
  Popover,
  Checkbox,
  useTheme,
} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import ThumbDownIcon from '@mui/icons-material/ThumbDownOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import dayjs, { Dayjs } from 'dayjs';
import Clock from '../icons/Clock';
import { TaskWithTags, TaskCompletionStatusEnum } from '../types';
import CustomChip from './CustomChip';

interface ITaskListItemProps {
  task: TaskWithTags;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDueDateLabel?: boolean;
  onFail?: () => void;
  onRecover?: () => void;
  onReschedule?: (rescheduledTime: Dayjs) => void;
  onTaskEdit: () => void;
}

function TodoListItem({
  task,
  onChange,
  showDueDateLabel,
  onFail,
  onRecover,
  onReschedule,
  onTaskEdit,
}: ITaskListItemProps) {
  const {
    title: taskTitle,
    tags = [],
    completionStatus,
    dueDate: dueDateLabel,
  } = task;
  const isCompleted = completionStatus === TaskCompletionStatusEnum.COMPLETE;
  const isFailed = completionStatus === TaskCompletionStatusEnum.FAILED;

  const [showOptions, setShowOptions] = useState(false);

  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>();

  const showDate = Boolean(dateAnchorEl);
  const datePopOverId = showDate ? 'datepicker-reschedule-popover' : undefined;

  const handleMouseEnter = () => {
    if (!isCompleted) {
      setShowOptions(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isCompleted) setShowOptions(false);
  };

  const theme = useTheme();

  const handleEditClick = (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
  ) => {
    e.preventDefault();
    onTaskEdit();
  };

  return (
    <ListItem
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      dense
      onClick={handleEditClick}
      sx={{ cursor: 'pointer' }}
    >
      <Box display="flex" justifyContent="space-between" width="100%">
        <Box display="flex" alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isCompleted}
                onChange={onChange}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            }
            label={
              <Typography
                sx={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                }}
                variant="body2"
                onClick={handleEditClick}
              >
                {taskTitle}
              </Typography>
            }
          />

          <Box ml={2}>
            {showDueDateLabel && dueDateLabel && (
              <CustomChip
                size="small"
                label={`${dayjs(dueDateLabel).date()} ${dayjs(
                  dueDateLabel,
                ).format('MMMM')}`}
              />
            )}
          </Box>
          <Fade in={showOptions} timeout={200}>
            <Box display="flex" alignItems="center">
              {tags.map((tag) => (
                <CustomChip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    mr: 1,
                    fontSize: '12px',
                    backgroundColor: '#CCE7E5',
                    color: theme.palette.primary.main,
                    px: 0.5,
                    py: 0.5,
                  }}
                />
              ))}
            </Box>
          </Fade>
        </Box>
        <Fade in={showOptions} timeout={200}>
          <Box
            display="flex"
            width="80px"
            justifyContent="flex-end"
            alignItems="center"
          >
            {!isCompleted && (
              <>
                <Tooltip
                  title="Reschedule"
                  placement="top"
                  arrow
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -6],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateAnchorEl(e.currentTarget);
                    }}
                    sx={{ width: '32px', height: '32px' }}
                  >
                    <Clock />
                  </IconButton>
                </Tooltip>

                <Popover
                  id={datePopOverId}
                  onClick={(e) => e.stopPropagation()}
                  open={showDate}
                  anchorEl={dateAnchorEl}
                  onClose={() => setDateAnchorEl(null)}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  sx={{
                    '.MuiPaper-root': {
                      boxShadow:
                        '0px 3px 6px rgba(0,0,0,0.16), 0px 3px 6px rgba(0,0,0,0.23)',
                    },
                  }}
                >
                  <StaticDatePicker
                    // defaultValue={dayjs()}
                    disablePast
                    onChange={setSelectedDate}
                    value={selectedDate}
                    onClose={() => setDateAnchorEl(null)}
                    onAccept={(val) => {
                      if (val) {
                        setSelectedDate(val);
                        setDateAnchorEl(null);
                        if (onReschedule) onReschedule(val);
                      }
                    }}
                    orientation="landscape"
                  />
                </Popover>
              </>
            )}
            {!isCompleted && !isFailed && (
              <Tooltip
                title="Failed"
                placement="top"
                arrow
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, -6],
                        },
                      },
                    ],
                  },
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onFail) onFail();
                  }}
                  sx={{ width: '32px', height: '32px' }}
                >
                  <ThumbDownIcon sx={{ width: '16px' }} color="error" />
                </IconButton>
              </Tooltip>
            )}
            {isFailed && (
              <Tooltip
                title="Recover"
                placement="top"
                arrow
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, -6],
                        },
                      },
                    ],
                  },
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRecover) onRecover();
                  }}
                  sx={{ width: '32px', height: '32px' }}
                >
                  <RestartAltIcon sx={{ width: '20px' }} color="success" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Fade>
      </Box>
    </ListItem>
  );
}

export default TodoListItem;
