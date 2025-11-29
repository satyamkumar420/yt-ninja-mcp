// MCP Tool type definitions

// Playback
export interface PlaybackResult {
  success: boolean;
  videoTitle: string;
  duration: string;
  player: 'browser' | 'vlc' | 'ffplay';
  processId?: number;
}

// Error Response
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    suggestions?: string[];
  };
}
