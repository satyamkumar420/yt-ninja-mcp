// Playback Manager - Handles video and audio playback operations

import { youtubeClient, ProcessManager } from '../integrations/index.js';
import type { PlaybackResult } from '../types/index.js';
import {
  YouTubeURLValidator,
  TimestampParser,
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
   * Play audio only
   */
  async playAudio(url: string, loop = false): Promise<PlaybackResult> {
    // Validate URL
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Invalid YouTube video URL',
        { url },
        [
          'Provide a valid YouTube video URL',
          'Example: https://www.youtube.com/watch?v=VIDEO_ID',
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

      // Get audio stream URL
      const audioStreamURL = await youtubeClient.getStreamURL(videoId, 'audio');

      if (!audioStreamURL) {
        throw new YTNinjaError(
          ErrorCode.STREAM_UNAVAILABLE,
          'Audio stream not available',
          { videoId },
          ['The video may not have an audio track', 'Try a different video']
        );
      }

      // Check if ffplay is available
      const ffplayAvailable = await ProcessManager.isFFplayAvailable();
      if (!ffplayAvailable) {
        throw new YTNinjaError(
          ErrorCode.PLAYER_NOT_FOUND,
          'ffplay not found (part of FFmpeg)',
          undefined,
          [
            'Install FFmpeg (includes ffplay)',
            'Download FFmpeg: https://ffmpeg.org/',
            'Or use browser playback for video',
          ]
        );
      }

      const processId = ProcessManager.launchFFplay(audioStreamURL, loop);

      return {
        success: true,
        videoTitle: videoInfo.title,
        duration: videoInfo.duration,
        player: 'ffplay',
        processId,
      };
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.PLAYER_LAUNCH_FAILED,
        'Failed to launch audio playback',
        error,
        ['Check if the video is accessible', 'Install FFmpeg for audio playback']
      );
    }
  }

  /**
   * Stop playback
   */
  async stopPlayback(processId?: number): Promise<{ success: boolean; message: string }> {
    if (processId !== undefined) {
      // Stop specific process
      const stopped = ProcessManager.stopProcess(processId);
      if (stopped) {
        return {
          success: true,
          message: `Stopped playback process ${processId}`,
        };
      } else {
        return {
          success: false,
          message: `Process ${processId} not found or already stopped`,
        };
      }
    } else {
      // Stop all playback
      if (!ProcessManager.hasActivePlayback()) {
        throw new YTNinjaError(
          ErrorCode.NO_ACTIVE_PLAYBACK,
          'No active playback to stop',
          undefined,
          ['Start playback first', 'Use play_video or play_audio commands']
        );
      }

      ProcessManager.stopAll();
      return {
        success: true,
        message: 'Stopped all active playback',
      };
    }
  }

  /**
   * Play video segment in browser or VLC
   */
  async playVideoSegment(
    url: string,
    startTime: string,
    endTime: string,
    player: 'browser' | 'vlc' = 'browser'
  ): Promise<PlaybackResult> {
    // Validate URL
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Invalid YouTube video URL',
        { url },
        [
          'Provide a valid YouTube video URL',
          'Example: https://www.youtube.com/watch?v=VIDEO_ID',
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
        [
          'Use valid timestamp formats: "90", "01:30", or "00:01:30"',
          'Ensure start time is less than end time',
        ]
      );
    }

    try {
      // Get video info for metadata
      const videoInfo = await youtubeClient.getVideoInfo(videoId);

      // Build URL with start time parameter
      const segmentURL = `${url}&t=${startSeconds}s`;

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
        processId = ProcessManager.launchVLC(segmentURL);
      } else {
        // Launch browser with start time
        processId = ProcessManager.launchBrowser(segmentURL);
      }

      const segmentDuration = endSeconds - startSeconds;

      return {
        success: true,
        videoTitle: `${videoInfo.title} (${startTime} - ${endTime})`,
        duration: TimestampParser.formatToHHMMSS(segmentDuration),
        player,
        processId,
      };
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.PLAYER_LAUNCH_FAILED,
        'Failed to launch segment playback',
        error,
        ['Check if the video is accessible', 'Verify timestamp range is valid']
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
