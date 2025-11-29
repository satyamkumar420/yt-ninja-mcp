// YouTubeI.js wrapper for YouTube operations

import { Innertube, UniversalCache, Log } from 'youtubei.js';
import vm from 'vm';
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

// Custom JavaScript evaluator for deciphering URLs
const jsEvaluator = {
  evaluate: (code: string) => {
    return vm.runInNewContext(code);
  },
};

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

        // Set the JavaScript evaluator for deciphering
        if (this.client.session?.player) {
          (this.client.session.player as any).evaluate = jsEvaluator.evaluate;
        }
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
          const channel = await client.getChannel(channelId);

          const metadata = channel.metadata;
          const header = channel.header;

          // Extract subscriber count from header
          let subscriberCount = 0;
          const subscriberText = (header as any)?.subscribers?.text || (header as any)?.subscriber_count?.text || '0';
          subscriberCount = this.parseSubscriberCount(subscriberText);

          // Get channel stats from about page for more accurate data
          let totalViews = 0;
          let videoCount = 0;
          let createdDate = new Date().toISOString();

          try {
            // Try to get the About tab which contains detailed statistics
            const aboutTab = await channel.getAbout();

            // Extract view count
            if ((aboutTab as any)?.view_count) {
              totalViews = parseInt((aboutTab as any).view_count, 10) || 0;
            } else if ((aboutTab as any)?.metadata?.view_count) {
              totalViews = parseInt((aboutTab as any).metadata.view_count, 10) || 0;
            }

            // Extract video count
            if ((aboutTab as any)?.video_count) {
              videoCount = parseInt((aboutTab as any).video_count, 10) || 0;
            }

            // Extract channel creation date
            if ((aboutTab as any)?.joined_date) {
              const joinedDateObj = (aboutTab as any).joined_date;
              if (typeof joinedDateObj === 'string') {
                createdDate = joinedDateObj;
              } else if (joinedDateObj?.text) {
                createdDate = joinedDateObj.text;
              }
            } else if ((aboutTab as any)?.metadata?.joined_date) {
              const joinedDateObj = (aboutTab as any).metadata.joined_date;
              if (typeof joinedDateObj === 'string') {
                createdDate = joinedDateObj;
              } else if (joinedDateObj?.text) {
                createdDate = joinedDateObj.text;
              }
            }
          } catch (aboutError) {
            // If About tab fails, try to get video count from videos tab
            try {
              const videosTab = await channel.getVideos();
              // Estimate video count from available videos
              if (videosTab?.videos) {
                videoCount = videosTab.videos.length;
              }
            } catch {
              // Silently fail, keep defaults
            }
          }

          // If subscriber count is still 0, try alternative methods
          if (subscriberCount === 0) {
            const altSources = [
              (metadata as any)?.subscriber_count,
              (header as any)?.subscriber_count,
              (channel as any)?.subscriber_count,
            ];

            for (const source of altSources) {
              if (source) {
                const parsed = this.parseSubscriberCount(
                  typeof source === 'string' ? source : source?.text || ''
                );
                if (parsed > 0) {
                  subscriberCount = parsed;
                  break;
                }
              }
            }
          }

          return {
            channelId,
            name: metadata.title || 'Unknown',
            description: metadata.description || '',
            subscriberCount,
            totalViews,
            videoCount,
            createdDate: typeof createdDate === 'string' ? createdDate : new Date().toISOString(),
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
   * Get video stream URL
   */
  async getStreamURL(videoId: string, type: 'video' | 'audio' = 'video'): Promise<string> {
    return RetryHandler.withRetry(
      async () => {
        try {
          const client = await this.getClient();
          const info = await client.getInfo(videoId);

          const format = info.chooseFormat({
            type: type === 'audio' ? 'audio' : 'video+audio',
            quality: 'best',
          });

          if (!format.decipher) {
            return format.url || '';
          }

          const deciphered = await format.decipher();
          return (deciphered as any).url || deciphered || '';
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
   * Download video stream
   */
  async downloadStream(
    videoId: string,
    type: 'video' | 'audio' = 'video'
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const client = await this.getClient();

      // Get video info first
      const info = await client.getInfo(videoId);

      // Choose format
      const format = info.chooseFormat({
        type: type === 'audio' ? 'audio' : 'video+audio',
        quality: 'best',
      });

      // Get the download URL
      let downloadUrl: string;

      if (format.decipher) {
        // Need to decipher the URL
        const deciphered = await format.decipher(client.session.player);
        downloadUrl = typeof deciphered === 'string' ? deciphered : (deciphered as any).url || format.url || '';
      } else {
        downloadUrl = format.url || '';
      }

      if (!downloadUrl) {
        throw new YTNinjaError(
          ErrorCode.STREAM_UNAVAILABLE,
          'Could not get download URL',
          { videoId },
          ['The video may be restricted', 'Try a different video']
        );
      }

      // Fetch the stream
      const response = await fetch(downloadUrl);
      if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch stream: ${response.status}`);
      }

      return response.body;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw ErrorClassifier.classifyYouTubeError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
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
