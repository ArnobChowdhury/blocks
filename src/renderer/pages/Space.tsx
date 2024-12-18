import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components';
import { TasksBySchedule } from '../widgets';
import { refreshSpace } from '../utils';
import { TaskWithTags, RepetitiveTaskWithTags, ChannelsEnum } from '../types';

function Space() {
  const { spaceId, spaceName } = useParams();

  useEffect(() => {
    if (spaceId) refreshSpace(Number(spaceId));
  }, [spaceId]);

  const [unscheduledTasks, setUnscheduledTasks] = useState<TaskWithTags[]>([]);
  useEffect(() => {
    const unsubscribeUnscheduledActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_UNSCHEDULED_ACTIVE_TASKS_WITH_SPACE_ID,
      (response) => {
        setUnscheduledTasks(response as TaskWithTags[]);
      },
    );

    return unsubscribeUnscheduledActiveTasks;
  }, []);

  const [oneOffTasks, setOneOffTasks] = useState<TaskWithTags[]>([]);

  useEffect(() => {
    const unsubscribeOneOffActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_ONE_OFF_ACTIVE_TASKS_WITH_SPACE_ID,
      (response) => {
        setOneOffTasks(response as TaskWithTags[]);
      },
    );

    return unsubscribeOneOffActiveTasks;
  }, []);

  const [dailyTasks, setDailyTasks] = useState<RepetitiveTaskWithTags[]>([]);

  useEffect(() => {
    const unsubscribeDailyActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_DAILY_ACTIVE_TASKS_WITH_SPACE_ID,
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
    const unsubscribeSpecificDaysInAWeek = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_SPACE_ID,
      (response) => {
        setSpecificDaysInAWeekTasks(response as RepetitiveTaskWithTags[]);
      },
    );

    return unsubscribeSpecificDaysInAWeek;
  }, []);

  return (
    <>
      <PageHeader>Space: {spaceName}</PageHeader>
      <TasksBySchedule
        unscheduledTasks={unscheduledTasks}
        oneOffTasks={oneOffTasks}
        dailyTasks={dailyTasks}
        specificDaysInAWeekTasks={specificDaysInAWeekTasks}
      />
    </>
  );
}

export default Space;
