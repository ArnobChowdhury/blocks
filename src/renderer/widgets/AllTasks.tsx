import { useEffect, useState, useMemo } from 'react';
import { Accordion, AccordionSummary, Typography } from '@mui/material';
import {
  ChannelsEnum,
  IFlattenedAllTask,
  TaskScheduleTypeEnum,
} from '../types';
import ArrowDownIcon from '../icons/ArrowDown';

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
              {tasksSorted[schedule].map((task) => (
                <Accordion key={task.id}>
                  <AccordionSummary expandIcon={<ArrowDownIcon />}>
                    {task.title}
                  </AccordionSummary>
                </Accordion>
              ))}
            </>
          );
        })}
    </div>
  );
}

export default AllTasks;
