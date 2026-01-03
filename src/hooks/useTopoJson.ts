/**
 * TanStack Query hook for KFZ TopoJSON geodata
 *
 * Manages fetching, caching, and validation of TopoJSON map data.
 * Replaces manual state management with TanStack Query for better:
 * - Automatic caching
 * - Automatic refetching
 * - Loading/error states
 * - DevTools support
 */

import { useQuery } from '@tanstack/react-query';
import type { KfzTopoJSON } from '@/data/schema';
import {
  getUserSettings,
  getCachedData,
  setCachedData,
  CACHE_KEYS,
} from '@/lib/storage';
import { loadTopoData } from '@/lib/data-loaders';

/**
 * Hook for loading and caching KFZ TopoJSON geodata
 *
 * This hook integrates with TanStack Query to provide:
 * - Offline-first data loading with IndexedDB cache
 * - Automatic validation of geodata
 * - Conditional network requests (respects offline mode)
 * - Graceful handling when map data unavailable
 *
 * Data loading strategy:
 * 1. Load from IndexedDB cache
 * 2. If online (and not in offline mode), fetch fresh data
 * 3. Validate TopoJSON structure
 * 4. Cache valid data, return null for invalid/missing data
 *
 * @returns TanStack Query result with KfzTopoJSON data (or null if unavailable)
 *
 * @example
 * function MapPage() {
 *   const { data: topoJson, isLoading } = useTopoJson();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!topoJson) return <MapUnavailableMessage />;
 *
 *   return <MapVisualization topoJson={topoJson} />;
 * }
 */
export function useTopoJson() {
  return useQuery({
    queryKey: ['kfz-topojson'],

    queryFn: async (): Promise<KfzTopoJSON | null> => {
      // Step 1: Check user settings
      const settings = await getUserSettings();
      const isOfflineModeEnabled = settings?.offlineMode || false;

      // Step 2: Try to load from cache first
      let topoJson = await getCachedData<KfzTopoJSON>(CACHE_KEYS.TOPO);

      // Step 3: If online AND offline mode not enabled, fetch fresh data
      if (!topoJson || (navigator.onLine && !isOfflineModeEnabled)) {
        try {
          const freshTopo = await loadTopoData('/data/kfz250.topo.json');

          // TopoJSON is already validated by loadTopoData
          topoJson = freshTopo;

          // Cache the valid data
          await setCachedData(CACHE_KEYS.TOPO, topoJson);
          console.log('Fetched and cached fresh TopoJSON data');
        } catch (e) {
          console.log('Could not fetch TopoJSON, using cache', e);
          // If fetch failed but we have cache, use it
          // If no cache exists, topoJson will be null (map unavailable)
        }
      }

      // Return null if no valid TopoJSON available (map feature disabled)
      return topoJson;
    },

    // Cache configuration for offline-first behavior
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - geodata rarely changes
    gcTime: Infinity, // Never garbage collect - keep for offline use
    retry: 1, // Only retry once to avoid hammering the server
    refetchOnWindowFocus: false, // Don't refetch on focus (offline-first)
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: true, // DO refetch when coming back online
  });
}
