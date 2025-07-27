import { createLogger as createWinstonLogger, format, transports } from 'winston';
import path from 'path';

export function createLogger() {
  const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
  
  const logFormat = format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.json()
  );

  const logger = createWinstonLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'south-delhi-real-estate' },
    transports: [
      // Always log to console
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      })
    ]
  });

  // Add file transports for production
  if (process.env.NODE_ENV === 'production') {
    // Use relative path that works in Docker
    const logsDir = path.resolve(process.cwd(), 'logs');
    
    // Error log
    logger.add(new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }));

    // Combined log
    logger.add(new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }));

    // Access log (info level and above)
    logger.add(new transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'info',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }));
  }

  return logger;
}
