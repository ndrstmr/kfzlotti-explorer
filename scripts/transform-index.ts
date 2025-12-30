/**
 * Transform raw index.json into pre-computed search index
 * This eliminates the need for runtime transformation
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

// Raw district structure from index.json
interface RawDistrict {
  name: string;
  codes: string[];
  state: string;
  center: [number, number];
  ars?: string;
}

interface RawIndexData {
  version: string;
  source: string;
  license: string;
  districts: RawDistrict[];
}

interface KfzIndex {
  version: number;
  dataVersion: string;        // Build timestamp for cache invalidation
  buildHash: string;          // SHA-256 hash for integrity checking
  generated: string;
  source: string;
  codeToIds: Record<string, string[]>;
  features: Record<string, {
    name: string;
    ars: string;
    kfzCodes: string[];
    center: [number, number];
  }>;
}

/**
 * Transform the raw districts array into the KfzIndex format
 * EXACT COPY from src/hooks/useKfzData.ts:34-71
 */
function transformToKfzIndex(raw: RawIndexData): Omit<KfzIndex, 'dataVersion' | 'buildHash'> {
  const codeToIds: Record<string, string[]> = {};
  const features: Record<string, {
    name: string;
    ars: string;
    kfzCodes: string[];
    center: [number, number];
  }> = {};

  raw.districts.forEach((district, index) => {
    const id = `district_${index}`;

    // Create feature entry
    features[id] = {
      name: district.name,
      ars: district.ars || district.state, // Use state code as fallback for ARS
      kfzCodes: district.codes,
      center: district.center,
    };

    // Map each code to this feature ID
    district.codes.forEach(code => {
      const normalized = code.toUpperCase();
      if (!codeToIds[normalized]) {
        codeToIds[normalized] = [];
      }
      codeToIds[normalized].push(id);
    });
  });

  return {
    version: 1,
    generated: raw.version,
    source: raw.source,
    codeToIds,
    features,
  };
}

// Main execution
try {
  console.log('📦 Transforming index.json...');

  // Read raw data
  const rawData = JSON.parse(
    readFileSync('public/data/index.json', 'utf-8')
  ) as RawIndexData;

  // Transform
  const baseIndex = transformToKfzIndex(rawData);

  // Generate version and hash
  const now = new Date();
  const dataVersion = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const buildHash = createHash('sha256')
    .update(JSON.stringify(rawData))
    .digest('hex')
    .slice(0, 8);

  const transformed: KfzIndex = {
    ...baseIndex,
    dataVersion,
    buildHash,
  };

  // Write to public/ for HTTP serving
  writeFileSync(
    'public/data/index.transformed.json',
    JSON.stringify(transformed),
    'utf-8'
  );

  console.log('✅ Transformed index generated');
  console.log(`   Version: ${transformed.dataVersion}`);
  console.log(`   Hash: ${transformed.buildHash}`);
  console.log(`   Districts: ${Object.keys(transformed.features).length}`);
  console.log(`   Codes: ${Object.keys(transformed.codeToIds).length}`);
  console.log(`   Size: ${(JSON.stringify(transformed).length / 1024).toFixed(1)} KB`);
} catch (error) {
  console.error('❌ Transformation failed:', error);
  process.exit(1);
}
