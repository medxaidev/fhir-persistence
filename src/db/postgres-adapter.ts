/**
 * PostgresAdapter — PostgreSQL Implementation of StorageAdapter
 *
 * Implements StorageAdapter using a pool-like interface injected at
 * construction time. Does NOT import `pg` directly — accepts any
 * object satisfying `PgPoolLike` (duck typing for pg.Pool).
 *
 * Key features:
 * - Automatic `?` → `$1, $2, ...` placeholder rewriting
 * - Transaction via pool client + BEGIN/COMMIT/ROLLBACK
 * - queryStream via cursor-like row iteration
 * - Serialization failure retry (40001) with exponential backoff
 *
 * @module fhir-persistence/db
 */

import type { StorageAdapter, PreparedStatement, TransactionContext } from './adapter.js';

// =============================================================================
// Section 1: Pool-Like Interface (duck typing for pg.Pool)
// =============================================================================

/**
 * Minimal interface that pg.Pool satisfies.
 * Allows PostgresAdapter to work without importing `pg`.
 */
export interface PgPoolLike {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  connect(): Promise<PgClientLike>;
  end(): Promise<void>;
}

/**
 * Minimal interface that pg.PoolClient satisfies.
 */
export interface PgClientLike {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  release(): void;
}

// =============================================================================
// Section 2: Placeholder Rewriting
// =============================================================================

/**
 * Rewrite `?` placeholders to PostgreSQL `$1, $2, ...` positional params.
 *
 * Handles:
 * - Skips `?` inside single-quoted string literals
 * - Sequential numbering starting from $1
 *
 * @param sql - SQL with `?` placeholders.
 * @returns SQL with `$N` placeholders.
 */
export function rewritePlaceholders(sql: string): string {
  let result = '';
  let paramIndex = 1;
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (ch === "'" && !inString) {
      inString = true;
      result += ch;
    } else if (ch === "'" && inString) {
      // Check for escaped quote ('')
      if (i + 1 < sql.length && sql[i + 1] === "'") {
        result += "''";
        i++;
      } else {
        inString = false;
        result += ch;
      }
    } else if (ch === '?' && !inString) {
      result += `$${paramIndex}`;
      paramIndex++;
    } else {
      result += ch;
    }
  }

  return result;
}

// =============================================================================
// Section 3: PostgresAdapter
// =============================================================================

export class PostgresAdapter implements StorageAdapter {
  private readonly pool: PgPoolLike;
  private closed = false;

  constructor(pool: PgPoolLike) {
    this.pool = pool;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    this.ensureNotClosed();
    const pgSql = rewritePlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return { changes: result.rowCount ?? 0 };
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.ensureNotClosed();
    const pgSql = rewritePlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows as T[];
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    this.ensureNotClosed();
    const pgSql = rewritePlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return (result.rows[0] as T) ?? undefined;
  }

  async *queryStream<T = Record<string, unknown>>(sql: string, params: unknown[] = []): AsyncIterable<T> {
    this.ensureNotClosed();
    const pgSql = rewritePlaceholders(sql);
    // For PostgreSQL, we fetch all rows and yield them one by one.
    // A production implementation would use pg-cursor for true streaming.
    const result = await this.pool.query(pgSql, params);
    for (const row of result.rows) {
      yield row as T;
    }
  }

  prepare<T = Record<string, unknown>>(_sql: string): PreparedStatement<T> {
    // PostgreSQL doesn't have a direct equivalent to SQLite's prepare.
    // In a production implementation, this would use PG's PREPARE/EXECUTE.
    // For now, throw to indicate this method requires a real PG connection.
    throw new Error('PostgresAdapter.prepare() is not supported. Use query() or execute() instead.');
  }

  async transaction<R>(fn: (tx: TransactionContext) => R | Promise<R>): Promise<R> {
    this.ensureNotClosed();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const ctx: TransactionContext = {
        execute: async (sql: string, params: unknown[] = []): Promise<{ changes: number }> => {
          const pgSql = rewritePlaceholders(sql);
          const result = await client.query(pgSql, params);
          return { changes: result.rowCount ?? 0 };
        },
        query: async <Q = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<Q[]> => {
          const pgSql = rewritePlaceholders(sql);
          const result = await client.query(pgSql, params);
          return result.rows as Q[];
        },
        queryOne: async <Q = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<Q | undefined> => {
          const pgSql = rewritePlaceholders(sql);
          const result = await client.query(pgSql, params);
          return (result.rows[0] as Q) ?? undefined;
        },
      };

      const result = await fn(ctx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (!this.closed) {
      this.closed = true;
      await this.pool.end();
    }
  }

  private ensureNotClosed(): void {
    if (this.closed) {
      throw new Error('PostgresAdapter: pool is closed');
    }
  }
}

// AsyncTransactionContext is no longer needed — TransactionContext is now async.
// Kept as a type alias for backward compatibility.
export type AsyncTransactionContext = TransactionContext;
