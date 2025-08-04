import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getStorageConfig, exportLimits } from '../config/storage';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export class StorageService {
  private static instance: StorageService;
  private s3Client: S3Client;
  private config: ReturnType<typeof getStorageConfig>;

  private constructor() {
    this.s3Client = createS3Client();
    this.config = getStorageConfig();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initialize storage service and ensure bucket exists
   */
  public async initialize(): Promise<void> {
    try {
      // Check if bucket exists
      await this.s3Client.send(new HeadBucketCommand({
        Bucket: this.config.bucketName
      }));
      
      logger.info(`Storage bucket '${this.config.bucketName}' is accessible`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        // Bucket doesn't exist, create it
        try {
          await this.s3Client.send(new CreateBucketCommand({
            Bucket: this.config.bucketName
          }));
          logger.info(`Created storage bucket '${this.config.bucketName}'`);
        } catch (createError) {
          logger.error('Failed to create storage bucket', { 
            bucket: this.config.bucketName, 
            error: createError 
          });
          throw createError;
        }
      } else {
        logger.error('Failed to access storage bucket', { 
          bucket: this.config.bucketName, 
          error 
        });
        throw error;
      }
    }
  }

  /**
   * Upload a file to storage
   */
  public async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const key = `exports/${uuidv4()}/${filename}`;
      
      // Check file size
      const fileSizeMB = buffer.length / (1024 * 1024);
      if (fileSizeMB > exportLimits.maxFileSizeMB) {
        throw new Error(`File size (${fileSizeMB.toFixed(2)} MB) exceeds limit (${exportLimits.maxFileSizeMB} MB)`);
      }

      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          service: 'document-export'
        }
      });

      await this.s3Client.send(uploadCommand);
      
      logger.info('File uploaded successfully', {
        key,
        size: fileSizeMB.toFixed(2) + ' MB',
        contentType
      });

      return key;
    } catch (error) {
      logger.error('Failed to upload file', { filename, error });
      throw error;
    }
  }

  /**
   * Upload a stream to storage
   */
  public async uploadStream(
    stream: Readable,
    filename: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const key = `exports/${uuidv4()}/${filename}`;

      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: stream,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          service: 'document-export'
        }
      });

      await this.s3Client.send(uploadCommand);
      
      logger.info('Stream uploaded successfully', {
        key,
        contentType
      });

      return key;
    } catch (error) {
      logger.error('Failed to upload stream', { filename, error });
      throw error;
    }
  }

  /**
   * Generate a presigned download URL
   */
  public async generateDownloadUrl(
    key: string,
    expiresIn: number = exportLimits.downloadLinkExpiryHours * 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      logger.info('Download URL generated', {
        key,
        expiresIn: `${expiresIn / 3600} hours`
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate download URL', { key, error });
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  public async deleteFile(key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
      
      logger.info('File deleted successfully', { key });
    } catch (error) {
      logger.error('Failed to delete file', { key, error });
      throw error;
    }
  }

  /**
   * Get file information
   */
  public async getFileInfo(key: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    metadata: Record<string, string>;
  }> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(headCommand);
      
      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType || 'application/octet-stream',
        metadata: response.Metadata || {}
      };
    } catch (error) {
      logger.error('Failed to get file info', { key, error });
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  public async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileInfo(key);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Download a file from storage
   */
  public async downloadFile(key: string): Promise<Buffer> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(getCommand);
      
      if (!response.Body) {
        throw new Error('File body is empty');
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as Readable;
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      logger.error('Failed to download file', { key, error });
      throw error;
    }
  }
}