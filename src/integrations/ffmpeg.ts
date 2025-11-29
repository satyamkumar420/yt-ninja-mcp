// FFmpeg wrapper for media processing

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import type { ConversionOptions, ProgressUpdate } from '../types/index.js';
import { ErrorClassifier } from '../utils/index.js';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * FFmpeg client wrapper
 */
export class FFmpegClient {
  /**
   * Convert video format
   */
  async convertVideo(
    inputPath: string,
    outputPath: string,
    options: ConversionOptions = {},
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let command = ffmpeg(inputPath);

        // Apply video codec
        if (options.codec) {
          command = command.videoCodec(options.codec);
        }

        // Apply video bitrate
        if (options.videoBitrate) {
          command = command.videoBitrate(options.videoBitrate);
        }

        // Apply audio bitrate
        if (options.audioBitrate) {
          command = command.audioBitrate(options.audioBitrate);
        }

        // Apply resolution
        if (options.resolution) {
          command = command.size(options.resolution);
        }

        // Track progress
        command.on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress({
              current: Math.floor(progress.percent),
              total: 100,
              percentage: progress.percent,
              stage: 'converting',
              message: `Converting video: ${progress.percent.toFixed(1)}%`,
            });
          }
        });

        // Handle completion
        command.on('end', () => {
          resolve();
        });

        // Handle errors
        command.on('error', (err) => {
          reject(ErrorClassifier.classifyFFmpegError(err));
        });

        // Save to output
        command.save(outputPath);
      } catch (error) {
        reject(
          ErrorClassifier.classifyFFmpegError(
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    });
  }

  /**
   * Convert audio format
   */
  async convertAudio(
    inputPath: string,
    outputPath: string,
    options: ConversionOptions = {},
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let command = ffmpeg(inputPath);

        // Apply audio codec based on output format
        const ext = outputPath.split('.').pop()?.toLowerCase();
        switch (ext) {
          case 'mp3':
            command = command.audioCodec('libmp3lame');
            break;
          case 'wav':
            command = command.audioCodec('pcm_s16le');
            break;
          case 'flac':
            command = command.audioCodec('flac');
            break;
          case 'ogg':
            command = command.audioCodec('libvorbis');
            break;
          case 'm4a':
            command = command.audioCodec('aac');
            break;
        }

        // Apply audio bitrate
        if (options.audioBitrate) {
          command = command.audioBitrate(options.audioBitrate);
        }

        // Remove video stream
        command = command.noVideo();

        // Track progress
        command.on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress({
              current: Math.floor(progress.percent),
              total: 100,
              percentage: progress.percent,
              stage: 'converting',
              message: `Converting audio: ${progress.percent.toFixed(1)}%`,
            });
          }
        });

        // Handle completion
        command.on('end', () => {
          resolve();
        });

        // Handle errors
        command.on('error', (err) => {
          reject(ErrorClassifier.classifyFFmpegError(err));
        });

        // Save to output
        command.save(outputPath);
      } catch (error) {
        reject(
          ErrorClassifier.classifyFFmpegError(
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    });
  }

  /**
   * Extract frames from video
   */
  async extractFrames(
    videoPath: string,
    outputDir: string,
    fps: number,
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        let frameCount = 0;

        const command = ffmpeg(videoPath)
          .outputOptions([`-vf fps=${fps}`])
          .output(`${outputDir}/frame-%04d.png`);

        // Track progress
        command.on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress({
              current: Math.floor(progress.percent),
              total: 100,
              percentage: progress.percent,
              stage: 'extracting',
              message: `Extracting frames: ${progress.percent.toFixed(1)}%`,
            });
          }
        });

        // Handle completion
        command.on('end', () => {
          // Estimate frame count (will be updated by actual file count)
          resolve(frameCount);
        });

        // Handle errors
        command.on('error', (err) => {
          reject(ErrorClassifier.classifyFFmpegError(err));
        });

        // Run command
        command.run();
      } catch (error) {
        reject(
          ErrorClassifier.classifyFFmpegError(
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    });
  }

  /**
   * Trim audio file
   */
  async trimAudio(
    inputPath: string,
    outputPath: string,
    startSeconds: number,
    endSeconds: number,
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const duration = endSeconds - startSeconds;

        const command = ffmpeg(inputPath)
          .setStartTime(startSeconds)
          .setDuration(duration)
          .audioCodec('copy'); // Copy without re-encoding for quality preservation

        // Track progress
        command.on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress({
              current: Math.floor(progress.percent),
              total: 100,
              percentage: progress.percent,
              stage: 'trimming',
              message: `Trimming audio: ${progress.percent.toFixed(1)}%`,
            });
          }
        });

        // Handle completion
        command.on('end', () => {
          resolve();
        });

        // Handle errors
        command.on('error', (err) => {
          reject(ErrorClassifier.classifyFFmpegError(err));
        });

        // Save to output
        command.save(outputPath);
      } catch (error) {
        reject(
          ErrorClassifier.classifyFFmpegError(
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    });
  }

  /**
   * Burn captions onto video
   */
  async burnCaptions(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    options: {
      fontSize?: number;
      fontColor?: string;
      backgroundColor?: string;
    } = {},
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const {
          fontSize = 24,
          fontColor = 'white',
          backgroundColor = 'black@0.5',
        } = options;

        // Build subtitle filter
        const subtitleFilter = `subtitles=${subtitlePath}:force_style='FontSize=${fontSize},PrimaryColour=${fontColor},BackColour=${backgroundColor},Alignment=2,MarginV=20'`;

        const command = ffmpeg(videoPath)
          .videoFilters(subtitleFilter)
          .videoCodec('libx264')
          .audioCodec('copy');

        // Track progress
        command.on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress({
              current: Math.floor(progress.percent),
              total: 100,
              percentage: progress.percent,
              stage: 'burning_captions',
              message: `Burning captions: ${progress.percent.toFixed(1)}%`,
            });
          }
        });

        // Handle completion
        command.on('end', () => {
          resolve();
        });

        // Handle errors
        command.on('error', (err) => {
          reject(ErrorClassifier.classifyFFmpegError(err));
        });

        // Save to output
        command.save(outputPath);
      } catch (error) {
        reject(
          ErrorClassifier.classifyFFmpegError(
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    });
  }

  /**
   * Extract audio from video
   */
  async extractAudio(
    videoPath: string,
    outputPath: string,
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const command = ffmpeg(videoPath)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioBitrate('192k');

        // Track progress
        command.on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress({
              current: Math.floor(progress.percent),
              total: 100,
              percentage: progress.percent,
              stage: 'extracting',
              message: `Extracting audio: ${progress.percent.toFixed(1)}%`,
            });
          }
        });

        // Handle completion
        command.on('end', () => {
          resolve();
        });

        // Handle errors
        command.on('error', (err) => {
          reject(ErrorClassifier.classifyFFmpegError(err));
        });

        // Save to output
        command.save(outputPath);
      } catch (error) {
        reject(
          ErrorClassifier.classifyFFmpegError(
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    });
  }

  /**
   * Get video metadata
   */
  async getMetadata(filePath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    codec: string;
    bitrate: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            reject(ErrorClassifier.classifyFFmpegError(err));
            return;
          }

          const videoStream = metadata.streams.find((s) => s.codec_type === 'video');

          resolve({
            duration: metadata.format.duration || 0,
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            codec: videoStream?.codec_name || 'unknown',
            bitrate: metadata.format.bit_rate || 0,
          });
        });
      } catch (error) {
        reject(
          ErrorClassifier.classifyFFmpegError(
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    });
  }

  /**
   * Normalize audio volume
   */
  async normalizeAudio(
    inputPath: string,
    outputPath: string,
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const command = ffmpeg(inputPath)
          .audioFilters('loudnorm')
          .audioCodec('libmp3lame')
          .audioBitrate('192k');

        // Track progress
        command.on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress({
              current: Math.floor(progress.percent),
              total: 100,
              percentage: progress.percent,
              stage: 'normalizing',
              message: `Normalizing audio: ${progress.percent.toFixed(1)}%`,
            });
          }
        });

        // Handle completion
        command.on('end', () => {
          resolve();
        });

        // Handle errors
        command.on('error', (err) => {
          reject(ErrorClassifier.classifyFFmpegError(err));
        });

        // Save to output
        command.save(outputPath);
      } catch (error) {
        reject(
          ErrorClassifier.classifyFFmpegError(
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    });
  }
}

// Export singleton instance
export const ffmpegClient = new FFmpegClient();
