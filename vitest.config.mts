import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC replaces Vite's default transformer because it is the one that emits
// decorator metadata, which Nest needs to resolve constructor injection.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: false,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.int-spec.ts', 'src/main.ts', 'src/generated/**'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['src/**/*.int-spec.ts', 'test/**/*.int-spec.ts'],
          testTimeout: 30_000,
          hookTimeout: 120_000,
          // Containers are shared per file; running files in parallel would
          // start one Postgres per worker and exhaust Docker resources on CI.
          fileParallelism: false,
        },
      },
    ],
  },
});
