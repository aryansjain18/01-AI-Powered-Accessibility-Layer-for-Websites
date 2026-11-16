/**
 * StudyLens canonical API contract.
 * Source of truth: docs/api-contract.md
 * Any change here MUST be mirrored in that document, and vice versa.
 */

export const API_PROCESS_PATH = '/api/v1/process';
export const HEALTH_PATH = '/health';

/** Maximum length of `text` AFTER trimming. */
export const MAX_TEXT_LENGTH = 5000;
/** Maximum raw HTTP JSON body accepted by the backend (64 KiB). */
export const MAX_BODY_BYTES = 64 * 1024;

export const SUPPORTED_ACTIONS = ['simplify', 'explain', 'translate', 'steps'] as const;
export type Action = (typeof SUPPORTED_ACTIONS)[number];

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'kn'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', hi: 'Hindi', kn: 'Kannada' };
export const DEFAULT_LANGUAGE: Language = 'en';

export const SOURCE_TYPES = ['selection', 'page'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/**
 * INTERNAL_ERROR is KEPT (decision recorded in docs/api-contract.md):
 * unexpected server-side failures need a defined code, and it is used while
 * AI processing is unimplemented so the API never returns a fake success.
 */
export const ERROR_CODES = [
  'INVALID_INPUT',
  'TEXT_TOO_LONG',
  'UNSUPPORTED_LANGUAGE',
  'PROVIDER_TIMEOUT',
  'PROVIDER_ERROR',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  TEXT_TOO_LONG: 413,
  UNSUPPORTED_LANGUAGE: 400,
  PROVIDER_TIMEOUT: 504,
  PROVIDER_ERROR: 502,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export interface SourceInfo {
  type: SourceType;
  pageTitle?: string;
  pageUrl?: string;
  /** True when the extension truncated the source to fit MAX_TEXT_LENGTH. */
  truncated?: boolean;
}

interface BaseProcessRequest {
  text: string;
  source: SourceInfo;
  /** Optional for these actions; defaults to DEFAULT_LANGUAGE ('en'). */
  targetLanguage?: Language;
}

export interface SimplifyRequest extends BaseProcessRequest { action: 'simplify'; }
export interface ExplainRequest extends BaseProcessRequest { action: 'explain'; }
export interface StepsRequest extends BaseProcessRequest { action: 'steps'; }

/** targetLanguage is REQUIRED for translate - enforced at compile time. */
export interface TranslateRequest extends BaseProcessRequest {
  action: 'translate';
  targetLanguage: Language;
}

export type ProcessRequest = SimplifyRequest | ExplainRequest | StepsRequest | TranslateRequest;

export interface ProcessResult {
  text: string;
  language: Language;
  /** Always present. Empty array unless action === 'steps'. */
  steps: string[];
  caveats?: string[];
}

export interface ProcessSuccessResponse {
  success: true;
  action: Action;
  result: ProcessResult;
  requestId: string;
}

export interface ProcessErrorBody {
  code: ErrorCode;
  message: string;
  /** Safe diagnostics only. MUST NOT contain source text or model output. */
  details?: Record<string, unknown>;
}

export interface ProcessErrorResponse {
  success: false;
  error: ProcessErrorBody;
  requestId: string;
}

export type ProcessResponse = ProcessSuccessResponse | ProcessErrorResponse;

export interface HealthResponse {
  status: 'ok';
  service: 'studylens-backend';
  version: string;
  timestamp: string;
}

export type ValidationResult =
  | { ok: true; value: ProcessRequest }
  | { ok: false; code: ErrorCode; message: string };

/** Runtime validation mirroring docs/api-contract.md. Used by the backend and tests. */
export function validateProcessRequest(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Request body must be a JSON object.' };
  }
  const v = input as Record<string, unknown>;

  if (typeof v.action !== 'string' || !SUPPORTED_ACTIONS.includes(v.action as Action)) {
    return { ok: false, code: 'INVALID_INPUT', message: `action must be one of: ${SUPPORTED_ACTIONS.join(', ')}.` };
  }
  if (typeof v.text !== 'string') {
    return { ok: false, code: 'INVALID_INPUT', message: 'text is required and must be a string.' };
  }
  const text = v.text.trim();
  if (text.length === 0) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Select or provide some text before processing.' };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return { ok: false, code: 'TEXT_TOO_LONG', message: `text must be at most ${MAX_TEXT_LENGTH} characters after trimming.` };
  }

  const s = v.source;
  if (typeof s !== 'object' || s === null || Array.isArray(s)) {
    return { ok: false, code: 'INVALID_INPUT', message: 'source is required and must be an object.' };
  }
  const src = s as Record<string, unknown>;
  if (src.type !== 'selection' && src.type !== 'page') {
    return { ok: false, code: 'INVALID_INPUT', message: "source.type must be 'selection' or 'page'." };
  }
  for (const key of ['pageTitle', 'pageUrl'] as const) {
    if (src[key] !== undefined && typeof src[key] !== 'string') {
      return { ok: false, code: 'INVALID_INPUT', message: `source.${key} must be a string when provided.` };
    }
  }
  if (src.truncated !== undefined && typeof src.truncated !== 'boolean') {
    return { ok: false, code: 'INVALID_INPUT', message: 'source.truncated must be a boolean when provided.' };
  }

  if (v.targetLanguage !== undefined && !SUPPORTED_LANGUAGES.includes(v.targetLanguage as Language)) {
    return { ok: false, code: 'UNSUPPORTED_LANGUAGE', message: `targetLanguage must be one of: ${SUPPORTED_LANGUAGES.join(', ')}.` };
  }
  if (v.action === 'translate' && v.targetLanguage === undefined) {
    return { ok: false, code: 'INVALID_INPUT', message: 'targetLanguage is required when action is translate.' };
  }

  const value = {
    action: v.action,
    text,
    source: {
      type: src.type,
      ...(src.pageTitle !== undefined ? { pageTitle: src.pageTitle } : {}),
      ...(src.pageUrl !== undefined ? { pageUrl: src.pageUrl } : {}),
      ...(src.truncated !== undefined ? { truncated: src.truncated } : {}),
    },
    ...(v.targetLanguage !== undefined ? { targetLanguage: v.targetLanguage } : {}),
  } as ProcessRequest;

  return { ok: true, value };
}