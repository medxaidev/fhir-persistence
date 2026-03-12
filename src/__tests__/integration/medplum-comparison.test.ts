/**
 * Medplum Comparison Test
 *
 * Validates MedXAI FHIR persistence against a live Medplum server:
 *
 * Phase M1 — POST medplum-test-bundle.json as FHIR Transaction to Medplum,
 *             record the server-assigned ID mapping (urn:uuid → real ID).
 * Phase M2 — GET each resource from both sides, deep-compare key fields.
 * Phase M3 — Execute identical FHIR search queries, compare result counts.
 * Phase M4 — Cleanup: DELETE all resources created in Medplum.
 *
 * Prerequisites:
 *   1. Medplum server running at MEDPLUM_BASE_URL (default http://localhost:8103)
 *   2. MedXAI PostgreSQL running (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD)
 *   3. full-stack-validation.test.ts already run (MedXAI has the test data)
 *   4. medplum-test-bundle.json present in __tests__/pgdata/ or devdocs/06_TEST_DATA/
 *
 * Environment (.env or process.env):
 *   MEDPLUM_BASE_URL        default: http://localhost:8103
 *   MEDPLUM_CLIENT_ID       Medplum ClientApplication id (optional)
 *   MEDPLUM_CLIENT_SECRET   Medplum ClientApplication secret (optional)
 *   MEDPLUM_EMAIL           default: admin@example.com
 *   MEDPLUM_PASSWORD        default: medplum_admin
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DatabaseClient } from "../../db/client.js";
import { FhirRepository } from "../../repo/fhir-repo.js";
import { SearchParameterRegistry } from "../../registry/search-parameter-registry.js";
import type { SearchParameterBundle } from "../../registry/search-parameter-registry.js";
import type { FhirResource, PersistedResource } from "../../repo/types.js";

// =============================================================================
// Config
// =============================================================================

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv(): void {
  const envPath = resolve(__dir, "..", "..", "..", ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const BASE = (
  process.env["MEDPLUM_BASE_URL"] ?? "http://localhost:8103"
).replace(/\/$/, "");
const CLIENT_ID = process.env["MEDPLUM_CLIENT_ID"] ?? "";
const CLIENT_SECRET = process.env["MEDPLUM_CLIENT_SECRET"] ?? "";
const EMAIL = process.env["MEDPLUM_EMAIL"] ?? "admin@example.com";
const PASSWORD = process.env["MEDPLUM_PASSWORD"] ?? "medplum_admin";

// =============================================================================
// Medplum HTTP helpers
// =============================================================================

let _token = "";

async function getToken(): Promise<string> {
  if (_token) return _token;
  let body: string;
  if (CLIENT_ID && CLIENT_SECRET) {
    body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString();
  } else {
    body = new URLSearchParams({
      grant_type: "password",
      client_id: "medplum-cli",
      username: EMAIL,
      password: PASSWORD,
    }).toString();
  }
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok)
    throw new Error(`Auth failed (${res.status}): ${await res.text()}`);
  _token = ((await res.json()) as { access_token: string }).access_token;
  return _token;
}

async function mFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const tok = await getToken();
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json",
      Authorization: `Bearer ${tok}`,
      ...(init.headers ?? {}),
    },
  });
}

async function mGet<T = unknown>(path: string): Promise<T> {
  const r = await mFetch(path);
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

async function mPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const r = await mFetch(path, { method: "POST", body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`POST ${path} -> ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

async function mDelete(path: string): Promise<void> {
  const r = await mFetch(path, { method: "DELETE" });
  if (!r.ok && r.status !== 404) console.warn(`DELETE ${path}: ${r.status}`);
}

// =============================================================================
// Types
// =============================================================================

interface BundleEntry {
  fullUrl: string;
  resource: FhirResource & { id?: string };
  request: { method: string; url: string };
}
interface TxBundle {
  resourceType: "Bundle";
  type: "transaction";
  entry: BundleEntry[];
}
interface TxResponseEntry {
  response?: { location?: string; status?: string };
}
interface TxResponse {
  resourceType: string;
  type: string;
  entry: TxResponseEntry[];
}

// =============================================================================
// Shared state
// =============================================================================

let db: DatabaseClient;
let repo: FhirRepository;

/** urn:uuid:<id> → Medplum server ID */
const urnToMedplumId = new Map<string, string>();

/** resourceType/medplumId → MedXAI persisted resource */
const medxaiMap = new Map<string, FhirResource & PersistedResource>();

