import { useEffect, useState } from 'react';
import { PageHeader } from '../components';
import { TasksBySchedule } from '../widgets';
import { refreshAllTasks } from '../utils';
import { ChannelsEnum, TaskWithTags, RepetitiveTaskWithTags } from '../types';

function Active() {
  useEffect(() => {
    refreshAllTasks();
  }, []);

  const [unscheduledTasks, setUnscheduledTasks] = useState<TaskWithTags[]>([]);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeUnscheduledActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_UNSCHEDULED_ACTIVE_TASKS,
      (response) => {
        setUnscheduledTasks(response as TaskWithTags[]);
      },
    );

    return unsubscribeUnscheduledActiveTasks;
  }, []);

  const [oneOffTasks, setOneOffTasks] = useState<TaskWithTags[]>([]);
  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeOneOffActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_ONE_OFF_ACTIVE_TASKS,
      (response) => {
        setOneOffTasks(response as TaskWithTags[]);
      },
    );

    return unsubscribeOneOffActiveTasks;
  }, []);

  const [dailyTasks, setDailyTasks] = useState<RepetitiveTaskWithTags[]>([]);
  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeDailyActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_DAILY_ACTIVE_TASKS,
      (response) => {
        setDailyTasks(response as RepetitiveTaskWithTags[]);
      },
    );

    return unsubscribeDailyActiveTasks;
  }, []);

  const [specificDaysInAWeekTasks, setSpecificDaysInAWeekTasks] = useState<
    RepetitiveTaskWithTags[]
  >([]);
  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeSpecificDaysInAWeek = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
      (response) => {
        setSpecificDaysInAWeekTasks(response as RepetitiveTaskWithTags[]);
      },
    );

    return unsubscribeSpecificDaysInAWeek;
  }, []);

  return (
    <>
      <PageHeader>Active</PageHeader>
      <TasksBySchedule
        unscheduledTasks={unscheduledTasks}
        oneOffTasks={oneOffTasks}
        dailyTasks={dailyTasks}
        specificDaysInAWeekTasks={specificDaysInAWeekTasks}
      />
    </>
  );
}

export default Active;
