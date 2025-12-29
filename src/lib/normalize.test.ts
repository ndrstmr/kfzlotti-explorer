import { describe, it, expect } from 'vitest';
import {
  normalizeKfzCode,
  parseKfzCodes,
  isValidKfzCode,
  formatDistance,
  getDistanceComparison,
} from './normalize';

describe('normalizeKfzCode', () => {
  it('converts lowercase to uppercase', () => {
    expect(normalizeKfzCode('hh')).toBe('HH');
    expect(normalizeKfzCode('m')).toBe('M');
  });

  it('removes whitespace', () => {
    expect(normalizeKfzCode(' HH ')).toBe('HH');
    expect(normalizeKfzCode('  M  ')).toBe('M');
  });

  it('removes non-letter characters', () => {
    expect(normalizeKfzCode('H1H2')).toBe('HH');
    expect(normalizeKfzCode('M-123')).toBe('M');
    expect(normalizeKfzCode('B!@#$')).toBe('B');
  });

  it('preserves German umlauts', () => {
    expect(normalizeKfzCode('ö')).toBe('Ö');
    expect(normalizeKfzCode('ü')).toBe('Ü');
    expect(normalizeKfzCode('ä')).toBe('Ä');
  });

  it('limits length to 3 characters', () => {
    expect(normalizeKfzCode('ABCD')).toBe('ABC');
    expect(normalizeKfzCode('HAMBURG')).toBe('HAM');
  });

  it('handles edge cases', () => {
    expect(normalizeKfzCode('')).toBe('');
    expect(normalizeKfzCode('   ')).toBe('');
    expect(normalizeKfzCode('123')).toBe('');
  });

  it('handles invalid inputs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeKfzCode(null as any)).toBe('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeKfzCode(undefined as any)).toBe('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeKfzCode(123 as any)).toBe('');
  });
});

describe('parseKfzCodes', () => {
  it('parses single codes', () => {
    expect(parseKfzCodes('HH')).toEqual(['HH']);
    expect(parseKfzCodes('M')).toEqual(['M']);
  });

  it('parses multiple space-separated codes', () => {
    expect(parseKfzCodes('HH M B')).toEqual(['HH', 'M', 'B']);
    expect(parseKfzCodes('HH   M   B')).toEqual(['HH', 'M', 'B']);
  });

  it('converts to uppercase', () => {
    expect(parseKfzCodes('hh m b')).toEqual(['HH', 'M', 'B']);
  });

  it('filters out invalid codes', () => {
    expect(parseKfzCodes('HH 123 M')).toEqual(['HH', 'M']);
    expect(parseKfzCodes('HH TOOLONG M')).toEqual(['HH', 'M']);
  });

  it('deduplicates codes', () => {
    expect(parseKfzCodes('HH M HH B M')).toEqual(['HH', 'M', 'B']);
  });

  it('handles edge cases', () => {
    expect(parseKfzCodes('')).toEqual([]);
    expect(parseKfzCodes('   ')).toEqual([]);
  });

  it('handles invalid inputs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseKfzCodes(null as any)).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseKfzCodes(undefined as any)).toEqual([]);
  });
});

describe('isValidKfzCode', () => {
  it('validates correct codes', () => {
    expect(isValidKfzCode('B')).toBe(true);
    expect(isValidKfzCode('HH')).toBe(true);
    expect(isValidKfzCode('BGL')).toBe(true);
  });

  it('validates codes with umlauts', () => {
    expect(isValidKfzCode('Ö')).toBe(true);
    expect(isValidKfzCode('MÜ')).toBe(true);
  });

  it('rejects invalid codes', () => {
    expect(isValidKfzCode('')).toBe(false);
    expect(isValidKfzCode('   ')).toBe(false);
    expect(isValidKfzCode('123')).toBe(false);
  });

  it('accepts long codes (they get truncated to 3 chars)', () => {
    // 'TOOLONG' becomes 'TOO' after normalization, which is valid
    expect(isValidKfzCode('TOOLONG')).toBe(true);
  });

  it('handles invalid inputs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidKfzCode(null as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidKfzCode(undefined as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidKfzCode(123 as any)).toBe(false);
  });
});

describe('formatDistance', () => {
  it('formats very short distances', () => {
    expect(formatDistance(0.5)).toBe('weniger als 1 km');
    expect(formatDistance(0.9)).toBe('weniger als 1 km');
  });

  it('formats short distances (1-10 km)', () => {
    expect(formatDistance(1)).toBe('ca. 1 km');
    expect(formatDistance(5.4)).toBe('ca. 5 km');
    expect(formatDistance(9.7)).toBe('ca. 10 km');
  });

  it('formats medium distances (10-100 km) rounded to 5', () => {
    expect(formatDistance(12)).toBe('ca. 10 km');
    expect(formatDistance(23)).toBe('ca. 25 km');
    expect(formatDistance(48)).toBe('ca. 50 km');
  });

  it('formats long distances (100+ km) rounded to 10', () => {
    expect(formatDistance(123)).toBe('ca. 120 km');
    expect(formatDistance(456)).toBe('ca. 460 km');
    expect(formatDistance(999)).toBe('ca. 1000 km');
  });
});

describe('getDistanceComparison', () => {
  it('suggests bike for very short distances', () => {
    const result = getDistanceComparison(3);
    expect(result).toContain('🚴');
    expect(result).toContain('Fahrrad');
  });

  it('suggests short car ride for 5-20 km', () => {
    const result = getDistanceComparison(15);
    expect(result).toContain('🚗');
    expect(result).toContain('kurz');
  });

  it('suggests longer car ride for 20-100 km', () => {
    const result = getDistanceComparison(50);
    expect(result).toContain('🚗');
    expect(result).toContain('länger');
  });

  it('suggests train for 100-300 km', () => {
    const result = getDistanceComparison(200);
    expect(result).toContain('🚄');
    expect(result).toContain('Zug');
  });

  it('notes very long distances (300+ km)', () => {
    const result = getDistanceComparison(500);
    expect(result).toContain('✈️');
    expect(result).toContain('weit');
  });
});
