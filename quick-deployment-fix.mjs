#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function deploymentFix() {
  console.log('🚀 South Delhi Realty - Quick Deployment Fix');
  console.log('=============================================');
  
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
    
    // Fix 1: Import sample properties from properties.sql
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
        'Contact: +91-9876543210, Email: info@southdelhirealty.com',
        '28.535407368783215',
        '77.21019744873048',
        1
      ]);
      
      // Add more sample properties
      await connection.execute(`
        INSERT INTO properties (
          title, slug, description, status, category, property_type, sub_type, 
          area, area_unit, furnished_status, bedrooms, bathrooms, balconies, 
          facing, parking, age, price, price_negotiable, contact_details, 
          latitude, longitude, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Spacious 3BHK Independent House',
        'spacious-3bhk-independent-house',
        'Independent house with 3 bedrooms, 3 bathrooms, garden area, and parking space. Ideal for large families.',
        'rent',
        'residential',
        'independent-house',
        '3bhk',
        1800,
        'sq-ft',
        'semi-furnished',
        3,
        3,
        1,
        'east',
        'car',
        5,
        35000,
        1,
        'Contact: +91-9876543211, Email: rent@southdelhirealty.com',
        '28.545407368783215',
        '77.22019744873048',
        1
      ]);
      
      await connection.execute(`
        INSERT INTO properties (
          title, slug, description, status, category, property_type, sub_type, 
          area, area_unit, furnished_status, bedrooms, bathrooms, balconies, 
          facing, parking, age, price, price_negotiable, contact_details, 
          latitude, longitude, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Modern Commercial Shop in Market',
        'modern-commercial-shop-market',
        'Well-located commercial shop in busy market area. Perfect for retail business with high footfall.',
        'sale',
        'commercial',
        'shop',
        'other',
        400,
        'sq-ft',
        'unfurnished',
        0,
        1,
        0,
        'road',
        'two-wheeler',
        1,
        2500000,
        1,
        'Contact: +91-9876543212, Email: commercial@southdelhirealty.com',
        '28.525407368783215',
        '77.20019744873048',
        1
      ]);
      
      console.log('✅ Sample properties imported successfully!');
    } else {
      console.log(`✅ Found ${propertyCount} properties in database.`);
    }
    
    // Fix 2: Check existing users count
    console.log('\n👥 Checking users...');
    try {
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Found ${users[0].count} users in database.`);
      
      if (users[0].count === 0) {
        console.log('⚠️  No users found. You need to create an admin user manually.');
        console.log('💡 Use the application\'s registration feature to create an admin account.');
      }
    } catch (error) {
      console.log('⚠️  Users table may not exist yet. This is normal for fresh installations.');
    }
    
    // Fix 3: Verify tables exist
    console.log('\n🔍 Verifying database schema...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('Available tables:', tableNames);
    
    const requiredTables = ['properties'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables);
      console.log('💡 You need to run database migrations');
    } else {
      console.log('✅ Essential tables exist!');
    }
    
    // Fix 4: Final property count check
    const [finalProperties] = await connection.execute('SELECT COUNT(*) as count FROM properties WHERE is_active = 1');
    console.log(`📊 Active properties in database: ${finalProperties[0].count}`);
    
    console.log('\n✅ Quick deployment fix completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart the application container or PM2 process');
    console.log('   2. Check the homepage - properties should now be visible');
    console.log('   3. Visit /auth to login (you may need to register first)');
    console.log('   4. Add more properties through the admin panel');
    
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
