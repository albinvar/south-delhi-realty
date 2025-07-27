"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const winston_1 = require("winston");
const path_1 = __importDefault(require("path"));
function createLogger() {
    const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    const logFormat = winston_1.format.combine(winston_1.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston_1.format.errors({ stack: true }), winston_1.format.json());
    const logger = (0, winston_1.createLogger)({
        level: logLevel,
        format: logFormat,
        defaultMeta: { service: 'south-delhi-real-estate' },
        transports: [
            new winston_1.transports.Console({
                format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
            })
        ]
    });
    if (process.env.NODE_ENV === 'production') {
        const logsDir = path_1.default.resolve(process.cwd(), 'logs');
        logger.add(new winston_1.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            format: logFormat,
            handleExceptions: true,
            handleRejections: true,
            maxsize: 5242880,
            maxFiles: 5,
        }));
        logger.add(new winston_1.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
            format: logFormat,
            maxsize: 5242880,
            maxFiles: 5,
        }));
        logger.add(new winston_1.transports.File({
            filename: path_1.default.join(logsDir, 'access.log'),
            level: 'info',
            format: logFormat,
            maxsize: 5242880,
            maxFiles: 5,
        }));
    }
    return logger;
}
