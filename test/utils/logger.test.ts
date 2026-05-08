import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../src/utils/logger';

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('emits info as JSON to console.log', () => {
    logger.info('hello', { route: 'GET /' });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('hello');
    expect(entry.context.route).toBe('GET /');
    expect(typeof entry.timestamp).toBe('string');
  });

  it('emits error to console.error with serialized Error fields', () => {
    const err = new TypeError('boom');
    logger.error('crashed', { userId: 'u1' }, err);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(entry.level).toBe('error');
    expect(entry.error.name).toBe('TypeError');
    expect(entry.error.message).toBe('boom');
    expect(entry.error.stack).toContain('TypeError');
  });

  it('handles non-Error rejection values', () => {
    logger.error('odd', {}, 'string thrown');
    const entry = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(entry.error.name).toBe('NonError');
    expect(entry.error.message).toBe('string thrown');
  });

  it('sends warn to console.error not console.log', () => {
    logger.warn('careful');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
