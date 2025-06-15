import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Create package.json for the dist directory
const deploymentPackage = {
  "name": "south-delhi-real-estate-dist",
  "version": "1.0.0",
  "type": "commonjs",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "health-check": "curl -f http://localhost:5000/health || exit 1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
};

// Write package.json to dist directory
fs.writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify(deploymentPackage, null, 2)
);

// Copy .env file if it exists
const envPath = path.join(rootDir, '.env');
const distEnvPath = path.join(distDir, '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, distEnvPath);
  console.log('✅ Copied .env file to dist directory');
}

// Copy ecosystem.config.cjs for PM2 if it exists
const ecosystemPath = path.join(rootDir, 'ecosystem.config.cjs');
const distEcosystemPath = path.join(distDir, 'ecosystem.config.cjs');
if (fs.existsSync(ecosystemPath)) {
  fs.copyFileSync(ecosystemPath, distEcosystemPath);
  console.log('✅ Copied ecosystem.config.cjs to dist directory');
}

console.log('✅ Deployment preparation completed');
console.log('📦 Created package.json for dist directory');
console.log('🚀 Ready for DigitalOcean deployment'); 