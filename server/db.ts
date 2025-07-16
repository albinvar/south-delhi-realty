import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  throw new Error("DATABASE_URL or DB_HOST must be provided");
}

// Enhanced MySQL connection pool configuration with proper timeouts
const connectionConfig = process.env.DATABASE_URL 
  ? {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Connection timeout settings
      acquireTimeout: 10000,        // 10 seconds to acquire connection from pool
      timeout: 15000,               // 15 seconds for SQL queries
      reconnect: true,              // Enable auto-reconnect
      keepAliveInitialDelay: 0,     // Keep-alive settings
      enableKeepAlive: true,
      // SSL settings for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      // Additional timeout settings
      connectTimeout: 20000,        // 20 seconds to establish initial connection
      socketPath: undefined,
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      debug: false,
      trace: false,
      multipleStatements: false,
      flags: '',
      charset: 'utf8mb4'
    }
  : {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "southdelhirealestate",
      port: parseInt(process.env.DB_PORT || "3306"),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Connection timeout settings
      acquireTimeout: 10000,        // 10 seconds to acquire connection from pool
      timeout: 15000,               // 15 seconds for SQL queries
      reconnect: true,              // Enable auto-reconnect
      keepAliveInitialDelay: 0,     // Keep-alive settings
      enableKeepAlive: true,
      // SSL settings for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      // Additional timeout settings
      connectTimeout: 20000,        // 20 seconds to establish initial connection
      socketPath: undefined,
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      debug: false,
      trace: false,
      multipleStatements: false,
      flags: '',
      charset: 'utf8mb4'
    };

// Create MySQL connection pool with enhanced configuration
const connection = mysql.createPool(connectionConfig);

// Drizzle ORM client
export const db = drizzle(connection, { schema, mode: "default" });

// Enhanced connection retry logic
async function testDatabaseConnection(retries = 3, delay = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`);
      
      const conn = await connection.getConnection();
      
      // Test with a simple query
      await conn.execute('SELECT 1 as test');
      
      console.log('✅ Database connection test successful');
      console.log('📊 Database connection info:', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        timeout: connectionConfig.timeout,
        acquireTimeout: connectionConfig.acquireTimeout,
        connectTimeout: connectionConfig.connectTimeout
      });
      
      conn.release();
      return;
      
    } catch (error: any) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      });
      
      if (i === retries - 1) {
        throw new Error(`Failed to connect to database after ${retries} attempts: ${error.message}`);
      }
      
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }
}

// Initialize database connection with retry logic
export async function initializeDB(): Promise<void> {
  try {
    await testDatabaseConnection();
    
    // Set up connection event handlers
    connection.on('connection', (connection) => {
      console.log('📡 New database connection established');
    });
    
    connection.on('error', (error) => {
      console.error('💥 Database connection error:', error);
      if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Database connection lost, will attempt to reconnect...');
      }
    });
    
    console.log('✅ Database initialized successfully with enhanced configuration');
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Health check function that doesn't rely on Drizzle ORM
export async function healthCheckDatabase(): Promise<boolean> {
  try {
    const conn = await Promise.race([
      connection.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      )
    ]) as mysql.PoolConnection;
    
    await conn.execute('SELECT 1 as health_check');
    conn.release();
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

// Graceful shutdown function
export async function closeDatabase(): Promise<void> {
  try {
    await connection.end();
    console.log('📴 Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
