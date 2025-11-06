import { useState } from 'react';
import { ChannelsEnum, Space } from '../types';
import { useApp } from '../context/AppProvider';

function useSpace() {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const { setNotifier } = useApp();

  const createSpace = async (spaceName: string) => {
    setRequestOnGoing(true);
    try {
      const createdSpace: Space = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_CREATE_SPACE,
        spaceName,
      );
      return createdSpace;
    } catch (err: any) {
      setNotifier(err.message, 'error');
      return null;
    } finally {
      setRequestOnGoing(false);
    }
  };

  return {
    requestOnGoing,
    createSpace,
  };
}

export default useSpace;
