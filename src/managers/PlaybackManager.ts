// Playback Manager - Handles video playback operations

import { youtubeClient, ProcessManager } from '../integrations/index.js';
import type { PlaybackResult } from '../types/index.js';
import { YouTubeURLValidator, ErrorCode, YTNinjaError } from '../utils/index.js';

/**
 * Playback Manager for controlling video playback
 */
export class PlaybackManager {
  /**
   * Play video in browser
   */
  async playVideo(url: string, player: 'browser' | 'vlc' = 'browser'): Promise<PlaybackResult> {
    // Validate URL
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Invalid YouTube video URL',
        { url },
        [
          'Provide a valid YouTube video URL',
          'Example: https://www.youtube.com/watch?v=VIDEO_ID',
          'Or: https://youtu.be/VIDEO_ID',
        ]
      );
    }

    // Extract video ID
    const videoId = YouTubeURLValidator.extractVideoID(url);
    if (!videoId) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Could not extract video ID from URL',
        { url }
      );
    }

    try {
      // Get video info for metadata
      const videoInfo = await youtubeClient.getVideoInfo(videoId);

      // VLC is not supported, always use browser
      if (player === 'vlc') {
        throw new YTNinjaError(
          ErrorCode.PLAYER_NOT_FOUND,
          'VLC player is not supported',
          undefined,
          ['Use browser playback instead']
        );
      }

      // Launch browser
      const processId = ProcessManager.launchBrowser(url);

      return {
        success: true,
        videoTitle: videoInfo.title,
        duration: videoInfo.duration,
        player: 'browser',
        processId,
      };
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.PLAYER_LAUNCH_FAILED,
        'Failed to launch video playback',
        error,
        ['Check if the video is accessible']
      );
    }
  }
}

// Export singleton instance
export const playbackManager = new PlaybackManager();