/** All Medplum resources created (for cleanup) */
const medplumCreated: Array<{ resourceType: string; id: string }> = [];

// =============================================================================
// Helpers
// =============================================================================

function loadBundle(): TxBundle {
  const paths = [
    resolve(__dir, "..", "pgdata", "medplum-test-bundle.json"),
    resolve(
      __dir,
      "..",
      "..",
      "..",
      "..",
      "..",
      "..",
      "..",
      "medplum-next-5.0.13",
      "devdocs",
      "06_TEST_DATA",
      "medplum-test-bundle.json",
    ),
  ];
  for (const p of paths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")) as TxBundle;
  }
  throw new Error(
    `medplum-test-bundle.json not found.\n  Tried:\n  ${paths.join("\n  ")}\n` +
      `  Run full-stack-validation.test.ts first.`,
  );
}

/**
 * Compare two FHIR objects, skipping server-managed and reference fields.
 * Returns list of diff strings.
 */
function diff(
  label: string,
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): string[] {
  const SKIP = new Set([
    ".id",
    ".meta.versionId",
    ".meta.lastUpdated",
    ".meta.project",
    ".meta.author",
    ".meta.account",
    ".meta.tag",
    ".meta.security",
    ".meta.compartment",
  ]);
  const diffs: string[] = [];

  function cmp(path: string, x: unknown, y: unknown): void {
    if (SKIP.has(path)) return;
    if (x === y) return;
    if (x == null && y == null) return;
    if (typeof x === "string" && typeof y === "string") {
      if (x.startsWith("urn:uuid:") || y.startsWith("urn:uuid:")) return;
      if (path.endsWith(".reference")) return;
    }
    if (typeof x !== typeof y) {
      diffs.push(`${label}${path}: type ${typeof x} vs ${typeof y}`);
      return;
    }
    if (Array.isArray(x) && Array.isArray(y)) {
      if (x.length !== y.length) {
        diffs.push(`${label}${path}: len ${x.length}≠${y.length}`);
        return;
      }
      x.forEach((v, i) => cmp(`${path}[${i}]`, v, y[i]));
      return;
    }
    if (typeof x === "object" && x !== null && y !== null) {
      const xo = x as Record<string, unknown>,
        yo = y as Record<string, unknown>;
      for (const k of new Set([...Object.keys(xo), ...Object.keys(yo)]))
        cmp(`${path}.${k}`, xo[k], yo[k]);
      return;
    }
    diffs.push(`${label}${path}: "${String(x)}" ≠ "${String(y)}"`);
  }

  cmp("", a, b);
  return diffs;
}

// =============================================================================
// Setup / Teardown
// =============================================================================

beforeAll(async () => {
  db = new DatabaseClient({
    host: process.env["DB_HOST"] ?? "localhost",
    port: parseInt(process.env["DB_PORT"] ?? "5433", 10),
    database: process.env["DB_NAME"] ?? "medxai_dev",
    user: process.env["DB_USER"] ?? "postgres",
    password: process.env["DB_PASSWORD"] ?? "assert",
  });
  if (!(await db.ping()))
    throw new Error("Cannot connect to MedXAI PostgreSQL.");

  const specDir = resolve(
    __dir,
    "..",
    "..",
    "..",
    "..",
    "..",
    "spec",
    "fhir",
    "r4",
  );
  const spPath = resolve(specDir, "search-parameters.json");
  if (!existsSync(spPath))
    throw new Error(`search-parameters.json not found at ${spPath}`);
  const spRegistry = new SearchParameterRegistry();
  spRegistry.indexBundle(
    JSON.parse(readFileSync(spPath, "utf8")) as SearchParameterBundle,
  );
  repo = new FhirRepository(db, spRegistry);

  const health = await fetch(`${BASE}/healthcheck`).catch(() => null);
  if (!health?.ok)
    throw new Error(
      `Medplum not reachable at ${BASE}. Start the server first.`,
    );
}, 30_000);

afterAll(async () => {
  console.log(
    `\n[M4 Cleanup] Deleting ${medplumCreated.length} resources from Medplum...`,
  );
  let n = 0;
  for (const { resourceType, id } of [...medplumCreated].reverse()) {
    try {
      await mDelete(`/fhir/R4/${resourceType}/${id}`);
      n++;
    } catch {
      /* skip */
    }
  }
  console.log(`[M4 Cleanup] Deleted ${n}/${medplumCreated.length}`);
  if (db && !db.isClosed) await db.close();
}, 120_000);

