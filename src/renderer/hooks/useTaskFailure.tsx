import { useState, useCallback } from 'react';
import { ChannelsEnum } from '../types';
import { useApp } from '../context/AppProvider';

function useTaskFailure(refreshCallback?: (date: Date) => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const { todayPageDisplayDate, setNotifier } = useApp();

  const onTaskFailure = useCallback(
    async (taskId: string) => {
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
        setNotifier(err.message, 'error');
      } finally {
        setRequestOnGoing(false);
      }
    },
    [refreshCallback, setNotifier, todayPageDisplayDate],
  );

  return {
    requestOnGoing,
    onTaskFailure,
  };
}

export default useTaskFailure;
