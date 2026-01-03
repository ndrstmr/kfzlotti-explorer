/**
 * Data loading facade hook
 *
 * Provides backward-compatible interface for loading KFZ data.
 * Now uses TanStack Query hooks internally (useKfzIndex, useTopoJson)
 * instead of manual state management.
 *
 * This facade maintains the same interface for existing components
 * while benefiting from TanStack Query features under the hood.
 */

import { useState, useEffect, useRef } from 'react';
import type { KfzIndex, KfzTopoJSON } from '@/data/schema';
import { useKfzIndex } from './useKfzIndex';
import { useTopoJson } from './useTopoJson';
import { toast } from '@/hooks/use-toast';
import { isValidTopoJson } from '@/lib/data-validators';

interface DataState {
  index: KfzIndex | null;
  topoJson: KfzTopoJSON | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  mapAvailable: boolean; // Indicates if valid geodata is available
}

/**
 * Main data loading hook for KFZ application
 *
 * Combines index and TopoJSON data into a single state object
 * for backward compatibility with existing components.
 *
 * Features:
 * - Automatic caching via TanStack Query
 * - Offline-first data loading
 * - Online/offline status tracking
 * - Toast notifications for offline status
 *
 * @returns DataState with index, topoJson, loading, error states and refresh function
 *
 * @example
 * const { index, topoJson, isLoading, error, refresh } = useKfzData();
 */
export function useKfzData() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const hasShownOfflineToast = useRef(false);

  // Use new TanStack Query hooks
  const {
    data: index,
    isLoading: indexLoading,
    error: indexError,
    refetch: refetchIndex,
  } = useKfzIndex();

  const {
    data: topoJson,
    isLoading: topoLoading,
    error: topoError,
    refetch: refetchTopo,
  } = useTopoJson();

  // Combined loading state
  const isLoading = indexLoading || topoLoading;

  // Combined error state
  const error = indexError
    ? indexError instanceof Error
      ? indexError.message
      : 'Fehler beim Laden der Daten'
    : topoError
      ? 'Karte konnte nicht geladen werden'
      : null;

  // Map availability check
  const mapAvailable = isValidTopoJson(topoJson);

  // Refresh function (refetch both queries)
  const refresh = () => {
    refetchIndex();
    refetchTopo();
  };

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Automatically refetch when coming back online
      refresh();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show toast if app starts offline (only once)
  useEffect(() => {
    if (!navigator.onLine && !hasShownOfflineToast.current) {
      hasShownOfflineToast.current = true;
      toast({
        title: 'Offline-Modus',
        description: 'App läuft mit gecachten Daten. Einige Funktionen können eingeschränkt sein.',
        variant: 'default',
      });
    }
  }, []);

  return {
    index,
    topoJson,
    isLoading,
    error,
    isOffline,
    mapAvailable,
    refresh,
  };
}
