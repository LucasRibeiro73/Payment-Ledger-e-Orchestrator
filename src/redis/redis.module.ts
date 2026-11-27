import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';

import { APP_CONFIG, type AppConfig } from '../config/app-config';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

const logger = new Logger('Redis');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): Redis => {
        const redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 });
        // ioredis reconnects on its own; without a listener every failed
        // attempt is reported as an unhandled error event on stderr.
        redis.on('error', (error: Error) => {
          logger.warn({ err: error }, 'Redis connection error');
        });
        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.redis.status === 'end') {
      return;
    }
    await this.redis.quit();
  }
}
