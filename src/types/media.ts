// Media processing type definitions

// Download Options
export interface VideoDownloadOptions {
  format: 'mp4' | 'webm' | 'mkv';
  quality: '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | 'best';
}

export interface AudioFormat {
  format: 'mp3' | 'wav' | 'flac' | 'm4a' | 'ogg';
  quality?: 'low' | 'medium' | 'high' | 'best';
}

export interface DownloadResult {
  success: boolean;
  filePath: string;
  fileSize: number;
  duration: string;
  format: string;
}

export interface PlaylistDownloadResult {
  success: boolean;
  folderPath: string;
  totalVideos: number;
  downloadedCount: number;
  failedVideos: string[];
  totalSize: number;
}

export interface ChannelDownloadOptions {
  dateRange?: {
    start?: string;
    end?: string;
  };
  maxVideos?: number;
  sortBy?: 'date' | 'views' | 'title';
}

export interface ChannelDownloadResult {
  success: boolean;
  folderPath: string;
  totalVideos: number;
  downloadedCount: number;
  failedVideos: string[];
  totalSize: number;
}

// Audio Extraction
export interface AudioExtractionResult {
  success: boolean;
  audioPath: string;
  duration: string;
  format: string;
  fileSize: number;
}

// Conversion Options
export interface ConversionOptions {
  videoBitrate?: string;
  audioBitrate?: string;
  codec?: string;
  resolution?: string;
}

export interface ConversionResult {
  success: boolean;
  outputPath: string;
  fileSize: number;
  duration: string;
}

// Frame Extraction
export interface FrameExtractionResult {
  success: boolean;
  outputDir: string;
  frameCount: number;
  fps: number;
}

// Trim Result
export interface TrimResult {
  success: boolean;
  outputPath: string;
  duration: string;
  fileSize: number;
}

// Caption Options
export interface CaptionOptions {
  fontSize?: number;
  fontColor?: string;
  position?: 'top' | 'center' | 'bottom';
  backgroundColor?: string;
  fontFamily?: string;
}

export interface CaptionResult {
  success: boolean;
  outputPath: string;
  fileSize: number;
  duration: string;
}

// Streaming
export interface StreamingSession {
  success: boolean;
  sessionId: string;
  url: string;
  title: string;
  duration: string;
  status: 'playing' | 'paused' | 'stopped';
}

// Podcast Mode
export interface PodcastReport {
  success: boolean;
  videoTitle: string;
  audioPath: string;
  transcript: string;
  summary: string;
  chapters: Array<{
    timestamp: string;
    title: string;
  }>;
  keywords: Array<{
    keyword: string;
    score: number;
  }>;
  duration: string;
}

// Highlights
export interface HighlightResult {
  timestamp: string;
  duration: string;
  clipPath: string;
  description: string;
  reason: string;
  score: number;
}
