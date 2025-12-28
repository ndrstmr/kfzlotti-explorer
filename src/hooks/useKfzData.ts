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

// Raw district structure from index.json
interface RawDistrict {
  name: string;
  codes: string[];
  state: string;
  center: [number, number];
  ars?: string;
}

interface RawIndexData {
  version: string;
  source: string;
  license: string;
  districts: RawDistrict[];
}

/**
 * Transform the raw districts array into the KfzIndex format
 * that the search functions expect
 */
function transformToKfzIndex(raw: RawIndexData): KfzIndex {
  const codeToIds: Record<string, string[]> = {};
  const features: Record<string, {
    name: string;
    ars: string;
    kfzCodes: string[];
    center: [number, number];
  }> = {};

  raw.districts.forEach((district, index) => {
    const id = `district_${index}`;
    
    // Create feature entry
    features[id] = {
      name: district.name,
      ars: district.ars || district.state, // Use state code as fallback for ARS
      kfzCodes: district.codes,
      center: district.center,
    };

    // Map each code to this feature ID
    district.codes.forEach(code => {
      const normalized = code.toUpperCase();
      if (!codeToIds[normalized]) {
        codeToIds[normalized] = [];
      }
      codeToIds[normalized].push(id);
    });
  });

  return {
    version: 1,
    generated: raw.version,
    source: raw.source,
    codeToIds,
    features,
  };
}

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

      // Validate cached index has the expected structure
      // If it's the old format, clear it
      if (index && (!index.codeToIds || !index.features)) {
        console.log('Clearing old format cache');
        index = null;
        await setCachedData(CACHE_KEYS.INDEX, null);
      }

      // If not in cache or online, try to fetch fresh data
      if (!index || navigator.onLine) {
        try {
          const indexResponse = await fetch('/data/index.json');
          if (indexResponse.ok) {
            const rawData: RawIndexData = await indexResponse.json();
            // Transform the raw districts into the expected index format
            index = transformToKfzIndex(rawData);
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
