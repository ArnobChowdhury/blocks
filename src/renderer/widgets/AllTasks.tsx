import { useEffect, useState, useMemo } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Box,
  useTheme,
} from '@mui/material';
import dayjs from 'dayjs';
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
        console.log(response);
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

  return (
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
            <>
              <Typography mt={index === 0 ? 0 : 5} mb={2} variant="h6">
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
                          <Box display="flex">
                            <Typography variant="body2">
                              {task.title}
                            </Typography>
                            {task.schedule === TaskScheduleTypeEnum.Once && (
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
                              />
                            ))}
                          </Box>
                        </ListItemText>
                      </ListItem>
                      <Divider />
                    </>
                  );
                })}
              </List>
            </>
          );
        })}
    </div>
  );
}

export default AllTasks;
