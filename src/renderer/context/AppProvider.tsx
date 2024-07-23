import React, { useState, PropsWithChildren, useContext } from 'react';

const AppContextFn = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
  }>();

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
