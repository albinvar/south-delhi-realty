#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkDatabaseStructure() {
  console.log('🔍 Database Structure Check');
  console.log('===========================');
  
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');
    
    // Check properties table structure
    console.log('\n📋 Properties table structure:');
    const [columns] = await connection.execute('DESCRIBE properties');
    console.table(columns);
    
    // Check sample data
    console.log('\n📊 Sample properties:');
    const [properties] = await connection.execute('SELECT id, title, status, is_active FROM properties LIMIT 3');
    console.table(properties);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseStructure();
