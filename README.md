# YT-NINJA 🥷

A comprehensive YouTube MCP (Model Context Protocol) server that provides powerful YouTube interaction capabilities through AI assistants like Kiro. Get video information, extract transcripts, generate AI summaries, and much more - all through natural language commands.

## Features

### 🎬 Playback Control
- Play videos in browser or VLC
- Simple one-command video playback
- Support for both browser and VLC player

### 🔍 Data Retrieval
- Fetch comprehensive video metadata (title, duration, views, likes, description, channel info)
- Get playlist information with complete video lists
- Retrieve channel statistics and information
- YouTube search with customizable result count (1-50 results)
- Music-specific search with artist/album detection
- Download video thumbnails in multiple quality options (maxres, high, medium, default)

### 📝 Transcript Processing
- Extract official YouTube transcripts
- Optional language selection for transcripts
- AI-powered transcript translation to any language
- Timestamp-aligned formatting support

### 🧠 AI-Powered Analysis (Gemini)
- Video summarization with customizable word count
- Automatic chapter generation with intelligent timestamps
- Keyword extraction with relevance scoring (customizable count)
- Topic detection and categorization
- AI-powered highlight generation (5-10 highlights with timestamps, descriptions, and scores)

## Available MCP Tools (13 Total)

All tools are registered and available through the Model Context Protocol interface.

### Playback (1 tool)
- `play_youtube_video` - Play video in browser or VLC with player selection

### Data Retrieval (6 tools)
- `get_video_info` - Get comprehensive video metadata (title, duration, views, likes, description)
- `get_playlist_info` - Get playlist information with video list
- `get_channel_info` - Get channel statistics and information
- `search_youtube` - Search YouTube with customizable result count (1-50)
- `search_music` - Music-specific search with artist/album detection
- `download_thumbnail` - Download video thumbnail in multiple quality options (maxres, high, medium, default)

### Transcript (2 tools)
- `get_transcript` - Get official YouTube transcript with optional language selection
- `translate_transcript` - Translate transcript to any target language using AI

### AI Analysis (4 tools)
- `summarize_video` - Generate AI-powered video summary with customizable word count
- `generate_chapters` - Create intelligent chapter markers with timestamps
- `get_keywords` - Extract relevant keywords with relevance scoring (customizable count)
- `detect_topics` - Detect and categorize video topics using AI
- `generate_video_highlights` - Generate AI-powered highlight moments (5-10 highlights)

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- FFmpeg (automatically installed)
- VLC Media Player (optional, for playback features)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd yt-ninja

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Build the project
npm run build
```

## Usage

### Running the MCP Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### MCP Client Configuration

Add to your Kiro MCP configuration (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "yt-ninja": {
      "command": "node",
      "args": ["D:/MCP/YT-Ninja/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here",
        "DOWNLOAD_DIR": "./downloads",
        "TEMP_DIR": "./temp",
        "MAX_CONCURRENT_DOWNLOADS": "3",
        "LOG_LEVEL": "info"
      },
      "disabled": false,
      "autoApprove": [
        "get_video_info",
        "search_youtube",
        "get_transcript",
        "search_music",
        "get_playlist_info",
        "get_channel_info",
        "download_thumbnail",
        "detect_topics",
        "get_keywords"
      ]
    }
  }
}
```

## Usage Examples

### Quick Start Examples

**Get video information:**
```
"Get info for this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Get video summary:**
```
"Summarize this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Get transcript:**
```
"Get the transcript of this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Search YouTube:**
```
"Search YouTube for 'TypeScript tutorial' and show me the top 5 results"
```

**Search for music:**
```
"Search for 'Beethoven Symphony' music videos"
```

**Download thumbnail:**
```
"Download the thumbnail for this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### Advanced Workflows

**Generate chapters:**
```
"Generate chapter markers for this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Translate transcript:**
```
"Get the transcript of this video and translate it to Spanish: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Extract keywords:**
```
"Extract the top 10 keywords from this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Detect topics:**
```
"Detect the main topics discussed in this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Generate highlights:**
```
"Generate 7 highlight moments from this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Play video:**
```
"Play this video in VLC: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## Tool Reference

### Playback Tools

#### `play_youtube_video`
Play YouTube video in browser or VLC player.

**Parameters:**
- `url` (required): YouTube video URL
- `player` (optional): Player to use - `browser` or `vlc` (default: `browser`)

**Returns:**
- `success`: Boolean indicating success
- `videoTitle`: Title of the video
- `duration`: Video duration (HH:MM:SS)
- `player`: Player used
- `processId`: Process ID of launched player

---

### Data Retrieval Tools

#### `get_video_info`
Get comprehensive YouTube video information.

**Parameters:**
- `url` (required): YouTube video URL

**Returns:**
- `title`: Video title
- `duration`: Video duration
- `views`: View count
- `likes`: Like count
- `description`: Video description
- `channel`: Channel information
- `publishDate`: Publication date
- `thumbnails`: Available thumbnail URLs

#### `get_playlist_info`
Get YouTube playlist information with video list.

**Parameters:**
- `url` (required): YouTube playlist URL

**Returns:**
- `title`: Playlist title
- `videoCount`: Number of videos
- `videos`: Array of video information
- `channel`: Channel information

#### `get_channel_info`
Get YouTube channel statistics and information.

**Parameters:**
- `channelId` (required): Channel ID or URL

**Returns:**
- `name`: Channel name
- `subscriberCount`: Subscriber count
- `videoCount`: Total videos
- `viewCount`: Total views
- `description`: Channel description

#### `search_youtube`
Search YouTube with customizable result count.

**Parameters:**
- `query` (required): Search query
- `maxResults` (optional): Maximum results (1-50, default: 10)

**Returns:**
- Array of search results with title, channel, duration, views, URL

