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
  useTheme,
} from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import SmallCheckbox from './SmallCheckbox';
import Clock from '../icons/Clock';
import Close from '../icons/Close';
import { TaskScheduleTypeEnum, DaysInAWeek } from '../types';

interface ITodoListItemProps {
  isCompleted?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  taskTitle: string;
  showClock: boolean;
  schedule?: TaskScheduleTypeEnum;
  dayLabels?: DaysInAWeek[];
  onFail: () => void;
  onReschedule: (rescheduledTime: Dayjs) => void;
}

function TodoListItem({
  isCompleted,
  onChange,
  taskTitle,
  showClock = true,
  schedule,
  dayLabels,
  onFail,
  onReschedule,
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

  return (
    <ListItem onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* todo we may not need LocalizationProvider everywhere, wrapping it at the top should do it   */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center">
            {isAHabit && <Typography variant="body2">{taskTitle}</Typography>}
            {!isAHabit && (
              <FormControlLabel
                control={
                  <SmallCheckbox checked={isCompleted} onChange={onChange} />
                }
                label={
                  <Typography
                    sx={{
                      textDecoration: isCompleted ? 'line-through' : 'none',
                    }}
                    variant="body2"
                  >
                    {taskTitle}
                  </Typography>
                }
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
            <Box display="flex">
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
                          onReschedule(val);
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
                <IconButton size="small" onClick={onFail}>
                  <Close />
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
