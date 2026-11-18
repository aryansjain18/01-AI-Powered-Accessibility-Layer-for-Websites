import { MAX_TEXT_LENGTH } from '@studylens/shared';
import {
  isCaptureSelectionMessage,
  type CaptureResponse,
  type CapturedSelection,
} from '../types/messages';

export function buildSelection(rawText: string): CapturedSelection | null {
  const text = rawText.trim();
  if (text.length === 0) return null;

  const truncated = text.length > MAX_TEXT_LENGTH;
  return {
    text: truncated ? text.slice(0, MAX_TEXT_LENGTH) : text,
    source: {
      type: 'selection',
      pageTitle: document.title || 'Untitled page',
      pageUrl: window.location.href,
      truncated,
    },
  };
}

function readSelection(): CapturedSelection | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  return buildSelection(selection.toString());
}

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: CaptureResponse) => void) => {
    if (!isCaptureSelectionMessage(message)) {
      return false;
    }

    const payload = readSelection();
    console.log('[StudyLens content] capture request, chars =', payload?.text.length ?? 0);

    if (payload) {
      sendResponse({ success: true, payload });
    } else {
      sendResponse({ success: false, reason: 'NO_SELECTION' });
    }
    return false;
  }
);

console.log('[StudyLens content] ready on', window.location.href);