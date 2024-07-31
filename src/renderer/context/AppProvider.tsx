import React, {
  useState,
  useEffect,
  PropsWithChildren,
  useContext,
  useCallback,
} from 'react';

import { handlePageTaskRefresh } from '../utils';
import { ChannelsEnum } from '../types';

// eslint-disable-next-line import/no-relative-packages
import { Task } from '../../generated/client';

const AppContextFn = () => {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
  }>();
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskIdForEdit, setTaskIdForEdit] = useState<number>();
  const [taskForEdit, setTaskForEdit] = useState<Task>();

  useEffect(() => {
    if (taskIdForEdit && !taskForEdit) {
      // fetch the task if taskIdForEdit is undefined
    }
  }, [taskForEdit, taskIdForEdit]);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_CREATE_TASK,
      () => {
        handlePageTaskRefresh();
      },
    );
    return unsubscribe;
  }, []);

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

  const clearNotifier = useCallback(() => {
    setShowSnackbar(false);
    setNotification(undefined);
  }, []);

  return {
    showSnackbar,
    notification,
    setNotifier,
    clearNotifier,
    showAddTask,
    setShowAddTask,
    taskForEdit,
    setTaskIdForEdit,
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
