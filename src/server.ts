// MCP Server setup and tool registration

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  dataManager,
  playbackManager,
  transcriptManager,
  aiAnalyzer,
  advancedFeaturesManager,
} from './managers/index.js';
import { wrapError } from './utils/index.js';

/**
 * Create and configure MCP server
 */
export function createServer() {
  const server = new Server(
    {
      name: 'yt-ninja',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Tool definitions
  const tools = [
    // Playback tools
    {
      name: 'play_youtube_video',
      description: 'Play YouTube video in browser or VLC',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
          player: {
            type: 'string',
            enum: ['browser', 'vlc'],
            description: 'Player to use (default: browser)'
          },
        },
        required: ['url'],
      },
    },
    // Data retrieval tools
    {
      name: 'get_video_info',
      description: 'Get YouTube video information',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
        },
        required: ['url'],
      },
    },
    {
      name: 'get_playlist_info',
      description: 'Get YouTube playlist information',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube playlist URL' },
        },
        required: ['url'],
      },
    },
    {
      name: 'get_channel_info',
      description: 'Get YouTube channel information',
      inputSchema: {
        type: 'object',
        properties: {
          channelId: { type: 'string', description: 'Channel ID or URL' },
        },
        required: ['channelId'],
      },
    },
    {
      name: 'search_youtube',
      description: 'Search YouTube',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', description: 'Maximum results (1-50, default: 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'search_music',
      description: 'Search YouTube for music',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Music search query' },
          maxResults: { type: 'number', description: 'Maximum results (1-50, default: 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'download_thumbnail',
      description: 'Download video thumbnail image',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
          outputPath: { type: 'string', description: 'Output file path (optional)' },
          quality: {
            type: 'string',
            enum: ['maxres', 'high', 'medium', 'default'],
            description: 'Thumbnail quality (default: maxres)'
          },
        },
        required: ['url'],
      },
    },


    // Transcript tools
    {
      name: 'get_transcript',
      description: 'Get video transcript',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
          language: { type: 'string', description: 'Language code (optional)' },
        },
        required: ['url'],
      },
    },
    {
      name: 'translate_transcript',
      description: 'Translate video transcript',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
          targetLanguage: { type: 'string', description: 'Target language' },
        },
        required: ['url', 'targetLanguage'],
      },
    },
    // AI analysis tools
    {
      name: 'summarize_video',
      description: 'Generate AI summary of video',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
          maxWords: { type: 'number', description: 'Maximum words in summary (default: 200)' },
        },
        required: ['url'],
      },
    },
    {
      name: 'generate_chapters',
      description: 'Generate chapter markers for video',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
        },
        required: ['url'],
      },
    },
    {
      name: 'get_keywords',
      description: 'Extract keywords from video',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
          count: { type: 'number', description: 'Number of keywords (default: 15)' },
        },
        required: ['url'],
      },
    },
    {
      name: 'detect_topics',
      description: 'Detect topics in video',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
        },
        required: ['url'],
      },
    },

    {
      name: 'generate_video_highlights',
      description: 'Generate AI-powered video highlights',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL' },
          count: { type: 'number', description: 'Number of highlights (5-10, default: 7)' },
        },
        required: ['url'],
      },
    },
  ];

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;

      // Ensure args is defined
      if (!args) {
        throw new Error('Missing arguments for tool call');
      }

      let result: any;

      switch (name) {
        // Playback tools
        case 'play_youtube_video':
          result = await playbackManager.playVideo(
            args.url as string,
            (args.player as 'browser' | 'vlc') || 'browser'
          );
          break;

        // Data retrieval tools
        case 'get_video_info':
          result = await dataManager.getVideoInfo(args.url as string);
          break;

        case 'get_playlist_info':
          result = await dataManager.getPlaylistInfo(args.url as string);
          break;

        case 'get_channel_info':
          result = await dataManager.getChannelInfo(args.channelId as string);
          break;

        case 'search_youtube':
          result = await dataManager.searchYouTube(
            args.query as string,
            (args.maxResults as number) || 10
          );
          break;

        case 'search_music':
          result = await dataManager.searchMusic(
            args.query as string,
            (args.maxResults as number) || 10
          );
          break;

        case 'download_thumbnail':
          result = await dataManager.downloadThumbnail(
            args.url as string,
            args.outputPath as string | undefined,
            (args.quality as 'maxres' | 'high' | 'medium' | 'default') || 'maxres'
          );
          break;

        // Transcript tools
        case 'get_transcript':
          result = await transcriptManager.getTranscript(
            args.url as string,
            args.language as string | undefined
          );
          break;

        case 'translate_transcript':
          result = await transcriptManager.translateTranscript(
            args.url as string,
            args.targetLanguage as string
          );
          break;

        // AI analysis tools
        case 'summarize_video':
          result = await aiAnalyzer.summarizeVideo(
            args.url as string,
            (args.maxWords as number) || 200
          );
          break;

        case 'generate_chapters':
          result = await aiAnalyzer.generateChapters(args.url as string);
          break;

        case 'get_keywords':
          result = await aiAnalyzer.extractKeywords(
            args.url as string,
            (args.count as number) || 15
          );
          break;

        case 'detect_topics':
          result = await aiAnalyzer.detectTopics(args.url as string);
          break;

        // Advanced feature tools
        case 'generate_video_highlights':
          result = await advancedFeaturesManager.generateHighlights(
            args.url as string,
            (args.count as number) || 7
          );
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const wrappedError = wrapError(error);
      const errorResponse = wrappedError.toErrorResponse();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start the MCP server
 */
export async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });

  console.error('YT-NINJA MCP Server started');
}
