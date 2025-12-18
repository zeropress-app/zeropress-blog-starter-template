import { ThemeConfig } from '@/types/theme';
import { defaultTheme } from './default/theme.config';

// Theme registry - add new themes here
export const themeRegistry: Record<string, ThemeConfig> = {
  default: defaultTheme,
};

// Get all available themes
export const getAvailableThemes = () => {
  return Object.values(themeRegistry).map(theme => ({
    id: theme.id,
    name: theme.name,
    version: theme.version,
    author: theme.author,
    description: theme.description,
    screenshot: theme.screenshot,
  }));
};

// Get theme by ID
export const getTheme = (themeId: string): ThemeConfig | null => {
  return themeRegistry[themeId] || null;
};

// Get default theme
export const getDefaultTheme = (): ThemeConfig => {
  return defaultTheme;
};
