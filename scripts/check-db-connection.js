#!/usr/bin/env node

// Database Connection Health Check Script
// This script helps diagnose database connection issues

const mysql = require('mysql2/promise');

async function checkDatabaseConnection() {
  console.log('🔍 South Delhi Realty - Database Connection Health Check');
  console.log('=====================================');
  
  // Get environment variables
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'southdelhirealestate',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectTimeout: 10000,
    timeout: 5000,
    acquireTimeout: 10000
  };

  console.log('📋 Database Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Connect Timeout: ${config.connectTimeout}ms`);
  console.log('');

  let connection;
  
  try {
    console.log('🔄 Attempting to connect to database...');
    
    // Create connection with timeout
    connection = await Promise.race([
      mysql.createConnection(config),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ]);
    
    console.log('✅ Database connection established successfully!');
    
    // Test basic query
    console.log('🔄 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Basic query successful:', rows[0]);
    
    // Test database tables
    console.log('🔄 Checking database tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables in database`);
    
    if (tables.length > 0) {
      console.log('📋 Available tables:');
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    }
    
    // Test users table specifically
    try {
      console.log('🔄 Testing users table...');
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Users table accessible, contains ${userCount[0].count} users`);
    } catch (error) {
      console.warn('⚠️  Users table test failed:', error.message);
    }
    
    // Test properties table
    try {
      console.log('🔄 Testing properties table...');
      const [propCount] = await connection.execute('SELECT COUNT(*) as count FROM properties');
      console.log(`✅ Properties table accessible, contains ${propCount[0].count} properties`);
    } catch (error) {
      console.warn('⚠️  Properties table test failed:', error.message);
    }
    
    console.log('');
    console.log('🎉 Database connection health check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('');
      console.error('🚨 TIMEOUT ERROR DETECTED:');
      console.error('   This suggests the database server is not reachable or');
      console.error('   is taking too long to respond. Possible causes:');
      console.error('   - Database server is down');
      console.error('   - Network connectivity issues'); 
      console.error('   - Firewall blocking the connection');
      console.error('   - Database server overloaded');
      console.error('   - Incorrect host/port configuration');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('🚨 CONNECTION REFUSED:');
      console.error('   The database server is actively refusing connections.');
      console.error('   - Check if database server is running');
      console.error('   - Verify host and port are correct');
      console.error('   - Check if database service is accessible');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('');
      console.error('🚨 ACCESS DENIED:');
      console.error('   Database credentials are incorrect.');
      console.error('   - Verify username and password');
      console.error('   - Check if user has proper permissions');
    }
    
    console.error('');
    console.error('🔧 TROUBLESHOOTING STEPS:');
    console.error('   1. Verify database environment variables are set correctly');
    console.error('   2. Check if database server is running and accessible');
    console.error('   3. Test connection using a database client (MySQL Workbench, etc.)');
    console.error('   4. Check firewall settings and network connectivity');
    console.error('   5. Verify database server is not overloaded');
    
    process.exit(1);
    
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('📴 Database connection closed');
      } catch (error) {
        console.error('Error closing connection:', error.message);
      }
    }
  }
}

// Run the health check
checkDatabaseConnection().catch(console.error);
