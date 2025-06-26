#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting DigitalOcean deployment build process...');

try {
  // Check if required files exist
  const requiredFiles = [
    'client/index.html',
    'client/src/main.tsx',
    'package.json',
    'vite.config.ts'
  ];

  console.log('✅ Checking required files...');
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  console.log('✅ All required files present');

  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Fix security vulnerabilities (non-breaking)
  console.log('🔒 Fixing security vulnerabilities...');
  try {
    execSync('npm audit fix --only=prod', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️  Some security fixes may require manual intervention');
  }

  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }

  // Build client
  console.log('⚡ Building client...');
  execSync('npm run build:client', { stdio: 'inherit' });

  // Build server
  console.log('🔧 Building server...');
  execSync('npm run build:server', { stdio: 'inherit' });

  // Prepare deployment package
  console.log('📦 Preparing deployment package...');
  execSync('npm run copy-package', { stdio: 'inherit' });

  // Verify build output
  const buildFiles = [
    'dist/public/index.html',
    'dist/server/index.js',
    'dist/package.json'
  ];

  console.log('🔍 Verifying build output...');
  for (const file of buildFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Build output missing: ${file}`);
    }
  }

  console.log('✅ Build completed successfully!');
  console.log('📊 Build summary:');
  
  const distSize = execSync('du -sh dist 2>/dev/null || echo "Size calculation not available"', { encoding: 'utf8' }).trim();
  console.log(`   📁 Dist size: ${distSize}`);
  
  const publicFiles = fs.readdirSync('dist/public').length;
  console.log(`   📄 Public files: ${publicFiles}`);
  
  console.log('🎉 Ready for DigitalOcean deployment!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 