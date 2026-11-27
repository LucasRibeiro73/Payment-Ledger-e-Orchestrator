import { describe, expect, it } from 'vitest';

import { resolveRequestId } from './request-id';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('resolveRequestId', () => {
  it('keeps a well-formed incoming id', () => {
    expect(resolveRequestId('req_01HZX.abc:9-1')).toBe('req_01HZX.abc:9-1');
  });

  it('generates a uuid when the header is absent', () => {
    expect(resolveRequestId(undefined)).toMatch(UUID);
  });

  it.each([
    ['empty', ''],
    ['newline injection', 'abc\n{"level":"fatal"}'],
    ['spaces', 'abc def'],
    ['too long', 'a'.repeat(129)],
  ])('replaces an unsafe id (%s)', (_case, value) => {
    expect(resolveRequestId(value)).toMatch(UUID);
  });

  it('ignores repeated headers instead of picking one', () => {
    expect(resolveRequestId(['a', 'b'])).toMatch(UUID);
  });
});
