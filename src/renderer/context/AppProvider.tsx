import React, {
  useState,
  useEffect,
  PropsWithChildren,
  useContext,
  useCallback,
  useRef,
} from 'react';
import dayjs from 'dayjs';

import { handlePageTaskRefresh } from '../utils';
import {
  ChannelsEnum,
  TaskWithTagsAndSpace,
  RepetitiveTaskWithTagsAndSpace,
  Space,
} from '../types';

interface User {
  id: string;
  email: string;
}

const AppContextFn = (initialUser: User | null) => {
  const [todayPageDisplayDate, setTodayPageDisplayDate] = useState(() =>
    dayjs().startOf('day'),
  );
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
  }>();
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskToday, setAddTaskToday] = useState(false);
  const [taskIdForEdit, setTaskIdForEdit] = useState<string>();
  const [taskForEdit, setTaskForEdit] = useState<TaskWithTagsAndSpace>();

  const [repetitiveTaskTemplateIdForEdit, setRepetitiveTaskTemplateIdForEdit] =
    useState<string>();
  const [repetitiveTaskTemplateForEdit, setRepetitiveTaskTemplateForEdit] =
    useState<RepetitiveTaskWithTagsAndSpace>();

  const [user, setUser] = useState<User | null>(initialUser);
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

  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const handleLoadingSpaces = useCallback(async () => {
    setLoadingSpaces(true);
    try {
      const spaces = await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_ALL_SPACES,
      );
      setAllSpaces(spaces);
    } catch (err: any) {
      setNotifier(err.message, 'error');
    }
  }, [setNotifier]);

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
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TOKEN_REFRESHING_FAILED,
      () => {
        setNotifier(
          'Failed to refresh your session. Sync is paused. Please sign out and sign in again to resume.',
          'error',
        );
      },
    );
    return unsubscribe;
  }, [setNotifier]);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_CREATE_OR_UPDATE_TASK,
      () => {
        handlePageTaskRefresh(todayPageDisplayDate.toDate());
      },
    );
    return unsubscribe;
  }, [todayPageDisplayDate]);

  const clearNotifier = useCallback(() => {
    setShowSnackbar(false);
    setNotification(undefined);
  }, []);

  const handlePageRefresh = useCallback(() => {
    handlePageTaskRefresh(todayPageDisplayDate.toDate());
  }, [todayPageDisplayDate]);

  const isSyncingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const runSync = useCallback(async () => {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      await window.electron.ipcRenderer.invoke(ChannelsEnum.REQUEST_SYNC_START);
    } catch (err: any) {
      setNotifier(err.message || 'Sync failed', 'error');
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [setNotifier]);

  const wasSyncing = useRef(!isSyncing);
  useEffect(() => {
    window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_SYNC_STATUS_CHANGE,
      (_isSyncing: unknown) => {
        setIsSyncing(_isSyncing as boolean);
      },
    );
  });

  useEffect(() => {
    if (user && !isSyncing && wasSyncing.current) {
      handlePageTaskRefresh(todayPageDisplayDate.toDate());
    }
    wasSyncing.current = isSyncing;
  }, [user, isSyncing, todayPageDisplayDate, wasSyncing]);

  useEffect(() => {
    if (user) {
      runSync();
    }
  }, [user, runSync]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOffline = useRef(!isOnline);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user && isOnline && wasOffline.current) {
      runSync();
    }
    wasOffline.current = !isOnline;
  }, [user, isOnline, wasOffline, runSync]);

  return {
    addTaskToday,
    setAddTaskToday,
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
    handlePageRefresh,
    user,
    setUser,
    allSpaces,
    handleLoadingSpaces,
    loadingSpaces,
    todayPageDisplayDate,
    setTodayPageDisplayDate,
    isSyncing,
  };
};

interface AppContextProviderProps {
  children: React.ReactNode;
  user: User;
}

type AppContextProps = ReturnType<typeof AppContextFn>;

export const AppContext = React.createContext<AppContextProps | null>(null);

function AppProvider({
  children,
  user,
}: PropsWithChildren<AppContextProviderProps>) {
  return (
    <AppContext.Provider value={AppContextFn(user)}>
      {children}
    </AppContext.Provider>
  );
}

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export { AppProvider, useApp };
