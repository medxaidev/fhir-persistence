/**
 * Database Client
 *
 * Thin wrapper around `pg.Pool` providing:
 * - Connection pool lifecycle (connect / close)
 * - Transaction helper (`withTransaction`)
 * - Raw query execution
 *
 * @module fhir-persistence/db
 */

import pg from "pg";
import type { DatabaseConfig } from "./config.js";

const { Pool } = pg;
type PoolClient = pg.PoolClient;

export class DatabaseClient {
  private pool: pg.Pool;
  private _closed = false;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  /**
   * Execute a SQL query against the pool.
   */
  async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  /**
   * Execute a callback within a database transaction.
   *
   * - Automatically calls `BEGIN` before and `COMMIT` after.
   * - Calls `ROLLBACK` if the callback throws.
   * - Returns the callback's return value.
   * - Auto-retries on PostgreSQL serialization_failure (40001) with
   *   exponential backoff (max 3 retries).
   */
  async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const maxRetries = 3;
    let attempt = 0;

    while (true) {
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        // Retry on serialization_failure (40001)
        if (isSerializationFailure(err) && attempt < maxRetries) {
          attempt++;
          const delayMs = Math.min(50 * Math.pow(2, attempt), 1000);
          await sleep(delayMs);
          continue;
        }
        throw err;
      } finally {
        client.release();
      }
    }
  }

  /**
   * Execute multiple SQL statements sequentially (e.g. DDL).
   *
   * Each statement is executed individually. Errors are collected
   * and returned; execution continues on failure.
   */
  async executeStatements(
    statements: string[],
    options?: { stopOnError?: boolean },
  ): Promise<{
    executed: number;
    errors: Array<{ index: number; sql: string; error: string }>;
  }> {
    const errors: Array<{ index: number; sql: string; error: string }> = [];
    let executed = 0;

    for (let i = 0; i < statements.length; i++) {
      try {
        await this.pool.query(statements[i]);
        executed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({
          index: i,
          sql: statements[i].slice(0, 200),
          error: message,
        });
        if (options?.stopOnError) {
          break;
        }
      }
    }

    return { executed, errors };
  }

  /**
   * Run EXPLAIN ANALYZE on a query and return the plan.
   *
   * Useful for development-mode query optimization.
   * Only call when MEDXAI_EXPLAIN=1 or in dev mode.
   */
  async explain(text: string, values?: unknown[]): Promise<string[]> {
    const result = await this.pool.query<{ "QUERY PLAN": string }>(
      `EXPLAIN ANALYZE ${text}`,
      values,
    );
    return result.rows.map((r) => r["QUERY PLAN"]);
  }

  /**
   * Check if the database connection is alive.
   */
  async ping(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close the connection pool.
   */
  async close(): Promise<void> {
    if (!this._closed) {
      this._closed = true;
      await this.pool.end();
    }
  }

  get isClosed(): boolean {
    return this._closed;
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if a PostgreSQL error is a serialization_failure (40001).
 */
function isSerializationFailure(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "code" in err) {
    return (err as { code: string }).code === "40001";
  }
  return false;
}

/**
 * Promise-based sleep.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