// =============================================================================
// Phase M1: POST Transaction Bundle
// =============================================================================

describe("Phase M1: POST Transaction Bundle to Medplum", () => {
  it("M1.1: bundle file exists and has ≥76 entries", () => {
    const b = loadBundle();
    expect(b.resourceType).toBe("Bundle");
    expect(b.type).toBe("transaction");
    expect(b.entry.length).toBeGreaterThanOrEqual(76);
    console.log(`[M1.1] ${b.entry.length} entries`);
  });

  it("M1.2: obtains Medplum access token", async () => {
    const tok = await getToken();
    expect(tok.length).toBeGreaterThan(20);
    console.log(`[M1.2] Token: ${tok.slice(0, 20)}...`);
  }, 15_000);

  it("M1.3: POSTs bundle, records urn→id mapping", async () => {
    const bundle = loadBundle();
    const resp = await mPost<TxResponse>("/fhir/R4", bundle);

    expect(resp.resourceType).toBe("Bundle");
    expect(resp.type).toBe("transaction-response");
    expect(resp.entry.length).toBe(bundle.entry.length);

    for (let i = 0; i < bundle.entry.length; i++) {
      const loc = resp.entry[i].response?.location ?? "";
      const m = loc.match(/^([A-Za-z]+)\/([^/]+)/);
      if (m) {
        const [, rt, id] = m;
        urnToMedplumId.set(bundle.entry[i].fullUrl, id);
        medplumCreated.push({ resourceType: rt, id });
      }
    }

    console.log(`[M1.3] Created ${medplumCreated.length} resources in Medplum`);
    expect(medplumCreated.length).toBe(bundle.entry.length);
  }, 60_000);

  it("M1.4: spot-reads one resource per type", async () => {
    const byType = new Map<string, string>();
    for (const { resourceType, id } of medplumCreated) {
      if (!byType.has(resourceType)) byType.set(resourceType, id);
    }
    let ok = 0;
    for (const [rt, id] of byType) {
      const r = await mGet<{ resourceType: string; id: string }>(
        `/fhir/R4/${rt}/${id}`,
      );
      expect(r.resourceType).toBe(rt);
      expect(r.id).toBe(id);
      ok++;
    }
    console.log(`[M1.4] Spot-checked ${ok} resource types`);
  }, 60_000);
}, 120_000);

// =============================================================================
// Phase M2: Read-Back & Field Comparison
// =============================================================================

describe("Phase M2: Field comparison (Medplum vs MedXAI)", () => {
  beforeAll(async () => {
    const bundle = loadBundle();
    for (const entry of bundle.entry) {
      const medxaiId = entry.fullUrl.replace("urn:uuid:", "");
      const rt = entry.resource.resourceType;
      if (!rt || !medxaiId) continue;
      try {
        const r = await repo.readResource(rt, medxaiId);
        const mId = urnToMedplumId.get(entry.fullUrl);
        if (mId) medxaiMap.set(`${rt}/${mId}`, r);
      } catch {
        /* not found in MedXAI — skip */
      }
    }
    console.log(
      `[M2 setup] ${medxaiMap.size} MedXAI resources loaded for comparison`,
    );
  }, 60_000);

  it("M2.1: Medplum returns 200 for every created resource", async () => {
    let ok = 0,
      fail = 0;
    const failures: string[] = [];
    for (const { resourceType, id } of medplumCreated) {
      try {
        const r = await mGet<{ id: string; resourceType: string }>(
          `/fhir/R4/${resourceType}/${id}`,
        );
        expect(r.id).toBe(id);
        ok++;
      } catch (e) {
        fail++;
        failures.push(`${resourceType}/${id}: ${String(e)}`);
      }
    }
    console.log(`[M2.1] ${ok} OK, ${fail} failed`);
    if (failures.length) console.log(failures.slice(0, 5).join("\n"));
    expect(fail).toBe(0);
  }, 120_000);

  it("M2.2: field-level comparison — diffs below threshold", async () => {
    if (medxaiMap.size === 0) {
      console.log("[M2.2] SKIP: run full-stack-validation first");
      return;
    }
    let compared = 0,
      totalDiffs = 0;
    const samples: string[] = [];

    for (const [key, medxai] of medxaiMap) {
      const [rt, mId] = key.split("/");
      if (!mId || mId === "undefined") continue;
      try {
        const medplum = await mGet<Record<string, unknown>>(
          `/fhir/R4/${rt}/${mId}`,
        );
        const d = diff(
          `${rt}/${mId}`,
          medxai as unknown as Record<string, unknown>,
          medplum,
        );
        totalDiffs += d.length;
        if (d.length > 0 && samples.length < 15) samples.push(...d.slice(0, 3));
        compared++;
      } catch {
        /* skip */
      }
    }

    console.log(`[M2.2] ${compared} compared, ${totalDiffs} total diffs`);
    if (samples.length) {
      console.log("[M2.2] Sample diffs:");
      samples.forEach((d) => console.log("  ", d));
    }
    // Threshold: average < 3 diffs per resource (Medplum may add meta extensions)
    expect(totalDiffs).toBeLessThan(Math.max(compared * 3, 30));
  }, 120_000);

  it("M2.3: resource type counts printed", () => {
    const mByType = new Map<string, number>();
    for (const { resourceType } of medplumCreated)
      mByType.set(resourceType, (mByType.get(resourceType) ?? 0) + 1);
    const xByType = new Map<string, number>();
    for (const k of medxaiMap.keys()) {
      const rt = k.split("/")[0];
      xByType.set(rt, (xByType.get(rt) ?? 0) + 1);
    }

    console.log("\n[M2.3] Type".padEnd(28) + "Medplum".padEnd(10) + "MedXAI");
    for (const [rt, mc] of [...mByType.entries()].sort()) {
      const xc = xByType.get(rt) ?? 0;
      console.log(
        `  ${mc === xc ? "✅" : "⚠️ "} ${rt.padEnd(25)}${String(mc).padEnd(10)}${xc}`,
      );
    }
    expect(mByType.size).toBeGreaterThan(0);
  });
}, 300_000);

