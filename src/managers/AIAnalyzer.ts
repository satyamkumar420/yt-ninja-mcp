// AI Analyzer - Handles AI-powered content analysis

import { youtubeClient, genaiClient } from '../integrations/index.js';
import { transcriptManager } from './TranscriptManager.js';
import type { SummaryResult, Chapter, Keyword, Topic } from '../types/index.js';
import {
  YouTubeURLValidator,
  ErrorCode,
  YTNinjaError,
  formatChapters,
  formatKeywords,
  formatTopics,
} from '../utils/index.js';

/**
 * AI Analyzer for content analysis operations
 */
export class AIAnalyzer {
  /**
   * Summarize video
   */
  async summarizeVideo(url: string, maxWords = 200): Promise<SummaryResult> {
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL', { url });
    }

    const videoId = YouTubeURLValidator.extractVideoID(url);
    if (!videoId) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Could not extract video ID', { url });
    }

    try {
      // Get transcript (with fallback to AI generation)
      let transcript: string;
      try {
        const transcriptResult = await transcriptManager.getTranscript(url);
        transcript = transcriptResult.transcript;
      } catch {
        // Fallback to AI generation
        const generatedTranscript = await transcriptManager.generateTranscript(url);
        transcript = generatedTranscript.transcript;
      }

      // Generate summary using GenAI
      const summary = await genaiClient.summarizeVideo(transcript, maxWords);
      return summary;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        'Failed to summarize video',
        error,
        ['Check if the video has transcripts', 'Verify your AI API key is valid']
      );
    }
  }

  /**
   * Generate chapters
   */
  async generateChapters(url: string): Promise<Chapter[]> {
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL', { url });
    }

    const videoId = YouTubeURLValidator.extractVideoID(url);
    if (!videoId) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Could not extract video ID', { url });
    }

    try {
      // Get video info for duration
      const videoInfo = await youtubeClient.getVideoInfo(videoId);

      // Parse duration to seconds
      const durationParts = videoInfo.duration.split(':').map(Number);
      let durationSeconds = 0;
      if (durationParts.length === 3) {
        durationSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];
      } else if (durationParts.length === 2) {
        durationSeconds = durationParts[0] * 60 + durationParts[1];
      } else {
        durationSeconds = durationParts[0];
      }

      // Get transcript
      const transcriptResult = await transcriptManager.getTranscript(url);

      // Generate chapters using GenAI
      const chapters = await genaiClient.generateChapters(
        transcriptResult.transcript,
        durationSeconds
      );

      return chapters;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        'Failed to generate chapters',
        error,
        ['Check if the video has transcripts', 'Verify your AI API key is valid']
      );
    }
  }

  /**
   * Extract keywords
   */
  async extractKeywords(url: string, count = 15): Promise<Keyword[]> {
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL', { url });
    }

    const videoId = YouTubeURLValidator.extractVideoID(url);
    if (!videoId) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Could not extract video ID', { url });
    }

    try {
      // Get transcript
      const transcriptResult = await transcriptManager.getTranscript(url);

      // Extract keywords using GenAI
      const keywords = await genaiClient.extractKeywords(transcriptResult.transcript, count);

      return keywords;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        'Failed to extract keywords',
        error,
        ['Check if the video has transcripts', 'Verify your AI API key is valid']
      );
    }
  }

  /**
   * Detect topics
   */
  async detectTopics(url: string): Promise<Topic[]> {
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL', { url });
    }

    const videoId = YouTubeURLValidator.extractVideoID(url);
    if (!videoId) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Could not extract video ID', { url });
    }

    try {
      // Get video info
      const videoInfo = await youtubeClient.getVideoInfo(videoId);

      // Get transcript
      const transcriptResult = await transcriptManager.getTranscript(url);

      // Detect topics using GenAI
      const topics = await genaiClient.detectTopics(
        transcriptResult.transcript,
        videoInfo.title,
        videoInfo.description
      );

      return topics;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        'Failed to detect topics',
        error,
        ['Check if the video has transcripts', 'Verify your AI API key is valid']
      );
    }
  }

  /**
   * Format chapters as string
   */
  formatChapters(chapters: Chapter[]): string {
    return formatChapters(chapters);
  }

  /**
   * Format keywords as string
   */
  formatKeywords(keywords: Keyword[]): string {
    return formatKeywords(keywords);
  }

  /**
   * Format topics as string
   */
  formatTopics(topics: Topic[]): string {
    return formatTopics(topics);
  }

  /**
   * Generate video highlights using AI with enhanced parsing
   */
  async generateHighlights(
    transcript: string,
    videoDuration: number,
    videoTitle: string,
    count: number = 7
  ): Promise<Array<{
    timestamp: string;
    duration: string;
    description: string;
    reason: string;
    score: number;
  }>> {
    try {
      // Use GenAI to analyze transcript and identify highlights
      const prompt = `You are an expert video content analyzer. Analyze this video transcript and identify the ${count} most significant, interesting, or important moments that would make great highlights.

Video Title: ${videoTitle}
Video Duration: ${videoDuration} seconds

Instructions:
1. Identify key moments: major points, interesting facts, important conclusions, or engaging segments
2. Timestamps should be realistic (between 0 and ${videoDuration} seconds)
3. Duration should be 15-45 seconds for each highlight
4. Score based on importance, engagement value, and relevance (0.0 to 1.0)

Transcript:
${transcript.substring(0, 4000)}${transcript.length > 4000 ? '...' : ''}

Format your response EXACTLY as shown below (one highlight per block):

HIGHLIGHT 1:
Timestamp: 45
Duration: 30
Description: Introduction to the main topic and key concepts
Reason: Sets the foundation for the entire video content
Score: 0.92

HIGHLIGHT 2:
Timestamp: 180
Duration: 25
Description: Detailed explanation of the core methodology
Reason: Contains the most valuable technical information
Score: 0.88

Now provide ${count} highlights:`;

      const response = await genaiClient.generateText(prompt, 2048);

      // Parse highlights with multiple regex patterns for robustness
      const highlights: Array<{
        timestamp: string;
        duration: string;
        description: string;
        reason: string;
        score: number;
      }> = [];

      // Try primary parsing pattern
      let highlightMatches = Array.from(response.matchAll(
        /HIGHLIGHT\s+\d+:\s*Timestamp:\s*(\d+)\s*Duration:\s*(\d+)\s*Description:\s*([^\n]+)\s*Reason:\s*([^\n]+)\s*Score:\s*([\d.]+)/gis
      ));

      // If primary pattern fails, try alternative pattern
      if (highlightMatches.length === 0) {
        highlightMatches = Array.from(response.matchAll(
          /HIGHLIGHT\s+\d+[:\s]*\n\s*Timestamp[:\s]*(\d+)\s*\n\s*Duration[:\s]*(\d+)\s*\n\s*Description[:\s]*([^\n]+)\s*\n\s*Reason[:\s]*([^\n]+)\s*\n\s*Score[:\s]*([\d.]+)/gis
        ));
      }

      // If still no matches, try more lenient pattern
      if (highlightMatches.length === 0) {
        highlightMatches = Array.from(response.matchAll(
          /(?:HIGHLIGHT|Highlight)\s*\d+[:\s-]*(?:\n|\s)*(?:Timestamp|timestamp)[:\s]*(\d+)(?:\n|\s)*(?:Duration|duration)[:\s]*(\d+)(?:\n|\s)*(?:Description|description)[:\s]*([^\n]+)(?:\n|\s)*(?:Reason|reason)[:\s]*([^\n]+)(?:\n|\s)*(?:Score|score)[:\s]*([\d.]+)/gis
        ));
      }

      for (const match of highlightMatches) {
        const startSeconds = parseInt(match[1], 10);
        const durationSeconds = parseInt(match[2], 10);
        const score = parseFloat(match[5]);

        // Validate values
        if (
          !isNaN(startSeconds) &&
          !isNaN(durationSeconds) &&
          !isNaN(score) &&
          startSeconds >= 0 &&
          startSeconds <= videoDuration &&
          durationSeconds > 0 &&
          score >= 0 &&
          score <= 1
        ) {
          highlights.push({
            timestamp: this.formatTimestamp(startSeconds),
            duration: this.formatTimestamp(durationSeconds),
            description: match[3].trim(),
            reason: match[4].trim(),
            score,
          });
        }
      }

      // If no highlights parsed, return empty array
      if (highlights.length === 0) {
        return [];
      }

      // Sort by score (highest first) and return top count
      return highlights
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
    } catch (error) {
      // On any error, return empty array instead of throwing
      return [];
    }
  }

  /**
   * Format timestamp from seconds
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const aiAnalyzer = new AIAnalyzer();
