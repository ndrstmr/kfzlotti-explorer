/**
 * Validate data files before deployment
 * Catches data errors early in the build process
 */

import { readFileSync } from 'fs';

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

function validateKfzIndex(data: RawIndexData): string[] {
  const errors: string[] = [];

  // Check required top-level fields
  if (!data.version) {
    errors.push('Missing version field');
  }
  if (!data.source) {
    errors.push('Missing source field');
  }
  if (!data.license) {
    errors.push('Missing license field');
  }

  // Check districts array
  if (!data.districts || !Array.isArray(data.districts)) {
    errors.push('Missing or invalid districts array');
    return errors;
  }

  if (data.districts.length === 0) {
    errors.push('Districts array is empty');
    return errors;
  }

  const seenCodes = new Set<string>();
  const duplicateCodes: string[] = [];

  data.districts.forEach((district, index) => {
    const prefix = `District ${index} (${district.name || 'unnamed'})`;

    // Validate name
    if (!district.name || typeof district.name !== 'string') {
      errors.push(`${prefix}: Missing or invalid name`);
    }

    // Validate codes
    if (!district.codes || !Array.isArray(district.codes)) {
      errors.push(`${prefix}: Missing or invalid codes array`);
    } else if (district.codes.length === 0) {
      errors.push(`${prefix}: No KFZ codes`);
    } else {
      district.codes.forEach((code: string) => {
        // Check format
        if (!/^[A-ZÄÖÜ]{1,3}$/.test(code)) {
          errors.push(`${prefix}: Invalid code format "${code}" (must be 1-3 uppercase letters)`);
        }

        // Check for duplicates across all districts
        if (seenCodes.has(code)) {
          duplicateCodes.push(code);
        } else {
          seenCodes.add(code);
        }
      });
    }

    // Validate coordinates
    if (!district.center || !Array.isArray(district.center) || district.center.length !== 2) {
      errors.push(`${prefix}: Missing or invalid center coordinates`);
    } else {
      const [lng, lat] = district.center;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        errors.push(`${prefix}: Coordinates must be numbers`);
      } else {
        // Germany bounds: 47-55°N, 5.5-15.5°E (with some margin)
        if (lat < 46 || lat > 56 || lng < 5 || lng > 16) {
          errors.push(`${prefix}: Coordinates [${lng}, ${lat}] outside Germany`);
        }
      }
    }

    // Validate state code
    const validStates = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
      'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
    if (!district.state) {
      errors.push(`${prefix}: Missing state code`);
    } else if (!validStates.includes(district.state)) {
      errors.push(`${prefix}: Invalid state code "${district.state}"`);
    }

    // Validate ARS if present
    if (district.ars && typeof district.ars !== 'string') {
      errors.push(`${prefix}: Invalid ARS format (must be string)`);
    }
  });

  // Report duplicate codes (this is actually valid - multiple districts can have same codes)
  // But warn about it for awareness
  if (duplicateCodes.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateCodes)];
    console.log(`ℹ️  Info: ${uniqueDuplicates.length} codes used by multiple districts: ${uniqueDuplicates.join(', ')}`);
  }

  return errors;
}

// Main execution
try {
  console.log('🔍 Validating data files...');

  // Validate index.json
  const rawData = JSON.parse(
    readFileSync('public/data/index.json', 'utf-8')
  ) as RawIndexData;

  const errors = validateKfzIndex(rawData);

  if (errors.length > 0) {
    console.error('\n❌ Data validation failed:');
    errors.forEach(err => console.error(`   - ${err}`));
    console.error(`\nTotal errors: ${errors.length}\n`);
    process.exit(1);
  }

  console.log('✅ Data validation passed');
  console.log(`   Districts: ${rawData.districts.length}`);
  console.log(`   Total codes: ${rawData.districts.reduce((sum, d) => sum + d.codes.length, 0)}`);
} catch (error) {
  console.error('❌ Validation failed:', error);
  process.exit(1);
}
