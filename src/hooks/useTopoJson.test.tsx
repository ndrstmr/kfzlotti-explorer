/**
 * Tests for useTopoJson hook
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTopoJson } from './useTopoJson';
import * as storage from '@/lib/storage';
import * as dataLoaders from '@/lib/data-loaders';

// Mock dependencies
vi.mock('@/lib/storage', () => ({
  getUserSettings: vi.fn(),
  getCachedData: vi.fn(),
  setCachedData: vi.fn(),
  CACHE_KEYS: {
    INDEX: 'kfz-index',
    TOPO: 'kfz-topo',
    CODE_DETAILS: 'kfz-code-details',
  },
}));

vi.mock('@/lib/data-loaders', () => ({
  loadTopoData: vi.fn(),
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

describe('useTopoJson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.getUserSettings as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('should load data from cache successfully', async () => {
    const mockTopo = {
      type: 'Topology' as const,
      objects: {
        kreise: {
          type: 'GeometryCollection' as const,
          geometries: [
            { type: 'Polygon' as const, id: '1', properties: {} },
          ],
        },
      },
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(mockTopo);
    // Mock successful fetch to prevent undefined return
    (dataLoaders.loadTopoData as ReturnType<typeof vi.fn>).mockResolvedValue(mockTopo);

    const { result } = renderHook(() => useTopoJson(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTopo);
    // Should fetch fresh data even when cache exists (always fetch when online)
    expect(dataLoaders.loadTopoData).toHaveBeenCalled();
  });

  it('should fetch fresh data when online', async () => {
    const cachedTopo = {
      type: 'Topology' as const,
      objects: {
        kreise: {
          type: 'GeometryCollection' as const,
          geometries: [
            { type: 'Polygon' as const, id: '1', properties: {} },
          ],
        },
      },
    };

    const freshTopo = {
      type: 'Topology' as const,
      objects: {
        kreise: {
          type: 'GeometryCollection' as const,
          geometries: [
            { type: 'Polygon' as const, id: '1', properties: {} },
            { type: 'Polygon' as const, id: '2', properties: {} },
          ],
        },
      },
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (dataLoaders.loadTopoData as ReturnType<typeof vi.fn>).mockResolvedValue(freshTopo);

    const { result } = renderHook(() => useTopoJson(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(freshTopo);
    expect(storage.setCachedData).toHaveBeenCalledWith(
      storage.CACHE_KEYS.TOPO,
      freshTopo
    );
  });

  it('should return null when no data available', async () => {
    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (dataLoaders.loadTopoData as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useTopoJson(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
    expect(dataLoaders.loadTopoData).toHaveBeenCalled();
  });

  it('should skip network fetch in offline mode', async () => {
    const mockTopo = {
      type: 'Topology' as const,
      objects: {
        kreise: {
          type: 'GeometryCollection' as const,
          geometries: [
            { type: 'Polygon' as const, id: '1', properties: {} },
          ],
        },
      },
    };

    (storage.getUserSettings as ReturnType<typeof vi.fn>).mockResolvedValue({ offlineMode: true });
    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(mockTopo);

    const { result } = renderHook(() => useTopoJson(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTopo);
    expect(dataLoaders.loadTopoData).not.toHaveBeenCalled();
  });

  it('should handle fetch errors gracefully', async () => {
    const cachedTopo = {
      type: 'Topology' as const,
      objects: {
        kreise: {
          type: 'GeometryCollection' as const,
          geometries: [
            { type: 'Polygon' as const, id: '1', properties: {} },
          ],
        },
      },
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(cachedTopo);
    (dataLoaders.loadTopoData as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useTopoJson(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should fall back to cached data
    expect(result.current.data).toEqual(cachedTopo);
  });

  it('should refetch when cache exists and online', async () => {
    const cachedTopo = {
      type: 'Topology' as const,
      objects: {
        kreise: {
          type: 'GeometryCollection' as const,
          geometries: [
            { type: 'Polygon' as const, id: '1', properties: {} },
          ],
        },
      },
    };

    const freshTopo = {
      type: 'Topology' as const,
      objects: {
        kreise: {
          type: 'GeometryCollection' as const,
          geometries: [
            { type: 'Polygon' as const, id: '1', properties: {} },
            { type: 'Polygon' as const, id: '2', properties: {} },
          ],
        },
      },
    };

    (storage.getCachedData as ReturnType<typeof vi.fn>).mockResolvedValue(cachedTopo);
    (dataLoaders.loadTopoData as ReturnType<typeof vi.fn>).mockResolvedValue(freshTopo);

    const { result } = renderHook(() => useTopoJson(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should fetch fresh data even when cache exists (condition: navigator.onLine && !offlineMode)
    expect(result.current.data).toEqual(freshTopo);
    expect(dataLoaders.loadTopoData).toHaveBeenCalled();
  });
});
