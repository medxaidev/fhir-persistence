/**
 * SearchLogger Tests — 12 pure unit tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { SearchLogger } from '../../observability/search-logger.js';

describe('SearchLogger', () => {
  // =========================================================================
  // 1. logs search execution with duration
  // =========================================================================
  it('logs search execution with duration', () => {
    const logger = new SearchLogger();
    logger.log('Patient', 2, 10, 50);
    const logs = logger.getRecentLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].durationMs).toBe(50);
  });

  // =========================================================================
  // 2. logs resourceType and parameter count
  // =========================================================================
  it('logs resourceType and paramCount', () => {
    const logger = new SearchLogger();
    logger.log('Observation', 3, 5, 20);
    const entry = logger.getRecentLogs()[0];
    expect(entry.resourceType).toBe('Observation');
    expect(entry.paramCount).toBe(3);
  });

  // =========================================================================
  // 3. logs result count
  // =========================================================================
  it('logs resultCount', () => {
    const logger = new SearchLogger();
    logger.log('Patient', 1, 42, 10);
    expect(logger.getRecentLogs()[0].resultCount).toBe(42);
  });

  // =========================================================================
  // 4. slow query threshold triggers warning
  // =========================================================================
  it('flags slow queries above threshold', () => {
    const logger = new SearchLogger({ slowThresholdMs: 100 });
    logger.log('Patient', 1, 10, 50);   // fast
    logger.log('Patient', 1, 10, 150);  // slow
    logger.log('Patient', 1, 10, 100);  // exactly at threshold = slow

    const slow = logger.getSlowQueries();
    expect(slow).toHaveLength(2);
    expect(slow[0].durationMs).toBe(150);
    expect(slow[1].durationMs).toBe(100);
  });

  // =========================================================================
  // 5. disabled logger is no-op
  // =========================================================================
  it('disabled logger does not record entries', () => {
    const logger = new SearchLogger({ enabled: false });
    logger.log('Patient', 1, 10, 50);
    expect(logger.getRecentLogs()).toHaveLength(0);
  });

  // =========================================================================
  // 6. log entries include timestamp
  // =========================================================================
  it('log entries include ISO 8601 timestamp', () => {
    const logger = new SearchLogger();
    logger.log('Patient', 1, 10, 50);
    const ts = logger.getRecentLogs()[0].timestamp;
    expect(ts).toBeTruthy();
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  // =========================================================================
  // 7. getRecentLogs returns last N entries
  // =========================================================================
  it('getRecentLogs returns last N entries', () => {
    const logger = new SearchLogger();
    for (let i = 0; i < 10; i++) {
      logger.log('Patient', 1, i, i * 10);
    }
    const recent = logger.getRecentLogs(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].resultCount).toBe(7);
    expect(recent[2].resultCount).toBe(9);
  });

  // =========================================================================
  // 8. clearLogs resets log buffer
  // =========================================================================
  it('clearLogs resets log buffer', () => {
    const logger = new SearchLogger();
    logger.log('Patient', 1, 10, 50);
    logger.log('Patient', 1, 5, 30);
    logger.clearLogs();
    expect(logger.getRecentLogs()).toHaveLength(0);
  });

  // =========================================================================
  // 9. getStats returns avg/max/min duration
  // =========================================================================
  it('getStats returns correct avg, max, min duration', () => {
    const logger = new SearchLogger();
    logger.log('Patient', 1, 10, 100);
    logger.log('Patient', 1, 10, 200);
    logger.log('Patient', 1, 10, 300);

    const stats = logger.getStats();
    expect(stats.totalSearches).toBe(3);
    expect(stats.avgDurationMs).toBe(200);
    expect(stats.maxDurationMs).toBe(300);
    expect(stats.minDurationMs).toBe(100);
  });

  // =========================================================================
  // 10. custom logger function receives log entry
  // =========================================================================
  it('custom onLog function receives each entry', () => {
    const onLog = vi.fn();
    const logger = new SearchLogger({ onLog });
    logger.log('Patient', 2, 5, 50);
    logger.log('Observation', 1, 3, 100);

    expect(onLog).toHaveBeenCalledTimes(2);
    expect(onLog.mock.calls[0][0].resourceType).toBe('Patient');
    expect(onLog.mock.calls[1][0].resourceType).toBe('Observation');
  });

  // =========================================================================
  // 11. concurrent searches logged independently
  // =========================================================================
  it('multiple searches logged as separate entries', () => {
    const logger = new SearchLogger();
    logger.log('Patient', 1, 10, 50);
    logger.log('Observation', 2, 20, 100);
    logger.log('Condition', 3, 30, 150);

    const logs = logger.getRecentLogs();
    expect(logs).toHaveLength(3);
    expect(logs.map(l => l.resourceType)).toEqual(['Patient', 'Observation', 'Condition']);
  });

  // =========================================================================
  // 12. getStats on empty logger returns zeroes
  // =========================================================================
  it('getStats on empty logger returns zeroes', () => {
    const logger = new SearchLogger();
    const stats = logger.getStats();
    expect(stats.totalSearches).toBe(0);
    expect(stats.avgDurationMs).toBe(0);
    expect(stats.maxDurationMs).toBe(0);
    expect(stats.minDurationMs).toBe(0);
    expect(stats.slowCount).toBe(0);
  });
});
