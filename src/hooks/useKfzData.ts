/**
 * Data loading hook
 * Handles fetching and caching of KFZ data
 */

import { useState, useEffect, useCallback } from 'react';
import type { KfzIndex, KfzTopoJSON, KreissitzData, CodeDetailsData } from '@/data/schema';
import { getCachedData, setCachedData, getCacheMetadata, migrateDataSchema, getUserSettings, CACHE_KEYS } from '@/lib/storage';

// Embedded fallback data for offline-first experience
// This contains ALL districts (generated at build time)
import { GENERATED_FALLBACK } from '@/data/generated-fallback';

interface DataState {
  index: KfzIndex | null;
  topoJson: KfzTopoJSON | null;
  seats: KreissitzData | null;
  codeDetails: CodeDetailsData | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  mapAvailable: boolean; // Indicates if valid geodata is available
}

/**
 * Validates if TopoJSON contains actual geometry data
 */
function isValidTopoJson(data: unknown): boolean {
  return Boolean(
    data?.objects?.kreise?.geometries &&
    Array.isArray(data.objects.kreise.geometries) &&
    data.objects.kreise.geometries.length > 0
  );
}

/**
 * Validates if seats data contains actual seat information
 */
function isValidSeatsData(data: unknown): boolean {
  return Boolean(
    data?.seats &&
    typeof data.seats === 'object' &&
    Object.keys(data.seats).length > 0
  );
}

export function useKfzData() {
  const [state, setState] = useState<DataState>({
    index: null,
    topoJson: null,
    seats: null,
    codeDetails: null,
    isLoading: true,
    error: null,
    isOffline: !navigator.onLine,
    mapAvailable: false,
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if user has enabled offline-only mode
      const settings = await getUserSettings();
      const isOfflineModeEnabled = settings?.offlineMode || false;

      // Run schema migration check first
      // This detects and clears old/incompatible cache formats
      await migrateDataSchema();

      // Try to load from cache first
      let index = await getCachedData<KfzIndex>(CACHE_KEYS.INDEX);
      let topoJson = await getCachedData<KfzTopoJSON>(CACHE_KEYS.TOPO);
      let seats = await getCachedData<KreissitzData>(CACHE_KEYS.SEATS);

      // Get cache metadata for version checking
      const cachedMeta = await getCacheMetadata(CACHE_KEYS.INDEX);

      // If online AND offline mode not enabled, check for newer version
      if (navigator.onLine && !isOfflineModeEnabled) {
        try {
          const indexResponse = await fetch('/data/index.transformed.json', {
            cache: 'no-cache',
            headers: cachedMeta?.dataVersion
              ? { 'If-None-Match': cachedMeta.dataVersion }
              : {},
          });

          if (indexResponse.ok && indexResponse.status !== 304) {
            const freshData = await indexResponse.json() as KfzIndex;

            // Check if version actually changed
            if (!cachedMeta || freshData.dataVersion !== cachedMeta.dataVersion) {
              console.log('Fetched fresh data:', freshData.dataVersion);
              index = freshData;

              // Cache with version metadata
              await setCachedData(CACHE_KEYS.INDEX, index, {
                dataVersion: index.dataVersion,
                buildHash: index.buildHash,
              });
            } else {
              console.log('Cache is up to date');
            }
          } else if (indexResponse.status === 304) {
            console.log('Cache validated, still fresh');
          }
        } catch (e) {
          console.log('Could not fetch index.transformed.json, using cache/fallback', e);
        }
      }

      if (!topoJson || (navigator.onLine && !isOfflineModeEnabled)) {
        try {
          const topoResponse = await fetch('/data/kfz250.topo.json');
          if (topoResponse.ok) {
            const fetchedTopo = await topoResponse.json();

            // Validate TopoJSON has actual geometries before caching
            if (isValidTopoJson(fetchedTopo)) {
              topoJson = fetchedTopo;
              await setCachedData(CACHE_KEYS.TOPO, topoJson);
            } else {
              console.warn('TopoJSON is empty (no geometries), skipping cache. Map features will not be available.');
              topoJson = null;
            }
          }
        } catch (e) {
          console.log('Could not fetch topo.json, using cache/fallback');
        }
      }

      // Seats are optional
      if (!seats || (navigator.onLine && !isOfflineModeEnabled)) {
        try {
          const seatsResponse = await fetch('/data/seats.json');
          if (seatsResponse.ok) {
            const fetchedSeats = await seatsResponse.json();

            // Validate seats data has actual content before caching
            if (isValidSeatsData(fetchedSeats)) {
              seats = fetchedSeats;
              await setCachedData(CACHE_KEYS.SEATS, seats, {
                ttlSeconds: 30 * 24 * 60 * 60, // 30 days
              });
            } else {
              console.warn('Seats data is empty, skipping cache. District capital markers will not be available.');
              seats = null;
            }
          }
        } catch (e) {
          console.log('Seats data not available (optional)');
        }
      }

      // Code details are optional
      let codeDetails = await getCachedData<CodeDetailsData>(CACHE_KEYS.CODE_DETAILS);
      if (!codeDetails || (navigator.onLine && !isOfflineModeEnabled)) {
        try {
          const codeDetailsResponse = await fetch('/data/code-details.json');
          if (codeDetailsResponse.ok) {
            codeDetails = await codeDetailsResponse.json();
            await setCachedData(CACHE_KEYS.CODE_DETAILS, codeDetails, {
              ttlSeconds: 30 * 24 * 60 * 60, // 30 days
            });
          }
        } catch (e) {
          console.log('Code details not available (optional)');
        }
      }

      // Use fallback if still no index
      if (!index) {
        console.log('Using fallback index data');
        index = GENERATED_FALLBACK;
      }

      setState({
        index,
        topoJson,
        seats,
        codeDetails,
        isLoading: false,
        error: null,
        isOffline: !navigator.onLine,
        mapAvailable: isValidTopoJson(topoJson),
      });
    } catch (error) {
      console.error('Error loading KFZ data:', error);

      // Try fallback
      setState({
        index: GENERATED_FALLBACK,
        topoJson: null,
        seats: null,
        codeDetails: null,
        isLoading: false,
        error: 'Daten konnten nicht vollständig geladen werden. Einige Funktionen sind eingeschränkt.',
        isOffline: !navigator.onLine,
        mapAvailable: false,
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
