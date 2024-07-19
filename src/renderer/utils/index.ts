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

export const formatDate = (day: Dayjs) => {
  return day.format('dddd, MMMM D, YYYY');
};
