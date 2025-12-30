/**
 * Generate comprehensive fallback data as TypeScript module
 * Replaces the limited 16-city fallback with all districts
 */

import { readFileSync, writeFileSync } from 'fs';

interface KfzIndex {
  version: number;
  dataVersion?: string;
  buildHash?: string;
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

try {
  console.log('🏗️  Generating comprehensive fallback...');

  // Read the transformed index
  const transformed = JSON.parse(
    readFileSync('public/data/index.transformed.json', 'utf-8')
  ) as KfzIndex;

  // Generate TypeScript module with proper formatting
  const fallbackCode = `/**
 * Auto-generated comprehensive fallback data
 * Generated: ${new Date().toISOString()}
 * Data version: ${transformed.dataVersion || transformed.generated}
 *
 * DO NOT EDIT MANUALLY - Regenerated on each build via scripts/generate-fallback.ts
 *
 * This file contains ALL districts for full offline functionality
 * even when the app cannot fetch remote data files.
 */

import type { KfzIndex } from './schema';

export const GENERATED_FALLBACK: KfzIndex = ${JSON.stringify(transformed, null, 2)};
`;

  // Write to src/data/
  writeFileSync(
    'src/data/generated-fallback.ts',
    fallbackCode,
    'utf-8'
  );

  const sizeKB = (fallbackCode.length / 1024).toFixed(1);
  const numDistricts = Object.keys(transformed.features).length;
  const numCodes = Object.keys(transformed.codeToIds).length;

  console.log('✅ Comprehensive fallback generated');
  console.log(`   Districts: ${numDistricts}`);
  console.log(`   Codes: ${numCodes}`);
  console.log(`   Size: ${sizeKB} KB`);
  console.log(`   Output: src/data/generated-fallback.ts`);

  // Warn if bundle size is too large
  if (parseInt(sizeKB) > 50) {
    console.log(`   ⚠️  Warning: Fallback is ${sizeKB} KB - may increase bundle size significantly`);
  }
} catch (error) {
  console.error('❌ Fallback generation failed:', error);
  process.exit(1);
}
