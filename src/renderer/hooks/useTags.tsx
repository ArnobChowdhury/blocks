import { useState, useCallback } from 'react';
import { ChannelsEnum, Tag } from '../types';

function useTags() {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const [error, setError] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const handleLoadingTags = useCallback(async () => {
    setError('');
    setRequestOnGoing(true);
    try {
      const tags = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_ALL_TAGS,
      );
      setAllTags(tags);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRequestOnGoing(false);
    }
  }, []);

  const createTag = async (tagName: string) => {
    setError('');
    setRequestOnGoing(true);
    try {
      const createdTag: Tag = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_CREATE_TAG,
        tagName,
      );
      return createdTag;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setRequestOnGoing(false);
    }
  };

  return {
    allTags,
    requestOnGoing,
    error,
    handleLoadingTags,
    createTag,
  };
}

export default useTags;
