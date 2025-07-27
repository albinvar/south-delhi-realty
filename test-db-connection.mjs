#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 South Delhi Realty - Database Connection Test');
  console.log('=====================================');
  
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    connectTimeout: 10000,
    timeout: 5000,
  };

  console.log('📋 Database Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Port: ${config.port}`);
  console.log('');

  let connection;
  
  try {
    console.log('🔄 Attempting to connect to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Database connection established successfully!');
    
    // Test basic query
    console.log('🔄 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as `current_time`');
    console.log('✅ Basic query successful:', rows[0]);
    
    // Check if properties table exists
    console.log('🔄 Checking properties table...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "properties"');
    
    if (tables.length === 0) {
      console.log('❌ Properties table does not exist!');
      console.log('🔄 Checking all tables...');
      const [allTables] = await connection.execute('SHOW TABLES');
      console.log('Available tables:', allTables.map(t => Object.values(t)[0]));
    } else {
      console.log('✅ Properties table exists!');
      
      // Count properties
      console.log('🔄 Counting properties...');
      const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM properties');
      const propertyCount = countResult[0].count;
      console.log(`📊 Total properties in database: ${propertyCount}`);
      
      if (propertyCount > 0) {
        // Get sample properties
        console.log('🔄 Fetching sample properties...');
        const [sampleProps] = await connection.execute('SELECT id, title, status, isActive FROM properties LIMIT 3');
        console.log('Sample properties:', sampleProps);
      } else {
        console.log('⚠️  No properties found in database - this explains why the API returns empty results!');
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Possible solutions:');
      console.log('   - Check if database server is running');
      console.log('   - Verify host and port are correct');
      console.log('   - Check firewall settings');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Possible solutions:');
      console.log('   - Check username and password');
      console.log('   - Verify user has access to the database');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

testDatabaseConnection().catch(console.error);
