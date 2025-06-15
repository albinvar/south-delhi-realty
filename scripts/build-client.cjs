#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');
const clientDir = path.resolve(projectRoot, 'client');

console.log(`Project root: ${projectRoot}`);
console.log(`Looking for client directory at: ${clientDir}`);

// Debug: List contents of project root
console.log('Project root contents:');
try {
  const rootContents = fs.readdirSync(projectRoot);
  console.log(rootContents.join(', '));
} catch (error) {
  console.error('Error reading project root:', error.message);
}

// Check if client directory exists
if (!fs.existsSync(clientDir)) {
  console.error('Error: client directory not found');
  console.log('Trying to find client directory...');
  
  // Look for possible client directories
  const possiblePaths = [
    path.resolve(projectRoot, 'client'),
    path.resolve(projectRoot, 'src'),
    path.resolve(projectRoot, 'frontend'),
    projectRoot
  ];
  
  for (const possiblePath of possiblePaths) {
    console.log(`Checking: ${possiblePath}`);
    if (fs.existsSync(possiblePath)) {
      const contents = fs.readdirSync(possiblePath);
      console.log(`Contents: ${contents.join(', ')}`);
      
      // Check if this directory has index.html
      if (contents.includes('index.html')) {
        console.log(`Found index.html in: ${possiblePath}`);
      }
    }
  }
  
  process.exit(1);
}

// Debug: List contents of client directory
console.log('Client directory contents:');
try {
  const clientContents = fs.readdirSync(clientDir);
  console.log(clientContents.join(', '));
} catch (error) {
  console.error('Error reading client directory:', error.message);
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.resolve(clientDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('Error: index.html not found in client directory');
  console.log(`Expected path: ${indexPath}`);
  process.exit(1);
}

console.log(`Building from: ${clientDir}`);
console.log(`Index file: ${indexPath}`);

// Set up environment with proper memory limits and garbage collection
const buildEnv = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=8192 --max-semi-space-size=128 --expose-gc'
};

console.log(`Using NODE_OPTIONS: ${buildEnv.NODE_OPTIONS}`);

// Clean up any previous build artifacts to save memory
const distPath = path.resolve(projectRoot, 'dist', 'public');
if (fs.existsSync(distPath)) {
  console.log('Cleaning previous build artifacts...');
  try {
    fs.rmSync(distPath, { recursive: true, force: true });
  } catch (error) {
    console.warn('Warning: Could not clean previous build:', error.message);
  }
}

// Use npx to run vite build from client directory using local config
const viteProcess = spawn('npx', ['vite', 'build', '--mode', 'production'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true,
  env: buildEnv
});

viteProcess.on('error', (error) => {
  console.error('Error running vite build:', error);
  process.exit(1);
});

viteProcess.on('close', (code) => {
  console.log(`Vite build exited with code ${code}`);
  if (code !== 0) {
    console.error('Vite build failed with non-zero exit code');
    if (code === 134) {
      console.error('Build failed due to memory issues (SIGABRT)');
      console.error('Try increasing memory limits or optimizing the build');
    }
  }
  process.exit(code);
}); 