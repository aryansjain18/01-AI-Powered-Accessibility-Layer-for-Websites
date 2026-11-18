import type { CapturedSelection } from '../types/messages';

/** Mirrors MAX_TEXT_LENGTH in shared/src/contracts/api.ts. */
export const MAX_TEXT_LENGTH = 5000;

/** Pure: no chrome, no window, no document. Safe to import in Node tests. */
export function buildSelection(
  rawText: string,
  pageTitle: string,
  pageUrl: string
): CapturedSelection | null {
  const text = rawText.trim();
  if (text.length === 0) return null;

  const truncated = text.length > MAX_TEXT_LENGTH;
  return {
    text: truncated ? text.slice(0, MAX_TEXT_LENGTH) : text,
    source: {
      type: 'selection',
      pageTitle: pageTitle || 'Untitled page',
      pageUrl,
      truncated,
    },
  };
}