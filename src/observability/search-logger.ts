/**
 * Search Logger — Execution Time Observability
 *
 * Wraps search operations with timing and result counting.
 * Provides slow query detection, recent log buffer, and stats.
 *
 * @module fhir-persistence/observability
 */

// =============================================================================
// Section 1: Types
// =============================================================================

export interface SearchLogEntry {
  /** Resource type being searched. */
  resourceType: string;
  /** Number of search parameters used. */
  paramCount: number;
  /** Number of results returned. */
  resultCount: number;
  /** Execution duration in milliseconds. */
  durationMs: number;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Whether this was flagged as slow. */
  slow: boolean;
}

export interface SearchLoggerConfig {
  /** Whether logging is enabled. Default: true. */
  enabled?: boolean;
  /** Slow query threshold in milliseconds. Default: 1000. */
  slowThresholdMs?: number;
  /** Maximum number of log entries to retain. Default: 100. */
  maxEntries?: number;
  /** Custom log handler. Called for every search log entry. */
  onLog?: (entry: SearchLogEntry) => void;
}

export interface SearchStats {
  /** Total number of logged searches. */
  totalSearches: number;
  /** Average duration in ms. */
  avgDurationMs: number;
  /** Maximum duration in ms. */
  maxDurationMs: number;
  /** Minimum duration in ms. */
  minDurationMs: number;
  /** Number of slow queries. */
  slowCount: number;
}

// =============================================================================
// Section 2: SearchLogger
// =============================================================================

export class SearchLogger {
  private readonly entries: SearchLogEntry[] = [];
  private readonly enabled: boolean;
  private readonly slowThresholdMs: number;
  private readonly maxEntries: number;
  private readonly onLog?: (entry: SearchLogEntry) => void;

  constructor(config?: SearchLoggerConfig) {
    this.enabled = config?.enabled ?? true;
    this.slowThresholdMs = config?.slowThresholdMs ?? 1000;
    this.maxEntries = config?.maxEntries ?? 100;
    this.onLog = config?.onLog;
  }

  /**
   * Log a completed search operation.
   */
  log(resourceType: string, paramCount: number, resultCount: number, durationMs: number): void {
    if (!this.enabled) return;

    const entry: SearchLogEntry = {
      resourceType,
      paramCount,
      resultCount,
      durationMs,
      timestamp: new Date().toISOString(),
      slow: durationMs >= this.slowThresholdMs,
    };

    this.entries.push(entry);

    // Trim buffer
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    if (this.onLog) {
      this.onLog(entry);
    }
  }

  /**
   * Get the most recent N log entries.
   */
  getRecentLogs(count?: number): SearchLogEntry[] {
    const n = count ?? this.entries.length;
    return this.entries.slice(-n);
  }

  /**
   * Get entries flagged as slow queries.
   */
  getSlowQueries(): SearchLogEntry[] {
    return this.entries.filter(e => e.slow);
  }

  /**
   * Get aggregate statistics.
   */
  getStats(): SearchStats {
    if (this.entries.length === 0) {
      return { totalSearches: 0, avgDurationMs: 0, maxDurationMs: 0, minDurationMs: 0, slowCount: 0 };
    }

    const durations = this.entries.map(e => e.durationMs);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      totalSearches: this.entries.length,
      avgDurationMs: Math.round(sum / this.entries.length),
      maxDurationMs: Math.max(...durations),
      minDurationMs: Math.min(...durations),
      slowCount: this.entries.filter(e => e.slow).length,
    };
  }

  /**
   * Clear all log entries.
   */
  clearLogs(): void {
    this.entries.length = 0;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }
}
