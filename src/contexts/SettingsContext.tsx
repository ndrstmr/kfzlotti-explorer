import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getUserSettings, updateUserSettings as updateUserSettingsDb } from '@/lib/storage';
import type { UserSettings } from '@/data/schema';

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateDarkMode: (mode: 'system' | 'light' | 'dark') => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateOfflineMode: (enabled: boolean) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const userSettings = await getUserSettings();
        setSettings(userSettings);

        // Apply dark mode on initial load
        if (userSettings) {
          applyDarkMode(userSettings.darkMode);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Helper to apply dark mode to DOM
  const applyDarkMode = (mode: 'system' | 'light' | 'dark') => {
    const root = document.documentElement;

    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Update dark mode
  const updateDarkMode = useCallback(async (mode: 'system' | 'light' | 'dark') => {
    try {
      await updateUserSettingsDb({ darkMode: mode });
      setSettings(prev => prev ? { ...prev, darkMode: mode } : null);
      applyDarkMode(mode);
    } catch (error) {
      console.error('Failed to update dark mode:', error);
      throw error;
    }
  }, []);

  // Update display name
  const updateDisplayName = useCallback(async (name: string) => {
    try {
      await updateUserSettingsDb({ displayName: name });
      setSettings(prev => prev ? { ...prev, displayName: name } : null);
    } catch (error) {
      console.error('Failed to update display name:', error);
      throw error;
    }
  }, []);

  // Update offline mode
  const updateOfflineMode = useCallback(async (enabled: boolean) => {
    try {
      await updateUserSettingsDb({ offlineMode: enabled });
      setSettings(prev => prev ? { ...prev, offlineMode: enabled } : null);
    } catch (error) {
      console.error('Failed to update offline mode:', error);
      throw error;
    }
  }, []);

  // Refresh settings from database
  const refreshSettings = useCallback(async () => {
    try {
      const userSettings = await getUserSettings();
      setSettings(userSettings);
      if (userSettings) {
        applyDarkMode(userSettings.darkMode);
      }
    } catch (error) {
      console.error('Failed to refresh settings:', error);
    }
  }, []);

  const value: SettingsContextType = {
    settings,
    isLoading,
    updateDarkMode,
    updateDisplayName,
    updateOfflineMode,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
