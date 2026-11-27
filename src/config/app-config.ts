import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  })
  .transform((env) => ({
    env: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
  }));

export type AppConfig = Readonly<z.output<typeof envSchema>>;

export const APP_CONFIG = Symbol('APP_CONFIG');

export class InvalidConfigError extends Error {
  override readonly name = 'InvalidConfigError';
}

export function loadConfig(source: Readonly<Record<string, string | undefined>>): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new InvalidConfigError(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return Object.freeze(result.data);
}
