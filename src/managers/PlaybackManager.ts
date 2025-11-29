// Playback Manager - Handles video and audio playback operations

import { youtubeClient, ProcessManager } from '../integrations/index.js';
import type { PlaybackResult } from '../types/index.js';
import {
  YouTubeURLValidator,
  ErrorCode,
  YTNinjaError,
} from '../utils/index.js';

/**
 * Playback Manager for controlling video and audio playback
 */
export class PlaybackManager {
  /**
   * Play video in browser or VLC
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

      let processId: number;

      // Launch player based on preference
      if (player === 'vlc') {
        // Check if VLC is available
        const vlcAvailable = await ProcessManager.isVLCAvailable();
        if (!vlcAvailable) {
          throw new YTNinjaError(
            ErrorCode.PLAYER_NOT_FOUND,
            'VLC player not found',
            undefined,
            [
              'Install VLC Media Player',
              'Download from: https://www.videolan.org/vlc/',
              'Or use browser playback instead',
            ]
          );
        }
        processId = ProcessManager.launchVLC(url);
      } else {
        // Launch browser
        processId = ProcessManager.launchBrowser(url);
      }

      return {
        success: true,
        videoTitle: videoInfo.title,
        duration: videoInfo.duration,
        player,
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

  /**
   * Get active playback sessions
   */
  getActivePlayback(): number[] {
    return ProcessManager.getActiveProcessIds();
  }

  /**
   * Check if any playback is active
   */
  hasActivePlayback(): boolean {
    return ProcessManager.hasActivePlayback();
  }
}

// Export singleton instance
export const playbackManager = new PlaybackManager();
