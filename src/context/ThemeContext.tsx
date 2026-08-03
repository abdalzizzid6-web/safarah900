import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';

interface UserTheme {
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
}

interface ThemeContextType {
  theme: UserTheme;
  updateTheme: (newTheme: Partial<UserTheme>) => void;
  resetTheme: () => void;
}

const defaultTheme: UserTheme = {
  mode: 'dark',
  primaryColor: '#00DF82', // Modern Electric Mint Green
  secondaryColor: '#EAB308', // Sleek Amber Gold
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[BOOT] Stage 4 OK: ThemeProvider mounted');
  }, []);

  const [theme, setTheme] = useState<UserTheme>(() => {
    try {
      const saved = localStorage.getItem('goaltime_theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && typeof parsed.mode === 'string') {
          return {
            ...defaultTheme,
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.warn('[ThemeContext] Corrupted saved theme in localStorage. Safely resetting to default.', e);
      try {
        localStorage.removeItem('goaltime_theme');
      } catch (rmErr) {
        // ignore storage removal errors
      }
    }
    return defaultTheme;
  });

  const updateTheme = (newTheme: Partial<UserTheme>) => {
    setTheme(prev => {
      const merged = { ...prev, ...newTheme };
      localStorage.setItem('goaltime_theme', JSON.stringify(merged));
      return merged;
    });
  };
  
  const resetTheme = () => {
    localStorage.removeItem('goaltime_theme');
    setTheme(defaultTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme.mode === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-secondary', theme.secondaryColor);
    
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
