// MCP Tool type definitions

// Playback
export interface PlaybackResult {
  success: boolean;
  videoTitle: string;
  duration: string;
  player: 'browser' | 'vlc' | 'ffplay';
  processId?: number;
}

export interface ToolStreamingSession {
  success: boolean;
  sessionId: string;
  videoTitle: string;
  duration: string;
  controls: {
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
  };
}

// Tool Result
export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
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

// Progress Update
export interface ProgressUpdate {
  current: number;
  total: number;
  percentage: number;
  stage?: string;
  message?: string;
}

// Operation Status
export type OperationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorResponse['error'];
  progress?: ProgressUpdate;
}
