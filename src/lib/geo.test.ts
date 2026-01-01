/**
 * Tests for geospatial functions
 * Tests distance calculation, bounding boxes, centroids, and TopoJSON conversion
 */

import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  getBoundingBox,
  getCenterFromBbox,
  getPolygonCentroid,
  topoJsonToGeoJson,
  getFeatureById,
} from './geo';

describe('Geo Library', () => {
  describe('haversineDistance', () => {
    it('should calculate distance between Berlin and Munich', () => {
      // Berlin: 52.52°N, 13.40°E
      // Munich: 48.14°N, 11.58°E
      const distance = haversineDistance(52.52, 13.40, 48.14, 11.58);

      // Expected: ~504 km
      expect(distance).toBeGreaterThan(500);
      expect(distance).toBeLessThan(510);
    });

    it('should return 0 for same coordinates', () => {
      const distance = haversineDistance(52.52, 13.40, 52.52, 13.40);
      expect(distance).toBe(0);
    });

    it('should calculate distance between Hamburg and Frankfurt', () => {
      // Hamburg: 53.55°N, 10.00°E
      // Frankfurt: 50.11°N, 8.68°E
      const distance = haversineDistance(53.55, 10.00, 50.11, 8.68);

      // Expected: ~393 km
      expect(distance).toBeGreaterThan(385);
      expect(distance).toBeLessThan(400);
    });

    it('should handle negative coordinates (Western Hemisphere)', () => {
      // New York: 40.71°N, -74.01°W
      // Los Angeles: 34.05°N, -118.24°W
      const distance = haversineDistance(40.71, -74.01, 34.05, -118.24);

      // Expected: ~3944 km
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should be symmetric (A->B = B->A)', () => {
      const distanceAB = haversineDistance(52.52, 13.40, 48.14, 11.58);
      const distanceBA = haversineDistance(48.14, 11.58, 52.52, 13.40);

      expect(distanceAB).toBe(distanceBA);
    });
  });

  describe('getBoundingBox', () => {
    it('should calculate bounding box for simple polygon', () => {
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [10, 50], // minLng, minLat
            [12, 50],
            [12, 52], // maxLng, maxLat
            [10, 52],
            [10, 50], // Close ring
          ],
        ],
      };

      const bbox = getBoundingBox(polygon);

      expect(bbox).toEqual([10, 50, 12, 52]);
    });

    it('should calculate bounding box for polygon with hole', () => {
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          // Outer ring
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
          // Inner ring (hole) - should not affect bbox
          [
            [2, 2],
            [8, 2],
            [8, 8],
            [2, 8],
            [2, 2],
          ],
        ],
      };

      const bbox = getBoundingBox(polygon);

      expect(bbox).toEqual([0, 0, 10, 10]);
    });

    it('should calculate bounding box for multi-polygon', () => {
      const multiPolygon: GeoJSON.MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: [
          // First polygon
          [
            [
              [0, 0],
              [5, 0],
              [5, 5],
              [0, 5],
              [0, 0],
            ],
          ],
          // Second polygon (extends bbox)
          [
            [
              [10, 10],
              [15, 10],
              [15, 15],
              [10, 15],
              [10, 10],
            ],
          ],
        ],
      };

      const bbox = getBoundingBox(multiPolygon);

      expect(bbox).toEqual([0, 0, 15, 15]);
    });

    it('should handle single point polygon', () => {
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [13.4, 52.5],
            [13.4, 52.5],
            [13.4, 52.5],
          ],
        ],
      };

      const bbox = getBoundingBox(polygon);

      expect(bbox).toEqual([13.4, 52.5, 13.4, 52.5]);
    });
  });

  describe('getCenterFromBbox', () => {
    it('should calculate center from bounding box', () => {
      const bbox: [number, number, number, number] = [10, 50, 12, 52];
      const center = getCenterFromBbox(bbox);

      expect(center).toEqual([11, 51]);
    });

    it('should handle zero-sized bbox', () => {
      const bbox: [number, number, number, number] = [13.4, 52.5, 13.4, 52.5];
      const center = getCenterFromBbox(bbox);

      expect(center).toEqual([13.4, 52.5]);
    });

    it('should handle negative coordinates', () => {
      const bbox: [number, number, number, number] = [-10, -5, -5, 0];
      const center = getCenterFromBbox(bbox);

      expect(center).toEqual([-7.5, -2.5]);
    });
  });

  describe('getPolygonCentroid', () => {
    it('should calculate centroid for simple polygon', () => {
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0], // Closing point is included in average
          ],
        ],
      };

      const centroid = getPolygonCentroid(polygon);

      // Average of all 5 points: (0+10+10+0+0)/5 = 4
      expect(centroid[0]).toBeCloseTo(4, 1);
      expect(centroid[1]).toBeCloseTo(4, 1);
    });

    it('should calculate centroid for multi-polygon', () => {
      const multiPolygon: GeoJSON.MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: [
          // First polygon
          [
            [
              [0, 0],
              [5, 0],
              [5, 5],
              [0, 5],
              [0, 0],
            ],
          ],
          // Second polygon
          [
            [
              [10, 10],
              [15, 10],
              [15, 15],
              [10, 15],
              [10, 10],
            ],
          ],
        ],
      };

      const centroid = getPolygonCentroid(multiPolygon);

      // Should be weighted towards both polygons
      expect(centroid[0]).toBeGreaterThan(0);
      expect(centroid[1]).toBeGreaterThan(0);
    });

    it('should return [0, 0] for empty polygon', () => {
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [[]],
      };

      const centroid = getPolygonCentroid(polygon);

      expect(centroid).toEqual([0, 0]);
    });

    it('should handle triangle', () => {
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [6, 0],
            [3, 6],
            [0, 0], // Close
          ],
        ],
      };

      const centroid = getPolygonCentroid(polygon);

      // Average: (0+6+3+0)/4 = 2.25, (0+0+6+0)/4 = 1.5
      expect(centroid[0]).toBeCloseTo(2.25, 1);
      expect(centroid[1]).toBeCloseTo(1.5, 1);
    });
  });

  describe('topoJsonToGeoJson', () => {
    it('should convert valid TopoJSON to GeoJSON', async () => {
      const validTopoJson = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [
              {
                type: 'Point',
                coordinates: [13.4, 52.5],
                properties: { name: 'Berlin' },
              },
            ],
          },
        },
        arcs: [],
      };

      const result = await topoJsonToGeoJson(validTopoJson);

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toBeTruthy();
      expect(Array.isArray(result.features)).toBe(true);
    });

    it('should throw error for invalid TopoJSON structure', async () => {
      const invalidTopoJson = {
        type: 'InvalidType',
        // Missing: objects, arcs
      };

      await expect(topoJsonToGeoJson(invalidTopoJson)).rejects.toThrow(
        'Invalid TopoJSON structure'
      );
    });

    it('should throw error for missing type', async () => {
      const invalidTopoJson = {
        // Missing: type
        objects: {},
        arcs: [],
      };

      await expect(topoJsonToGeoJson(invalidTopoJson)).rejects.toThrow(
        'Invalid TopoJSON structure'
      );
    });

    it('should throw error for missing objects', async () => {
      const invalidTopoJson = {
        type: 'Topology',
        // Missing: objects
        arcs: [],
      };

      await expect(topoJsonToGeoJson(invalidTopoJson)).rejects.toThrow(
        'Invalid TopoJSON structure'
      );
    });

    it('should throw error for missing arcs', async () => {
      const invalidTopoJson = {
        type: 'Topology',
        objects: {},
        // Missing: arcs
      };

      await expect(topoJsonToGeoJson(invalidTopoJson)).rejects.toThrow(
        'Invalid TopoJSON structure'
      );
    });

    it('should throw error for non-existent object name', async () => {
      const validTopoJson = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [],
          },
        },
        arcs: [],
      };

      await expect(
        topoJsonToGeoJson(validTopoJson, 'nonexistent')
      ).rejects.toThrow('Object "nonexistent" not found in TopoJSON');
    });

    it('should handle custom object name', async () => {
      const validTopoJson = {
        type: 'Topology',
        objects: {
          customName: {
            type: 'GeometryCollection',
            geometries: [
              {
                type: 'Point',
                coordinates: [10, 50],
              },
            ],
          },
        },
        arcs: [],
      };

      const result = await topoJsonToGeoJson(validTopoJson, 'customName');

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toBeTruthy();
    });

    it('should handle null input', async () => {
      await expect(topoJsonToGeoJson(null)).rejects.toThrow(
        'Invalid TopoJSON structure'
      );
    });

    it('should handle undefined input', async () => {
      await expect(topoJsonToGeoJson(undefined)).rejects.toThrow(
        'Invalid TopoJSON structure'
      );
    });

    it('should handle empty object', async () => {
      await expect(topoJsonToGeoJson({})).rejects.toThrow(
        'Invalid TopoJSON structure'
      );
    });
  });

  describe('getFeatureById', () => {
    it('should find feature by id property', async () => {
      const topoJson = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [
              {
                type: 'Point',
                id: 'berlin',
                coordinates: [13.4, 52.5],
                properties: { name: 'Berlin' },
              },
              {
                type: 'Point',
                id: 'munich',
                coordinates: [11.58, 48.14],
                properties: { name: 'Munich' },
              },
            ],
          },
        },
        arcs: [],
      };

      const feature = await getFeatureById(topoJson, 'berlin');

      expect(feature).toBeTruthy();
      expect(feature?.id).toBe('berlin');
    });

    it('should find feature by properties.id', async () => {
      const topoJson = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [
              {
                type: 'Point',
                coordinates: [13.4, 52.5],
                properties: { id: 'berlin', name: 'Berlin' },
              },
            ],
          },
        },
        arcs: [],
      };

      const feature = await getFeatureById(topoJson, 'berlin');

      expect(feature).toBeTruthy();
      expect(feature?.properties?.id).toBe('berlin');
    });

    it('should return null for non-existent feature', async () => {
      const topoJson = {
        type: 'Topology',
        objects: {
          kreise: {
            type: 'GeometryCollection',
            geometries: [
              {
                type: 'Point',
                id: 'berlin',
                coordinates: [13.4, 52.5],
              },
            ],
          },
        },
        arcs: [],
      };

      const feature = await getFeatureById(topoJson, 'nonexistent');

      expect(feature).toBeNull();
    });

    it('should handle custom object name', async () => {
      const topoJson = {
        type: 'Topology',
        objects: {
          cities: {
            type: 'GeometryCollection',
            geometries: [
              {
                type: 'Point',
                id: 'berlin',
                coordinates: [13.4, 52.5],
              },
            ],
          },
        },
        arcs: [],
      };

      const feature = await getFeatureById(topoJson, 'berlin', 'cities');

      expect(feature).toBeTruthy();
      expect(feature?.id).toBe('berlin');
    });
  });
});
