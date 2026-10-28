import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import request from 'supertest';
import { type App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { loadConfig } from '../src/config/app-config';

describe('health probes', () => {
  let postgres: StartedPostgreSqlContainer;
  let redis: StartedRedisContainer;
  let app: INestApplication<App>;

  beforeAll(async () => {
    [postgres, redis] = await Promise.all([
      new PostgreSqlContainer('postgres:18-alpine').start(),
      new RedisContainer('redis:8-alpine').start(),
    ]);

    const config = loadConfig({
      NODE_ENV: 'test',
      LOG_LEVEL: 'fatal',
      DATABASE_URL: postgres.getConnectionUri(),
      REDIS_URL: redis.getConnectionUrl(),
    });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRoot(config)],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await Promise.all([postgres.stop(), redis.stop()]);
  });

  it('reports liveness without checking dependencies', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200);
  });

  it('echoes the caller request id', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/live')
      .set('X-Request-Id', 'probe-42')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('probe-42');
  });

  it('is ready when postgres and redis respond', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      info: { database: { status: 'up' }, redis: { status: 'up' } },
    });
  });

  // Runs last because it stops the shared database container.
  it('is not ready once postgres goes away', async () => {
    await postgres.stop();

    const response = await request(app.getHttpServer()).get('/health/ready').expect(503);

    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body).toMatchObject({
      status: 503,
      details: { database: { status: 'down' }, redis: { status: 'up' } },
    });
  });
});
