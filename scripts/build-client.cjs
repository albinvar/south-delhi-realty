#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');
const clientDir = path.resolve(projectRoot, 'client');

// Quick validation
if (!fs.existsSync(clientDir) || !fs.existsSync(path.resolve(clientDir, 'index.html'))) {
  console.error('Error: client directory or index.html not found');
  process.exit(1);
}

console.log('Building client...');

// Set up environment with memory limits
const buildEnv = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=8192 --max-semi-space-size=128'
};

// Use npx to run vite build from client directory
const viteProcess = spawn('npx', ['vite', 'build', '--mode', 'production'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true,
  env: buildEnv
});

viteProcess.on('error', (error) => {
  console.error('Build error:', error);
  process.exit(1);
});

viteProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('Build failed');
  }
  process.exit(code);
}); 