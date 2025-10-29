import { useState } from 'react';
import { ChannelsEnum } from '../types';

function useToggleTaskCompletionStatus(cb?: () => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');

  const onToggleTaskCompletionStatus = async (
    id: string,
    checked: boolean,
    taskScore?: number | null,
  ) => {
    setError('');
    setRequestOnGoing(true);
    try {
      await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_TOGGLE_TASK_COMPLETION_STATUS,
        {
          id,
          checked,
          score: taskScore,
        },
      );
      if (cb) {
        cb();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRequestOnGoing(false);
    }
  };

  return {
    requestOnGoing,
    error,
    onToggleTaskCompletionStatus,
  };
}

export default useToggleTaskCompletionStatus;
