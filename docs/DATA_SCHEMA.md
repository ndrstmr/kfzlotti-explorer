# KFZlotti Data Schema Documentation

This document describes the data schema for KFZlotti and provides guidelines for extending it with new fields.

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Data Pipeline](#data-pipeline)
3. [Adding New Fields](#adding-new-fields)
4. [Migration Strategy](#migration-strategy)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

---

## Schema Overview

### Current Data Flow

```
Raw Data (index.json)
    ↓
Build-Time Transformation (scripts/transform-index.ts)
    ↓
Pre-Transformed Index (index.transformed.json)
    ↓
Runtime Loading (useKfzData.ts)
    ↓
IndexedDB Cache + In-Memory State
```

### Core Data Structures

#### 1. Raw Index Data (Input)

**File:** `public/data/index.json`

```typescript
{
  version: string;         // Data version identifier
  source: string;          // Attribution
  license: string;         // License info
  districts: Array<{
    name: string;          // Official district name
    codes: string[];       // KFZ codes (e.g., ["M", "MB"])
    state: string;         // Bundesland code
    center: [number, number]; // [lng, lat]
    ars?: string;          // Amtlicher Regionalschlüssel

    // V2 Fields (future) - all optional:
    kreisstadt?: string;
    population?: number;
    area_km2?: number;
    website?: string;
  }>
}
```

#### 2. Transformed Index (Build Output)

**File:** `public/data/index.transformed.json`

Generated at build time with optimized structure for fast lookups:

```typescript
{
  version: 1,
  generated: string;          // ISO timestamp
  source: string;
  dataVersion: string;        // YYYY-MM-DD-HHmmss
  buildHash: string;          // SHA-256 hash (8 chars)

  // O(1) lookup maps
  codeToIds: {
    "M": ["district_123"],    // Uppercase code → feature IDs
    "MB": ["district_123"],
  },

  features: {
    "district_123": {
      name: "München",
      ars: "09162",
      kfzCodes: ["M", "MB"],
      center: [11.576124, 48.137154],

      // V2 fields (when added):
      kreisstadt?: "München",
      population?: 1471508,
      areaKm2?: 310.7,
    }
  }
}
```

#### 3. TypeScript Schema

**File:** `src/data/schema.ts`

```typescript
// Current (V1)
export interface KfzIndex {
  version: number;
  generated: string;
  source: string;
  dataVersion?: string;
  buildHash?: string;
  codeToIds: Record<string, string[]>;
  features: Record<string, {
    name: string;
    ars: string;
    kfzCodes: string[];
    center: [number, number];
  }>;
}

// Future (V2) - Extended with optional fields
export interface DistrictFeatureV2 {
  name: string;
  ars: string;
  kfzCodes: string[];
  center: [number, number];

  // All new fields MUST be optional
  kreisstadt?: string;
  kreisstadtCoords?: [number, number];
  population?: number;
  areaKm2?: number;
  bundesland?: string;
  bundeslandName?: string;
  website?: string;
  wikidataId?: string;
}
```

---

## Data Pipeline

### Build-Time Processing

Runs automatically before every production build via `prebuild` script:

```bash
bun run build:data
```

**Steps:**

1. **Validation** (`scripts/validate-data.ts`)
   - Checks code format (1-3 uppercase letters)
   - Validates coordinates (Germany bounds)
   - Ensures required fields exist

2. **Transformation** (`scripts/transform-index.ts`)
   - Converts `districts[]` array to `codeToIds` + `features` maps
   - Generates `dataVersion` (YYYY-MM-DD-HHmmss)
   - Calculates `buildHash` (SHA-256 of source data)
   - Outputs to `public/data/index.transformed.json`

3. **Fallback Generation** (`scripts/generate-fallback.ts`)
   - Creates comprehensive offline fallback
   - Outputs to `src/data/generated-fallback.ts` (TypeScript module)
   - Contains all 366+ districts for immediate offline access

4. **Minification** (`scripts/minify-json.ts`)
   - Compresses JSON files (removes whitespace)
   - Reports size savings

### Runtime Loading

**File:** `src/hooks/useKfzData.ts`

```typescript
const loadData = async () => {
  // 1. Run migration check
  await migrateDataSchema();

  // 2. Try cache first
  let index = await getCachedData<KfzIndex>(CACHE_KEYS.INDEX);

  // 3. Fetch if online and cache missing/stale
  if (!index || navigator.onLine) {
    const response = await fetch('/data/index.transformed.json', {
      headers: cachedMeta?.dataVersion
        ? { 'If-None-Match': cachedMeta.dataVersion }
        : {},
    });

    if (response.ok && response.status !== 304) {
      const freshData = await response.json();
      if (freshData.dataVersion !== cachedMeta?.dataVersion) {
        index = freshData;
        await setCachedData(CACHE_KEYS.INDEX, index, {
          dataVersion: index.dataVersion,
          buildHash: index.buildHash,
        });
      }
    }
  }

  // 4. Fallback if still no data
  if (!index) {
    index = GENERATED_FALLBACK;
  }
};
```

---

## Adding New Fields

### Step-by-Step Guide

#### 1. Update Raw Data

**File:** `public/data/index.json`

Add new optional field to district objects:

```json
{
  "name": "München",
  "codes": ["M", "MB"],
  "state": "BY",
  "center": [11.576124, 48.137154],
  "ars": "09162",
  "kreisstadt": "München",           // ← NEW
  "population": 1471508               // ← NEW
}
```

**Rules:**
- ✅ **Always optional** (not all districts may have data)
- ✅ **Use camelCase** for field names
- ✅ **Document in code comments** what the field means
- ❌ **Never remove existing fields** (breaks backwards compatibility)
- ❌ **Never change field types** (string → number etc.)

#### 2. Update TypeScript Schema

**File:** `src/data/schema.ts`

Add field to `DistrictFeatureV2` interface:

```typescript
export interface DistrictFeatureV2 {
  // Existing fields
  name: string;
  ars: string;
  kfzCodes: string[];
  center: [number, number];

  // V2 fields
  kreisstadt?: string;
  population?: number;           // ← ADD HERE
  // ...
}
```

#### 3. Update Validation (Optional)

**File:** `scripts/validate-data.ts`

Add validation for new field if needed:

```typescript
function validateKfzIndex(data: RawIndexData): string[] {
  const errors: string[] = [];

  data.districts.forEach((district, index) => {
    // Validate population is positive number
    if (district.population !== undefined) {
      if (typeof district.population !== 'number' || district.population < 0) {
        errors.push(`District ${index}: Invalid population value`);
      }
    }
  });

  return errors;
}
```

#### 4. Update Transform Script

**File:** `scripts/transform-index.ts`

Ensure new field passes through transformation:

```typescript
function transformToKfzIndex(raw: RawIndexData) {
  raw.districts.forEach((district, index) => {
    features[id] = {
      name: district.name,
      ars: district.ars || district.state,
      kfzCodes: district.codes,
      center: district.center,

      // Pass through V2 fields if present
      ...(district.kreisstadt && { kreisstadt: district.kreisstadt }),
      ...(district.population && { population: district.population }),
    };
  });
}
```

#### 5. Update UI Components

Display new field in relevant components:

**File:** `src/components/ResultCards.tsx`

```typescript
{feature.population && (
  <div className="text-sm text-muted-foreground">
    Einwohner: {feature.population.toLocaleString('de-DE')}
  </div>
)}
```

#### 6. Build and Test

```bash
# Rebuild data with new field
bun run build:data

# Verify in output
cat public/data/index.transformed.json | grep population

# Full build
bun run build

# Test in browser
bun run preview
```

---

## Migration Strategy

### Automatic Migration

**File:** `src/lib/storage.ts` - `migrateDataSchema()`

The migration handler automatically detects and fixes incompatible cache formats:

```typescript
export async function migrateDataSchema(): Promise<boolean> {
  const indexCache = await db.cache.get(CACHE_KEYS.INDEX);
  if (!indexCache) return false;

  const data = indexCache.data as any;

  // Check 1: Old raw format (districts array)
  if (data.districts && Array.isArray(data.districts)) {
    console.log('🔄 Old data format detected');
    await db.cache.delete(CACHE_KEYS.INDEX);
    return true;
  }

  // Check 2: Missing required fields
  if (!data.codeToIds || !data.features) {
    console.log('🔄 Incomplete index format detected');
    await db.cache.delete(CACHE_KEYS.INDEX);
    return true;
  }

  // Check 3: Pre-versioned cache
  if (!indexCache.dataVersion) {
    console.log('🔄 Pre-versioned cache detected');
    await db.cache.delete(CACHE_KEYS.INDEX);
    return true;
  }

  return false; // No migration needed
}
```

**When it runs:**
- On every app load (before data loading)
- Automatically detects old formats
- Clears invalid cache → triggers fresh fetch

### Adding New Migration Checks

When changing data structure, add a new check to `migrateDataSchema()`:

```typescript
// Check 4: Example - new required field added
if (data.version === 1 && !data.newRequiredField) {
  console.log('🔄 Old version detected, missing newRequiredField');
  await db.cache.delete(CACHE_KEYS.INDEX);
  return true;
}
```

---

## Best Practices

### ✅ DO

1. **Always make new fields optional**
   ```typescript
   kreisstadt?: string;  // ✅ Good
   ```

2. **Use semantic field names**
   ```typescript
   population?: number;           // ✅ Clear
   areaKm2?: number;             // ✅ Includes unit
   ```

3. **Document field purpose**
   ```typescript
   /** Einwohnerzahl (Statistisches Bundesamt, 2023) */
   population?: number;
   ```

4. **Validate new data**
   - Add validation in `scripts/validate-data.ts`
   - Catch errors before deployment

5. **Test offline fallback**
   - Rebuild fallback after schema changes
   - Test with network disabled

6. **Version your changes**
   - Data version bumps automatically on build
   - BuildHash changes when source data changes

### ❌ DON'T

1. **Don't make breaking changes**
   ```typescript
   center: string;  // ❌ Was [number, number]
   ```

2. **Don't remove existing fields**
   ```typescript
   // ❌ Removing 'ars' field breaks existing code
   ```

3. **Don't change field semantics**
   ```typescript
   // ❌ 'center' was [lng, lat], don't change to [lat, lng]
   ```

4. **Don't add required fields**
   ```typescript
   newField: string;  // ❌ Breaks backwards compatibility
   ```

5. **Don't skip validation**
   - Always run `bun run validate:data` before committing

---

## Examples

### Example 1: Adding Kreisstadt

**1. Update index.json:**
```json
{
  "name": "Landkreis München",
  "codes": ["M"],
  "state": "BY",
  "center": [11.65, 48.05],
  "ars": "09184",
  "kreisstadt": "München"
}
```

**2. Update schema.ts:**
```typescript
export interface DistrictFeatureV2 {
  // ... existing fields
  kreisstadt?: string;
}
```

**3. Update transform-index.ts:**
```typescript
features[id] = {
  // ... existing fields
  ...(district.kreisstadt && { kreisstadt: district.kreisstadt }),
};
```

**4. Update UI:**
```tsx
{feature.kreisstadt && (
  <div className="text-sm">
    <strong>Kreisstadt:</strong> {feature.kreisstadt}
  </div>
)}
```

### Example 2: Adding Population Data

**1. Prepare data source:**
```bash
# Fetch from Statistisches Bundesamt API
curl https://api.destatis.de/population?ars=09162 > population.json
```

**2. Merge into index.json:**
```json
{
  "name": "München",
  "codes": ["M", "MB"],
  "population": 1471508
}
```

**3. Add validation:**
```typescript
if (district.population && district.population < 0) {
  errors.push(`Invalid population for ${district.name}`);
}
```

**4. Display in UI:**
```tsx
{feature.population && (
  <Badge variant="secondary">
    {(feature.population / 1000).toFixed(0)}k Einwohner
  </Badge>
)}
```

### Example 3: Adding Bundesland Mapping

**1. Create mapping file:**
```typescript
// src/lib/bundesland.ts
export const ARS_TO_BUNDESLAND: Record<string, string> = {
  '01': 'Schleswig-Holstein',
  '02': 'Hamburg',
  '03': 'Niedersachsen',
  // ...
};

export function getBundeslandFromARS(ars: string): string {
  const prefix = ars.slice(0, 2);
  return ARS_TO_BUNDESLAND[prefix] || 'Unbekannt';
}
```

**2. Use in transform:**
```typescript
import { getBundeslandFromARS } from '../src/lib/bundesland';

features[id] = {
  // ... existing
  bundeslandName: getBundeslandFromARS(district.ars || ''),
};
```

**3. Update schema:**
```typescript
bundeslandName?: string;
```

---

## Schema Version History

### v1 (Current)
- Basic district info (name, ars, codes, center)
- Build-time transformation
- Version tracking (dataVersion, buildHash)
- TTL support for cache

### v2 (Planned)
- Extended district info (kreisstadt, population, area)
- Bundesland metadata
- Wikidata integration
- Website URLs

### Migration Path

v1 → v2 is seamless because:
- All v2 fields are optional
- v1 data remains valid in v2 schema
- Migration handler detects missing fields
- No manual intervention needed

---

## Troubleshooting

### Cache Not Updating

**Symptom:** New fields don't appear after adding them

**Solution:**
```typescript
import { clearCache } from '@/lib/storage';

// In browser console
await clearCache();
window.location.reload();
```

### Type Errors After Schema Change

**Symptom:** TypeScript errors in components

**Solution:**
1. Check `src/data/schema.ts` exports new interface
2. Update component to use `DistrictFeatureV2` instead of inline type
3. Use optional chaining: `feature.newField?.value`

### Build Fails After Data Change

**Symptom:** `bun run build:data` fails

**Solution:**
1. Check validation output
2. Fix data errors in `public/data/index.json`
3. Ensure all codes are uppercase (A-ZÄÖÜ)
4. Verify coordinates are in Germany bounds

### Fallback Not Updating

**Symptom:** Offline version doesn't show new fields

**Solution:**
```bash
# Regenerate fallback
bun run build:data

# Verify output
ls -lh src/data/generated-fallback.ts
```

---

## Further Reading

- [CLAUDE.md](../CLAUDE.md) - Project architecture overview
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [Build Scripts](../scripts/) - Data processing pipeline
- [TypeScript Schema](../src/data/schema.ts) - Full type definitions

---

**Last Updated:** 2025-12-30
**Schema Version:** v1 (with v2 extensibility framework)
