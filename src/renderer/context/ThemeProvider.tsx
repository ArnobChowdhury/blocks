import React, {
  createContext,
  useState,
  useMemo,
  useContext,
  useEffect,
  PropsWithChildren,
} from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

const lightTheme = createTheme({
  typography: {
    fontFamily: 'Hanken Grotesk, sans-serif',
    allVariants: {
      color: '#333333',
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#007A9F',
    },
    secondary: {
      main: '#11C498',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  ...lightTheme,
  typography: {
    fontFamily: 'Hanken Grotesk, sans-serif',
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#007A9F',
    },
    secondary: {
      main: '#11C498',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
});

export function CustomThemeProvider({ children }: PropsWithChildren<{}>) {
  const storedTheme = localStorage.getItem('themeMode');
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'light',
  );

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const activeTheme = useMemo(() => {
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode]);

  const contextValue = useMemo(
    () => ({ themeMode, setThemeMode }),
    [themeMode],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={activeTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
