import { Dayjs } from 'dayjs';
import { ChannelsEnum } from '../types';

/**
 * todos:
 * 1. Create a separate service for all ipc messages
 */

export const onTaskCompletionChange = (
  id: number,
  checked: boolean,
  taskScore?: number | null,
) => {
  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_TOGGLE_TASK_COMPLETION_STATUS,
    {
      id,
      checked,
      score: taskScore,
    },
  );
};

export const onTaskFailure = (taskId: number) => {
  window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASK_FAILURE, {
    id: taskId,
  });
};

export const onTaskReSchedule = (taskId: number, rescheduledTime: Dayjs) => {
  const dueDate = rescheduledTime.toISOString();

  window.electron.ipcRenderer.sendMessage(
    ChannelsEnum.REQUEST_TASK_RESCHEDULE,
    {
      id: taskId,
      dueDate,
    },
  );
};

export const refreshTodayPageTasks = () => {
  window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASKS_TODAY);
  window.electron.ipcRenderer.sendMessage(ChannelsEnum.REQUEST_TASKS_OVERDUE);
};
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

export const formatDate = (day: Dayjs) => {
  return day.format('dddd, MMMM D, YYYY');
};

export const executeAfterASecond = (cb: () => any) => {
  setTimeout(() => {
    cb();
  }, 1000);
};

export const formatErrorMessage = (msg: string) => {
  const splitMsg = msg.split('Error: ');
  if (splitMsg[1]) return splitMsg[1];
  return 'Something went wrong!';
};
