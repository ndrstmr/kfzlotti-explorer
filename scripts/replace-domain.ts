#!/usr/bin/env bun

/**
 * Replace [YOUR-DOMAIN] placeholder in sitemap.xml with actual domain from .env
 * Ersetzt [YOUR-DOMAIN] Platzhalter in sitemap.xml mit echter Domain aus .env
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SITEMAP_PATH = join(process.cwd(), 'dist', 'sitemap.xml');
const ROBOTS_PATH = join(process.cwd(), 'dist', 'robots.txt');

// Get base URL from environment variable
const baseUrl = process.env.VITE_BASE_URL;

if (!baseUrl) {
  console.warn('⚠️  VITE_BASE_URL not set in .env - using placeholder');
  console.warn('   Set VITE_BASE_URL in .env for production builds');
  process.exit(0); // Don't fail build, just warn
}

// Validate URL format
try {
  new URL(baseUrl);
} catch (error) {
  console.error('❌ Invalid VITE_BASE_URL format:', baseUrl);
  console.error('   Expected format: https://example.com');
  process.exit(1);
}

console.log('🔗 Replacing domain placeholders...');
console.log(`   Base URL: ${baseUrl}`);

let filesUpdated = 0;

// Replace in sitemap.xml
if (existsSync(SITEMAP_PATH)) {
  try {
    let sitemap = readFileSync(SITEMAP_PATH, 'utf-8');
    const originalSitemap = sitemap;

    sitemap = sitemap.replace(/\[YOUR-DOMAIN\]/g, baseUrl);

    if (sitemap !== originalSitemap) {
      writeFileSync(SITEMAP_PATH, sitemap, 'utf-8');
      console.log('   ✅ sitemap.xml updated');
      filesUpdated++;
    } else {
      console.log('   ℹ️  sitemap.xml already has correct domain');
    }
  } catch (error) {
    console.error('   ❌ Error updating sitemap.xml:', error);
    process.exit(1);
  }
} else {
  console.warn('   ⚠️  sitemap.xml not found - skipping');
}

// Replace in robots.txt (in case there's a sitemap reference)
if (existsSync(ROBOTS_PATH)) {
  try {
    let robots = readFileSync(ROBOTS_PATH, 'utf-8');
    const originalRobots = robots;

    robots = robots.replace(/\[YOUR-DOMAIN\]/g, baseUrl);

    if (robots !== originalRobots) {
      writeFileSync(ROBOTS_PATH, robots, 'utf-8');
      console.log('   ✅ robots.txt updated');
      filesUpdated++;
    }
  } catch (error) {
    console.error('   ❌ Error updating robots.txt:', error);
    process.exit(1);
  }
}

console.log(`✅ Domain replacement complete (${filesUpdated} files updated)`);
