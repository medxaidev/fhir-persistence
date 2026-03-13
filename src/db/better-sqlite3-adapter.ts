/**
 * BetterSqlite3Adapter — Native SQLite Implementation of StorageAdapter
 *
 * Uses `better-sqlite3` for production-grade, synchronous SQLite access
 * with native C++ bindings. Significantly faster than sql.js (WebAssembly)
 * for most workloads, especially writes and transactions.
 *
 * ## Advantages over sql.js:
 * - Native C++ bindings — ~3-10× faster than WebAssembly
 * - True WAL mode with file-based databases
 * - Real prepared statement caching
 * - Synchronous API (no async overhead for each operation)
 * - Lower memory overhead
 *
 * ## Trade-offs:
 * - Requires native compilation (node-gyp, prebuild)
 * - Not available in browser environments
 * - Not available in some serverless environments
 *
 * @module fhir-persistence/db
 */

import Database from 'better-sqlite3';
import type { Database as BetterSqlite3Database } from 'better-sqlite3';
import type { StorageAdapter, PreparedStatement, TransactionContext } from './adapter.js';

// =============================================================================
// Section 1: BetterSqlite3Adapter
// =============================================================================

export interface BetterSqlite3Options {
  /** Database file path, or ':memory:' for in-memory database. */
  path?: string;
  /** Enable WAL journal mode (default: true). */
  wal?: boolean;
  /** Enable foreign key constraints (default: true). */
  foreignKeys?: boolean;
  /** Busy timeout in milliseconds (default: 5000). */
  busyTimeout?: number;
  /** Additional PRAGMA statements to execute on init. */
  pragmas?: Record<string, string | number | boolean>;
}

export class BetterSqlite3Adapter implements StorageAdapter {
  private db: BetterSqlite3Database;
  private closed = false;

  constructor(options: BetterSqlite3Options = {}) {
    const {
      path = ':memory:',
      wal = true,
      foreignKeys = true,
      busyTimeout = 5000,
      pragmas = {},
    } = options;

    this.db = new Database(path);

    // Core PRAGMAs
    if (wal) {
      this.db.pragma('journal_mode = WAL');
    }
    if (foreignKeys) {
      this.db.pragma('foreign_keys = ON');
    }
    if (busyTimeout > 0) {
      this.db.pragma(`busy_timeout = ${busyTimeout}`);
    }

    // User-defined PRAGMAs
    for (const [key, value] of Object.entries(pragmas)) {
      this.db.pragma(`${key} = ${value}`);
    }
  }

  private ensureOpen(): BetterSqlite3Database {
    if (this.closed) {
      throw new Error('BetterSqlite3Adapter: database is closed');
    }
    return this.db;
  }

  // ---------------------------------------------------------------------------
  // StorageAdapter implementation
  // ---------------------------------------------------------------------------

  async execute(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    const db = this.ensureOpen();
    const result = db.prepare(sql).run(...params);
    return { changes: result.changes };
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = this.ensureOpen();
    return db.prepare(sql).all(...params) as T[];
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const db = this.ensureOpen();
    return db.prepare(sql).get(...params) as T | undefined;
  }

  async *queryStream<T = Record<string, unknown>>(sql: string, params: unknown[] = []): AsyncIterable<T> {
    const db = this.ensureOpen();
    const stmt = db.prepare(sql);
    for (const row of stmt.iterate(...params)) {
      yield row as T;
    }
  }

  prepare<T = Record<string, unknown>>(sql: string): PreparedStatement<T> {
    const db = this.ensureOpen();
    const stmt = db.prepare(sql);

    return {
      query(params: unknown[] = []): T[] {
        return stmt.all(...params) as T[];
      },
      execute(params: unknown[] = []): { changes: number; lastInsertRowid?: number | bigint } {
        const result = stmt.run(...params);
        return {
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid,
        };
      },
      finalize(): void {
        // better-sqlite3 statements are finalized automatically by GC,
        // but we can explicitly discard the reference
      },
    };
  }

  async transaction<R>(fn: (tx: TransactionContext) => R | Promise<R>): Promise<R> {
    const db = this.ensureOpen();

    const ctx: TransactionContext = {
      execute(sql: string, params: unknown[] = []): { changes: number } {
        const result = db.prepare(sql).run(...params);
        return { changes: result.changes };
      },
      query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
        return db.prepare(sql).all(...params) as T[];
      },
      queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
        return db.prepare(sql).get(...params) as T | undefined;
      },
    };

    // Use better-sqlite3's built-in transaction support for sync callbacks,
    // but wrap in manual BEGIN/COMMIT for async compatibility
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = await fn(ctx);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  async close(): Promise<void> {
    if (!this.closed) {
      this.db.close();
      this.closed = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Additional utilities
  // ---------------------------------------------------------------------------

  /**
   * Get the underlying better-sqlite3 Database instance.
   * Use with caution — bypasses the adapter abstraction.
   */
  getRawDatabase(): BetterSqlite3Database {
    return this.ensureOpen();
  }

  /**
   * Execute a PRAGMA and return the result.
   */
  pragma(statement: string): unknown {
    return this.ensureOpen().pragma(statement);
  }

  /**
   * Checkpoint WAL file to main database file.
   * Useful before backup or when shutting down.
   */
  checkpoint(mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE' = 'PASSIVE'): void {
    this.ensureOpen().pragma(`wal_checkpoint(${mode})`);
  }
}
