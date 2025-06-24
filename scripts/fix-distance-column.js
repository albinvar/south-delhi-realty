const mysql = require('mysql2/promise');
require('dotenv').config();

async function addDistanceValueColumn() {
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

    // Check if column already exists
    console.log('🔍 Checking if distance_value column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'nearby_facilities' 
      AND COLUMN_NAME = 'distance_value'
      AND TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    if (columns.length > 0) {
      console.log('✅ distance_value column already exists');
      return;
    }

    // Add the missing column
    console.log('➕ Adding distance_value column...');
    await connection.execute(`
      ALTER TABLE nearby_facilities 
      ADD COLUMN distance_value INT NULL 
      AFTER distance
    `);

    console.log('✅ Successfully added distance_value column');

    // Update existing records to calculate distance_value if possible
    console.log('🔄 Updating existing records...');
    const [facilities] = await connection.execute(`
      SELECT id, distance FROM nearby_facilities 
      WHERE distance_value IS NULL AND distance IS NOT NULL
    `);

    for (const facility of facilities) {
      try {
        // Extract numeric value from distance string
        const distanceMatch = facility.distance.match(/^(\d+(\.\d+)?)/);
        if (distanceMatch) {
          const distanceNumeric = parseFloat(distanceMatch[1]);
          let distanceValue;
          
          if (facility.distance.toLowerCase().includes('km')) {
            distanceValue = Math.round(distanceNumeric * 1000); // Convert km to meters
          } else if (facility.distance.toLowerCase().includes('m')) {
            distanceValue = Math.round(distanceNumeric); // Already in meters
          } else {
            // Assume km if no unit specified
            distanceValue = Math.round(distanceNumeric * 1000);
          }

          await connection.execute(`
            UPDATE nearby_facilities 
            SET distance_value = ? 
            WHERE id = ?
          `, [distanceValue, facility.id]);
          
          console.log(`  Updated facility ${facility.id}: ${facility.distance} -> ${distanceValue}m`);
        }
      } catch (error) {
        console.error(`  Failed to update facility ${facility.id}:`, error.message);
      }
    }

    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔗 Database connection closed');
    }
  }
}

// Run the migration
addDistanceValueColumn()
  .then(() => {
    console.log('🎉 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }); 