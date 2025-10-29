import { useState } from 'react';
import { ChannelsEnum } from '../types';

function useTaskFailure(cb?: () => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');

  const onTaskFailure = async (taskId: string) => {
    setError('');
    setRequestOnGoing(true);
    try {
      await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_TASK_FAILURE,
        { id: taskId },
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
    onTaskFailure,
  };
}

export default useTaskFailure;
