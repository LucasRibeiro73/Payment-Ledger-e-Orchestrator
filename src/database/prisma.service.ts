import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { PrismaClient } from '../generated/prisma/client';

// The client connects lazily on the first query. Booting does not depend on
// the database being up; readiness reports it instead.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    super({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
