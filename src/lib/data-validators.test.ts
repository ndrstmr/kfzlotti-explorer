/**
 * Tests for data validation utilities
 */

import { describe, it, expect } from 'vitest';
import { isValidTopoJson, isValidIndex } from './data-validators';

describe('Data Validators', () => {
  describe('isValidTopoJson', () => {
    it('should return true for valid TopoJSON', () => {
      const validTopo = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [
              { type: 'Polygon', id: '1', properties: {} },
            ],
          },
        },
      };

      expect(isValidTopoJson(validTopo)).toBe(true);
    });

    it('should return false for empty geometries', () => {
      const emptyTopo = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [],
          },
        },
      };

      expect(isValidTopoJson(emptyTopo)).toBe(false);
    });

    it('should return false for missing objects', () => {
      const invalidTopo = {
        type: 'Topology',
      };

      expect(isValidTopoJson(invalidTopo)).toBe(false);
    });

    it('should return false for missing kreise', () => {
      const invalidTopo = {
        type: 'Topology',
        objects: {},
      };

      expect(isValidTopoJson(invalidTopo)).toBe(false);
    });

    it('should return false for non-object input', () => {
      expect(isValidTopoJson(null)).toBe(false);
      expect(isValidTopoJson(undefined)).toBe(false);
      expect(isValidTopoJson('string')).toBe(false);
      expect(isValidTopoJson(123)).toBe(false);
      expect(isValidTopoJson([])).toBe(false);
    });

    it('should return false for missing geometries array', () => {
      const invalidTopo = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
          },
        },
      };

      expect(isValidTopoJson(invalidTopo)).toBe(false);
    });
  });

  describe('isValidIndex', () => {
    it('should return true for valid KfzIndex', () => {
      const validIndex = {
        dataVersion: '2024-01-01',
        buildHash: 'abc123',
        codeToIds: {
          'B': ['district_0'],
        },
        features: {
          'district_0': {
            name: 'Berlin',
            ars: '11000000',
            codes: ['B'],
            center: [52.52, 13.405],
          },
        },
      };

      expect(isValidIndex(validIndex)).toBe(true);
    });

    it('should return false for missing dataVersion', () => {
      const invalidIndex = {
        buildHash: 'abc123',
        codeToIds: {},
        features: {},
      };

      expect(isValidIndex(invalidIndex)).toBe(false);
    });

    it('should return false for missing buildHash', () => {
      const invalidIndex = {
        dataVersion: '2024-01-01',
        codeToIds: {},
        features: {},
      };

      expect(isValidIndex(invalidIndex)).toBe(false);
    });

    it('should return false for missing codeToIds', () => {
      const invalidIndex = {
        dataVersion: '2024-01-01',
        buildHash: 'abc123',
        features: {},
      };

      expect(isValidIndex(invalidIndex)).toBe(false);
    });

    it('should return false for missing features', () => {
      const invalidIndex = {
        dataVersion: '2024-01-01',
        buildHash: 'abc123',
        codeToIds: {},
      };

      expect(isValidIndex(invalidIndex)).toBe(false);
    });

    it('should return false for non-object input', () => {
      expect(isValidIndex(null)).toBe(false);
      expect(isValidIndex(undefined)).toBe(false);
      expect(isValidIndex('string')).toBe(false);
      expect(isValidIndex(123)).toBe(false);
      expect(isValidIndex([])).toBe(false);
    });

    it('should return false for wrong property types', () => {
      const invalidIndex = {
        dataVersion: 123, // Should be string
        buildHash: 'abc123',
        codeToIds: {},
        features: {},
      };

      expect(isValidIndex(invalidIndex)).toBe(false);
    });
  });
});