#### `search_music`
Music-specific YouTube search with artist/album detection.

**Parameters:**
- `query` (required): Music search query
- `maxResults` (optional): Maximum results (1-50, default: 10)

**Returns:**
- Array of music results with title, artist, album, channel, URL

#### `download_thumbnail`
Download video thumbnail image.

**Parameters:**
- `url` (required): YouTube video URL
- `outputPath` (optional): Output file path
- `quality` (optional): Thumbnail quality - `maxres`, `high`, `medium`, `default` (default: `maxres`)

**Returns:**
- `success`: Boolean indicating success
- `outputPath`: Path to downloaded thumbnail
- `thumbnailUrl`: URL of the thumbnail
- `fileSize`: File size in bytes

---

### Transcript Tools

#### `get_transcript`
Get official YouTube transcript.

**Parameters:**
- `url` (required): YouTube video URL
- `language` (optional): Language code (e.g., 'en', 'es', 'fr')

**Returns:**
- `success`: Boolean indicating success
- `transcript`: Full transcript text
- `language`: Transcript language
- `timestamps`: Array of timestamped segments
- `source`: Source type ('official' or 'ai-generated')

#### `translate_transcript`
Translate video transcript to any language using AI.

**Parameters:**
- `url` (required): YouTube video URL
- `targetLanguage` (required): Target language (e.g., 'Spanish', 'French', 'German')

**Returns:**
- `success`: Boolean indicating success
- `transcript`: Translated transcript text
- `language`: Target language
- `timestamps`: Original timestamps
- `source`: Source type

---

### AI Analysis Tools

#### `summarize_video`
Generate AI-powered video summary.

**Parameters:**
- `url` (required): YouTube video URL
- `maxWords` (optional): Maximum words in summary (default: 200)

**Returns:**
- `success`: Boolean indicating success
- `summary`: Generated summary text
- `keyPoints`: Array of key points
- `wordCount`: Actual word count

#### `generate_chapters`
Create intelligent chapter markers with timestamps.

**Parameters:**
- `url` (required): YouTube video URL

**Returns:**
- Array of chapters with:
  - `timestamp`: Chapter start time (HH:MM:SS)
  - `title`: Chapter title
  - `description`: Chapter description

#### `get_keywords`
Extract relevant keywords with relevance scoring.

**Parameters:**
- `url` (required): YouTube video URL
- `count` (optional): Number of keywords (default: 15)

**Returns:**
- Array of keywords with:
  - `keyword`: Keyword text
  - `relevance`: Relevance score (0.0-1.0)
  - `category`: Keyword category

#### `detect_topics`
Detect and categorize video topics using AI.

**Parameters:**
- `url` (required): YouTube video URL

**Returns:**
- Array of topics with:
  - `topic`: Topic name
  - `confidence`: Confidence score (0.0-1.0)
  - `category`: Topic category

#### `generate_video_highlights`
Generate AI-powered highlight moments.

**Parameters:**
- `url` (required): YouTube video URL
- `count` (optional): Number of highlights (5-10, default: 7)

**Returns:**
- Array of highlights with:
  - `timestamp`: Highlight start time (HH:MM:SS)
  - `duration`: Highlight duration (HH:MM:SS)
  - `description`: Highlight description
  - `reason`: Why this moment is significant
  - `score`: Importance score (0.0-1.0)

---

## Development

### Scripts

```bash
npm run dev          # Run in development mode
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Lint code
npm run format       # Format code
npm run type-check   # Check TypeScript types
```

### Project Structure

```
yt-ninja/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── managers/             # Business logic managers
│   │   ├── DataManager.ts
│   │   ├── PlaybackManager.ts
│   │   ├── TranscriptManager.ts
│   │   ├── AIAnalyzer.ts
│   │   ├── MediaProcessor.ts
│   │   └── AdvancedFeaturesManager.ts
│   ├── integrations/         # External service wrappers
│   │   ├── youtube.ts
│   │   ├── genai.ts
│   │   ├── ffmpeg.ts
│   │   └── process.ts
│   ├── utils/                # Utility functions
│   └── types/                # TypeScript types
├── downloads/                # Downloaded files directory
└── dist/                     # Build output
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google GenAI API key (required) | - |
| `DOWNLOAD_DIR` | Download directory | `./downloads` |
| `TEMP_DIR` | Temporary files directory | `./temp` |
| `MAX_CONCURRENT_DOWNLOADS` | Max concurrent downloads | `3` |
| `LOG_LEVEL` | Logging level | `info` |

## Technology Stack

- **MCP Framework:** @modelcontextprotocol/sdk
- **YouTube API:** youtubei.js
- **AI Services:** @google/genai (Gemini)
- **Media Processing:** fluent-ffmpeg
- **Validation:** zod

## Troubleshooting

### Common Issues

**"GEMINI_API_KEY environment variable is required"**
- Solution: Set your Google GenAI API key in `.env` file or environment
- Get API key from: https://aistudio.google.com/api-keys



**"FFmpeg error" during conversion**
- Solution: FFmpeg is automatically installed, but if issues persist:
  - Check if input file exists and is readable
  - Verify output format is supported
  - Ensure sufficient disk space

**"Video unavailable" or "Private video"**
- Solution: Verify the video is publicly accessible
- Check if the video URL is correct
- Some videos may be geo-restricted

**"Transcript not available"**
- Solution: Not all videos have official transcripts
- Try videos with closed captions enabled
- AI-powered transcript generation is available but requires audio extrac

**"Rate limit exceeded"**
- Solution: YouTube may temporarily rate limit requests
- Wait a few minutes before retrying
- Reduce the frequency of requests

### Debug Mode

Enable detailed logging:
```bash
export LOG_LEVEL=debug
npm start
```
