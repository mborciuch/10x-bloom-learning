/**
 * Counts words in a text snippet, ignoring redundant whitespace.
 */
export function countWords(text: string): number {
  if (!text) {
    return 0;
  }

  return text.trim().split(/\s+/).filter(Boolean).length;
}
