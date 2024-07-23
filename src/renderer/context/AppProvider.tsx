import React, {
  useState,
  useEffect,
  PropsWithChildren,
  useContext,
} from 'react';

import { handleTaskRefresh as refreshTasks } from '../utils';

// eslint-disable-next-line import/no-relative-packages
import { Task } from '../../generated/client';
import {
  // TaskScheduleTypeEnum,
  ChannelsEnum,
  IEventResponse,
  IPCEventsResponseEnum,
} from '../types';

const AppContextFn = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
  }>();
  const [tasksToday, setTasksToday] = useState<Task[]>([]);
  const [tasksOverdue, setTasksOverdue] = useState<Task[]>([]);

  useEffect(() => {
    refreshTasks();
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_TODAY,
      (response) => {
        // todo need error handling
        setTasksToday(response as Task[]);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_OVERDUE,
      (response) => {
        // todo need error handling
        setTasksOverdue(response as Task[]);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_CREATE_TASK,
      (response) => {
        if (
          (response as IEventResponse).message ===
          IPCEventsResponseEnum.SUCCESSFUL
        ) {
          refreshTasks();
        }
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TOGGLE_TASK_COMPLETION_STATUS,
      (response) => {
        if (
          (response as IEventResponse).message ===
          IPCEventsResponseEnum.SUCCESSFUL
        ) {
          refreshTasks();
        }
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASK_RESCHEDULE,
      (response) => {
        if (
          (response as IEventResponse).message ===
          IPCEventsResponseEnum.SUCCESSFUL
        ) {
          refreshTasks();
        }
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASK_FAILURE,
      (response) => {
        if (
          (response as IEventResponse).message ===
          IPCEventsResponseEnum.SUCCESSFUL
        ) {
          refreshTasks();
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
    tasksToday,
    tasksOverdue,
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
