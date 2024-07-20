import { useState } from 'react';
import { ChannelsEnum } from '../types';

export const useBulkFailure = (cb?: () => void) => {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');

  const onBulkFailure = async (tasks: number[]): Promise<any> => {
    setError('');
    setRequestOnGoing(true);
    try {
      const res = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_BULK_TASK_FAILURE,
        tasks,
      );
      if (cb) cb();
      return res;
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
};
