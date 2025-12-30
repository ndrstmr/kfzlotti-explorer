/**
 * IndexedDB storage using Dexie
 * Stores cached data and user progress
 */

import Dexie, { type Table } from 'dexie';
import type { UserProgress, UserSettings, Badge, KfzIndex, KreissitzData } from '@/data/schema';
import { BADGES } from '@/data/schema';

// Type for cached data
type CachedData = KfzIndex | KreissitzData | Record<string, unknown>;

// Cache entry with version metadata
interface CachedDataEntry {
  key: string;
  data: CachedData;
  dataVersion?: string;
  buildHash?: string;
  updatedAt: string;
  expiresAt?: string;
}

// Database schema
class KfzLottiDB extends Dexie {
  cache!: Table<CachedDataEntry>;
  progress!: Table<UserProgress>;
  settings!: Table<UserSettings>;

  constructor() {
    super('KfzLottiDB');

    this.version(1).stores({
      cache: 'key',
      progress: 'id',
    });

    this.version(2).stores({
      cache: 'key',
      progress: 'id',
      settings: 'id',
    });

    // Version 3: Add version metadata and expiration
    this.version(3).stores({
      cache: 'key, dataVersion, expiresAt',
      progress: 'id',
      settings: 'id',
    });
  }
}

export const db = new KfzLottiDB();

// Cache keys
export const CACHE_KEYS = {
  INDEX: 'kfz-index',
  TOPO: 'kfz-topo',
  SEATS: 'kfz-seats',
  CODE_DETAILS: 'kfz-code-details',
} as const;

/**
 * Get cached data with expiration check
 */
