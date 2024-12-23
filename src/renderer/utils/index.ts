import dayjs, { Dayjs } from 'dayjs';
import { ChannelsEnum } from '../types';
import {
  ROUTE_ROOT,
  ROUTE_ACTIVE,
  ROUTE_TASKS_WITHOUT_A_SPACE,
} from '../constants';

export const refreshTodayPageTasks = () => {
  window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASKS_TODAY);
  window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASKS_OVERDUE);
};

// todo: change the name to refreshActiveTasks
export const refreshAllTasks = () => {
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_ALL_UNSCHEDULED_ACTIVE_TASKS,
  );
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_ALL_ONE_OFF_ACTIVE_TASKS,
  );
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_ALL_DAILY_ACTIVE_TASKS,
  );
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
  );
};

export const refreshSpace = (spaceId: number) => {
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_UNSCHEDULED_ACTIVE_TASKS_WITH_SPACE_ID,
    spaceId,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_ONE_OFF_ACTIVE_TASKS_WITH_SPACE_ID,
    spaceId,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_DAILY_ACTIVE_TASKS_WITH_SPACE_ID,
    spaceId,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_SPACE_ID,
    spaceId,
  );
};

export const refreshSpaceForTasksWithoutASpace = () => {
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_UNSCHEDULED_ACTIVE_TASKS_WITHOUT_SPACE,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_ONE_OFF_ACTIVE_TASKS_WITHOUT_SPACE,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_DAILY_ACTIVE_TASKS_WITHOUT_SPACE,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITHOUT_SPACE,
  );
};

export const handlePageTaskRefresh = () => {
  const location = window.location.hash.replace('#', '');

  if (location === ROUTE_ACTIVE) {
    refreshAllTasks();
  }

  if (location === ROUTE_ROOT) {
    refreshTodayPageTasks();
  }

  if (location === ROUTE_TASKS_WITHOUT_A_SPACE) {
    refreshSpaceForTasksWithoutASpace();
    return;
  }

  if (location.includes('/space')) {
    const spaceId = Number(location.split('/')[2]);
    refreshSpace(spaceId);
  }
};

export const formatDate = (day: Dayjs) => {
  return day.format('dddd, MMMM D, YYYY');
};

export const formatErrorMessage = (msg: string) => {
  const splitMsg = msg.split('Error: ');
  if (splitMsg[1]) return splitMsg[1];
  return 'Something went wrong!';
};

export const getMillisecondsUntilNextMidnight = () => {
  const now = dayjs();
  const nextMidnight = dayjs().endOf('day').add(1, 'second');
  return nextMidnight.diff(now);
};
