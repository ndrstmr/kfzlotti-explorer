#!/usr/bin/env bun
/**
 * Downloads Google Fonts for local hosting
 * Fetches Fredoka and Nunito in required weights
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const FONTS_DIR = join(process.cwd(), 'public', 'fonts');
const GOOGLE_FONTS_API = 'https://fonts.googleapis.com/css2';

// Font configurations
const fonts = [
  {
    family: 'Fredoka',
    weights: [400, 500, 600, 700],
    outputName: 'fredoka'
  },
  {
    family: 'Nunito',
    weights: [400, 500, 600, 700],
    outputName: 'nunito'
  }
];

// Ensure fonts directory exists
if (!existsSync(FONTS_DIR)) {
  mkdirSync(FONTS_DIR, { recursive: true });
}

console.log('📦 Downloading Google Fonts for local hosting...\n');

for (const font of fonts) {
  console.log(`Downloading ${font.family}...`);

  // Build Google Fonts URL
  const weightsParam = font.weights.join(';');
  const url = `${GOOGLE_FONTS_API}?family=${font.family}:wght@${weightsParam}&display=swap`;

  try {
    // Fetch CSS with desktop user agent to get woff2 URLs
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSS: ${response.status}`);
    }

    const css = await response.text();

    // Parse @font-face rules to extract weight-to-URL mapping
    const fontFaceRegex = /@font-face\s*{([^}]+)}/g;
    const fontFaces = Array.from(css.matchAll(fontFaceRegex));

    console.log(`  Found ${fontFaces.length} font variants`);

    // Download each font file with correct weight
    for (const match of fontFaces) {
      const block = match[1];

      // Extract weight
      const weightMatch = block.match(/font-weight:\s*(\d+)/);
      const weight = weightMatch ? parseInt(weightMatch[1]) : 400;

      // Skip if not in our requested weights
      if (!font.weights.includes(weight)) continue;

      // Extract URL
      const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
      if (!urlMatch) continue;

      const fontUrl = urlMatch[1];
      const fileExt = fontUrl.includes('.woff2') ? 'woff2' : 'ttf';
      const fileName = `${font.outputName}-${weight}.${fileExt}`;
      const filePath = join(FONTS_DIR, fileName);

      const fontResponse = await fetch(fontUrl);
      if (!fontResponse.ok) {
        console.warn(`  ⚠️  Failed to download ${fileName}`);
        continue;
      }

      const fontBuffer = await fontResponse.arrayBuffer();
      writeFileSync(filePath, Buffer.from(fontBuffer));
      console.log(`  ✅ ${fileName} (${(fontBuffer.byteLength / 1024).toFixed(1)} KB)`);
    }

    // Also extract and save the CSS for reference
    const cssPath = join(FONTS_DIR, `${font.outputName}.css`);
    writeFileSync(cssPath, css);
    console.log(`  📄 ${font.outputName}.css saved for reference\n`);

  } catch (error) {
    console.error(`  ❌ Error downloading ${font.family}:`, error);
  }
}

console.log('✅ Font download complete!');
console.log(`📂 Fonts saved to: ${FONTS_DIR}\n`);
