#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

async function applySessionMigration() {
  console.log('🔄 Applying Session Migration');
  console.log('=============================');
  
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    multipleStatements: true,
  };

  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Database connected');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '0005_add_sessions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Applying sessions table migration...');
    await connection.execute(migrationSQL);
    console.log('✅ Sessions table migration applied successfully');
    
    // Verify the table was created
    console.log('🔍 Verifying sessions table...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'sessions'");
    
    if (tables.length > 0) {
      console.log('✅ Sessions table exists');
      
      // Show table structure
      const [structure] = await connection.execute('DESCRIBE sessions');
      console.log('📋 Sessions table structure:');
      console.table(structure);
    } else {
      console.log('❌ Sessions table was not created');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

applySessionMigration();
