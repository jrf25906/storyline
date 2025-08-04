import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack, service = 'memory-service', ...meta }) => {
      let log = `${timestamp} [${service}] ${level}: ${message}`;
      
      // Add metadata if present
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      
      // Add stack trace for errors
      if (stack) {
        log += `\n${stack}`;
      }
      
      return log;
    })
  ),
  defaultMeta: { service: 'memory-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: './logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));

  logger.add(new winston.transports.File({
    filename: './logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
}

export { logger };