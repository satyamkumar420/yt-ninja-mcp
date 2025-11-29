// Data Manager - Handles YouTube data retrieval operations

import { youtubeClient } from '../integrations/index.js';
import type {
  VideoInfo,
  PlaylistInfo,
  ChannelInfo,
  SearchResult,
  MusicSearchResult,
} from '../types/index.js';
import {
  YouTubeURLValidator,
  ErrorCode,
  YTNinjaError,
  formatMetadata,
} from '../utils/index.js';

/**
 * Data Manager for YouTube metadata operations
 */
export class DataManager {
  /**
   * Get video information
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
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
      // Fetch video info using YouTube client
      const videoInfo = await youtubeClient.getVideoInfo(videoId);
      return videoInfo;
    } catch (error) {
      // Error is already classified by YouTube client
      throw error;
    }
  }

  /**
   * Get playlist information
   */
  async getPlaylistInfo(url: string): Promise<PlaylistInfo> {
    // Validate URL
    if (!YouTubeURLValidator.isValidPlaylistURL(url)) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Invalid YouTube playlist URL',
        { url },
        [
          'Provide a valid YouTube playlist URL',
          'Example: https://www.youtube.com/playlist?list=PLAYLIST_ID',
        ]
      );
    }

    // Extract playlist ID
    const playlistId = YouTubeURLValidator.extractPlaylistID(url);
    if (!playlistId) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Could not extract playlist ID from URL',
        { url }
      );
    }

    try {
      // Fetch playlist info using YouTube client
      const playlistInfo = await youtubeClient.getPlaylistInfo(playlistId);
      return playlistInfo;
    } catch (error) {
      // Error is already classified by YouTube client
      throw error;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(urlOrId: string): Promise<ChannelInfo> {
    let channelId: string | null = null;

    // Check if it's a URL or direct channel ID
    if (urlOrId.startsWith('http')) {
      // Validate URL
      if (!YouTubeURLValidator.isValidChannelURL(urlOrId)) {
        throw new YTNinjaError(
          ErrorCode.INVALID_URL,
          'Invalid YouTube channel URL',
          { url: urlOrId },
          [
            'Provide a valid YouTube channel URL',
            'Example: https://www.youtube.com/channel/CHANNEL_ID',
            'Or: https://www.youtube.com/@HANDLE',
          ]
        );
      }

      // Extract channel ID
      channelId = YouTubeURLValidator.extractChannelID(urlOrId);
    } else {
      // Assume it's a direct channel ID or handle
      channelId = urlOrId;
    }

    if (!channelId) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Could not extract channel ID from URL',
        { url: urlOrId }
      );
    }

    try {
      // Fetch channel info using YouTube client
      const channelInfo = await youtubeClient.getChannelInfo(channelId);
      return channelInfo;
    } catch (error) {
      // Error is already classified by YouTube client
      throw error;
    }
  }

  /**
   * Search YouTube
   */
  async searchYouTube(query: string, maxResults = 10): Promise<SearchResult[]> {
    // Validate query
    if (!query || query.trim().length === 0) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Search query cannot be empty',
        { query },
        ['Provide a search query', 'Example: "typescript tutorial"']
      );
    }

    // Validate max results
    if (maxResults < 1 || maxResults > 50) {
      throw new YTNinjaError(
        ErrorCode.INVALID_RANGE,
        'Max results must be between 1 and 50',
        { maxResults },
        ['Provide a value between 1 and 50', 'Default is 10']
      );
    }

    try {
      // Search using YouTube client
      const results = await youtubeClient.search(query, maxResults);

      // If no results, provide suggestions
      if (results.length === 0) {
        throw new YTNinjaError(
          ErrorCode.VIDEO_NOT_FOUND,
          'No search results found',
          { query },
          [
            'Try different search terms',
            'Check spelling',
            'Use more general keywords',
            'Try searching for popular topics',
          ]
        );
      }

      return results;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      // Error is already classified by YouTube client
      throw error;
    }
  }

  /**
   * Search for music content
   */
  async searchMusic(query: string, maxResults = 10): Promise<MusicSearchResult[]> {
    // Validate query
    if (!query || query.trim().length === 0) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Search query cannot be empty',
        { query },
        ['Provide a search query', 'Example: "beethoven symphony"']
      );
    }

    // Validate max results
    if (maxResults < 1 || maxResults > 50) {
      throw new YTNinjaError(
        ErrorCode.INVALID_RANGE,
        'Max results must be between 1 and 50',
        { maxResults },
        ['Provide a value between 1 and 50', 'Default is 10']
      );
    }

    try {
      // Add music-specific keywords to query
      const musicQuery = `${query} music`;

      // Search using YouTube client
      const results = await youtubeClient.search(musicQuery, maxResults);

      // Filter and enhance results for music content
      const musicResults: MusicSearchResult[] = results
        .filter((result) => {
          const title = result.title.toLowerCase();
          const channel = result.channel.toLowerCase();

          // Filter for music-related content
          return (
            title.includes('music') ||
            title.includes('song') ||
            title.includes('album') ||
            title.includes('official') ||
            channel.includes('vevo') ||
            channel.includes('records') ||
            channel.includes('music')
          );
        })
        .map((result) => {
          // Try to extract artist and album info from title
          const title = result.title;
          let artist: string | undefined;
          let album: string | undefined;

          // Common patterns: "Artist - Song", "Song by Artist", etc.
          const dashMatch = title.match(/^(.+?)\s*-\s*(.+?)(?:\s*\(|$)/);
          if (dashMatch) {
            artist = dashMatch[1].trim();
          }

          return {
            ...result,
            artist,
            album,
            releaseYear: undefined, // Would need additional API calls to get this
          };
        });

      // If no music results, provide suggestions
      if (musicResults.length === 0) {
        throw new YTNinjaError(
          ErrorCode.VIDEO_NOT_FOUND,
          'No music results found',
          { query },
          [
            'Try adding artist name',
            'Include "official" or "music video" in search',
            'Search for specific song or album names',
          ]
        );
      }

      return musicResults;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      // Error is already classified by YouTube client
      throw error;
    }
  }

  /**
   * Format video info as JSON string
   */
  formatVideoInfo(videoInfo: VideoInfo): string {
    return formatMetadata(videoInfo as unknown as Record<string, unknown>);
  }

  /**
   * Format playlist info as JSON string
   */
  formatPlaylistInfo(playlistInfo: PlaylistInfo): string {
    return formatMetadata(playlistInfo as unknown as Record<string, unknown>);
  }

  /**
   * Format channel info as JSON string
   */
  formatChannelInfo(channelInfo: ChannelInfo): string {
    return formatMetadata(channelInfo as unknown as Record<string, unknown>);
  }

  /**
   * Format search results as JSON string
   */
  formatSearchResults(results: SearchResult[]): string {
    return formatMetadata(results as unknown as Record<string, unknown>);
  }

  /**
   * Download video thumbnail
   */
  async downloadThumbnail(
    url: string,
    outputPath?: string,
    quality: 'maxres' | 'high' | 'medium' | 'default' = 'maxres'
  ): Promise<{
    success: boolean;
    outputPath: string;
    thumbnailUrl: string;
    fileSize: number;
  }> {
    // Validate URL
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(
        ErrorCode.INVALID_URL,
        'Invalid YouTube video URL',
        { url },
        ['Provide a valid YouTube video URL']
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
      // Get video info to get thumbnail URL
      const videoInfo = await youtubeClient.getVideoInfo(videoId);

      // Construct thumbnail URL based on quality
      let thumbnailUrl: string;
      switch (quality) {
        case 'maxres':
          thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
          break;
        case 'high':
          thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          break;
        case 'medium':
          thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
          break;
        case 'default':
          thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/default.jpg`;
          break;
      }

      // If no output path specified, use video title
      if (!outputPath) {
        const sanitizedTitle = videoInfo.title
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()
          .substring(0, 50);
        outputPath = `./downloads/${sanitizedTitle}_thumbnail.jpg`;
      }

      // Ensure output directory exists
      const { mkdir } = await import('fs/promises');
      const { dirname } = await import('path');
      await mkdir(dirname(outputPath), { recursive: true });

      // Download thumbnail
      const response = await fetch(thumbnailUrl);

      // If maxres not available, fallback to high quality
      if (!response.ok && quality === 'maxres') {
        thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const fallbackResponse = await fetch(thumbnailUrl);
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to download thumbnail: ${fallbackResponse.status}`);
        }
        const buffer = Buffer.from(await fallbackResponse.arrayBuffer());
        const { writeFile } = await import('fs/promises');
        await writeFile(outputPath, buffer);

        return {
          success: true,
          outputPath,
          thumbnailUrl,
          fileSize: buffer.length,
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to download thumbnail: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const { writeFile } = await import('fs/promises');
      await writeFile(outputPath, buffer);

      return {
        success: true,
        outputPath,
        thumbnailUrl,
        fileSize: buffer.length,
      };
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.DOWNLOAD_ERROR,
        'Failed to download thumbnail',
        error,
        [
          'Check if the video exists',
          'Verify internet connection',
          'Try a different quality setting',
          'Ensure output directory is writable'
        ]
      );
    }
  }
}

// Export singleton instance
export const dataManager = new DataManager();
