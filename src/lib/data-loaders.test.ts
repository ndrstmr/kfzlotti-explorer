/**
 * Tests for data loading utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadFallbackData, loadIndexData, loadTopoData } from './data-loaders';

// Mock fetch
global.fetch = vi.fn();

describe('Data Loaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadFallbackData', () => {
    it('should load fallback data successfully', async () => {
      const fallback = await loadFallbackData();

      expect(fallback).toBeDefined();
      expect(fallback.dataVersion).toBeDefined();
      expect(fallback.buildHash).toBeDefined();
      expect(fallback.codeToIds).toBeDefined();
      expect(fallback.features).toBeDefined();
      expect(typeof fallback.codeToIds).toBe('object');
      expect(typeof fallback.features).toBe('object');
    });

    it('should return same structure as transformed index', async () => {
      const fallback = await loadFallbackData();

      // Check for required properties
      expect(fallback).toHaveProperty('dataVersion');
      expect(fallback).toHaveProperty('buildHash');
      expect(fallback).toHaveProperty('codeToIds');
      expect(fallback).toHaveProperty('features');
    });
  });

  describe('loadIndexData', () => {
    it('should fetch and return valid index data', async () => {
      const mockData = {
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

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await loadIndexData('/data/index.transformed.json');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/data/index.transformed.json',
        expect.objectContaining({ cache: 'no-cache' })
      );
    });

    it('should pass custom options to fetch', async () => {
      const mockData = {
        dataVersion: '2024-01-01',
        buildHash: 'abc123',
        codeToIds: {},
        features: {},
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      await loadIndexData('/data/index.transformed.json', {
        headers: { 'If-None-Match': 'old-version' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/data/index.transformed.json',
        expect.objectContaining({
          cache: 'no-cache',
          headers: { 'If-None-Match': 'old-version' },
        })
      );
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(loadIndexData('/data/index.transformed.json'))
        .rejects.toThrow('Failed to fetch index: 404 Not Found');
    });

    it('should throw error on invalid data', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      } as Response);

      await expect(loadIndexData('/data/index.transformed.json'))
        .rejects.toThrow('Invalid index data structure');
    });
  });

  describe('loadTopoData', () => {
    it('should fetch and return valid TopoJSON data', async () => {
      const mockTopo = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [{ type: 'Polygon', id: '1' }],
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockTopo,
      } as Response);

      const result = await loadTopoData('/data/kfz250.topo.json');

      expect(result).toEqual(mockTopo);
      expect(global.fetch).toHaveBeenCalledWith(
        '/data/kfz250.topo.json',
        expect.objectContaining({ cache: 'default' })
      );
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      } as Response);

      await expect(loadTopoData('/data/kfz250.topo.json'))
        .rejects.toThrow('Failed to fetch TopoJSON: 500 Server Error');
    });

    it('should throw error on empty geometries', async () => {
      const emptyTopo = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [],
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => emptyTopo,
      } as Response);

      await expect(loadTopoData('/data/kfz250.topo.json'))
        .rejects.toThrow('Invalid or empty TopoJSON data');
    });

    it('should throw error on invalid structure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'topo' }),
      } as Response);

      await expect(loadTopoData('/data/kfz250.topo.json'))
        .rejects.toThrow('Invalid or empty TopoJSON data');
    });
  });
});
