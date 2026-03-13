/**
 * SQLiteAdapter — SQLite Implementation of StorageAdapter
 *
 * Uses `sql.js` (WebAssembly-based SQLite) for cross-platform
 * compatibility without native C++ compilation requirements.
 *
 * v2 upgrade: New file. v1 had no SQLite support.
 *
 * ## WAL Mode
 * sql.js runs in-memory by default. For file-based databases,
 * WAL mode and foreign keys are enabled on construction.
 *
 * @module fhir-persistence/db
 */

import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import type { StorageAdapter, PreparedStatement, TransactionContext } from './adapter.js';

// =============================================================================
// Section 1: Initialization Helper
// =============================================================================

let sqlJsInitPromise: Promise<SqlJsStatic> | null = null;

/**
 * Initialize sql.js (loads WebAssembly). Cached after first call.
 */
async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsInitPromise) {
    sqlJsInitPromise = initSqlJs();
  }
  return sqlJsInitPromise;
}

// =============================================================================
// Section 2: SQLiteAdapter
// =============================================================================

export class SQLiteAdapter implements StorageAdapter {
  private db: SqlJsDatabase | null = null;
  private initPromise: Promise<void>;

  /**
   * @param path - Database file path, or ':memory:' for in-memory database.
   * @param data - Optional Uint8Array of an existing database file to load.
   */
  constructor(
    _path: string = ':memory:',
    private readonly data?: Uint8Array,
  ) {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    const SQL = await getSqlJs();
    this.db = new SQL.Database(this.data);
    // Enable WAL mode for better concurrent read performance
    this.db.run('PRAGMA journal_mode = WAL');
    // Enable foreign key constraints
    this.db.run('PRAGMA foreign_keys = ON');
  }

  private async getDb(): Promise<SqlJsDatabase> {
    await this.initPromise;
    if (!this.db) {
      throw new Error('SQLiteAdapter: database is closed');
    }
    return this.db;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    const db = await this.getDb();
    db.run(sql, params as (string | number | null | Uint8Array)[]);
    const result = db.exec('SELECT changes() as c');
    const changes = result.length > 0 ? (result[0].values[0][0] as number) : 0;
    return { changes };
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = await this.getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params as (string | number | null | Uint8Array)[]);

    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return rows;
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const db = await this.getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params as (string | number | null | Uint8Array)[]);

    let result: T | undefined;
    if (stmt.step()) {
      result = stmt.getAsObject() as T;
    }
    stmt.free();
    return result;
  }

  async *queryStream<T = Record<string, unknown>>(sql: string, params: unknown[] = []): AsyncIterable<T> {
    const db = await this.getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params as (string | number | null | Uint8Array)[]);

    try {
      while (stmt.step()) {
        yield stmt.getAsObject() as T;
      }
    } finally {
      stmt.free();
    }
  }

  prepare<T = Record<string, unknown>>(sql: string): PreparedStatement<T> {
    // sql.js is async-init, so we need the db to be ready
    // For prepare, we require the adapter to be initialized
    if (!this.db) {
      throw new Error('SQLiteAdapter: database not initialized. Await an operation first.');
    }
    const db = this.db;
    const stmt = db.prepare(sql);

    return {
      query(params: unknown[] = []): T[] {
        stmt.bind(params as (string | number | null | Uint8Array)[]);
        const rows: T[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject() as T);
        }
        stmt.reset();
        return rows;
      },
      execute(params: unknown[] = []): { changes: number; lastInsertRowid?: number | bigint } {
        stmt.bind(params as (string | number | null | Uint8Array)[]);
        stmt.step();
        stmt.reset();
        // Get changes count
        const changesResult = db.exec('SELECT changes() as c, last_insert_rowid() as r');
        const changes = changesResult.length > 0 ? (changesResult[0].values[0][0] as number) : 0;
        const lastInsertRowid = changesResult.length > 0 ? (changesResult[0].values[0][1] as number) : undefined;
        return { changes, lastInsertRowid };
      },
      finalize(): void {
        stmt.free();
      },
    };
  }

  async transaction<R>(fn: (tx: TransactionContext) => R | Promise<R>): Promise<R> {
    const db = await this.getDb();

    // BEGIN IMMEDIATE: write lock immediately, allows concurrent reads
    db.run('BEGIN IMMEDIATE');

    const ctx: TransactionContext = {
      execute(sql: string, params: unknown[] = []): { changes: number } {
        db.run(sql, params as (string | number | null | Uint8Array)[]);
        const result = db.exec('SELECT changes() as c');
        const changes = result.length > 0 ? (result[0].values[0][0] as number) : 0;
        return { changes };
      },
      query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
        const stmt = db.prepare(sql);
        stmt.bind(params as (string | number | null | Uint8Array)[]);
        const rows: T[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject() as T);
        }
        stmt.free();
        return rows;
      },
      queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
        const stmt = db.prepare(sql);
        stmt.bind(params as (string | number | null | Uint8Array)[]);
        let result: T | undefined;
        if (stmt.step()) {
          result = stmt.getAsObject() as T;
        }
        stmt.free();
        return result;
      },
    };

    try {
      const result = await fn(ctx);
      db.run('COMMIT');
      return result;
    } catch (err) {
      db.run('ROLLBACK');
      throw err;
    }
  }

  async close(): Promise<void> {
    await this.initPromise;
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Export the database as a Uint8Array (for file persistence).
   */
  async export(): Promise<Uint8Array> {
    const db = await this.getDb();
    return db.export();
  }
}
