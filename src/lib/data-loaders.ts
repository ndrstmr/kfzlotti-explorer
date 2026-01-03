/**
 * Data loading utilities for KFZ data
 * Separates data fetching logic from hooks for better testability
 */

import type { KfzIndex, KfzTopoJSON } from '@/data/schema';
import { isValidIndex, isValidTopoJson } from './data-validators';

/**
 * Lazy-loads fallback KFZ index data
 *
 * This function dynamically imports the fallback data to reduce main bundle size.
 * The fallback contains all ~400 districts and is used when:
 * - Network fetch fails
 * - App starts offline
 * - Cache is empty
 *
 * @returns Promise resolving to fallback KfzIndex
 * @throws Error if fallback data cannot be loaded
 *
 * @example
 * try {
 *   const fallback = await loadFallbackData();
 *   setState({ index: fallback });
 * } catch (error) {
 *   console.error('Critical: No data available');
 * }
 */
export async function loadFallbackData(): Promise<KfzIndex> {
  const { GENERATED_FALLBACK } = await import('@/data/generated-fallback');
  return GENERATED_FALLBACK;
}

/**
 * Fetches and validates KFZ index data from URL
 *
 * Downloads the pre-transformed search index with version metadata.
 * Validates structure before returning to prevent invalid data propagation.
 *
 * @param url - URL to fetch index from (usually /data/index.transformed.json)
 * @param options - Fetch options (headers, cache control, etc.)
 * @returns Promise resolving to validated KfzIndex
 * @throws Error if fetch fails or data is invalid
 *
 * @example
 * const index = await loadIndexData('/data/index.transformed.json', {
 *   headers: { 'If-None-Match': cachedVersion }
 * });
 */
export async function loadIndexData(
  url: string,
  options?: RequestInit
): Promise<KfzIndex> {
  const response = await fetch(url, {
    cache: 'no-cache',
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch index: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!isValidIndex(data)) {
    throw new Error('Invalid index data structure');
  }

  return data as KfzIndex;
}

/**
 * Fetches and validates TopoJSON geodata from URL
 *
 * Downloads district boundary geometries for map visualization.
 * Validates that geometries array is not empty before returning.
 *
 * @param url - URL to fetch TopoJSON from (usually /data/kfz250.topo.json)
 * @param options - Fetch options
 * @returns Promise resolving to validated KfzTopoJSON
 * @throws Error if fetch fails or data is invalid/empty
 *
 * @example
 * const topo = await loadTopoData('/data/kfz250.topo.json');
 * if (topo) {
 *   renderMap(topo);
 * }
 */
export async function loadTopoData(
  url: string,
  options?: RequestInit
): Promise<KfzTopoJSON> {
  const response = await fetch(url, {
    cache: 'default', // Allow browser caching for geodata
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch TopoJSON: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!isValidTopoJson(data)) {
    throw new Error('Invalid or empty TopoJSON data');
  }

  return data as KfzTopoJSON;
}
