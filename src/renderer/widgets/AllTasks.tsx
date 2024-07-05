import { useEffect, useState, useMemo, Fragment } from 'react';
import { List, Typography, Divider } from '@mui/material';
import {
  ChannelsEnum,
  IFlattenedAllTask,
  TaskScheduleTypeEnum,
  DaysInAWeek,
  TaskCompletionStatusEnum,
} from '../types';
import { TodoListItem } from '../components';

function AllTasks() {
  const [allTasks, setAllTasks] = useState<IFlattenedAllTask[]>([]);

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
            <Fragment key={`${schedule}`}>
              <Typography mt={index === 0 ? 2 : 5} mb={1} variant="h6">
                {schedule}
              </Typography>
              <List>
                {tasksSorted[schedule].map((task) => {
                  let days: DaysInAWeek[] = [];
                  if (
                    task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek
                  ) {
                    // todo days should be used to calculate labels
                    days = Object.values(DaysInAWeek).filter(
                      (day) => task[day],
                    );
                  }

                  return (
                    <Fragment key={task.id}>
                      <TodoListItem
                        schedule={task.schedule as TaskScheduleTypeEnum}
                        taskTitle={task.title}
                        isCompleted={
                          task.completionStatus ===
                          TaskCompletionStatusEnum.COMPLETE
                        }
                        onChange={() => {}}
                        onFail={() => {}}
                        onReschedule={() => {}}
                        showClock
                        key={task.id}
                      />
                      <Divider />
                    </Fragment>
                  );
                })}
              </List>
            </Fragment>
          );
        })}
    </div>
  );
}

export default AllTasks;
