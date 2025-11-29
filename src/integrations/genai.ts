// Google GenAI wrapper for AI operations

import { GoogleGenAI } from '@google/genai';
import type { SummaryResult, Chapter, Keyword, Topic } from '../types/index.js';
import { ErrorCode, YTNinjaError, ErrorClassifier, RetryHandler } from '../utils/index.js';

/**
 * Google GenAI client wrapper
 */
export class GenAIClient {
  private client: any = null;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new YTNinjaError(
        ErrorCode.AI_API_KEY_INVALID,
        'GEMINI_API_KEY environment variable is not set',
        undefined,
        ['Set GEMINI_API_KEY in your environment variables', 'Get an API key from Google AI Studio']
      );
    }
  }

  /**
   * Get the initialized client
   */
  private getClient(): GoogleGenAI {
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  /**
   * Generate text with retry logic
   */
  async generateText(prompt: string, maxTokens = 2048): Promise<string> {
    return RetryHandler.withRetry(
      async () => {
        try {
          const genAI = this.getClient();

          const result = await genAI.models.generateContent({
            model: 'gemini-flash-latest',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              maxOutputTokens: maxTokens,
              temperature: 0.7,
            },
          });

          return result.text || '';
        } catch (error) {
          throw ErrorClassifier.classifyAIError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      { shouldRetry: RetryHandler.isRetryableError }
    );
  }

  /**
   * Summarize video from transcript
   */
  async summarizeVideo(transcript: string, maxWords = 200): Promise<SummaryResult> {
    const prompt = `Summarize the following video transcript in no more than ${maxWords} words. 
Provide:
1. A concise summary paragraph
2. 3-5 key points as bullet points

Transcript:
${transcript}

Format your response as:
SUMMARY:
[summary paragraph]

KEY POINTS:
- [point 1]
- [point 2]
- [point 3]`;

    const response = await this.generateText(prompt, 1024);

    // Parse response
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=KEY POINTS:|$)/i);
    const keyPointsMatch = response.match(/KEY POINTS:\s*([\s\S]*)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : response;
    const keyPointsText = keyPointsMatch ? keyPointsMatch[1].trim() : '';
    const keyPoints = keyPointsText
      .split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((point) => point.length > 0);

    return {
      summary,
      keyPoints: keyPoints.length > 0 ? keyPoints : [summary],
      wordCount: summary.split(/\s+/).length,
    };
  }

  /**
   * Generate chapters from transcript
   */
  async generateChapters(transcript: string, videoDuration: number): Promise<Chapter[]> {
    const targetChapters = Math.max(5, Math.min(15, Math.floor(videoDuration / 300))); // 1 chapter per 5 minutes

    const prompt = `Analyze this video transcript and create ${targetChapters} chapter markers with timestamps.
Video duration: ${videoDuration} seconds

For each chapter, provide:
1. Timestamp (in seconds from start)
2. Chapter title (5-8 words)
3. Brief description (1 sentence)

Transcript:
${transcript}

Format your response as:
CHAPTER 1:
Timestamp: [seconds]
Title: [title]
Description: [description]

CHAPTER 2:
...`;

    const response = await this.generateText(prompt, 2048);

    // Parse chapters
    const chapters: Chapter[] = [];
    const chapterMatches = response.matchAll(
      /CHAPTER \d+:\s*Timestamp:\s*(\d+)\s*Title:\s*(.+?)\s*Description:\s*(.+?)(?=CHAPTER \d+:|$)/gis
    );

    for (const match of chapterMatches) {
      const timestamp = parseInt(match[1], 10);
      chapters.push({
        timestamp: this.formatTimestamp(timestamp),
        title: match[2].trim(),
        description: match[3].trim(),
      });
    }

    // If parsing failed, create basic chapters
    if (chapters.length === 0) {
      const chapterDuration = Math.floor(videoDuration / targetChapters);
      for (let i = 0; i < targetChapters; i++) {
        chapters.push({
          timestamp: this.formatTimestamp(i * chapterDuration),
          title: `Chapter ${i + 1}`,
          description: 'Auto-generated chapter',
        });
      }
    }

    return chapters.sort((a, b) => this.parseTimestamp(a.timestamp) - this.parseTimestamp(b.timestamp));
  }

  /**
   * Extract keywords from transcript using enhanced NLP techniques
   */
  async extractKeywords(transcript: string, count = 15): Promise<Keyword[]> {
    // If transcript is too short or empty, return empty array
    if (!transcript || transcript.trim().length < 50) {
      return [];
    }

    try {
      const prompt = `Extract the top ${count} most important keywords from this transcript.

Rules:
- Focus on meaningful nouns, technical terms, and key concepts
- Avoid stop words (the, is, are, etc.)
- Include both single words and short phrases (2-3 words max)
- Rank by importance

Transcript:
${transcript.substring(0, 3000)}${transcript.length > 3000 ? '...' : ''}

Respond with ONLY a JSON array in this exact format:
[
  {"keyword": "example term", "relevance": 0.95, "frequency": 12},
  {"keyword": "another keyword", "relevance": 0.88, "frequency": 8}
]`;

      const response = await this.generateText(prompt, 1024);

      // Try to parse JSON response
      try {
        // Extract JSON from response (might have extra text)
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const keywords: Keyword[] = parsed
              .filter(item =>
                item.keyword &&
                typeof item.relevance === 'number' &&
                typeof item.frequency === 'number'
              )
              .map(item => ({
                keyword: item.keyword.trim(),
                relevance: Math.min(1, Math.max(0, item.relevance)),
                frequency: Math.max(1, item.frequency)
              }));

            if (keywords.length >= Math.min(3, count)) {
              return keywords.slice(0, count);
            }
          }
        }
      } catch (parseError) {
        // JSON parsing failed, continue to fallback
      }

      // If JSON parsing failed, try regex pattern
      const keywords: Keyword[] = [];
      const patterns = [
        /["']?keyword["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?relevance["']?\s*:\s*([\d.]+)\s*,\s*["']?frequency["']?\s*:\s*(\d+)/gi,
        /KEYWORD:\s*([^|]+?)\s*\|\s*RELEVANCE:\s*([\d.]+)\s*\|\s*FREQUENCY:\s*(\d+)/gi,
      ];

      for (const pattern of patterns) {
        const matches = response.matchAll(pattern);
        for (const match of matches) {
          const keyword = match[1].trim();
          const relevance = parseFloat(match[2]);
          const frequency = parseInt(match[3], 10);

          if (keyword && !isNaN(relevance) && !isNaN(frequency) && relevance >= 0 && relevance <= 1) {
            keywords.push({ keyword, relevance, frequency });
          }
        }
        if (keywords.length >= Math.min(3, count)) {
          return keywords.sort((a, b) => b.relevance - a.relevance).slice(0, count);
        }
      }

      // If still no keywords, return empty array
      return [];
    } catch (error) {
      // On any error, return empty array
      return [];
    }
  }



  /**
   * Detect topics from transcript and metadata
   */
  async detectTopics(transcript: string, videoTitle: string, videoDescription: string): Promise<Topic[]> {
    const prompt = `Analyze this video and identify the main topics/categories it covers.
For each topic, provide:
1. Topic name
2. Confidence score (0.0 to 1.0)
3. Category (e.g., Technology, Education, Entertainment, Science, etc.)

Video Title: ${videoTitle}
Video Description: ${videoDescription}

Transcript excerpt:
${transcript.substring(0, 2000)}...

Format your response as:
TOPIC: [topic name] | CONFIDENCE: [0.0-1.0] | CATEGORY: [category]
TOPIC: [topic name] | CONFIDENCE: [0.0-1.0] | CATEGORY: [category]
...`;

    const response = await this.generateText(prompt, 1024);

    // Parse topics
    const topics: Topic[] = [];
    const topicMatches = response.matchAll(
      /TOPIC:\s*(.+?)\s*\|\s*CONFIDENCE:\s*([\d.]+)\s*\|\s*CATEGORY:\s*(.+?)(?=\n|$)/gi
    );

    for (const match of topicMatches) {
      topics.push({
        topic: match[1].trim(),
        confidence: parseFloat(match[2]),
        category: match[3].trim(),
      });
    }

    // Sort by confidence
    return topics.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Translate transcript
   */
  async translateTranscript(transcript: string, targetLanguage: string): Promise<string> {
    const prompt = `Translate the following text to ${targetLanguage}. Maintain the original meaning and tone.

Text:
${transcript}

Translation:`;

    return this.generateText(prompt, 4096);
  }

  /**
   * Generate transcript from audio (using Whisper via GenAI)
   */
  async transcribeAudio(audioPath: string): Promise<string> {
    try {
      const { readFile } = await import('fs/promises');

      // Read audio file
      const audioBuffer = await readFile(audioPath);
      const audioBase64 = audioBuffer.toString('base64');

      const genAI = this.getClient();

      // Use Gemini's audio understanding capabilities
      const result = await genAI.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'audio/mp3',
                data: audioBase64
              }
            },
            {
              text: 'Please transcribe this audio file. Provide only the transcription text without any additional commentary.'
            }
          ]
        }],
        config: {
          maxOutputTokens: 8192,
          temperature: 0.2,
        },
      });

      return result.text || '';
    } catch (error) {
      throw new YTNinjaError(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        'Audio transcription failed',
        error,
        [
          'Ensure the audio file is in a supported format (MP3, WAV)',
          'Check if your GEMINI_API_KEY has audio processing capabilities',
          'Try using official YouTube transcripts when available',
          'The audio file may be too large (max ~20MB)',
        ]
      );
    }
  }

  /**
   * Helper: Format timestamp from seconds
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Parse timestamp to seconds
   */
  private parseTimestamp(timestamp: string): number {
    const parts = timestamp.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  }
}

// Export singleton instance
export const genaiClient = new GenAIClient();