export async function getCachedData<T>(
  key: string,
  options?: { ignoreExpired?: boolean }
): Promise<T | null> {
  try {
    const cached = await db.cache.get(key);
    if (!cached) return null;

    // Check expiration
    if (cached.expiresAt && !options?.ignoreExpired) {
      if (new Date(cached.expiresAt) < new Date()) {
        console.log(`Cache expired for ${key}`);
        await db.cache.delete(key);
        return null;
      }
    }

    return cached.data as T;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Set cached data with version metadata and TTL
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  options?: {
    dataVersion?: string;
    buildHash?: string;
    ttlSeconds?: number;
  }
): Promise<void> {
  try {
    const now = new Date();
    const entry: CachedDataEntry = {
      key,
      data: data as CachedData,
      dataVersion: options?.dataVersion,
      buildHash: options?.buildHash,
      updatedAt: now.toISOString(),
      expiresAt: options?.ttlSeconds
        ? new Date(now.getTime() + options.ttlSeconds * 1000).toISOString()
        : undefined,
    };

    await db.cache.put(entry);
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

/**
 * Get cache metadata without loading full data
 */
export async function getCacheMetadata(key: string) {
  try {
    const entry = await db.cache.get(key);
    if (!entry) return null;

    return {
      dataVersion: entry.dataVersion,
      buildHash: entry.buildHash,
      updatedAt: entry.updatedAt,
      expiresAt: entry.expiresAt,
      size: JSON.stringify(entry.data).length,
    };
  } catch (error) {
    console.error('Error reading cache metadata:', error);
    return null;
  }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  await db.cache.clear();
}

/**
 * Migrate data schema when structure changes
 * Detects old/incompatible cache formats and clears them for refetch
 *
 * @returns true if migration was needed and performed
 */
export async function migrateDataSchema(): Promise<boolean> {
  try {
    const indexCache = await db.cache.get(CACHE_KEYS.INDEX);
    if (!indexCache) return false;

    const data = indexCache.data as Record<string, unknown>;

    // Check for old format (raw districts array instead of transformed index)
    if ('districts' in data && Array.isArray(data.districts)) {
      console.log('🔄 Old data format detected (raw districts array)');
      console.log('   Clearing cache to trigger refetch in new format...');
      await db.cache.delete(CACHE_KEYS.INDEX);
      return true;
    }

    // Check for missing required fields in transformed index
    if (!('codeToIds' in data) || !('features' in data)) {
      console.log('🔄 Incomplete index format detected');
      console.log('   Clearing cache to trigger refetch...');
      await db.cache.delete(CACHE_KEYS.INDEX);
      return true;
    }

    // Check for version metadata (added in Sprint 3)
    // If missing, it's from an older build - clear to get versioned data
    if (!indexCache.dataVersion && 'version' in data && data.version === 1) {
      console.log('🔄 Pre-versioned cache detected');
      console.log('   Clearing cache to get version-tracked data...');
      await db.cache.delete(CACHE_KEYS.INDEX);
      return true;
    }

    // All checks passed - no migration needed
    return false;
  } catch (error) {
    console.error('Error during schema migration:', error);
    // On error, clear cache to be safe
    await db.cache.delete(CACHE_KEYS.INDEX);
    return true;
  }
}

// Progress management
const PROGRESS_ID = 'user-progress';

/**
 * Get or create user progress
 */
export async function getUserProgress(): Promise<UserProgress> {
  try {
    const existing = await db.progress.get(PROGRESS_ID);
    if (existing) {
      // Ensure new fields exist for backwards compatibility
      return {
        ...existing,
        quizErrors: existing.quizErrors || [],
        quizCorrected: existing.quizCorrected || [],
      };
    }
    
    // Create default progress
    const defaultProgress: UserProgress = {
      id: PROGRESS_ID,
      totalSearches: 0,
      discoveredKreise: [],
      quizCorrect: 0,
      quizTotal: 0,
      quizErrors: [],
      quizCorrected: [],
      badges: [],
      currentStreak: 0,
      lastActiveDate: '',
      updatedAt: new Date().toISOString(),
    };
    
    await db.progress.put(defaultProgress);
    return defaultProgress;
  } catch (error) {
    console.error('Error getting progress:', error);
    // Return default without persisting
    return {
      id: PROGRESS_ID,
      totalSearches: 0,
      discoveredKreise: [],
      quizCorrect: 0,
      quizTotal: 0,
      quizErrors: [],
      quizCorrected: [],
      badges: [],
      currentStreak: 0,
      lastActiveDate: '',
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Update user progress
 */
export async function updateProgress(
  updates: Partial<Omit<UserProgress, 'id'>>
): Promise<UserProgress> {
  const current = await getUserProgress();
  const updated: UserProgress = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await db.progress.put(updated);
  return updated;
}

/**
 * Record a search and check for badge eligibility
 */
export async function recordSearch(kreisId: string): Promise<Badge[]> {
  const progress = await getUserProgress();
  const newBadges: Badge[] = [];
  
  // Update search count
  const newSearchCount = progress.totalSearches + 1;
  
  // Add to discovered if new
  const discovered = progress.discoveredKreise.includes(kreisId)
    ? progress.discoveredKreise
    : [...progress.discoveredKreise, kreisId];
  
  // Update streak
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let newStreak = progress.currentStreak;
  if (progress.lastActiveDate === yesterday) {
    newStreak += 1;
  } else if (progress.lastActiveDate !== today) {
    newStreak = 1;
  }
  
  // Check for badges
  const existingBadgeIds = progress.badges.map(b => b.id);
  
  // First search badge
  if (newSearchCount === 1 && !existingBadgeIds.includes('first_search')) {
    const badge = BADGES.find(b => b.id === 'first_search')!;
    newBadges.push({ ...badge, earnedAt: new Date().toISOString() });
  }
  
  // Ten searches badge
  if (newSearchCount >= 10 && !existingBadgeIds.includes('ten_searches')) {
    const badge = BADGES.find(b => b.id === 'ten_searches')!;
    newBadges.push({ ...badge, earnedAt: new Date().toISOString() });
  }
  
  // Fifty searches badge
  if (newSearchCount >= 50 && !existingBadgeIds.includes('fifty_searches')) {
    const badge = BADGES.find(b => b.id === 'fifty_searches')!;
    newBadges.push({ ...badge, earnedAt: new Date().toISOString() });
  }
  
  // Streak badges
  if (newStreak >= 3 && !existingBadgeIds.includes('streak_3')) {
    const badge = BADGES.find(b => b.id === 'streak_3')!;
    newBadges.push({ ...badge, earnedAt: new Date().toISOString() });
  }
  
  if (newStreak >= 7 && !existingBadgeIds.includes('streak_7')) {
    const badge = BADGES.find(b => b.id === 'streak_7')!;
    newBadges.push({ ...badge, earnedAt: new Date().toISOString() });
  }
  
  // Save updates
  await updateProgress({
    totalSearches: newSearchCount,
    discoveredKreise: discovered,
    currentStreak: newStreak,
    lastActiveDate: today,
    badges: [...progress.badges, ...newBadges],
  });
  
  return newBadges;
}

/**
 * Record a quiz answer with error tracking
 */
export async function recordQuizAnswer(correct: boolean, kfzCode?: string): Promise<Badge[]> {
  const progress = await getUserProgress();
  const newBadges: Badge[] = [];
  
  const newTotal = progress.quizTotal + 1;
  const newCorrect = correct ? progress.quizCorrect + 1 : progress.quizCorrect;
  
  // Track errors
  const newErrors = [...progress.quizErrors];
  if (!correct && kfzCode && !newErrors.includes(kfzCode)) {
    newErrors.push(kfzCode);
  }
  
  const existingBadgeIds = progress.badges.map(b => b.id);
  
  // First quiz badge
  if (newTotal === 1 && !existingBadgeIds.includes('first_quiz')) {
    const badge = BADGES.find(b => b.id === 'first_quiz')!;
    newBadges.push({ ...badge, earnedAt: new Date().toISOString() });
  }
  
  // Quiz master badge
  if (newCorrect >= 10 && !existingBadgeIds.includes('quiz_master')) {
    const badge = BADGES.find(b => b.id === 'quiz_master')!;
    newBadges.push({ ...badge, earnedAt: new Date().toISOString() });
  }
  
  await updateProgress({
    quizTotal: newTotal,
    quizCorrect: newCorrect,
    quizErrors: newErrors,
    badges: [...progress.badges, ...newBadges],
  });
  
  return newBadges;
}

/**
 * Record a corrected answer in error quiz
 */
export async function recordCorrectedAnswer(kfzCode: string): Promise<void> {
  const progress = await getUserProgress();
  
  // Remove from errors, add to corrected
  const newErrors = progress.quizErrors.filter(c => c !== kfzCode);
  const newCorrected = progress.quizCorrected.includes(kfzCode) 
    ? progress.quizCorrected 
    : [...progress.quizCorrected, kfzCode];
  
  await updateProgress({
    quizErrors: newErrors,
    quizCorrected: newCorrected,
    quizCorrect: progress.quizCorrect + 1, // Count as correct now
  });
}

/**
 * Reset all quiz progress
 */
export async function resetQuizProgress(): Promise<void> {
  await updateProgress({
    quizCorrect: 0,
    quizTotal: 0,
    quizErrors: [],
    quizCorrected: [],
  });
}

/**
 * Reset all user data
 */
export async function resetAllData(): Promise<void> {
  await db.progress.clear();
  await db.settings.clear();
}

// Settings management
const SETTINGS_ID = 'user-settings';

/**
 * Get or create user settings
 */
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const existing = await db.settings.get(SETTINGS_ID);
    if (existing) return existing;
    
    // Create default settings
    const defaultSettings: UserSettings = {
      id: SETTINGS_ID,
      displayName: '',
      darkMode: 'system',
      updatedAt: new Date().toISOString(),
    };
    
    await db.settings.put(defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      id: SETTINGS_ID,
      displayName: '',
      darkMode: 'system',
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  updates: Partial<Omit<UserSettings, 'id'>>
): Promise<UserSettings> {
  const current = await getUserSettings();
  const updated: UserSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await db.settings.put(updated);
  return updated;
}