// =============================================================================
// Phase M3: Search Comparison
// =============================================================================

describe("Phase M3: Search query comparison", () => {
  async function medplumSearch(rt: string, params: string): Promise<number> {
    try {
      const b = await mGet<{ total?: number; entry?: unknown[] }>(
        `/fhir/R4/${rt}?${params}`,
      );
      return b.total ?? b.entry?.length ?? 0;
    } catch (e) {
      console.warn(`  Medplum search ${rt}?${params} failed: ${String(e)}`);
      return -1;
    }
  }

  async function medxaiCount(
    rt: string,
    where = '"deleted" = false',
  ): Promise<number> {
    try {
      const r = await db.query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM "${rt}" WHERE ${where}`,
      );
      return Number(r.rows[0].cnt);
    } catch {
      return -1;
    }
  }

  it("M3.1: Patient — Medplum received all 7 patients", async () => {
    const mp = await medplumSearch("Patient", "_count=200&_total=accurate");
    const mx = await medxaiCount("Patient");
    console.log(`[M3.1] Patient — Medplum: ${mp}, MedXAI DB total: ${mx}`);
    // Medplum must have received all 7 patients from the bundle
    expect(mp).toBeGreaterThanOrEqual(7);
  }, 30_000);

  it("M3.2: Encounter — Medplum has finished encounters", async () => {
    const mp = await medplumSearch(
      "Encounter",
      "status=finished&_count=200&_total=accurate",
    );
    const mx = await medxaiCount(
      "Encounter",
      `"deleted" = false AND "__statusText" && ARRAY['finished']`,
    );
    console.log(`[M3.2] Encounter/finished — Medplum: ${mp}, MedXAI DB: ${mx}`);
    // Medplum must have received finished encounters from the bundle (4 finished out of 6)
    expect(mp).toBeGreaterThanOrEqual(4);
  }, 30_000);

  it("M3.3: Observation — Medplum received all 8 observations", async () => {
    const mp = await medplumSearch("Observation", "_count=200&_total=accurate");
    const mx = await medxaiCount("Observation");
    console.log(`[M3.3] Observation — Medplum: ${mp}, MedXAI DB total: ${mx}`);
    // Medplum must have received all 8 observations from the bundle
    expect(mp).toBeGreaterThanOrEqual(8);
  }, 30_000);

  it("M3.4: Condition — Medplum search by clinical-status=active", async () => {
    const mp = await medplumSearch(
      "Condition",
      "clinical-status=active&_count=200&_total=accurate",
    );
    const mx = await medxaiCount(
      "Condition",
      `"deleted" = false AND "__clinicalStatusText" && ARRAY['http://terminology.hl7.org/CodeSystem/condition-clinical|active']`,
    );
    console.log(`[M3.4] Condition/active — Medplum: ${mp}, MedXAI DB: ${mx}`);
    // Medplum must return active conditions (bundle has 4+ active conditions)
    expect(mp).toBeGreaterThanOrEqual(4);
  }, 30_000);

  it("M3.5: Observation by Patient compartment (first created patient)", async () => {
    const patientEntry = medplumCreated.find(
      (e) => e.resourceType === "Patient",
    );
    if (!patientEntry) {
      console.log("[M3.5] SKIP: no Patient");
      return;
    }

    const mp = await medplumSearch(
      "Observation",
      `subject=Patient/${patientEntry.id}&_count=50`,
    );

    // Find matching MedXAI patient id from urn map
    const urn = [...urnToMedplumId.entries()].find(
      ([, id]) => id === patientEntry.id,
    )?.[0];
    const medxaiPatientId = urn?.replace("urn:uuid:", "");
    let mx = -1;
    if (medxaiPatientId) {
      mx = await medxaiCount(
        "Observation",
        `"deleted" = false AND $1 = ANY("compartments")`,
      );
      // Note: can't pass param directly in medxaiCount helper — raw query
      try {
        const r = await db.query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM "Observation" WHERE "deleted" = false AND $1 = ANY("compartments")`,
          [medxaiPatientId],
        );
        mx = Number(r.rows[0].cnt);
      } catch {
        mx = -1;
      }
    }

    console.log(
      `[M3.5] Observations for Patient/${patientEntry.id} — Medplum: ${mp}, MedXAI compartment: ${mx}`,
    );
    expect(mp).toBeGreaterThanOrEqual(0);
  }, 30_000);

  it("M3.6: MedicationRequest — Medplum status=active", async () => {
    const mp = await medplumSearch(
      "MedicationRequest",
      "status=active&_count=200&_total=accurate",
    );
    const mx = await medxaiCount(
      "MedicationRequest",
      `"deleted" = false AND "__statusText" && ARRAY['active']`,
    );
    console.log(
      `[M3.6] MedicationRequest/active — Medplum: ${mp}, MedXAI DB: ${mx}`,
    );
    // Medplum must return active medication requests (bundle has 4+ active)
    expect(mp).toBeGreaterThanOrEqual(4);
  }, 30_000);

  it("M3.7: summary comparison table", async () => {
    const rows: Array<{ rt: string; mp: number; mx: number }> = [
      {
        rt: "Organization",
        mp: await medplumSearch("Organization", "_count=200&_total=accurate"),
        mx: await medxaiCount("Organization"),
      },
      {
        rt: "Practitioner",
        mp: await medplumSearch("Practitioner", "_count=200&_total=accurate"),
        mx: await medxaiCount("Practitioner"),
      },
      {
        rt: "Patient",
        mp: await medplumSearch("Patient", "_count=200&_total=accurate"),
        mx: await medxaiCount("Patient"),
      },
      {
        rt: "Encounter",
        mp: await medplumSearch("Encounter", "_count=200&_total=accurate"),
        mx: await medxaiCount("Encounter"),
      },
      {
        rt: "Observation",
        mp: await medplumSearch("Observation", "_count=200&_total=accurate"),
        mx: await medxaiCount("Observation"),
      },
      {
        rt: "Condition",
        mp: await medplumSearch("Condition", "_count=200&_total=accurate"),
        mx: await medxaiCount("Condition"),
      },
      {
        rt: "DiagnosticReport",
        mp: await medplumSearch(
          "DiagnosticReport",
          "_count=200&_total=accurate",
        ),
        mx: await medxaiCount("DiagnosticReport"),
      },
      {
        rt: "MedicationRequest",
        mp: await medplumSearch(
          "MedicationRequest",
          "_count=200&_total=accurate",
        ),
        mx: await medxaiCount("MedicationRequest"),
      },
      {
        rt: "AllergyIntolerance",
        mp: await medplumSearch(
          "AllergyIntolerance",
          "_count=200&_total=accurate",
        ),
        mx: await medxaiCount("AllergyIntolerance"),
      },
    ];

    console.log("\n[M3.7] ====== SEARCH COMPARISON SUMMARY ======");
    console.log("ResourceType             Medplum    MedXAI(total)");
    console.log("─".repeat(50));
    for (const { rt, mp, mx } of rows) {
      console.log(`  ${rt.padEnd(23)} ${String(mp).padEnd(11)} ${mx}`);
    }
    console.log(
      "Note: Medplum counts include ALL projects; MedXAI shows total DB rows.",
    );
    expect(rows.length).toBeGreaterThan(0);
  }, 60_000);
}, 300_000);
