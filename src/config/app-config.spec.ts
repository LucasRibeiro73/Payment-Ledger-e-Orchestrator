import { describe, expect, it } from 'vitest';

import { InvalidConfigError, loadConfig } from './app-config';

const validEnv = {
  DATABASE_URL: 'postgresql://ledger:secret-password@localhost:5432/ledger',
  REDIS_URL: 'redis://localhost:6379',
};

describe('loadConfig', () => {
  it('applies defaults for optional variables', () => {
    const config = loadConfig(validEnv);

    expect(config).toEqual({
      env: 'development',
      port: 3000,
      logLevel: 'info',
      databaseUrl: validEnv.DATABASE_URL,
      redisUrl: validEnv.REDIS_URL,
    });
  });

  it('coerces PORT from string', () => {
    expect(loadConfig({ ...validEnv, PORT: '8080' }).port).toBe(8080);
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(loadConfig(validEnv))).toBe(true);
  });

  it('names every missing variable in the error', () => {
    expect(() => loadConfig({})).toThrow(InvalidConfigError);
    expect(() => loadConfig({})).toThrow(/DATABASE_URL[\s\S]*REDIS_URL/);
  });

  it.each([
    ['PORT', '70000'],
    ['NODE_ENV', 'staging'],
    ['LOG_LEVEL', 'verbose'],
    ['DATABASE_URL', 'mysql://localhost/ledger'],
    ['REDIS_URL', 'not-a-url'],
  ])('rejects invalid %s', (key, value) => {
    expect(() => loadConfig({ ...validEnv, [key]: value })).toThrow(new RegExp(key));
  });

  it('does not echo secret values in the error message', () => {
    const env = { ...validEnv, REDIS_URL: 'secret-password' };

    expect(() => loadConfig(env)).toThrow(/REDIS_URL/);
    expect(() => loadConfig(env)).not.toThrow(/secret-password/);
  });
});
