import type { ProcessRequest, ProcessResponse, HealthResponse } from '@studylens/shared';
import { API_PROCESS_PATH, HEALTH_PATH } from '@studylens/shared';
import { DEFAULT_BACKEND_BASE_URL } from '../config/backend-url';

export { DEFAULT_BACKEND_BASE_URL };

export type BackendFailure = 'OFFLINE' | 'TIMEOUT' | 'BAD_JSON' | 'HTTP_ERROR';

export interface BackendError {
  failure: BackendFailure;
  message: string;
}

export type BackendResult<T> = { ok: true; data: T } | { ok: false; error: BackendError };

const MESSAGES: Record<BackendFailure, string> = {
  OFFLINE: 'Cannot reach the StudyLens backend. Start it with npm run dev:backend.',
  TIMEOUT: 'The StudyLens backend took too long to respond.',
  BAD_JSON: 'The StudyLens backend returned an unreadable response.',
  HTTP_ERROR: 'The StudyLens backend returned an error.',
};

export interface ClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** Reusable HTTP client. Never sends or holds any AI provider credentials. */
export class BackendClient {
  readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly doFetch: typeof fetch;

  constructor(o: ClientOptions = {}) {
    this.baseUrl = (o.baseUrl ?? DEFAULT_BACKEND_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = o.timeoutMs ?? 15000;
    this.doFetch = o.fetchImpl ?? fetch;
  }

  async health(): Promise<BackendResult<HealthResponse>> {
    return this.request<HealthResponse>(HEALTH_PATH, { method: 'GET' });
  }

  async process(body: ProcessRequest): Promise<BackendResult<ProcessResponse>> {
    return this.request<ProcessResponse>(API_PROCESS_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<BackendResult<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.doFetch(`${this.baseUrl}${path}`, { ...init, signal: controller.signal });
      let data: unknown;
      try { data = await res.json(); }
      catch { return { ok: false, error: { failure: 'BAD_JSON', message: MESSAGES.BAD_JSON } }; }
      if (!res.ok && !isProcessResponse(data)) {
        return { ok: false, error: { failure: 'HTTP_ERROR', message: MESSAGES.HTTP_ERROR } };
      }
      return { ok: true, data: data as T };
    } catch (e) {
      const failure: BackendFailure = (e as Error)?.name === 'AbortError' ? 'TIMEOUT' : 'OFFLINE';
      return { ok: false, error: { failure, message: MESSAGES[failure] } };
    } finally {
      clearTimeout(timer);
    }
  }
}

export function isProcessResponse(v: unknown): v is ProcessResponse {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (o.success === true) return typeof o.action === 'string' && typeof o.result === 'object';
  if (o.success === false) {
    const err = o.error as Record<string, unknown> | undefined;
    return typeof err === 'object' && err !== null && typeof err.code === 'string';
  }
  return false;
}

export function isHealthResponse(v: unknown): v is HealthResponse {
  return typeof v === 'object' && v !== null && (v as { status?: unknown }).status === 'ok';
}