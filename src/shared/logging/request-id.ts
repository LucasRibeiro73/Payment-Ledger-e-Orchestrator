import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

// Incoming ids end up in every log line, so anything that could break the
// log format or bloat it (newlines, control chars, huge values) is replaced.
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function resolveRequestId(incoming: string | string[] | undefined): string {
  if (typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming)) {
    return incoming;
  }
  return randomUUID();
}
