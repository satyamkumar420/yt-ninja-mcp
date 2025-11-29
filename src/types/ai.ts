// AI analysis type definitions

// Summary
export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
}

// Chapters
export interface Chapter {
  timestamp: string;
  title: string;
  description: string;
}

// Keywords
export interface Keyword {
  keyword: string;
  relevance: number;
  frequency: number;
}

// Topics
export interface Topic {
  topic: string;
  confidence: number;
  category: string;
}

// AI Podcast Report (different from media.ts)
export interface AIPodcastReport {
  audioPath: string;
  transcript: string;
  summary: SummaryResult;
  chapters: Chapter[];
  keywords: Keyword[];
  duration: string;
}

// AI Highlight (different from media.ts)
export interface AIHighlightResult {
  clipPath: string;
  timestamp: string;
  duration: string;
  description: string;
  reason: string;
}
