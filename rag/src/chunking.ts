/**
 * 1. FIXED SIZE CHUNKING
 * - Splits text into chunks of exactly 'maxSize' characters.
 * - Includes an 'overlap' so that context isn't lost between the end of one chunk and the start of the next.
 * - Think of this like a sliding window moving across the text.
 */
export const fixedSizeChunking = (
  string: string,
  maxSize: number = 1000,
  overlap: number = 20,
) => {
  const chunks = [];
  let currentIndex = 0;

  while (currentIndex < string.length) {
    // If there's more text than the maxSize, take a chunk and move forward (minus overlap)
    if (string.length - currentIndex > maxSize) {
      const chunk = string.slice(currentIndex, currentIndex + maxSize);
      chunks.push(chunk);
      currentIndex = currentIndex + maxSize - overlap; // Backtrack slightly for overlap
    } else {
      // If we're at the end, just take the remaining text
      chunks.push(string.slice(currentIndex));
      return chunks;
    }
  }

  return chunks;
};

/**
 * 2. SEMANTIC CHUNKING
 * - Splits text by meaning rather than just character count.
 * - It identifies sentences and tries to group them until they hit 'maxSize'.
 * - This keeps sentences whole, which helps AI models understand the context better.
 */
export const semanticeChunking = (string: string, maxSize = 500) => {
  const chunks = [];

  // Split by common sentence endings (. ! ?) followed by whitespace
  const sentences = string.split(/(?<=[.!?])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    // If adding the next sentence would exceed maxSize, save the current chunk and start a new one
    if ((currentChunk + sentence).length > maxSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      // Otherwise, keep building the current chunk
      currentChunk += " " + sentence;
    }
  }

  // Don't forget the last chunk!
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
};

/**
 * 3. RECURSIVE CHUNKING
 * - The "smartest" approach. It tries to split at logical boundaries (paragraphs first, then sentences).
 * - If a single part is STILL too large, it calls itself (recursively) to break it down further.
 * - This ensures every chunk is under the limit while keeping the most natural structure possible.
 */
export function recursiveChunk(text: string, maxSize = 500): string[] {
  // Base Case: If the text is already small enough, just return it.
  if (text.length <= maxSize) return [text];

  // Strategy 1: Try splitting by double-newlines (paragraphs)
  let parts = text.split("\n\n");

  if (parts.length === 1) {
    // Strategy 2 Fallback: If no paragraphs, split by sentences
    parts = text.split(/(?<=[.!?])\s+/);
  }

  const chunks = [];
  let current = "";

  for (const part of parts) {
    // Check if adding this part (paragraph/sentence) goes over the limit
    if ((current + part).length > maxSize) {
      // Save what we have so far
      if (current) chunks.push(current.trim());

      // If a SINGLE part is still larger than maxSize, we must recurse to break it down
      if (part.length > maxSize) {
        chunks.push(...recursiveChunk(part, maxSize));
        current = "";
      } else {
        // Start a new chunk with this part
        current = part;
      }
    } else {
      // It fits! Add it to the current chunk
      current += " " + part;
    }
  }

  // Push the final remaining text
  if (current) chunks.push(current.trim());

  return chunks;
}
