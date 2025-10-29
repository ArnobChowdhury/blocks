import { useState } from 'react';
import { Dayjs } from 'dayjs';
import { ChannelsEnum } from '../types';

function useTaskReschedule(cb?: () => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');

  const onTaskReschedule = async (taskId: string, rescheduledTime: Dayjs) => {
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
    onTaskReschedule,
  };
}

export default useTaskReschedule;
