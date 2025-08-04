import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

export class S3Service {
  private static instance: S3Service;
  private s3Client: S3Client;
  private bucketName: string;

  private constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT, // For MinIO compatibility
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      },
      forcePathStyle: true // Required for MinIO
    });

    this.bucketName = process.env.S3_BUCKET_NAME || 'storyline-voice-recordings';
  }

  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata
      });

      await this.s3Client.send(command);
      logger.info(`File uploaded to S3: ${key}`);

      return `s3://${this.bucketName}/${key}`;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  async uploadStream(
    key: string,
    stream: Readable,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: stream,
        ContentType: contentType,
        Metadata: metadata
      });

      await this.s3Client.send(command);
      logger.info(`Stream uploaded to S3: ${key}`);

      return `s3://${this.bucketName}/${key}`;
    } catch (error) {
      logger.error('S3 stream upload error:', error);
      throw new Error('Failed to upload stream to S3');
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body instanceof Readable) {
        for await (const chunk of response.Body) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('S3 download error:', error);
      throw new Error('Failed to download file from S3');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('S3 signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  generateKey(userId: string, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now();

    return `voice-recordings/${userId}/${year}/${month}/${day}/${timestamp}-${filename}`;
  }
}