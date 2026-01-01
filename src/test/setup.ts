/**
 * Vitest setup file
 * Initializes test environment
 */

// Load fake-indexeddb FIRST (before any tests import storage.ts)
import 'fake-indexeddb/auto';

// Ensure window is available for PWA tests (happy-dom provides it)
// Make it globally accessible without 'window.' prefix
if (typeof window !== 'undefined') {
  // @ts-expect-error - Making window globally available
  globalThis.window = window;
}
