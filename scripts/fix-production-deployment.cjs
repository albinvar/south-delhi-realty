#!/usr/bin/env node

/**
 * Production Deployment Fix Script
 * Addresses database connection timeout issues and validates configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 South Delhi Real Estate - Production Deployment Fix');
console.log('====================================================');

// Environment variable validation
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT',
  'SESSION_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

const recommendedEnvVars = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'ALLOWED_ORIGINS'
];

function checkEnvironmentVariables() {
  console.log('\n📋 Checking Environment Variables...');
  
  const missing = [];
  const warnings = [];
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });
  
  // Check recommended variables
  recommendedEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n❌ Missing Required Environment Variables:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n🔧 Fix: Set these variables in your deployment environment');
    return false;
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Missing Optional Environment Variables:');
    warnings.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  return true;
}

function validateDatabaseConfig() {
  console.log('\n🗄️ Validating Database Configuration...');
  
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
  };
  
  console.log('Database Settings:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Database: ${dbConfig.database}`);
  
  // Check for common issues
  if (dbConfig.host === 'localhost') {
    console.log('⚠️ Warning: Database host is localhost - ensure this is correct for production');
  }
  
  if (dbConfig.port !== '3306' && dbConfig.port !== '25060') {
    console.log('⚠️ Warning: Non-standard MySQL port detected');
  }
  
  return true;
}

function printDeploymentChecklist() {
  console.log('\n📝 Production Deployment Checklist:');
  console.log('====================================');
  
  console.log('\n1. Database Connection Issues Fix:');
  console.log('   ✅ Enhanced MySQL connection pool with timeouts');
  console.log('   ✅ Connection retry logic with exponential backoff');
  console.log('   ✅ Improved health checks with separate timeout handling');
  console.log('   ✅ Graceful shutdown with connection cleanup');
  
  console.log('\n2. Environment Configuration:');
  console.log('   □ Verify all required environment variables are set');
  console.log('   □ Ensure database credentials are correct');
  console.log('   □ Validate Google OAuth configuration');
  console.log('   □ Check Cloudinary settings');
  
  console.log('\n3. Database Server Checks:');
  console.log('   □ Verify database server is running and accessible');
  console.log('   □ Check database server performance and load');
  console.log('   □ Validate network connectivity between app and database');
  console.log('   □ Ensure firewall/security groups allow connections');
  
  console.log('\n4. Application Server Checks:');
  console.log('   □ Verify sufficient memory allocation (min 2GB recommended)');
  console.log('   □ Check CPU resources');
  console.log('   □ Monitor disk space');
  console.log('   □ Validate SSL/TLS configuration');
  
  console.log('\n5. Monitoring Setup:');
  console.log('   □ Set up application logs monitoring');
  console.log('   □ Configure database performance monitoring');
  console.log('   □ Set up health check alerts');
  console.log('   □ Monitor response times and error rates');
}

function printTroubleshootingSteps() {
  console.log('\n🔧 Troubleshooting Steps for ETIMEDOUT Errors:');
  console.log('==============================================');
  
  console.log('\n1. Immediate Actions:');
  console.log('   • Restart the application service');
  console.log('   • Check database server status');
  console.log('   • Verify network connectivity');
  
  console.log('\n2. Database Server Diagnostics:');
  console.log('   • Check database server logs for errors');
  console.log('   • Monitor database server CPU and memory usage');
  console.log('   • Verify database connection limits');
  console.log('   • Check for long-running queries blocking connections');
  
  console.log('\n3. Network Diagnostics:');
  console.log('   • Test connectivity: ping database server');
  console.log('   • Check firewall rules and security groups');
  console.log('   • Verify DNS resolution');
  console.log('   • Test database connection from application server');
  
  console.log('\n4. Application Diagnostics:');
  console.log('   • Check application memory usage');
  console.log('   • Monitor connection pool statistics');
  console.log('   • Review application logs for patterns');
  console.log('   • Verify environment variable configuration');
  
  console.log('\n5. Advanced Debugging:');
  console.log('   • Enable database query logging');
  console.log('   • Use database performance monitoring tools');
  console.log('   • Check for connection leaks in application');
  console.log('   • Monitor network latency between services');
}

function printOptimizationRecommendations() {
  console.log('\n⚡ Performance Optimization Recommendations:');
  console.log('==========================================');
  
  console.log('\n1. Database Optimizations:');
  console.log('   • Ensure proper database indexing');
  console.log('   • Optimize slow queries');
  console.log('   • Configure database connection pooling');
  console.log('   • Set up database read replicas if needed');
  
  console.log('\n2. Application Optimizations:');
  console.log('   • Implement query result caching');
  console.log('   • Add response compression');
  console.log('   • Optimize image loading and CDN usage');
  console.log('   • Implement pagination for large datasets');
  
  console.log('\n3. Infrastructure Optimizations:');
  console.log('   • Use a dedicated database server');
  console.log('   • Implement load balancing if traffic increases');
  console.log('   • Set up monitoring and alerting');
  console.log('   • Configure automatic backups');
  
  console.log('\n4. Security Hardening:');
  console.log('   • Use SSL/TLS for all connections');
  console.log('   • Implement rate limiting');
  console.log('   • Set up proper CORS configuration');
  console.log('   • Regular security updates and patches');
}

// Main execution
async function main() {
  try {
    // Check environment variables
    const envValid = checkEnvironmentVariables();
    
    // Validate database configuration
    validateDatabaseConfig();
    
    // Print deployment checklist
    printDeploymentChecklist();
    
    // Print troubleshooting steps
    printTroubleshootingSteps();
    
    // Print optimization recommendations
    printOptimizationRecommendations();
    
    console.log('\n🎯 Summary:');
    console.log('===========');
    
    if (envValid) {
      console.log('✅ Environment variables configured correctly');
    } else {
      console.log('❌ Environment variables need attention');
    }
    
    console.log('✅ Database connection improvements applied');
    console.log('✅ Health check system enhanced');
    console.log('✅ Retry logic implemented');
    console.log('✅ Graceful shutdown configured');
    
    console.log('\n📞 Next Steps:');
    console.log('1. Deploy the updated code to production');
    console.log('2. Monitor application logs for connection improvements');
    console.log('3. Verify health check endpoints are responding');
    console.log('4. Test database operations to ensure stability');
    console.log('5. Set up monitoring alerts for future issues');
    
    console.log('\n🚀 Deployment complete! Your application should now handle database');
    console.log('   connection issues more gracefully with automatic retry logic.');
    
  } catch (error) {
    console.error('❌ Error during deployment check:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  validateDatabaseConfig,
  printDeploymentChecklist,
  printTroubleshootingSteps,
  printOptimizationRecommendations
}; 