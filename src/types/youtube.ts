// YouTube-related type definitions

export type YouTubeURL = string;
export type VideoID = string;
export type PlaylistID = string;
export type ChannelID = string;

// Video Information
export interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  channel: string;
  channelId: string;
  views: number;
  likes: number;
  uploadDate: string;
  duration: string;
  tags: string[];
  thumbnailUrl: string;
  category: string;
}

// Playlist Information
export interface PlaylistInfo {
  playlistId: string;
  title: string;
  description: string;
  channel: string;
  videoCount: number;
  totalDuration: string;
  videos: PlaylistVideo[];
}

export interface PlaylistVideo {
  videoId: string;
  title: string;
  duration: string;
  position: number;
}

// Channel Information
export interface ChannelInfo {
  channelId: string;
  name: string;
  description: string;
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
  createdDate: string;
  thumbnailUrl: string;
}

// Search Results
export interface SearchResult {
  videoId: string;
  title: string;
  channel: string;
  channelId: string;
  views: number;
  uploadDate: string;
  duration: string;
  thumbnailUrl: string;
}

export interface MusicSearchResult extends SearchResult {
  artist?: string;
  album?: string;
  releaseYear?: string;
}

// Transcript
export interface TranscriptResult {
  success: boolean;
  transcript: string;
  language: string;
  timestamps?: TranscriptSegment[];
  source: 'official' | 'auto-generated' | 'ai-generated';
}

export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
}
