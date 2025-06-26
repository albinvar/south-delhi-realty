#!/usr/bin/env node

// Quick deployment diagnostic script
// Run with: node scripts/check-deployment-status.cjs

console.log('🔍 South Delhi Real Estate - Deployment Diagnostic');
console.log('================================================\n');

// Check if this is production environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Check critical environment variables
const criticalEnvVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT',
  'SESSION_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL'
];

console.log('\n📊 Environment Variables Check:');
console.log('================================');

let missingVars = [];
criticalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('PASSWORD') || varName.includes('SECRET')) {
      console.log(`✅ ${varName}: ******* (hidden)`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: Missing!`);
    missingVars.push(varName);
  }
});

// Check for build artifacts
console.log('\n📦 Build Artifacts Check:');
console.log('==========================');

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const serverPath = path.join(distPath, 'server');
const publicPath = path.join(distPath, 'public');

if (fs.existsSync(distPath)) {
  console.log('✅ dist/ directory exists');
  
  if (fs.existsSync(serverPath)) {
    console.log('✅ dist/server/ directory exists');
    
    const indexPath = path.join(serverPath, 'index.js');
    if (fs.existsSync(indexPath)) {
      console.log('✅ dist/server/index.js exists');
    } else {
      console.log('❌ dist/server/index.js missing!');
    }
  } else {
    console.log('❌ dist/server/ directory missing!');
  }
  
  if (fs.existsSync(publicPath)) {
    console.log('✅ dist/public/ directory exists');
  } else {
    console.log('❌ dist/public/ directory missing!');
  }
} else {
  console.log('❌ dist/ directory missing! Run: npm run build');
}

// Check package.json scripts
console.log('\n🚀 Package.json Scripts Check:');
console.log('===============================');

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.start) {
    console.log(`✅ start script: ${packageJson.scripts.start}`);
  } else {
    console.log('❌ start script missing!');
  }
  
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log(`✅ build script: ${packageJson.scripts.build}`);
  } else {
    console.log('❌ build script missing!');
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Port configuration check
console.log('\n🌐 Port Configuration Check:');
console.log('=============================');

const port = process.env.PORT || 8080;
console.log(`PORT environment variable: ${process.env.PORT || 'not set (will default to 8080)'}`);
console.log(`Effective port: ${port}`);

if (isProduction && port !== '8080') {
  console.log('⚠️  Warning: DigitalOcean expects port 8080 in production');
}

// Summary
console.log('\n📋 SUMMARY:');
console.log('============');

if (missingVars.length > 0) {
  console.log(`❌ ${missingVars.length} critical environment variables missing:`);
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n⚠️  NOTE: This is expected in local development');
  console.log('   Production environment variables are set in DigitalOcean console');
} else {
  console.log('✅ All critical environment variables present');
}

if (!fs.existsSync(distPath)) {
  console.log('❌ Build artifacts missing - run: npm run build');
} else {
  console.log('✅ Build artifacts present');
}

console.log('\n🎯 IMMEDIATE ACTION REQUIRED:');
console.log('==============================');
console.log('The 502 error indicates your DigitalOcean app is not running.');
console.log('');
console.log('1. 🚨 URGENT: Check DigitalOcean Console NOW');
console.log('   → https://cloud.digitalocean.com/apps');
console.log('   → Look at "Activity" tab for deployment status');
console.log('   → Check "Runtime Logs" for errors');
console.log('');
console.log('2. If deployment failed:');
console.log('   → Settings → Actions → "Force Rebuild and Deploy"');
console.log('');
console.log('3. Check Runtime Logs for these errors:');
console.log('   → "Error: Cannot find module"');
console.log('   → "Database connection failed"');
console.log('   → "Process exited with code 1"');

console.log('\n🔗 Quick Links:');
console.log('================');
console.log('DigitalOcean Console: https://cloud.digitalocean.com/apps');
console.log('Health Check: https://southdelhirealty.com/health');
console.log('Auth Page: https://southdelhirealty.com/auth');

console.log('\n💡 TIP: The fact that nginx is responding with 502 means:');
console.log('- ✅ Nginx is running');
console.log('- ✅ Your domain is correctly configured');
console.log('- ❌ Your Node.js application is NOT running');
console.log('- 🎯 Focus on getting the Node.js app to start'); 