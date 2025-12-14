/**
 * Data loading hook
 * Handles fetching and caching of KFZ data
 */

import { useState, useEffect, useCallback } from 'react';
import type { KfzIndex, KfzTopoJSON, KreissitzData } from '@/data/schema';
import { getCachedData, setCachedData, CACHE_KEYS } from '@/lib/storage';

// Embedded fallback data for offline-first experience
// This is a minimal subset - the full data is loaded from public/data
import { FALLBACK_INDEX } from '@/data/fallback-index';

interface DataState {
  index: KfzIndex | null;
  topoJson: KfzTopoJSON | null;
  seats: KreissitzData | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
}

export function useKfzData() {
  const [state, setState] = useState<DataState>({
    index: null,
    topoJson: null,
    seats: null,
    isLoading: true,
    error: null,
    isOffline: !navigator.onLine,
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Try to load from cache first
      let index = await getCachedData<KfzIndex>(CACHE_KEYS.INDEX);
      let topoJson = await getCachedData<KfzTopoJSON>(CACHE_KEYS.TOPO);
      let seats = await getCachedData<KreissitzData>(CACHE_KEYS.SEATS);

      // If not in cache or online, try to fetch fresh data
      if (!index || navigator.onLine) {
        try {
          const indexResponse = await fetch('/data/index.json');
          if (indexResponse.ok) {
            index = await indexResponse.json();
            await setCachedData(CACHE_KEYS.INDEX, index);
          }
        } catch (e) {
          console.log('Could not fetch index.json, using cache/fallback');
        }
      }

      if (!topoJson || navigator.onLine) {
        try {
          const topoResponse = await fetch('/data/kfz250.topo.json');
          if (topoResponse.ok) {
            topoJson = await topoResponse.json();
            await setCachedData(CACHE_KEYS.TOPO, topoJson);
          }
        } catch (e) {
          console.log('Could not fetch topo.json, using cache/fallback');
        }
      }

      // Seats are optional
      if (!seats || navigator.onLine) {
        try {
          const seatsResponse = await fetch('/data/seats.json');
          if (seatsResponse.ok) {
            seats = await seatsResponse.json();
            await setCachedData(CACHE_KEYS.SEATS, seats);
          }
        } catch (e) {
          console.log('Seats data not available (optional)');
        }
      }

      // Use fallback if still no index
      if (!index) {
        console.log('Using fallback index data');
        index = FALLBACK_INDEX;
      }

      setState({
        index,
        topoJson,
        seats,
        isLoading: false,
        error: null,
        isOffline: !navigator.onLine,
      });
    } catch (error) {
      console.error('Error loading KFZ data:', error);
      
      // Try fallback
      setState({
        index: FALLBACK_INDEX,
        topoJson: null,
        seats: null,
        isLoading: false,
        error: 'Daten konnten nicht vollständig geladen werden. Einige Funktionen sind eingeschränkt.',
        isOffline: !navigator.onLine,
      });
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen for online/offline events
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      loadData(); // Refresh data when coming online
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  return {
    ...state,
    refresh: loadData,
  };
}
