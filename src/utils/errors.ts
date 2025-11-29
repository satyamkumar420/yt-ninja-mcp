// Error handling utilities

import type { ErrorResponse } from '../types/index.js';

/**
 * Error codes for different error types
 */
export enum ErrorCode {
  // Input validation errors
  INVALID_URL = 'INVALID_URL',
  INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_QUALITY = 'INVALID_QUALITY',
  INVALID_PATH = 'INVALID_PATH',
  INVALID_RANGE = 'INVALID_RANGE',

  // YouTube API errors
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  VIDEO_UNAVAILABLE = 'VIDEO_UNAVAILABLE',
  PRIVATE_VIDEO = 'PRIVATE_VIDEO',
  AGE_RESTRICTED = 'AGE_RESTRICTED',
  GEO_BLOCKED = 'GEO_BLOCKED',
  RATE_LIMITED = 'RATE_LIMITED',
  PLAYLIST_NOT_FOUND = 'PLAYLIST_NOT_FOUND',
  CHANNEL_NOT_FOUND = 'CHANNEL_NOT_FOUND',

  // Download/Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  TIMEOUT = 'TIMEOUT',
  DISK_SPACE = 'DISK_SPACE',
  INCOMPLETE_DOWNLOAD = 'INCOMPLETE_DOWNLOAD',

  // Media processing errors
  FFMPEG_ERROR = 'FFMPEG_ERROR',
  CODEC_ERROR = 'CODEC_ERROR',
  CORRUPTED_FILE = 'CORRUPTED_FILE',
  INSUFFICIENT_RESOURCES = 'INSUFFICIENT_RESOURCES',

  // AI service errors
  AI_API_KEY_INVALID = 'AI_API_KEY_INVALID',
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_TOKEN_LIMIT = 'AI_TOKEN_LIMIT',

  // Playback errors
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  PLAYER_LAUNCH_FAILED = 'PLAYER_LAUNCH_FAILED',
  STREAM_UNAVAILABLE = 'STREAM_UNAVAILABLE',
  NO_ACTIVE_PLAYBACK = 'NO_ACTIVE_PLAYBACK',

  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  DOWNLOAD_ERROR = "DOWNLOAD_ERROR",
}

/**
 * Custom error class for YT-NINJA
 */
export class YTNinjaError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'YTNinjaError';
  }

  toErrorResponse(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        suggestions: this.suggestions,
      },
    };
  }
}

/**
 * Error classifier - maps errors to error codes and messages
 */
export class ErrorClassifier {
  /**
   * Classifies YouTube API errors
   */
  static classifyYouTubeError(error: Error): YTNinjaError {
    const message = error.message.toLowerCase();

    if (message.includes('not found') || message.includes('does not exist')) {
      return new YTNinjaError(
        ErrorCode.VIDEO_NOT_FOUND,
        'Video not found or has been deleted',
        error,
        ['Check if the video URL is correct', 'The video may have been removed by the uploader']
      );
    }

    if (message.includes('private') || message.includes('unavailable')) {
      return new YTNinjaError(
        ErrorCode.VIDEO_UNAVAILABLE,
        'Video is private or unavailable',
        error,
        ['This video is private or restricted', 'Try a different video']
      );
    }

    if (message.includes('age') || message.includes('restricted')) {
      return new YTNinjaError(
        ErrorCode.AGE_RESTRICTED,
        'Video is age-restricted',
        error,
        ['This video requires age verification', 'Authentication may be required']
      );
    }

    if (message.includes('geo') || message.includes('region') || message.includes('country')) {
      return new YTNinjaError(
        ErrorCode.GEO_BLOCKED,
        'Video is not available in your region',
        error,
        ['This video is geo-blocked in your location']
      );
    }

    if (message.includes('rate') || message.includes('quota') || message.includes('limit')) {
      return new YTNinjaError(
        ErrorCode.RATE_LIMITED,
        'Rate limit exceeded',
        error,
        ['Too many requests', 'Please wait a few minutes and try again']
      );
    }

    return new YTNinjaError(ErrorCode.UNKNOWN_ERROR, error.message, error);
  }

  /**
   * Classifies network errors
   */
  static classifyNetworkError(error: Error): YTNinjaError {
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) {
      return new YTNinjaError(
        ErrorCode.TIMEOUT,
        'Operation timed out',
        error,
        ['Check your internet connection', 'Try again later']
      );
    }

