import { useState, useCallback } from 'react';
import { ChannelsEnum } from '../types';
import { useApp } from '../context/AppProvider';

function useBulkFailure(refreshCallback?: (date: Date) => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');
  const { todayPageDisplayDate } = useApp();

  const onBulkFailure = useCallback(
    async (tasks: string[]) => {
      setError('');
      setRequestOnGoing(true);
      try {
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_BULK_TASK_FAILURE,
          tasks,
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
    onBulkFailure,
  };
}

export default useBulkFailure;
