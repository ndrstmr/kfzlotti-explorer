import { describe, it, expect, beforeEach } from 'vitest';
import {
  searchKfzCode,
  getAutocompleteSuggestions,
  getAllKfzCodes,
  getRandomKfzCode,
  getRandomResults,
} from './search';
import type { KfzIndex } from '@/data/schema';

// Mock KFZ index for testing
const mockIndex: KfzIndex = {
  version: 1,
  generated: '2025-01-01',
  source: 'test',
  codeToIds: {
    'B': ['berlin'],
    'HH': ['hamburg'],
    'M': ['muenchen'],
    'BGL': ['berchtesgaden'],
    'K': ['koeln'],
    'KO': ['koblenz'],
    'KR': ['krefeld'],
  },
  features: {
    'berlin': {
      name: 'Berlin',
      ars: '11000000',
      kfzCodes: ['B'],
      center: [52.52, 13.405],
    },
    'hamburg': {
      name: 'Hamburg',
      ars: '02000000',
      kfzCodes: ['HH'],
      center: [53.55, 10.0],
    },
    'muenchen': {
      name: 'München',
      ars: '09162000',
      kfzCodes: ['M'],
      center: [48.1351, 11.582],
    },
    'berchtesgaden': {
      name: 'Berchtesgadener Land',
      ars: '09172000',
      kfzCodes: ['BGL'],
      center: [47.7, 13.0],
    },
    'koeln': {
      name: 'Köln',
      ars: '05315000',
      kfzCodes: ['K'],
      center: [50.9375, 6.9603],
    },
    'koblenz': {
      name: 'Koblenz',
      ars: '07111000',
      kfzCodes: ['KO'],
      center: [50.3569, 7.5889],
    },
    'krefeld': {
      name: 'Krefeld',
      ars: '05114000',
      kfzCodes: ['KR'],
      center: [51.3388, 6.5853],
    },
  },
};

describe('searchKfzCode', () => {
  it('finds exact matches', () => {
    const results = searchKfzCode('B', mockIndex);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Berlin');
    expect(results[0].kfzCode).toBe('B');
  });

  it('normalizes input (lowercase to uppercase)', () => {
    const results = searchKfzCode('hh', mockIndex);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Hamburg');
  });

  it('handles multi-character codes', () => {
    const results = searchKfzCode('BGL', mockIndex);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Berchtesgadener Land');
  });

  it('returns empty array for non-existent codes', () => {
    const results = searchKfzCode('XXX', mockIndex);
    expect(results).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    const results = searchKfzCode('', mockIndex);
    expect(results).toEqual([]);
  });

  it('includes all relevant information in results', () => {
    const results = searchKfzCode('M', mockIndex);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('name');
    expect(results[0]).toHaveProperty('ars');
    expect(results[0]).toHaveProperty('kfzCode');
    expect(results[0]).toHaveProperty('kfzCodes');
    expect(results[0]).toHaveProperty('bundesland');
    expect(results[0]).toHaveProperty('bundeslandShort');
    expect(results[0]).toHaveProperty('center');
    expect(Array.isArray(results[0].center)).toBe(true);
    expect(results[0].center).toHaveLength(2);
  });
});

describe('getAutocompleteSuggestions', () => {
  it('returns prefix matches', () => {
    const suggestions = getAutocompleteSuggestions('K', mockIndex);
    expect(suggestions).toContain('K');
    expect(suggestions).toContain('KO');
    expect(suggestions).toContain('KR');
  });

  it('sorts by length then alphabetically', () => {
    const suggestions = getAutocompleteSuggestions('K', mockIndex);
    // K (1 char) should come before KO, KR (2 chars)
    expect(suggestions.indexOf('K')).toBeLessThan(suggestions.indexOf('KO'));
    expect(suggestions.indexOf('K')).toBeLessThan(suggestions.indexOf('KR'));
    // KO should come before KR (alphabetically)
    expect(suggestions.indexOf('KO')).toBeLessThan(suggestions.indexOf('KR'));
  });

  it('respects limit parameter', () => {
    const suggestions = getAutocompleteSuggestions('K', mockIndex, 2);
    expect(suggestions).toHaveLength(2);
  });

  it('returns empty array for no matches', () => {
    const suggestions = getAutocompleteSuggestions('X', mockIndex);
    expect(suggestions).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    const suggestions = getAutocompleteSuggestions('', mockIndex);
    expect(suggestions).toEqual([]);
  });

  it('normalizes input', () => {
    const suggestions = getAutocompleteSuggestions('k', mockIndex);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain('K');
  });
});

describe('getAllKfzCodes', () => {
  it('returns all codes', () => {
    const codes = getAllKfzCodes(mockIndex);
    expect(codes).toHaveLength(7);
    expect(codes).toContain('B');
    expect(codes).toContain('HH');
    expect(codes).toContain('M');
    expect(codes).toContain('BGL');
  });

  it('returns sorted codes', () => {
    const codes = getAllKfzCodes(mockIndex);
    const sorted = [...codes].sort();
    expect(codes).toEqual(sorted);
  });
});

describe('getRandomKfzCode', () => {
  it('returns a valid code from the index', () => {
    const code = getRandomKfzCode(mockIndex);
    const allCodes = getAllKfzCodes(mockIndex);
    expect(allCodes).toContain(code);
  });

  it('returns a string', () => {
    const code = getRandomKfzCode(mockIndex);
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });

  // Note: We can't test randomness deterministically, but we can verify it returns valid codes
  it('returns different codes over multiple calls (probabilistic)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add(getRandomKfzCode(mockIndex));
    }
    // With 7 codes, after 20 tries we should have seen at least 2 different ones
    expect(codes.size).toBeGreaterThanOrEqual(2);
  });
});

describe('getRandomResults', () => {
  it('returns the requested number of results', () => {
    const results = getRandomResults(mockIndex, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('returns valid search results', () => {
    const results = getRandomResults(mockIndex, 2);
    expect(results.length).toBeGreaterThan(0);
    results.forEach(result => {
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('kfzCode');
      expect(result).toHaveProperty('center');
    });
  });

  it('respects the count parameter', () => {
    const results = getRandomResults(mockIndex, 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('returns different results over multiple calls (probabilistic)', () => {
    const allResults = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const results = getRandomResults(mockIndex, 2);
      results.forEach(r => allResults.add(r.id));
    }
    // After 10 calls with 2 results each, we should have seen at least 3 different IDs
    expect(allResults.size).toBeGreaterThanOrEqual(3);
  });
});
