import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SiteSettings {
  site_title: string;
  site_tagline: string;
  favicon_url: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  refetch: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};

interface SiteSettingsProviderProps {
  children: React.ReactNode;
}

export const SiteSettingsProvider: React.FC<SiteSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: 'Blog', // Default fallback
    site_tagline: '',
    favicon_url: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.getPublicSiteSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  // Update document title and favicon when settings change
  useEffect(() => {
    document.title = settings.site_title;
  }, [settings.site_title]);

  useEffect(() => {
    if (settings.favicon_url) {
      // Update favicon
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }
  }, [settings.favicon_url]);

  const value: SiteSettingsContextType = {
    settings,
    isLoading,
    refetch,
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};