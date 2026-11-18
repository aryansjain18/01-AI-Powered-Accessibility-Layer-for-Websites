import { buildSelection } from './capture';
import type { CaptureResponse, CapturedSelection } from '../types/messages';

const CAPTURE_SELECTION = 'CAPTURE_SELECTION';

function readSelection(): CapturedSelection | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  return buildSelection(selection.toString(), document.title, window.location.href);
}

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: CaptureResponse) => void) => {
    if (
      typeof message !== 'object' ||
      message === null ||
      (message as { type?: unknown }).type !== CAPTURE_SELECTION
    ) {
      return false;
    }
    const payload = readSelection();
    console.log('[StudyLens content] capture, chars =', payload?.text.length ?? 0);
    sendResponse(payload ? { success: true, payload } : { success: false, reason: 'NO_SELECTION' });
    return false;
  }
);

console.log('[StudyLens content] ready on', window.location.href);