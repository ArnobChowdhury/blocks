import React, {
  useState,
  useEffect,
  PropsWithChildren,
  useContext,
} from 'react';

import { refreshTodayPageTasks, refreshAllTasks } from '../utils';
import { ChannelsEnum } from '../types';

const AppContextFn = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
  }>();

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_CREATE_TASK,
      () => {
        if (window.location.pathname === '/inbox') {
          refreshAllTasks();
        } else {
          refreshTodayPageTasks();
        }
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TOGGLE_TASK_COMPLETION_STATUS,
      () => {
        if (window.location.pathname === '/inbox') {
          refreshAllTasks();
        } else {
          refreshTodayPageTasks();
        }
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASK_RESCHEDULE,
      () => {
        if (window.location.pathname === '/inbox') {
          refreshAllTasks();
        } else {
          refreshTodayPageTasks();
        }
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASK_FAILURE,
      () => {
        if (window.location.pathname === '/inbox') {
          refreshAllTasks();
        } else {
          refreshTodayPageTasks();
        }
      },
    );

    return unsubscribe;
  }, []);

  return {
    showNotification,
    setShowNotification,
    notification,
    setNotification,
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
