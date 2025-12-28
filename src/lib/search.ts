/**
 * Search functionality for KFZ codes
 * Uses the pre-built index for fast lookups
 */

import type { KfzIndex, KreisProperties } from '@/data/schema';
import { normalizeKfzCode } from './normalize';
import { getBundeslandFromArs, getBundeslandFromShortName } from '@/data/bundeslaender';

export interface SearchResult {
  id: string;
  name: string;
  ars: string;
  kfzCode: string;
  kfzCodes: string[];
  bundesland: string;
  bundeslandShort: string;
  center: [number, number];
}

/**
 * Search for a KFZ code in the index
 * Returns all matching Kreise (there can be multiple for one code)
 */
export function searchKfzCode(code: string, index: KfzIndex): SearchResult[] {
  const normalized = normalizeKfzCode(code);
  
  if (!normalized) return [];
  
  const featureIds = index.codeToIds[normalized];
  
  if (!featureIds || featureIds.length === 0) return [];
  
  return featureIds.map(id => {
    const feature = index.features[id];
    if (!feature) return null;
    
    // Try to get Bundesland from ARS first, then from short name
    let bundesland = getBundeslandFromArs(feature.ars);
    if (!bundesland) {
      // The ars field might contain the state short name (e.g., "ST", "BY")
      bundesland = getBundeslandFromShortName(feature.ars);
    }
    
    return {
      id,
      name: feature.name,
      ars: feature.ars,
      kfzCode: normalized,
      kfzCodes: feature.kfzCodes,
      bundesland: bundesland?.name || 'Unbekannt',
      bundeslandShort: bundesland?.shortName || '??',
      center: feature.center,
    };
  }).filter((r): r is SearchResult => r !== null);
}

/**
 * Get autocomplete suggestions for partial input
 */
export function getAutocompleteSuggestions(
  partial: string,
  index: KfzIndex,
  limit: number = 5
): string[] {
  const normalized = normalizeKfzCode(partial);
  
  if (!normalized) return [];
  
  const allCodes = Object.keys(index.codeToIds);
  
  // Exact prefix matches first
  const prefixMatches = allCodes.filter(code => code.startsWith(normalized));
  
  // Sort by length (shorter codes first) then alphabetically
  prefixMatches.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });
  
  return prefixMatches.slice(0, limit);
}

/**
 * Get all unique KFZ codes from the index
 */
export function getAllKfzCodes(index: KfzIndex): string[] {
  return Object.keys(index.codeToIds).sort();
}

/**
 * Get a random KFZ code for quiz purposes
 */
export function getRandomKfzCode(index: KfzIndex): string {
  const codes = getAllKfzCodes(index);
  return codes[Math.floor(Math.random() * codes.length)];
}

/**
 * Get random search results for discovery features
 */
export function getRandomResults(index: KfzIndex, count: number = 3): SearchResult[] {
  const codes = getAllKfzCodes(index);
  const shuffled = [...codes].sort(() => Math.random() - 0.5);
  
  const results: SearchResult[] = [];
  
  for (const code of shuffled) {
    if (results.length >= count) break;
    
    const searchResults = searchKfzCode(code, index);
    if (searchResults.length > 0) {
      results.push(searchResults[0]);
    }
  }
  
  return results;
}
