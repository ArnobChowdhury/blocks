import { useCallback, useState } from 'react';
import { ChannelsEnum, TaskCompletionStatusEnum } from '../types';
import { useApp } from '../context/AppProvider';

function useToggleTaskCompletionStatus(refreshCallback?: (date: Date) => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const { todayPageDisplayDate, setNotifier } = useApp();

  const onToggleTaskCompletionStatus = useCallback(
    async (
      id: string,
      status: TaskCompletionStatusEnum,
      taskScore?: number | null,
    ) => {
      setRequestOnGoing(true);
      try {
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_TOGGLE_TASK_COMPLETION_STATUS,
          {
            id,
            status,
            score: taskScore,
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
    onToggleTaskCompletionStatus,
  };
}

export default useToggleTaskCompletionStatus;
