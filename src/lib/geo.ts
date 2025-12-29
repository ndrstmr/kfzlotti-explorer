/**
 * Haversine formula for calculating distance between two points
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate bounding box from GeoJSON geometry
 */
export function getBoundingBox(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const processCoordinates = (coords: number[][]) => {
    for (const [lng, lat] of coords) {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
  };

  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      processCoordinates(ring);
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        processCoordinates(ring);
      }
    }
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Calculate center point from bounding box
 */
export function getCenterFromBbox(
  bbox: [number, number, number, number]
): [number, number] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

/**
 * Calculate centroid of a polygon
 */
export function getPolygonCentroid(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): [number, number] {
  let totalLng = 0;
  let totalLat = 0;
  let count = 0;

  const processCoordinates = (coords: number[][]) => {
    for (const [lng, lat] of coords) {
      totalLng += lng;
      totalLat += lat;
      count++;
    }
  };

  if (geometry.type === 'Polygon') {
    processCoordinates(geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      processCoordinates(polygon[0]);
    }
  }

  if (count === 0) return [0, 0];
  return [totalLng / count, totalLat / count];
}

/**
 * Convert TopoJSON to GeoJSON features
 */
export async function topoJsonToGeoJson(
  topoJson: { objects: Record<string, unknown>; [key: string]: unknown },
  objectName: string = 'kreise'
): Promise<GeoJSON.FeatureCollection> {
  const topojsonClient = await import('topojson-client');
  
  if (!topoJson.objects || !topoJson.objects[objectName]) {
    throw new Error(`Object "${objectName}" not found in TopoJSON`);
  }

  const result = topojsonClient.feature(topoJson, topoJson.objects[objectName]) as unknown;
  
  // Check if result has 'features' property (FeatureCollection)
  if (result && typeof result === 'object' && 'features' in result) {
    return result as GeoJSON.FeatureCollection;
  }
  
  // Single feature case - wrap in a collection
  return {
    type: 'FeatureCollection',
    features: [result as GeoJSON.Feature],
  };
}

/**
 * Get a single feature from TopoJSON by ID
 */
export async function getFeatureById(
  topoJson: { objects: Record<string, unknown>; [key: string]: unknown },
  featureId: string,
  objectName: string = 'kreise'
): Promise<GeoJSON.Feature | null> {
  const collection = await topoJsonToGeoJson(topoJson, objectName);
  return collection.features.find(f => f.id === featureId || f.properties?.id === featureId) || null;
}
