import { useState, useCallback } from 'react';
import { ChannelsEnum, Tag } from '../types';
import { useApp } from '../context/AppProvider';

function useTags() {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const { setNotifier } = useApp();

  const handleLoadingTags = useCallback(async () => {
    setRequestOnGoing(true);
    try {
      const tags = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_ALL_TAGS,
      );
      setAllTags(tags);
    } catch (err: any) {
      setNotifier(err.message, 'error');
    } finally {
      setRequestOnGoing(false);
    }
  }, [setNotifier]);

  const createTag = async (tagName: string) => {
    setRequestOnGoing(true);
    try {
      const createdTag: Tag = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_CREATE_TAG,
        tagName,
      );
      return createdTag;
    } catch (err: any) {
      setNotifier(err.message, 'error');
      return null;
    } finally {
      setRequestOnGoing(false);
    }
  };

  return {
    allTags,
    requestOnGoing,
    handleLoadingTags,
    createTag,
  };
}

export default useTags;