    if (message.includes('network') || message.includes('connection')) {
      return new YTNinjaError(
        ErrorCode.NETWORK_ERROR,
        'Network connection failed',
        error,
        ['Check your internet connection', 'Verify network settings']
      );
    }

    if (message.includes('disk') || message.includes('space') || message.includes('enospc')) {
      return new YTNinjaError(
        ErrorCode.DISK_SPACE,
        'Insufficient disk space',
        error,
        ['Free up disk space', 'Choose a different download location']
      );
    }

    return new YTNinjaError(ErrorCode.DOWNLOAD_FAILED, 'Download failed', error, [
      'Try again',
      'Check your internet connection',
    ]);
  }

  /**
   * Classifies FFmpeg errors
   */
  static classifyFFmpegError(error: Error): YTNinjaError {
    const message = error.message.toLowerCase();

    if (message.includes('codec') || message.includes('encoder') || message.includes('decoder')) {
      return new YTNinjaError(
        ErrorCode.CODEC_ERROR,
        'Codec error during media processing',
        error,
        [
          'Try a different output format',
          'The requested codec may not be supported',
          'Supported formats: mp4, webm, mkv for video; mp3, wav, flac for audio',
        ]
      );
    }

    if (message.includes('corrupt') || message.includes('invalid') || message.includes('damaged')) {
      return new YTNinjaError(
        ErrorCode.CORRUPTED_FILE,
        'Media file is corrupted or invalid',
        error,
        ['Try downloading the file again', 'The source file may be damaged']
      );
    }

    return new YTNinjaError(ErrorCode.FFMPEG_ERROR, 'Media processing failed', error, [
      'Try again',
      'Check if FFmpeg is properly installed',
    ]);
  }

  /**
   * Classifies AI service errors
   */
  static classifyAIError(error: Error): YTNinjaError {
    const message = error.message.toLowerCase();

    if (message.includes('api key') || message.includes('authentication')) {
      return new YTNinjaError(
        ErrorCode.AI_API_KEY_INVALID,
        'Invalid or missing AI API key',
        error,
        ['Check your GEMINI_API_KEY environment variable', 'Verify the API key is correct']
      );
    }

    if (message.includes('rate') || message.includes('quota') || message.includes('limit')) {
      return new YTNinjaError(
        ErrorCode.AI_RATE_LIMITED,
        'AI service rate limit exceeded',
        error,
        ['Wait a few minutes before trying again', 'Consider upgrading your API plan']
      );
    }

    if (message.includes('token') || message.includes('length') || message.includes('too long')) {
      return new YTNinjaError(
        ErrorCode.AI_TOKEN_LIMIT,
        'Content exceeds AI token limit',
        error,
        ['Try with a shorter video', 'The transcript may be too long for processing']
      );
    }

    if (message.includes('unavailable') || message.includes('service')) {
      return new YTNinjaError(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        'AI service is temporarily unavailable',
        error,
        ['Try again later', 'The AI service may be experiencing issues']
      );
    }

    return new YTNinjaError(ErrorCode.UNKNOWN_ERROR, error.message, error);
  }
}

/**
 * Retry logic with exponential backoff
 */
export class RetryHandler {
  /**
   * Executes a function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
      shouldRetry?: (error: Error) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 8000,
      shouldRetry = () => true,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if it's the last attempt or if shouldRetry returns false
        if (attempt === maxAttempts || !shouldRetry(lastError)) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Determines if an error is retryable
   */
  static isRetryableError(error: Error): boolean {
    if (error instanceof YTNinjaError) {
      // Retryable error codes
      const retryableCodes = [
        ErrorCode.NETWORK_ERROR,
        ErrorCode.TIMEOUT,
        ErrorCode.RATE_LIMITED,
        ErrorCode.AI_RATE_LIMITED,
        ErrorCode.DOWNLOAD_FAILED,
        ErrorCode.INCOMPLETE_DOWNLOAD,
      ];

      return retryableCodes.includes(error.code);
    }

    // Check error message for retryable patterns
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('rate limit') ||
      message.includes('temporary')
    );
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  suggestions?: string[]
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      suggestions,
    },
  };
}

/**
 * Wraps an error in YTNinjaError if it isn't already
 */
export function wrapError(error: unknown): YTNinjaError {
  if (error instanceof YTNinjaError) {
    return error;
  }

  if (error instanceof Error) {
    return new YTNinjaError(ErrorCode.UNKNOWN_ERROR, error.message, error);
  }

  return new YTNinjaError(ErrorCode.UNKNOWN_ERROR, String(error));
}
