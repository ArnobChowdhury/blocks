import { useState } from 'react';
import { ChannelsEnum } from '../types';

function useBulkFailure(cb?: () => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');

  const onBulkFailure = async (tasks: string[]) => {
    setError('');
    setRequestOnGoing(true);
    try {
      await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_BULK_TASK_FAILURE,
        tasks,
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
    onBulkFailure,
  };
}

export default useBulkFailure;
