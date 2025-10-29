import { useState } from 'react';
import { ChannelsEnum, Space } from '../types';

function useSpace() {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');

  const createSpace = async (spaceName: string) => {
    setError('');
    setRequestOnGoing(true);
    try {
      const createdSpace: Space = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_CREATE_SPACE,
        spaceName,
      );
      return createdSpace;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setRequestOnGoing(false);
    }
  };

  return {
    requestOnGoing,
    error,
    createSpace,
  };
}

export default useSpace;
