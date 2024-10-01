import dayjs, { Dayjs } from 'dayjs';
import { ChannelsEnum } from '../types';

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

export const refreshTagsPageTasks = (tagId: number) => {
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_UNSCHEDULED_ACTIVE_TASKS_WITH_TAG_ID,
    tagId,
  );
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_ONE_OFF_ACTIVE_TASKS_WITH_TAG_ID,
    tagId,
  );
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_DAILY_ACTIVE_TASKS_WITH_TAG_ID,
    tagId,
  );
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_TAG_ID,
    tagId,
  );
};

export const handlePageTaskRefresh = () => {
  const location = window.location.hash.replace('#', '');

  if (location === '/active') {
    refreshAllTasks();
  }

  if (location === '/') {
    refreshTodayPageTasks();
  }

  if (location.includes('/tagged-todos')) {
    const tagId = Number(location.split('/')[2]);
    refreshTagsPageTasks(tagId);
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
