import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components';
import { TasksBySchedule } from '../widgets';
import { refreshSpace } from '../utils';
import { TaskWithTags, RepetitiveTaskWithTags, ChannelsEnum } from '../types';

function Space() {
  const { spaceId, spaceName } = useParams();

  useEffect(() => {
    refreshSpace(spaceId || null);
  }, [spaceId]);

  const [unscheduledTasks, setUnscheduledTasks] = useState<TaskWithTags[]>([]);
  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribeUnscheduledActiveTasks = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_UNSCHEDULED_ACTIVE_TASKS_FOR_SPACE,
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
      ChannelsEnum.RESPONSE_ONE_OFF_ACTIVE_TASKS_FOR_SPACE,
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
      ChannelsEnum.RESPONSE_DAILY_ACTIVE_TEMPLATES_FOR_SPACE,
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
      ChannelsEnum.RESPONSE_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TEMPLATES_FOR_SPACE,
      (response) => {
        setSpecificDaysInAWeekTasks(response as RepetitiveTaskWithTags[]);
      },
    );

    return unsubscribeSpecificDaysInAWeek;
  }, []);

  return (
    <>
      <PageHeader>{spaceName || 'Tasks'} </PageHeader>
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
