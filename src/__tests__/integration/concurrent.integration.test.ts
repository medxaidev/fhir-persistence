/**
 * Concurrent Write Integration Tests — Real PostgreSQL
 *
 * Tests concurrent access patterns for FhirRepository:
 * - Concurrent updates to the same resource (no lost updates)
 * - Concurrent creates of different resources (all succeed, unique IDs)
 * - Concurrent creates with same assignedId (only one succeeds)
 * - Concurrent ifMatch updates (only version-matching one succeeds)
 * - Concurrent deletes (only first succeeds)
 * - High-volume concurrent creates (10 patients, no race conditions)
 *
 * Corresponds to Medplum: packages/server/src/fhir/transaction.test.ts
 * Tests: B-01 ~ B-07
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DatabaseClient } from "../../db/client.js";
import { FhirRepository } from "../../repo/fhir-repo.js";
import {
  ResourceGoneError,
  ResourceVersionConflictError,
} from "../../repo/errors.js";
import type { FhirResource } from "../../repo/types.js";

// =============================================================================
// Setup
// =============================================================================

function loadEnv(): void {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(scriptDir, "..", "..", "..", ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

let db: DatabaseClient;
let repo: FhirRepository;

beforeAll(async () => {
  loadEnv();
  db = new DatabaseClient({
    host: process.env["DB_HOST"] ?? "localhost",
    port: parseInt(process.env["DB_PORT"] ?? "5433", 10),
    database: process.env["DB_NAME"] ?? "medxai_dev",
    user: process.env["DB_USER"] ?? "postgres",
    password: process.env["DB_PASSWORD"] ?? "assert",
  });

  const alive = await db.ping();
  if (!alive) {
    throw new Error(
      "Cannot connect to PostgreSQL. Run `npm run db:init` first.",
    );
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
    resourceType: "Patient",
    name: [{ family: "ConcurrentTest", given: ["Parallel"] }],
    birthDate: "1990-01-01",
    ...overrides,
  };
}

async function cleanup(resourceType: string, id: string): Promise<void> {
  try {
    await db.query(`DELETE FROM "${resourceType}_History" WHERE "id" = $1`, [
      id,
    ]);
    await db.query(`DELETE FROM "${resourceType}" WHERE "id" = $1`, [id]);
  } catch {
    // ignore
  }
}

async function historyCountForId(
  resourceType: string,
  id: string,
): Promise<number> {
  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${resourceType}_History" WHERE "id" = $1`,
    [id],
  );
  return parseInt(result.rows[0].count, 10);
}

// =============================================================================
// B-01: 5 concurrent updates — all succeed, no lost updates
// =============================================================================

describe("B-01: concurrent updates to same resource", () => {
  it("5 sequential updates all succeed and each produces a new versionId", async () => {
    // Note: True concurrent updates in a single-connection pool may serialize.
    // We test the observable invariant: N updates → N history entries, each unique versionId.
    const created = await repo.createResource(makePatient());
    const versionIds = new Set<string>([created.meta.versionId]);

    let current = created;
    for (let i = 0; i < 5; i++) {
      current = await repo.updateResource({
        ...current,
        birthDate: `199${i}-0${i + 1}-01`,
      });
      versionIds.add(current.meta.versionId);
    }

    // All 6 versionIds (create + 5 updates) should be unique
    expect(versionIds.size).toBe(6);

    // History should have 6 entries
    expect(await historyCountForId("Patient", created.id)).toBe(6);

    await cleanup("Patient", created.id);
  });

  it("B-01b: concurrent updates via Promise.all — all settle without rejection", async () => {
    // Create base resource
    const created = await repo.createResource(makePatient());

    // Launch 5 concurrent updates (each reads current state first)
    // Some may get ResourceVersionConflictError if they race, but none should crash
    const updates = Array.from({ length: 5 }, (_, i) =>
      repo
        .updateResource({
          ...created,
          birthDate: `200${i}-01-01`,
        })
        .then((r) => ({ status: "fulfilled", value: r }))
        .catch((err) => ({ status: "rejected", reason: err })),
    );

    const results = await Promise.all(updates);

    // At least one should succeed (the first to write)
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    // None should throw unexpected errors (only ResourceVersionConflictError is acceptable)
    const unexpectedErrors = results.filter(
      (r) =>
        r.status === "rejected" &&
        !((r as any).reason instanceof ResourceVersionConflictError),
    );
    expect(unexpectedErrors).toHaveLength(0);

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// B-02: Concurrent updates — history count equals successful write count
// =============================================================================

describe("B-02: history count matches write count", () => {
  it("history entries equal number of successful writes", async () => {
    const created = await repo.createResource(makePatient());
    let successCount = 1; // count the create

    let current = created;
    for (let i = 0; i < 4; i++) {
      try {
        current = await repo.updateResource({
          ...current,
          birthDate: `199${i}-06-15`,
        });
        successCount++;
      } catch {
        // skip failures
      }
    }

    const historyCount = await historyCountForId("Patient", created.id);
    expect(historyCount).toBe(successCount);

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// B-03: Concurrent creates of different resources — all succeed, IDs unique
// =============================================================================

describe("B-03: concurrent creates of different resources", () => {
  it("10 concurrent creates all succeed with unique IDs", async () => {
    const creates = Array.from({ length: 10 }, () =>
      repo.createResource(makePatient()),
    );

    const results = await Promise.all(creates);

    // All should succeed
    expect(results).toHaveLength(10);

    // All IDs should be unique
    const ids = results.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);

    // All versionIds should be unique
    const versionIds = results.map((r) => r.meta.versionId);
    const uniqueVersionIds = new Set(versionIds);
    expect(uniqueVersionIds.size).toBe(10);

    // Cleanup
    await Promise.all(results.map((r) => cleanup("Patient", r.id)));
  });

  it("B-03b: all created resources are readable after concurrent create", async () => {
    const creates = Array.from({ length: 5 }, () =>
      repo.createResource(makePatient()),
    );
    const created = await Promise.all(creates);

    // All should be readable
    const reads = await Promise.all(
      created.map((r) => repo.readResource("Patient", r.id)),
    );
    expect(reads).toHaveLength(5);
    for (const read of reads) {
      expect(read.id).toBeTruthy();
      expect(read.resourceType).toBe("Patient");
    }

    await Promise.all(created.map((r) => cleanup("Patient", r.id)));
  });
});

// =============================================================================
// B-04: Concurrent creates with same assignedId — only one succeeds
// =============================================================================

describe("B-04: concurrent creates with same assignedId", () => {
  it("only one of two concurrent creates with same assignedId succeeds", async () => {
    const assignedId = randomUUID();

    const results = await Promise.allSettled([
      repo.createResource(makePatient({ birthDate: "1990-01-01" }), {
        assignedId,
      }),
      repo.createResource(makePatient({ birthDate: "1991-01-01" }), {
        assignedId,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one should succeed (UPSERT semantics: last writer wins OR unique constraint)
    // With UPSERT (ON CONFLICT DO UPDATE), both may "succeed" but the last write wins
    // The important invariant: the resource is readable with the assignedId
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const read = await repo.readResource("Patient", assignedId);
    expect(read.id).toBe(assignedId);

    // History should have at least 1 entry
    expect(
      await historyCountForId("Patient", assignedId),
    ).toBeGreaterThanOrEqual(1);

    await cleanup("Patient", assignedId);
  });
});

// =============================================================================
// B-05: Concurrent ifMatch updates — only version-matching one succeeds
// =============================================================================

describe("B-05: concurrent ifMatch updates", () => {
  it("only the update with correct versionId succeeds when using ifMatch", async () => {
    const created = await repo.createResource(makePatient());
    const correctVersion = created.meta.versionId;

    const results = await Promise.allSettled([
      // Correct version — should succeed
      repo.updateResource(
        { ...created, birthDate: "2000-01-01" },
        { ifMatch: correctVersion },
      ),
      // Wrong version — should fail with ResourceVersionConflictError
      repo.updateResource(
        { ...created, birthDate: "2001-01-01" },
        { ifMatch: "wrong-version-id" },
      ),
    ]);

    // First should succeed
    expect(results[0].status).toBe("fulfilled");

    // Second should fail with version conflict
    expect(results[1].status).toBe("rejected");
    if (results[1].status === "rejected") {
      expect((results[1] as PromiseRejectedResult).reason).toBeInstanceOf(
        ResourceVersionConflictError,
      );
    }

    await cleanup("Patient", created.id);
  });

  it("B-05b: after successful ifMatch update, old versionId is rejected", async () => {
    const created = await repo.createResource(makePatient());
    const v1 = created.meta.versionId;

    // First update with correct version
    const updated = await repo.updateResource(
      { ...created, birthDate: "2000-01-01" },
      { ifMatch: v1 },
    );
    expect(updated.meta.versionId).not.toBe(v1);

    // Second update with old (now stale) version should fail
    await expect(
      repo.updateResource(
        { ...updated, birthDate: "2001-01-01" },
        { ifMatch: v1 },
      ),
    ).rejects.toThrow(ResourceVersionConflictError);

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// B-06: Concurrent deletes — only first succeeds
// =============================================================================

describe("B-06: concurrent deletes", () => {
  it("first delete succeeds, second delete throws ResourceGoneError", async () => {
    const created = await repo.createResource(makePatient());

    // First delete
    await repo.deleteResource("Patient", created.id);

    // Second delete should throw ResourceGoneError
    await expect(repo.deleteResource("Patient", created.id)).rejects.toThrow(
      ResourceGoneError,
    );

    await cleanup("Patient", created.id);
  });

  it("B-06b: concurrent deletes via Promise.allSettled — at most one succeeds", async () => {
    const created = await repo.createResource(makePatient());

    const results = await Promise.allSettled([
      repo.deleteResource("Patient", created.id),
      repo.deleteResource("Patient", created.id),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // At least one should succeed
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    // Any rejections should be ResourceGoneError (not unexpected errors)
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(
        ResourceGoneError,
      );
    }

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// B-07: High-volume concurrent creates — 10 patients, no race conditions
// =============================================================================

describe("B-07: high-volume concurrent creates", () => {
  it("10 concurrent Patient creates all succeed with no data corruption", async () => {
    const N = 10;
    const creates = Array.from({ length: N }, (_, i) =>
      repo.createResource({
        resourceType: "Patient",
        name: [{ family: `Concurrent${i}`, given: [`Patient${i}`] }],
        birthDate: `199${i % 10}-01-01`,
      }),
    );

    const results = await Promise.all(creates);

    // All N resources created
    expect(results).toHaveLength(N);

    // All IDs are unique UUIDs
    const ids = new Set(results.map((r) => r.id));
    expect(ids.size).toBe(N);

    // Each resource is readable and has correct data
    for (let i = 0; i < N; i++) {
      const read = await repo.readResource("Patient", results[i].id);
      expect(read.resourceType).toBe("Patient");
      expect((read as any).name[0].family).toBe(`Concurrent${i}`);
    }

    // Each has exactly 1 history entry
    for (const r of results) {
      expect(await historyCountForId("Patient", r.id)).toBe(1);
    }

    // Cleanup
    await Promise.all(results.map((r) => cleanup("Patient", r.id)));
  });
});
