# YT-NINJA 🥷

A comprehensive YouTube MCP (Model Context Protocol) server that provides AI-powered video analysis, playback control, transcript management, and advanced content processing capabilities.

## Features

### 🎬 Video Playback
- Play videos in browser or VLC player
- Audio-only playback with ffplay
- Video segment playback with timestamp control
- Active playback session management

### 📊 Data Retrieval
- Get detailed video information (title, views, likes, duration, etc.)
- Fetch playlist details with all videos
- Retrieve channel information and statistics
- Search YouTube videos and music
- Download video thumbnails in multiple qualities

### 📝 Transcript Management
- Get official video transcripts
- AI-powered transcript generation (when official unavailable)
- Translate transcripts to any language
- Format transcripts with or without timestamps

### 🤖 AI-Powered Analysis
- Generate video summaries with key points
- Auto-generate chapter markers
- Extract relevant keywords with relevance scores
- Detect topics and categories
- Create AI-powered video highlights

### 🎯 Advanced Features
- Real-time audio streaming without downloads
- Podcast mode (audio + transcript + summary + chapters + keywords)
- Video highlight generation with scoring
- Caption burning onto videos

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Google Gemini API key (required for AI features)
- Optional: VLC Media Player (for VLC playback)
- Optional: FFmpeg (for audio playback and processing)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd yt-ninja
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Required
GEMINI_API_KEY=your-google-gemini-api-key

# Optional
DOWNLOAD_DIR=./downloads
TEMP_DIR=./temp
MAX_CONCURRENT_DOWNLOADS=3
LOG_LEVEL=info
```

4. Build the project:
```bash
npm run build
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Generative AI API key for AI features |
| `DOWNLOAD_DIR` | No | `./downloads` | Directory for downloaded files |
| `TEMP_DIR` | No | `./temp` | Temporary files directory |
| `MAX_CONCURRENT_DOWNLOADS` | No | `3` | Maximum concurrent downloads |
| `LOG_LEVEL` | No | `info` | Logging level (error, warn, info, debug) |

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

### MCP Configuration

Add to your MCP settings file (`.kiro/settings/mcp.json` or `~/.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "yt-ninja": {
      "command": "node",
      "args": ["/path/to/yt-ninja/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      },
      "disabled": false
    }
  }
}
```

## Available Tools

### Playback Tools

#### `play_youtube_video`
Play a YouTube video in browser or VLC player.

**Parameters:**
- `url` (string, required): YouTube video URL
- `player` (string, optional): Player type - `browser` or `vlc` (default: `browser`)

**Example:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "player": "browser"
}
```

### Data Retrieval Tools

#### `get_video_info`
Get comprehensive information about a YouTube video.

**Parameters:**
- `url` (string, required): YouTube video URL

**Returns:** Video title, description, channel, views, likes, duration, tags, thumbnail, etc.

#### `get_playlist_info`
Get information about a YouTube playlist.

**Parameters:**
- `url` (string, required): YouTube playlist URL

**Returns:** Playlist title, description, video count, total duration, list of videos

#### `get_channel_info`
Get information about a YouTube channel.

**Parameters:**
- `channelId` (string, required): Channel ID or URL

**Returns:** Channel name, description, subscriber count, total views, video count

#### `search_youtube`
Search for videos on YouTube.

**Parameters:**
- `query` (string, required): Search query
- `maxResults` (number, optional): Maximum results (1-50, default: 10)

**Returns:** Array of search results with video details

#### `search_music`
Search specifically for music on YouTube.

**Parameters:**
- `query` (string, required): Music search query
- `maxResults` (number, optional): Maximum results (1-50, default: 10)

**Returns:** Array of music search results

#### `download_thumbnail`
Download a video thumbnail image.

**Parameters:**
- `url` (string, required): YouTube video URL
- `outputPath` (string, optional): Output file path
- `quality` (string, optional): Quality - `maxres`, `high`, `medium`, `default` (default: `maxres`)

### Transcript Tools

#### `get_transcript`
Get the transcript/subtitles of a video.

**Parameters:**
- `url` (string, required): YouTube video URL
- `language` (string, optional): Language code (e.g., 'en', 'es', 'fr')

**Returns:** Transcript text, language, timestamps, source type

#### `translate_transcript`
Translate a video transcript to another language.

**Parameters:**
- `url` (string, required): YouTube video URL
- `targetLanguage` (string, required): Target language code

**Returns:** Translated transcript with original timestamps

### AI Analysis Tools

#### `summarize_video`
Generate an AI-powered summary of a video.

**Parameters:**
- `url` (string, required): YouTube video URL
- `maxWords` (number, optional): Maximum words in summary (default: 200)

**Returns:** Summary text, key points, word count

#### `generate_chapters`
Auto-generate chapter markers for a video.

**Parameters:**
- `url` (string, required): YouTube video URL

**Returns:** Array of chapters with timestamps, titles, and descriptions

#### `get_keywords`
Extract relevant keywords from a video.

**Parameters:**
- `url` (string, required): YouTube video URL
- `count` (number, optional): Number of keywords (default: 15)

**Returns:** Array of keywords with relevance scores and frequency

#### `detect_topics`
Detect topics and categories in a video.

**Parameters:**
- `url` (string, required): YouTube video URL

**Returns:** Array of topics with confidence scores and categories

#### `generate_video_highlights`
Generate AI-powered video highlights.

**Parameters:**
- `url` (string, required): YouTube video URL
- `count` (number, optional): Number of highlights (5-10, default: 7)

**Returns:** Array of highlight moments with timestamps, descriptions, reasons, and scores

## Usage Examples

### Using with Kiro AI

Once configured as an MCP server, you can use YT-NINJA through natural language:

```
"Get information about this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"

"Summarize this YouTube video in 150 words"

"Generate chapters for this tutorial video"

"Extract the top 20 keywords from this video"

"Get the transcript and translate it to Spanish"
```

### Programmatic Usage

```typescript
import { dataManager, aiAnalyzer, transcriptManager } from 'yt-ninja';

// Get video info
const videoInfo = await dataManager.getVideoInfo('https://youtube.com/watch?v=...');

// Generate summary
const summary = await aiAnalyzer.summarizeVideo('https://youtube.com/watch?v=...', 200);

// Get transcript
const transcript = await transcriptManager.getTranscript('https://youtube.com/watch?v=...');
```

## Development

### Scripts

- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build for production
- `npm start` - Start the production server
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

### Project Structure

```
yt-ninja/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── integrations/         # External service integrations
│   │   ├── youtube.ts        # YouTube API client
│   │   ├── genai.ts          # Google GenAI client
│   │   ├── ffmpeg.ts         # FFmpeg integration
│   │   └── process.ts        # Process management
│   ├── managers/             # Feature managers
│   │   ├── DataManager.ts    # Data retrieval
│   │   ├── PlaybackManager.ts # Playback control
│   │   ├── TranscriptManager.ts # Transcript operations
│   │   ├── AIAnalyzer.ts     # AI analysis
│   │   ├── MediaProcessor.ts # Media processing
│   │   └── AdvancedFeaturesManager.ts # Advanced features
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── dist/                     # Compiled output
├── downloads/                # Downloaded files
├── .env                      # Environment configuration
└── package.json
```

## Error Handling

YT-NINJA provides detailed error messages with suggestions:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid YouTube video URL",
    "details": { "url": "..." },
    "suggestions": [
      "Provide a valid YouTube video URL",
      "Example: https://www.youtube.com/watch?v=VIDEO_ID"
    ]
  }
}
```
