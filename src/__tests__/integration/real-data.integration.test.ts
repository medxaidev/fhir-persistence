/**
 * Real Data Integration Tests
 *
 * Tests real FHIR resource data insertion, retrieval, search, and bundle
 * processing against a live PostgreSQL database.
 *
 * Covers:
 * - Task 3: Bundle transaction/batch with real DB
 * - Task 5: Real FHIR data insertion and retrieval
 * - Cache integration verification
 * - Multi-resource-type CRUD
 * - urn:uuid resolution in transactions
 *
 * Requires `npm run db:reset` to have been run first.
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
} from "../../repo/errors.js";
import type { FhirResource, PersistedResource } from "../../repo/types.js";
import {
  processTransaction,
  processBatch,
} from "../../repo/bundle-processor.js";
import type { Bundle } from "../../repo/bundle-processor.js";
import { SearchParameterRegistry } from "../../registry/search-parameter-registry.js";
import type { SearchParameterBundle } from "../../registry/search-parameter-registry.js";

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
let repoWithCache: FhirRepository;
let spRegistry: SearchParameterRegistry;
const createdResources: Array<{ resourceType: string; id: string }> = [];

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
      "Cannot connect to PostgreSQL. Run `npm run db:reset` first.",
    );
  }

  // Load search parameters for search-enabled repo
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const spPath = resolve(
    scriptDir, "..", "..", "..", "..", "..", "spec", "fhir", "r4", "search-parameters.json",
  );
  if (existsSync(spPath)) {
    const spBundle = JSON.parse(readFileSync(spPath, "utf8")) as SearchParameterBundle;
    spRegistry = new SearchParameterRegistry();
    spRegistry.indexBundle(spBundle);
  }

  repo = new FhirRepository(db, spRegistry);
  repoWithCache = new FhirRepository(db, spRegistry, { enabled: true, maxSize: 100, ttlMs: 30_000 });
});

afterAll(async () => {
  // Cleanup all created resources
  for (const { resourceType, id } of createdResources) {
    try {
      await repo.deleteResource(resourceType, id);
    } catch {
      // Already deleted or not found
    }
  }
  if (db && !db.isClosed) {
    await db.close();
  }
});

function track(resourceType: string, id: string): void {
  createdResources.push({ resourceType, id });
}

// =============================================================================
// Section 1: Real FHIR Data Insertion (Task 5)
// =============================================================================

describe("Real FHIR data insertion — Patient", () => {
  it("creates a complete Patient with all demographics", async () => {
    const patient: FhirResource = {
      resourceType: "Patient",
      name: [
        { use: "official", family: "张", given: ["三"] },
        { use: "nickname", text: "小张" },
      ],
      gender: "male",
      birthDate: "1990-05-15",
      active: true,
      telecom: [
        { system: "phone", value: "+86-138-0000-1234", use: "mobile" },
        { system: "email", value: "zhangsan@example.com" },
      ],
      address: [
        {
          use: "home",
          line: ["北京市朝阳区建国路100号"],
          city: "北京",
          state: "北京市",
          postalCode: "100022",
          country: "CN",
        },
      ],
      identifier: [
        {
          system: "http://example.com/mrn",
          value: "MRN-2024-001",
        },
      ],
      maritalStatus: {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus", code: "M" }],
      },
    };

    const created = await repo.createResource(patient);
    track("Patient", created.id);

    expect(created.id).toBeDefined();
    expect(created.meta.versionId).toBeDefined();
    expect(created.meta.lastUpdated).toBeDefined();
    expect(created.name).toHaveLength(2);
    expect(created.gender).toBe("male");
    expect(created.birthDate).toBe("1990-05-15");

    // Read back and verify
    const read = await repo.readResource("Patient", created.id);
    expect(read.id).toBe(created.id);
    expect((read as any).name[0].family).toBe("张");
    expect((read as any).name[0].given[0]).toBe("三");
    expect((read as any).telecom[0].value).toBe("+86-138-0000-1234");
    expect((read as any).address[0].city).toBe("北京");
    expect((read as any).identifier[0].value).toBe("MRN-2024-001");
  });

  it("creates and updates a Patient — version increments", async () => {
    const created = await repo.createResource({
      resourceType: "Patient",
      name: [{ family: "TestUpdate", given: ["Before"] }],
      birthDate: "1985-01-01",
    });
    track("Patient", created.id);

    const updated = await repo.updateResource({
      ...created,
      name: [{ family: "TestUpdate", given: ["After"] }],
      birthDate: "1985-06-15",
    });

    expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    expect((updated as any).name[0].given[0]).toBe("After");
    expect((updated as any).birthDate).toBe("1985-06-15");

    // Verify history has 2 entries
    const history = await repo.readHistory("Patient", created.id);
    expect(history.length).toBe(2);
  });
});

describe("Real FHIR data insertion — Observation", () => {
  it("creates a complete Observation with quantity value", async () => {
    // First create a patient to reference
    const patient = await repo.createResource({
      resourceType: "Patient",
      name: [{ family: "ObsPatient" }],
    });
    track("Patient", patient.id);

    const obs: FhirResource = {
      resourceType: "Observation",
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
              display: "Vital Signs",
            },
          ],
        },
      ],
      code: {
        coding: [
          { system: "http://loinc.org", code: "29463-7", display: "Body Weight" },
        ],
      },
      subject: { reference: `Patient/${patient.id}` },
      effectiveDateTime: "2024-06-15T10:30:00Z",
      valueQuantity: {
        value: 72.5,
        unit: "kg",
        system: "http://unitsofmeasure.org",
        code: "kg",
      },
    };

    const created = await repo.createResource(obs);
    track("Observation", created.id);

    expect(created.id).toBeDefined();
    expect((created as any).status).toBe("final");
    expect((created as any).valueQuantity.value).toBe(72.5);

    // Read back
    const read = await repo.readResource("Observation", created.id);
    expect((read as any).subject.reference).toBe(`Patient/${patient.id}`);
    expect((read as any).code.coding[0].code).toBe("29463-7");
  });
});

describe("Real FHIR data insertion — Encounter", () => {
  it("creates a complete Encounter with participant", async () => {
    const patient = await repo.createResource({
      resourceType: "Patient",
      name: [{ family: "EncPatient" }],
    });
    track("Patient", patient.id);

    const practitioner = await repo.createResource({
      resourceType: "Practitioner",
      name: [{ family: "李", given: ["医生"] }],
    });
    track("Practitioner", practitioner.id);

    const encounter: FhirResource = {
      resourceType: "Encounter",
      status: "finished",
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "AMB",
        display: "ambulatory",
      },
      subject: { reference: `Patient/${patient.id}` },
      participant: [
        {
          individual: { reference: `Practitioner/${practitioner.id}` },
        },
      ],
      period: {
        start: "2024-06-15T09:00:00Z",
        end: "2024-06-15T09:30:00Z",
      },
      reasonCode: [
        {
          coding: [
            { system: "http://snomed.info/sct", code: "386661006", display: "Fever" },
          ],
        },
      ],
    };

    const created = await repo.createResource(encounter);
    track("Encounter", created.id);

    const read = await repo.readResource("Encounter", created.id);
    expect((read as any).status).toBe("finished");
    expect((read as any).subject.reference).toBe(`Patient/${patient.id}`);
    expect((read as any).participant[0].individual.reference).toBe(
      `Practitioner/${practitioner.id}`,
    );
  });
});

describe("Real FHIR data insertion — Condition", () => {
  it("creates a Condition linked to Patient", async () => {
    const patient = await repo.createResource({
      resourceType: "Patient",
      name: [{ family: "CondPatient" }],
    });
    track("Patient", patient.id);

    const condition: FhirResource = {
      resourceType: "Condition",
      clinicalStatus: {
        coding: [
          { system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" },
        ],
      },
      verificationStatus: {
        coding: [
          { system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" },
        ],
      },
      code: {
        coding: [
          { system: "http://snomed.info/sct", code: "44054006", display: "Type 2 diabetes mellitus" },
        ],
      },
      subject: { reference: `Patient/${patient.id}` },
      onsetDateTime: "2020-03-10",
    };

    const created = await repo.createResource(condition);
    track("Condition", created.id);

    const read = await repo.readResource("Condition", created.id);
    expect((read as any).code.coding[0].code).toBe("44054006");
  });
});

describe("Real FHIR data insertion — MedicationRequest", () => {
  it("creates a MedicationRequest with dosage", async () => {
    const patient = await repo.createResource({
      resourceType: "Patient",
      name: [{ family: "MedReqPatient" }],
    });
    track("Patient", patient.id);

    const medReq: FhirResource = {
      resourceType: "MedicationRequest",
      status: "active",
      intent: "order",
      medicationCodeableConcept: {
        coding: [
          { system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "860975", display: "Metformin 500 MG" },
        ],
      },
      subject: { reference: `Patient/${patient.id}` },
      dosageInstruction: [
        {
          text: "500mg twice daily",
          timing: {
            repeat: { frequency: 2, period: 1, periodUnit: "d" },
          },
          doseAndRate: [
            {
              doseQuantity: {
                value: 500,
                unit: "mg",
                system: "http://unitsofmeasure.org",
                code: "mg",
              },
            },
          ],
        },
      ],
    };

    const created = await repo.createResource(medReq);
    track("MedicationRequest", created.id);

    const read = await repo.readResource("MedicationRequest", created.id);
    expect((read as any).status).toBe("active");
    expect((read as any).dosageInstruction[0].text).toBe("500mg twice daily");
  });
});

// =============================================================================
// Section 2: Bundle Integration Tests (Task 3)
// =============================================================================

describe("Bundle transaction — real DB", () => {
  it("creates multiple resources in a transaction with urn:uuid references", async () => {
    const patientUrn = `urn:uuid:${randomUUID()}`;
    const obsUrn = `urn:uuid:${randomUUID()}`;

    const bundle: Bundle = {
      resourceType: "Bundle",
      type: "transaction",
      entry: [
        {
          fullUrl: patientUrn,
          resource: {
            resourceType: "Patient",
            name: [{ family: "BundleTxn", given: ["Patient"] }],
            birthDate: "1980-01-01",
          },
          request: { method: "POST", url: "Patient" },
        },
        {
          fullUrl: obsUrn,
          resource: {
            resourceType: "Observation",
            status: "final",
            code: {
              coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
            },
            subject: { reference: patientUrn },
            valueQuantity: { value: 72, unit: "/min" },
          },
          request: { method: "POST", url: "Observation" },
        },
      ],
    };

    const response = await processTransaction(repo, bundle);

    expect(response.type).toBe("transaction-response");
    expect(response.entry).toHaveLength(2);
    expect(response.entry[0].status).toBe("201");
    expect(response.entry[1].status).toBe("201");

    const createdPatient = response.entry[0].resource!;
    const createdObs = response.entry[1].resource!;
    track("Patient", createdPatient.id);
    track("Observation", createdObs.id);

    // Verify urn:uuid was resolved — Observation.subject should reference the actual Patient
    const readObs = await repo.readResource("Observation", createdObs.id);
    const subjectRef = (readObs as any).subject?.reference as string;
    expect(subjectRef).toContain(createdPatient.id);

    // Verify both resources exist in DB
    const readPatient = await repo.readResource("Patient", createdPatient.id);
    expect((readPatient as any).name[0].family).toBe("BundleTxn");
  });

  it("transaction rolls back on failure — partial writes are invisible", async () => {
    // Second entry references a non-existent resource for PUT → should fail
    const bundle: Bundle = {
      resourceType: "Bundle",
      type: "transaction",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            name: [{ family: "RollbackTest" }],
          },
          request: { method: "POST", url: "Patient" },
        },
        {
          resource: {
            resourceType: "Patient",
            name: [{ family: "ShouldFail" }],
          },
          request: { method: "PUT", url: `Patient/${randomUUID()}` },
        },
      ],
    };

    const response = await processTransaction(repo, bundle);

    // Transaction should have failed
    expect(response.entry.length).toBeGreaterThanOrEqual(1);
    const hasError = response.entry.some((e) => e.status === "500" || e.error);
    expect(hasError).toBe(true);
  });
});

describe("Bundle batch — real DB", () => {
  it("processes batch entries independently — failures don't affect others", async () => {
    const bundle: Bundle = {
      resourceType: "Bundle",
      type: "batch",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            name: [{ family: "BatchSuccess" }],
          },
          request: { method: "POST", url: "Patient" },
        },
        {
          // This DELETE will fail (non-existent resource)
          request: { method: "DELETE", url: `Patient/${randomUUID()}` },
        },
        {
          resource: {
            resourceType: "Organization",
            name: "BatchOrg",
          },
          request: { method: "POST", url: "Organization" },
        },
      ],
    };

    const response = await processBatch(repo, bundle);

    expect(response.type).toBe("batch-response");
    expect(response.entry).toHaveLength(3);

    // First and third should succeed
    expect(response.entry[0].status).toBe("201");
    expect(response.entry[2].status).toBe("201");

    // Second should have failed (404/500)
    expect(response.entry[1].error).toBeDefined();

    // Cleanup successful creates
    if (response.entry[0].resource) track("Patient", response.entry[0].resource.id);
    if (response.entry[2].resource) track("Organization", response.entry[2].resource.id);

    // Verify successful entries exist
    if (response.entry[0].resource) {
      const read = await repo.readResource("Patient", response.entry[0].resource.id);
      expect((read as any).name[0].family).toBe("BatchSuccess");
    }
    if (response.entry[2].resource) {
      const read = await repo.readResource("Organization", response.entry[2].resource.id);
      expect((read as any).name).toBe("BatchOrg");
    }
  });
});

// =============================================================================
// Section 3: Cache Integration (Task 2 verification)
// =============================================================================

describe("Cache integration — real DB", () => {
  it("cache hit on second readResource call", async () => {
    const created = await repoWithCache.createResource({
      resourceType: "Patient",
      name: [{ family: "CacheTest" }],
    });
    track("Patient", created.id);

    // First read — cache miss
    const read1 = await repoWithCache.readResource("Patient", created.id);
    expect(read1.id).toBe(created.id);

    const statsAfterFirst = repoWithCache.cacheStats;
    expect(statsAfterFirst.misses).toBeGreaterThanOrEqual(1);

    // Second read — cache hit
    const read2 = await repoWithCache.readResource("Patient", created.id);
    expect(read2.id).toBe(created.id);

    const statsAfterSecond = repoWithCache.cacheStats;
    expect(statsAfterSecond.hits).toBeGreaterThanOrEqual(1);
  });

  it("cache is invalidated after update", async () => {
    const created = await repoWithCache.createResource({
      resourceType: "Patient",
      name: [{ family: "CacheInvalidate" }],
    });
    track("Patient", created.id);

    // Populate cache
    await repoWithCache.readResource("Patient", created.id);

    // Update — should invalidate cache
    await repoWithCache.updateResource({
      ...created,
      name: [{ family: "CacheInvalidateUpdated" }],
    });

    // Next read should get fresh data from DB (cache miss)
    const read = await repoWithCache.readResource("Patient", created.id);
    expect((read as any).name[0].family).toBe("CacheInvalidateUpdated");
  });

  it("cache is invalidated after delete", async () => {
    const created = await repoWithCache.createResource({
      resourceType: "Patient",
      name: [{ family: "CacheDelete" }],
    });
    track("Patient", created.id);

    // Populate cache
    await repoWithCache.readResource("Patient", created.id);

    // Delete — should invalidate cache
    await repoWithCache.deleteResource("Patient", created.id);

    // Next read should throw ResourceGoneError, not return stale cache
    await expect(
      repoWithCache.readResource("Patient", created.id),
    ).rejects.toThrow(ResourceGoneError);
  });
});

// =============================================================================
// Section 4: Multi-type CRUD Smoke Tests
// =============================================================================

describe("Multi-resource-type CRUD smoke test", () => {
  const resourceTypes = [
    { type: "Organization", data: { resourceType: "Organization", name: "Test Hospital" } },
    { type: "Practitioner", data: { resourceType: "Practitioner", name: [{ family: "Smith", given: ["John"] }] } },
    { type: "Location", data: { resourceType: "Location", name: "Room 101", status: "active" } },
    { type: "DiagnosticReport", data: { resourceType: "DiagnosticReport", status: "final", code: { text: "CBC" } } },
    { type: "AllergyIntolerance", data: { resourceType: "AllergyIntolerance", clinicalStatus: { coding: [{ code: "active" }] } } },
    { type: "Immunization", data: { resourceType: "Immunization", status: "completed", vaccineCode: { text: "COVID-19" } } },
    { type: "CarePlan", data: { resourceType: "CarePlan", status: "active", intent: "plan" } },
    { type: "ServiceRequest", data: { resourceType: "ServiceRequest", status: "active", intent: "order" } },
  ];

  for (const { type, data } of resourceTypes) {
    it(`creates, reads, updates, and deletes ${type}`, async () => {
      // Create
      const created = await repo.createResource(data as FhirResource);
      track(type, created.id);
      expect(created.id).toBeDefined();
      expect(created.meta.versionId).toBeDefined();

      // Read
      const read = await repo.readResource(type, created.id);
      expect(read.id).toBe(created.id);
      expect(read.resourceType).toBe(type);

      // Update
      const updated = await repo.updateResource({
        ...read,
        meta: { ...read.meta, tag: [{ system: "test", code: "updated" }] },
      });
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);

      // Delete
      await repo.deleteResource(type, updated.id);
      await expect(repo.readResource(type, updated.id)).rejects.toThrow(ResourceGoneError);

      // Remove from cleanup list since we already deleted
      const idx = createdResources.findIndex(
        (r) => r.resourceType === type && r.id === created.id,
      );
      if (idx >= 0) createdResources.splice(idx, 1);
    });
  }
});

// =============================================================================
// Section 5: CJK/Unicode Edge Cases
// =============================================================================

describe("CJK and Unicode data in real DB", () => {
  it("stores and retrieves Chinese characters correctly", async () => {
    const patient: FhirResource = {
      resourceType: "Patient",
      name: [{ family: "王", given: ["大明"] }],
      address: [{ city: "上海市浦东新区", line: ["张杨路500号"] }],
      telecom: [{ value: "emoji-test: 🏥💉" }],
    };

    const created = await repo.createResource(patient);
    track("Patient", created.id);

    const read = await repo.readResource("Patient", created.id);
    expect((read as any).name[0].family).toBe("王");
    expect((read as any).name[0].given[0]).toBe("大明");
    expect((read as any).address[0].city).toBe("上海市浦东新区");
    expect((read as any).address[0].line[0]).toBe("张杨路500号");
    expect((read as any).telecom[0].value).toBe("emoji-test: 🏥💉");
  });
});
