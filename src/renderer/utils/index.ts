import dayjs, { Dayjs } from 'dayjs';
import { ChannelsEnum, DaysInAWeek, RepetitiveTaskTemplate } from '../types';
import {
  ROUTE_ROOT,
  ROUTE_ACTIVE,
  ROUTE_TASKS_WITHOUT_A_SPACE,
  ROUTE_TRACKER,
} from '../constants';

export const refreshTodayPageForDate = (date: Date) => {
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_TASKS_FOR_DATE,
    date,
  );
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_COUNT_OF_TASKS_OVERDUE,
  );
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

export const refreshSpace = (spaceId: string | null) => {
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_UNSCHEDULED_ACTIVE_TASKS_FOR_SPACE,
    spaceId,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_ONE_OFF_ACTIVE_TASKS_FOR_SPACE,
    spaceId,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_DAILY_ACTIVE_TEMPLATES_FOR_SPACE,
    spaceId,
  );

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TEMPLATES_FOR_SPACE,
    spaceId,
  );
};

export const handlePageTaskRefresh = (todayPageDisplayDate: Date) => {
  const location = window.location.hash.replace('#', '');

  if (location === ROUTE_ACTIVE) {
    refreshAllTasks();
  }

  if (location === ROUTE_ROOT) {
    refreshTodayPageForDate(todayPageDisplayDate);
  }

  if (location === ROUTE_TRACKER) {
    window.location.reload();
  }

  if (location.includes('/space')) {
    if (location === ROUTE_TASKS_WITHOUT_A_SPACE) {
      refreshSpace(null);
      return;
    }

    let spaceId = location.split('/')[2];
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

export const isPreviousDay = (date: string | Date | dayjs.Dayjs) => {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
};

export const getScheduledWeekDaysFromRepetitiveTask = (
  repetitiveTaskTemplate: RepetitiveTaskTemplate,
) => {
  const days: DaysInAWeek[] = [];
  Object.values(DaysInAWeek).forEach((day) => {
    if (repetitiveTaskTemplate[day]) {
      days.push(day);
    }
  });

  return days;
};

const weekDays = {
  [DaysInAWeek.Sunday]: 0,
  [DaysInAWeek.Monday]: 1,
  [DaysInAWeek.Tuesday]: 2,
  [DaysInAWeek.Wednesday]: 3,
  [DaysInAWeek.Thursday]: 4,
  [DaysInAWeek.Friday]: 5,
  [DaysInAWeek.Saturday]: 6,
};

export const getNextIterationDateForRepetitiveTask = (
  template: RepetitiveTaskTemplate,
  currentIterationDay: Dayjs,
) => {
  const scheduledDays = getScheduledWeekDaysFromRepetitiveTask(template).sort(
    (a, b) => weekDays[a] - weekDays[b],
  );

  if (scheduledDays.length === 0) {
    return null;
  }

  const nextDayInWeek = scheduledDays.find(
    (day) => weekDays[day] > currentIterationDay.day(),
  );

  if (nextDayInWeek) {
    const dayNumber = weekDays[nextDayInWeek];
    return currentIterationDay.day(dayNumber).startOf('day');
  } else {
    const firstDayNextWeekNumber = weekDays[scheduledDays[0]];
    return currentIterationDay
      .add(1, 'week')
      .day(firstDayNextWeekNumber)
      .startOf('day');
  }
};
