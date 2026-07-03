import { useCallback, useEffect } from 'react';
import { appStore } from '../store/appStore';

const STORAGE_KEY = 'theme';

const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
};

export const useTheme = () => {
  const theme = appStore((state) => state.theme);
  const setTheme = appStore((state) => state.setTheme);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, [setTheme]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, toggleTheme };
};
