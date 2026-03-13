/**
 * Reindex Scheduler — v2
 *
 * Schedules and tracks asynchronous reindex jobs when a SearchParameter
 * expression changes (detected by SchemaDiff as REINDEX deltas).
 *
 * Design decisions:
 * - Jobs stored in `_reindex_jobs` table (auto-created)
 * - Keyset pagination: processes resources by lastUpdated > cursor
 * - Jobs are independent per (resourceType, searchParamCode)
 * - Status tracking: pending / running / completed / failed
 *
 * @module fhir-persistence/migration
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { SchemaDelta } from './schema-diff.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export type ReindexJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ReindexJob {
  /** Auto-assigned job ID. */
  id: number;
  /** Resource type to reindex (e.g., "Patient"). */
  resourceType: string;
  /** Search parameter code that changed (e.g., "birthdate"). */
  searchParamCode: string;
  /** New FHIRPath expression. */
  expression: string;
  /** Current job status. */
  status: ReindexJobStatus;
  /** Cursor for keyset pagination (lastUpdated of last processed resource). */
  cursor: string | null;
  /** Number of resources processed so far. */
  processedCount: number;
  /** When the job was created. */
  createdAt: string;
  /** When the job was last updated. */
  updatedAt: string;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const REINDEX_JOBS_TABLE = '_reindex_jobs';

const CREATE_REINDEX_JOBS_TABLE = `
CREATE TABLE IF NOT EXISTS "${REINDEX_JOBS_TABLE}" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "resourceType" TEXT NOT NULL,
  "searchParamCode" TEXT NOT NULL,
  "expression" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "cursor" TEXT,
  "processedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// =============================================================================
// Section 3: ReindexScheduler
// =============================================================================

export class ReindexScheduler {
  constructor(private readonly adapter: StorageAdapter) {}

  /**
   * Ensure the reindex jobs table exists.
   */
  async ensureTable(): Promise<void> {
    await this.adapter.execute(CREATE_REINDEX_JOBS_TABLE);
  }

  /**
   * Schedule reindex jobs from REINDEX deltas.
   *
   * @param deltas - REINDEX deltas from SchemaDiff (filtered by caller).
   * @returns Number of jobs scheduled.
   */
  async schedule(deltas: SchemaDelta[]): Promise<number> {
    await this.ensureTable();

    let count = 0;
    for (const delta of deltas) {
      if (delta.kind !== 'REINDEX' || !delta.searchParam) continue;

      await this.adapter.execute(
        `INSERT INTO "${REINDEX_JOBS_TABLE}" ("resourceType", "searchParamCode", "expression") VALUES (?, ?, ?)`,
        [delta.resourceType, delta.searchParam.code, delta.searchParam.expression],
      );
      count++;
    }

    return count;
  }

  /**
   * Get all pending reindex jobs.
   */
  async getPendingJobs(): Promise<ReindexJob[]> {
    await this.ensureTable();
    return this.adapter.query<ReindexJob>(
      `SELECT * FROM "${REINDEX_JOBS_TABLE}" WHERE "status" = 'pending' ORDER BY "id"`,
    );
  }

  /**
   * Get a specific job by ID.
   */
  async getJob(id: number): Promise<ReindexJob | undefined> {
    await this.ensureTable();
    return this.adapter.queryOne<ReindexJob>(
      `SELECT * FROM "${REINDEX_JOBS_TABLE}" WHERE "id" = ?`,
      [id],
    );
  }

  /**
   * Get all jobs (any status).
   */
  async getAllJobs(): Promise<ReindexJob[]> {
    await this.ensureTable();
    return this.adapter.query<ReindexJob>(
      `SELECT * FROM "${REINDEX_JOBS_TABLE}" ORDER BY "id"`,
    );
  }

  /**
   * Update job status and cursor.
   */
  async updateJob(
    id: number,
    update: { status?: ReindexJobStatus; cursor?: string; processedCount?: number },
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (update.status !== undefined) {
      sets.push('"status" = ?');
      values.push(update.status);
    }
    if (update.cursor !== undefined) {
      sets.push('"cursor" = ?');
      values.push(update.cursor);
    }
    if (update.processedCount !== undefined) {
      sets.push('"processedCount" = ?');
      values.push(update.processedCount);
    }

    sets.push(`"updatedAt" = datetime('now')`);
    values.push(id);

    await this.adapter.execute(
      `UPDATE "${REINDEX_JOBS_TABLE}" SET ${sets.join(', ')} WHERE "id" = ?`,
      values,
    );
  }

  /**
   * Get status summary of all jobs.
   */
  async getStatus(): Promise<{ pending: number; running: number; completed: number; failed: number }> {
    await this.ensureTable();
    const rows = await this.adapter.query<{ status: string; cnt: number }>(
      `SELECT "status", COUNT(*) as cnt FROM "${REINDEX_JOBS_TABLE}" GROUP BY "status"`,
    );

    const result = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const row of rows) {
      if (row.status in result) {
        result[row.status as keyof typeof result] = row.cnt;
      }
    }
    return result;
  }
}
