/**
 * Code Details Hook - Lazy loads code origin/history data
 * Only fetches when component actually needs the data
 */

import { useState, useEffect } from 'react';
import type { CodeDetailsData } from '@/data/schema';
import { getCachedData, setCachedData, getUserSettings, CACHE_KEYS } from '@/lib/storage';

interface CodeDetailsState {
  codeDetails: CodeDetailsData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Lazy-loads code details (origin, history) on-demand
 * Only fetches when component mounts that needs this data
 * Caches for 30 days
 */
export function useKfzCodeDetails() {
  const [state, setState] = useState<CodeDetailsState>({
    codeDetails: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadCodeDetails = async () => {
      try {
        // Check if user has enabled offline-only mode
        const settings = await getUserSettings();
        const isOfflineModeEnabled = settings?.offlineMode || false;

        // Try to load from cache first
        let codeDetails = await getCachedData<CodeDetailsData>(CACHE_KEYS.CODE_DETAILS);

        // If online AND offline mode not enabled, try to fetch fresh data
        if (navigator.onLine && !isOfflineModeEnabled) {
          try {
            const response = await fetch('/data/code-details.json', {
              cache: 'no-cache',
            });

            if (response.ok) {
              const freshData = await response.json();
              codeDetails = freshData;

              // Cache with TTL
              await setCachedData(CACHE_KEYS.CODE_DETAILS, codeDetails, {
                ttlSeconds: 30 * 24 * 60 * 60, // 30 days
              });
            }
          } catch (e) {
            console.log('Could not fetch code-details.json, using cache');
          }
        }

        if (isMounted) {
          setState({
            codeDetails,
            isLoading: false,
            error: codeDetails ? null : 'Code-Details konnten nicht geladen werden',
          });
        }
      } catch (error) {
        console.error('Error loading code details:', error);
        if (isMounted) {
          setState({
            codeDetails: null,
            isLoading: false,
            error: 'Fehler beim Laden der Code-Details',
          });
        }
      }
    };

    loadCodeDetails();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
