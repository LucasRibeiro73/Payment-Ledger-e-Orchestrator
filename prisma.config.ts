import { existsSync } from 'node:fs';

import { defineConfig } from 'prisma/config';

// The CLI runs outside the app, so it loads .env itself in development.
// In containers and CI the variables come from the environment.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? '',
  },
});
