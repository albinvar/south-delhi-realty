import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  throw new Error("DATABASE_URL or DB_HOST must be provided");
}

// Enhanced MySQL connection pool configuration with improved timeout handling
const connectionConfig = process.env.DATABASE_URL 
  ? {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 15,               // Increased connection limit
      queueLimit: 0,
      // Enhanced timeout settings for production stability
      acquireTimeout: 15000,             // 15 seconds to acquire connection from pool
      timeout: 30000,                    // 30 seconds for SQL queries (increased)
      reconnect: true,                   // Enable auto-reconnect
      keepAliveInitialDelay: 0,          // Keep-alive settings
      enableKeepAlive: true,
      // Enhanced connection timeout settings
      connectTimeout: 30000,             // 30 seconds to establish initial connection
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      debug: false,
      trace: false,
      multipleStatements: false,
      charset: 'utf8mb4',
      // Additional resilience settings
      idleTimeout: 300000,               // 5 minutes idle timeout
      maxReconnects: 10,                 // Maximum reconnection attempts
      reconnectDelay: 2000,              // Delay between reconnection attempts
    }
  : {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "southdelhirealestate",
      port: parseInt(process.env.DB_PORT || "3306"),
      waitForConnections: true,
      connectionLimit: 15,               // Increased connection limit
      queueLimit: 0,
      // Enhanced timeout settings for production stability
      acquireTimeout: 15000,             // 15 seconds to acquire connection from pool
      timeout: 30000,                    // 30 seconds for SQL queries (increased)
      reconnect: true,                   // Enable auto-reconnect
      keepAliveInitialDelay: 0,          // Keep-alive settings
      enableKeepAlive: true,
      // Enhanced connection timeout settings
      connectTimeout: 30000,             // 30 seconds to establish initial connection
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      debug: false,
      trace: false,
      multipleStatements: false,
      charset: 'utf8mb4',
      // Additional resilience settings
      idleTimeout: 300000,               // 5 minutes idle timeout
      maxReconnects: 10,                 // Maximum reconnection attempts
      reconnectDelay: 2000,              // Delay between reconnection attempts
    };

// Add SSL configuration only for production if needed
if (process.env.NODE_ENV === 'production' && process.env.DB_SSL_ENABLED === 'true') {
  (connectionConfig as any).ssl = {
    rejectUnauthorized: false
  };
}

// Create MySQL connection pool with enhanced configuration
const connection = mysql.createPool(connectionConfig as any);

// Drizzle ORM client
export const db = drizzle(connection, { schema, mode: "default" });

// Enhanced connection retry logic for production environments
async function testDatabaseConnection(retries = 5, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`);
      
      const conn = await Promise.race([
        connection.getConnection(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
        )
      ]);
      
      // Test with a simple query with timeout
      await Promise.race([
        conn.execute('SELECT 1 as test, NOW() as current_time'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
        )
      ]);
      
      console.log('✅ Database connection test successful');
      console.log('📊 Database connection info:', {
        host: process.env.DB_HOST || 'DATABASE_URL',
        user: process.env.DB_USER || 'from_url',
        database: process.env.DB_NAME || 'from_url',
        port: process.env.DB_PORT || 'from_url',
        timeout: (connectionConfig as any).timeout,
        acquireTimeout: (connectionConfig as any).acquireTimeout,
        connectTimeout: (connectionConfig as any).connectTimeout,
        environment: process.env.NODE_ENV || 'development'
      });
      
      conn.release();
      return;
      
    } catch (error: any) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        attempt: i + 1,
        totalRetries: retries
      });
      
      if (i === retries - 1) {
        console.error('🚨 CRITICAL: Database connection failed after all retry attempts');
        console.error('🔧 Troubleshooting steps:');
        console.error('   1. Check if database server is running');
        console.error('   2. Verify database credentials in environment variables');
        console.error('   3. Check network connectivity to database server');
        console.error('   4. Verify firewall settings');
        console.error('   5. Check if database server is overloaded');
        
        throw new Error(`Failed to connect to database after ${retries} attempts: ${error.message}`);
      }
      
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 10000); // Exponential backoff with max 10s
    }
  }
}

// Initialize database connection with retry logic
export async function initializeDB(): Promise<void> {
  try {
    await testDatabaseConnection();
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
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      )
    ]);
    
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
