import { S3Client } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';

export interface StorageConfig {
  type: 'S3' | 'MinIO';
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  useSSL?: boolean;
}

// Storage configuration based on environment
export const getStorageConfig = (): StorageConfig => {
  const useMinIO = process.env.MINIO_ENDPOINT !== undefined;
  
  if (useMinIO) {
    return {
      type: 'MinIO',
      endpoint: `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT}`,
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      bucketName: process.env.MINIO_BUCKET_NAME || 'storyline-exports',
      useSSL: process.env.MINIO_USE_SSL === 'true',
    };
  }

  return {
    type: 'S3',
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.S3_BUCKET_NAME || 'storyline-exports',
  };
};

// Create S3 client instance
export const createS3Client = (): S3Client => {
  const config = getStorageConfig();
  
  const clientConfig: any = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };

  // Add endpoint for MinIO
  if (config.type === 'MinIO' && config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.forcePathStyle = true; // Required for MinIO
  }

  const client = new S3Client(clientConfig);
  
  logger.info(`Storage client initialized`, { 
    type: config.type, 
    region: config.region,
    bucket: config.bucketName,
    endpoint: config.endpoint || 'AWS S3'
  });

  return client;
};

// Export limits and configuration
export const exportLimits = {
  maxFileSizeMB: parseInt(process.env.MAX_EXPORT_SIZE_MB || '500'),
  maxConcurrentExports: parseInt(process.env.MAX_CONCURRENT_EXPORTS || '10'),
  exportTimeoutMinutes: parseInt(process.env.EXPORT_TIMEOUT_MINUTES || '30'),
  downloadLinkExpiryHours: parseInt(process.env.DOWNLOAD_LINK_EXPIRY_HOURS || '24'),
};