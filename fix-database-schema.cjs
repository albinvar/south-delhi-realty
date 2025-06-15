const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'south-delhi-realty-do-user-23263628-0.d.db.ondigitalocean.com',
  user: process.env.DB_USER || 'doadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'defaultdb',
  port: parseInt(process.env.DB_PORT || '25060'),
  ssl: { rejectUnauthorized: false },
  connectTimeout: 60000
};

async function addPasswordColumnToUsers(connection) {
  console.log('🔧 Adding password column to users table...');
  
  try {
    // Check if password column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
    `, [DB_CONFIG.database]);
    
    if (columns.length > 0) {
      console.log('✅ Password column already exists in users table');
      return;
    }
    
    // Add password column
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN password text DEFAULT NULL 
      AFTER email
    `);
    
    console.log('✅ Password column added to users table successfully!');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Password column already exists');
    } else {
      throw error;
    }
  }
}

async function updateSuperAdminPassword(connection) {
  console.log('🔑 Setting superadmin password...');
  
  try {
    // Hash the password using the same method as the application
    const crypto = require('crypto');
    
    function hashPassword(password) {
      return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
          if (err) reject(err);
          resolve(`10000:${salt}:${derivedKey.toString('hex')}`);
        });
      });
    }
    
    const hashedPassword = await hashPassword('superadmin123');
    
    // Update or insert superadmin user
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['superadmin']
    );
    
    if (existingUsers.length > 0) {
      // Update existing superadmin
      await connection.execute(`
        UPDATE users 
        SET password = ?, role = 'superadmin', email = 'superadmin@southdelhirealty.com'
        WHERE username = 'superadmin'
      `, [hashedPassword]);
      console.log('✅ Superadmin password updated successfully!');
    } else {
      // Insert new superadmin
      await connection.execute(`
        INSERT INTO users (username, email, password, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, ['superadmin', 'superadmin@southdelhirealty.com', hashedPassword, 'superadmin']);
      console.log('✅ Superadmin user created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error setting superadmin password:', error.message);
    throw error;
  }
}

async function verifyUserTable(connection) {
  console.log('🔍 Verifying users table structure...');
  
  try {
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
      ORDER BY ORDINAL_POSITION
    `, [DB_CONFIG.database]);
    
    console.log('📋 Users table structure:');
    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verify superadmin user exists
    const [users] = await connection.execute('SELECT username, email, role FROM users WHERE username = ?', ['superadmin']);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('✅ Superadmin user verified:');
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log('❌ Superadmin user not found');
    }
    
  } catch (error) {
    console.error('❌ Error verifying users table:', error.message);
  }
}

async function main() {
  let connection;
  
  try {
    console.log('🔧 South Delhi Real Estate - Database Schema Fix');
    console.log('==============================================');
    console.log('🎯 Fixing missing password column in users table');
    console.log('');
    
    if (!DB_CONFIG.password) {
      console.error('❌ Database password not found in environment variables!');
      console.error('💡 Make sure DB_PASSWORD is set in your .env file');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to DigitalOcean MySQL database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected successfully!');
    
    // Add password column if missing
    await addPasswordColumnToUsers(connection);
    
    // Set superadmin password
    await updateSuperAdminPassword(connection);
    
    // Verify everything is working
    await verifyUserTable(connection);
    
    console.log('');
    console.log('🎉 Database schema fix completed successfully!');
    console.log('');
    console.log('🔑 Superadmin Login Credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin123');
    console.log('   Email: superadmin@southdelhirealty.com');
    console.log('');
    console.log('🌐 Login URL: https://south-delhi-realty-4g75c.ondigitalocean.app/auth');
    
  } catch (error) {
    console.error('');
    console.error('❌ Schema fix failed:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timed out. This may be due to network restrictions.');
      console.error('📝 The users table structure needs to be fixed manually.');
      console.error('🔧 Required SQL command:');
      console.error('   ALTER TABLE users ADD COLUMN password text DEFAULT NULL AFTER email;');
    } else {
      console.error('💡 Error details:', error);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Database connection closed.');
      } catch (err) {
        console.log('⚠️ Error closing connection:', err.message);
      }
    }
  }
}

// Start the fix
main().catch(console.error); 