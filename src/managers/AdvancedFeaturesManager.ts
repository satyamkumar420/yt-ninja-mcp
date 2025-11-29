// Advanced Features Manager - Real-time streaming, podcast mode, highlights, and caption burning

import type {
  StreamingSession,
  PodcastReport,
  HighlightResult,
  CaptionResult,
  CaptionOptions,
  Chapter,
  Keyword,
} from '../types/index.js';
import { TranscriptManager } from './TranscriptManager.js';
import { AIAnalyzer } from './AIAnalyzer.js';
import { DataManager } from './DataManager.js';
import { PlaybackManager } from './PlaybackManager.js';
import { wrapError } from '../utils/index.js';

/**
 * Advanced Features Manager
 * Handles complex operations that combine multiple managers
 */
export class AdvancedFeaturesManager {
  constructor(
    private transcriptManager?: TranscriptManager,
    private aiAnalyzer?: AIAnalyzer,
    private dataManager?: DataManager,
    private playbackManager?: PlaybackManager
  ) { }

  /**
   * Stream audio in real-time without saving to disk
   * Uses PlaybackManager to stream audio directly without downloading
   */
  async streamAudio(url: string): Promise<StreamingSession> {
    try {
      if (!this.playbackManager || !this.dataManager) {
        throw new Error('PlaybackManager and DataManager must be injected');
      }

      // Get video info first
      const videoInfo = await this.dataManager.getVideoInfo(url);

      // Use playback manager to stream audio (loop=false for single playback)
      const playbackResult = await this.playbackManager.playAudio(url, false);

      return {
        success: true,
        sessionId: playbackResult.processId?.toString() || 'unknown',
        url,
        title: videoInfo.title,
        duration: videoInfo.duration,
        status: 'playing',
      };
    } catch (error) {
      throw wrapError(error);
    }
  }

  /**
   * Process video in podcast mode
   * Extracts audio, transcript, summary, chapters, and keywords
   * Orchestrates multiple operations to create podcast-ready content
   */
  async processPodcastMode(url: string): Promise<PodcastReport> {
    try {
      if (!this.transcriptManager || !this.aiAnalyzer || !this.dataManager) {
        throw new Error('Required managers must be injected for podcast mode');
      }

      // Step 1: Get video info
      const videoInfo = await this.dataManager.getVideoInfo(url);

      // Step 2: Extract audio
      const audioResult = await this.transcriptManager.extractAudio(url);

      // Step 3: Get transcript
      const transcriptResult = await this.transcriptManager.getTranscript(url);

      // Step 4: Generate summary
      const summaryResult = await this.aiAnalyzer.summarizeVideo(url);

      // Step 5: Generate chapters
      const chapters = await this.aiAnalyzer.generateChapters(url);

      // Step 6: Extract keywords
      const keywords = await this.aiAnalyzer.extractKeywords(url);

      return {
        success: true,
        videoTitle: videoInfo.title,
        audioPath: audioResult.audioPath,
        transcript: transcriptResult.transcript,
        summary: summaryResult.summary,
        chapters: chapters.map((ch: Chapter) => ({
          timestamp: ch.timestamp,
          title: ch.title,
        })),
        keywords: keywords.map((kw: Keyword) => ({
          keyword: kw.keyword,
          score: kw.relevance,
        })),
        duration: videoInfo.duration,
      };
    } catch (error) {
      throw wrapError(error);
    }
  }

  /**
   * Generate video highlights using AI
   * Analyzes video content and extracts significant moments
   */
  async generateHighlights(url: string, count: number = 7): Promise<HighlightResult[]> {
    try {
      if (!this.transcriptManager || !this.aiAnalyzer || !this.dataManager) {
        throw new Error('Required managers must be injected for highlight generation');
      }

      // Get video info and transcript
      const videoInfo = await this.dataManager.getVideoInfo(url);
      const transcriptResult = await this.transcriptManager.getTranscript(url);

      // Use AI to identify significant moments from transcript
      const videoDurationSeconds = this.parseDuration(videoInfo.duration);

      const aiHighlights = await this.aiAnalyzer.generateHighlights(
        transcriptResult.transcript,
        videoDurationSeconds,
        videoInfo.title,
        count
      );

      // Convert to HighlightResult format
      const highlights: HighlightResult[] = aiHighlights.map(h => ({
        timestamp: h.timestamp,
        duration: h.duration,
        clipPath: '', // No download, just timestamp info
        description: h.description,
        reason: h.reason,
        score: h.score,
      }));

      return highlights;
    } catch (error) {
      throw wrapError(error);
    }
  }

  /**
   * Parse duration string (HH:MM:SS) to seconds
   */
  private parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0];
  }

  /**
   * Format seconds to HH:MM:SS or MM:SS
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

  /**
   * Burn captions onto video
   * Overlays subtitles directly onto video using FFmpeg
   */
  async burnCaptions(
    videoPath: string,
    transcriptPath: string,
    options?: CaptionOptions
  ): Promise<CaptionResult> {
    try {
      const { ffmpegClient } = await import('../integrations/index.js');
      const { stat } = await import('fs/promises');

      const outputPath = videoPath.replace(/\.[^.]+$/, '_captioned.mp4');

      // Use FFmpeg to burn captions
      await ffmpegClient.burnCaptions(
        videoPath,
        transcriptPath,
        outputPath,
        {
          fontSize: options?.fontSize || 24,
          fontColor: options?.fontColor || 'white',
          backgroundColor: options?.backgroundColor || 'black@0.5',
        }
      );

      const stats = await stat(outputPath);
      const metadata = await ffmpegClient.getMetadata(outputPath);

      return {
        success: true,
        outputPath,
        fileSize: stats.size,
        duration: this.formatTimestamp(metadata.duration),
      };
    } catch (error) {
      throw wrapError(error);
    }
  }
}

// Singleton will be created after all managers are initialized
export let advancedFeaturesManager: AdvancedFeaturesManager;
