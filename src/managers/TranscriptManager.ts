// Transcript Manager - Handles transcript operations

import { youtubeClient, genaiClient } from '../integrations/index.js';
import type { TranscriptResult, AudioExtractionResult } from '../types/index.js';
import {
  YouTubeURLValidator,
  ErrorCode,
  YTNinjaError,
  formatTranscriptWithTimestamps,
  formatTranscriptPlain,
} from '../utils/index.js';

/**
 * Transcript Manager for handling transcript operations
 */
export class TranscriptManager {
  /**
   * Get transcript from YouTube
   */
  async getTranscript(url: string, language?: string): Promise<TranscriptResult> {
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL', { url });
    }

    const videoId = YouTubeURLValidator.extractVideoID(url);
    if (!videoId) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Could not extract video ID', { url });
    }

    try {
      const transcriptResult = await youtubeClient.getTranscript(videoId, language);
      return transcriptResult;
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.VIDEO_UNAVAILABLE,
        'Failed to retrieve transcript',
        error,
        [
          'The video may not have subtitles',
          'Try using automatic transcription',
          'Use get_transcript_auto for AI-generated transcripts',
        ]
      );
    }
  }

  /**
   * Generate transcript automatically using AI
   */
  async generateTranscript(url: string): Promise<TranscriptResult> {
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL', { url });
    }

    const videoId = YouTubeURLValidator.extractVideoID(url);
    if (!videoId) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Could not extract video ID', { url });
    }

    try {
      // First try to get official transcript
      try {
        const officialTranscript = await youtubeClient.getTranscript(videoId);
        return officialTranscript;
      } catch {
        // If official transcript not available, use AI transcription
        // Step 1: Extract audio from video
        const audioResult = await this.extractAudio(url);

        // Step 2: Transcribe audio using Gemini
        const transcriptText = await genaiClient.transcribeAudio(audioResult.audioPath);

        // Step 3: Clean up temporary audio file (optional)
        // For now, we'll keep it for user reference

        return {
          success: true,
          transcript: transcriptText,
          language: 'en', // Default to English, could be detected
          timestamps: [], // AI transcription doesn't provide timestamps by default
          source: 'ai-generated',
        };
      }
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        'Failed to generate transcript',
        error,
        [
          'Ensure GEMINI_API_KEY is set and valid',
          'Check if the video is accessible',
          'Try using videos with official transcripts',
          'The video may be too long for AI transcription',
        ]
      );
    }
  }

  /**
   * Translate transcript
   */
  async translateTranscript(
    url: string,
    targetLanguage: string
  ): Promise<TranscriptResult> {
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL', { url });
    }

    const videoId = YouTubeURLValidator.extractVideoID(url);
    if (!videoId) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Could not extract video ID', { url });
    }

    try {
      // Get original transcript
      const originalTranscript = await youtubeClient.getTranscript(videoId);

      // Check if target language is same as source
      if (originalTranscript.language === targetLanguage) {
        return originalTranscript;
      }

      // Translate using GenAI
      const translatedText = await genaiClient.translateTranscript(
        originalTranscript.transcript,
        targetLanguage
      );

      return {
        success: true,
        transcript: translatedText,
        language: targetLanguage,
        timestamps: originalTranscript.timestamps,
        source: 'official',
      };
    } catch (error) {
      if (error instanceof YTNinjaError) throw error;
      throw new YTNinjaError(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        'Failed to translate transcript',
        error,
        ['Check if the video has transcripts available', 'Verify target language is supported']
      );
    }
  }

  /**
   * Extract audio from video
   */
  async extractAudio(url: string): Promise<AudioExtractionResult> {
    if (!YouTubeURLValidator.isValidVideoURL(url)) {
      throw new YTNinjaError(ErrorCode.INVALID_URL, 'Invalid YouTube video URL', { url });
    }

    throw new YTNinjaError(
      ErrorCode.DOWNLOAD_FAILED,
      'Audio extraction requires download functionality which has been disabled',
      undefined,
      ['Use official YouTube transcripts instead', 'Download functionality is not available']
    );
  }

  /**
   * Format transcript with timestamps
   */
  formatWithTimestamps(transcriptResult: TranscriptResult): string {
    if (!transcriptResult.timestamps || transcriptResult.timestamps.length === 0) {
      return transcriptResult.transcript;
    }

    return formatTranscriptWithTimestamps(transcriptResult.timestamps);
  }

  /**
   * Format transcript as plain text
   */
  formatPlainText(transcriptResult: TranscriptResult): string {
    if (!transcriptResult.timestamps || transcriptResult.timestamps.length === 0) {
      return transcriptResult.transcript;
    }

    return formatTranscriptPlain(transcriptResult.timestamps);
  }
}

// Export singleton instance
export const transcriptManager = new TranscriptManager();
