import type { Application, Response } from 'express';
import { API_PROCESS_PATH, validateProcessRequest, ERROR_HTTP_STATUS } from '@studylens/shared';
import type { ErrorCode, ProcessErrorResponse } from '@studylens/shared';
import type { AiProvider } from '../ai/provider.interface';

export function sendError(res: Response, code: ErrorCode, message: string, requestId: string): void {
  const body: ProcessErrorResponse = { success: false, error: { code, message }, requestId };
  res.status(ERROR_HTTP_STATUS[code]).json(body);
}

/**
 * Phase 2 scope boundary: validation runs, provider.complete() is NOT called yet.
 * The adapter is proven by unit tests; the user-facing AI feature lands in Phase 3.
 * `_provider` is intentionally unused until then.
 */
export function registerProcessRoute(app: Application, _provider: AiProvider): void {
  app.post(API_PROCESS_PATH, (req, res) => {
    const requestId = String(res.locals.requestId ?? '');
    const validation = validateProcessRequest(req.body);
    if (!validation.ok) {
      sendError(res, validation.code, validation.message, requestId);
      return;
    }
    sendError(res, 'INTERNAL_ERROR', 'AI processing is not implemented yet. Scheduled for Phase 3.', requestId);
  });
}