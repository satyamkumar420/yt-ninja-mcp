// Input validation utilities

/**
 * Validates and parses YouTube URLs
 */
export class YouTubeURLValidator {
  private static readonly VIDEO_PATTERNS = [
    /^https?:\/\/(www\.|m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.|m\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  private static readonly PLAYLIST_PATTERNS = [
    /^https?:\/\/(www\.|m\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /^https?:\/\/(www\.|m\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}&list=([a-zA-Z0-9_-]+)/,
    /[?&]list=([a-zA-Z0-9_-]+)/,
  ];

  private static readonly CHANNEL_PATTERNS = [
    /^https?:\/\/(www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /^https?:\/\/(www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /^https?:\/\/(www\.)?youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /^https?:\/\/(www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
  ];

  /**
   * Validates if a string is a valid YouTube video URL
   */
  static isValidVideoURL(url: string): boolean {
    return this.VIDEO_PATTERNS.some((pattern) => pattern.test(url));
  }

  /**
   * Extracts video ID from YouTube URL
   */
  static extractVideoID(url: string): string | null {
    for (const pattern of this.VIDEO_PATTERNS) {
      const match = url.match(pattern);
      if (match) {
        return match[match.length - 1];
      }
    }
    return null;
  }

  /**
   * Validates if a string is a valid YouTube playlist URL
   */
  static isValidPlaylistURL(url: string): boolean {
    return this.PLAYLIST_PATTERNS.some((pattern) => pattern.test(url));
  }

  /**
   * Extracts playlist ID from YouTube URL
   */
  static extractPlaylistID(url: string): string | null {
    for (const pattern of this.PLAYLIST_PATTERNS) {
      const match = url.match(pattern);
      if (match) {
        return match[match.length - 1];
      }
    }
    return null;
  }

  /**
   * Validates if a string is a valid YouTube channel URL
   */
  static isValidChannelURL(url: string): boolean {
    return this.CHANNEL_PATTERNS.some((pattern) => pattern.test(url));
  }

  /**
   * Extracts channel ID or handle from YouTube URL
   */
  static extractChannelID(url: string): string | null {
    for (const pattern of this.CHANNEL_PATTERNS) {
      const match = url.match(pattern);
      if (match) {
        return match[match.length - 1];
      }
    }
    return null;
  }

  /**
   * Validates any YouTube URL (video, playlist, or channel)
   */
  static isValidYouTubeURL(url: string): boolean {
    return (
      this.isValidVideoURL(url) ||
      this.isValidPlaylistURL(url) ||
      this.isValidChannelURL(url)
    );
  }
}

/**
 * Parses timestamps in various formats to seconds
 */
export class TimestampParser {
  /**
   * Parses timestamp string to seconds
   * Supports formats: "90", "01:30", "00:01:30"
   */
  static parseToSeconds(timestamp: string): number {
    const trimmed = timestamp.trim();

    // Check if it's just a number (seconds)
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    // Check if it's MM:SS format
    const mmssMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (mmssMatch) {
      const minutes = parseInt(mmssMatch[1], 10);
      const seconds = parseInt(mmssMatch[2], 10);
      return minutes * 60 + seconds;
    }

    // Check if it's HH:MM:SS format
    const hhmmssMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (hhmmssMatch) {
      const hours = parseInt(hhmmssMatch[1], 10);
      const minutes = parseInt(hhmmssMatch[2], 10);
      const seconds = parseInt(hhmmssMatch[3], 10);
      return hours * 3600 + minutes * 60 + seconds;
    }

    throw new Error(
      `Invalid timestamp format: "${timestamp}". Expected formats: "90", "01:30", or "00:01:30"`
    );
  }

  /**
   * Formats seconds to HH:MM:SS string
   */
  static formatToHHMMSS(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formats seconds to MM:SS string
   */
  static formatToMMSS(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return [minutes, secs].map((v) => v.toString().padStart(2, '0')).join(':');
  }

  /**
   * Validates timestamp range (start < end)
   */
  static validateRange(start: string, end: string): { start: number; end: number } {
    const startSeconds = this.parseToSeconds(start);
    const endSeconds = this.parseToSeconds(end);

    if (startSeconds >= endSeconds) {
      throw new Error(
        `Invalid timestamp range: start (${start}) must be less than end (${end})`
      );
    }

    return { start: startSeconds, end: endSeconds };
  }
}

/**
 * Validates media format and quality options
 */
export class FormatValidator {
  private static readonly VIDEO_FORMATS = ['mp4', 'webm', 'mkv'];
  private static readonly AUDIO_FORMATS = ['mp3', 'wav', 'flac', 'm4a', 'ogg'];
  private static readonly VIDEO_QUALITIES = [
    '144p',
    '240p',
    '360p',
    '480p',
    '720p',
    '1080p',
    '1440p',
    '2160p',
    'best',
  ];
  private static readonly AUDIO_QUALITIES = ['low', 'medium', 'high', 'best'];

  /**
   * Validates video format
   */
  static isValidVideoFormat(format: string): boolean {
    return this.VIDEO_FORMATS.includes(format.toLowerCase());
  }

  /**
   * Validates audio format
   */
  static isValidAudioFormat(format: string): boolean {
    return this.AUDIO_FORMATS.includes(format.toLowerCase());
  }

  /**
   * Validates video quality
   */
  static isValidVideoQuality(quality: string): boolean {
    return this.VIDEO_QUALITIES.includes(quality.toLowerCase());
  }

  /**
   * Validates audio quality
   */
  static isValidAudioQuality(quality: string): boolean {
    return this.AUDIO_QUALITIES.includes(quality.toLowerCase());
  }

  /**
   * Gets list of supported video formats
   */
  static getSupportedVideoFormats(): string[] {
    return [...this.VIDEO_FORMATS];
  }

  /**
   * Gets list of supported audio formats
   */
  static getSupportedAudioFormats(): string[] {
    return [...this.AUDIO_FORMATS];
  }
}

/**
 * Validates file paths
 */
export class PathValidator {
  /**
   * Validates that a path doesn't contain directory traversal attempts
   */
  static isSafePath(path: string): boolean {
    // Check for directory traversal patterns
    const dangerousPatterns = ['../', '..\\', '%2e%2e', '%252e%252e'];
    return !dangerousPatterns.some((pattern) => path.toLowerCase().includes(pattern));
  }

  /**
   * Sanitizes filename by removing invalid characters
   */
  static sanitizeFilename(filename: string): string {
    // Remove invalid characters for Windows and Unix
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/^\.+/, '')
      .trim();
  }

  /**
   * Validates file extension
   */
  static hasValidExtension(filename: string, allowedExtensions: string[]): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? allowedExtensions.includes(ext) : false;
  }
}
