/**
 * TanStack Query hook for KFZ index data
 *
 * Manages fetching, caching, and validation of the KFZ search index.
 * Replaces manual state management with TanStack Query for better:
 * - Automatic caching
 * - Automatic refetching
 * - Loading/error states
 * - DevTools support
 */

import { useQuery } from '@tanstack/react-query';
import type { KfzIndex } from '@/data/schema';
import {
  getUserSettings,
  getCachedData,
  setCachedData,
  getCacheMetadata,
  migrateDataSchema,
  CACHE_KEYS,
} from '@/lib/storage';
import { loadIndexData, loadFallbackData } from '@/lib/data-loaders';

/**
 * Hook for loading and caching KFZ index data
 *
 * This hook integrates with TanStack Query to provide:
 * - Offline-first data loading with IndexedDB cache
 * - Version-based cache invalidation
 * - Automatic fallback to embedded data
 * - Conditional network requests (respects offline mode)
 *
 * Data loading strategy:
 * 1. Run schema migration check
 * 2. Load from IndexedDB cache
 * 3. If online (and not in offline mode), fetch fresh data
 * 4. Compare versions and update cache if newer
 * 5. Fall back to embedded data if all else fails
 *
 * @returns TanStack Query result with KfzIndex data
 *
 * @example
 * function SearchPage() {
 *   const { data: index, isLoading, error } = useKfzIndex();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage />;
 *   if (!index) return <NoDataMessage />;
 *
 *   return <SearchInterface index={index} />;
 * }
 */
export function useKfzIndex() {
  return useQuery({
    queryKey: ['kfz-index'],

    queryFn: async (): Promise<KfzIndex> => {
      // Step 1: Run schema migration check
      // This detects and clears old/incompatible cache formats
      await migrateDataSchema();

      // Step 2: Check user settings
      const settings = await getUserSettings();
      const isOfflineModeEnabled = settings?.offlineMode || false;

      // Step 3: Try to load from cache first
      let index = await getCachedData<KfzIndex>(CACHE_KEYS.INDEX);
      const cachedMeta = await getCacheMetadata(CACHE_KEYS.INDEX);

      // Step 4: If online AND offline mode not enabled, check for newer version
      if (navigator.onLine && !isOfflineModeEnabled) {
        try {
          const freshData = await loadIndexData('/data/index.transformed.json', {
            headers: cachedMeta?.dataVersion
              ? { 'If-None-Match': cachedMeta.dataVersion }
              : {},
          });

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
        } catch (e) {
          console.log('Could not fetch index, using cache/fallback', e);
        }
      }

      // Step 5: Use fallback if still no index
      if (!index) {
        console.log('Using fallback index data (lazy-loading...)');
        index = await loadFallbackData();
      }

      return index;
    },

    // Cache configuration for offline-first behavior
    staleTime: 30 * 24 * 60 * 60 * 1000, // 30 days - data rarely changes
    gcTime: Infinity, // Never garbage collect - keep for offline use
    retry: 1, // Only retry once to avoid hammering the server
    refetchOnWindowFocus: false, // Don't refetch on focus (offline-first)
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: true, // DO refetch when coming back online
  });
}
