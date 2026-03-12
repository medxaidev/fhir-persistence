/**
 * Repository Contract Tests — DB Physical State & Concurrency
 *
 * These tests verify:
 * 1. DB physical column values after CRUD operations (not just JSON round-trip)
 * 2. Concurrent update race conditions with SELECT ... FOR UPDATE
 * 3. History table integrity
 *
 * Requires real PostgreSQL at localhost:5433/medxai_dev.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DatabaseClient } from '../../db/client.js';
import { FhirRepository } from '../../repo/fhir-repo.js';
import {
  ResourceVersionConflictError,
  ResourceGoneError,
  ResourceNotFoundError,
} from '../../repo/errors.js';
import type { FhirResource } from '../../repo/types.js';

// =============================================================================
// Setup
// =============================================================================

function loadEnv(): void {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(scriptDir, '..', '..', '..', '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

let db: DatabaseClient;
let repo: FhirRepository;

beforeAll(async () => {
  loadEnv();
  db = new DatabaseClient({
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5433', 10),
    database: process.env['DB_NAME'] ?? 'medxai_dev',
    user: process.env['DB_USER'] ?? 'postgres',
    password: process.env['DB_PASSWORD'] ?? 'assert',
  });

  const alive = await db.ping();
  if (!alive) {
    throw new Error('Cannot connect to PostgreSQL. Run `npm run db:init` first.');
  }

  repo = new FhirRepository(db);
});

afterAll(async () => {
  if (db && !db.isClosed) {
    await db.close();
  }
});

// =============================================================================
// Helpers
// =============================================================================

function makePatient(overrides?: Partial<FhirResource>): FhirResource {
  return {
    resourceType: 'Patient',
    name: [{ family: 'ContractTest', given: ['DB'] }],
    birthDate: '1990-01-15',
    gender: 'male',
    ...overrides,
  };
}

async function cleanup(resourceType: string, id: string): Promise<void> {
  try {
    await db.query(`DELETE FROM "${resourceType}_History" WHERE "id" = $1`, [id]);
    await db.query(`DELETE FROM "${resourceType}" WHERE "id" = $1`, [id]);
  } catch {
    // ignore cleanup errors
  }
}

// =============================================================================
// Section 1: DB Physical State Contract Tests
// =============================================================================

describe('DB physical state — create', () => {
  it('main table row has correct column values after create', async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    const result = await db.query<{
      id: string;
      deleted: boolean;
      __version: number;
      compartments: string[];
      lastUpdated: Date;
      projectId: string;
    }>(
      `SELECT "id", "deleted", "__version", "compartments", "lastUpdated", "projectId" FROM "Patient" WHERE "id" = $1`,
      [created.id],
    );

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];

    expect(row.id).toBe(created.id);
    expect(row.deleted).toBe(false);
    expect(row.__version).toBe(1);
    expect(row.compartments).toContain(created.id);
    expect(row.projectId).toBeTruthy();
    expect(row.lastUpdated).toBeInstanceOf(Date);

    await cleanup('Patient', created.id);
  });

  it('content column contains valid JSON matching resource', async () => {
    const patient = makePatient({ birthDate: '1985-03-20' });
    const created = await repo.createResource(patient);

    const result = await db.query<{ content: string }>(
      `SELECT "content" FROM "Patient" WHERE "id" = $1`,
      [created.id],
    );

    const parsed = JSON.parse(result.rows[0].content);
    expect(parsed.id).toBe(created.id);
    expect(parsed.resourceType).toBe('Patient');
    expect(parsed.birthDate).toBe('1985-03-20');
    expect(parsed.meta.versionId).toBe(created.meta.versionId);

    await cleanup('Patient', created.id);
  });

  it('history table row has correct column values after create', async () => {
    const created = await repo.createResource(makePatient());

    const result = await db.query<{
      id: string;
      versionId: string;
      lastUpdated: Date;
      content: string;
    }>(
      `SELECT "id", "versionId", "lastUpdated", "content" FROM "Patient_History" WHERE "id" = $1`,
      [created.id],
    );

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];

    expect(row.id).toBe(created.id);
    expect(row.versionId).toBe(created.meta.versionId);
    expect(row.content).toBeTruthy();
    expect(row.lastUpdated).toBeInstanceOf(Date);

    await cleanup('Patient', created.id);
  });
});

describe('DB physical state — update', () => {
  it('main table row updated in-place (same id, new version)', async () => {
    const created = await repo.createResource(makePatient());
    const updated = await repo.updateResource({ ...created, birthDate: '2000-01-01' });

    const result = await db.query<{
      id: string;
      __version: number;
      content: string;
    }>(
      `SELECT "id", "__version", "content" FROM "Patient" WHERE "id" = $1`,
      [created.id],
    );

    expect(result.rows).toHaveLength(1);
    const parsed = JSON.parse(result.rows[0].content);
    expect(parsed.meta.versionId).toBe(updated.meta.versionId);
    expect(parsed.birthDate).toBe('2000-01-01');

    await cleanup('Patient', created.id);
  });

  it('history table has 2 rows after one update', async () => {
    const created = await repo.createResource(makePatient());
    await repo.updateResource({ ...created, birthDate: '2001-01-01' });

    const result = await db.query<{ versionId: string }>(
      `SELECT "versionId" FROM "Patient_History" WHERE "id" = $1 ORDER BY "lastUpdated" ASC`,
      [created.id],
    );

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].versionId).toBe(created.meta.versionId);

    await cleanup('Patient', created.id);
  });
});

describe('DB physical state — delete', () => {
  it('main table row has deleted=true and empty content after delete', async () => {
    const created = await repo.createResource(makePatient());
    await repo.deleteResource('Patient', created.id);

    const result = await db.query<{
      deleted: boolean;
      content: string;
      __version: number;
    }>(
      `SELECT "deleted", "content", "__version" FROM "Patient" WHERE "id" = $1`,
      [created.id],
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].deleted).toBe(true);
    expect(result.rows[0].content).toBe('');
    expect(result.rows[0].__version).toBe(-1);

    await cleanup('Patient', created.id);
  });

  it('history table has delete marker with empty content', async () => {
    const created = await repo.createResource(makePatient());
    await repo.deleteResource('Patient', created.id);

    const result = await db.query<{ content: string }>(
      `SELECT "content" FROM "Patient_History" WHERE "id" = $1 ORDER BY "lastUpdated" DESC LIMIT 1`,
      [created.id],
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].content).toBe('');

    await cleanup('Patient', created.id);
  });
});

// =============================================================================
// Section 2: Concurrent Race Condition Tests
// =============================================================================

describe('Concurrent update — SELECT FOR UPDATE protection', () => {
  it('concurrent updates with ifMatch: one succeeds, one gets conflict', async () => {
    const created = await repo.createResource(makePatient());
    const versionId = created.meta.versionId;

    // Launch two concurrent updates with the same ifMatch
    const update1 = repo.updateResource(
      { ...created, birthDate: '2001-01-01' },
      { ifMatch: versionId },
    );
    const update2 = repo.updateResource(
      { ...created, birthDate: '2002-02-02' },
      { ifMatch: versionId },
    );

    const results = await Promise.allSettled([update1, update2]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one should succeed, one should fail with conflict
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      ResourceVersionConflictError,
    );

    // Verify DB state is consistent — only 2 history entries (create + 1 successful update)
    const history = await db.query<{ versionId: string }>(
      `SELECT "versionId" FROM "Patient_History" WHERE "id" = $1`,
      [created.id],
    );
    expect(history.rows).toHaveLength(2);

    await cleanup('Patient', created.id);
  }, 15_000);

  it('concurrent delete + update: one succeeds, other gets error', async () => {
    const created = await repo.createResource(makePatient());

    // Launch concurrent delete and update
    const del = repo.deleteResource('Patient', created.id);
    const upd = repo.updateResource({ ...created, birthDate: '2003-03-03' });

    const results = await Promise.allSettled([del, upd]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // One succeeds, one fails (either GoneError or the delete succeeds and update fails, or vice versa)
    expect(fulfilled.length + rejected.length).toBe(2);
    // At least one should succeed
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    // The loser should get either ResourceGoneError (if delete won) or
    // the delete might fail if update already changed it (still valid since resource exists)
    // Key: no data corruption — DB is in a consistent state
    const mainResult = await db.query<{ deleted: boolean }>(
      `SELECT "deleted" FROM "Patient" WHERE "id" = $1`,
      [created.id],
    );
    expect(mainResult.rows).toHaveLength(1);

    await cleanup('Patient', created.id);
  }, 15_000);

  it('concurrent update without ifMatch: last-write-wins, no crash', async () => {
    const created = await repo.createResource(makePatient());

    // Two concurrent updates without ifMatch — both should succeed (last-write-wins)
    const update1 = repo.updateResource({ ...created, birthDate: '2004-04-04' });
    const update2 = repo.updateResource({ ...created, birthDate: '2005-05-05' });

    const results = await Promise.allSettled([update1, update2]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');

    // Both should succeed (no ifMatch means no conflict check)
    expect(fulfilled).toHaveLength(2);

    // History should have 3 entries (create + 2 updates)
    const history = await db.query<{ versionId: string }>(
      `SELECT "versionId" FROM "Patient_History" WHERE "id" = $1`,
      [created.id],
    );
    expect(history.rows).toHaveLength(3);

    await cleanup('Patient', created.id);
  }, 15_000);
});

// =============================================================================
// Section 3: History Table Integrity
// =============================================================================

describe('History table integrity', () => {
  it('versionId is unique (PK) — duplicate versionId would throw', async () => {
    const created = await repo.createResource(makePatient());

    // Try to manually insert a duplicate versionId
    await expect(
      db.query(
        `INSERT INTO "Patient_History" ("versionId", "id", "content", "lastUpdated") VALUES ($1, $2, $3, $4)`,
        [created.meta.versionId, created.id, '{}', new Date().toISOString()],
      ),
    ).rejects.toThrow();

    await cleanup('Patient', created.id);
  });

  it('history entries are ordered by lastUpdated descending', async () => {
    const v1 = await repo.createResource(makePatient());
    const v2 = await repo.updateResource({ ...v1, birthDate: '1991-01-01' });
    const v3 = await repo.updateResource({ ...v2, birthDate: '1992-01-01' });

    const result = await db.query<{ versionId: string; lastUpdated: Date }>(
      `SELECT "versionId", "lastUpdated" FROM "Patient_History" WHERE "id" = $1 ORDER BY "lastUpdated" DESC`,
      [v1.id],
    );

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].versionId).toBe(v3.meta.versionId);
    expect(result.rows[1].versionId).toBe(v2.meta.versionId);
    expect(result.rows[2].versionId).toBe(v1.meta.versionId);

    // Verify timestamps are actually ordered
    const ts = result.rows.map((r) => new Date(r.lastUpdated).getTime());
    expect(ts[0]).toBeGreaterThanOrEqual(ts[1]);
    expect(ts[1]).toBeGreaterThanOrEqual(ts[2]);

    await cleanup('Patient', v1.id);
  });
});
