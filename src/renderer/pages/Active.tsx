import { useEffect, useState } from 'react';
import { PageHeader } from '../components';
import { TasksBySchedule } from '../widgets';
import { refreshAllTasks } from '../utils';
import { ChannelsEnum, TaskWithTags, RepetitiveTaskWithTags } from '../types';

function Active() {
  useEffect(() => {
    refreshAllTasks();
  }, []);

  const [isLoadingUnscheduledTasks, setIsLoadingUnscheduledTasks] =
    useState(true);

  const [unscheduledTasks, setUnscheduledTasks] = useState<TaskWithTags[]>([]);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeUnscheduledActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_UNSCHEDULED_ACTIVE_TASKS,
      (response) => {
        setUnscheduledTasks(response as TaskWithTags[]);
        setIsLoadingUnscheduledTasks(false);
      },
    );

    return unsubscribeUnscheduledActiveTasks;
  }, []);

  const [isLoadingOneOffTasks, setIsLoadingOneOffTasks] = useState(true);
  const [oneOffTasks, setOneOffTasks] = useState<TaskWithTags[]>([]);
  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeOneOffActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_ONE_OFF_ACTIVE_TASKS,
      (response) => {
        setOneOffTasks(response as TaskWithTags[]);
        setIsLoadingOneOffTasks(false);
      },
    );

    return unsubscribeOneOffActiveTasks;
  }, []);

  const [isLoadingDailyTasks, setIsLoadingDailyTasks] = useState(true);
  const [dailyTasks, setDailyTasks] = useState<RepetitiveTaskWithTags[]>([]);
  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeDailyActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_DAILY_ACTIVE_TASKS,
      (response) => {
        setDailyTasks(response as RepetitiveTaskWithTags[]);
        setIsLoadingDailyTasks(false);
      },
    );

    return unsubscribeDailyActiveTasks;
  }, []);

  const [
    isLoadingSpecificDaysInAWeekTasks,
    setIsLoadingSpecificDaysInAWeekTasks,
  ] = useState(true);
  const [specificDaysInAWeekTasks, setSpecificDaysInAWeekTasks] = useState<
    RepetitiveTaskWithTags[]
  >([]);
  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeSpecificDaysInAWeek = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
      (response) => {
        setSpecificDaysInAWeekTasks(response as RepetitiveTaskWithTags[]);
        setIsLoadingSpecificDaysInAWeekTasks(false);
      },
    );

    return unsubscribeSpecificDaysInAWeek;
  }, []);

  const isLoading =
    isLoadingUnscheduledTasks ||
    isLoadingOneOffTasks ||
    isLoadingDailyTasks ||
    isLoadingSpecificDaysInAWeekTasks;

  return (
    <>
      <PageHeader>Active</PageHeader>
      <TasksBySchedule
        isLoading={isLoading}
        unscheduledTasks={unscheduledTasks}
        oneOffTasks={oneOffTasks}
        dailyTasks={dailyTasks}
        specificDaysInAWeekTasks={specificDaysInAWeekTasks}
      />
    </>
  );
}

export default Active;
