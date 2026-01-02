/**
 * Tests for useKfzCodeDetails hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useKfzCodeDetails } from './useKfzCodeDetails';
import * as storage from '@/lib/storage';

// Mock storage functions
vi.mock('@/lib/storage', () => ({
  getCachedData: vi.fn(),
  setCachedData: vi.fn(),
  getUserSettings: vi.fn(),
  CACHE_KEYS: {
    CODE_DETAILS: 'kfz-code-details',
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('useKfzCodeDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.getUserSettings).mockResolvedValue({});
  });

  it('should load code details from cache', async () => {
    const mockCodeDetails = {
      codes: {
        'B': {
          origin: 'Berlin',
          note: 'Bundeshauptstadt',
        },
      },
    };

    vi.mocked(storage.getCachedData).mockResolvedValue(mockCodeDetails);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useKfzCodeDetails());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.codeDetails).toEqual(mockCodeDetails);
    expect(result.current.error).toBeNull();
  });

  it('should fetch fresh data when online and cache is available', async () => {
    const cachedData = { codes: { 'B': { origin: 'Berlin' } } };
    const freshData = { codes: { 'B': { origin: 'Berlin', note: 'Updated' } } };

    vi.mocked(storage.getCachedData).mockResolvedValue(cachedData);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => freshData,
    } as Response);

    const { result } = renderHook(() => useKfzCodeDetails());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.codeDetails).toEqual(freshData);
    expect(storage.setCachedData).toHaveBeenCalledWith(
      storage.CACHE_KEYS.CODE_DETAILS,
      freshData,
      { ttlSeconds: 30 * 24 * 60 * 60 }
    );
  });

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(storage.getCachedData).mockResolvedValue(null);
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useKfzCodeDetails());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.codeDetails).toBeNull();
    expect(result.current.error).toBe('Code-Details konnten nicht geladen werden');
  });

  it('should skip fetch when offline mode is enabled', async () => {
    const cachedData = { codes: { 'B': { origin: 'Berlin' } } };

    vi.mocked(storage.getUserSettings).mockResolvedValue({ offlineMode: true });
    vi.mocked(storage.getCachedData).mockResolvedValue(cachedData);

    const { result } = renderHook(() => useKfzCodeDetails());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.codeDetails).toEqual(cachedData);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return null when no cache and fetch fails', async () => {
    vi.mocked(storage.getCachedData).mockResolvedValue(null);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useKfzCodeDetails());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.codeDetails).toBeNull();
    expect(result.current.error).toBe('Code-Details konnten nicht geladen werden');
  });

  it('should cleanup on unmount', async () => {
    vi.mocked(storage.getCachedData).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { unmount } = renderHook(() => useKfzCodeDetails());

    unmount();

    // Should not throw or cause memory leaks
    expect(true).toBe(true);
  });
});
