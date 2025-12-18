import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeConfig } from '@/types/theme';
import { getTheme, getDefaultTheme } from '@/themes/registry';
import { api } from '@/lib/api';

interface ThemeContextType {
  currentTheme: ThemeConfig;
  setTheme: (themeId: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(getDefaultTheme());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load active theme from site settings
    const loadTheme = async () => {
      try {
        const settings = await api.getPublicSiteSettings();
        const themeId = settings.active_theme || 'default';
        const theme = getTheme(themeId);
        
        if (theme) {
          setCurrentTheme(theme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Use default theme on error
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const setTheme = (themeId: string) => {
    const theme = getTheme(themeId);
    if (theme) {
      setCurrentTheme(theme);
      // Save to localStorage for immediate feedback
      localStorage.setItem('active_theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
