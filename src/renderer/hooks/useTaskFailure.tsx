import { useState, useCallback } from 'react';
import { ChannelsEnum } from '../types';
import { useApp } from '../context/AppProvider';

function useTaskFailure(refreshCallback?: (date: Date) => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');
  const { todayPageDisplayDate } = useApp();

  const onTaskFailure = useCallback(
    async (taskId: string) => {
      setError('');
      setRequestOnGoing(true);
      try {
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_TASK_FAILURE,
          { id: taskId },
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
    onTaskFailure,
  };
}

export default useTaskFailure;
