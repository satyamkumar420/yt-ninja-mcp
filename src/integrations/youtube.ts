// YouTubeI.js wrapper for YouTube operations

import { Innertube, UniversalCache, Log } from 'youtubei.js';
import type {
  VideoInfo,
  PlaylistInfo,
  ChannelInfo,
  SearchResult,
  TranscriptResult,
  PlaylistVideo,
} from '../types/index.js';
import { ErrorCode, YTNinjaError, ErrorClassifier, RetryHandler } from '../utils/index.js';

// Suppress YouTubeI.js parser warnings
Log.setLevel(Log.Level.NONE);


/**
 * YouTube client wrapper using YouTubeI.js
 */
export class YouTubeClient {
  private client: Innertube | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the YouTube client
   */
  private async initialize(): Promise<void> {
    if (this.client) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      try {
        this.client = await Innertube.create({
          cache: new UniversalCache(false),
          generate_session_locally: true,
          // Provide JavaScript evaluator for deciphering URLs
          fetch: async (input, init) => {
            return fetch(input, init);
          },
        });


      } catch (error) {
        throw ErrorClassifier.classifyYouTubeError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    })();

    await this.initPromise;
  }

  /**
   * Get the initialized client
   */
  private async getClient(): Promise<Innertube> {
    await this.initialize();
    if (!this.client) {
      throw new YTNinjaError(ErrorCode.UNKNOWN_ERROR, 'Failed to initialize YouTube client');
    }
    return this.client;
  }

  /**
   * Fetch video information
   */
  async getVideoInfo(videoId: string): Promise<VideoInfo> {
    return RetryHandler.withRetry(
      async () => {
        try {
          const client = await this.getClient();
          const info = await client.getInfo(videoId);

          const basicInfo = info.basic_info;

          return {
            videoId: basicInfo.id || videoId,
            title: basicInfo.title || 'Unknown',
            description: basicInfo.short_description || '',
            channel: basicInfo.channel?.name || 'Unknown',
            channelId: basicInfo.channel?.id || '',
            views: basicInfo.view_count || 0,
            likes: basicInfo.like_count || 0,
            uploadDate: basicInfo.start_timestamp?.toISOString() || new Date().toISOString(),
            duration: this.formatDuration(basicInfo.duration || 0),
            tags: basicInfo.keywords || [],
            thumbnailUrl: basicInfo.thumbnail?.[0]?.url || '',
            category: basicInfo.category || 'Unknown',
          };
        } catch (error) {
          throw ErrorClassifier.classifyYouTubeError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      { shouldRetry: RetryHandler.isRetryableError }
    );
  }

  /**
   * Fetch playlist information
   */
  async getPlaylistInfo(playlistId: string): Promise<PlaylistInfo> {
    return RetryHandler.withRetry(
      async () => {
        try {
          const client = await this.getClient();
          const playlist = await client.getPlaylist(playlistId);

          const videos: PlaylistVideo[] = [];
          let totalDurationSeconds = 0;

          // Get videos from playlist
          const items = playlist.items || [];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type === 'PlaylistVideo') {
              const duration = (item as any).duration?.seconds || 0;
              videos.push({
                videoId: (item as any).id,
                title: (item as any).title?.text || 'Unknown',
                duration: this.formatDuration(duration),
                position: i + 1,
              });
              totalDurationSeconds += duration;
            }
          }

          return {
            playlistId,
            title: (playlist.info.title as any)?.text || playlist.info.title || 'Unknown',
            description: (playlist.info.description as any)?.text || playlist.info.description || '',
            channel: playlist.info.author?.name || 'Unknown',
            videoCount: videos.length,
            totalDuration: this.formatDuration(totalDurationSeconds),
            videos,
          };
        } catch (error) {
          throw ErrorClassifier.classifyYouTubeError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      { shouldRetry: RetryHandler.isRetryableError }
    );
  }

  /**
   * Fetch channel information
   */
  async getChannelInfo(channelId: string): Promise<ChannelInfo> {
    return RetryHandler.withRetry(
      async () => {
        try {
          const client = await this.getClient();

          // Resolve channel handle to ID if needed
          let resolvedChannelId = channelId;
          if (channelId.startsWith('@')) {
            try {
              const searchResult = await client.search(channelId, { type: 'channel' });
              const channelResult = searchResult.results?.find((r: any) => r.type === 'Channel');
              if (channelResult && (channelResult as any).id) {
                resolvedChannelId = (channelResult as any).id;
              }
            } catch {
              // If search fails, try using the handle directly
            }
          }

          const channel = await client.getChannel(resolvedChannelId);

          const metadata = channel.metadata;
          const header = channel.header;

          // Extract subscriber count from multiple sources
          let subscriberCount = 0;

          // Helper to extract text from various formats
          const extractText = (obj: any): string => {
            if (!obj) return '';
            if (typeof obj === 'string') return obj;
            if (obj.text) return obj.text;
            if (obj.simpleText) return obj.simpleText;
            if (obj.runs && Array.isArray(obj.runs) && obj.runs[0]?.text) return obj.runs[0].text;
            return String(obj);
          };

          // Try multiple sources for subscriber count
          const subSources = [
            (header as any)?.subscribers,
            (header as any)?.subscriber_count,
            (header as any)?.subscriberCountText,
            (metadata as any)?.subscriber_count,
            (channel as any)?.subscriber_count,
          ];

          for (const source of subSources) {
            if (source) {
              const text = extractText(source);
              const parsed = this.parseSubscriberCount(text);
              if (parsed > 0) {
                subscriberCount = parsed;
                break;
              }
            }
          }

          // Get channel stats from about page
          let totalViews = 0;
          let videoCount = 0;
          let createdDate = new Date().toISOString();

          try {
            const aboutTab = await channel.getAbout();

            // Extract view count from various possible locations
            const viewSources = [
              (aboutTab as any)?.view_count,
              (aboutTab as any)?.metadata?.view_count,
              (aboutTab as any)?.stats?.view_count,
            ];

            for (const source of viewSources) {
              if (source) {
                const parsed = typeof source === 'string' ? parseInt(source.replace(/\D/g, ''), 10) : parseInt(String(source), 10);
                if (!isNaN(parsed) && parsed > 0) {
                  totalViews = parsed;
                  break;
                }
              }
            }

            // Extract video count
            const videoSources = [
              (aboutTab as any)?.video_count,
              (aboutTab as any)?.metadata?.video_count,
              (aboutTab as any)?.stats?.video_count,
            ];

            for (const source of videoSources) {
              if (source) {
                const parsed = typeof source === 'string' ? parseInt(source.replace(/\D/g, ''), 10) : parseInt(String(source), 10);
                if (!isNaN(parsed) && parsed > 0) {
                  videoCount = parsed;
                  break;
                }
              }
            }

            // Extract channel creation date
            const dateSources = [
              (aboutTab as any)?.joined_date,
              (aboutTab as any)?.metadata?.joined_date,
            ];

            for (const source of dateSources) {
              if (source) {
                const dateStr = typeof source === 'string' ? source : source?.text || '';
                if (dateStr) {
                  createdDate = dateStr;
                  break;
                }
              }
            }
          } catch (aboutError) {
            // If About tab fails, try to get video count from videos tab
            try {
              const videosTab = await channel.getVideos();
              if (videosTab?.videos) {
                videoCount = videosTab.videos.length;
              }
            } catch {
              // Silently fail, keep defaults
            }
          }

          // Extract actual channel ID from metadata
          const actualChannelId = metadata.external_id || (channel as any)?.id || resolvedChannelId;

          // If subscriber count is still 0, try HTML scraping as fallback
          if (subscriberCount === 0) {
            try {
              const channelUrl = `https://www.youtube.com/channel/${actualChannelId}`;
              const response = await fetch(channelUrl);
              const html = await response.text();

              // Try to extract subscriber count from HTML
              const subMatch = html.match(/"subscriberCountText":\{"simpleText":"([\d.KMB]+)\s+subscribers?"\}/i);
              if (subMatch) {
                subscriberCount = this.parseSubscriberCount(subMatch[1]);
              }
            } catch {
              // Silently fail, keep 0
            }
          }

          return {
            channelId: actualChannelId,
            name: metadata.title || 'Unknown',
            description: metadata.description || '',
            subscriberCount,
            totalViews,
            videoCount,
            createdDate,
            thumbnailUrl: metadata.avatar?.[0]?.url || '',
          };
        } catch (error) {
          throw ErrorClassifier.classifyYouTubeError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      { shouldRetry: RetryHandler.isRetryableError }
    );
  }

  /**
   * Get channel videos
   */
  async getChannelVideos(
    channelId: string,
    options: {
      maxVideos?: number;
      sortBy?: 'newest' | 'oldest' | 'popular';
    } = {}
  ): Promise<PlaylistVideo[]> {
    return RetryHandler.withRetry(
      async () => {
        try {
          const client = await this.getClient();
          const channel = await client.getChannel(channelId);

          const { maxVideos = 50, sortBy = 'newest' } = options;

          // Get videos tab
          const videosTab = await channel.getVideos();

          let videos: PlaylistVideo[] = [];
          const items = videosTab.videos || [];

          for (let i = 0; i < Math.min(items.length, maxVideos); i++) {
            const video = items[i] as any;
            if (video.type === 'Video') {
              const duration = video.duration?.seconds || 0;
              videos.push({
                videoId: video.id,
                title: video.title?.text || 'Unknown',
                duration: this.formatDuration(duration),
                position: i + 1,
              });
            }
          }

          // Sort videos based on option
          if (sortBy === 'oldest') {
            videos = videos.reverse();
          } else if (sortBy === 'popular') {
            // Popular sorting would require view counts, which we'd need to fetch separately
            // For now, keep the default order
          }

          return videos;
        } catch (error) {
          throw ErrorClassifier.classifyYouTubeError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      { shouldRetry: RetryHandler.isRetryableError }
    );
  }

  /**
   * Search YouTube
   */
  async search(query: string, maxResults = 10): Promise<SearchResult[]> {
    return RetryHandler.withRetry(
      async () => {
        try {
          const client = await this.getClient();
          const search = await client.search(query);

          const results: SearchResult[] = [];
          const videos = search.videos || [];

          for (let i = 0; i < Math.min(videos.length, maxResults); i++) {
            const video = videos[i] as any;
            if (video.type === 'Video') {
              results.push({
                videoId: video.id,
                title: video.title?.text || 'Unknown',
                channel: video.author?.name || 'Unknown',
                channelId: video.author?.id || '',
                views: video.view_count?.text ? this.parseViewCount(video.view_count.text) : 0,
                uploadDate: video.published?.text || '',
                duration: video.duration?.text || '0:00',
                thumbnailUrl: video.thumbnails?.[0]?.url || '',
              });
            }
          }

          return results;
        } catch (error) {
          throw ErrorClassifier.classifyYouTubeError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      { shouldRetry: RetryHandler.isRetryableError }
    );
  }

  /**
   * Get video transcript
   */
  async getTranscript(videoId: string, language?: string): Promise<TranscriptResult> {
    return RetryHandler.withRetry(
      async () => {
        try {
          const client = await this.getClient();
          const info = await client.getInfo(videoId);
          const transcriptInfo = await info.getTranscript();

          if (!transcriptInfo) {
            throw new YTNinjaError(
              ErrorCode.VIDEO_UNAVAILABLE,
              'No transcript available for this video',
              undefined,
              ['Try using automatic transcription', 'The video may not have captions']
            );
          }

          const segments = transcriptInfo.transcript?.content?.body?.initial_segments || [];
          const transcriptSegments = segments.map((seg: any) => ({
            startTime: seg.start_ms / 1000,
            endTime: seg.end_ms / 1000,
            text: seg.snippet?.text || '',
          }));

          const fullText = transcriptSegments.map((seg) => seg.text).join(' ');

          return {
            success: true,
            transcript: fullText,
            language: language || 'en',
            timestamps: transcriptSegments,
            source: 'official',
          };
        } catch (error) {
          if (error instanceof YTNinjaError) throw error;
          throw ErrorClassifier.classifyYouTubeError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      { shouldRetry: RetryHandler.isRetryableError }
    );
  }


  /**
   * Helper: Format duration from seconds
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Parse subscriber count from text
   */
  private parseSubscriberCount(text: string): number {
    const match = text.match(/([\d.]+)([KMB]?)/i);
    if (!match) return 0;

    const num = parseFloat(match[1]);
    const suffix = match[2].toUpperCase();

    switch (suffix) {
      case 'K':
        return Math.floor(num * 1000);
      case 'M':
        return Math.floor(num * 1000000);
      case 'B':
        return Math.floor(num * 1000000000);
      default:
        return Math.floor(num);
    }
  }

  /**
   * Helper: Parse view count from text
   */
  private parseViewCount(text: string): number {
    const cleaned = text.replace(/[,\s]/g, '');
    const match = cleaned.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

// Export singleton instance
export const youtubeClient = new YouTubeClient();
