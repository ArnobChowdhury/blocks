import { useState, useCallback } from 'react';
import { ChannelsEnum } from '../types';
import { useApp } from '../context/AppProvider';

function useBulkFailure(refreshCallback?: (date: Date) => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const { todayPageDisplayDate, setNotifier } = useApp();

  const onBulkFailure = useCallback(
    async (tasks: string[]) => {
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
        setNotifier(err.message, 'error');
      } finally {
        setRequestOnGoing(false);
      }
    },
    [refreshCallback, setNotifier, todayPageDisplayDate],
  );

  return {
    requestOnGoing,
    onBulkFailure,
  };
}

export default useBulkFailure;
