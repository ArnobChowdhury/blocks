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
  Chip,
  Checkbox,
  useTheme,
} from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import ThumbDownIcon from '@mui/icons-material/ThumbDownOutlined';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Clock from '../icons/Clock';
import { TaskScheduleTypeEnum, DaysInAWeek } from '../types';
import CustomChip from './CustomChip';

// eslint-disable-next-line import/no-relative-packages
import { Tag } from '../../generated/client';

interface ITodoListItemProps {
  isCompleted?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  taskTitle: string;
  tags: Tag[];
  showClock?: boolean;
  schedule?: TaskScheduleTypeEnum;
  dayLabels?: DaysInAWeek[];
  dueDateLabel?: string | Date | Dayjs | null;
  onFail?: () => void;
  onReschedule?: (rescheduledTime: Dayjs) => void;
  onTaskEdit: () => void;
}

function TodoListItem({
  isCompleted,
  onChange,
  taskTitle,
  tags = [],
  showClock = true,
  schedule,
  dayLabels,
  dueDateLabel,
  onFail,
  onReschedule,
  onTaskEdit,
}: ITodoListItemProps) {
  const isAHabit =
    schedule === TaskScheduleTypeEnum.Daily ||
    schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek;
  const [showOptions, setShowOptions] = useState(
    Boolean(schedule) && !isAHabit,
  );

  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>();

  const showDate = Boolean(dateAnchorEl);
  const datePopOverId = showDate ? 'datepicker-reschedule-popover' : undefined;

  const handleMouseEnter = () => {
    if (schedule) return;
    if (!isCompleted && !isAHabit) {
      setShowOptions(true);
    }
  };

  const handleMouseLeave = () => {
    if (schedule) return;
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
      {/* todo we may not need LocalizationProvider everywhere, wrapping it at the top should do it   */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center">
            {isAHabit && <Typography variant="body2">{taskTitle}</Typography>}
            {!isAHabit && (
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
            )}

            <Box ml={2}>
              {dueDateLabel && (
                <CustomChip
                  size="small"
                  label={`${dayjs(dueDateLabel).date()} ${dayjs(
                    dueDateLabel,
                  ).format('MMMM')}`}
                />
              )}
              {dayLabels && dayLabels.length > 0 && (
                <Box ml={2}>
                  {dayLabels.map((day) => (
                    <Chip
                      key={day}
                      label={day}
                      size="small"
                      variant="outlined"
                      sx={{
                        mr: 1,
                        color: theme.palette.primary.main,
                        textTransform: 'capitalize',
                      }}
                    />
                  ))}
                </Box>
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
              {showClock && (
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
                      onClick={(e) => setDateAnchorEl(e.currentTarget)}
                      sx={{ width: '32px', height: '32px' }}
                    >
                      <Clock />
                    </IconButton>
                  </Tooltip>

                  <Popover
                    id={datePopOverId}
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
                  onClick={onFail}
                  sx={{ width: '32px', height: '32px' }}
                >
                  <ThumbDownIcon sx={{ width: '16px' }} color="error" />
                </IconButton>
              </Tooltip>
            </Box>
          </Fade>
        </Box>
      </LocalizationProvider>
    </ListItem>
  );
}

export default TodoListItem;
