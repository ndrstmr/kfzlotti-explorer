/**
 * Data validation utilities for KFZ data structures
 */

import type { KfzIndex, KfzTopoJSON } from '@/data/schema';

/**
 * Validates if TopoJSON contains actual geometry data
 *
 * SECURITY: Validates structure before caching to prevent storing invalid data
 *
 * @param data - Unknown data to validate
 * @returns true if data is valid TopoJSON with geometries
 *
 * @example
 * const json = await fetch('/data/kfz250.topo.json').then(r => r.json());
 * if (isValidTopoJson(json)) {
 *   await setCachedData(CACHE_KEYS.TOPO, json);
 * }
 */
export function isValidTopoJson(data: unknown): data is KfzTopoJSON {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const topo = data as Record<string, unknown>;

  return Boolean(
    topo.objects &&
    typeof topo.objects === 'object' &&
    (topo.objects as Record<string, unknown>).kreise &&
    typeof (topo.objects as Record<string, unknown>).kreise === 'object' &&
    ((topo.objects as Record<string, unknown>).kreise as Record<string, unknown>).geometries &&
    Array.isArray(((topo.objects as Record<string, unknown>).kreise as Record<string, unknown>).geometries) &&
    ((topo.objects as Record<string, unknown>).kreise as Record<string, unknown>).geometries.length > 0
  );
}

/**
 * Validates if data is a valid KFZ index structure
 *
 * @param data - Unknown data to validate
 * @returns true if data is valid KfzIndex
 *
 * @example
 * const json = await fetch('/data/index.transformed.json').then(r => r.json());
 * if (isValidIndex(json)) {
 *   await setCachedData(CACHE_KEYS.INDEX, json);
 * }
 */
export function isValidIndex(data: unknown): data is KfzIndex {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const index = data as Record<string, unknown>;

  return Boolean(
    index.dataVersion &&
    typeof index.dataVersion === 'string' &&
    index.buildHash &&
    typeof index.buildHash === 'string' &&
    index.codeToIds &&
    typeof index.codeToIds === 'object' &&
    index.features &&
    typeof index.features === 'object'
  );
}
