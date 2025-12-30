/**
 * Minify JSON files by removing whitespace
 * Reduces file sizes for faster downloads
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const dataDir = 'public/data';

try {
  console.log('🗜️  Minifying JSON files...');

  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  let totalOriginal = 0;
  let totalMinified = 0;

  files.forEach(file => {
    const path = join(dataDir, file);
    const original = readFileSync(path, 'utf-8');
    const originalSize = statSync(path).size;

    // Parse and stringify without whitespace
    const parsed = JSON.parse(original);
    const minified = JSON.stringify(parsed);

    // Only write if actually smaller
    if (minified.length < original.length) {
      writeFileSync(path, minified, 'utf-8');
      const saved = original.length - minified.length;
      totalOriginal += originalSize;
      totalMinified += minified.length;

      console.log(`   ${file}: ${(originalSize / 1024).toFixed(1)} KB → ${(minified.length / 1024).toFixed(1)} KB (saved ${(saved / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`   ${file}: already minified`);
      totalOriginal += originalSize;
      totalMinified += originalSize;
    }
  });

  const totalSaved = totalOriginal - totalMinified;
  console.log(`✅ Minification complete`);
  console.log(`   Total original: ${(totalOriginal / 1024).toFixed(1)} KB`);
  console.log(`   Total minified: ${(totalMinified / 1024).toFixed(1)} KB`);
  console.log(`   Total saved: ${(totalSaved / 1024).toFixed(1)} KB (${((totalSaved / totalOriginal) * 100).toFixed(1)}%)`);
} catch (error) {
  console.error('❌ Minification failed:', error);
  process.exit(1);
}
