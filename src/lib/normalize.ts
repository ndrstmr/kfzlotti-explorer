/**
 * Normalization utilities for KFZ code input
 * Handles user input sanitization and code parsing
 */

/**
 * Normalize a KFZ code input
 * - Trims whitespace
 * - Converts to uppercase
 * - Removes non-letter characters
 * - Limits length to 3 (max German KFZ prefix length)
 */
export function normalizeKfzCode(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-ZÄÖÜ]/g, '')
    .substring(0, 3);
}

/**
 * Parse multiple KFZ codes from a space-separated string
 * Used for parsing the source data field that may contain multiple codes
 */
export function parseKfzCodes(codesString: string): string[] {
  if (!codesString || typeof codesString !== 'string') return [];
  
  const codes = codesString
    .split(/\s+/)
    .map(code => code.trim().toUpperCase())
    .filter(code => code.length > 0 && code.length <= 3)
    .filter(code => /^[A-ZÄÖÜ]+$/.test(code));
  
  // Deduplicate
  return [...new Set(codes)];
}

/**
 * Validate if a string is a valid KFZ code format
 */
export function isValidKfzCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const normalized = normalizeKfzCode(code);
  return normalized.length >= 1 && normalized.length <= 3;
}

/**
 * Format a distance in kilometers for display
 * Kid-friendly formatting with appropriate precision
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return 'weniger als 1 km';
  } else if (distanceKm < 10) {
    return `ca. ${Math.round(distanceKm)} km`;
  } else if (distanceKm < 100) {
    return `ca. ${Math.round(distanceKm / 5) * 5} km`;
  } else {
    return `ca. ${Math.round(distanceKm / 10) * 10} km`;
  }
}

/**
 * Get a fun comparison for distance (kid-friendly)
 */
export function getDistanceComparison(distanceKm: number): string {
  if (distanceKm < 5) {
    return '🚴 Mit dem Fahrrad erreichbar!';
  } else if (distanceKm < 20) {
    return '🚗 Eine kurze Autofahrt!';
  } else if (distanceKm < 100) {
    return '🚗 Eine längere Autofahrt!';
  } else if (distanceKm < 300) {
    return '🚄 Da fährt man besser mit dem Zug!';
  } else {
    return '✈️ Das ist ganz schön weit weg!';
  }
}
