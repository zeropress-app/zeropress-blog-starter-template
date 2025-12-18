/**
 * Calculate estimated reading time based on content
 * @param content - HTML content string
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, '');
  
  // Count words (split by whitespace)
  const words = text.trim().split(/\s+/).length;
  
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Format reading time for display
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5분 읽기")
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes}분 읽기`;
}
