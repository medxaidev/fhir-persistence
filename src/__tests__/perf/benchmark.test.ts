/**
 * Performance Benchmark — BetterSqlite3Adapter
 *
 * Benchmarks the BetterSqlite3Adapter across typical FHIR persistence workloads:
 * - Batch inserts (transaction)
 * - Point reads (by ID)
 * - Search queries (WHERE + ORDER BY + LIMIT)
 * - Streaming iteration
 * - Mixed read/write transactions
 *
 * Each benchmark runs N iterations and reports avg/min/max ms.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';

// =============================================================================
// Helpers
// =============================================================================

const DDL = `
CREATE TABLE IF NOT EXISTS "Patient" (
  "id" TEXT PRIMARY KEY,
  "versionId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TEXT NOT NULL,
  "deleted" INTEGER NOT NULL DEFAULT 0,
  "__gender" TEXT,
  "__genderSort" TEXT,
  "birthdate" TEXT
)
`;

function makePatient(i: number) {
  return {
    id: `patient-${i}`,
    versionId: `v-${i}`,
    content: JSON.stringify({
      resourceType: 'Patient',
      id: `patient-${i}`,
      gender: i % 2 === 0 ? 'male' : 'female',
      birthDate: `199${i % 10}-0${(i % 9) + 1}-15`,
      name: [{ family: `Family${i}`, given: [`Given${i}`] }],
    }),
    lastUpdated: new Date().toISOString(),
    gender: i % 2 === 0 ? '|male' : '|female',
    genderSort: i % 2 === 0 ? 'male' : 'female',
    birthdate: `199${i % 10}-0${(i % 9) + 1}-15`,
  };
}

interface BenchResult {
  label: string;
  avgMs: number;
  minMs: number;
  maxMs: number;
  totalMs: number;
  ops: number;
}

async function bench(label: string, iterations: number, fn: () => Promise<void>): Promise<BenchResult> {
  // Warmup
  for (let i = 0; i < Math.min(5, iterations); i++) await fn();

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  const totalMs = times.reduce((a, b) => a + b, 0);
  return {
    label,
    avgMs: totalMs / iterations,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    totalMs,
    ops: iterations,
  };
}

function formatResult(r: BenchResult): string {
  return `${r.label}: avg=${r.avgMs.toFixed(3)}ms min=${r.minMs.toFixed(3)}ms max=${r.maxMs.toFixed(3)}ms (${r.ops} ops, ${r.totalMs.toFixed(1)}ms total)`;
}

// =============================================================================
// Benchmark Suite
// =============================================================================

describe('Performance Benchmark — BetterSqlite3Adapter', () => {
  let adapter: BetterSqlite3Adapter;
  const ROWS = 500;
  const SEARCH_ITERATIONS = 50;

  beforeAll(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute(DDL);
  });

  afterAll(async () => {
    await adapter.close();
  });

  it(`batch insert ${ROWS} rows`, async () => {
    const result = await bench('batch insert', 1, async () => {
      await adapter.transaction(async tx => {
        for (let i = 0; i < ROWS; i++) {
          const p = makePatient(i);
          await tx.execute(
            `INSERT OR REPLACE INTO "Patient" ("id","versionId","content","lastUpdated","deleted","__gender","__genderSort","birthdate") VALUES (?,?,?,?,0,?,?,?)`,
            [p.id, p.versionId, p.content, p.lastUpdated, p.gender, p.genderSort, p.birthdate],
          );
        }
      });
    });

    console.log(formatResult(result));
    expect(result.avgMs).toBeGreaterThan(0);
  });

  it(`point read by ID (${SEARCH_ITERATIONS} iterations)`, async () => {
    const result = await bench('point read', SEARCH_ITERATIONS, async () => {
      const id = `patient-${Math.floor(Math.random() * ROWS)}`;
      await adapter.queryOne('SELECT "content" FROM "Patient" WHERE "id" = ?', [id]);
    });

    console.log(formatResult(result));
    expect(result.avgMs).toBeGreaterThan(0);
  });

  it(`search with WHERE + ORDER BY + LIMIT (${SEARCH_ITERATIONS} iterations)`, async () => {
    const searchSQL = `SELECT "id","content" FROM "Patient" WHERE "deleted" = 0 AND "__gender" = ? ORDER BY "birthdate" DESC LIMIT 20`;

    const result = await bench('search', SEARCH_ITERATIONS, async () => {
      await adapter.query(searchSQL, ['|male']);
    });

    console.log(formatResult(result));
    expect(result.avgMs).toBeGreaterThan(0);
  });

  it(`full table scan via queryStream (${ROWS} rows)`, async () => {
    const result = await bench('stream', 5, async () => {
      let count = 0;
      for await (const _row of adapter.queryStream('SELECT "content" FROM "Patient" WHERE "deleted" = 0')) {
        count++;
      }
      expect(count).toBe(ROWS);
    });

    console.log(formatResult(result));
    expect(result.avgMs).toBeGreaterThan(0);
  });

  it(`transaction with mixed read/write (${SEARCH_ITERATIONS} iterations)`, async () => {
    const result = await bench('mixed tx', SEARCH_ITERATIONS, async () => {
      await adapter.transaction(async tx => {
        const row = await tx.queryOne<{ content: string }>('SELECT "content" FROM "Patient" WHERE "id" = ?', ['patient-1']);
        if (row) {
          await tx.execute('UPDATE "Patient" SET "lastUpdated" = ? WHERE "id" = ?', [new Date().toISOString(), 'patient-1']);
        }
      });
    });

    console.log(formatResult(result));
    expect(result.avgMs).toBeGreaterThan(0);
  });
});
