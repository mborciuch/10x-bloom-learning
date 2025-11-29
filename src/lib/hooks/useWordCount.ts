import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";
import { countWords } from "../utils/word-count";

/**
 * Custom hook that calculates word count with debouncing
 * @param text - The text to count words from
 * @param delay - The debounce delay in milliseconds (default: 200ms)
 * @returns The word count
 */
export function useWordCount(text: string, delay = 200): number {
  const [wordCount, setWordCount] = useState(0);
  const debouncedText = useDebounce(text, delay);

  useEffect(() => {
    const count = countWords(debouncedText);
    setWordCount(count);
  }, [debouncedText]);

  return wordCount;
}
