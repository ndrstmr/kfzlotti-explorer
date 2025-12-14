/**
 * IndexedDB storage using Dexie
 * Stores cached data and user progress
 */

import Dexie, { type Table } from 'dexie';
import type { UserProgress, Badge, KfzIndex, KreissitzData } from '@/data/schema';
import { BADGES } from '@/data/schema';

// Database schema
class KfzLottiDB extends Dexie {
  cache!: Table<{ key: string; data: any; updatedAt: string }>;
  progress!: Table<UserProgress>;

  constructor() {
    super('KfzLottiDB');
    
    this.version(1).stores({
      cache: 'key',
      progress: 'id',
    });
  }
}

export const db = new KfzLottiDB();

// Cache keys
export const CACHE_KEYS = {
  INDEX: 'kfz-index',
  TOPO: 'kfz-topo',
  SEATS: 'kfz-seats',
} as const;

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await db.cache.get(key);
    return cached?.data || null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await db.cache.put({
      key,
      data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  await db.cache.clear();
}

// Progress management
const PROGRESS_ID = 'user-progress';

/**
 * Get or create user progress
 */
export async function getUserProgress(): Promise<UserProgress> {
  try {
    const existing = await db.progress.get(PROGRESS_ID);
    if (existing) return existing;
    
    // Create default progress
    const defaultProgress: UserProgress = {
      id: PROGRESS_ID,
      totalSearches: 0,
      discoveredKreise: [],
      quizCorrect: 0,
      quizTotal: 0,
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
 * Record a quiz answer
 */
export async function recordQuizAnswer(correct: boolean): Promise<Badge[]> {
  const progress = await getUserProgress();
  const newBadges: Badge[] = [];
  
  const newTotal = progress.quizTotal + 1;
  const newCorrect = correct ? progress.quizCorrect + 1 : progress.quizCorrect;
  
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
    badges: [...progress.badges, ...newBadges],
  });
  
  return newBadges;
}
