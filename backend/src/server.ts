
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  API_PROCESS_PATH,
  HEALTH_PATH,
  MAX_BODY_BYTES,
  ERROR_HTTP_STATUS,
  validateProcessRequest
} from '@studylens/shared';

import type {
  ErrorCode,
  HealthResponse,
  ProcessErrorResponse
} from '@studylens/shared';

// Load the repository-root .env and optional backend/.env.
dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.disable('x-powered-by');

// Request ID middleware must run before CORS and JSON parsing,
// so error responses also receive a request ID.
app.use((req: Request, res: Response, next: NextFunction) => {
  const suppliedId = req.header('X-Request-Id');

  const validSuppliedId =
    suppliedId &&
    /^[a-zA-Z0-9._:-]{1,64}$/.test(suppliedId);

  const requestId = validSuppliedId
    ? suppliedId
    : randomUUID();

  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const started = Date.now();

  res.on('finish', () => {
    // Metadata only. Never log req.body or source text.
    console.log(JSON.stringify({
      requestId,
      method: req.method,
      route: req.path,
      status: res.statusCode,
      latencyMs: Date.now() - started
    }));
  });

  next();
});

// CORS configuration.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('ORIGIN_NOT_ALLOWED'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Request-Id']
  })
);

// JSON body parser with shared size limit.
app.use(express.json({
  limit: MAX_BODY_BYTES
}));

// Health endpoint.
app.get(HEALTH_PATH, (_req: Request, res: Response) => {
  const response: HealthResponse = {
    status: 'ok',
    service: 'studylens-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };

  res.status(200).json(response);
});

// Main processing endpoint.
app.post(API_PROCESS_PATH, (req: Request, res: Response) => {
  const validation = validateProcessRequest(req.body);

  if (!validation.ok) {
    sendError(
      res,
      validation.code,
      validation.message
    );
    return;
  }

  // Phase 0: validation is implemented.
  // AI provider integration is not implemented yet.
  // Never return fake or hardcoded AI output.

  sendError(
    res,
    'INTERNAL_ERROR',
    'AI processing is not implemented yet.'
  );
});

// Unknown route handler.
app.use((_req: Request, res: Response) => {
  sendError(
    res,
    'INVALID_INPUT',
    'Unknown route.'
  );
});

// Global error handler.
app.use((
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err.message === 'ORIGIN_NOT_ALLOWED') {
    sendError(
      res,
      'INVALID_INPUT',
      'Origin not allowed.'
    );
    return;
  }

  const errorType = (err as { type?: string }).type;

  if (errorType === 'entity.too.large') {
    sendError(
      res,
      'TEXT_TOO_LONG',
      'Request body exceeds the size limit.'
    );
    return;
  }

  if (err instanceof SyntaxError) {
    sendError(
      res,
      'INVALID_INPUT',
      'Request body is not valid JSON.'
    );
    return;
  }

  console.error(JSON.stringify({
    requestId: res.locals.requestId,
    errorCode: 'INTERNAL_ERROR'
  }));

  sendError(
    res,
    'INTERNAL_ERROR',
    'Unexpected server error.'
  );
});

// Standard error response helper.
function sendError(
  res: Response,
  code: ErrorCode,
  message: string
): void {
  const response: ProcessErrorResponse = {
    success: false,
    error: {
      code,
      message
    },
    requestId: res.locals.requestId
  };

  res
    .status(ERROR_HTTP_STATUS[code])
    .json(response);
}

// Start backend.
app.listen(PORT, HOST, () => {
  console.log(
    `StudyLens backend listening on http://${HOST}:${PORT} (env=${NODE_ENV})`
  );

  console.log(
    `Health check: curl http://localhost:${PORT}${HEALTH_PATH}`
  );
});
