#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const packages = [
  { name: 'trainerly-server', path: 'trainerly-packages/trainerly-server' },
  { name: 'trainerly-coach-app', path: 'trainerly-packages/trainerly-coach-app' },
  { name: 'trainerly-trainee-app', path: 'trainerly-packages/trainerly-trainee-app' }
];

console.log('🧪 Running tests for all packages...\n');

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
const failedPackages = [];

for (const pkg of packages) {
  console.log(`\n📦 Testing ${pkg.name}...`);
  console.log('='.repeat(50));
  
  try {
    const result = execSync(`yarn workspace ${pkg.name} test`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`✅ ${pkg.name} tests passed`);
    totalPassed++;
  } catch (error) {
    console.error(`❌ ${pkg.name} tests failed`);
    totalFailed++;
    failedPackages.push(pkg.name);
    // Don't exit on first failure - continue running all tests
  }
}

console.log('\n📊 Test Results Summary:');
console.log('='.repeat(50));
console.log(`✅ Passed: ${totalPassed}/${packages.length} packages`);
console.log(`❌ Failed: ${totalFailed}/${packages.length} packages`);

if (failedPackages.length > 0) {
  console.log(`\n💥 Failed packages: ${failedPackages.join(', ')}`);
  process.exit(1); // Exit with failure code after running all tests
} else {
  console.log('\n🎉 All tests passed!');
}
