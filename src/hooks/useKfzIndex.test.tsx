/**
 * Tests for useKfzIndex hook
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKfzIndex } from './useKfzIndex';
import * as storage from '@/lib/storage';
import * as dataLoaders from '@/lib/data-loaders';

// Mock dependencies
vi.mock('@/lib/storage', () => ({
  getUserSettings: vi.fn(),
  getCachedData: vi.fn(),
  setCachedData: vi.fn(),
  getCacheMetadata: vi.fn(),
  migrateDataSchema: vi.fn(),
  CACHE_KEYS: {
    INDEX: 'kfz-index',
    TOPO: 'kfz-topo',
    CODE_DETAILS: 'kfz-code-details',
  },
}));

vi.mock('@/lib/data-loaders', () => ({
  loadIndexData: vi.fn(),
  loadFallbackData: vi.fn(),
}));

// Helper to create QueryClient wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useKfzIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.migrateDataSchema as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (storage.getUserSettings as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('should load data from cache successfully', async () => {
    const mockIndex = {
      dataVersion: '2024-01-01',
      buildHash: 'abc123',
      codeToIds: { 'B': ['district_0'] },
      features: {
        'district_0': {
          name: 'Berlin',
          ars: '11000000',
          codes: ['B'],
          center: [52.52, 13.405],
        },
      },
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(mockIndex);
    (storage.getCacheMetadata as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { result } = renderHook(() => useKfzIndex(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockIndex);
    expect(storage.migrateDataSchema).toHaveBeenCalled();
  });

  it('should fetch fresh data when online', async () => {
    const cachedIndex = {
      dataVersion: '2024-01-01',
      buildHash: 'old123',
      codeToIds: {},
      features: {},
    };

    const freshIndex = {
      dataVersion: '2024-01-02',
      buildHash: 'new456',
      codeToIds: { 'B': ['district_0'] },
      features: {
        'district_0': {
          name: 'Berlin',
          ars: '11000000',
          codes: ['B'],
          center: [52.52, 13.405],
        },
      },
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(cachedIndex);
    (storage.getCacheMetadata as ReturnType<typeof vi.fn>).mockResolvedValue({
      dataVersion: '2024-01-01',
    });
    (dataLoaders.loadIndexData as ReturnType<typeof vi.fn>).mockResolvedValue(freshIndex);

    const { result } = renderHook(() => useKfzIndex(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(freshIndex);
    expect(storage.setCachedData).toHaveBeenCalledWith(
      storage.CACHE_KEYS.INDEX,
      freshIndex,
      {
        dataVersion: freshIndex.dataVersion,
        buildHash: freshIndex.buildHash,
      }
    );
  });

  it('should use cache when versions match', async () => {
    const mockIndex = {
      dataVersion: '2024-01-01',
      buildHash: 'abc123',
      codeToIds: {},
      features: {},
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(mockIndex);
    (storage.getCacheMetadata as ReturnType<typeof vi.fn>).mockResolvedValue({
      dataVersion: '2024-01-01',
    });
    (dataLoaders.loadIndexData as ReturnType<typeof vi.fn>).mockResolvedValue(mockIndex);

    const { result } = renderHook(() => useKfzIndex(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockIndex);
    // Should NOT call setCachedData when versions match
    expect(storage.setCachedData).not.toHaveBeenCalled();
  });

  it('should use fallback when cache is empty', async () => {
    const fallbackIndex = {
      dataVersion: 'fallback',
      buildHash: 'fallback123',
      codeToIds: { 'B': ['district_0'] },
      features: {
        'district_0': {
          name: 'Berlin',
          ars: '11000000',
          codes: ['B'],
          center: [52.52, 13.405],
        },
      },
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (storage.getCacheMetadata as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (dataLoaders.loadIndexData as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    (dataLoaders.loadFallbackData as ReturnType<typeof vi.fn>).mockResolvedValue(fallbackIndex);

    const { result } = renderHook(() => useKfzIndex(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(fallbackIndex);
    expect(dataLoaders.loadFallbackData).toHaveBeenCalled();
  });

  it('should skip network fetch in offline mode', async () => {
    const mockIndex = {
      dataVersion: '2024-01-01',
      buildHash: 'abc123',
      codeToIds: {},
      features: {},
    };

    (storage.getUserSettings as ReturnType<typeof vi.fn>).mockResolvedValue({ offlineMode: true });
    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(mockIndex);

    const { result } = renderHook(() => useKfzIndex(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockIndex);
    expect(dataLoaders.loadIndexData).not.toHaveBeenCalled();
  });

  it('should handle fetch errors gracefully', async () => {
    const cachedIndex = {
      dataVersion: '2024-01-01',
      buildHash: 'abc123',
      codeToIds: {},
      features: {},
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(cachedIndex);
    (storage.getCacheMetadata as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (dataLoaders.loadIndexData as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useKfzIndex(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should fall back to cached data
    expect(result.current.data).toEqual(cachedIndex);
  });
});
