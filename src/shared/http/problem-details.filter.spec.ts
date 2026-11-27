import {
  ConflictException,
  Controller,
  Get,
  type INestApplication,
  ServiceUnavailableException,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PROBLEM_CONTENT_TYPE, ProblemDetailsFilter } from './problem-details.filter';

@Controller('boom')
class BoomController {
  @Get('conflict')
  conflict(): never {
    throw new ConflictException('Payment already captured');
  }

  @Get('unavailable')
  unavailable(): never {
    throw new ServiceUnavailableException({ status: 'error', details: { database: 'down' } });
  }

  @Get('crash')
  crash(): never {
    throw new Error('connection string postgresql://user:pass@db leaked');
  }
}

describe('ProblemDetailsFilter', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BoomController],
      providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('maps an HttpException to problem+json', async () => {
    const response = await request(app.getHttpServer()).get('/boom/conflict').expect(409);

    expect(response.headers['content-type']).toContain(PROBLEM_CONTENT_TYPE);
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      detail: 'Payment already captured',
      instance: '/boom/conflict',
    });
  });

  it('formats unknown routes the same way', async () => {
    const response = await request(app.getHttpServer()).get('/nope').expect(404);

    expect(response.body).toMatchObject({ title: 'Not Found', status: 404, instance: '/nope' });
  });

  it('keeps non-reserved members of an object response as extensions', async () => {
    const response = await request(app.getHttpServer()).get('/boom/unavailable').expect(503);

    expect(response.body).toMatchObject({
      status: 503,
      title: 'Service Unavailable',
      details: { database: 'down' },
    });
  });

  it('hides internals of unexpected errors', async () => {
    const response = await request(app.getHttpServer()).get('/boom/crash').expect(500);

    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred.',
      instance: '/boom/crash',
    });
  });
});
