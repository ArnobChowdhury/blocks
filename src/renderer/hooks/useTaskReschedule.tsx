import { useState, useCallback } from 'react';
import { Dayjs } from 'dayjs';
import { ChannelsEnum } from '../types';
import { useApp } from '../context/AppProvider';

function useTaskReschedule(refreshCallback?: (date: Date) => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const { todayPageDisplayDate, setNotifier } = useApp();

  const onTaskReschedule = useCallback(
    async (taskId: string, rescheduledTime: Dayjs) => {
      const dueDate = rescheduledTime.toISOString();
      setRequestOnGoing(true);
      try {
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_TASK_RESCHEDULE,
          {
            id: taskId,
            dueDate,
          },
        );
        if (refreshCallback) {
          refreshCallback(todayPageDisplayDate.toDate());
        }
      } catch (err: any) {
        setNotifier(err.message, 'error');
      } finally {
        setRequestOnGoing(false);
      }
    },
    [refreshCallback, setNotifier, todayPageDisplayDate],
  );

  return {
    requestOnGoing,
    onTaskReschedule,
  };
}

export default useTaskReschedule;
