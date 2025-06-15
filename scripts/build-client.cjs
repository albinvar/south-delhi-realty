#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Change to client directory
const clientDir = path.resolve(__dirname, '..', 'client');

// Check if client directory exists
if (!fs.existsSync(clientDir)) {
  console.error('Error: client directory not found');
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.resolve(clientDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('Error: index.html not found in client directory');
  process.exit(1);
}

console.log(`Building from: ${clientDir}`);
console.log(`Index file: ${indexPath}`);

// Use npx to run vite build from client directory using local config
const viteProcess = spawn('npx', ['vite', 'build', '--mode', 'production'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (error) => {
  console.error('Error running vite build:', error);
  process.exit(1);
});

viteProcess.on('close', (code) => {
  console.log(`Vite build exited with code ${code}`);
  process.exit(code);
}); 