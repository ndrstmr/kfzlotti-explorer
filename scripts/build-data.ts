/**
 * Main data build orchestrator
 * Runs all data processing steps in correct sequence
 */

import { execSync } from 'child_process';

interface BuildStep {
  name: string;
  script: string;
  critical: boolean; // If false, continue on error
}

const steps: BuildStep[] = [
  { name: 'Validate data', script: 'validate-data.ts', critical: true },
  { name: 'Transform index', script: 'transform-index.ts', critical: true },
  { name: 'Generate fallback', script: 'generate-fallback.ts', critical: true },
  { name: 'Minify JSON', script: 'minify-json.ts', critical: false },
];

console.log('🔨 Building data files...\n');

const startTime = Date.now();
let stepsPassed = 0;
let stepsFailed = 0;

for (const step of steps) {
  console.log(`→ ${step.name}...`);

  try {
    execSync(`bun scripts/${step.script}`, { stdio: 'inherit' });
    stepsPassed++;
  } catch (error) {
    if (step.critical) {
      console.error(`\n❌ Build failed at: ${step.name}`);
      console.error('This is a critical step and the build cannot continue.\n');
      process.exit(1);
    } else {
      console.warn(`⚠️  ${step.name} failed but continuing (non-critical)`);
      stepsFailed++;
    }
  }

  console.log(''); // Empty line for readability
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('✅ Data build complete');
console.log(`   Steps passed: ${stepsPassed}/${steps.length}`);
if (stepsFailed > 0) {
  console.log(`   Steps failed: ${stepsFailed} (non-critical)`);
}
console.log(`   Time: ${elapsed}s\n`);
