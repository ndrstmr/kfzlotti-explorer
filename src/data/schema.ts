/**
 * TypeScript schemas for KFZlotti data structures
 * All data coming from the pipeline must conform to these types
 */

// Single district/Kreis feature properties
export interface KreisProperties {
  /** Unique feature ID */
  id: string;
  /** Official name of the Kreis/Landkreis/kreisfreie Stadt */
  name: string;
  /** Amtlicher Regionalschlüssel (ARS) - 12 digits */
  ars: string;
  /** Primary KFZ code (e.g., "HH", "M", "B") */
  kfzCode: string;
  /** All KFZ codes for this Kreis (space-separated in source, parsed to array) */
  kfzCodes: string[];
  /** Center point coordinates [lng, lat] for labels/distance calculation */
  center: [number, number];
  /** Bounding box [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number];
}

// GeoJSON Feature with Kreis properties
export interface KreisFeature {
  type: "Feature";
  id: string;
  properties: KreisProperties;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

// The full TopoJSON structure we expect
export interface KfzTopoJSON {
  type: "Topology";
  objects: {
    kreise: {
      type: "GeometryCollection";
      geometries: Array<{
        type: string;
        arcs: number[][] | number[][][];
        properties: KreisProperties;
      }>;
    };
  };
  arcs: number[][][];
  bbox: [number, number, number, number];
}

// Search index: maps uppercase KFZ code -> feature ID
export interface KfzIndex {
  /** Version of the index format */
  version: number;
  /** Date when data was generated (ISO string) */
  generated: string;
  /** Source attribution */
  source: string;
  /** Map of KFZ code (uppercase) to feature IDs */
  codeToIds: Record<string, string[]>;
  /** Map of feature ID to basic info for quick lookup */
  features: Record<string, {
    name: string;
    ars: string;
    kfzCodes: string[];
    center: [number, number];
  }>;
}

// Optional: Kreisstadt/seat data from Wikidata
export interface KreissitzData {
  /** Version of the data format */
  version: number;
  /** Date when data was fetched (ISO string) */
  generated: string;
  /** Source attribution */
  source: string;
  /** Map of ARS -> seat info */
  seats: Record<string, {
    name: string;
    /** Optional coordinates [lng, lat] */
    coordinates?: [number, number];
  }>;
}

// User progress/gamification data stored in IndexedDB
export interface UserProgress {
  id: string;
  /** Total searches performed */
  totalSearches: number;
  /** Unique Kreise discovered */
  discoveredKreise: string[];
  /** Quiz stats */
  quizCorrect: number;
  quizTotal: number;
  /** Earned badges */
  badges: Badge[];
  /** Daily streak */
  currentStreak: number;
  lastActiveDate: string;
  /** Timestamp */
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earnedAt: string;
}

// Badge definitions
export const BADGES: Omit<Badge, 'earnedAt'>[] = [
  { id: 'first_search', name: 'Entdecker', description: 'Deine erste Suche!', emoji: '🔍' },
  { id: 'ten_searches', name: 'Neugierig', description: '10 Suchen durchgeführt', emoji: '🧐' },
  { id: 'fifty_searches', name: 'Experte', description: '50 Suchen durchgeführt', emoji: '🎓' },
  { id: 'first_quiz', name: 'Quizzer', description: 'Erstes Quiz gespielt', emoji: '❓' },
  { id: 'quiz_master', name: 'Quiz-Meister', description: '10 Quiz-Fragen richtig', emoji: '🏆' },
  { id: 'all_states', name: 'Bundesland-König', description: 'Alle 16 Bundesländer entdeckt', emoji: '👑' },
  { id: 'streak_3', name: 'Dranbleiber', description: '3 Tage in Folge aktiv', emoji: '🔥' },
  { id: 'streak_7', name: 'Wochenstar', description: '7 Tage in Folge aktiv', emoji: '⭐' },
];

// Bundesland derived from ARS
export interface Bundesland {
  code: string;
  name: string;
  shortName: string;
}
