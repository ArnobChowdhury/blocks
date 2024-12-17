import { useState, useCallback } from 'react';
import { ChannelsEnum, Space } from '../types';

function useSpace() {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);

  const handleLoadingSpaces = useCallback(async () => {
    setError('');
    setRequestOnGoing(true);
    try {
      const spaces = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_ALL_SPACES,
      );
      setAllSpaces(spaces);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRequestOnGoing(false);
    }
  }, []);

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
    allSpaces,
    requestOnGoing,
    error,
    handleLoadingSpaces,
    createSpace,
  };
}

export default useSpace;
