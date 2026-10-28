import { type DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { type AppConfig } from './config/app-config';
import { ConfigModule } from './config/config.module';
import { buildLoggerParams } from './shared/logging/logger-params';

@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [ConfigModule.forRoot(config), LoggerModule.forRoot(buildLoggerParams(config))],
    };
  }
}
