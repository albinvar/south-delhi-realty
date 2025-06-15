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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const db_1 = require("./db");
const routes_1 = require("./routes");
const sitemap_1 = __importDefault(require("./sitemap"));
const storage_1 = require("./storage");
const logger_1 = require("./utils/logger");
const vite_1 = require("./vite");
const logger = (0, logger_1.createLogger)();
global.USE_IN_MEMORY_STORAGE = true;
async function startServer() {
    try {
        await (0, db_1.initializeDB)();
        console.log('✅ Database initialized successfully');
        const app = (0, express_1.default)();
        const server = (0, http_1.createServer)(app);
        app.set('trust proxy', 1);
        app.use(express_1.default.json({ limit: '100mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '100mb' }));
        const isDevelopment = process.env.NODE_ENV === 'development';
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    mediaSrc: ["'self'", "https:", "data:", "blob:", "https://res.cloudinary.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    connectSrc: [
                        "'self'",
                        "https://api.cloudinary.com",
                        "https://res.cloudinary.com",
                        "https://overpass-api.de",
                        ...(isDevelopment ? [
                            "ws://localhost:*",
                            "ws://127.0.0.1:*",
                            "wss://localhost:*",
                            "wss://127.0.0.1:*"
                        ] : [])
                    ],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    baseUri: ["'self'"],
                    formAction: ["'self'"],
                    frameAncestors: ["'self'"],
                    scriptSrcAttr: ["'none'"],
                    upgradeInsecureRequests: isDevelopment ? null : []
                }
            },
            crossOriginEmbedderPolicy: false
        }));
        app.use((0, compression_1.default)({
            level: 6,
            threshold: 1024,
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression_1.default.filter(req, res);
            }
        }));
        if (process.env.NODE_ENV === 'production') {
            app.use((0, morgan_1.default)('combined', {
                stream: {
                    write: (message) => logger.info(message.trim())
                }
            }));
        }
        else {
            app.use((0, morgan_1.default)('dev'));
        }
        const nodeEnv = (process.env.NODE_ENV || 'development').trim();
        const allowedOrigins = nodeEnv === 'production'
            ? (process.env.ALLOWED_ORIGINS || 'http://localhost:7822,http://127.0.0.1:7822,http://localhost:5000,http://127.0.0.1:5000,https://southdelhirealty.com').split(',').filter(Boolean).map(origin => origin.trim())
            : [
                'http://localhost:3000',
                'http://localhost:5000',
                'http://localhost:7822',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5000',
                'http://127.0.0.1:7822',
                'https://southdelhirealty.com'
            ];
        console.log(`CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);
        const corsOptions = {
            origin: (origin, callback) => {
                if (!origin) {
                    return callback(null, true);
                }
                if (origin && allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    logger.warn(`CORS blocked request from origin: ${origin}. Allowed origins: ${JSON.stringify(allowedOrigins)}`);
                    callback(new Error('Not allowed by CORS'), false);
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
            exposedHeaders: ['Set-Cookie']
        };
        app.use((0, cors_1.default)(corsOptions));
        if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'your-secret-key-change-in-production') {
            if (process.env.NODE_ENV === 'production') {
                logger.error('SESSION_SECRET must be set in production!');
                process.exit(1);
            }
            else {
                logger.warn('Using default SESSION_SECRET in development');
            }
        }
        const sessionConfig = {
            secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
            resave: false,
            saveUninitialized: false,
            store: storage_1.storage.sessionStore,
            name: 'southdelhi.session',
            proxy: true,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true,
            }
        };
        if (process.env.NODE_ENV === 'production' && process.env.SSL_ENABLED === 'true') {
            sessionConfig.cookie.secure = true;
            sessionConfig.cookie.sameSite = 'lax';
        }
        app.use((0, express_session_1.default)(sessionConfig));
        app.use(passport_1.default.initialize());
        app.use(passport_1.default.session());
        app.get('/health', async (req, res) => {
            try {
                await storage_1.storage.getDashboardStats();
                res.status(200).json({ status: 'healthy' });
            }
            catch (error) {
                logger.error('Health check failed:', error);
                res.status(503).json({ status: 'unhealthy', error: 'Database connection failed' });
            }
        });
        app.get('/ready', async (req, res) => {
            try {
                await storage_1.storage.getDashboardStats();
                res.status(200).json({ status: 'Ready' });
            }
            catch (error) {
                logger.error('Readiness check failed:', error);
                res.status(503).json({ status: 'Not Ready', error: 'Database connection failed' });
            }
        });
        app.get('/metrics', (req, res) => {
            const metrics = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                timestamp: new Date().toISOString()
            };
            res.json(metrics);
        });
        app.use((req, res, next) => {
            const start = Date.now();
            const path = req.path;
            let capturedJsonResponse = undefined;
            const originalResJson = res.json;
            res.json = function (bodyJson, ...args) {
                capturedJsonResponse = bodyJson;
                return originalResJson.apply(res, [bodyJson, ...args]);
            };
            res.on("finish", () => {
                const duration = Date.now() - start;
                if (path.startsWith("/api")) {
                    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
                    if (capturedJsonResponse) {
                        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
                    }
                    if (logLine.length > 80) {
                        logLine = logLine.slice(0, 79) + "…";
                    }
                    (0, vite_1.log)(logLine);
                    if (res.statusCode >= 400) {
                        logger.error(`${req.method} ${path} ${res.statusCode} - ${req.ip} - ${duration}ms`);
                    }
                }
            });
            next();
        });
        app.use('/', sitemap_1.default);
        await (0, routes_1.registerRoutes)(app);
        console.log('✅ Routes registered successfully');
        const env = (process.env.NODE_ENV || 'development').trim();
        console.log(`Environment check: "${env}"`);
        if (env === "development") {
            console.log("Using Vite development server");
            await (0, vite_1.setupVite)(app, server);
        }
        else {
            console.log("Using static file serving");
            (0, vite_1.serveStatic)(app);
        }
        app.use('/api/*', (req, res) => {
            res.status(404).json({ message: 'API endpoint not found' });
        });
        app.use((err, req, res, next) => {
            const status = err.status || err.statusCode || 500;
            const message = err.message || "Internal Server Error";
            logger.error('Unhandled error:', {
                error: {
                    message: err.message,
                    stack: err.stack,
                    name: err.name,
                    ...err
                },
                request: {
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    ip: req.ip
                }
            });
            const responseMessage = process.env.NODE_ENV === 'production' && status === 500
                ? 'Internal Server Error'
                : message;
            res.status(status).json({
                message: responseMessage,
                ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
            });
        });
        const gracefulShutdown = (signal) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);
            server.close(() => {
                logger.info('HTTP server closed.');
                logger.info('Application shutdown complete.');
                process.exit(0);
            });
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
        if (process.env.NODE_ENV === 'production') {
            try {
                const { initializeSuperAdmin } = await Promise.resolve().then(() => __importStar(require('./init-superadmin')));
                await initializeSuperAdmin();
            }
            catch (error) {
                logger.warn('Superadmin initialization failed:', error instanceof Error ? error.message : String(error));
            }
        }
        const port = parseInt(process.env.PORT || '5000', 10);
        server.listen(port, '0.0.0.0', () => {
            logger.info(`🚀 South Delhi Real Estate server starting...`);
            logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 Server running on port ${port}`);
            logger.info(`📊 Health check: http://localhost:${port}/health`);
            if (process.env.NODE_ENV === 'production') {
                logger.info(`👤 Default superadmin credentials: superadmin / superadmin123`);
            }
            (0, vite_1.log)(`serving on port ${port}`);
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});
