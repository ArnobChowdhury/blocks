import { useState, useCallback } from 'react';
import { Dayjs } from 'dayjs';
import { ChannelsEnum } from '../types';
import { useApp } from '../context/AppProvider';

function useTaskReschedule(refreshCallback?: (date: Date) => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');
  const { todayPageDisplayDate } = useApp();

  const onTaskReschedule = useCallback(
    async (taskId: string, rescheduledTime: Dayjs) => {
      const dueDate = rescheduledTime.toISOString();
      setError('');
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
        setError(err.message);
      } finally {
        setRequestOnGoing(false);
      }
    },
    [refreshCallback, todayPageDisplayDate],
  );

  return {
    requestOnGoing,
    error,
    onTaskReschedule,
  };
}

export default useTaskReschedule;
