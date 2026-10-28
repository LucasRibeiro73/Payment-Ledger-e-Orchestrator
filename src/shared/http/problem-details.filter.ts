import { STATUS_CODES } from 'node:http';

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly [extension: string]: unknown;
}

// Members defined by RFC 9457 plus the ones Nest adds to its default error
// body; everything else on an exception response is kept as an extension.
const RESERVED_MEMBERS = new Set([
  'type',
  'title',
  'status',
  'detail',
  'instance',
  'statusCode',
  'message',
  'error',
]);

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const problem = {
      ...this.toProblem(exception),
      instance: request.originalUrl,
      requestId: request.id,
    };

    if (problem.status >= 500) {
      this.logger.error({ err: exception, status: problem.status }, 'Request failed');
    }

    response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }

  private toProblem(exception: unknown): ProblemDetails {
    if (!(exception instanceof HttpException)) {
      return {
        type: 'about:blank',
        title: titleFor(HttpStatus.INTERNAL_SERVER_ERROR),
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: 'An unexpected error occurred.',
      };
    }

    const status = exception.getStatus();
    const body = exception.getResponse();
    return {
      ...(isRecord(body) && extensionsOf(body)),
      type: 'about:blank',
      title: titleFor(status),
      status,
      detail: detailOf(body) ?? exception.message,
    };
  }
}

function titleFor(status: number): string {
  return STATUS_CODES[status] ?? 'Unknown Error';
}

function detailOf(body: string | object): string | undefined {
  if (typeof body === 'string') {
    return body;
  }
  if (isRecord(body) && typeof body['message'] === 'string') {
    return body['message'];
  }
  return undefined;
}

function extensionsOf(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(body).filter(([key]) => !RESERVED_MEMBERS.has(key)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
