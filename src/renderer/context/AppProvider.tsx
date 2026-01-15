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

  const [shouldCheckAnonDataExistence, setShouldCheckAnonDataExistence] =
    useState(false);
  const [showAnonDataMigrationModal, setShowAnonDataMigrationModal] =
    useState(false);

  useEffect(() => {
    if (shouldCheckAnonDataExistence) {
      setShouldCheckAnonDataExistence(false);
      window.electron.ipcRenderer
        .invoke(ChannelsEnum.REQUEST_CHECK_ANONYMOUS_DATA_EXISTS)
        .then((hasAnonData) => {
          return setTimeout(() => {
            setShowAnonDataMigrationModal(hasAnonData);
          }, 1000);
        })
        .catch((err: any) => {
          setNotifier(err.message, 'error');
        });
    }
  }, [setNotifier, shouldCheckAnonDataExistence]);

  const clearNotifier = useCallback(() => {
    setShowSnackbar(false);
  }, []);

  const handlePageRefresh = useCallback(() => {
    handlePageTaskRefresh(todayPageDisplayDate.toDate());
  }, [todayPageDisplayDate]);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TWO_MINUTES = 2 * 60 * 1000;

  const [isSyncing, setIsSyncing] = useState(false);
  const [firstSyncDone, setFirstSyncDone] = useState(!user);

  useEffect(() => {
    setFirstSyncDone(!user);
  }, [user]);

  const runSyncNow = useCallback(async () => {
    if (isSyncing || !user) {
      console.log(
        '[AppProvider] Skipping sync request (already syncing or logged out).',
      );
      return;
    }
    console.log('[AppProvider] Conditions met. Requesting sync start.');
    try {
      await window.electron.ipcRenderer.invoke(ChannelsEnum.REQUEST_SYNC_START);
    } catch (err: any) {
      setNotifier(err.message || 'Sync failed', 'error');
    }
  }, [user, isSyncing, setNotifier]);

  const resetSyncTimer = useCallback(
    (duration = TWO_MINUTES) => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      console.log(
        `[AppProvider] Scheduling next sync in ${duration / 1000} seconds.`,
      );
      syncTimerRef.current = setTimeout(runSyncNow, duration);
    },
    [runSyncNow, TWO_MINUTES],
  );

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_SYNC_START,
      () => {
        setIsSyncing(true);
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_SYNC_END,
      () => {
        setIsSyncing(false);
        setFirstSyncDone(true);
        handlePageTaskRefresh(todayPageDisplayDate.toDate());
        resetSyncTimer();
      },
    );
    return unsubscribe;
  }, [todayPageDisplayDate, resetSyncTimer]);

  useEffect(() => {
    if (user) {
      const handleFocus = async () => {
        const lastSync = await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_LAST_SYNC,
        );
        const now = Date.now();

        if (!firstSyncDone || now - lastSync > TWO_MINUTES) {
          console.log('[AppProvider] Syncing immediately.');
          runSyncNow();
        } else {
          const timeUntilNextSync = TWO_MINUTES - (now - lastSync);
          console.log(
            `[AppProvider - handleFocus] Scheduling next sync in ${Math.round(
              timeUntilNextSync / 1000,
            )} seconds.`,
          );
          resetSyncTimer(timeUntilNextSync);
        }
      };

      const handleBlur = () => {
        console.log('[AppProvider] Window blurred. Clearing sync interval.');
        if (syncTimerRef.current) {
          clearTimeout(syncTimerRef.current);
          syncTimerRef.current = null;
        }
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);

      handleFocus(); // Initial check

      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
        if (syncTimerRef.current) {
          clearTimeout(syncTimerRef.current);
        }
      };
    }
    return undefined;
  }, [runSyncNow, TWO_MINUTES, resetSyncTimer, firstSyncDone, user]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOffline = useRef(!isOnline);

  useEffect(() => {
    if (user) {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return undefined;
  }, [user]);

  useEffect(() => {
    if (user && isOnline && wasOffline.current) {
      runSyncNow();
    }
    wasOffline.current = !isOnline;
  }, [user, isOnline, wasOffline, runSyncNow]);

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
    firstSyncDone,
    showAnonDataMigrationModal,
    setShouldCheckAnonDataExistence,
    setShowAnonDataMigrationModal,
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
