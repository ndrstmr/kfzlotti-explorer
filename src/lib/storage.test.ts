/**
 * Tests for IndexedDB storage layer (Dexie)
 * Tests cache management, user progress, and badge logic
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import 'fake-indexeddb/auto'; // Polyfill IndexedDB for testing
import {
  db,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  getCacheMetadata,
  clearCache,
  migrateDataSchema,
  getUserProgress,
  recordSearch,
  recordQuizAnswer,
} from './storage';
import type { KfzIndex, UserProgress } from '@/data/schema';

describe('Storage Layer', () => {
  // Clean up database before each test
  beforeEach(async () => {
    await db.cache.clear();
    await db.progress.clear();
    await db.settings.clear();
  });

  // Close database after all tests
  afterEach(async () => {
    // Keep DB open for other tests
  });

  describe('Cache Management', () => {
    it('should cache and retrieve data', async () => {
      const testData = { test: 'value', nested: { key: 123 } };

      await setCachedData(CACHE_KEYS.INDEX, testData);
      const retrieved = await getCachedData<typeof testData>(CACHE_KEYS.INDEX);

      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent cache key', async () => {
      const result = await getCachedData('non-existent-key');
      expect(result).toBeNull();
    });

    it('should store cache with version metadata', async () => {
      const testData = { test: 'value' };
      const dataVersion = '2026-01-01-123456';
      const buildHash = 'abc123';

      await setCachedData(CACHE_KEYS.INDEX, testData, {
        dataVersion,
        buildHash,
      });

      const metadata = await getCacheMetadata(CACHE_KEYS.INDEX);

      expect(metadata).toBeTruthy();
      expect(metadata?.dataVersion).toBe(dataVersion);
      expect(metadata?.buildHash).toBe(buildHash);
      expect(metadata?.updatedAt).toBeTruthy();
    });

    it('should handle TTL expiration', async () => {
      const testData = { test: 'value' };

      // Set cache with 1 second TTL
      await setCachedData(CACHE_KEYS.INDEX, testData, {
        ttlSeconds: 1,
      });

      // Should be available immediately
      const fresh = await getCachedData(CACHE_KEYS.INDEX);
      expect(fresh).toEqual(testData);

      // Wait for expiration (1.1 seconds)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired and return null
      const expired = await getCachedData(CACHE_KEYS.INDEX);
      expect(expired).toBeNull();
    });

    it('should ignore expired cache when option is set', async () => {
      const testData = { test: 'value' };

      // Set cache with 1 second TTL
      await setCachedData(CACHE_KEYS.INDEX, testData, {
        ttlSeconds: 1,
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should still return data when ignoring expiration
      const result = await getCachedData(CACHE_KEYS.INDEX, {
        ignoreExpired: true,
      });
      expect(result).toEqual(testData);
    });

    it('should clear all cached data', async () => {
      await setCachedData(CACHE_KEYS.INDEX, { index: 'data' });
      await setCachedData(CACHE_KEYS.TOPO, { topo: 'data' });
      await setCachedData(CACHE_KEYS.SEATS, { seats: 'data' });

      await clearCache();

      const index = await getCachedData(CACHE_KEYS.INDEX);
      const topo = await getCachedData(CACHE_KEYS.TOPO);
      const seats = await getCachedData(CACHE_KEYS.SEATS);

      expect(index).toBeNull();
      expect(topo).toBeNull();
      expect(seats).toBeNull();
    });

    it('should calculate cache size in metadata', async () => {
      const testData = { test: 'value' };

      await setCachedData(CACHE_KEYS.INDEX, testData);
      const metadata = await getCacheMetadata(CACHE_KEYS.INDEX);

      expect(metadata?.size).toBeGreaterThan(0);
      expect(metadata?.size).toBe(JSON.stringify(testData).length);
    });
  });

  describe('Data Migration', () => {
    it('should detect and migrate old districts array format', async () => {
      // Old format: raw districts array
      const oldFormatData = {
        version: '1.0',
        districts: [
          { name: 'Berlin', codes: ['B'], state: 'BE' },
          { name: 'München', codes: ['M'], state: 'BY' },
        ],
      };

      await setCachedData(CACHE_KEYS.INDEX, oldFormatData);

      const migrated = await migrateDataSchema();

      expect(migrated).toBe(true);

      // Cache should be cleared
      const afterMigration = await getCachedData(CACHE_KEYS.INDEX);
      expect(afterMigration).toBeNull();
    });

    it('should detect and migrate incomplete index format', async () => {
      // Missing codeToIds or features
      const incompleteData = {
        version: 1,
        generated: '2026-01-01',
        // Missing: codeToIds, features
      };

      await setCachedData(CACHE_KEYS.INDEX, incompleteData);

      const migrated = await migrateDataSchema();

      expect(migrated).toBe(true);
      expect(await getCachedData(CACHE_KEYS.INDEX)).toBeNull();
    });

    it('should not migrate valid transformed index format', async () => {
      // Valid format
      const validData: Partial<KfzIndex> = {
        version: 1,
        generated: '2026-01-01',
        source: 'test',
        codeToIds: { B: ['district_0'] },
        features: {
          district_0: {
            id: 'district_0',
            name: 'Berlin',
            codes: ['B'],
            state: 'BE',
            center: [52.52, 13.4],
          },
        },
      };

      await setCachedData(CACHE_KEYS.INDEX, validData, {
        dataVersion: '2026-01-01-123456',
      });

      const migrated = await migrateDataSchema();

      expect(migrated).toBe(false);

      // Cache should still exist
      const afterCheck = await getCachedData(CACHE_KEYS.INDEX);
      expect(afterCheck).toEqual(validData);
    });

    it('should handle migration errors gracefully', async () => {
      // Set invalid data that will cause errors during migration check
      await setCachedData(CACHE_KEYS.INDEX, null as unknown as Record<string, unknown>);

      const migrated = await migrateDataSchema();

      // Should clear cache on error
      expect(migrated).toBe(true);
      expect(await getCachedData(CACHE_KEYS.INDEX)).toBeNull();
    });
  });

  describe('User Progress', () => {
    it('should create default progress on first access', async () => {
      const progress = await getUserProgress();

      expect(progress).toBeTruthy();
      expect(progress.id).toBe('user-progress');
      expect(progress.totalSearches).toBe(0);
      expect(progress.discoveredKreise).toEqual([]);
      expect(progress.quizCorrect).toBe(0);
      expect(progress.quizTotal).toBe(0);
      expect(progress.quizErrors).toEqual([]);
      expect(progress.quizCorrected).toEqual([]);
      expect(progress.badges).toEqual([]);
      expect(progress.currentStreak).toBe(0);
      expect(progress.lastActiveDate).toBe('');
    });

    it('should persist progress between calls', async () => {
      const progress1 = await getUserProgress();
      const progress2 = await getUserProgress();

      expect(progress1).toEqual(progress2);
    });

    it('should ensure backwards compatibility with missing fields', async () => {
      // Simulate old progress without quizErrors/quizCorrected
      await db.progress.put({
        id: 'user-progress',
        totalSearches: 5,
        discoveredKreise: ['district_0'],
        quizCorrect: 3,
        quizTotal: 5,
        badges: [],
        currentStreak: 1,
        lastActiveDate: '2026-01-01',
        updatedAt: new Date().toISOString(),
        // Missing: quizErrors, quizCorrected (testing backwards compatibility)
      } as Omit<UserProgress, 'quizErrors' | 'quizCorrected'>);

      const progress = await getUserProgress();

      expect(progress.quizErrors).toEqual([]);
      expect(progress.quizCorrected).toEqual([]);
    });
  });

  describe('Search Recording & Badge Logic', () => {
    it('should record first search and unlock first_search badge', async () => {
      const badges = await recordSearch('district_0');

      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('first_search');
      expect(badges[0].earnedAt).toBeTruthy();

      const progress = await getUserProgress();
      expect(progress.totalSearches).toBe(1);
      expect(progress.discoveredKreise).toContain('district_0');
      expect(progress.badges).toHaveLength(1);
      expect(progress.badges[0].id).toBe('first_search');
    });

    it('should unlock ten_searches badge at 10 searches', async () => {
      // Perform 9 searches
      for (let i = 0; i < 9; i++) {
        await recordSearch(`district_${i}`);
      }

      // 10th search should unlock badge
      const badges = await recordSearch('district_9');

      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('ten_searches');

      const progress = await getUserProgress();
      expect(progress.totalSearches).toBe(10);
      expect(progress.badges).toHaveLength(2); // first_search + ten_searches
    });

    it('should unlock fifty_searches badge at 50 searches', async () => {
      // Perform 49 searches
      for (let i = 0; i < 49; i++) {
        await recordSearch(`district_${i % 30}`); // Reuse some IDs
      }

      // 50th search should unlock badge
      const badges = await recordSearch('district_50');

      const allBadges = badges.filter(b => b.id === 'fifty_searches');
      expect(allBadges).toHaveLength(1);

      const progress = await getUserProgress();
      expect(progress.totalSearches).toBe(50);
    });

    it('should not duplicate kreis in discoveredKreise', async () => {
      await recordSearch('district_0');
      await recordSearch('district_0');
      await recordSearch('district_0');

      const progress = await getUserProgress();
      expect(progress.discoveredKreise).toEqual(['district_0']);
    });

    it('should track daily streak correctly', async () => {
      // Day 1
      await recordSearch('district_0');
      let progress = await getUserProgress();
      expect(progress.currentStreak).toBe(1);

      // Same day - no streak increase
      await recordSearch('district_1');
      progress = await getUserProgress();
      expect(progress.currentStreak).toBe(1);
    });

    it('should unlock streak_3 badge at 3-day streak', async () => {
      // Manually set progress with 2-day streak on yesterday
      // Next search today will make it 3-day streak
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      await db.progress.put({
        id: 'user-progress',
        totalSearches: 2,
        discoveredKreise: ['d1', 'd2'],
        quizCorrect: 0,
        quizTotal: 0,
        quizErrors: [],
        quizCorrected: [],
        badges: [
          { id: 'first_search', name: 'First', description: '', earnedAt: '2026-01-01' },
        ],
        currentStreak: 2, // Will become 3 on next search
        lastActiveDate: yesterday, // Yesterday (date-only format)
        updatedAt: new Date().toISOString(),
      });

      const badges = await recordSearch('district_3');

      const streakBadge = badges.find(b => b.id === 'streak_3');
      expect(streakBadge).toBeTruthy();
      expect(streakBadge?.id).toBe('streak_3');

      const progress = await getUserProgress();
      expect(progress.currentStreak).toBe(3);
    });

    it('should not award same badge twice', async () => {
      // First search - get badge
      const badges1 = await recordSearch('district_0');
      expect(badges1).toHaveLength(1);
      expect(badges1[0].id).toBe('first_search');

      // More searches - should not get first_search again
      const badges2 = await recordSearch('district_1');
      expect(badges2).toHaveLength(0);
    });
  });

  describe('Quiz Recording & Badge Logic', () => {
    it('should record correct quiz answer', async () => {
      const badges = await recordQuizAnswer(true, 'B');

      const progress = await getUserProgress();
      expect(progress.quizCorrect).toBe(1);
      expect(progress.quizTotal).toBe(1);
      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('first_quiz');
    });

    it('should record incorrect quiz answer', async () => {
      const badges = await recordQuizAnswer(false, 'B');

      const progress = await getUserProgress();
      expect(progress.quizCorrect).toBe(0);
      expect(progress.quizTotal).toBe(1);
      expect(badges).toHaveLength(1); // Still gets first_quiz badge
    });

    it('should unlock quiz_master badge at 10 correct answers', async () => {
      // Answer 9 correctly
      for (let i = 0; i < 9; i++) {
        await recordQuizAnswer(true);
      }

      // 10th correct answer
      const badges = await recordQuizAnswer(true);

      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('quiz_master');

      const progress = await getUserProgress();
      expect(progress.quizCorrect).toBe(10);
      expect(progress.quizTotal).toBe(10);
    });

    it('should track quiz errors with code', async () => {
      await recordQuizAnswer(false, 'B');
      await recordQuizAnswer(false, 'M');
      await recordQuizAnswer(false, 'B'); // Duplicate

      const progress = await getUserProgress();
      expect(progress.quizErrors).toContain('B');
      expect(progress.quizErrors).toContain('M');
      // Note: Duplicates might be allowed - depends on implementation
    });

    it('should not award quiz_master badge on incorrect answers', async () => {
      // Answer 9 correctly
      for (let i = 0; i < 9; i++) {
        await recordQuizAnswer(true);
      }

      // 10th answer is wrong
      const badges = await recordQuizAnswer(false);

      const masterBadge = badges.find(b => b.id === 'quiz_master');
      expect(masterBadge).toBeUndefined();

      const progress = await getUserProgress();
      expect(progress.quizCorrect).toBe(9);
      expect(progress.quizTotal).toBe(10);
    });
  });
});
