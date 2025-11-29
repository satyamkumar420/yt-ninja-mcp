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
}
