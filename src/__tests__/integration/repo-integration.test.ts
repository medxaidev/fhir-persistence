/**
 * Repository Integration Tests — Real PostgreSQL
 *
 * These tests run against the local PostgreSQL database (medxai_dev).
 * Requires `npm run db:init` to have been run first.
 *
 * Each test uses unique resource IDs to avoid cross-test interference.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DatabaseClient } from "../../db/client.js";
import { FhirRepository } from "../../repo/fhir-repo.js";
import {
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from "../../repo/errors.js";
import type { FhirResource } from "../../repo/types.js";

// =============================================================================
// Setup
// =============================================================================

// Load .env for DB config
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
    host: process.env["DB_HOST"] ?? "localhost",
    port: parseInt(process.env["DB_PORT"] ?? "5433", 10),
    database: process.env["DB_NAME"] ?? "medxai_dev",
    user: process.env["DB_USER"] ?? "postgres",
    password: process.env["DB_PASSWORD"] ?? "assert",
  });

  // Verify connection
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
    name: [{ family: "TestFamily", given: ["TestGiven"] }],
    birthDate: "1990-01-15",
    gender: "male",
    ...overrides,
  };
}

function makeObservation(overrides?: Partial<FhirResource>): FhirResource {
  return {
    resourceType: "Observation",
    status: "final",
    code: {
      coding: [
        { system: "http://loinc.org", code: "29463-7", display: "Body Weight" },
      ],
    },
    valueQuantity: { value: 70, unit: "kg" },
    ...overrides,
  };
}

// Clean up a resource after test (best effort)
async function cleanup(resourceType: string, id: string): Promise<void> {
  try {
    await db.query(`DELETE FROM "${resourceType}_History" WHERE "id" = $1`, [
      id,
    ]);
    await db.query(`DELETE FROM "${resourceType}" WHERE "id" = $1`, [id]);
  } catch {
    // ignore cleanup errors
  }
}

// =============================================================================
// Create
// =============================================================================

describe("createResource", () => {
  it("creates a Patient with auto-generated id and versionId", async () => {
    const patient = makePatient();
    const result = await repo.createResource(patient);

    expect(result.id).toBeTruthy();
    expect(result.meta.versionId).toBeTruthy();
    expect(result.meta.lastUpdated).toBeTruthy();
    expect(result.resourceType).toBe("Patient");
    expect(result.name).toEqual([
      { family: "TestFamily", given: ["TestGiven"] },
    ]);

    // Verify UUID format
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(result.meta.versionId).toMatch(/^[0-9a-f]{8}-/);

    await cleanup("Patient", result.id);
  });

  it("creates a Patient with assignedId", async () => {
    const assignedId = randomUUID();
    const patient = makePatient();
    const result = await repo.createResource(patient, { assignedId });

    expect(result.id).toBe(assignedId);

    await cleanup("Patient", assignedId);
  });

  it("creates an Observation resource", async () => {
    const obs = makeObservation();
    const result = await repo.createResource(obs);

    expect(result.resourceType).toBe("Observation");
    expect(result.id).toBeTruthy();
    expect(result.meta.versionId).toBeTruthy();

    await cleanup("Observation", result.id);
  });

  it("writes a history entry on create", async () => {
    const patient = makePatient();
    const result = await repo.createResource(patient);

    const history = await repo.readHistory("Patient", result.id);
    expect(history).toHaveLength(1);
    expect(history[0].versionId).toBe(result.meta.versionId);

    await cleanup("Patient", result.id);
  });
});

// =============================================================================
// Read
// =============================================================================

describe("readResource", () => {
  it("reads a created Patient by id", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    const read = await repo.readResource("Patient", created.id);
    expect(read.id).toBe(created.id);
    expect(read.resourceType).toBe("Patient");
    expect(read.meta.versionId).toBe(created.meta.versionId);
    expect((read as any).name[0].family).toBe("TestFamily");

    await cleanup("Patient", created.id);
  });

  it("throws ResourceNotFoundError for non-existent id", async () => {
    const fakeId = randomUUID();
    await expect(repo.readResource("Patient", fakeId)).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it("throws ResourceGoneError for deleted resource", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);
    await repo.deleteResource("Patient", created.id);

    await expect(repo.readResource("Patient", created.id)).rejects.toThrow(
      ResourceGoneError,
    );

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// Update
// =============================================================================

describe("updateResource", () => {
  it("updates a Patient and generates new versionId", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    const updated = await repo.updateResource({
      ...created,
      birthDate: "1991-06-15",
    });

    expect(updated.id).toBe(created.id);
    expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    expect((updated as any).birthDate).toBe("1991-06-15");

    await cleanup("Patient", created.id);
  });

  it("writes a new history entry on update", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    await repo.updateResource({
      ...created,
      birthDate: "1991-06-15",
    });

    const history = await repo.readHistory("Patient", created.id);
    expect(history).toHaveLength(2);
    // Newest first
    expect((history[0].resource as any).birthDate).toBe("1991-06-15");
    expect((history[1].resource as any).birthDate).toBe("1990-01-15");

    await cleanup("Patient", created.id);
  });

  it("throws Error when resource has no id", async () => {
    const patient = makePatient();
    await expect(repo.updateResource(patient)).rejects.toThrow(
      "must have an id",
    );
  });

  it("throws ResourceNotFoundError for non-existent resource", async () => {
    const fakeId = randomUUID();
    await expect(
      repo.updateResource({ resourceType: "Patient", id: fakeId }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});

// =============================================================================
// Delete
// =============================================================================

describe("deleteResource", () => {
  it("soft-deletes a Patient", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    await repo.deleteResource("Patient", created.id);

    // Read should throw Gone
    await expect(repo.readResource("Patient", created.id)).rejects.toThrow(
      ResourceGoneError,
    );

    await cleanup("Patient", created.id);
  });

  it("writes a delete history entry with empty content", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);
    await repo.deleteResource("Patient", created.id);

    // Raw query to check history
    const result = await db.query<{ content: string; versionId: string }>(
      `SELECT "content", "versionId" FROM "Patient_History" WHERE "id" = $1 ORDER BY "lastUpdated" DESC`,
      [created.id],
    );

    expect(result.rows.length).toBeGreaterThanOrEqual(2);
    // Newest entry should have empty content (delete marker)
    expect(result.rows[0].content).toBe("");

    await cleanup("Patient", created.id);
  });

  it("throws ResourceNotFoundError for non-existent resource", async () => {
    const fakeId = randomUUID();
    await expect(repo.deleteResource("Patient", fakeId)).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it("throws ResourceGoneError for already-deleted resource", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);
    await repo.deleteResource("Patient", created.id);

    await expect(repo.deleteResource("Patient", created.id)).rejects.toThrow(
      ResourceGoneError,
    );

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// Optimistic Locking
// =============================================================================

describe("optimistic locking (ifMatch)", () => {
  it("succeeds when ifMatch matches current versionId", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    const updated = await repo.updateResource(
      { ...created, birthDate: "2000-01-01" },
      { ifMatch: created.meta.versionId },
    );

    expect(updated.meta.versionId).not.toBe(created.meta.versionId);

    await cleanup("Patient", created.id);
  });

  it("throws ResourceVersionConflictError when ifMatch does not match", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    await expect(
      repo.updateResource(
        { ...created, birthDate: "2000-01-01" },
        { ifMatch: "wrong-version-id" },
      ),
    ).rejects.toThrow(ResourceVersionConflictError);

    await cleanup("Patient", created.id);
  });

  it("conflict error contains expected and actual versions", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    try {
      await repo.updateResource(
        { ...created, birthDate: "2000-01-01" },
        { ifMatch: "wrong-version" },
      );
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ResourceVersionConflictError);
      const conflict = err as ResourceVersionConflictError;
      expect(conflict.expectedVersion).toBe("wrong-version");
      expect(conflict.actualVersion).toBe(created.meta.versionId);
    }

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// History
// =============================================================================

describe("readHistory", () => {
  it("returns all versions newest first", async () => {
    const patient = makePatient();
    const v1 = await repo.createResource(patient);
    const v2 = await repo.updateResource({ ...v1, birthDate: "1991-01-01" });
    const v3 = await repo.updateResource({ ...v2, birthDate: "1992-01-01" });

    const history = await repo.readHistory("Patient", v1.id);
    expect(history).toHaveLength(3);
    expect(history[0].versionId).toBe(v3.meta.versionId);
    expect(history[1].versionId).toBe(v2.meta.versionId);
    expect(history[2].versionId).toBe(v1.meta.versionId);

    await cleanup("Patient", v1.id);
  });

  it("includes delete entries as deleted=true", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);
    await repo.deleteResource("Patient", created.id);

    const history = await repo.readHistory("Patient", created.id);
    // Should include both the create version and the delete marker
    expect(history).toHaveLength(2);
    expect(history[0].deleted).toBe(true);
    expect(history[0].resource).toBeNull();
    expect(history[1].deleted).toBe(false);
    expect(history[1].resource).not.toBeNull();

    await cleanup("Patient", created.id);
  });

  it("returns empty array for non-existent resource", async () => {
    const history = await repo.readHistory("Patient", randomUUID());
    expect(history).toEqual([]);
  });
});

// =============================================================================
// readVersion
// =============================================================================

describe("readVersion", () => {
  it("reads a specific version by versionId", async () => {
    const patient = makePatient();
    const v1 = await repo.createResource(patient);
    const v2 = await repo.updateResource({ ...v1, birthDate: "1991-01-01" });

    const readV1 = await repo.readVersion("Patient", v1.id, v1.meta.versionId);
    expect((readV1 as any).birthDate).toBe("1990-01-15");

    const readV2 = await repo.readVersion("Patient", v1.id, v2.meta.versionId);
    expect((readV2 as any).birthDate).toBe("1991-01-01");

    await cleanup("Patient", v1.id);
  });

  it("throws ResourceNotFoundError for non-existent versionId", async () => {
    const patient = makePatient();
    const created = await repo.createResource(patient);

    // Use a valid UUID format that doesn't exist in the DB
    const fakeVersionId = randomUUID();
    await expect(
      repo.readVersion("Patient", created.id, fakeVersionId),
    ).rejects.toThrow(ResourceNotFoundError);

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// Multiple Resource Types
// =============================================================================

describe("multiple resource types", () => {
  it("creates and reads different resource types independently", async () => {
    const patient = await repo.createResource(makePatient());
    const obs = await repo.createResource(makeObservation());

    const readPatient = await repo.readResource("Patient", patient.id);
    const readObs = await repo.readResource("Observation", obs.id);

    expect(readPatient.resourceType).toBe("Patient");
    expect(readObs.resourceType).toBe("Observation");

    await cleanup("Patient", patient.id);
    await cleanup("Observation", obs.id);
  });
});

// =============================================================================
// Full Lifecycle
// =============================================================================

describe("full lifecycle", () => {
  it("create → read → update → read → delete → verify gone", async () => {
    // Create
    const created = await repo.createResource(makePatient());
    expect(created.id).toBeTruthy();

    // Read
    const read1 = await repo.readResource("Patient", created.id);
    expect(read1.meta.versionId).toBe(created.meta.versionId);

    // Update
    const updated = await repo.updateResource({
      ...read1,
      birthDate: "2000-12-25",
    });
    expect(updated.meta.versionId).not.toBe(created.meta.versionId);

    // Read again
    const read2 = await repo.readResource("Patient", created.id);
    expect((read2 as any).birthDate).toBe("2000-12-25");
    expect(read2.meta.versionId).toBe(updated.meta.versionId);

    // Delete
    await repo.deleteResource("Patient", created.id);

    // Verify gone
    await expect(repo.readResource("Patient", created.id)).rejects.toThrow(
      ResourceGoneError,
    );

    // History should have 3 entries (create + update + delete)
    const history = await repo.readHistory("Patient", created.id);
    expect(history).toHaveLength(3);
    expect(history[0].deleted).toBe(true);

    await cleanup("Patient", created.id);
  });
});

// =============================================================================
// Version Conflict Handling (Category E)
// Corresponds to Medplum: transaction.test.ts — If-Match scenarios
// =============================================================================

describe("version conflict handling (E-01 ~ E-05)", () => {
  it("E-01: 3 sequential updates each produce a distinct versionId", async () => {
    const created = await repo.createResource(makePatient());
    const v1 = created.meta.versionId;

    const u1 = await repo.updateResource({
      ...created,
      birthDate: "1991-01-01",
    });
    const v2 = u1.meta.versionId;

    const u2 = await repo.updateResource({ ...u1, birthDate: "1992-01-01" });
    const v3 = u2.meta.versionId;

    // All three versionIds must be distinct UUIDs
    expect(v1).not.toBe(v2);
    expect(v2).not.toBe(v3);
    expect(v1).not.toBe(v3);

    // History should have 3 entries
    const history = await repo.readHistory("Patient", created.id);
    expect(history).toHaveLength(3);

    await cleanup("Patient", created.id);
  });

  it("E-02: update with stale versionId (already superseded) throws ResourceVersionConflictError", async () => {
    const created = await repo.createResource(makePatient());
    const staleVersionId = created.meta.versionId;

    // Update once — staleVersionId is now outdated
    await repo.updateResource({ ...created, birthDate: "1991-01-01" });

    // Attempt update using the stale versionId
    await expect(
      repo.updateResource(
        { ...created, birthDate: "1992-01-01" },
        { ifMatch: staleVersionId },
      ),
    ).rejects.toThrow(ResourceVersionConflictError);

    await cleanup("Patient", created.id);
  });

  it("E-03: update with correct versionId succeeds and adds history entry", async () => {
    const created = await repo.createResource(makePatient());

    const updated = await repo.updateResource(
      { ...created, birthDate: "1995-05-05" },
      { ifMatch: created.meta.versionId },
    );

    expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    expect((updated as any).birthDate).toBe("1995-05-05");

    const history = await repo.readHistory("Patient", created.id);
    expect(history).toHaveLength(2);

    await cleanup("Patient", created.id);
  });

  it("E-04: update after delete throws ResourceGoneError", async () => {
    const created = await repo.createResource(makePatient());
    await repo.deleteResource("Patient", created.id);

    await expect(
      repo.updateResource({ ...created, birthDate: "1996-01-01" }),
    ).rejects.toThrow(ResourceGoneError);

    await cleanup("Patient", created.id);
  });

  it("E-05: update using a versionId from an older history entry throws ResourceVersionConflictError", async () => {
    const v1 = await repo.createResource(makePatient());
    const oldVersionId = v1.meta.versionId;

    // Two more updates
    const v2 = await repo.updateResource({ ...v1, birthDate: "1991-01-01" });
    await repo.updateResource({ ...v2, birthDate: "1992-01-01" });

    // Attempt to update using the very first versionId (2 versions stale)
    await expect(
      repo.updateResource(
        { ...v1, birthDate: "1993-01-01" },
        { ifMatch: oldVersionId },
      ),
    ).rejects.toThrow(ResourceVersionConflictError);

    await cleanup("Patient", v1.id);
  });
});
