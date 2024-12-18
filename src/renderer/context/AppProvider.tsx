import React, {
  useState,
  useEffect,
  PropsWithChildren,
  useContext,
  useCallback,
} from 'react';

import {
  handlePageTaskRefresh,
  getMillisecondsUntilNextMidnight,
} from '../utils';
import {
  ChannelsEnum,
  TaskWithTagsAndSpace,
  RepetitiveTaskWithTagsAndSpace,
} from '../types';

const AppContextFn = () => {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
  }>();
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskIdForEdit, setTaskIdForEdit] = useState<number>();
  const [taskForEdit, setTaskForEdit] = useState<TaskWithTagsAndSpace>();

  const [repetitiveTaskTemplateIdForEdit, setRepetitiveTaskTemplateIdForEdit] =
    useState<number>();
  const [repetitiveTaskTemplateForEdit, setRepetitiveTaskTemplateForEdit] =
    useState<RepetitiveTaskWithTagsAndSpace>();
  /**
   * Add event listeners... for page refresh events' errors and set notifiers
   */

  const setNotifier = useCallback(
    (message: string, type: 'error' | 'success' | 'info' | 'warning') => {
      setShowSnackbar(true);
      setNotification({ message, type });
    },
    [],
  );

  useEffect(() => {
    if (taskIdForEdit && !taskForEdit) {
      // fetch the task if taskIdForEdit is undefined
      window.electron.ipcRenderer
        .invoke(ChannelsEnum.REQUEST_TASK_DETAILS, taskIdForEdit)
        .then((res) => {
          return setTaskForEdit(res);
        })
        .catch((err: any) => {
          setNotifier(err.message, 'error');
        });
    }
  }, [taskForEdit, taskIdForEdit, setNotifier]);

  useEffect(() => {
    if (repetitiveTaskTemplateIdForEdit && !repetitiveTaskTemplateForEdit) {
      // fetch the task if taskIdForEdit is undefined
      window.electron.ipcRenderer
        .invoke(
          ChannelsEnum.REQUEST_REPETITIVE_TASK_DETAILS,
          repetitiveTaskTemplateIdForEdit,
        )
        .then((res) => {
          return setRepetitiveTaskTemplateForEdit(res);
        })
        .catch((err: any) => {
          setNotifier(err.message, 'error');
        });
    }
  }, [
    repetitiveTaskTemplateForEdit,
    repetitiveTaskTemplateIdForEdit,
    setNotifier,
  ]);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_CREATE_OR_UPDATE_TASK,
      () => {
        handlePageTaskRefresh();
      },
    );
    return unsubscribe;
  }, []);

  const clearNotifier = useCallback(() => {
    setShowSnackbar(false);
    setNotification(undefined);
  }, []);

  const [shouldRefresh, setShouldRefresh] = useState(false);
  const scheduleMidnightReload = useCallback(() => {
    const timeUntilMidnight = getMillisecondsUntilNextMidnight();

    setTimeout(() => {
      setShouldRefresh(true);
      scheduleMidnightReload();
    }, timeUntilMidnight);
  }, []);

  useEffect(() => {
    scheduleMidnightReload();
  }, [scheduleMidnightReload]);

  const handlePageRefresh = () => {
    handlePageTaskRefresh();
    setShouldRefresh(false);
  };

  return {
    showSnackbar,
    notification,
    setNotifier,
    clearNotifier,
    showAddTask,
    setShowAddTask,
    taskForEdit,
    setTaskIdForEdit,
    setTaskForEdit,
    repetitiveTaskTemplateForEdit,
    setRepetitiveTaskTemplateIdForEdit,
    setRepetitiveTaskTemplateForEdit,
    shouldRefresh,
    handlePageRefresh,
  };
};

interface AppContextProviderProps {
  children: React.ReactNode;
}

type AppContextProps = ReturnType<typeof AppContextFn>;

export const AppContext = React.createContext<AppContextProps | null>(null);

function AppProvider({ children }: PropsWithChildren<AppContextProviderProps>) {
  return (
    <AppContext.Provider value={AppContextFn()}>{children}</AppContext.Provider>
  );
}

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export { AppProvider, useApp };
