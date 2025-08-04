import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { logger } from './logger';
import fs from 'fs/promises';
import path from 'path';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface AudioMetadata {
  duration: number;
  bitrate: number;
  codec: string;
  channels: number;
  sampleRate: number;
  format: string;
}

export class AudioProcessor {
  /**
   * Get audio file metadata
   */
  static async getMetadata(filePath: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        if (!audioStream) {
          reject(new Error('No audio stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          bitrate: parseInt(metadata.format.bit_rate || '0'),
          codec: audioStream.codec_name || 'unknown',
          channels: audioStream.channels || 1,
          sampleRate: audioStream.sample_rate || 44100,
          format: metadata.format.format_name || 'unknown'
        });
      });
    });
  }

  /**
   * Convert audio file to different format
   */
  static async convert(
    inputPath: string,
    outputPath: string,
    options: {
      format?: string;
      bitrate?: string;
      channels?: number;
      sampleRate?: number;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      if (options.format) {
        command = command.toFormat(options.format);
      }

      if (options.bitrate) {
        command = command.audioBitrate(options.bitrate);
      }

      if (options.channels) {
        command = command.audioChannels(options.channels);
      }

      if (options.sampleRate) {
        command = command.audioFrequency(options.sampleRate);
      }

      command
        .on('start', (cmd) => {
          logger.info(`Starting audio conversion: ${cmd}`);
        })
        .on('progress', (progress) => {
          logger.debug(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          logger.info('Audio conversion completed');
          resolve();
        })
        .on('error', (err) => {
          logger.error('Audio conversion error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Extract audio from video file
   */
  static async extractAudio(
    videoPath: string,
    audioPath: string,
    format: string = 'mp3'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .toFormat(format)
        .on('end', () => {
          logger.info('Audio extraction completed');
          resolve();
        })
        .on('error', (err) => {
          logger.error('Audio extraction error:', err);
          reject(err);
        })
        .save(audioPath);
    });
  }

  /**
   * Normalize audio levels
   */
  static async normalize(
    inputPath: string,
    outputPath: string,
    targetLevel: number = -23
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`loudnorm=I=${targetLevel}:TP=-1.5:LRA=11`)
        .on('end', () => {
          logger.info('Audio normalization completed');
          resolve();
        })
        .on('error', (err) => {
          logger.error('Audio normalization error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Split audio into chunks
   */
  static async splitIntoChunks(
    inputPath: string,
    outputDir: string,
    chunkDuration: number = 60 // seconds
  ): Promise<string[]> {
    const metadata = await this.getMetadata(inputPath);
    const totalDuration = metadata.duration;
    const chunks: string[] = [];

    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    const chunkPromises: Promise<void>[] = [];
    let currentTime = 0;
    let chunkIndex = 0;

    while (currentTime < totalDuration) {
      const outputPath = path.join(outputDir, `chunk_${chunkIndex.toString().padStart(4, '0')}.mp3`);
      chunks.push(outputPath);

      const promise = new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(currentTime)
          .setDuration(chunkDuration)
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      chunkPromises.push(promise);
      currentTime += chunkDuration;
      chunkIndex++;
    }

    await Promise.all(chunkPromises);
    logger.info(`Audio split into ${chunks.length} chunks`);

    return chunks;
  }

  /**
   * Merge multiple audio files
   */
  static async merge(
    inputPaths: string[],
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // Add all input files
      inputPaths.forEach(path => {
        command.input(path);
      });

      command
        .on('start', (cmd) => {
          logger.info(`Merging ${inputPaths.length} audio files`);
        })
        .on('end', () => {
          logger.info('Audio merge completed');
          resolve();
        })
        .on('error', (err) => {
          logger.error('Audio merge error:', err);
          reject(err);
        })
        .mergeToFile(outputPath);
    });
  }

  /**
   * Apply noise reduction
   */
  static async reduceNoise(
    inputPath: string,
    outputPath: string,
    noiseLevel: number = 0.21
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`afftdn=nf=${noiseLevel}`)
        .on('end', () => {
          logger.info('Noise reduction completed');
          resolve();
        })
        .on('error', (err) => {
          logger.error('Noise reduction error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }
}