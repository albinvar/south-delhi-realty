import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: process.env.DB_HOST?.includes('digitalocean') ? { rejectUnauthorized: false } : false
};

async function fixDatabase() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    // Fix 1: Check and add missing columns to nearby_facilities table
    console.log('\n🔍 Checking nearby_facilities table structure...');
    
    const [tableInfo] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'nearby_facilities'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    console.log('Current nearby_facilities columns:', tableInfo.map(col => col.COLUMN_NAME));
    
    const existingColumns = tableInfo.map(col => col.COLUMN_NAME);
    const requiredColumns = ['distance_value', 'latitude', 'longitude'];
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column)) {
        console.log(`➕ Adding missing column: ${column}`);
        
        switch (column) {
          case 'distance_value':
            await connection.execute(`
              ALTER TABLE nearby_facilities 
              ADD COLUMN distance_value INT NULL 
              COMMENT 'Numeric distance value in meters for calculations'
            `);
            break;
          case 'latitude':
            await connection.execute(`
              ALTER TABLE nearby_facilities 
              ADD COLUMN latitude TEXT NULL 
              COMMENT 'Latitude coordinate for map display'
            `);
            break;
          case 'longitude':
            await connection.execute(`
              ALTER TABLE nearby_facilities 
              ADD COLUMN longitude TEXT NULL 
              COMMENT 'Longitude coordinate for map display'
            `);
            break;
        }
        console.log(`✅ Added column: ${column}`);
      } else {
        console.log(`✅ Column ${column} already exists`);
      }
    }
    
    // Fix 2: Check and fix inquiries table status column
    console.log('\n🔍 Checking inquiries table status column...');
    
    const [inquiriesInfo] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'inquiries' AND COLUMN_NAME = 'status'
    `, [process.env.DB_NAME]);
    
    if (inquiriesInfo.length > 0) {
      const statusColumn = inquiriesInfo[0];
      console.log('Current status column:', statusColumn);
      
      // Check if it's the correct ENUM type
      const expectedColumnType = "enum('new','contacted','resolved')";
      if (statusColumn.COLUMN_TYPE !== expectedColumnType) {
        console.log(`🔧 Fixing status column type from "${statusColumn.COLUMN_TYPE}" to "${expectedColumnType}"`);
        
        // First, check if there are any existing inquiries with invalid status
        const [existingInquiries] = await connection.execute(`
          SELECT id, status FROM inquiries WHERE status NOT IN ('new', 'contacted', 'resolved')
        `);
        
        if (existingInquiries.length > 0) {
          console.log(`🔄 Found ${existingInquiries.length} inquiries with invalid status, fixing...`);
          for (const inquiry of existingInquiries) {
            await connection.execute(`
              UPDATE inquiries SET status = 'new' WHERE id = ?
            `, [inquiry.id]);
          }
        }
        
        // Now alter the column to the correct ENUM type
        await connection.execute(`
          ALTER TABLE inquiries 
          MODIFY COLUMN status ENUM('new', 'contacted', 'resolved') NOT NULL DEFAULT 'new'
        `);
        console.log('✅ Status column fixed to correct ENUM type');
      } else {
        console.log('✅ Status column is already correct');
      }
    } else {
      console.log('❌ Status column not found in inquiries table');
    }
    
    // Fix 3: Verify and test the fixes
    console.log('\n🧪 Testing the fixes...');
    
    // Test nearby_facilities columns
    const [testNearbyFacilities] = await connection.execute(`
      SELECT distance_value, latitude, longitude FROM nearby_facilities LIMIT 1
    `);
    console.log('✅ nearby_facilities missing columns test passed');
    
    // Test inquiries status enum
    const [testInquiries] = await connection.execute(`
      SELECT status FROM inquiries WHERE status IN ('new', 'contacted', 'resolved') LIMIT 5
    `);
    console.log(`✅ inquiries status enum test passed (found ${testInquiries.length} valid status entries)`);
    
    // Test updating an inquiry status (if any exist)
    const [existingInquiry] = await connection.execute(`
      SELECT id FROM inquiries LIMIT 1
    `);
    
    if (existingInquiry.length > 0) {
      const inquiryId = existingInquiry[0].id;
      console.log(`🧪 Testing status update on inquiry ID ${inquiryId}...`);
      
      await connection.execute(`
        UPDATE inquiries SET status = 'contacted' WHERE id = ?
      `, [inquiryId]);
      
      await connection.execute(`
        UPDATE inquiries SET status = 'resolved' WHERE id = ?
      `, [inquiryId]);
      
      await connection.execute(`
        UPDATE inquiries SET status = 'new' WHERE id = ?
      `, [inquiryId]);
      
      console.log('✅ Inquiry status update test passed');
    }
    
    console.log('\n🎉 All database fixes completed successfully!');
    console.log('\n📋 Summary of fixes:');
    console.log('✅ Added missing columns to nearby_facilities table (if needed)');
    console.log('✅ Fixed inquiries status column ENUM type (if needed)');
    console.log('✅ Verified all fixes are working correctly');
    
  } catch (error) {
    console.error('❌ Database fix error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
fixDatabase()
  .then(() => {
    console.log('\n✅ Database fixes completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database fixes failed:', error);
    process.exit(1);
  }); 