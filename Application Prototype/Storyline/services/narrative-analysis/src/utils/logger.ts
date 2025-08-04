import winston from 'winston';

/**
 * Logger configuration for the Narrative Analysis Service
 * Includes PII redaction and structured logging
 */

// PII patterns to redact from logs
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN format
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card format
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
];

/**
 * Redacts PII from log messages
 */
const redactPII = (message: string): string => {
  let redacted = message;
  PII_PATTERNS.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  return redacted;
};

/**
 * Custom format that redacts PII and structures logs
 */
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Redact PII from message and stack trace
    const redactedMessage = redactPII(typeof message === 'string' ? message : JSON.stringify(message));
    const redactedStack = stack ? redactPII(stack) : undefined;
    
    // Structure the log entry
    const logEntry = {
      timestamp,
      level,
      service: 'narrative-analysis',
      message: redactedMessage,
      ...(redactedStack && { stack: redactedStack }),
      ...meta,
    };
    
    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const redactedMessage = redactPII(typeof message === 'string' ? message : JSON.stringify(message));
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${redactedMessage}${metaString}`;
  })
);

/**
 * Create logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: {
    service: 'narrative-analysis',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

/**
 * Create child logger with additional context
 */
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

/**
 * Log analysis performance metrics
 */
export const logAnalysisMetrics = (metrics: {
  analysisId: string;
  userId: string;
  projectId: string;
  processingTime: number;
  contentLength: number;
  framework: string;
  success: boolean;
  error?: string;
}) => {
  logger.info('Analysis completed', {
    category: 'performance',
    analysisId: metrics.analysisId,
    userId: metrics.userId,
    projectId: metrics.projectId,
    processingTime: metrics.processingTime,
    contentLength: metrics.contentLength,
    framework: metrics.framework,
    success: metrics.success,
    ...(metrics.error && { error: redactPII(metrics.error) }),
  });
};

/**
 * Log AI provider interactions
 */
export const logAIInteraction = (interaction: {
  provider: string;
  model: string;
  tokens: number;
  cost?: number;
  latency: number;
  success: boolean;
  error?: string;
}) => {
  logger.info('AI provider interaction', {
    category: 'ai-interaction',
    provider: interaction.provider,
    model: interaction.model,
    tokens: interaction.tokens,
    cost: interaction.cost,
    latency: interaction.latency,
    success: interaction.success,
    ...(interaction.error && { error: redactPII(interaction.error) }),
  });
};

/**
 * Log cultural sensitivity checks
 */
export const logCulturalSensitivity = (check: {
  userId: string;
  projectId: string;
  culturalFramework: string;
  flags: string[];
  severity: string;
}) => {
  logger.info('Cultural sensitivity check', {
    category: 'cultural-sensitivity',
    userId: check.userId,
    projectId: check.projectId,
    culturalFramework: check.culturalFramework,
    flags: check.flags,
    severity: check.severity,
  });
};

/**
 * Log trauma-informed interventions
 */
export const logTraumaIntervention = (intervention: {
  userId: string;
  projectId: string;
  severity: string;
  triggers: string[];
  responseType: string;
  resourcesProvided: boolean;
}) => {
  logger.warn('Trauma-informed intervention', {
    category: 'trauma-intervention',
    userId: intervention.userId,
    projectId: intervention.projectId,
    severity: intervention.severity,
    triggers: intervention.triggers,
    responseType: intervention.responseType,
    resourcesProvided: intervention.resourcesProvided,
  });
};

/**
 * Log system errors with context
 */
export const logSystemError = (error: Error, context: Record<string, any> = {}) => {
  logger.error('System error occurred', {
    category: 'system-error',
    error: redactPII(error.message),
    stack: redactPII(error.stack || ''),
    ...context,
  });
};

/**
 * Log user actions for analytics
 */
export const logUserAction = (action: {
  userId: string;
  action: string;
  projectId?: string;
  metadata?: Record<string, any>;
}) => {
  logger.info('User action', {
    category: 'user-action',
    userId: action.userId,
    action: action.action,
    projectId: action.projectId,
    metadata: action.metadata,
  });
};

export default logger;