import { describe, expect, it, vi } from 'vitest';
import { createConsoleLogger } from './logger';

describe('REQ-NFR-004 the console Logger adapter', () => {
  it('prefixes every line with [SiteMark] and passes the detail along', () => {
    const sink = { warn: vi.fn(), error: vi.fn() };
    const logger = createConsoleLogger(sink);
    const cause = new Error('quota');
    logger.warn('Storage access level not set');
    logger.error('Saving failed', cause);
    expect(sink.warn).toHaveBeenCalledWith('[SiteMark] Storage access level not set');
    expect(sink.error).toHaveBeenCalledWith('[SiteMark] Saving failed', cause);
  });

  it('writes to the console by default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    createConsoleLogger().warn('hello');
    expect(warn).toHaveBeenCalledWith('[SiteMark] hello');
  });
});
