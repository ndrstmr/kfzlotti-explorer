#!/usr/bin/env bun

/**
 * Fix Production CSP
 *
 * Ersetzt die Development CSP (mit 'unsafe-eval') in dist/index.html
 * durch die strikte Production CSP (ohne 'unsafe-eval').
 *
 * Wird automatisch nach jedem Build ausgeführt (postbuild hook).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DIST_INDEX = join(process.cwd(), 'dist', 'index.html');

// Development CSP (mit unsafe-eval für Vite HMR)
const DEV_CSP = /content="default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval';[^"]+"/;

// Production CSP (ohne unsafe-eval - strikte Sicherheit, self-hosted fonts)
// Script-hashes für Vite Legacy Plugin inline scripts (browser detection)
const PROD_CSP = `content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-ZxAi3a7m9Mzbc+Z1LGuCCK5Xee6reDkEPRas66H9KSo=' 'sha256-+5XkZFazzJo8n0iOP4ti/cLCMUudTf//Mzkb7xNPXIc='; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"`;

console.log('🔒 Fixing Production CSP in dist/index.html...');

if (!existsSync(DIST_INDEX)) {
  console.error('❌ Error: dist/index.html not found. Run build first.');
  process.exit(1);
}

try {
  // Lese dist/index.html
  let html = readFileSync(DIST_INDEX, 'utf-8');

  // Prüfe ob Development CSP vorhanden
  if (!DEV_CSP.test(html)) {
    console.log('⚠️  Warning: Development CSP not found in dist/index.html');
    console.log('   CSP might already be correct or format has changed.');
    process.exit(0);
  }

  // Ersetze durch Production CSP
  const originalLength = html.length;
  html = html.replace(DEV_CSP, PROD_CSP);

  if (html.length === originalLength) {
    console.error('❌ Error: CSP replacement failed (no changes made)');
    process.exit(1);
  }

  // Schreibe zurück
  writeFileSync(DIST_INDEX, html, 'utf-8');

  console.log('✅ Production CSP applied successfully');
  console.log('   Removed: unsafe-eval (stricter security)');
  console.log('   Kept: wasm-unsafe-eval (needed for PWA)');

} catch (error) {
  console.error('❌ Error fixing Production CSP:', error);
  process.exit(1);
}
