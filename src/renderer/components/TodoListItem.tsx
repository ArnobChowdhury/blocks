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
} from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import SmallCheckbox from './SmallCheckbox';
import Clock from '../icons/Clock';
import Close from '../icons/Close';

interface ITodoListItemProps {
  isCompleted: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  taskTitle: string;
  showClock: boolean;
  onFail: () => void;
  onReschedule: (rescheduledTime: Dayjs) => void;
}

function TodoListItem({
  isCompleted,
  onChange,
  taskTitle,
  showClock = true,
  onFail,
  onReschedule,
}: ITodoListItemProps) {
  const [showOptions, setShowOptions] = useState(false);

  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>();

  const showDate = Boolean(dateAnchorEl);
  const datePopOverId = showDate ? 'datepicker-reschedule-popover' : undefined;

  const handleMouseEnter = () => {
    if (!isCompleted) setShowOptions(true);
  };

  const handleMouseLeave = () => {
    if (!isCompleted) setShowOptions(false);
  };

  return (
    <ListItem onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* todo we may not need LocalizationProvider everywhere, wrapping it at the top should do it   */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box display="flex" justifyContent="space-between" width="100%">
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
          <Fade in={showOptions} timeout={500}>
            <Box>
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
                      <Clock isGrey />
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
