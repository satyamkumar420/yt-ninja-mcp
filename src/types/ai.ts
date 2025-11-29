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
