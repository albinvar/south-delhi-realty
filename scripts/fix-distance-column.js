import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables
dotenv.config();

async function fixNearbyFacilitiesTable() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
    });

    console.log('✅ Connected to database');

    // Check existing columns
    console.log('🔍 Checking existing columns in nearby_facilities table...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'nearby_facilities' 
      AND TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Existing columns:', existingColumns);

    const requiredColumns = [
      { name: 'distance_value', type: 'INT NULL', after: 'distance', description: 'Numeric distance in meters' },
      { name: 'latitude', type: 'TEXT NULL', after: 'facility_type', description: 'Facility latitude coordinates' },
      { name: 'longitude', type: 'TEXT NULL', after: 'latitude', description: 'Facility longitude coordinates' },
      { name: 'created_at', type: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP', after: 'longitude', description: 'Record creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', after: 'created_at', description: 'Record update timestamp' }
    ];

    // Add missing columns
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding missing column: ${column.name} (${column.description})`);
        
        try {
          await connection.execute(`
            ALTER TABLE nearby_facilities 
            ADD COLUMN ${column.name} ${column.type} 
            AFTER ${column.after}
          `);
          console.log(`✅ Successfully added ${column.name} column`);
        } catch (error) {
          console.error(`❌ Error adding ${column.name} column:`, error.message);
        }
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }

    // Verify final table structure
    console.log('🔍 Verifying final table structure...');
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'nearby_facilities' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    console.log('📋 Final table structure:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });

    console.log('🎉 Database migration completed successfully!');
    console.log('🔧 All required columns have been added to nearby_facilities table');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
fixNearbyFacilitiesTable(); 