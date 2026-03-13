/**
 * Performance Benchmark — Direction C: sql.js vs better-sqlite3
 *
 * Compares both SQLite adapters across typical FHIR persistence workloads:
 * - Single row inserts
 * - Batch inserts (transaction)
 * - Point reads (by ID)
 * - Search queries (WHERE + ORDER BY + LIMIT)
 * - Streaming iteration
 *
 * Each benchmark runs N iterations and reports avg/min/max ms.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import type { StorageAdapter } from '../../db/adapter.js';

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

describe('Performance Benchmark — sql.js vs better-sqlite3', () => {
  let sqljs: SQLiteAdapter;
  let better: BetterSqlite3Adapter;
  const ROWS = 500;
  const SEARCH_ITERATIONS = 50;

  beforeAll(async () => {
    sqljs = new SQLiteAdapter(':memory:');
    better = new BetterSqlite3Adapter({ path: ':memory:' });

    // Create tables
    await sqljs.execute(DDL);
    await better.execute(DDL);
  });

  afterAll(async () => {
    await sqljs.close();
    await better.close();
  });

  it(`batch insert ${ROWS} rows`, async () => {
    const results: BenchResult[] = [];

    // sql.js
    results.push(await bench('sql.js batch insert', 1, async () => {
      await sqljs.transaction(tx => {
        for (let i = 0; i < ROWS; i++) {
          const p = makePatient(i);
          tx.execute(
            `INSERT OR REPLACE INTO "Patient" ("id","versionId","content","lastUpdated","deleted","__gender","__genderSort","birthdate") VALUES (?,?,?,?,0,?,?,?)`,
            [p.id, p.versionId, p.content, p.lastUpdated, p.gender, p.genderSort, p.birthdate],
          );
        }
      });
    }));

    // better-sqlite3
    results.push(await bench('better-sqlite3 batch insert', 1, async () => {
      await better.transaction(tx => {
        for (let i = 0; i < ROWS; i++) {
          const p = makePatient(i);
          tx.execute(
            `INSERT OR REPLACE INTO "Patient" ("id","versionId","content","lastUpdated","deleted","__gender","__genderSort","birthdate") VALUES (?,?,?,?,0,?,?,?)`,
            [p.id, p.versionId, p.content, p.lastUpdated, p.gender, p.genderSort, p.birthdate],
          );
        }
      });
    }));

    for (const r of results) console.log(formatResult(r));
    expect(results).toHaveLength(2);
  });

  it(`point read by ID (${SEARCH_ITERATIONS} iterations)`, async () => {
    const results: BenchResult[] = [];

    results.push(await bench('sql.js point read', SEARCH_ITERATIONS, async () => {
      const id = `patient-${Math.floor(Math.random() * ROWS)}`;
      await sqljs.queryOne('SELECT "content" FROM "Patient" WHERE "id" = ?', [id]);
    }));

    results.push(await bench('better-sqlite3 point read', SEARCH_ITERATIONS, async () => {
      const id = `patient-${Math.floor(Math.random() * ROWS)}`;
      await better.queryOne('SELECT "content" FROM "Patient" WHERE "id" = ?', [id]);
    }));

    for (const r of results) console.log(formatResult(r));
    expect(results).toHaveLength(2);
  });

  it(`search with WHERE + ORDER BY + LIMIT (${SEARCH_ITERATIONS} iterations)`, async () => {
    const results: BenchResult[] = [];

    const searchSQL = `SELECT "id","content" FROM "Patient" WHERE "deleted" = 0 AND "__gender" = ? ORDER BY "birthdate" DESC LIMIT 20`;

    results.push(await bench('sql.js search', SEARCH_ITERATIONS, async () => {
      await sqljs.query(searchSQL, ['|male']);
    }));

    results.push(await bench('better-sqlite3 search', SEARCH_ITERATIONS, async () => {
      await better.query(searchSQL, ['|male']);
    }));

    for (const r of results) console.log(formatResult(r));
    expect(results).toHaveLength(2);
  });

  it(`full table scan via queryStream (${ROWS} rows)`, async () => {
    const results: BenchResult[] = [];

    results.push(await bench('sql.js stream', 5, async () => {
      let count = 0;
      for await (const _row of sqljs.queryStream('SELECT "content" FROM "Patient" WHERE "deleted" = 0')) {
        count++;
      }
      expect(count).toBe(ROWS);
    }));

    results.push(await bench('better-sqlite3 stream', 5, async () => {
      let count = 0;
      for await (const _row of better.queryStream('SELECT "content" FROM "Patient" WHERE "deleted" = 0')) {
        count++;
      }
      expect(count).toBe(ROWS);
    }));

    for (const r of results) console.log(formatResult(r));
    expect(results).toHaveLength(2);
  });

  it(`transaction with mixed read/write (${SEARCH_ITERATIONS} iterations)`, async () => {
    const results: BenchResult[] = [];

    results.push(await bench('sql.js mixed tx', SEARCH_ITERATIONS, async () => {
      await sqljs.transaction(tx => {
        const row = tx.queryOne<{ content: string }>('SELECT "content" FROM "Patient" WHERE "id" = ?', ['patient-1']);
        if (row) {
          tx.execute('UPDATE "Patient" SET "lastUpdated" = ? WHERE "id" = ?', [new Date().toISOString(), 'patient-1']);
        }
      });
    }));

    results.push(await bench('better-sqlite3 mixed tx', SEARCH_ITERATIONS, async () => {
      await better.transaction(tx => {
        const row = tx.queryOne<{ content: string }>('SELECT "content" FROM "Patient" WHERE "id" = ?', ['patient-1']);
        if (row) {
          tx.execute('UPDATE "Patient" SET "lastUpdated" = ? WHERE "id" = ?', [new Date().toISOString(), 'patient-1']);
        }
      });
    }));

    for (const r of results) console.log(formatResult(r));
    expect(results).toHaveLength(2);
  });
});
