import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';

import { PrismaService } from '../database/prisma.service';
import { RedisHealthIndicator } from './redis.health';

const DEPENDENCY_TIMEOUT_MS = 1_000;

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  // Liveness must not touch dependencies: a database outage should take the
  // instance out of rotation (readiness), not get it restarted in a loop.
  @Get('live')
  @HealthCheck()
  live(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        this.prismaIndicator.pingCheck('database', this.prisma, { timeout: DEPENDENCY_TIMEOUT_MS }),
      () => this.redisIndicator.pingCheck('redis', DEPENDENCY_TIMEOUT_MS),
    ]);
  }
}
