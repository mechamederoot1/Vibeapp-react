import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('vibe-theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    const applyTheme = (currentTheme) => {
      const root = document.documentElement;
      
      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else if (currentTheme === 'light') {
        root.classList.remove('dark');
      } else {
        // Auto theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(theme);
    localStorage.setItem('vibe-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes when auto is selected
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const root = document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };

      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  const setSpecificTheme = (newTheme) => {
    if (['light', 'dark', 'auto'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  return {
    theme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  };
};
