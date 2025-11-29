// Advanced Features Manager - Real-time streaming, podcast mode, highlights, and caption burning

import type {
  HighlightResult,
} from '../types/index.js';
import { TranscriptManager } from './TranscriptManager.js';
import { AIAnalyzer } from './AIAnalyzer.js';
import { DataManager } from './DataManager.js';
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
  ) { }



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



}

// Singleton will be created after all managers are initialized
export let advancedFeaturesManager: AdvancedFeaturesManager;
