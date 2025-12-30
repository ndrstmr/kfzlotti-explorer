/**
 * Update Context - Manages PWA update state
 * Provides update notifications and manual update checking
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getUserSettings } from '@/lib/storage';

interface UpdateContextType {
  updateAvailable: boolean;
  checking: boolean;
  dataVersion: string | null;
  newVersion: string | null;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => void;
  dismissUpdate: () => void;
}

const UpdateContext = createContext<UpdateContextType | null>(null);

interface UpdateProviderProps {
  children: ReactNode;
  updateSW?: (reloadPage?: boolean) => Promise<void>;
}

export function UpdateProvider({ children, updateSW }: UpdateProviderProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dataVersion, setDataVersion] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState<string | null>(null);

  // Load current data version on mount
  useEffect(() => {
    const loadVersion = async () => {
      try {
        // Check if offline mode is enabled
        const settings = await getUserSettings();
        if (settings?.offlineMode) {
          console.log('Offline mode enabled - skipping version check');
          return;
        }

        // Try transformed version first (production), fallback to raw (dev)
        let response = await fetch('/data/index.transformed.json');
        if (!response.ok) {
          response = await fetch('/data/index.json');
        }

        if (response.ok) {
          const data = await response.json();
          setDataVersion(data.dataVersion || data.version || data.generated);
        }
      } catch (error) {
        console.error('Failed to load data version:', error);
      }
    };

    loadVersion();
  }, []);

  // Listen for custom update event from service worker
  useEffect(() => {
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    // Check if offline mode is enabled
    const settings = await getUserSettings();
    if (settings?.offlineMode) {
      console.log('Offline mode enabled - updates disabled');
      return;
    }

    if (!navigator.onLine) {
      console.log('Offline - cannot check for updates');
      return;
    }

    setChecking(true);
    try {
      // Force service worker to check for updates
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      }

      // Check data version - try transformed first, fallback to raw
      let response = await fetch('/data/index.transformed.json', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        response = await fetch('/data/index.json', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        const remoteVersion = data.dataVersion || data.version || data.generated;

        if (remoteVersion !== dataVersion) {
          setNewVersion(remoteVersion);
          setUpdateAvailable(true);
        } else {
          console.log('App is up to date');
        }
      }
    } catch (error) {
      console.error('Update check failed:', error);
    } finally {
      setChecking(false);
    }
  }, [dataVersion]);

  const installUpdate = useCallback(() => {
    if (updateSW) {
      updateSW(true); // Reload page after update
    } else {
      window.location.reload();
    }
  }, [updateSW]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return (
    <UpdateContext.Provider
      value={{
        updateAvailable,
        checking,
        dataVersion,
        newVersion,
        checkForUpdates,
        installUpdate,
        dismissUpdate,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within UpdateProvider');
  }
  return context;
}
