// Transcript Manager - Handles transcript operations

import { youtubeClient, genaiClient } from '../integrations/index.js';
import type { TranscriptResult } from '../types/index.js';
import { YouTubeURLValidator, ErrorCode, YTNinjaError } from '../utils/index.js';

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
   * Translate transcript
   */
  async translateTranscript(url: string, targetLanguage: string): Promise<TranscriptResult> {
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

}

// Export singleton instance
export const transcriptManager = new TranscriptManager();
