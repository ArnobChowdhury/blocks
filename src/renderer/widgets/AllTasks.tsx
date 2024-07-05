import { useEffect, useState, useMemo, Fragment } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Box,
  useTheme,
  IconButton,
  Tooltip,
  Popover,
} from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Clock from '../icons/Clock';
import Delete from '../icons/Delete';
import {
  ChannelsEnum,
  IFlattenedAllTask,
  TaskScheduleTypeEnum,
  DaysInAWeek,
} from '../types';
import { CalendarChip } from '../components';

function AllTasks() {
  const [allTasks, setAllTasks] = useState<IFlattenedAllTask[]>([]);
  const theme = useTheme();

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage(
      ChannelsEnum.REQUEST_ALL_ACTIVE_TASKS,
    );
    window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_ACTIVE_TASKS,
      (response) => {
        setAllTasks(response as IFlattenedAllTask[]);
      },
    );
  }, []);

  const tasksSorted = useMemo(() => {
    const taskSortedBySchedule: { [key: string]: IFlattenedAllTask[] } = {};

    allTasks.forEach((task) => {
      if (!taskSortedBySchedule[task.schedule as TaskScheduleTypeEnum]) {
        taskSortedBySchedule[task.schedule] = [];
      }
      taskSortedBySchedule[task.schedule].push(task);
    });
    return taskSortedBySchedule;
  }, [allTasks]);

  const schedulesOrderedArray = useMemo(() => {
    return Object.values(TaskScheduleTypeEnum);
  }, []);

  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const showDate = Boolean(dateAnchorEl);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>();

  const datePopOverId = showDate
    ? 'datepicker-all-tasks-reschedule-popover'
    : undefined;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div>
        {Object.keys(tasksSorted)
          .sort((a, b) => {
            const indexA = schedulesOrderedArray.indexOf(
              a as TaskScheduleTypeEnum,
            );
            const indexB = schedulesOrderedArray.indexOf(
              b as TaskScheduleTypeEnum,
            );
            return indexA - indexB;
          })
          .map((schedule, index) => {
            return (
              <Fragment key={`${schedule}`}>
                <Typography mt={index === 0 ? 2 : 5} mb={1} variant="h6">
                  {schedule}
                </Typography>
                <List>
                  {tasksSorted[schedule].map((task) => {
                    let days: DaysInAWeek[] = [];
                    if (
                      task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek
                    )
                      days = Object.values(DaysInAWeek).filter(
                        (day) => task[day],
                      );

                    return (
                      <>
                        <ListItem key={task.id}>
                          <ListItemText>
                            <Box display="flex" justifyContent="space-between">
                              <Box display="flex" alignItems="center">
                                <Typography variant="body2">
                                  {task.title}
                                </Typography>
                                {task.schedule ===
                                  TaskScheduleTypeEnum.Once && (
                                  <CalendarChip
                                    sx={{ ml: 2 }}
                                    date={dayjs(task.dueDate)}
                                    size="small"
                                  />
                                )}
                                {days.map((day) => (
                                  <Chip
                                    sx={{
                                      ml: 2,
                                      textTransform: 'capitalize',
                                      color: theme.palette.primary.main,
                                    }}
                                    label={day}
                                    size="small"
                                    key={day}
                                  />
                                ))}
                              </Box>
                              <Box display="flex">
                                {(task.schedule === TaskScheduleTypeEnum.Once ||
                                  task.schedule ===
                                    TaskScheduleTypeEnum.Unscheduled) && (
                                  <>
                                    <Tooltip
                                      title={
                                        task.schedule ===
                                        TaskScheduleTypeEnum.Once
                                          ? 'Reschedule'
                                          : 'Schedule'
                                      }
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
                                        onClick={(e) => {
                                          console.count('click');
                                          console.log(e.currentTarget);
                                          setDateAnchorEl(e.currentTarget);
                                        }}
                                        size="small"
                                      >
                                        <Clock isGrey={false} />
                                      </IconButton>
                                    </Tooltip>

                                    <Popover
                                      id={`${datePopOverId}-${task.id}`}
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
                                            // onReschedule(val);
                                          }
                                        }}
                                        orientation="landscape"
                                      />
                                    </Popover>
                                  </>
                                )}

                                <Tooltip
                                  title="Delete Task"
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
                                  <IconButton size="small" onClick={() => {}}>
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </ListItemText>
                        </ListItem>
                        <Divider />
                      </>
                    );
                  })}
                </List>
              </Fragment>
            );
          })}
      </div>
    </LocalizationProvider>
  );
}

export default AllTasks;
