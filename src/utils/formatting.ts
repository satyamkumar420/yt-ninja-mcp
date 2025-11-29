// Formatting utilities

/**
 * Formats duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Formats a number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Formats view count with abbreviations (K, M, B)
 */
export function formatViewCount(views: number): string {
  if (views >= 1_000_000_000) {
    return `${(views / 1_000_000_000).toFixed(1)}B`;
  }
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}K`;
  }
  return views.toString();
}

/**
 * Formats date to ISO string or relative time
 */
export function formatDate(date: Date | string, relative = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (relative) {
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  return dateObj.toISOString().split('T')[0];
}

/**
 * Formats progress percentage
 */
export function formatProgress(current: number, total: number): string {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Formats metadata object to JSON string
 */
export function formatMetadata(metadata: Record<string, unknown>): string {
  return JSON.stringify(metadata, null, 2);
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats transcript with timestamps
 */
export function formatTranscriptWithTimestamps(
  segments: Array<{ startTime: number; endTime: number; text: string }>
): string {
  return segments
    .map((segment) => {
      const start = formatDuration(segment.startTime);
      const end = formatDuration(segment.endTime);
      return `[${start} - ${end}] ${segment.text}`;
    })
    .join('\n');
}

/**
 * Formats transcript as plain text (no timestamps)
 */
export function formatTranscriptPlain(
  segments: Array<{ startTime: number; endTime: number; text: string }>
): string {
  return segments.map((segment) => segment.text).join(' ');
}

/**
 * Formats a list of items as bullet points
 */
export function formatBulletList(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

/**
 * Formats a list of items as numbered list
 */
export function formatNumberedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

/**
 * Formats chapter list
 */
export function formatChapters(
  chapters: Array<{ timestamp: string; title: string; description?: string }>
): string {
  return chapters
    .map((chapter) => {
      let formatted = `${chapter.timestamp} - ${chapter.title}`;
      if (chapter.description) {
        formatted += `\n  ${chapter.description}`;
      }
      return formatted;
    })
    .join('\n\n');
}

/**
 * Formats keyword list with relevance scores
 */
export function formatKeywords(
  keywords: Array<{ keyword: string; relevance: number; frequency: number }>
): string {
  return keywords
    .map(
      (kw) =>
        `${kw.keyword} (relevance: ${(kw.relevance * 100).toFixed(0)}%, frequency: ${kw.frequency})`
    )
    .join('\n');
}

/**
 * Formats topic list with confidence scores
 */
export function formatTopics(
  topics: Array<{ topic: string; confidence: number; category: string }>
): string {
  return topics
    .map((topic) => `${topic.topic} [${topic.category}] (${(topic.confidence * 100).toFixed(0)}%)`)
    .join('\n');
}

/**
 * Sanitizes text for safe display
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Formats error message for display
 */
export function formatErrorMessage(
  code: string,
  message: string,
  suggestions?: string[]
): string {
  let formatted = `Error [${code}]: ${message}`;

  if (suggestions && suggestions.length > 0) {
    formatted += '\n\nSuggestions:\n' + formatBulletList(suggestions);
  }

  return formatted;
}
