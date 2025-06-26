#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment checks...\n');

const checks = [
  {
    name: 'Client index.html exists',
    check: () => fs.existsSync('client/index.html'),
    fix: () => console.log('   Fix: Ensure client/index.html exists')
  },
  {
    name: 'Main TypeScript entry exists',
    check: () => fs.existsSync('client/src/main.tsx'),
    fix: () => console.log('   Fix: Ensure client/src/main.tsx exists')
  },
  {
    name: 'Server entry exists',
    check: () => fs.existsSync('server/index.ts'),
    fix: () => console.log('   Fix: Ensure server/index.ts exists')
  },
  {
    name: 'Vite config exists',
    check: () => fs.existsSync('vite.config.ts'),
    fix: () => console.log('   Fix: Ensure vite.config.ts exists')
  },
  {
    name: 'TypeScript server config exists',
    check: () => fs.existsSync('tsconfig.server.json'),
    fix: () => console.log('   Fix: Ensure tsconfig.server.json exists')
  },
  {
    name: 'Package.json has correct scripts',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts && 
             pkg.scripts['build:client'] && 
             pkg.scripts['build:server'] && 
             pkg.scripts['start'];
    },
    fix: () => console.log('   Fix: Ensure package.json has build:client, build:server, and start scripts')
  },
  {
    name: 'Environment template exists',
    check: () => fs.existsSync('.env.production'),
    fix: () => console.log('   Fix: Create .env.production template file')
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  
  if (!passed) {
    allPassed = false;
    fix();
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All pre-deployment checks passed!');
  console.log('✅ Your application is ready for DigitalOcean deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Commit your changes to Git');
  console.log('2. Push to your repository');
  console.log('3. Deploy through DigitalOcean App Platform');
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n💡 Deployment tips:');
console.log('- Set NODE_ENV=production in DigitalOcean');
console.log('- Configure all environment variables');
console.log('- Ensure your database is accessible from DigitalOcean'); 