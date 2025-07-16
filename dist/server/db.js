"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDB = initializeDB;
exports.healthCheckDatabase = healthCheckDatabase;
exports.closeDatabase = closeDatabase;
const mysql2_1 = require("drizzle-orm/mysql2");
const mysql = __importStar(require("mysql2/promise"));
const schema = __importStar(require("../shared/schema"));
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    throw new Error("DATABASE_URL or DB_HOST must be provided");
}
const connectionConfig = process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0,
        acquireTimeout: 15000,
        timeout: 30000,
        reconnect: true,
        keepAliveInitialDelay: 0,
        enableKeepAlive: true,
        connectTimeout: 30000,
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: false,
        debug: false,
        trace: false,
        multipleStatements: false,
        charset: 'utf8mb4',
        idleTimeout: 300000,
        maxReconnects: 10,
        reconnectDelay: 2000,
    }
    : {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "southdelhirealestate",
        port: parseInt(process.env.DB_PORT || "3306"),
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0,
        acquireTimeout: 15000,
        timeout: 30000,
        reconnect: true,
        keepAliveInitialDelay: 0,
        enableKeepAlive: true,
        connectTimeout: 30000,
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: false,
        debug: false,
        trace: false,
        multipleStatements: false,
        charset: 'utf8mb4',
        idleTimeout: 300000,
        maxReconnects: 10,
        reconnectDelay: 2000,
    };
if (process.env.NODE_ENV === 'production' && process.env.DB_SSL_ENABLED === 'true') {
    connectionConfig.ssl = {
        rejectUnauthorized: false
    };
}
const connection = mysql.createPool(connectionConfig);
exports.db = (0, mysql2_1.drizzle)(connection, { schema, mode: "default" });
async function testDatabaseConnection(retries = 5, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`);
            const conn = await Promise.race([
                connection.getConnection(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000))
            ]);
            await Promise.race([
                conn.execute('SELECT 1 as test, NOW() as current_time'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000))
            ]);
            console.log('✅ Database connection test successful');
            console.log('📊 Database connection info:', {
                host: process.env.DB_HOST || 'DATABASE_URL',
                user: process.env.DB_USER || 'from_url',
                database: process.env.DB_NAME || 'from_url',
                port: process.env.DB_PORT || 'from_url',
                timeout: connectionConfig.timeout,
                acquireTimeout: connectionConfig.acquireTimeout,
                connectTimeout: connectionConfig.connectTimeout,
                environment: process.env.NODE_ENV || 'development'
            });
            conn.release();
            return;
        }
        catch (error) {
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
            delay = Math.min(delay * 1.5, 10000);
        }
    }
}
async function initializeDB() {
    try {
        await testDatabaseConnection();
        console.log('✅ Database initialized successfully with enhanced configuration');
    }
    catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
}
async function healthCheckDatabase() {
    try {
        const conn = await Promise.race([
            connection.getConnection(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
        ]);
        await conn.execute('SELECT 1 as health_check');
        conn.release();
        return true;
    }
    catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}
async function closeDatabase() {
    try {
        await connection.end();
        console.log('📴 Database connection pool closed');
    }
    catch (error) {
        console.error('Error closing database connection:', error);
    }
}
