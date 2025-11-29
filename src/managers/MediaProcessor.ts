// Media Processor - Handles media conversion and processing

import { ffmpegClient } from '../integrations/index.js';
import type {
  ConversionOptions,
  ConversionResult,
  FrameExtractionResult,
  TrimResult,
  ProgressUpdate,
} from '../types/index.js';
import {
  FormatValidator,
  PathValidator,
  TimestampParser,
  ErrorCode,
  YTNinjaError,
} from '../utils/index.js';
import { stat } from 'fs/promises';

/**
 * Media Processor for format conversion and media processing
 */
export class MediaProcessor {
  /**
   * Convert video format
   */
  async convertVideoFormat(
    inputPath: string,
    outputFormat: string,
    options: ConversionOptions = {},
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<ConversionResult> {
    // Validate format
    if (!FormatValidator.isValidVideoFormat(outputFormat)) {
      throw new YTNinjaError(
        ErrorCode.INVALID_FORMAT,
        `Invalid video format: ${outputFormat}`,
        { format: outputFormat },
        [`Supported formats: ${FormatValidator.getSupportedVideoFormats().join(', ')}`]
      );
    }

    // Validate input path
    if (!PathValidator.isSafePath(inputPath)) {
      throw new YTNinjaError(ErrorCode.INVALID_PATH, 'Invalid input path', { inputPath });
    }

    try {
      const outputPath = inputPath.replace(/\.[^.]+$/, `.${outputFormat}`);

      await ffmpegClient.convertVideo(inputPath, outputPath, options, onProgress);

      const stats = await stat(outputPath);
      const metadata = await ffmpegClient.getMetadata(outputPath);

      return {
        success: true,
        outputPath,
        fileSize: stats.size,
        duration: this.formatDuration(metadata.duration),
      };
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.FFMPEG_ERROR,
        'Video conversion failed',
        error,
        ['Check if input file exists', 'Verify output format is supported']
      );
    }
  }

  /**
   * Convert audio format
   */
  async convertAudioFormat(
    inputPath: string,
    outputFormat: string,
    options: ConversionOptions = {},
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<ConversionResult> {
    // Validate format
    if (!FormatValidator.isValidAudioFormat(outputFormat)) {
      throw new YTNinjaError(
        ErrorCode.INVALID_FORMAT,
        `Invalid audio format: ${outputFormat}`,
        { format: outputFormat },
        [`Supported formats: ${FormatValidator.getSupportedAudioFormats().join(', ')}`]
      );
    }

    // Validate input path
    if (!PathValidator.isSafePath(inputPath)) {
      throw new YTNinjaError(ErrorCode.INVALID_PATH, 'Invalid input path', { inputPath });
    }

    try {
      const outputPath = inputPath.replace(/\.[^.]+$/, `.${outputFormat}`);

      await ffmpegClient.convertAudio(inputPath, outputPath, options, onProgress);

      const stats = await stat(outputPath);
      const metadata = await ffmpegClient.getMetadata(outputPath);

      return {
        success: true,
        outputPath,
        fileSize: stats.size,
        duration: this.formatDuration(metadata.duration),
      };
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.FFMPEG_ERROR,
        'Audio conversion failed',
        error,
        ['Check if input file exists', 'Verify output format is supported']
      );
    }
  }

  /**
   * Extract video frames
   */
  async extractFrames(
    videoPath: string,
    outputDir: string,
    fps: number,
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<FrameExtractionResult> {
    // Validate paths
    if (!PathValidator.isSafePath(videoPath) || !PathValidator.isSafePath(outputDir)) {
      throw new YTNinjaError(ErrorCode.INVALID_PATH, 'Invalid path', { videoPath, outputDir });
    }

    // Validate FPS
    if (fps <= 0 || fps > 60) {
      throw new YTNinjaError(
        ErrorCode.INVALID_RANGE,
        'FPS must be between 1 and 60',
        { fps },
        ['Provide a valid FPS value (1-60)']
      );
    }

    try {
      const frameCount = await ffmpegClient.extractFrames(videoPath, outputDir, fps, onProgress);

      return {
        success: true,
        outputDir,
        frameCount,
        fps,
      };
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.FFMPEG_ERROR,
        'Frame extraction failed',
        error,
        ['Check if video file exists', 'Verify output directory is writable']
      );
    }
  }

  /**
   * Trim audio
   */
  async trimAudio(
    audioPath: string,
    startTime: string,
    endTime: string,
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<TrimResult> {
    // Validate path
    if (!PathValidator.isSafePath(audioPath)) {
      throw new YTNinjaError(ErrorCode.INVALID_PATH, 'Invalid audio path', { audioPath });
    }

    // Validate and parse timestamps
    let startSeconds: number;
    let endSeconds: number;

    try {
      const range = TimestampParser.validateRange(startTime, endTime);
      startSeconds = range.start;
      endSeconds = range.end;
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.INVALID_TIMESTAMP,
        error instanceof Error ? error.message : 'Invalid timestamp',
        { startTime, endTime },
        ['Use valid timestamp formats: "90", "01:30", or "00:01:30"']
      );
    }

    try {
      const outputPath = audioPath.replace(/(\.[^.]+)$/, '_trimmed$1');

      await ffmpegClient.trimAudio(audioPath, outputPath, startSeconds, endSeconds, onProgress);

      const stats = await stat(outputPath);
      const duration = endSeconds - startSeconds;

      return {
        success: true,
        outputPath,
        duration: TimestampParser.formatToHHMMSS(duration),
        fileSize: stats.size,
      };
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.FFMPEG_ERROR,
        'Audio trimming failed',
        error,
        ['Check if audio file exists', 'Verify timestamps are within file duration']
      );
    }
  }

  /**
   * Helper: Format duration from seconds
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const mediaProcessor = new MediaProcessor();
