import { type Params } from 'nestjs-pino';

import { type AppConfig } from '../../config/app-config';
import { REQUEST_ID_HEADER, resolveRequestId } from './request-id';

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
];

export function buildLoggerParams(config: AppConfig): Params {
  return {
    pinoHttp: {
      level: config.logLevel,
      redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
      customAttributeKeys: { reqId: 'requestId' },
      genReqId: (req, res) => {
        const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
        res.setHeader(REQUEST_ID_HEADER, requestId);
        return requestId;
      },
      ...(config.env === 'development' && {
        transport: { target: 'pino-pretty', options: { singleLine: true } },
      }),
    },
  };
}
