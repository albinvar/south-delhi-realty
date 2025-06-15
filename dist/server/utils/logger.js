"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const createLogger = () => {
    const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
    const logger = winston_1.default.createLogger({
        level: logLevel,
        format: logFormat,
        defaultMeta: {
            service: 'south-delhi-real-estate',
            environment: process.env.NODE_ENV || 'development'
        },
        transports: [
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            })
        ]
    });
    if (process.env.NODE_ENV === 'production') {
        const logsDir = path_1.default.join(__dirname, '../../logs');
        logger.add(new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 10,
            format: logFormat
        }));
        logger.add(new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 10,
            format: logFormat
        }));
        logger.add(new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'access.log'),
            level: 'info',
            maxsize: 5242880,
            maxFiles: 10,
            format: logFormat
        }));
    }
    logger.exceptions.handle(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
    return logger;
};
exports.createLogger = createLogger;
