#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

async function deploymentFix() {
  console.log('🚀 South Delhi Realty - Deployment Fix Script');
  console.log('==============================================');
  
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    connectTimeout: 10000,
    multipleStatements: true,
  };

  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Database connection established!');
    
    // Fix 1: Check and create super admin user
    console.log('\n📝 Checking for super admin user...');
    const [users] = await connection.execute('SELECT * FROM users WHERE role = "superadmin" OR role = "admin" LIMIT 1');
    
    if (users.length === 0) {
      console.log('⚠️  No admin users found. Creating super admin...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('superadmin123', 12);
      
      // Insert super admin
      await connection.execute(`
        INSERT INTO users (username, email, password, role, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, ['superadmin', 'superadmin@southdelhirealty.com', hashedPassword, 'superadmin']);
      
      console.log('✅ Super admin user created successfully!');
      console.log('   Username: superadmin');
      console.log('   Password: superadmin123');
      console.log('   Email: superadmin@southdelhirealty.com');
    } else {
      console.log(`✅ Found ${users.length} existing admin user(s).`);
    }
    
    // Fix 2: Check and import properties
    console.log('\n📦 Checking properties...');
    const [properties] = await connection.execute('SELECT COUNT(*) as count FROM properties');
    const propertyCount = properties[0].count;
    
    if (propertyCount === 0) {
      console.log('⚠️  No properties found. Importing sample property...');
      
      await connection.execute(`
        INSERT INTO properties (
          title, slug, description, status, category, property_type, sub_type, 
          area, area_unit, furnished_status, bedrooms, bathrooms, balconies, 
          facing, parking, age, price, price_negotiable, contact_details, 
          latitude, longitude, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Luxurious 2BHK Apartment in South Delhi',
        'luxurious-2bhk-apartment-south-delhi',
        'Beautiful 2BHK apartment with modern amenities, spacious rooms, and excellent connectivity. Perfect for families looking for comfort and luxury in South Delhi.',
        'sale',
        'residential',
        'apartment',
        '2bhk',
        1200,
        'sq-ft',
        'furnished',
        2,
        2,
        2,
        'south',
        'car',
        2,
        5500000,
        1,
        'Contact: +91-9876543210',
        '28.535407368783215',
        '77.21019744873048',
        1
      ]);
      
      console.log('✅ Sample property imported successfully!');
    } else {
      console.log(`✅ Found ${propertyCount} properties in database.`);
    }
    
    // Fix 3: Verify tables exist
    console.log('\n🔍 Verifying database schema...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('Available tables:', tableNames);
    
    const requiredTables = ['users', 'properties', 'property_media', 'inquiries', 'nearby_facilities'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables);
      console.log('💡 You may need to run database migrations');
    } else {
      console.log('✅ All required tables exist!');
    }
    
    // Fix 4: Check for property media
    if (tableNames.includes('property_media')) {
      const [media] = await connection.execute('SELECT COUNT(*) as count FROM property_media');
      console.log(`📷 Property media count: ${media[0].count}`);
    }
    
    // Fix 5: Check for inquiries
    if (tableNames.includes('inquiries')) {
      const [inquiries] = await connection.execute('SELECT COUNT(*) as count FROM inquiries');
      console.log(`📧 Inquiries count: ${inquiries[0].count}`);
    }
    
    console.log('\n✅ Deployment fix completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart the application: docker-compose restart or pm2 restart all');
    console.log('   2. Visit /auth to login with superadmin credentials');
    console.log('   3. Add more properties through the admin panel');
    console.log('   4. Change the default superadmin password');
    
  } catch (error) {
    console.error('❌ Deployment fix failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

deploymentFix().catch(console.error);
