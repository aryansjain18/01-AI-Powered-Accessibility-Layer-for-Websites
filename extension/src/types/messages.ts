import type { SourceInfo } from '@studylens/shared';

export const REQUEST_SELECTION = 'REQUEST_SELECTION';
export const CAPTURE_SELECTION = 'CAPTURE_SELECTION';

export interface CapturedSelection {
  text: string;
  source: SourceInfo;
}

export type CaptureFailureReason =
  | 'NO_SELECTION'
  | 'UNSUPPORTED_PAGE'
  | 'NO_ACTIVE_TAB'
  | 'INJECTION_FAILED';

export type CaptureResponse =
  | { success: true; payload: CapturedSelection }
  | { success: false; reason: 'NO_SELECTION' };

export type SelectionResponse =
  | { success: true; payload: CapturedSelection }
  | { success: false; reason: CaptureFailureReason; message: string };

export interface RequestSelectionMessage {
  type: typeof REQUEST_SELECTION;
}

export interface CaptureSelectionMessage {
  type: typeof CAPTURE_SELECTION;
}

export function isRequestSelectionMessage(value: unknown): value is RequestSelectionMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === REQUEST_SELECTION
  );
}

export function isCaptureSelectionMessage(value: unknown): value is CaptureSelectionMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === CAPTURE_SELECTION
  );
}

export function isCapturedSelection(value: unknown): value is CapturedSelection {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.text !== 'string' || v.text.trim().length === 0) return false;
  const s = v.source as Record<string, unknown> | undefined;
  if (typeof s !== 'object' || s === null) return false;
  return s.type === 'selection';
}

export function isSupportedUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url) || /^file:\/\//i.test(url);
}